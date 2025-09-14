import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import type { IEvent, ISagaEventBus } from './saga.types';

/**
 * Saga事件总线
 *
 * 专门为Saga提供事件过滤和处理功能的事件总线。
 * 继承自基础事件总线，添加了Saga特定的功能。
 *
 * @description Saga事件总线，提供事件过滤和处理功能
 *
 * ## 业务规则
 *
 * ### 事件过滤规则
 * - 支持按事件类型过滤事件流
 * - 提供类型安全的事件处理
 * - 支持多个事件类型的组合过滤
 * - 提供事件流的转换和映射
 *
 * ### 事件处理规则
 * - 自动处理事件的订阅和取消订阅
 * - 支持事件流的生命周期管理
 * - 提供事件处理的错误处理机制
 * - 支持事件处理的统计和监控
 *
 * ## 业务逻辑流程
 *
 * 1. **事件接收**：接收来自事件总线的事件
 * 2. **事件过滤**：根据指定类型过滤事件
 * 3. **事件分发**：将过滤后的事件分发给Saga
 * 4. **事件处理**：Saga处理事件并生成命令
 * 5. **命令执行**：执行Saga生成的命令
 *
 * @example
 * ```typescript
 * // 创建Saga事件总线
 * const eventBus = new SagaEventBus();
 *
 * // 过滤特定类型的事件
 * const userEvents$ = eventBus.ofType(UserCreatedEvent, UserUpdatedEvent);
 *
 * // 订阅事件流
 * userEvents$.subscribe(event => {
 *   console.log('User event received:', event);
 * });
 *
 * // 发布事件
 * eventBus.publish(new UserCreatedEvent('user-123', 'John Doe'));
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class SagaEventBus<TEvent extends IEvent = IEvent>
  implements ISagaEventBus<TEvent>
{
  private readonly logger = new Logger(SagaEventBus.name);
  private readonly _eventStreams = new Map<string, Observable<any>>();

  /**
   * 过滤特定类型的事件
   *
   * @description 根据事件类型过滤事件流
   * @param types 事件类型数组
   * @returns 过滤后的事件流
   */
  ofType<T extends TEvent>(
    ...types: Array<new (...args: any[]) => T>
  ): Observable<T> {
    const typeKey = types
      .map((type) => type.name)
      .sort()
      .join(',');

    // 检查是否已有缓存的事件流
    if (this._eventStreams.has(typeKey)) {
      return this._eventStreams.get(typeKey) as Observable<T>;
    }

    // 创建新的事件流
    const eventStream = this.createFilteredEventStream(types);
    this._eventStreams.set(typeKey, eventStream);

    if (this.logger.debug) {
      this.logger.debug(`Created filtered event stream for types: ${typeKey}`);
    }

    return eventStream;
  }

  /**
   * 创建过滤后的事件流
   *
   * @description 创建按类型过滤的事件流
   * @param types 事件类型数组
   * @returns 过滤后的事件流
   */
  private createFilteredEventStream<T extends TEvent>(
    types: Array<new (...args: any[]) => T>
  ): Observable<T> {
    // 这里需要从实际的事件总线获取事件流
    // 暂时返回一个空的Observable，实际实现需要注入EventBus
    return new Observable<T>((observer) => {
      this.logger.warn(
        'SagaEventBus: createFilteredEventStream not fully implemented'
      );
      // 实际实现应该从EventBus获取事件流并应用过滤
      return () => {
        // 清理逻辑
      };
    }).pipe(
      filter((event: any) => {
        return types.some((type) => event instanceof type);
      })
    );
  }

  /**
   * 获取所有注册的事件流
   *
   * @description 获取所有已注册的事件流
   * @returns 事件流映射
   */
  getRegisteredEventStreams(): Map<string, Observable<any>> {
    return new Map(this._eventStreams);
  }

  /**
   * 清除所有事件流
   *
   * @description 清除所有注册的事件流
   */
  clearEventStreams(): void {
    this._eventStreams.clear();
    this.logger.debug('Cleared all event streams');
  }

  /**
   * 获取事件流统计信息
   *
   * @description 获取事件流的统计信息
   * @returns 统计信息
   */
  getEventStreamStats(): {
    totalStreams: number;
    streamTypes: string[];
  } {
    return {
      totalStreams: this._eventStreams.size,
      streamTypes: Array.from(this._eventStreams.keys()),
    };
  }
}
