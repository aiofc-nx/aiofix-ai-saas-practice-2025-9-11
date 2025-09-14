import { BaseQuery } from './base.query';
import { ResultType } from '../../shared/types/common';

/**
 * 查询总线接口
 *
 * 查询总线是CQRS模式中的核心组件，负责将查询路由到相应的处理器。
 * 查询总线提供了查询的注册、分发和执行机制，确保查询的正确处理。
 *
 * @description 定义查询总线的标准接口，所有查询总线实现都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 查询注册规则
 * - 每个查询类型只能注册一个处理器
 * - 处理器注册时必须验证查询类型匹配
 * - 支持处理器的动态注册和注销
 * - 重复注册相同查询类型会覆盖之前的处理器
 *
 * ### 查询分发规则
 * - 查询必须路由到正确的处理器
 * - 未注册的查询类型返回QueryHandlerNotFoundError
 * - 支持查询的异步执行和超时控制
 * - 支持查询的批量执行和并行执行
 *
 * ### 权限验证规则
 * - 查询执行前必须验证用户权限
 * - 支持查询级别的权限控制
 * - 权限验证失败返回AccessDeniedError
 * - 支持权限的缓存和优化
 *
 * ### 数据安全规则
 * - 查询结果必须符合用户权限范围
 * - 支持多租户数据隔离
 * - 支持组织级别和部门级别的数据访问控制
 * - 敏感数据访问需要额外验证
 *
 * ### 性能优化规则
 * - 支持查询结果的缓存机制
 * - 支持查询的批量执行优化
 * - 支持查询条件的索引优化
 * - 支持查询执行的监控和指标收集
 *
 * ### 异常处理规则
 * - 捕获并处理所有查询执行异常
 * - 业务异常转换为Result类型返回
 * - 系统异常记录详细日志
 * - 支持异常的重试和恢复机制
 *
 * ## 业务逻辑流程
 *
 * 1. **查询接收**：接收来自客户端的查询
 * 2. **权限验证**：验证用户对查询数据的访问权限
 * 3. **处理器查找**：根据查询类型查找相应的处理器
 * 4. **查询执行**：调用处理器执行查询
 * 5. **结果过滤**：根据用户权限过滤查询结果
 * 6. **数据脱敏**：对敏感数据进行脱敏处理
 * 7. **结果返回**：返回查询执行结果
 * 8. **审计记录**：记录查询操作的审计日志
 *
 * @example
 * ```typescript
 * class QueryBus implements IQueryBus {
 *   private handlers = new Map<string, IQueryHandler<any, any>>();
 *
 *   register<TQuery extends BaseQuery, TResult>(
 *     queryType: new (...args: any[]) => TQuery,
 *     handler: IQueryHandler<TQuery, TResult>
 *   ): void {
 *     this.handlers.set(queryType.name, handler);
 *   }
 *
 *   async execute<TQuery extends BaseQuery, TResult>(
 *     query: TQuery
 *   ): Promise<Result<TResult>> {
 *     const handler = this.handlers.get(query.constructor.name);
 *     if (!handler) {
 *       return Result.failure(new QueryHandlerNotFoundError(query.constructor.name));
 *     }
 *
 *     return await handler.handle(query);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface IQueryBus {
  /**
   * 注册查询处理器
   *
   * @description 将查询处理器注册到查询总线中，建立查询类型与处理器的映射关系
   *
   * ## 业务规则
   *
   * ### 注册验证规则
   * - 验证查询类型和处理器的匹配性
   * - 检查查询类型是否已经注册过
   * - 支持处理器的覆盖注册
   * - 注册失败时抛出相应异常
   *
   * ### 类型安全规则
   * - 确保查询类型和处理器的类型匹配
   * - 支持泛型类型的安全检查
   * - 防止类型不匹配的注册
   * - 提供编译时类型检查
   *
   * @template TQuery 查询类型
   * @template TResult 查询结果类型
   *
   * @param queryType - 查询类型的构造函数
   * @param handler - 查询处理器实例
   *
   * @throws {Error} 当注册失败时抛出
   *
   * @example
   * ```typescript
   * // 注册获取用户查询处理器
   * queryBus.register(GetUserByIdQuery, getUserByIdQueryHandler);
   *
   * // 注册获取用户列表查询处理器
   * queryBus.register(GetUserListQuery, getUserListQueryHandler);
   * ```
   */
  register<TQuery extends BaseQuery, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: IQueryHandler<TQuery, TResult>
  ): void;

  /**
   * 执行查询
   *
   * @description 执行指定的查询，包括权限验证、处理器查找、查询执行等
   *
   * ## 业务规则
   *
   * ### 权限验证规则
   * - 验证用户对查询数据的访问权限
   * - 检查用户对相关资源的读取权限
   * - 支持查询级别的权限控制
   * - 权限验证失败返回AccessDeniedError
   *
   * ### 处理器查找规则
   * - 根据查询类型查找相应的处理器
   * - 未找到处理器返回QueryHandlerNotFoundError
   * - 支持处理器的动态查找和缓存
   * - 查找失败时记录详细日志
   *
   * ### 数据安全规则
   * - 查询结果必须符合用户权限范围
   * - 支持多租户数据隔离
   * - 支持组织级别和部门级别的数据访问控制
   * - 敏感数据访问需要额外验证
   *
   * ### 性能优化规则
   * - 支持查询结果的缓存机制
   * - 支持查询条件的索引优化
   * - 支持分页查询控制结果集大小
   * - 支持查询执行的监控和指标收集
   *
   * ### 异常处理规则
   * - 捕获并处理所有查询执行异常
   * - 业务异常转换为Result类型返回
   * - 系统异常记录详细日志
   * - 支持异常的重试和恢复机制
   *
   * ### 监控和审计规则
   * - 记录查询执行的开始和结束时间
   * - 记录查询执行的用户和上下文
   * - 记录查询执行的成功和失败状态
   * - 支持查询执行的性能指标收集
   *
   * @template TQuery 查询类型
   * @template TResult 查询结果类型
   *
   * @param query - 要执行的查询
   * @returns 查询执行结果，成功时包含查询结果，失败时包含错误信息
   *
   * @example
   * ```typescript
   * // 执行获取用户查询
   * const query = new GetUserByIdQuery(userId);
   * const result = await queryBus.execute(query);
   *
   * if (result.isSuccess()) {
   *   const user = result.getValue();
   *   console.log('查询成功:', user.getName());
   * } else {
   *   const error = result.getError();
   *   console.error('查询失败:', error.message);
   * }
   * ```
   */
  execute<TQuery extends BaseQuery, TResult>(
    query: TQuery
  ): Promise<ResultType<TResult>>;

  /**
   * 批量执行查询
   *
   * @description 批量执行多个查询，支持并行执行和性能优化
   *
   * ## 业务规则
   *
   * ### 批量执行规则
   * - 支持查询的并行执行和串行执行
   * - 支持批量执行的性能优化
   * - 支持批量执行的错误处理
   * - 支持批量执行的缓存优化
   *
   * ### 性能优化规则
   * - 支持查询结果的批量缓存
   * - 支持查询条件的批量优化
   * - 支持查询执行的负载均衡
   * - 支持查询执行的监控和指标收集
   *
   * ### 错误处理规则
   * - 单个查询失败不影响其他查询执行
   * - 支持批量查询的错误收集和报告
   * - 支持批量查询的部分成功处理
   * - 记录批量查询的详细日志
   *
   * @template TQuery 查询类型
   * @template TResult 查询结果类型
   *
   * @param queries - 要执行的查询数组
   * @param options - 批量执行选项，包括并行执行、缓存策略等
   * @returns 批量执行结果，包含每个查询的执行结果
   *
   * @example
   * ```typescript
   * // 批量执行查询
   * const queries = [
   *   new GetUserByIdQuery(userId1),
   *   new GetUserByIdQuery(userId2)
   * ];
   *
   * const results = await queryBus.executeBatch(queries, {
   *   parallel: true,
   *   cache: true
   * });
   *
   * results.forEach((result, index) => {
   *   if (result.isSuccess()) {
   *     console.log(`查询${index}执行成功`);
   *   } else {
   *     console.error(`查询${index}执行失败:`, result.getError());
   *   }
   * });
   * ```
   */
  executeBatch<TQuery extends BaseQuery, TResult>(
    queries: TQuery[],
    options?: {
      parallel?: boolean;
      cache?: boolean;
      timeout?: number;
    }
  ): Promise<ResultType<TResult>[]>;

  /**
   * 检查查询处理器是否已注册
   *
   * @description 检查指定查询类型的处理器是否已经在查询总线中注册
   * @param queryType - 查询类型的构造函数
   * @returns 如果已注册则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isRegistered = queryBus.isRegistered(GetUserByIdQuery);
   * if (!isRegistered) {
   *   queryBus.register(GetUserByIdQuery, getUserByIdQueryHandler);
   * }
   * ```
   */
  isRegistered(queryType: new (...args: any[]) => BaseQuery): boolean;

  /**
   * 获取已注册的查询类型
   *
   * @description 返回所有已注册的查询类型
   * @returns 已注册的查询类型数组
   *
   * @example
   * ```typescript
   * const registeredTypes = queryBus.getRegisteredTypes();
   * console.log('已注册的查询类型:', registeredTypes.map(type => type.name));
   * ```
   */
  getRegisteredTypes(): (new (...args: any[]) => BaseQuery)[];

  /**
   * 清除查询缓存
   *
   * @description 清除指定查询的缓存结果
   * @param queryType - 查询类型的构造函数
   * @param cacheKey - 缓存键，可选
   *
   * @example
   * ```typescript
   * // 清除特定查询的缓存
   * queryBus.clearCache(GetUserByIdQuery, userId.toString());
   *
   * // 清除所有查询的缓存
   * queryBus.clearCache();
   * ```
   */
  clearCache(
    queryType?: new (...args: any[]) => BaseQuery,
    cacheKey?: string
  ): void;
}

// 导入查询处理器接口
import { IQueryHandler } from './query-handler.interface';
