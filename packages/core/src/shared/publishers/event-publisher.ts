import { Injectable } from '@nestjs/common';
import type { AsyncContext } from '../context';
import { PinoLoggerService, LogContext } from '@aiofix/logging';
import { BasePublisher } from './base-publisher';
import type { IEventPublisher, IPublisherConfig } from './publisher.types';

/**
 * 事件发布者
 *
 * 专门用于发布事件的发布者实现。
 * 继承自BasePublisher，提供事件发布的特化功能。
 *
 * @description 事件发布者，专门处理事件的发布和流管理
 *
 * ## 业务规则
 *
 * ### 事件发布规则
 * - 所有事件都必须通过发布者发布
 * - 支持事件的批量发布
 * - 提供事件发布的统计和监控
 * - 支持事件发布的中间件处理
 *
 * ### 事件验证规则
 * - 发布前验证事件的有效性
 * - 支持事件的序列化和反序列化
 * - 提供事件的元数据管理
 * - 支持事件的版本控制
 *
 * ## 业务逻辑流程
 *
 * 1. **事件接收**：接收要发布的事件
 * 2. **事件验证**：验证事件的有效性和完整性
 * 3. **中间件处理**：通过中间件链处理事件
 * 4. **事件发布**：将事件发布到流
 * 5. **统计更新**：更新发布统计信息
 *
 * @example
 * ```typescript
 * // 创建事件发布者
 * const publisher = new EventPublisher({
 *   enableLogging: true,
 *   enableMetrics: true
 * });
 *
 * // 发布事件
 * const event = new UserCreatedEvent('user-123', 'John Doe');
 * publisher.publish(event);
 *
 * // 批量发布事件
 * const events = [
 *   new UserCreatedEvent('user-1', 'Alice'),
 *   new UserCreatedEvent('user-2', 'Bob')
 * ];
 * publisher.publishAll(events);
 *
 * // 订阅事件流
 * publisher.getStream().subscribe(event => {
 *   console.log('Event published:', event);
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class EventPublisher<TEvent = any>
  extends BasePublisher<TEvent>
  implements IEventPublisher<TEvent>
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
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableBatching: true,
      batchSize: 200,
      batchDelay: 50,
      ...config,
    });
  }

  /**
   * 发布事件
   *
   * @description 发布单个事件到流
   * @param event 要发布的事件
   * @param context 异步上下文
   */
  override publish(event: TEvent, context?: AsyncContext): void {
    // 验证事件
    this.validateEvent(event);

    // 记录事件发布日志
    if (this._config.enableLogging) {
      this.logger.debug(`Publishing event: ${this.getEventName(event)}`);
    }

    // 调用父类发布方法
    super.publish(event, context);

    // 记录事件发布成功
    if (this._config.enableLogging) {
      this.logger.debug(
        `Successfully published event: ${this.getEventName(event)}`,
      );
    }
  }

  /**
   * 批量发布事件
   *
   * @description 批量发布多个事件到流
   * @param events 要发布的事件数组
   * @param context 异步上下文
   */
  override publishAll(events: TEvent[], context?: AsyncContext): void {
    if (!events || events.length === 0) {
      return;
    }

    // 验证所有事件
    events.forEach((event) => this.validateEvent(event));

    // 记录批量发布日志
    if (this._config.enableLogging) {
      this.logger.debug(`Publishing batch of ${events.length} events`);
    }

    // 调用父类批量发布方法
    super.publishAll(events, context);

    // 记录批量发布成功
    if (this._config.enableLogging) {
      this.logger.debug(
        `Successfully published batch of ${events.length} events`,
      );
    }
  }

  /**
   * 验证事件
   *
   * @description 验证事件的有效性和完整性
   * @param event 要验证的事件
   * @throws 如果事件无效则抛出异常
   */
  protected validateEvent(event: TEvent): void {
    if (!event) {
      throw new Error('Event cannot be null or undefined');
    }

    // 检查事件是否有必要的属性
    if (typeof event === 'object' && event !== null) {
      const eventObj = event as any;

      // 检查事件类型
      if (!eventObj.constructor || !eventObj.constructor.name) {
        throw new Error('Event must have a constructor name');
      }

      // 检查事件是否有ID（如果存在）
      if (eventObj.id !== undefined && !eventObj.id) {
        throw new Error('Event ID cannot be empty');
      }

      // 检查事件是否有时间戳（如果存在）
      if (
        eventObj.timestamp !== undefined &&
        !(eventObj.timestamp instanceof Date)
      ) {
        throw new Error('Event timestamp must be a Date object');
      }

      // 检查事件是否有聚合根ID（如果存在）
      if (eventObj.aggregateId !== undefined && !eventObj.aggregateId) {
        throw new Error('Event aggregateId cannot be empty');
      }

      // 检查事件是否有版本号（如果存在）
      if (
        eventObj.version !== undefined &&
        typeof eventObj.version !== 'number'
      ) {
        throw new Error('Event version must be a number');
      }
    }
  }

  /**
   * 获取事件名称
   *
   * @description 获取事件的类名或类型名
   * @param event 事件对象
   * @returns 事件名称
   */
  protected getEventName(event: TEvent): string {
    if (typeof event === 'object' && event !== null) {
      const eventObj = event as any;
      return eventObj.constructor?.name || 'UnknownEvent';
    }

    return typeof event;
  }

  /**
   * 获取事件ID
   *
   * @description 获取事件的唯一标识符
   * @param event 事件对象
   * @returns 事件ID，如果不存在则返回undefined
   */
  getEventId(event: TEvent): string | undefined {
    if (typeof event === 'object' && event !== null) {
      const eventObj = event as any;
      return eventObj.id || eventObj.eventId || eventObj.uuid;
    }

    return undefined;
  }

  /**
   * 获取事件元数据
   *
   * @description 获取事件的元数据信息
   * @param event 事件对象
   * @returns 事件元数据
   */
  getEventMetadata(event: TEvent): Record<string, any> {
    if (typeof event === 'object' && event !== null) {
      const eventObj = event as any;
      return {
        id: this.getEventId(event),
        type: this.getEventName(event),
        timestamp: eventObj.timestamp || new Date(),
        version: eventObj.version || 1,
        aggregateId: eventObj.aggregateId,
        aggregateType: eventObj.aggregateType,
        userId: eventObj.userId,
        tenantId: eventObj.tenantId,
        organizationId: eventObj.organizationId,
        departmentId: eventObj.departmentId,
        correlationId: eventObj.correlationId,
        causationId: eventObj.causationId,
        ...eventObj.metadata,
      };
    }

    return {
      type: this.getEventName(event),
      timestamp: new Date(),
      version: 1,
    };
  }

  /**
   * 序列化事件
   *
   * @description 将事件序列化为JSON字符串
   * @param event 要序列化的事件
   * @returns JSON字符串
   */
  serializeEvent(event: TEvent): string {
    try {
      return JSON.stringify(event, null, 2);
    } catch (error) {
      this.logger.error('Failed to serialize event:', LogContext.EVENT, {
        error,
      });
      throw new Error(`Failed to serialize event: ${(error as Error).message}`);
    }
  }

  /**
   * 反序列化事件
   *
   * @description 从JSON字符串反序列化事件
   * @param jsonString JSON字符串
   * @param eventClass 事件类构造函数
   * @returns 事件对象
   */
  deserializeEvent<T extends TEvent>(
    jsonString: string,
    eventClass: new (...args: any[]) => T,
  ): T {
    try {
      const data = JSON.parse(jsonString);
      return Object.assign(new eventClass() as any, data);
    } catch (error) {
      this.logger.error('Failed to deserialize event:', LogContext.EVENT, {
        error,
      });
      throw new Error(
        `Failed to deserialize event: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 获取事件统计信息
   *
   * @description 获取事件发布的统计信息
   * @returns 事件统计信息
   */
  getEventStats(): {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    batchEvents: number;
    averageLatency: number;
    lastPublishedAt?: Date;
    errorStats: Record<string, number>;
  } {
    const stats = this.getStats();
    return {
      totalEvents: stats.totalPublished,
      successfulEvents: stats.successfulPublished,
      failedEvents: stats.failedPublished,
      batchEvents: stats.batchPublished,
      averageLatency: stats.averageLatency,
      lastPublishedAt: stats.lastPublishedAt,
      errorStats: stats.errorStats,
    };
  }
}
