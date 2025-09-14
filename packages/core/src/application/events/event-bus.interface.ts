import { DomainEvent } from '../../domain/aggregates/base.aggregate-root';

/**
 * 事件总线接口
 *
 * 事件总线是事件驱动架构中的核心组件，负责将事件分发给相应的处理器。
 * 事件总线提供了事件的注册、分发和处理机制，确保事件的正确定理。
 *
 * @description 定义事件总线的标准接口，所有事件总线实现都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 事件注册规则
 * - 每个事件类型可以注册多个处理器
 * - 处理器注册时必须验证事件类型匹配
 * - 支持处理器的动态注册和注销
 * - 支持处理器的优先级和排序
 *
 * ### 事件分发规则
 * - 事件必须分发给所有注册的处理器
 * - 支持事件的异步处理和同步处理
 * - 支持事件的批量处理和并行处理
 * - 支持事件的分发顺序控制
 *
 * ### 事件处理规则
 * - 事件处理器必须支持幂等性
 * - 支持事件处理的错误隔离
 * - 支持事件处理的重试机制
 * - 支持事件处理的超时控制
 *
 * ### 事务管理规则
 * - 支持事件的分布式事务处理
 * - 支持事件处理的补偿机制
 * - 支持事件处理的一致性保证
 * - 支持事件处理的回滚机制
 *
 * ### 性能优化规则
 * - 支持事件的批量处理优化
 * - 支持事件的并行处理优化
 * - 支持事件的负载均衡
 * - 支持事件处理的监控和指标收集
 *
 * ### 异常处理规则
 * - 单个处理器失败不影响其他处理器
 * - 支持事件处理的错误收集和报告
 * - 支持事件处理的死信队列
 * - 记录事件处理的详细日志
 *
 * ## 业务逻辑流程
 *
 * 1. **事件接收**：接收来自聚合根的事件
 * 2. **事件验证**：验证事件的有效性和完整性
 * 3. **处理器查找**：根据事件类型查找所有注册的处理器
 * 4. **事件分发**：将事件分发给所有处理器
 * 5. **并行处理**：支持处理器的并行执行
 * 6. **错误处理**：处理执行过程中的异常
 * 7. **结果收集**：收集所有处理器的执行结果
 * 8. **审计记录**：记录事件处理的审计日志
 *
 * @example
 * ```typescript
 * class EventBus implements IEventBus {
 *   private handlers = new Map<string, IEventHandler<any>[]>();
 *
 *   register<TEvent extends DomainEvent>(
 *     eventType: new (...args: any[]) => TEvent,
 *     handler: IEventHandler<TEvent>
 *   ): void {
 *     const eventTypeName = eventType.name;
 *     if (!this.handlers.has(eventTypeName)) {
 *       this.handlers.set(eventTypeName, []);
 *     }
 *     this.handlers.get(eventTypeName)!.push(handler);
 *   }
 *
 *   async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
 *     const handlers = this.handlers.get(event.constructor.name) || [];
 *     await Promise.all(handlers.map(handler => handler.handle(event)));
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface IEventBus {
  /**
   * 注册事件处理器
   *
   * @description 将事件处理器注册到事件总线中，建立事件类型与处理器的映射关系
   *
   * ## 业务规则
   *
   * ### 注册验证规则
   * - 验证事件类型和处理器的匹配性
   * - 支持同一事件类型的多个处理器注册
   * - 支持处理器的优先级设置
   * - 注册失败时抛出相应异常
   *
   * ### 类型安全规则
   * - 确保事件类型和处理器的类型匹配
   * - 支持泛型类型的安全检查
   * - 防止类型不匹配的注册
   * - 提供编译时类型检查
   *
   * @template TEvent 事件类型
   *
   * @param eventType - 事件类型的构造函数
   * @param handler - 事件处理器实例
   * @param options - 注册选项，包括优先级、执行模式等
   *
   * @throws {Error} 当注册失败时抛出
   *
   * @example
   * ```typescript
   * // 注册用户创建事件处理器
   * eventBus.register(UserCreatedEvent, userCreatedEventHandler, {
   *   priority: 1,
   *   async: true
   * });
   *
   * // 注册用户创建事件处理器（邮件服务）
   * eventBus.register(UserCreatedEvent, userCreatedEmailHandler, {
   *   priority: 2,
   *   async: true
   * });
   * ```
   */
  register<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: IEventHandler<TEvent>,
    options?: {
      priority?: number;
      async?: boolean;
      retry?: boolean;
      timeout?: number;
    }
  ): void;

  /**
   * 发布事件
   *
   * @description 发布指定的事件，将事件分发给所有注册的处理器
   *
   * ## 业务规则
   *
   * ### 事件分发规则
   * - 事件必须分发给所有注册的处理器
   * - 支持事件的异步处理和同步处理
   * - 支持事件的批量处理和并行处理
   * - 支持事件的分发顺序控制
   *
   * ### 处理器执行规则
   * - 事件处理器必须支持幂等性
   * - 支持事件处理的错误隔离
   * - 支持事件处理的重试机制
   * - 支持事件处理的超时控制
   *
   * ### 事务管理规则
   * - 支持事件的分布式事务处理
   * - 支持事件处理的补偿机制
   * - 支持事件处理的一致性保证
   * - 支持事件处理的回滚机制
   *
   * ### 异常处理规则
   * - 单个处理器失败不影响其他处理器
   * - 支持事件处理的错误收集和报告
   * - 支持事件处理的死信队列
   * - 记录事件处理的详细日志
   *
   * ### 性能优化规则
   * - 支持事件的批量处理优化
   * - 支持事件的并行处理优化
   * - 支持事件的负载均衡
   * - 支持事件处理的监控和指标收集
   *
   * @template TEvent 事件类型
   *
   * @param event - 要发布的事件
   * @param options - 发布选项，包括异步处理、重试机制等
   *
   * @example
   * ```typescript
   * // 发布用户创建事件
   * const event = new UserCreatedEvent(userId, tenantId, name, email);
   * await eventBus.publish(event, {
   *   async: true,
   *   retry: true,
   *   timeout: 5000
   * });
   * ```
   */
  publish<TEvent extends DomainEvent>(
    event: TEvent,
    options?: {
      async?: boolean;
      retry?: boolean;
      timeout?: number;
      priority?: boolean;
    }
  ): Promise<void>;

  /**
   * 批量发布事件
   *
   * @description 批量发布多个事件，支持并行处理和性能优化
   *
   * ## 业务规则
   *
   * ### 批量处理规则
   * - 支持事件的批量处理和并行处理
   * - 支持批量处理的事务管理
   * - 支持批量处理的错误处理
   * - 支持批量处理的性能优化
   *
   * ### 事务管理规则
   * - 批量发布可以在单个事务中进行
   * - 支持批量发布的一致性保证
   * - 批量发布失败时回滚所有操作
   * - 支持批量发布的补偿机制
   *
   * ### 错误处理规则
   * - 单个事件失败不影响其他事件处理
   * - 支持批量事件的错误收集和报告
   * - 支持批量事件的部分成功处理
   * - 记录批量事件的详细日志
   *
   * ### 性能优化规则
   * - 支持事件的批量处理优化
   * - 支持事件的并行处理优化
   * - 支持事件的负载均衡
   * - 支持事件处理的监控和指标收集
   *
   * @template TEvent 事件类型
   *
   * @param events - 要发布的事件数组
   * @param options - 批量发布选项，包括并行处理、事务管理等
   *
   * @example
   * ```typescript
   * // 批量发布事件
   * const events = [
   *   new UserCreatedEvent(userId1, tenantId, name1, email1),
   *   new UserCreatedEvent(userId2, tenantId, name2, email2)
   * ];
   *
   * await eventBus.publishBatch(events, {
   *   parallel: true,
   *   transaction: true,
   *   async: true
   * });
   * ```
   */
  publishBatch<TEvent extends DomainEvent>(
    events: TEvent[],
    options?: {
      parallel?: boolean;
      transaction?: boolean;
      async?: boolean;
      retry?: boolean;
      timeout?: number;
    }
  ): Promise<void>;

  /**
   * 检查事件处理器是否已注册
   *
   * @description 检查指定事件类型的处理器是否已经在事件总线中注册
   * @param eventType - 事件类型的构造函数
   * @returns 如果已注册则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isRegistered = eventBus.isRegistered(UserCreatedEvent);
   * if (!isRegistered) {
   *   eventBus.register(UserCreatedEvent, userCreatedEventHandler);
   * }
   * ```
   */
  isRegistered(eventType: new (...args: any[]) => DomainEvent): boolean;

  /**
   * 获取已注册的事件类型
   *
   * @description 返回所有已注册的事件类型
   * @returns 已注册的事件类型数组
   *
   * @example
   * ```typescript
   * const registeredTypes = eventBus.getRegisteredTypes();
   * console.log('已注册的事件类型:', registeredTypes.map(type => type.name));
   * ```
   */
  getRegisteredTypes(): (new (...args: any[]) => DomainEvent)[];

  /**
   * 获取事件处理器
   *
   * @description 获取指定事件类型的所有处理器
   * @param eventType - 事件类型的构造函数
   * @returns 事件处理器数组
   *
   * @example
   * ```typescript
   * const handlers = eventBus.getHandlers(UserCreatedEvent);
   * console.log(`用户创建事件有${handlers.length}个处理器`);
   * ```
   */
  getHandlers(
    eventType: new (...args: any[]) => DomainEvent
  ): IEventHandler<any>[];

  /**
   * 取消注册事件处理器
   *
   * @description 从事件总线中取消注册指定的事件处理器
   * @param eventType - 事件类型的构造函数
   * @param handler - 要取消注册的事件处理器
   *
   * @example
   * ```typescript
   * // 取消注册特定处理器
   * eventBus.unregister(UserCreatedEvent, userCreatedEventHandler);
   *
   * // 取消注册所有处理器
   * eventBus.unregisterAll(UserCreatedEvent);
   * ```
   */
  unregister<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler?: IEventHandler<TEvent>
  ): void;
}

// 导入事件处理器接口
import { IEventHandler } from './event-handler.interface';
