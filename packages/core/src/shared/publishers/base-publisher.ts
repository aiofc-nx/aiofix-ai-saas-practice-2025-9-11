import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { PinoLoggerService, LogContext } from '@aiofix/logging';
import { AsyncContext } from '../context';
import type {
  IBasePublisher,
  IPublisherConfig,
  IPublisherMiddleware,
  IPublisherStats,
} from './publisher.types';

/**
 * 基础发布者
 *
 * 提供发布者的基础实现，包括流管理、中间件支持、统计信息收集等功能。
 * 所有具体的发布者都应该继承此类。
 *
 * @description 基础发布者实现，提供发布者的通用功能
 *
 * ## 业务规则
 *
 * ### 发布规则
 * - 所有发布操作都通过流进行
 * - 支持中间件链式处理
 * - 提供发布前后的钩子机制
 * - 支持错误处理和重试机制
 *
 * ### 统计规则
 * - 自动收集发布统计信息
 * - 支持指标监控和告警
 * - 提供性能分析数据
 * - 支持统计信息的导出和查询
 *
 * ## 业务逻辑流程
 *
 * 1. **发布请求**：接收发布请求和上下文
 * 2. **中间件处理**：通过中间件链处理发布项
 * 3. **流发布**：将处理后的项目发布到流
 * 4. **统计更新**：更新发布统计信息
 * 5. **钩子调用**：调用发布后的钩子
 *
 * @example
 * ```typescript
 * // 创建基础发布者
 * const publisher = new BasePublisher<string>({
 *   enableLogging: true,
 *   enableMetrics: true
 * });
 *
 * // 添加中间件
 * publisher.use((item, context, next) => {
 *   console.log('Before publish:', item);
 *   return next();
 * });
 *
 * // 发布项目
 * publisher.publish('test-item');
 *
 * // 订阅发布流
 * publisher.getStream().subscribe(item => {
 *   console.log('Published:', item);
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export abstract class BasePublisher<T> implements IBasePublisher<T> {
  protected readonly logger: PinoLoggerService;
  protected readonly _subject$ = new Subject<T>();
  protected readonly _middleware: IPublisherMiddleware<T>[] = [];
  protected readonly _config: Required<IPublisherConfig>;
  protected readonly _stats: IPublisherStats = {
    totalPublished: 0,
    successfulPublished: 0,
    failedPublished: 0,
    batchPublished: 0,
    averageLatency: 0,
    errorStats: {},
  };

  /**
   * 构造函数
   *
   * @param logger 日志服务
   * @param config 发布者配置
   */
  constructor(logger: PinoLoggerService, config: IPublisherConfig = {}) {
    this.logger = logger;
    this._config = {
      enableLogging: false,
      enableMetrics: false,
      enableRetry: false,
      maxRetries: 3,
      retryDelay: 1000,
      enableBatching: false,
      batchSize: 100,
      batchDelay: 100,
      ...config,
    };
  }

  /**
   * 发布单个项目
   *
   * @description 发布单个项目到流
   * @param item 要发布的项目
   * @param context 异步上下文
   */
  publish(item: T, context?: AsyncContext): void {
    const startTime = Date.now();

    try {
      // 记录发布开始
      if (this._config.enableLogging) {
        this.logger.debug(`Publishing item: ${this.getItemDescription(item)}`);
      }

      // 通过中间件处理
      const processedItem = this.processThroughMiddleware(item, context);

      // 发布到流
      this._subject$.next(processedItem);

      // 更新统计信息
      this.updateStats(true, Date.now() - startTime);

      // 调用发布后钩子
      this.callAfterPublishHooks(processedItem, context);

      if (this._config.enableLogging) {
        this.logger.debug(
          `Successfully published item: ${this.getItemDescription(item)}`,
        );
      }
    } catch (error) {
      // 更新错误统计
      this.updateErrorStats(error as Error);
      this.updateStats(false, Date.now() - startTime);

      // 调用错误钩子
      this.callErrorHooks(item, error as Error, context);

      if (this._config.enableLogging) {
        this.logger.error(
          `Failed to publish item: ${this.getItemDescription(item)}`,
          error,
        );
      }

      throw error;
    }
  }

  /**
   * 发布多个项目
   *
   * @description 批量发布多个项目到流
   * @param items 要发布的项目数组
   * @param context 异步上下文
   */
  publishAll(items: T[], context?: AsyncContext): void {
    if (!items || items.length === 0) {
      return;
    }

    const startTime = Date.now();

    try {
      if (this._config.enableLogging) {
        this.logger.debug(`Publishing batch of ${items.length} items`);
      }

      // 批量处理
      const processedItems = items.map((item) =>
        this.processThroughMiddleware(item, context),
      );

      // 批量发布到流
      processedItems.forEach((item) => {
        this._subject$.next(item);
      });

      // 更新统计信息
      this._stats.batchPublished++;
      this._stats.successfulPublished += items.length;
      this._stats.totalPublished += items.length;
      this._stats.averageLatency = this.calculateAverageLatency(
        Date.now() - startTime,
      );

      if (this._config.enableLogging) {
        this.logger.debug(
          `Successfully published batch of ${items.length} items`,
        );
      }
    } catch (error) {
      this.updateErrorStats(error as Error);
      this._stats.failedPublished += items.length;
      this._stats.totalPublished += items.length;

      if (this._config.enableLogging) {
        this.logger.error(
          `Failed to publish batch of ${items.length} items`,
          error,
        );
      }

      throw error;
    }
  }

  /**
   * 获取发布流
   *
   * @description 获取发布流的Observable
   * @returns 发布流的Observable
   */
  getStream(): Observable<T> {
    return this._subject$.asObservable();
  }

  /**
   * 添加中间件
   *
   * @description 添加发布中间件
   * @param middleware 中间件函数
   */
  use(middleware: IPublisherMiddleware<T>): void {
    this._middleware.push(middleware);
  }

  /**
   * 移除中间件
   *
   * @description 移除指定的中间件
   * @param middleware 要移除的中间件
   */
  removeMiddleware(middleware: IPublisherMiddleware<T>): void {
    const index = this._middleware.indexOf(middleware);
    if (index > -1) {
      this._middleware.splice(index, 1);
    }
  }

  /**
   * 清空所有中间件
   *
   * @description 清空所有中间件
   */
  clearMiddleware(): void {
    this._middleware.length = 0;
  }

  /**
   * 获取统计信息
   *
   * @description 获取发布者的统计信息
   * @returns 统计信息对象
   */
  getStats(): IPublisherStats {
    return { ...this._stats };
  }

  /**
   * 重置统计信息
   *
   * @description 重置所有统计信息
   */
  resetStats(): void {
    this._stats.totalPublished = 0;
    this._stats.successfulPublished = 0;
    this._stats.failedPublished = 0;
    this._stats.batchPublished = 0;
    this._stats.averageLatency = 0;
    this._stats.lastPublishedAt = undefined;
    this._stats.errorStats = {};
  }

  /**
   * 获取配置信息
   *
   * @description 获取发布者的配置信息
   * @returns 配置信息对象
   */
  getConfig(): Required<IPublisherConfig> {
    return { ...this._config };
  }

  /**
   * 更新配置
   *
   * @description 更新发布者配置
   * @param config 新的配置选项
   */
  updateConfig(config: Partial<IPublisherConfig>): void {
    Object.assign(this._config, config);
  }

  /**
   * 检查是否已连接
   *
   * @description 检查发布者是否已连接到流
   * @returns 如果已连接则返回true，否则返回false
   */
  isConnected(): boolean {
    return !this._subject$.closed;
  }

  /**
   * 关闭发布者
   *
   * @description 关闭发布者并清理资源
   */
  close(): void {
    this._subject$.complete();
    this.clearMiddleware();
    this.resetStats();
  }

  /**
   * 通过中间件处理项目
   *
   * @description 通过所有中间件处理发布项目
   * @param item 要处理的项目
   * @param context 异步上下文
   * @returns 处理后的项目
   */
  protected processThroughMiddleware(item: T, context?: AsyncContext): T {
    let processedItem = item;

    // 依次通过所有中间件
    for (const middleware of this._middleware) {
      if (middleware.beforePublish) {
        processedItem = middleware.beforePublish(
          processedItem,
          context,
          () => processedItem,
        );
      }
    }

    return processedItem;
  }

  /**
   * 调用发布后钩子
   *
   * @description 调用所有中间件的发布后钩子
   * @param item 已发布的项目
   * @param context 异步上下文
   */
  protected callAfterPublishHooks(item: T, context?: AsyncContext): void {
    for (const middleware of this._middleware) {
      if (middleware.afterPublish) {
        try {
          middleware.afterPublish(item, context, () => {});
        } catch (error) {
          this.logger.error('Error in afterPublish hook:', LogContext.SYSTEM, {
            error,
          });
        }
      }
    }
  }

  /**
   * 调用错误钩子
   *
   * @description 调用所有中间件的错误钩子
   * @param item 要发布的项目
   * @param error 错误信息
   * @param context 异步上下文
   */
  protected callErrorHooks(
    item: T,
    error: Error,
    context?: AsyncContext,
  ): void {
    for (const middleware of this._middleware) {
      if (middleware.onError) {
        try {
          middleware.onError(item, error, context, () => {});
        } catch (hookError) {
          this.logger.error('Error in onError hook:', LogContext.SYSTEM, {
            error: hookError,
          });
        }
      }
    }
  }

  /**
   * 更新统计信息
   *
   * @description 更新发布统计信息
   * @param success 是否成功
   * @param latency 延迟时间
   */
  protected updateStats(success: boolean, latency: number): void {
    this._stats.totalPublished++;

    if (success) {
      this._stats.successfulPublished++;
    } else {
      this._stats.failedPublished++;
    }

    this._stats.averageLatency = this.calculateAverageLatency(latency);
    this._stats.lastPublishedAt = new Date();
  }

  /**
   * 更新错误统计
   *
   * @description 更新错误统计信息
   * @param error 错误信息
   */
  protected updateErrorStats(error: Error): void {
    const errorType = error.constructor.name;
    this._stats.errorStats[errorType] =
      (this._stats.errorStats[errorType] || 0) + 1;
  }

  /**
   * 计算平均延迟
   *
   * @description 计算平均发布延迟
   * @param newLatency 新的延迟时间
   * @returns 平均延迟时间
   */
  protected calculateAverageLatency(newLatency: number): number {
    if (this._stats.totalPublished === 1) {
      return newLatency;
    }

    const totalLatency =
      this._stats.averageLatency * (this._stats.totalPublished - 1) +
      newLatency;
    return totalLatency / this._stats.totalPublished;
  }

  /**
   * 获取项目描述
   *
   * @description 获取项目的字符串描述，用于日志记录
   * @param item 项目
   * @returns 项目描述
   */
  protected getItemDescription(item: T): string {
    if (typeof item === 'string') {
      return item;
    }

    if (typeof item === 'object' && item !== null) {
      return JSON.stringify(item);
    }

    return String(item);
  }
}
