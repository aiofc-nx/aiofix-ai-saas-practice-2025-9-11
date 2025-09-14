import { DomainEvent } from '../../domain/aggregates/base.aggregate-root';

/**
 * 事件处理器接口
 *
 * 事件处理器是事件驱动架构中的核心组件，负责响应和处理领域事件。
 * 每个事件处理器专门处理一种或多种事件类型，实现系统的解耦和扩展性。
 *
 * @description 定义事件处理器的标准接口，所有事件处理器都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 处理器注册规则
 * - 每个事件类型可以有多个处理器
 * - 处理器必须在事件总线中注册
 * - 处理器注册时验证事件类型匹配
 * - 支持处理器的动态注册和注销
 *
 * ### 事件处理规则
 * - 处理器必须验证事件的有效性
 * - 处理器必须保证事件处理的幂等性
 * - 处理器执行失败时记录错误但不影响其他处理器
 * - 支持事件的异步处理和重试机制
 *
 * ### 幂等性规则
 * - 事件处理器必须支持重复处理相同事件
 * - 重复处理相同事件不能产生副作用
 * - 支持事件的去重和重复检测
 * - 幂等性通过事件ID和处理器状态实现
 *
 * ### 错误处理规则
 * - 处理器执行失败不能影响其他处理器
 * - 失败的事件处理需要记录详细日志
 * - 支持事件的延迟重试和死信队列
 * - 系统异常和业务异常分别处理
 *
 * ### 事务管理规则
 * - 事件处理可以跨多个聚合根
 * - 支持事件处理的分布式事务
 * - 事件处理失败时回滚相关操作
 * - 支持事件的补偿机制
 *
 * ### 性能优化规则
 * - 支持事件的批量处理
 * - 支持事件的并行处理
 * - 支持事件处理的负载均衡
 * - 支持事件处理的监控和指标收集
 *
 * ## 业务逻辑流程
 *
 * 1. **事件接收**：接收来自事件总线的事件
 * 2. **事件验证**：验证事件的有效性和完整性
 * 3. **幂等性检查**：检查事件是否已经处理过
 * 4. **业务处理**：执行事件相关的业务逻辑
 * 5. **状态更新**：更新相关的业务状态
 * 6. **副作用处理**：处理事件产生的副作用
 * 7. **结果记录**：记录事件处理结果
 * 8. **异常处理**：处理事件处理过程中的异常
 *
 * @template TEvent 事件类型
 *
 * @example
 * ```typescript
 * class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
 *   constructor(
 *     private emailService: IEmailService,
 *     private notificationService: INotificationService,
 *     private eventStore: IEventStore
 *   ) {}
 *
 *   async handle(event: UserCreatedEvent): Promise<void> {
 *     try {
 *       // 检查幂等性
 *       const processed = await this.eventStore.isEventProcessed(
 *         event.eventId,
 *         this.constructor.name
 *       );
 *       if (processed) {
 *         return; // 已经处理过，直接返回
 *       }
 *
 *       // 发送欢迎邮件
 *       await this.emailService.sendWelcomeEmail(event.email, event.name);
 *
 *       // 发送通知
 *       await this.notificationService.notifyUserCreated(event);
 *
 *       // 记录处理结果
 *       await this.eventStore.markEventProcessed(
 *         event.eventId,
 *         this.constructor.name
 *       );
 *     } catch (error) {
 *       // 记录错误但不抛出，避免影响其他处理器
 *       console.error('处理用户创建事件失败:', error);
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface IEventHandler<TEvent extends DomainEvent> {
  /**
   * 处理事件
   *
   * @description 执行事件处理逻辑，包括事件验证、业务处理、状态更新等
   *
   * ## 业务规则
   *
   * ### 事件验证规则
   * - 验证事件的有效性和完整性
   * - 检查事件的版本和兼容性
   * - 验证事件数据的格式和约束
   * - 验证失败的事件记录错误日志
   *
   * ### 幂等性规则
   * - 支持重复处理相同事件
   * - 重复处理不能产生副作用
   * - 通过事件ID和处理器状态实现幂等性
   * - 幂等性检查失败直接返回
   *
   * ### 业务处理规则
   * - 执行事件相关的业务逻辑
   * - 更新相关的业务状态
   * - 处理事件产生的副作用
   * - 支持跨聚合根的复杂业务逻辑
   *
   * ### 错误处理规则
   * - 捕获并处理所有异常
   * - 记录详细的错误日志
   * - 支持事件的延迟重试
   * - 不抛出异常避免影响其他处理器
   *
   * ### 事务管理规则
   * - 支持事件处理的分布式事务
   * - 事件处理失败时回滚相关操作
   * - 支持事件的补偿机制
   * - 确保事件处理的一致性
   *
   * ### 性能优化规则
   * - 支持事件的批量处理
   * - 支持事件的并行处理
   * - 优化事件处理的性能
   * - 支持事件处理的监控
   *
   * @param event - 要处理的事件
   * @returns Promise<void> 事件处理完成
   *
   * @example
   * ```typescript
   * // 处理用户创建事件
   * await eventHandler.handle(userCreatedEvent);
   *
   * // 批量处理事件
   * const events = [event1, event2, event3];
   * await Promise.all(events.map(event => eventHandler.handle(event)));
   * ```
   */
  handle(event: TEvent): Promise<void>;

  /**
   * 获取支持的事件类型
   *
   * @description 返回此处理器支持的事件类型
   * @returns 事件类型的构造函数
   *
   * @example
   * ```typescript
   * const eventType = handler.getEventType();
   * console.log(eventType.name); // 输出: "UserCreatedEvent"
   * ```
   */
  getEventType(): new (...args: any[]) => TEvent;

  /**
   * 检查事件是否支持处理
   *
   * @description 检查此处理器是否支持处理指定类型的事件
   * @param event - 要检查的事件
   * @returns 如果支持处理则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const canHandle = handler.canHandle(userCreatedEvent);
   * if (canHandle) {
   *   await handler.handle(userCreatedEvent);
   * }
   * ```
   */
  canHandle(event: DomainEvent): boolean;
}
