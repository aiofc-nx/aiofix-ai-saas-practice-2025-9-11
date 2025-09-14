import { TenantAwareAggregateRoot } from './tenant-aware.aggregate-root';
import { EntityId } from '../value-objects/entity-id';
import { TenantId } from '../value-objects/tenant-id';
import { OrganizationId } from '../value-objects/organization-id';
import { UserId } from '../value-objects/user-id';
import { Timestamp } from '../../shared/types/common';
// import { DomainEvent } from './base.aggregate-root'; // 暂时未使用

/**
 * 组织感知聚合根类
 *
 * 组织感知聚合根是多组织架构中的核心概念，每个聚合根都属于特定的组织。
 * 提供组织级别的事件管理和权限控制功能。
 *
 * @description 所有需要组织隔离的聚合根的基类
 * 提供组织ID、租户ID、事件管理等组织相关功能
 *
 * ## 业务规则
 *
 * ### 组织隔离规则
 * - 每个聚合根必须属于特定的组织
 * - 组织ID在聚合根创建时设置，不可变更
 * - 跨组织的数据访问被严格禁止
 * - 所有查询操作必须包含组织上下文
 * - 组织级别的数据完全隔离
 *
 * ### 事件管理规则
 * - 组织聚合根负责管理组织级别的领域事件
 * - 事件在聚合根状态变更时自动添加
 * - 事件通过事件总线发布到外部系统
 * - 事件发布后自动标记为已提交
 * - 支持事件的批量处理和发布
 *
 * ### 权限控制规则
 * - 组织聚合根继承租户级别的权限控制
 * - 支持组织内部的部门级别权限控制
 * - 用户只能访问其所属组织的聚合根
 * - 跨组织操作需要特殊权限验证
 * - 权限验证基于租户、组织和用户身份
 *
 * ## 业务逻辑流程
 *
 * 1. **聚合根创建**：通过构造函数创建组织感知聚合根
 * 2. **组织验证**：验证组织ID的有效性和权限
 * 3. **业务操作**：执行业务方法修改聚合根状态
 * 4. **事件添加**：业务操作完成后添加相应事件
 * 5. **版本更新**：状态变更时自动增加版本号
 * 6. **事件发布**：通过事件总线发布领域事件
 *
 * @example
 * ```typescript
 * class Project extends OrganizationAwareAggregateRoot {
 *   constructor(
 *     id: EntityId,
 *     tenantId: TenantId,
 *     organizationId: OrganizationId,
 *     private name: string,
 *     private description: string
 *   ) {
 *     super(id, tenantId, organizationId);
 *     this.addDomainEvent(new ProjectCreatedEvent(id, tenantId, organizationId, name, description));
 *   }
 *
 *   updateName(newName: string): void {
 *     const oldName = this.name;
 *     this.name = newName;
 *     this.addDomainEvent(new ProjectNameUpdatedEvent(this.getId(), this.getTenantId(), this.getOrganizationId(), oldName, newName));
 *   }
 * }
 *
 * // 创建组织感知聚合根
 * const project = new Project(
 *   EntityId.generate(),
 *   tenantId,
 *   organizationId,
 *   '项目A',
 *   '项目描述'
 * );
 *
 * // 更新聚合根信息
 * project.updateName('项目B');
 *
 * // 发布事件
 * const events = project.getUncommittedEvents();
 * await eventBus.publishAll(events);
 * project.markEventsAsCommitted();
 * ```
 *
 * @since 1.0.0
 */
export abstract class OrganizationAwareAggregateRoot extends TenantAwareAggregateRoot {
  private readonly _organizationId: OrganizationId;

  /**
   * 构造函数
   *
   * @description 创建组织感知聚合根实例
   * @param id 聚合根的唯一标识符
   * @param tenantId 租户标识符
   * @param organizationId 组织标识符
   * @param createdAt 创建时间，默认为当前时间
   * @param updatedAt 更新时间，默认为当前时间
   * @param version 版本号，默认为0
   *
   * @example
   * ```typescript
   * const aggregate = new ConcreteOrganizationAwareAggregate(
   *   EntityId.generate(),
   *   TenantId.generate(),
   *   OrganizationId.generate()
   * );
   * ```
   */
  constructor(
    id: EntityId,
    tenantId: TenantId,
    organizationId: OrganizationId,
    createdBy: UserId,
    version: number = 0
  ) {
    super(id, tenantId, createdBy, undefined, undefined, undefined, version);
    this._organizationId = organizationId;
  }

  /**
   * 获取组织标识符
   *
   * @description 返回聚合根所属的组织标识符
   * @returns 组织标识符
   *
   * @example
   * ```typescript
   * const organizationId = aggregate.getOrganizationId();
   * console.log(organizationId.toString()); // 输出组织UUID字符串
   * ```
   */
  public getOrganizationId(): OrganizationId {
    return this._organizationId;
  }

  /**
   * 检查是否属于指定组织
   *
   * @description 检查聚合根是否属于指定的组织
   * @param organizationId 要检查的组织ID
   * @returns 如果聚合根属于指定组织则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const belongsToOrganization = aggregate.belongsToOrganization(someOrganizationId);
   * if (belongsToOrganization) {
   *   // 聚合根属于该组织
   * }
   * ```
   */
  public belongsToOrganization(organizationId: OrganizationId): boolean {
    return this._organizationId.equals(organizationId);
  }

  /**
   * 验证组织访问权限
   *
   * @description 验证当前聚合根是否属于指定的组织，如果不属于则抛出异常
   * @param organizationId 要验证的组织ID
   * @throws {Error} 当聚合根不属于指定组织时抛出
   *
   * @protected
   * @example
   * ```typescript
   * updateName(newName: string, organizationId: OrganizationId): void {
   *   this.validateOrganizationContext(organizationId);
   *   const oldName = this.name;
   *   this.name = newName;
   *   this.addDomainEvent(new ProjectNameUpdatedEvent(this.getId(), this.getTenantId(), organizationId, oldName, newName));
   * }
   * ```
   */
  protected validateOrganizationContext(organizationId: OrganizationId): void {
    if (!this._organizationId.equals(organizationId)) {
      throw new Error('Access denied: different organization');
    }
  }

  /**
   * 比较两个组织感知聚合根是否相等（重写基类方法）
   *
   * @description 组织感知聚合根的相等性基于标识符、租户ID和组织ID
   * @param other 要比较的另一个组织感知聚合根
   * @returns 如果两个聚合根的ID、租户ID和组织ID都相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const aggregate1 = new Project(id1, tenantId1, organizationId1);
   * const aggregate2 = new Project(id1, tenantId1, organizationId1);
   * console.log(aggregate1.equals(aggregate2)); // true（相同ID、租户和组织）
   * ```
   */
  public override equals(other: any): boolean {
    if (!super.equals(other)) {
      return false;
    }

    if (!(other instanceof OrganizationAwareAggregateRoot)) {
      return false;
    }
    return this._organizationId.equals(other._organizationId);
  }

  /**
   * 转换为字符串表示（重写基类方法）
   *
   * @description 提供组织感知聚合根的字符串表示，包含组织和租户信息
   * @returns 聚合根的字符串表示
   *
   * @example
   * ```typescript
   * const aggregate = new Project(id, tenantId, organizationId);
   * console.log(aggregate.toString()); // 输出: "Project(id: ..., tenantId: ..., organizationId: ...)"
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
   * @description 提供组织感知聚合根的JSON序列化支持，包含组织相关信息
   * @returns 聚合根的JSON表示
   *
   * @example
   * ```typescript
   * const aggregate = new Project(id, tenantId, organizationId);
   * const json = aggregate.toJSON();
   * // 输出: { id: "...", tenantId: "...", organizationId: "...", version: 1, uncommittedEventCount: 0 }
   * ```
   */
  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      organizationId: this._organizationId.toString(),
    };
  }
}
