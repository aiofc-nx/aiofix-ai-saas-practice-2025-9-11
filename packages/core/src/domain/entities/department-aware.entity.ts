import { TenantAwareEntity } from './tenant-aware.entity';
import { EntityId } from '../value-objects/entity-id';
import { TenantId } from '../value-objects/tenant-id';
import { UserId } from '../value-objects/user-id';
import { Timestamp } from '../../shared/types/common';

/**
 * 部门感知实体类
 *
 * 部门感知实体是多部门架构中的核心概念，每个实体都属于特定的部门。
 * 提供部门级别的数据隔离和权限控制功能。
 *
 * @description 所有需要部门隔离的实体的基类
 * 提供部门ID、租户ID、创建者、更新者等部门相关属性
 *
 * ## 业务规则
 *
 * ### 部门隔离规则
 * - 每个实体必须属于特定的部门
 * - 部门ID在实体创建时设置，不可变更
 * - 跨部门的数据访问被严格禁止
 * - 所有查询操作必须包含部门上下文
 * - 部门级别的数据完全隔离
 *
 * ### 层级权限规则
 * - 部门实体继承租户级别的权限控制
 * - 支持部门内部的用户级别权限控制
 * - 用户只能访问其所属部门的数据
 * - 跨部门操作需要特殊权限验证
 * - 权限验证基于租户、部门和用户身份
 *
 * ### 数据安全规则
 * - 所有数据操作必须验证部门上下文
 * - 敏感数据访问需要额外的权限验证
 * - 支持数据加密和脱敏处理
 * - 审计日志记录所有数据访问操作
 * - 数据备份和恢复考虑部门隔离
 *
 * ## 业务逻辑流程
 *
 * 1. **实体创建**：通过构造函数创建部门感知实体
 * 2. **部门验证**：验证部门ID的有效性和权限
 * 3. **用户追踪**：记录创建者和初始更新者
 * 4. **状态管理**：通过业务方法管理实体状态
 * 5. **权限检查**：每次操作前验证部门权限
 * 6. **审计记录**：记录所有状态变更和操作者
 *
 * @example
 * ```typescript
 * class Task extends DepartmentAwareEntity {
 *   constructor(
 *     id: EntityId,
 *     tenantId: TenantId,
 *     departmentId: EntityId,
 *     createdBy: UserId,
 *     private title: string,
 *     private description: string
 *   ) {
 *     super(id, tenantId, departmentId, createdBy);
 *   }
 *
 *   getTitle(): string {
 *     return this.title;
 *   }
 *
 *   updateTitle(newTitle: string, updatedBy: UserId): void {
 *     this.title = newTitle;
 *     this.updateTimestampWithUser(updatedBy);
 *   }
 * }
 *
 * // 创建部门感知实体
 * const task = new Task(
 *   EntityId.generate(),
 *   tenantId,
 *   departmentId,
 *   createdBy,
 *   '任务A',
 *   '任务描述'
 * );
 *
 * // 更新实体信息
 * task.updateTitle('任务B', updatedBy);
 *
 * // 验证部门归属
 * const belongsToDepartment = task.belongsToDepartment(departmentId);
 * ```
 *
 * @since 1.0.0
 */
export abstract class DepartmentAwareEntity extends TenantAwareEntity {
  private readonly _departmentId: EntityId;

  /**
   * 构造函数
   *
   * @description 创建部门感知实体实例
   * @param id 实体的唯一标识符
   * @param tenantId 租户标识符
   * @param departmentId 部门标识符
   * @param createdBy 创建者用户ID
   * @param createdAt 创建时间，默认为当前时间
   * @param updatedAt 更新时间，默认为当前时间
   * @param updatedBy 更新者用户ID，默认为创建者
   *
   * @example
   * ```typescript
   * const entity = new ConcreteDepartmentAwareEntity(
   *   EntityId.generate(),
   *   TenantId.generate(),
   *   EntityId.generate(),
   *   UserId.generate()
   * );
   * ```
   */
  constructor(
    id: EntityId,
    tenantId: TenantId,
    departmentId: EntityId,
    createdBy: UserId,
    createdAt?: Timestamp,
    updatedAt?: Timestamp,
    updatedBy?: UserId
  ) {
    super(id, tenantId, createdBy, createdAt, updatedAt, updatedBy);
    this._departmentId = departmentId;
  }

  /**
   * 获取部门标识符
   *
   * @description 返回实体所属的部门标识符
   * @returns 部门标识符
   *
   * @example
   * ```typescript
   * const departmentId = entity.getDepartmentId();
   * console.log(departmentId.toString()); // 输出部门UUID字符串
   * ```
   */
  public getDepartmentId(): EntityId {
    return this._departmentId;
  }

  /**
   * 检查是否属于指定部门
   *
   * @description 检查实体是否属于指定的部门
   * @param departmentId 要检查的部门ID
   * @returns 如果实体属于指定部门则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const belongsToDepartment = entity.belongsToDepartment(someDepartmentId);
   * if (belongsToDepartment) {
   *   // 实体属于该部门
   * }
   * ```
   */
  public belongsToDepartment(departmentId: EntityId): boolean {
    return this._departmentId.equals(departmentId);
  }

  /**
   * 验证部门访问权限
   *
   * @description 验证当前实体是否属于指定的部门，如果不属于则抛出异常
   * @param departmentId 要验证的部门ID
   * @throws {Error} 当实体不属于指定部门时抛出
   *
   * @protected
   * @example
   * ```typescript
   * updateTitle(newTitle: string, departmentId: EntityId, updatedBy: UserId): void {
   *   this.validateDepartmentAccess(departmentId);
   *   this.title = newTitle;
   *   this.updateTimestampWithUser(updatedBy);
   * }
   * ```
   */
  protected validateDepartmentAccess(departmentId: EntityId): void {
    if (!this._departmentId.equals(departmentId)) {
      throw new Error('Access denied: different department');
    }
  }

  /**
   * 比较两个部门感知实体是否相等（重写基类方法）
   *
   * @description 部门感知实体的相等性基于标识符、租户ID和部门ID
   * @param other 要比较的另一个部门感知实体
   * @returns 如果两个实体的ID、租户ID和部门ID都相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const entity1 = new Task(id1, tenantId1, departmentId1, userId1);
   * const entity2 = new Task(id1, tenantId1, departmentId1, userId2);
   * console.log(entity1.equals(entity2)); // true（相同ID、租户和部门）
   * ```
   */
  public override equals(other: any): boolean {
    if (!super.equals(other)) {
      return false;
    }

    if (!(other instanceof DepartmentAwareEntity)) {
      return false;
    }
    return this._departmentId.equals(other._departmentId);
  }

  /**
   * 转换为字符串表示（重写基类方法）
   *
   * @description 提供部门感知实体的字符串表示，包含部门和租户信息
   * @returns 实体的字符串表示
   *
   * @example
   * ```typescript
   * const entity = new Task(id, tenantId, departmentId, userId);
   * console.log(entity.toString()); // 输出: "Task(id: ..., tenantId: ..., departmentId: ...)"
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
   * @description 提供部门感知实体的JSON序列化支持，包含部门相关信息
   * @returns 实体的JSON表示
   *
   * @example
   * ```typescript
   * const entity = new Task(id, tenantId, departmentId, userId);
   * const json = entity.toJSON();
   * // 输出: { id: "...", tenantId: "...", departmentId: "...", createdBy: "...", updatedBy: "...", createdAt: "...", updatedAt: "..." }
   * ```
   */
  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      departmentId: this._departmentId.toString(),
    };
  }
}
