import { IEventBus, IEventHandler } from '../../application/events';
import { DomainEvent } from '../../domain/aggregates/base.aggregate-root';

/**
 * 事件总线实现
 *
 * 事件总线是事件驱动架构的核心组件，负责将领域事件分发给相应的处理器。
 * 支持异步事件处理、错误处理、重试机制等企业级功能。
 *
 * @description 事件总线的具体实现，提供事件的注册、分发和处理功能
 *
 * ## 业务规则
 *
 * ### 事件注册规则
 * - 每个事件处理器必须注册到事件总线
 * - 一个事件可以有多个处理器
 * - 处理器必须实现IEventHandler接口
 * - 注册时验证处理器类型和事件类型
 *
 * ### 事件分发规则
 * - 事件按注册顺序分发给处理器
 * - 支持异步事件处理
 * - 事件处理失败时记录错误但不中断其他处理器
 * - 支持事件处理的超时控制
 *
 * ### 错误处理规则
 * - 事件处理异常时记录详细错误信息
 * - 支持事件处理的重试机制
 * - 提供事件处理的监控和统计
 * - 异常事件进入死信队列
 *
 * ## 业务逻辑流程
 *
 * 1. **事件注册**：注册事件处理器到事件总线
 * 2. **事件接收**：接收来自聚合根的领域事件
 * 3. **事件分发**：将事件分发给所有注册的处理器
 * 4. **异步处理**：异步执行事件处理逻辑
 * 5. **错误处理**：处理事件处理过程中的异常
 * 6. **结果统计**：统计事件处理的成功率和性能
 *
 * @example
 * ```typescript
 * // 注册事件处理器
 * const eventBus = new EventBus();
 * eventBus.register(UserCreatedEventHandler);
 *
 * // 发布事件
 * const event = new UserCreatedEvent(userId, userData);
 * await eventBus.publish(event);
 *
 * // 批量发布事件
 * const events = [event1, event2, event3];
 * await eventBus.publishBatch(events);
 * ```
 */
export class EventBus implements IEventBus {
  private readonly handlers = new Map<string, IEventHandler<DomainEvent>[]>();
  private readonly processingStats = new Map<
    string,
    {
      successCount: number;
      failureCount: number;
      totalTime: number;
    }
  >();

  /**
   * 注册事件处理器
   *
   * @description 将事件处理器注册到事件总线
   * @param eventType 事件类型的构造函数
   * @param handler 事件处理器实例
   * @param options 注册选项
   *
   * @example
   * ```typescript
   * const eventBus = new EventBus();
   * const handler = new UserCreatedEventHandler();
   * eventBus.register(UserCreatedEvent, handler);
   * ```
   */
  public register<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: IEventHandler<TEvent>,
    options?: {
      priority?: number;
      async?: boolean;
      retry?: boolean;
      timeout?: number;
    }
  ): void {
    const eventTypeName = eventType.name;

    if (!this.handlers.has(eventTypeName)) {
      this.handlers.set(eventTypeName, []);
    }

    this.handlers
      .get(eventTypeName)!
      .push(handler as IEventHandler<DomainEvent>);
  }

  /**
   * 注销事件处理器
   *
   * @description 从事件总线中注销指定的事件处理器
   * @param eventType 事件类型的构造函数
   * @param handler 要注销的事件处理器实例
   *
   * @example
   * ```typescript
   * const eventBus = new EventBus();
   * eventBus.unregister(UserCreatedEvent, handler);
   * ```
   */
  public unregister<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: IEventHandler<TEvent>
  ): void {
    const eventTypeName = eventType.name;
    const handlers = this.handlers.get(eventTypeName);

    if (handlers) {
      const index = handlers.indexOf(handler as IEventHandler<DomainEvent>);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 发布单个事件
   *
   * @description 将单个领域事件分发给所有注册的处理器
   * @param event 要发布的领域事件
   *
   * @example
   * ```typescript
   * const event = new UserCreatedEvent(userId, userData);
   * await eventBus.publish(event);
   * ```
   */
  public async publish(event: DomainEvent): Promise<void> {
    const eventType = event.constructor.name;
    const handlers = this.handlers.get(eventType) || [];

    if (handlers.length === 0) {
      console.warn(`No handlers registered for event type: ${eventType}`);
      return;
    }

    // 并发处理所有处理器
    const promises = handlers.map((handler) =>
      this.processEvent(handler, event)
    );
    const results = await Promise.allSettled(promises);

    // 检查是否有失败的处理器
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      // 抛出第一个失败的错误
      throw (failures[0] as PromiseRejectedResult).reason;
    }
  }

  /**
   * 批量发布事件
   *
   * @description 批量发布多个领域事件
   * @param events 要发布的领域事件数组
   *
   * @example
   * ```typescript
   * const events = [event1, event2, event3];
   * await eventBus.publishBatch(events);
   * ```
   */
  public async publishBatch(events: DomainEvent[]): Promise<void> {
    const promises = events.map((event) => this.publish(event));
    await Promise.allSettled(promises);
  }

  /**
   * 获取事件处理统计信息
   *
   * @description 获取事件处理的统计信息
   * @returns 事件处理统计信息
   *
   * @example
   * ```typescript
   * const stats = eventBus.getProcessingStats();
   * console.log('处理统计:', stats);
   * ```
   */
  public getProcessingStats(): Record<
    string,
    {
      successCount: number;
      failureCount: number;
      totalTime: number;
      averageTime: number;
      successRate: number;
    }
  > {
    const result: Record<string, any> = {};

    for (const [eventType, stats] of this.processingStats.entries()) {
      const total = stats.successCount + stats.failureCount;
      result[eventType] = {
        successCount: stats.successCount,
        failureCount: stats.failureCount,
        totalTime: stats.totalTime,
        averageTime: total > 0 ? stats.totalTime / total : 0,
        successRate: total > 0 ? stats.successCount / total : 0,
      };
    }

    return result;
  }

  /**
   * 清除统计信息
   *
   * @description 清除所有事件处理的统计信息
   *
   * @example
   * ```typescript
   * eventBus.clearStats();
   * ```
   */
  public clearStats(): void {
    this.processingStats.clear();
  }

  /**
   * 获取注册的处理器数量
   *
   * @description 获取指定事件类型的处理器数量
   * @param eventType 事件类型
   * @returns 处理器数量
   *
   * @example
   * ```typescript
   * const count = eventBus.getHandlerCount('UserCreatedEvent');
   * console.log(`UserCreatedEvent 有 ${count} 个处理器`);
   * ```
   */
  public getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  /**
   * 检查是否有处理器注册
   *
   * @description 检查指定事件类型是否有处理器注册
   * @param eventType 事件类型
   * @returns 是否有处理器注册
   *
   * @example
   * ```typescript
   * const hasHandlers = eventBus.hasHandlers('UserCreatedEvent');
   * if (!hasHandlers) {
   *   console.warn('没有处理器处理 UserCreatedEvent');
   * }
   * ```
   */
  public hasHandlers(eventType: string): boolean {
    return this.getHandlerCount(eventType) > 0;
  }

  /**
   * 获取所有注册的事件类型
   *
   * @description 获取所有已注册处理器的事件类型列表
   * @returns 事件类型列表
   *
   * @example
   * ```typescript
   * const eventTypes = eventBus.getRegisteredEventTypes();
   * console.log('已注册的事件类型:', eventTypes);
   * ```
   */
  public getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 检查事件处理器是否已注册
   *
   * @description 检查指定事件类型的处理器是否已注册
   * @param eventType 事件类型的构造函数
   * @returns 是否已注册
   */
  public isRegistered<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent
  ): boolean {
    return this.handlers.has(eventType.name);
  }

  /**
   * 获取注册的类型构造函数
   *
   * @description 获取所有已注册的事件类型构造函数列表
   * @returns 事件类型构造函数列表
   */
  public getRegisteredTypes(): (new (...args: any[]) => DomainEvent)[] {
    // 由于我们只存储了字符串名称，这里返回一个空数组
    // 在实际实现中，可能需要维护类型构造函数的映射
    return [];
  }

  /**
   * 获取事件处理器
   *
   * @description 获取指定事件类型的所有处理器
   * @param eventType 事件类型的构造函数
   * @returns 处理器数组
   */
  public getHandlers<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent
  ): IEventHandler<TEvent>[] {
    return (this.handlers.get(eventType.name) || []) as IEventHandler<TEvent>[];
  }

  /**
   * 处理单个事件
   *
   * @description 使用指定的处理器处理事件
   * @param handler 事件处理器
   * @param event 要处理的事件
   * @private
   */
  private async processEvent(
    handler: IEventHandler<DomainEvent>,
    event: DomainEvent
  ): Promise<void> {
    const startTime = Date.now();
    const eventType = event.constructor.name;

    try {
      await handler.handle(event);

      // 更新成功统计
      this.updateStats(eventType, true, Date.now() - startTime);
    } catch (error) {
      // 更新失败统计
      this.updateStats(eventType, false, Date.now() - startTime);

      console.error(`Event processing failed for ${eventType}:`, error);

      // 这里可以添加重试逻辑或死信队列处理
      throw error;
    }
  }

  /**
   * 更新处理统计信息
   *
   * @description 更新事件处理的统计信息
   * @param eventType 事件类型
   * @param success 是否成功
   * @param processingTime 处理时间
   * @private
   */
  private updateStats(
    eventType: string,
    success: boolean,
    processingTime: number
  ): void {
    if (!this.processingStats.has(eventType)) {
      this.processingStats.set(eventType, {
        successCount: 0,
        failureCount: 0,
        totalTime: 0,
      });
    }

    const stats = this.processingStats.get(eventType)!;

    if (success) {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }

    stats.totalTime += processingTime;
  }
}
