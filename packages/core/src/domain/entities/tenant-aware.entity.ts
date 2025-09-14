import { BaseEntity } from './base.entity';
import { EntityId } from '../value-objects/entity-id';
import { TenantId } from '../value-objects/tenant-id';
import { UserId } from '../value-objects/user-id';
import { Timestamp } from '../../shared/types/common';

/**
 * 租户感知实体类
 *
 * 租户感知实体是多租户架构中的核心概念，每个实体都属于特定的租户。
 * 提供租户隔离和权限控制的基础功能。
 *
 * @description 所有需要租户隔离的实体的基类
 * 提供租户ID、创建者、更新者等租户相关属性
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 每个实体必须属于特定的租户
 * - 租户ID在实体创建时设置，不可变更
 * - 跨租户的数据访问被严格禁止
 * - 所有查询操作必须包含租户上下文
 * - 租户级别的数据完全隔离
 *
 * ### 用户追踪规则
 * - 实体创建时必须记录创建者用户ID
 * - 实体更新时必须记录更新者用户ID
 * - 用户ID用于审计追踪和权限控制
 * - 支持创建者和更新者的查询和验证
 * - 用户ID变更会触发相应的事件
 *
 * ### 权限控制规则
 * - 用户只能访问其所属租户的数据
 * - 跨租户操作需要特殊权限验证
 * - 支持组织级别和部门级别的权限控制
 * - 权限验证基于租户上下文和用户身份
 * - 权限变更会触发相应的安全事件
 *
 * ### 数据安全规则
 * - 所有数据操作必须验证租户上下文
 * - 敏感数据访问需要额外的权限验证
 * - 支持数据加密和脱敏处理
 * - 审计日志记录所有数据访问操作
 * - 数据备份和恢复考虑租户隔离
 *
 * ## 业务逻辑流程
 *
 * 1. **实体创建**：通过构造函数创建租户感知实体
 * 2. **租户验证**：验证租户ID的有效性和权限
 * 3. **用户追踪**：记录创建者和初始更新者
 * 4. **状态管理**：通过业务方法管理实体状态
 * 5. **权限检查**：每次操作前验证租户权限
 * 6. **审计记录**：记录所有状态变更和操作者
 *
 * @example
 * ```typescript
 * class UserProfile extends TenantAwareEntity {
 *   constructor(
 *     id: EntityId,
 *     tenantId: TenantId,
 *     createdBy: UserId,
 *     private name: string,
 *     private email: string
 *   ) {
 *     super(id, tenantId, createdBy);
 *   }
 *
 *   getName(): string {
 *     return this.name;
 *   }
 *
 *   updateName(newName: string, updatedBy: UserId): void {
 *     this.name = newName;
 *     this.updateTimestamp(updatedBy);
 *   }
 * }
 *
 * // 创建租户感知实体
 * const profile = new UserProfile(
 *   EntityId.generate(),
 *   tenantId,
 *   createdBy,
 *   '张三',
 *   'zhangsan@example.com'
 * );
 *
 * // 更新实体信息
 * profile.updateName('李四', updatedBy);
 *
 * // 验证租户归属
 * const belongsToTenant = profile.belongsToTenant(tenantId);
 * ```
 *
 * @since 1.0.0
 */
export abstract class TenantAwareEntity extends BaseEntity {
  private readonly _tenantId: TenantId;
  private readonly _createdBy: UserId;
  private _updatedBy: UserId;

  /**
   * 构造函数
   *
   * @description 创建租户感知实体实例
   * @param id 实体的唯一标识符
   * @param tenantId 租户标识符
   * @param createdBy 创建者用户ID
   * @param createdAt 创建时间，默认为当前时间
   * @param updatedAt 更新时间，默认为当前时间
   * @param updatedBy 更新者用户ID，默认为创建者
   *
   * @example
   * ```typescript
   * const entity = new ConcreteTenantAwareEntity(
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
    updatedBy?: UserId
  ) {
    super(id, createdAt, updatedAt);
    this._tenantId = tenantId;
    this._createdBy = createdBy;
    this._updatedBy = updatedBy || createdBy;
  }

  /**
   * 获取租户标识符
   *
   * @description 返回实体所属的租户标识符
   * @returns 租户标识符
   *
   * @example
   * ```typescript
   * const tenantId = entity.getTenantId();
   * console.log(tenantId.toString()); // 输出租户UUID字符串
   * ```
   */
  public getTenantId(): TenantId {
    return this._tenantId;
  }

  /**
   * 获取创建者用户ID
   *
   * @description 返回创建此实体的用户标识符
   * @returns 创建者用户ID
   *
   * @example
   * ```typescript
   * const createdBy = entity.getCreatedBy();
   * console.log(createdBy.toString()); // 输出用户UUID字符串
   * ```
   */
  public getCreatedBy(): UserId {
    return this._createdBy;
  }

  /**
   * 获取更新者用户ID
   *
   * @description 返回最后更新此实体的用户标识符
   * @returns 更新者用户ID
   *
   * @example
   * ```typescript
   * const updatedBy = entity.getUpdatedBy();
   * console.log(updatedBy.toString()); // 输出用户UUID字符串
   * ```
   */
  public getUpdatedBy(): UserId {
    return this._updatedBy;
  }

  /**
   * 更新实体（重写基类方法）
   *
   * @description 更新实体时记录更新者用户ID
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
   * @description 更新实体的时间戳，同时记录更新者信息
   * @param updatedBy 更新者用户ID
   */
  protected updateTimestampWithUser(updatedBy: UserId): void {
    super.updateTimestamp();
    this._updatedBy = updatedBy;
  }

  /**
   * 检查是否属于指定租户
   *
   * @description 检查实体是否属于指定的租户
   * @param tenantId 要检查的租户ID
   * @returns 如果实体属于指定租户则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const belongsToTenant = entity.belongsToTenant(someTenantId);
   * if (belongsToTenant) {
   *   // 实体属于该租户
   * }
   * ```
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this._tenantId.equals(tenantId);
  }

  /**
   * 检查是否为指定用户创建
   *
   * @description 检查实体是否为指定用户创建
   * @param userId 要检查的用户ID
   * @returns 如果实体为指定用户创建则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isCreatedBy = entity.isCreatedBy(someUserId);
   * if (isCreatedBy) {
   *   // 实体为该用户创建
   * }
   * ```
   */
  public isCreatedBy(userId: UserId): boolean {
    return this._createdBy.equals(userId);
  }

  /**
   * 检查是否为指定用户最后更新
   *
   * @description 检查实体是否为指定用户最后更新
   * @param userId 要检查的用户ID
   * @returns 如果实体为指定用户最后更新则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isUpdatedBy = entity.isUpdatedBy(someUserId);
   * if (isUpdatedBy) {
   *   // 实体为该用户最后更新
   * }
   * ```
   */
  public isUpdatedBy(userId: UserId): boolean {
    return this._updatedBy.equals(userId);
  }

  /**
   * 比较两个租户感知实体是否相等（重写基类方法）
   *
   * @description 租户感知实体的相等性基于标识符和租户ID
   * @param other 要比较的另一个租户感知实体
   * @returns 如果两个实体的ID和租户ID都相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const entity1 = new UserProfile(id1, tenantId1, userId1);
   * const entity2 = new UserProfile(id1, tenantId1, userId2);
   * console.log(entity1.equals(entity2)); // true（相同ID和租户）
   * ```
   */
  public override equals(other: BaseEntity): boolean {
    if (!super.equals(other)) {
      return false;
    }

    if (!(other instanceof TenantAwareEntity)) {
      return false;
    }
    return this._tenantId.equals(other._tenantId);
  }

  /**
   * 转换为字符串表示（重写基类方法）
   *
   * @description 提供租户感知实体的字符串表示，包含租户信息
   * @returns 实体的字符串表示
   *
   * @example
   * ```typescript
   * const entity = new UserProfile(id, tenantId, userId);
   * console.log(entity.toString()); // 输出: "UserProfile(id: ..., tenantId: ...)"
   * ```
   */
  public override toString(): string {
    return `${
      this.constructor.name
    }(id: ${this.getId().toString()}, tenantId: ${this._tenantId.toString()})`;
  }

  /**
   * 转换为JSON表示（重写基类方法）
   *
   * @description 提供租户感知实体的JSON序列化支持，包含租户相关信息
   * @returns 实体的JSON表示
   *
   * @example
   * ```typescript
   * const entity = new UserProfile(id, tenantId, userId);
   * const json = entity.toJSON();
   * // 输出: { id: "...", tenantId: "...", createdBy: "...", updatedBy: "...", createdAt: "...", updatedAt: "..." }
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
