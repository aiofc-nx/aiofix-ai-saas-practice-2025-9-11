import { DomainEvent } from '../aggregates/base.aggregate-root';
import { EntityId } from '../value-objects/entity-id';
import { Timestamp } from '../../shared/types/common';

/**
 * 基础领域事件类
 *
 * 领域事件是领域驱动设计中的重要概念，用于表示领域中发生的业务事件。
 * 所有领域事件都应该继承此基类，确保事件的一致性和可追溯性。
 *
 * @description 所有领域事件的基类，提供事件的一致行为
 * 包括事件ID、聚合ID、发生时间、事件类型等基础属性
 *
 * ## 业务规则
 *
 * ### 事件标识规则
 * - 每个事件必须具有唯一的事件ID
 * - 事件ID采用UUID格式，确保全局唯一性
 * - 事件ID在事件创建时生成，不可变更
 * - 事件ID用于事件的去重和追踪
 *
 * ### 聚合关联规则
 * - 每个事件必须关联到特定的聚合根
 * - 聚合ID标识事件所属的聚合根
 * - 聚合ID用于事件的重放和状态重建
 * - 跨聚合事件需要特殊处理机制
 *
 * ### 时间戳规则
 * - 事件发生时间记录事件的实际发生时间
 * - 时间戳采用UTC时区，确保跨时区一致性
 * - 时间戳精度到毫秒级别
 * - 时间戳用于事件的排序和因果关系分析
 *
 * ### 事件类型规则
 * - 每个事件必须具有明确的事件类型
 * - 事件类型用于事件的分类和处理
 * - 事件类型命名遵循业务领域术语
 * - 事件类型变更需要版本兼容性处理
 *
 * ### 事件序列化规则
 * - 事件必须支持序列化和反序列化
 * - 序列化格式保持向后兼容性
 * - 事件数据包含完整的业务上下文
 * - 事件重放时能够重建完整状态
 *
 * ## 业务逻辑流程
 *
 * 1. **事件创建**：通过构造函数创建领域事件
 * 2. **标识符生成**：自动生成唯一的事件ID
 * 3. **时间戳设置**：记录事件发生时间
 * 4. **事件发布**：通过事件总线发布事件
 * 5. **事件处理**：事件处理器响应和处理事件
 * 6. **事件存储**：事件存储到事件存储系统
 * 7. **事件重放**：支持事件的重放和状态重建
 *
 * @example
 * ```typescript
 * class UserCreatedEvent extends BaseDomainEvent {
 *   constructor(
 *     aggregateId: EntityId,
 *     public readonly name: string,
 *     public readonly email: string
 *   ) {
 *     super('UserCreated', aggregateId);
 *   }
 * }
 *
 * // 创建事件
 * const event = new UserCreatedEvent(userId, '张三', 'zhangsan@example.com');
 *
 * // 发布事件
 * await eventBus.publish(event);
 *
 * // 事件处理
 * eventBus.subscribe('UserCreated', async (event: UserCreatedEvent) => {
 *   // 处理用户创建事件
 *   await sendWelcomeEmail(event.email);
 * });
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: EntityId;
  public readonly aggregateId: EntityId;
  public readonly occurredOn: Timestamp;
  public readonly eventType: string;

  /**
   * 构造函数
   *
   * @description 创建基础领域事件实例
   * @param eventType 事件类型名称
   * @param aggregateId 聚合根标识符
   * @param eventId 事件标识符，默认为新生成的ID
   * @param occurredOn 事件发生时间，默认为当前时间
   *
   * @example
   * ```typescript
   * const event = new ConcreteDomainEvent('UserCreated', userId);
   * ```
   */
  constructor(
    eventType: string,
    aggregateId: EntityId,
    eventId?: EntityId,
    occurredOn?: Timestamp
  ) {
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.eventId = eventId || EntityId.generate();
    this.occurredOn = occurredOn || new Date();
  }

  /**
   * 获取事件标识符
   *
   * @description 返回事件的唯一标识符
   * @returns 事件标识符
   *
   * @example
   * ```typescript
   * const eventId = event.getEventId();
   * console.log(eventId.toString()); // 输出事件UUID字符串
   * ```
   */
  public getEventId(): EntityId {
    return this.eventId;
  }

  /**
   * 获取聚合根标识符
   *
   * @description 返回事件所属聚合根的标识符
   * @returns 聚合根标识符
   *
   * @example
   * ```typescript
   * const aggregateId = event.getAggregateId();
   * console.log(aggregateId.toString()); // 输出聚合根UUID字符串
   * ```
   */
  public getAggregateId(): EntityId {
    return this.aggregateId;
  }

  /**
   * 获取事件发生时间
   *
   * @description 返回事件发生的时间戳
   * @returns 事件发生时间
   *
   * @example
   * ```typescript
   * const occurredOn = event.getOccurredOn();
   * console.log(occurredOn.toISOString()); // 输出ISO格式时间字符串
   * ```
   */
  public getOccurredOn(): Timestamp {
    return this.occurredOn;
  }

  /**
   * 获取事件类型
   *
   * @description 返回事件的类型名称
   * @returns 事件类型名称
   *
   * @example
   * ```typescript
   * const eventType = event.getEventType();
   * console.log(eventType); // 输出: "UserCreated"
   * ```
   */
  public getEventType(): string {
    return this.eventType;
  }

  /**
   * 转换为字符串表示
   *
   * @description 提供事件的字符串表示，便于调试和日志记录
   * @returns 事件的字符串表示
   *
   * @example
   * ```typescript
   * const event = new UserCreatedEvent(userId, '张三', 'zhangsan@example.com');
   * console.log(event.toString()); // 输出: "UserCreatedEvent(id: ..., aggregateId: ...)"
   * ```
   */
  public toString(): string {
    return `${
      this.constructor.name
    }(eventId: ${this.eventId.toString()}, aggregateId: ${this.aggregateId.toString()})`;
  }

  /**
   * 转换为JSON表示
   *
   * @description 提供事件的JSON序列化支持
   * @returns 事件的JSON表示
   *
   * @example
   * ```typescript
   * const event = new UserCreatedEvent(userId, '张三', 'zhangsan@example.com');
   * const json = event.toJSON();
   * // 输出: { eventId: "...", aggregateId: "...", eventType: "UserCreated", occurredOn: "..." }
   * ```
   */
  public toJSON(): Record<string, any> {
    return {
      eventId: this.eventId.toString(),
      aggregateId: this.aggregateId.toString(),
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
    };
  }

  /**
   * 比较两个事件是否相等
   *
   * @description 事件的相等性基于事件ID
   * @param other 要比较的另一个事件
   * @returns 如果两个事件的ID相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const event1 = new UserCreatedEvent(userId, '张三', 'zhangsan@example.com');
   * const event2 = new UserCreatedEvent(userId, '张三', 'zhangsan@example.com');
   * console.log(event1.equals(event2)); // false（不同的事件ID）
   * ```
   */
  public equals(other: BaseDomainEvent): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return this.eventId.equals(other.eventId);
  }
}
