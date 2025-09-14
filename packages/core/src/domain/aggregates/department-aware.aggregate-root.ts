import { TenantAwareAggregateRoot } from './tenant-aware.aggregate-root';
import { EntityId } from '../value-objects/entity-id';
import { TenantId } from '../value-objects/tenant-id';
import { UserId } from '../value-objects/user-id';
import { Timestamp } from '../../shared/types/common';
// import { DomainEvent } from './base.aggregate-root'; // 暂时未使用

/**
 * 部门感知聚合根类
 *
 * 部门感知聚合根是多部门架构中的核心概念，每个聚合根都属于特定的部门。
 * 提供部门级别的事件管理和权限控制功能。
 *
 * @description 所有需要部门隔离的聚合根的基类
 * 提供部门ID、租户ID、事件管理等部门相关功能
 *
 * ## 业务规则
 *
 * ### 部门隔离规则
 * - 每个聚合根必须属于特定的部门
 * - 部门ID在聚合根创建时设置，不可变更
 * - 跨部门的数据访问被严格禁止
 * - 所有查询操作必须包含部门上下文
 * - 部门级别的数据完全隔离
 *
 * ### 事件管理规则
 * - 部门聚合根负责管理部门级别的领域事件
 * - 事件在聚合根状态变更时自动添加
 * - 事件通过事件总线发布到外部系统
 * - 事件发布后自动标记为已提交
 * - 支持事件的批量处理和发布
 *
 * ### 权限控制规则
 * - 部门聚合根继承租户级别的权限控制
 * - 支持部门内部的用户级别权限控制
 * - 用户只能访问其所属部门的聚合根
 * - 跨部门操作需要特殊权限验证
 * - 权限验证基于租户、部门和用户身份
 *
 * ## 业务逻辑流程
 *
 * 1. **聚合根创建**：通过构造函数创建部门感知聚合根
 * 2. **部门验证**：验证部门ID的有效性和权限
 * 3. **业务操作**：执行业务方法修改聚合根状态
 * 4. **事件添加**：业务操作完成后添加相应事件
 * 5. **版本更新**：状态变更时自动增加版本号
 * 6. **事件发布**：通过事件总线发布领域事件
 *
 * @example
 * ```typescript
 * class Task extends DepartmentAwareAggregateRoot {
 *   constructor(
 *     id: EntityId,
 *     tenantId: TenantId,
 *     departmentId: EntityId,
 *     private title: string,
 *     private description: string
 *   ) {
 *     super(id, tenantId, departmentId);
 *     this.addDomainEvent(new TaskCreatedEvent(id, tenantId, departmentId, title, description));
 *   }
 *
 *   updateTitle(newTitle: string): void {
 *     const oldTitle = this.title;
 *     this.title = newTitle;
 *     this.addDomainEvent(new TaskTitleUpdatedEvent(this.getId(), this.getTenantId(), this.getDepartmentId(), oldTitle, newTitle));
 *   }
 * }
 *
 * // 创建部门感知聚合根
 * const task = new Task(
 *   EntityId.generate(),
 *   tenantId,
 *   departmentId,
 *   '任务A',
 *   '任务描述'
 * );
 *
 * // 更新聚合根信息
 * task.updateTitle('任务B');
 *
 * // 发布事件
 * const events = task.getUncommittedEvents();
 * await eventBus.publishAll(events);
 * task.markEventsAsCommitted();
 * ```
 *
 * @since 1.0.0
 */
export abstract class DepartmentAwareAggregateRoot extends TenantAwareAggregateRoot {
  private readonly _departmentId: EntityId;

  /**
   * 构造函数
   *
   * @description 创建部门感知聚合根实例
   * @param id 聚合根的唯一标识符
   * @param tenantId 租户标识符
   * @param departmentId 部门标识符
   * @param createdAt 创建时间，默认为当前时间
   * @param updatedAt 更新时间，默认为当前时间
   * @param version 版本号，默认为0
   *
   * @example
   * ```typescript
   * const aggregate = new ConcreteDepartmentAwareAggregate(
   *   EntityId.generate(),
   *   TenantId.generate(),
   *   EntityId.generate()
   * );
   * ```
   */
  constructor(
    id: EntityId,
    tenantId: TenantId,
    departmentId: EntityId,
    createdBy: UserId,
    version: number = 0
  ) {
    super(id, tenantId, createdBy, undefined, undefined, undefined, version);
    this._departmentId = departmentId;
  }

  /**
   * 获取部门标识符
   *
   * @description 返回聚合根所属的部门标识符
   * @returns 部门标识符
   *
   * @example
   * ```typescript
   * const departmentId = aggregate.getDepartmentId();
   * console.log(departmentId.toString()); // 输出部门UUID字符串
   * ```
   */
  public getDepartmentId(): EntityId {
    return this._departmentId;
  }

  /**
   * 检查是否属于指定部门
   *
   * @description 检查聚合根是否属于指定的部门
   * @param departmentId 要检查的部门ID
   * @returns 如果聚合根属于指定部门则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const belongsToDepartment = aggregate.belongsToDepartment(someDepartmentId);
   * if (belongsToDepartment) {
   *   // 聚合根属于该部门
   * }
   * ```
   */
  public belongsToDepartment(departmentId: EntityId): boolean {
    return this._departmentId.equals(departmentId);
  }

  /**
   * 验证部门访问权限
   *
   * @description 验证当前聚合根是否属于指定的部门，如果不属于则抛出异常
   * @param departmentId 要验证的部门ID
   * @throws {Error} 当聚合根不属于指定部门时抛出
   *
   * @protected
   * @example
   * ```typescript
   * updateTitle(newTitle: string, departmentId: EntityId): void {
   *   this.validateDepartmentContext(departmentId);
   *   const oldTitle = this.title;
   *   this.title = newTitle;
   *   this.addDomainEvent(new TaskTitleUpdatedEvent(this.getId(), this.getTenantId(), departmentId, oldTitle, newTitle));
   * }
   * ```
   */
  protected validateDepartmentContext(departmentId: EntityId): void {
    if (!this._departmentId.equals(departmentId)) {
      throw new Error('Access denied: different department');
    }
  }

  /**
   * 比较两个部门感知聚合根是否相等（重写基类方法）
   *
   * @description 部门感知聚合根的相等性基于标识符、租户ID和部门ID
   * @param other 要比较的另一个部门感知聚合根
   * @returns 如果两个聚合根的ID、租户ID和部门ID都相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const aggregate1 = new Task(id1, tenantId1, departmentId1);
   * const aggregate2 = new Task(id1, tenantId1, departmentId1);
   * console.log(aggregate1.equals(aggregate2)); // true（相同ID、租户和部门）
   * ```
   */
  public override equals(other: any): boolean {
    if (!super.equals(other)) {
      return false;
    }

    if (!(other instanceof DepartmentAwareAggregateRoot)) {
      return false;
    }
    return this._departmentId.equals(other._departmentId);
  }

  /**
   * 转换为字符串表示（重写基类方法）
   *
   * @description 提供部门感知聚合根的字符串表示，包含部门和租户信息
   * @returns 聚合根的字符串表示
   *
   * @example
   * ```typescript
   * const aggregate = new Task(id, tenantId, departmentId);
   * console.log(aggregate.toString()); // 输出: "Task(id: ..., tenantId: ..., departmentId: ...)"
   * ```
   */
  public override toString(): string {
    return `${
      this.constructor.name
    }(id: ${this.getId().toString()}, tenantId: ${this.getTenantId().toString()}, departmentId: ${this._departmentId.toString()})`;
  }

  /**
   * 转换为JSON表示（重写基类方法）
   *
   * @description 提供部门感知聚合根的JSON序列化支持，包含部门相关信息
   * @returns 聚合根的JSON表示
   *
   * @example
   * ```typescript
   * const aggregate = new Task(id, tenantId, departmentId);
   * const json = aggregate.toJSON();
   * // 输出: { id: "...", tenantId: "...", departmentId: "...", version: 1, uncommittedEventCount: 0 }
   * ```
   */
  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      departmentId: this._departmentId.toString(),
    };
  }
}
