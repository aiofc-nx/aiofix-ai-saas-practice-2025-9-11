import { TenantAwareEntity } from './tenant-aware.entity';
import { EntityId } from '../value-objects/entity-id';
import { TenantId } from '../value-objects/tenant-id';
import { OrganizationId } from '../value-objects/organization-id';
import { UserId } from '../value-objects/user-id';
import { Timestamp } from '../../shared/types/common';

/**
 * 组织感知实体类
 *
 * 组织感知实体是多组织架构中的核心概念，每个实体都属于特定的组织。
 * 提供组织级别的数据隔离和权限控制功能。
 *
 * @description 所有需要组织隔离的实体的基类
 * 提供组织ID、租户ID、创建者、更新者等组织相关属性
 *
 * ## 业务规则
 *
 * ### 组织隔离规则
 * - 每个实体必须属于特定的组织
 * - 组织ID在实体创建时设置，不可变更
 * - 跨组织的数据访问被严格禁止
 * - 所有查询操作必须包含组织上下文
 * - 组织级别的数据完全隔离
 *
 * ### 层级权限规则
 * - 组织实体继承租户级别的权限控制
 * - 支持组织内部的部门级别权限控制
 * - 用户只能访问其所属组织的数据
 * - 跨组织操作需要特殊权限验证
 * - 权限验证基于租户、组织和用户身份
 *
 * ### 数据安全规则
 * - 所有数据操作必须验证组织上下文
 * - 敏感数据访问需要额外的权限验证
 * - 支持数据加密和脱敏处理
 * - 审计日志记录所有数据访问操作
 * - 数据备份和恢复考虑组织隔离
 *
 * ## 业务逻辑流程
 *
 * 1. **实体创建**：通过构造函数创建组织感知实体
 * 2. **组织验证**：验证组织ID的有效性和权限
 * 3. **用户追踪**：记录创建者和初始更新者
 * 4. **状态管理**：通过业务方法管理实体状态
 * 5. **权限检查**：每次操作前验证组织权限
 * 6. **审计记录**：记录所有状态变更和操作者
 *
 * @example
 * ```typescript
 * class Project extends OrganizationAwareEntity {
 *   constructor(
 *     id: EntityId,
 *     tenantId: TenantId,
 *     organizationId: OrganizationId,
 *     createdBy: UserId,
 *     private name: string,
 *     private description: string
 *   ) {
 *     super(id, tenantId, organizationId, createdBy);
 *   }
 *
 *   getName(): string {
 *     return this.name;
 *   }
 *
 *   updateName(newName: string, updatedBy: UserId): void {
 *     this.name = newName;
 *     this.updateTimestampWithUser(updatedBy);
 *   }
 * }
 *
 * // 创建组织感知实体
 * const project = new Project(
 *   EntityId.generate(),
 *   tenantId,
 *   organizationId,
 *   createdBy,
 *   '项目A',
 *   '项目描述'
 * );
 *
 * // 更新实体信息
 * project.updateName('项目B', updatedBy);
 *
 * // 验证组织归属
 * const belongsToOrganization = project.belongsToOrganization(organizationId);
 * ```
 *
 * @since 1.0.0
 */
export abstract class OrganizationAwareEntity extends TenantAwareEntity {
  private readonly _organizationId: OrganizationId;

  /**
   * 构造函数
   *
   * @description 创建组织感知实体实例
   * @param id 实体的唯一标识符
   * @param tenantId 租户标识符
   * @param organizationId 组织标识符
   * @param createdBy 创建者用户ID
   * @param createdAt 创建时间，默认为当前时间
   * @param updatedAt 更新时间，默认为当前时间
   * @param updatedBy 更新者用户ID，默认为创建者
   *
   * @example
   * ```typescript
   * const entity = new ConcreteOrganizationAwareEntity(
   *   EntityId.generate(),
   *   TenantId.generate(),
   *   OrganizationId.generate(),
   *   UserId.generate()
   * );
   * ```
   */
  constructor(
    id: EntityId,
    tenantId: TenantId,
    organizationId: OrganizationId,
    createdBy: UserId,
    createdAt?: Timestamp,
    updatedAt?: Timestamp,
    updatedBy?: UserId
  ) {
    super(id, tenantId, createdBy, createdAt, updatedAt, updatedBy);
    this._organizationId = organizationId;
  }

  /**
   * 获取组织标识符
   *
   * @description 返回实体所属的组织标识符
   * @returns 组织标识符
   *
   * @example
   * ```typescript
   * const organizationId = entity.getOrganizationId();
   * console.log(organizationId.toString()); // 输出组织UUID字符串
   * ```
   */
  public getOrganizationId(): OrganizationId {
    return this._organizationId;
  }

  /**
   * 检查是否属于指定组织
   *
   * @description 检查实体是否属于指定的组织
   * @param organizationId 要检查的组织ID
   * @returns 如果实体属于指定组织则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const belongsToOrganization = entity.belongsToOrganization(someOrganizationId);
   * if (belongsToOrganization) {
   *   // 实体属于该组织
   * }
   * ```
   */
  public belongsToOrganization(organizationId: OrganizationId): boolean {
    return this._organizationId.equals(organizationId);
  }

  /**
   * 验证组织访问权限
   *
   * @description 验证当前实体是否属于指定的组织，如果不属于则抛出异常
   * @param organizationId 要验证的组织ID
   * @throws {ForbiddenError} 当实体不属于指定组织时抛出
   *
   * @protected
   * @example
   * ```typescript
   * updateName(newName: string, organizationId: OrganizationId, updatedBy: UserId): void {
   *   this.validateOrganizationAccess(organizationId);
   *   this.name = newName;
   *   this.updateTimestampWithUser(updatedBy);
   * }
   * ```
   */
  protected validateOrganizationAccess(organizationId: OrganizationId): void {
    if (!this._organizationId.equals(organizationId)) {
      throw new Error('Access denied: different organization');
    }
  }

  /**
   * 比较两个组织感知实体是否相等（重写基类方法）
   *
   * @description 组织感知实体的相等性基于标识符、租户ID和组织ID
   * @param other 要比较的另一个组织感知实体
   * @returns 如果两个实体的ID、租户ID和组织ID都相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const entity1 = new Project(id1, tenantId1, organizationId1, userId1);
   * const entity2 = new Project(id1, tenantId1, organizationId1, userId2);
   * console.log(entity1.equals(entity2)); // true（相同ID、租户和组织）
   * ```
   */
  public override equals(other: any): boolean {
    if (!super.equals(other)) {
      return false;
    }

    if (!(other instanceof OrganizationAwareEntity)) {
      return false;
    }
    return this._organizationId.equals(other._organizationId);
  }

  /**
   * 转换为字符串表示（重写基类方法）
   *
   * @description 提供组织感知实体的字符串表示，包含组织和租户信息
   * @returns 实体的字符串表示
   *
   * @example
   * ```typescript
   * const entity = new Project(id, tenantId, organizationId, userId);
   * console.log(entity.toString()); // 输出: "Project(id: ..., tenantId: ..., organizationId: ...)"
   * ```
   */
  public override toString(): string {
    return `${
      this.constructor.name
    }(id: ${this.getId().toString()}, tenantId: ${this.getTenantId().toString()}, organizationId: ${this._organizationId.toString()})`;
  }

  /**
   * 转换为JSON表示（重写基类方法）
   *
   * @description 提供组织感知实体的JSON序列化支持，包含组织相关信息
   * @returns 实体的JSON表示
   *
   * @example
   * ```typescript
   * const entity = new Project(id, tenantId, organizationId, userId);
   * const json = entity.toJSON();
   * // 输出: { id: "...", tenantId: "...", organizationId: "...", createdBy: "...", updatedBy: "...", createdAt: "...", updatedAt: "..." }
   * ```
   */
  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      organizationId: this._organizationId.toString(),
    };
  }
}
