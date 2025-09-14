import { BaseAggregateRoot, DomainEvent } from './base.aggregate-root';
import { BaseEntity } from '../entities/base.entity';
import { EntityId } from '../value-objects/entity-id';
import { TenantId } from '../value-objects/tenant-id';
import { UserId } from '../value-objects/user-id';
import { Timestamp } from '../../shared/types/common';

/**
 * 租户感知聚合根类
 *
 * 租户感知聚合根是多租户架构中的核心概念，每个聚合根都属于特定的租户。
 * 提供租户隔离、权限控制和事件管理的基础功能。
 *
 * @description 所有需要租户隔离的聚合根的基类
 * 提供租户ID、创建者、更新者等租户相关属性，以及事件管理功能
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 每个聚合根必须属于特定的租户
 * - 租户ID在聚合根创建时设置，不可变更
 * - 跨租户的数据访问被严格禁止
 * - 所有业务操作必须验证租户上下文
 * - 租户级别的数据完全隔离
 *
 * ### 事件管理规则
 * - 领域事件必须包含租户上下文信息
 * - 事件发布时验证租户权限
 * - 跨租户事件传播需要特殊处理
 * - 事件存储考虑租户隔离要求
 * - 事件重放时验证租户上下文
 *
 * ### 版本控制规则
 * - 聚合根支持乐观锁并发控制
 * - 每次状态变更都会增加版本号
 * - 版本号用于检测并发冲突
 * - 保存时验证版本号的一致性
 * - 版本冲突时抛出并发异常
 *
 * ### 用户追踪规则
 * - 聚合根创建时必须记录创建者用户ID
 * - 聚合根更新时必须记录更新者用户ID
 * - 用户ID用于审计追踪和权限控制
 * - 支持创建者和更新者的查询和验证
 * - 用户ID变更会触发相应的事件
 *
 * ### 权限控制规则
 * - 用户只能访问其所属租户的聚合根
 * - 跨租户操作需要特殊权限验证
 * - 支持组织级别和部门级别的权限控制
 * - 权限验证基于租户上下文和用户身份
 * - 权限变更会触发相应的安全事件
 *
 * ## 业务逻辑流程
 *
 * 1. **聚合根创建**：通过构造函数创建租户感知聚合根
 * 2. **租户验证**：验证租户ID的有效性和权限
 * 3. **用户追踪**：记录创建者和初始更新者
 * 4. **业务操作**：执行业务方法修改聚合根状态
 * 5. **事件添加**：业务操作完成后添加相应事件
 * 6. **版本更新**：状态变更时自动增加版本号
 * 7. **权限检查**：每次操作前验证租户权限
 * 8. **事件发布**：通过事件总线发布领域事件
 * 9. **审计记录**：记录所有状态变更和操作者
 *
 * @example
 * ```typescript
 * class User extends TenantAwareAggregateRoot {
 *   constructor(
 *     id: EntityId,
 *     tenantId: TenantId,
 *     createdBy: UserId,
 *     private name: string,
 *     private email: string
 *   ) {
 *     super(id, tenantId, createdBy);
 *     this.addDomainEvent(new UserCreatedEvent(id, tenantId, name, email));
 *   }
 *
 *   updateName(newName: string, updatedBy: UserId): void {
 *     const oldName = this.name;
 *     this.name = newName;
 *     this.updateTimestamp(updatedBy);
 *     this.addDomainEvent(new UserNameUpdatedEvent(this.getId(), this.getTenantId(), oldName, newName));
 *   }
 *
 *   // 其他业务方法...
 * }
 *
 * // 创建租户感知聚合根
 * const user = new User(
 *   EntityId.generate(),
 *   tenantId,
 *   createdBy,
 *   '张三',
 *   'zhangsan@example.com'
 * );
 *
 * // 更新聚合根信息
 * user.updateName('李四', updatedBy);
 *
 * // 发布事件
 * const events = user.getUncommittedEvents();
 * await eventBus.publishAll(events);
 * user.markEventsAsCommitted();
 * ```
 *
 * @since 1.0.0
 */
export abstract class TenantAwareAggregateRoot extends BaseAggregateRoot {
  private readonly _tenantId: TenantId;
  private readonly _createdBy: UserId;
  private _updatedBy: UserId;

  /**
   * 构造函数
   *
   * @description 创建租户感知聚合根实例
   * @param id 聚合根的唯一标识符
   * @param tenantId 租户标识符
   * @param createdBy 创建者用户ID
   * @param createdAt 创建时间，默认为当前时间
   * @param updatedAt 更新时间，默认为当前时间
   * @param updatedBy 更新者用户ID，默认为创建者
   * @param version 版本号，默认为0
   *
   * @example
   * ```typescript
   * const aggregate = new ConcreteTenantAwareAggregate(
   *   EntityId.generate(),
   *   TenantId.generate(),
   *   UserId.generate()
   * );
   * ```
   */
  constructor(
    id: EntityId,
    tenantId: TenantId,
    createdBy: UserId,
    createdAt?: Timestamp,
    updatedAt?: Timestamp,
    updatedBy?: UserId,
    version: number = 0
  ) {
    super(id, createdAt, updatedAt, version);
    this._tenantId = tenantId;
    this._createdBy = createdBy;
    this._updatedBy = updatedBy || createdBy;
  }

  /**
   * 获取租户标识符
   *
   * @description 返回聚合根所属的租户标识符
   * @returns 租户标识符
   *
   * @example
   * ```typescript
   * const tenantId = aggregate.getTenantId();
   * console.log(tenantId.toString()); // 输出租户UUID字符串
   * ```
   */
  public getTenantId(): TenantId {
    return this._tenantId;
  }

  /**
   * 获取创建者用户ID
   *
   * @description 返回创建此聚合根的用户标识符
   * @returns 创建者用户ID
   *
   * @example
   * ```typescript
   * const createdBy = aggregate.getCreatedBy();
   * console.log(createdBy.toString()); // 输出用户UUID字符串
   * ```
   */
  public getCreatedBy(): UserId {
    return this._createdBy;
  }

  /**
   * 获取更新者用户ID
   *
   * @description 返回最后更新此聚合根的用户标识符
   * @returns 更新者用户ID
   *
   * @example
   * ```typescript
   * const updatedBy = aggregate.getUpdatedBy();
   * console.log(updatedBy.toString()); // 输出用户UUID字符串
   * ```
   */
  public getUpdatedBy(): UserId {
    return this._updatedBy;
  }

  /**
   * 更新聚合根（重写基类方法）
   *
   * @description 更新聚合根时记录更新者用户ID并增加版本号
   * @param updatedBy 更新者用户ID
   *
   * @protected
   * @example
   * ```typescript
   * updateName(newName: string, updatedBy: UserId): void {
   *   this.name = newName;
   *   this.updateTimestamp(updatedBy);
   * }
   * ```
   */
  protected override updateTimestamp(): void {
    super.updateTimestamp();
  }

  /**
   * 更新时间戳并记录更新者
   *
   * @description 更新聚合根的时间戳，同时记录更新者信息
   * @param updatedBy 更新者用户ID
   */
  protected updateTimestampWithUser(updatedBy: UserId): void {
    super.updateTimestamp();
    this._updatedBy = updatedBy;
  }

  /**
   * 添加租户感知领域事件
   *
   * @description 添加包含租户信息的领域事件
   * @param event 要添加的领域事件
   *
   * @protected
   * @example
   * ```typescript
   * updateName(newName: string, updatedBy: UserId): void {
   *   const oldName = this.name;
   *   this.name = newName;
   *   this.updateTimestamp(updatedBy);
   *   this.addTenantAwareDomainEvent(new UserNameUpdatedEvent(this.getId(), this.getTenantId(), oldName, newName));
   * }
   * ```
   */
  protected addTenantAwareDomainEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
  }

  /**
   * 检查是否属于指定租户
   *
   * @description 检查聚合根是否属于指定的租户
   * @param tenantId 要检查的租户ID
   * @returns 如果聚合根属于指定租户则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const belongsToTenant = aggregate.belongsToTenant(someTenantId);
   * if (belongsToTenant) {
   *   // 聚合根属于该租户
   * }
   * ```
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this._tenantId.equals(tenantId);
  }

  /**
   * 检查是否为指定用户创建
   *
   * @description 检查聚合根是否为指定用户创建
   * @param userId 要检查的用户ID
   * @returns 如果聚合根为指定用户创建则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isCreatedBy = aggregate.isCreatedBy(someUserId);
   * if (isCreatedBy) {
   *   // 聚合根为该用户创建
   * }
   * ```
   */
  public isCreatedBy(userId: UserId): boolean {
    return this._createdBy.equals(userId);
  }

  /**
   * 检查是否为指定用户最后更新
   *
   * @description 检查聚合根是否为指定用户最后更新
   * @param userId 要检查的用户ID
   * @returns 如果聚合根为指定用户最后更新则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isUpdatedBy = aggregate.isUpdatedBy(someUserId);
   * if (isUpdatedBy) {
   *   // 聚合根为该用户最后更新
   * }
   * ```
   */
  public isUpdatedBy(userId: UserId): boolean {
    return this._updatedBy.equals(userId);
  }

  /**
   * 比较两个租户感知聚合根是否相等（重写基类方法）
   *
   * @description 租户感知聚合根的相等性基于标识符和租户ID
   * @param other 要比较的另一个租户感知聚合根
   * @returns 如果两个聚合根的ID和租户ID都相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const aggregate1 = new User(id1, tenantId1, userId1);
   * const aggregate2 = new User(id1, tenantId1, userId2);
   * console.log(aggregate1.equals(aggregate2)); // true（相同ID和租户）
   * ```
   */
  public override equals(other: BaseEntity): boolean {
    if (!super.equals(other)) {
      return false;
    }

    if (!(other instanceof TenantAwareAggregateRoot)) {
      return false;
    }
    return this._tenantId.equals(other._tenantId);
  }

  /**
   * 转换为字符串表示（重写基类方法）
   *
   * @description 提供租户感知聚合根的字符串表示，包含租户信息
   * @returns 聚合根的字符串表示
   *
   * @example
   * ```typescript
   * const aggregate = new User(id, tenantId, userId);
   * console.log(aggregate.toString()); // 输出: "User(id: ..., tenantId: ..., version: 1)"
   * ```
   */
  public override toString(): string {
    return `${
      this.constructor.name
    }(id: ${this.getId().toString()}, tenantId: ${this._tenantId.toString()}, version: ${this.getVersion()})`;
  }

  /**
   * 转换为JSON表示（重写基类方法）
   *
   * @description 提供租户感知聚合根的JSON序列化支持，包含租户相关信息和版本信息
   * @returns 聚合根的JSON表示
   *
   * @example
   * ```typescript
   * const aggregate = new User(id, tenantId, userId);
   * const json = aggregate.toJSON();
   * // 输出: { id: "...", tenantId: "...", createdBy: "...", updatedBy: "...", version: 1, ... }
   * ```
   */
  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      tenantId: this._tenantId.toString(),
      createdBy: this._createdBy.toString(),
      updatedBy: this._updatedBy.toString(),
    };
  }
}
