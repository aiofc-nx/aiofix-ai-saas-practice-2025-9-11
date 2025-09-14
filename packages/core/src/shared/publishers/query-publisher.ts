import { Injectable } from '@nestjs/common';
import type { AsyncContext } from '../context';
import { PinoLoggerService, LogContext } from '@aiofix/logging';
import { BasePublisher } from './base-publisher';
import type { IQueryPublisher, IPublisherConfig } from './publisher.types';

/**
 * 查询发布者
 *
 * 专门用于发布查询的发布者实现。
 * 继承自BasePublisher，提供查询发布的特化功能。
 *
 * @description 查询发布者，专门处理查询的发布和流管理
 *
 * ## 业务规则
 *
 * ### 查询发布规则
 * - 所有查询都必须通过发布者发布
 * - 支持查询的批量发布
 * - 提供查询发布的统计和监控
 * - 支持查询发布的中间件处理
 *
 * ### 查询验证规则
 * - 发布前验证查询的有效性
 * - 支持查询的序列化和反序列化
 * - 提供查询的元数据管理
 * - 支持查询的缓存控制
 *
 * ## 业务逻辑流程
 *
 * 1. **查询接收**：接收要发布的查询
 * 2. **查询验证**：验证查询的有效性和完整性
 * 3. **中间件处理**：通过中间件链处理查询
 * 4. **查询发布**：将查询发布到流
 * 5. **统计更新**：更新发布统计信息
 *
 * @example
 * ```typescript
 * // 创建查询发布者
 * const publisher = new QueryPublisher({
 *   enableLogging: true,
 *   enableMetrics: true
 * });
 *
 * // 发布查询
 * const query = new GetUserQuery('user-123');
 * publisher.publish(query);
 *
 * // 批量发布查询
 * const queries = [
 *   new GetUserQuery('user-1'),
 *   new GetUserQuery('user-2')
 * ];
 * publisher.publishAll(queries);
 *
 * // 订阅查询流
 * publisher.getStream().subscribe(query => {
 *   console.log('Query published:', query);
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class QueryPublisher<TQuery = any>
  extends BasePublisher<TQuery>
  implements IQueryPublisher<TQuery>
{
  /**
   * 构造函数
   *
   * @param config 发布者配置
   */
  constructor(logger: PinoLoggerService, config: IPublisherConfig = {}) {
    super(logger, {
      enableLogging: true,
      enableMetrics: true,
      enableRetry: false,
      maxRetries: 3,
      retryDelay: 1000,
      enableBatching: true,
      batchSize: 100,
      batchDelay: 50,
      ...config,
    });
  }

  /**
   * 发布查询
   *
   * @description 发布单个查询到流
   * @param query 要发布的查询
   * @param context 异步上下文
   */
  override publish(query: TQuery, context?: AsyncContext): void {
    // 验证查询
    this.validateQuery(query);

    // 记录查询发布日志
    if (this._config.enableLogging) {
      this.logger.debug(`Publishing query: ${this.getQueryName(query)}`);
    }

    // 调用父类发布方法
    super.publish(query, context);

    // 记录查询发布成功
    if (this._config.enableLogging) {
      this.logger.debug(
        `Successfully published query: ${this.getQueryName(query)}`,
      );
    }
  }

  /**
   * 批量发布查询
   *
   * @description 批量发布多个查询到流
   * @param queries 要发布的查询数组
   * @param context 异步上下文
   */
  override publishAll(queries: TQuery[], context?: AsyncContext): void {
    if (!queries || queries.length === 0) {
      return;
    }

    // 验证所有查询
    queries.forEach((query) => this.validateQuery(query));

    // 记录批量发布日志
    if (this._config.enableLogging) {
      this.logger.debug(`Publishing batch of ${queries.length} queries`);
    }

    // 调用父类批量发布方法
    super.publishAll(queries, context);

    // 记录批量发布成功
    if (this._config.enableLogging) {
      this.logger.debug(
        `Successfully published batch of ${queries.length} queries`,
      );
    }
  }

  /**
   * 验证查询
   *
   * @description 验证查询的有效性和完整性
   * @param query 要验证的查询
   * @throws 如果查询无效则抛出异常
   */
  protected validateQuery(query: TQuery): void {
    if (!query) {
      throw new Error('Query cannot be null or undefined');
    }

    // 检查查询是否有必要的属性
    if (typeof query === 'object' && query !== null) {
      const queryObj = query as any;

      // 检查查询类型
      if (!queryObj.constructor || !queryObj.constructor.name) {
        throw new Error('Query must have a constructor name');
      }

      // 检查查询是否有ID（如果存在）
      if (queryObj.id !== undefined && !queryObj.id) {
        throw new Error('Query ID cannot be empty');
      }

      // 检查查询是否有时间戳（如果存在）
      if (
        queryObj.timestamp !== undefined &&
        !(queryObj.timestamp instanceof Date)
      ) {
        throw new Error('Query timestamp must be a Date object');
      }
    }
  }

  /**
   * 获取查询名称
   *
   * @description 获取查询的类名或类型名
   * @param query 查询对象
   * @returns 查询名称
   */
  protected getQueryName(query: TQuery): string {
    if (typeof query === 'object' && query !== null) {
      const queryObj = query as any;
      return queryObj.constructor?.name || 'UnknownQuery';
    }

    return typeof query;
  }

  /**
   * 获取查询ID
   *
   * @description 获取查询的唯一标识符
   * @param query 查询对象
   * @returns 查询ID，如果不存在则返回undefined
   */
  getQueryId(query: TQuery): string | undefined {
    if (typeof query === 'object' && query !== null) {
      const queryObj = query as any;
      return queryObj.id || queryObj.queryId || queryObj.uuid;
    }

    return undefined;
  }

  /**
   * 获取查询元数据
   *
   * @description 获取查询的元数据信息
   * @param query 查询对象
   * @returns 查询元数据
   */
  getQueryMetadata(query: TQuery): Record<string, any> {
    if (typeof query === 'object' && query !== null) {
      const queryObj = query as any;
      return {
        id: this.getQueryId(query),
        type: this.getQueryName(query),
        timestamp: queryObj.timestamp || new Date(),
        version: queryObj.version || '1.0.0',
        userId: queryObj.userId,
        tenantId: queryObj.tenantId,
        organizationId: queryObj.organizationId,
        departmentId: queryObj.departmentId,
        cacheKey: queryObj.cacheKey,
        cacheTTL: queryObj.cacheTTL,
        ...queryObj.metadata,
      };
    }

    return {
      type: this.getQueryName(query),
      timestamp: new Date(),
      version: '1.0.0',
    };
  }

  /**
   * 序列化查询
   *
   * @description 将查询序列化为JSON字符串
   * @param query 要序列化的查询
   * @returns JSON字符串
   */
  serializeQuery(query: TQuery): string {
    try {
      return JSON.stringify(query, null, 2);
    } catch (error) {
      this.logger.error('Failed to serialize query:', LogContext.BUSINESS, {
        error,
      });
      throw new Error(`Failed to serialize query: ${(error as Error).message}`);
    }
  }

  /**
   * 反序列化查询
   *
   * @description 从JSON字符串反序列化查询
   * @param jsonString JSON字符串
   * @param queryClass 查询类构造函数
   * @returns 查询对象
   */
  deserializeQuery<T extends TQuery>(
    jsonString: string,
    queryClass: new (...args: any[]) => T,
  ): T {
    try {
      const data = JSON.parse(jsonString);
      return Object.assign(new queryClass() as any, data);
    } catch (error) {
      this.logger.error('Failed to deserialize query:', LogContext.BUSINESS, {
        error,
      });
      throw new Error(
        `Failed to deserialize query: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 获取查询统计信息
   *
   * @description 获取查询发布的统计信息
   * @returns 查询统计信息
   */
  getQueryStats(): {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    batchQueries: number;
    averageLatency: number;
    lastPublishedAt?: Date;
    errorStats: Record<string, number>;
  } {
    const stats = this.getStats();
    return {
      totalQueries: stats.totalPublished,
      successfulQueries: stats.successfulPublished,
      failedQueries: stats.failedPublished,
      batchQueries: stats.batchPublished,
      averageLatency: stats.averageLatency,
      lastPublishedAt: stats.lastPublishedAt,
      errorStats: stats.errorStats,
    };
  }
}
