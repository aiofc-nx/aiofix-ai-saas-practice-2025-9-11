import { IQueryBus, IQueryHandler, BaseQuery } from '../../application/queries';
import { ResultType } from '../../shared/types/common';

/**
 * 查询总线实现
 *
 * 查询总线是CQRS模式的核心组件，负责将查询路由到相应的处理器。
 * 支持查询的注册、分发、缓存和结果处理等企业级功能。
 *
 * @description 查询总线的具体实现，提供查询的注册、分发和处理功能
 *
 * ## 业务规则
 *
 * ### 查询注册规则
 * - 每个查询处理器必须注册到查询总线
 * - 一个查询类型只能有一个处理器
 * - 处理器必须实现IQueryHandler接口
 * - 注册时验证处理器类型和查询类型
 *
 * ### 查询分发规则
 * - 查询按类型路由到对应的处理器
 * - 支持异步查询处理
 * - 查询处理失败时返回错误结果
 * - 支持查询处理的超时控制
 *
 * ### 缓存规则
 * - 支持查询结果缓存
 * - 缓存键基于查询参数生成
 * - 支持缓存过期时间设置
 * - 支持缓存失效策略
 *
 * ## 业务逻辑流程
 *
 * 1. **查询注册**：注册查询处理器到查询总线
 * 2. **查询接收**：接收来自应用层的查询
 * 3. **缓存检查**：检查查询结果是否已缓存
 * 4. **查询分发**：将查询路由到对应的处理器
 * 5. **异步处理**：异步执行查询处理逻辑
 * 6. **结果缓存**：缓存查询结果（如果启用）
 * 7. **结果返回**：返回处理结果给调用者
 *
 * @example
 * ```typescript
 * // 注册查询处理器
 * const queryBus = new QueryBus();
 * queryBus.register(new GetUserByIdQueryHandler());
 *
 * // 执行查询
 * const query = new GetUserByIdQuery(userId);
 * const result = await queryBus.execute(query);
 *
 * // 批量执行查询
 * const queries = [query1, query2, query3];
 * const results = await queryBus.executeBatch(queries);
 * ```
 */
export class QueryBus implements IQueryBus {
  private readonly handlers = new Map<string, IQueryHandler<BaseQuery, any>>();
  private readonly cache = new Map<
    string,
    { result: any; timestamp: number; ttl: number }
  >();
  private readonly processingStats = new Map<
    string,
    {
      successCount: number;
      failureCount: number;
      totalTime: number;
      cacheHitCount: number;
    }
  >();

  /**
   * 注册查询处理器
   *
   * @description 将查询处理器注册到查询总线
   * @param handler 查询处理器实例
   *
   * @example
   * ```typescript
   * const queryBus = new QueryBus();
   * const handler = new GetUserByIdQueryHandler();
   * queryBus.register(handler);
   * ```
   */
  public register<TQuery extends BaseQuery, TResult>(
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    const queryType = this.getQueryType(handler);

    if (this.handlers.has(queryType)) {
      throw new Error(
        `Handler for query type ${queryType} is already registered`
      );
    }

    this.handlers.set(queryType, handler as IQueryHandler<BaseQuery, any>);
  }

  /**
   * 注销查询处理器
   *
   * @description 从查询总线中注销指定的查询处理器
   * @param handler 要注销的查询处理器实例
   *
   * @example
   * ```typescript
   * const queryBus = new QueryBus();
   * queryBus.unregister(handler);
   * ```
   */
  public unregister<TQuery extends BaseQuery, TResult>(
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    const queryType = this.getQueryType(handler);
    this.handlers.delete(queryType);
  }

  /**
   * 执行单个查询
   *
   * @description 执行单个查询并返回处理结果
   * @param query 要执行的查询
   * @param options 执行选项
   * @returns Promise<ResultType<TResult>> 查询执行结果
   *
   * @example
   * ```typescript
   * const query = new GetUserByIdQuery(userId);
   * const result = await queryBus.execute(query, {
   *   cache: true,
   *   timeout: 5000
   * });
   *
   * if (result.isSuccess) {
   *   console.log('查询成功:', result.value);
   * } else {
   *   console.error('查询失败:', result.error);
   * }
   * ```
   */
  public async execute<TResult>(
    query: BaseQuery,
    options?: {
      cache?: boolean;
      timeout?: number;
    }
  ): Promise<ResultType<TResult>> {
    const queryType = query.constructor.name;
    const handler = this.handlers.get(queryType);

    if (!handler) {
      return ResultType.failure(
        new Error(`No handler registered for query type: ${queryType}`)
      );
    }

    const { cache: useCache = false, timeout = 30000 } = options || {};

    try {
      // 检查缓存
      if (useCache) {
        const cacheKey = this.generateCacheKey(query);
        const cachedResult = this.getFromCache<TResult>(cacheKey);

        if (cachedResult) {
          this.updateStats(queryType, true, 0, true);
          return cachedResult;
        }
      }

      // 验证查询
      const validationResult = await this.validateQuery(query);
      if (!validationResult.isValid) {
        return ResultType.failure(
          new Error(
            `Query validation failed: ${validationResult.errors.join(', ')}`
          )
        );
      }

      // 执行查询
      const startTime = Date.now();
      const result = await this.executeWithTimeout(
        handler.handle(query),
        timeout
      );
      const processingTime = Date.now() - startTime;

      // 更新统计信息
      this.updateStats(queryType, result.isSuccess, processingTime, false);

      // 缓存结果
      if (useCache && result.isSuccess) {
        const cacheKey = this.generateCacheKey(query);
        this.setCache(cacheKey, result, 300000); // 5分钟缓存
      }

      return result;
    } catch (error) {
      // 更新失败统计
      this.updateStats(queryType, false, 0, false);

      console.error(`Query execution failed for ${queryType}:`, error);
      return ResultType.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 批量执行查询
   *
   * @description 批量执行多个查询
   * @param queries 要执行的查询数组
   * @param options 执行选项
   * @returns Promise<ResultType<TResult>[]> 查询执行结果数组
   *
   * @example
   * ```typescript
   * const queries = [query1, query2, query3];
   * const results = await queryBus.executeBatch(queries, {
   *   parallel: true,
   *   cache: true,
   *   timeout: 5000
   * });
   * ```
   */
  public async executeBatch<TResult>(
    queries: BaseQuery[],
    options?: {
      parallel?: boolean;
      cache?: boolean;
      timeout?: number;
    }
  ): Promise<ResultType<TResult>[]> {
    const { parallel = false, cache = false, timeout = 30000 } = options || {};

    if (parallel) {
      // 并行执行
      const promises = queries.map((query) =>
        this.execute<TResult>(query, { cache, timeout })
      );
      return Promise.all(promises);
    } else {
      // 串行执行
      const results: ResultType<TResult>[] = [];
      for (const query of queries) {
        const result = await this.execute<TResult>(query, { cache, timeout });
        results.push(result);
      }
      return results;
    }
  }

  /**
   * 检查查询处理器是否已注册
   *
   * @description 检查指定查询类型的处理器是否已经在查询总线中注册
   * @param queryType 查询类型
   * @returns 是否已注册
   *
   * @example
   * ```typescript
   * const isRegistered = queryBus.isRegistered('GetUserByIdQuery');
   * if (!isRegistered) {
   *   console.warn('GetUserByIdQuery 处理器未注册');
   * }
   * ```
   */
  public isRegistered(queryType: string): boolean {
    return this.handlers.has(queryType);
  }

  /**
   * 获取查询处理统计信息
   *
   * @description 获取查询处理的统计信息
   * @returns 查询处理统计信息
   *
   * @example
   * ```typescript
   * const stats = queryBus.getProcessingStats();
   * console.log('查询处理统计:', stats);
   * ```
   */
  public getProcessingStats(): Record<
    string,
    {
      successCount: number;
      failureCount: number;
      totalTime: number;
      cacheHitCount: number;
      averageTime: number;
      successRate: number;
      cacheHitRate: number;
    }
  > {
    const result: Record<string, any> = {};

    for (const [queryType, stats] of this.processingStats.entries()) {
      const total = stats.successCount + stats.failureCount;
      const totalRequests = total + stats.cacheHitCount;

      result[queryType] = {
        successCount: stats.successCount,
        failureCount: stats.failureCount,
        totalTime: stats.totalTime,
        cacheHitCount: stats.cacheHitCount,
        averageTime: total > 0 ? stats.totalTime / total : 0,
        successRate: total > 0 ? stats.successCount / total : 0,
        cacheHitRate:
          totalRequests > 0 ? stats.cacheHitCount / totalRequests : 0,
      };
    }

    return result;
  }

  /**
   * 清除统计信息
   *
   * @description 清除所有查询处理的统计信息
   *
   * @example
   * ```typescript
   * queryBus.clearStats();
   * ```
   */
  public clearStats(): void {
    this.processingStats.clear();
  }

  /**
   * 清除缓存
   *
   * @description 清除所有缓存的查询结果
   *
   * @example
   * ```typescript
   * queryBus.clearCache();
   * ```
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取注册的查询类型
   *
   * @description 获取所有已注册处理器的查询类型列表
   * @returns 查询类型列表
   *
   * @example
   * ```typescript
   * const queryTypes = queryBus.getRegisteredQueryTypes();
   * console.log('已注册的查询类型:', queryTypes);
   * ```
   */
  public getRegisteredQueryTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 生成缓存键
   *
   * @description 基于查询参数生成缓存键
   * @param query 查询对象
   * @returns 缓存键
   * @private
   */
  private generateCacheKey(query: BaseQuery): string {
    const queryType = query.constructor.name;
    const queryParams = JSON.stringify(query);
    return `${queryType}:${Buffer.from(queryParams).toString('base64')}`;
  }

  /**
   * 从缓存获取结果
   *
   * @description 从缓存中获取查询结果
   * @param cacheKey 缓存键
   * @returns 缓存的结果或null
   * @private
   */
  private getFromCache<TResult>(cacheKey: string): ResultType<TResult> | null {
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * 设置缓存
   *
   * @description 将查询结果设置到缓存
   * @param cacheKey 缓存键
   * @param result 查询结果
   * @param ttl 生存时间（毫秒）
   * @private
   */
  private setCache<TResult>(
    cacheKey: string,
    result: ResultType<TResult>,
    ttl: number
  ): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 带超时的查询执行
   *
   * @description 执行查询并设置超时时间
   * @param promise 查询执行的Promise
   * @param timeout 超时时间（毫秒）
   * @returns Promise<ResultType<TResult>> 查询结果
   * @private
   */
  private async executeWithTimeout<TResult>(
    promise: Promise<ResultType<TResult>>,
    timeout: number
  ): Promise<ResultType<TResult>> {
    return Promise.race([
      promise,
      new Promise<ResultType<TResult>>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Query execution timeout after ${timeout}ms`)),
          timeout
        );
      }),
    ]);
  }

  /**
   * 验证查询
   *
   * @description 验证查询参数和业务规则
   * @param query 要验证的查询
   * @returns 验证结果
   * @private
   */
  private async validateQuery(query: BaseQuery): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 基础验证
    if (!query) {
      errors.push('Query is null or undefined');
      return { isValid: false, errors };
    }

    // 这里可以添加更多的验证逻辑
    // 例如：参数验证、业务规则验证等

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 更新处理统计信息
   *
   * @description 更新查询处理的统计信息
   * @param queryType 查询类型
   * @param success 是否成功
   * @param processingTime 处理时间
   * @param cacheHit 是否缓存命中
   * @private
   */
  private updateStats(
    queryType: string,
    success: boolean,
    processingTime: number,
    cacheHit: boolean
  ): void {
    if (!this.processingStats.has(queryType)) {
      this.processingStats.set(queryType, {
        successCount: 0,
        failureCount: 0,
        totalTime: 0,
        cacheHitCount: 0,
      });
    }

    const stats = this.processingStats.get(queryType)!;

    if (cacheHit) {
      stats.cacheHitCount++;
    } else if (success) {
      stats.successCount++;
      stats.totalTime += processingTime;
    } else {
      stats.failureCount++;
      stats.totalTime += processingTime;
    }
  }

  /**
   * 获取查询类型
   *
   * @description 从处理器中获取支持的查询类型
   * @param handler 查询处理器
   * @returns 查询类型
   * @private
   */
  private getQueryType<TQuery extends BaseQuery, TResult>(
    handler: IQueryHandler<TQuery, TResult>
  ): string {
    // 这里需要从处理器中获取支持的查询类型
    // 可以通过反射或配置来获取
    const handlerName = handler.constructor.name;

    // 简单的命名约定：GetUserByIdQueryHandler -> GetUserByIdQuery
    if (handlerName.endsWith('QueryHandler')) {
      return handlerName.replace('QueryHandler', 'Query');
    }

    // 如果无法推断，返回处理器名称
    return handlerName;
  }
}
