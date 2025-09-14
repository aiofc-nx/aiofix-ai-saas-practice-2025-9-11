import { BaseEntity } from '../entities/base.entity';
import { EntityId } from '../value-objects/entity-id';
import { Timestamp } from '../../shared/types/common';

/**
 * 领域事件接口
 *
 * @description 所有领域事件都应该实现此接口
 */
export interface DomainEvent {
  readonly eventId: EntityId;
  readonly aggregateId: EntityId;
  readonly occurredOn: Timestamp;
  readonly eventType: string;
}

/**
 * 基础聚合根类
 *
 * 聚合根是领域驱动设计中的核心概念，是聚合的入口点。
 * 聚合根负责维护聚合内部的一致性边界，并发布领域事件。
 *
 * @description 所有聚合根的基类，提供聚合根的一致行为
 * 包括事件管理、版本控制、一致性边界维护等功能
 *
 * ## 业务规则
 *
 * ### 事件管理规则
 * - 聚合根负责管理领域事件的发布
 * - 事件在聚合根状态变更时自动添加
 * - 事件通过事件总线发布到外部系统
 * - 事件发布后自动标记为已提交
 * - 支持事件的批量处理和发布
 *
 * ### 版本控制规则
 * - 聚合根支持乐观锁并发控制
 * - 每次状态变更都会增加版本号
 * - 版本号用于检测并发冲突
 * - 保存时验证版本号的一致性
 * - 版本冲突时抛出并发异常
 *
 * ### 一致性边界规则
 * - 聚合根维护聚合内部的一致性
 * - 跨聚合的事务通过领域事件协调
 * - 聚合根状态变更必须保持原子性
 * - 业务规则在聚合根内部强制执行
 * - 外部系统通过事件响应状态变更
 *
 * ### 生命周期规则
 * - 聚合根创建时初始化版本号为0
 * - 状态变更时自动增加版本号
 * - 支持从事件流重建聚合根状态
 * - 聚合根销毁时清理相关资源
 *
 * ## 业务逻辑流程
 *
 * 1. **聚合根创建**：通过构造函数创建聚合根实例
 * 2. **业务操作**：执行业务方法修改聚合根状态
 * 3. **事件添加**：业务操作完成后添加相应事件
 * 4. **版本更新**：状态变更时自动增加版本号
 * 5. **事件发布**：通过事件总线发布领域事件
 * 6. **状态持久化**：将聚合根状态保存到存储
 *
 * @example
 * ```typescript
 * class User extends BaseAggregateRoot {
 *   constructor(
 *     id: EntityId,
 *     private name: string,
 *     private email: string
 *   ) {
 *     super(id);
 *     this.addDomainEvent(new UserCreatedEvent(id, name, email));
 *   }
 *
 *   updateName(newName: string): void {
 *     const oldName = this.name;
 *     this.name = newName;
 *     this.addDomainEvent(new UserNameUpdatedEvent(this.getId(), oldName, newName));
 *   }
 *
 *   // 其他业务方法...
 * }
 *
 * // 创建用户聚合根
 * const user = new User(EntityId.generate(), '张三', 'zhangsan@example.com');
 *
 * // 更新用户信息
 * user.updateName('李四');
 *
 * // 发布事件
 * const events = user.getUncommittedEvents();
 * await eventBus.publishAll(events);
 * user.markEventsAsCommitted();
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseAggregateRoot extends BaseEntity {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  /**
   * 构造函数
   *
   * @description 创建基础聚合根实例
   * @param id 聚合根的唯一标识符
   * @param createdAt 创建时间，默认为当前时间
   * @param updatedAt 更新时间，默认为当前时间
   * @param version 版本号，默认为0
   *
   * @example
   * ```typescript
   * const aggregate = new ConcreteAggregate(EntityId.generate());
   * ```
   */
  constructor(
    id: EntityId,
    createdAt?: Timestamp,
    updatedAt?: Timestamp,
    version: number = 0
  ) {
    super(id, createdAt, updatedAt);
    this._version = version;
  }

  /**
   * 获取版本号
   *
   * @description 返回聚合根的当前版本号，用于乐观锁控制
   * @returns 版本号
   *
   * @example
   * ```typescript
   * const version = aggregate.getVersion();
   * console.log(`当前版本: ${version}`);
   * ```
   */
  public getVersion(): number {
    return this._version;
  }

  /**
   * 设置版本号
   *
   * @description 设置聚合根的版本号，通常用于从存储中重建聚合根
   * @param version 版本号
   *
   * @protected
   * @example
   * ```typescript
   * // 从存储中重建聚合根时设置版本号
   * aggregate.setVersion(savedVersion);
   * ```
   */
  protected setVersion(version: number): void {
    this._version = version;
  }

  /**
   * 增加版本号
   *
   * @description 增加聚合根的版本号，通常在聚合根状态改变时调用
   *
   * @protected
   * @example
   * ```typescript
   * updateName(newName: string): void {
   *   this.name = newName;
   *   this.incrementVersion();
   * }
   * ```
   */
  protected incrementVersion(): void {
    this._version++;
  }

  /**
   * 添加领域事件
   *
   * @description 向聚合根添加领域事件，事件将在聚合根提交时发布
   * @param event 要添加的领域事件
   *
   * @protected
   * @example
   * ```typescript
   * updateName(newName: string): void {
   *   const oldName = this.name;
   *   this.name = newName;
   *   this.addDomainEvent(new UserNameUpdatedEvent(this.getId(), oldName, newName));
   * }
   * ```
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 获取未提交的领域事件
   *
   * @description 返回聚合根中所有未提交的领域事件
   * @returns 未提交的领域事件数组
   *
   * @example
   * ```typescript
   * const events = aggregate.getUncommittedEvents();
   * events.forEach(event => eventBus.publish(event));
   * aggregate.markEventsAsCommitted();
   * ```
   */
  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * 标记事件为已提交
   *
   * @description 清空未提交的领域事件列表，通常在事件发布后调用
   *
   * @example
   * ```typescript
   * const events = aggregate.getUncommittedEvents();
   * events.forEach(event => eventBus.publish(event));
   * aggregate.markEventsAsCommitted();
   * ```
   */
  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  /**
   * 检查是否有未提交的事件
   *
   * @description 检查聚合根是否有未提交的领域事件
   * @returns 如果有未提交的事件则返回true，否则返回false
   *
   * @example
   * ```typescript
   * if (aggregate.hasUncommittedEvents()) {
   *   // 发布事件
   * }
   * ```
   */
  public hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * 获取未提交事件数量
   *
   * @description 返回未提交的领域事件数量
   * @returns 未提交事件数量
   *
   * @example
   * ```typescript
   * const eventCount = aggregate.getUncommittedEventCount();
   * console.log(`有 ${eventCount} 个未提交的事件`);
   * ```
   */
  public getUncommittedEventCount(): number {
    return this._domainEvents.length;
  }

  /**
   * 更新实体（重写基类方法）
   *
   * @description 更新聚合根时同时增加版本号
   *
   * @protected
   * @example
   * ```typescript
   * updateName(newName: string): void {
   *   this.name = newName;
   *   this.updateTimestamp(); // 会自动增加版本号
   * }
   * ```
   */
  protected updateTimestamp(): void {
    super.updateTimestamp();
    this.incrementVersion();
  }

  /**
   * 转换为JSON表示（重写基类方法）
   *
   * @description 提供聚合根的JSON序列化支持，包含版本信息
   * @returns 聚合根的JSON表示
   *
   * @example
   * ```typescript
   * const aggregate = new User(EntityId.generate());
   * const json = aggregate.toJSON();
   * // 输出: { id: "...", createdAt: "...", updatedAt: "...", version: 1 }
   * ```
   */
  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      version: this._version,
      uncommittedEventCount: this._domainEvents.length,
    };
  }
}
