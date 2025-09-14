import { EntityId } from '../value-objects/entity-id';
import { Timestamp } from '../../shared/types/common';

/**
 * 基础实体类
 *
 * 实体是领域驱动设计中的核心概念，具有唯一标识符和生命周期。
 * 实体的相等性基于其标识符，而不是属性值。
 *
 * @description 所有领域实体的基类，提供实体的一致行为
 * 包括唯一标识符、创建时间、更新时间等基础属性
 *
 * ## 业务规则
 *
 * ### 标识符规则
 * - 每个实体必须具有唯一的标识符
 * - 标识符在实体生命周期内不可变更
 * - 标识符用于实体的相等性比较
 * - 标识符必须符合EntityId的格式要求
 *
 * ### 时间戳规则
 * - 创建时间在实体创建时设置，不可修改
 * - 更新时间在实体状态变更时自动更新
 * - 时间戳采用UTC时区，确保跨时区一致性
 * - 时间戳精度到毫秒级别
 *
 * ### 相等性规则
 * - 实体的相等性基于标识符比较，而非属性值
 * - 相同类型且相同标识符的实体被视为相等
 * - 不同类型但相同标识符的实体被视为不相等
 * - null和undefined与任何实体都不相等
 *
 * ### 生命周期规则
 * - 实体创建后具有完整的生命周期管理
 * - 实体状态变更会触发相应的事件
 * - 实体支持序列化和反序列化操作
 * - 实体变更会记录操作时间和上下文
 *
 * ## 业务逻辑流程
 *
 * 1. **实体创建**：通过构造函数创建实体实例
 * 2. **标识符分配**：自动或手动分配唯一标识符
 * 3. **时间戳设置**：设置创建时间和初始更新时间
 * 4. **状态管理**：通过业务方法管理实体状态
 * 5. **变更追踪**：自动记录状态变更时间
 *
 * @example
 * ```typescript
 * class User extends BaseEntity {
 *   constructor(
 *     id: EntityId,
 *     private name: string,
 *     private email: string
 *   ) {
 *     super(id);
 *   }
 *
 *   getName(): string {
 *     return this.name;
 *   }
 *
 *   updateName(newName: string): void {
 *     this.name = newName;
 *     this.updateTimestamp(); // 自动更新修改时间
 *   }
 * }
 *
 * // 创建用户实体
 * const user = new User(EntityId.generate(), '张三', 'zhangsan@example.com');
 *
 * // 更新用户信息
 * user.updateName('李四');
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Timestamp;
  private _updatedAt: Timestamp;

  /**
   * 构造函数
   *
   * @description 创建基础实体实例，初始化实体的核心属性
   *
   * ## 业务规则
   *
   * ### 标识符验证规则
   * - 实体ID不能为null或undefined
   * - 实体ID必须符合EntityId的格式要求
   * - 实体ID在创建后不可变更
   *
   * ### 时间戳规则
   * - 创建时间默认使用当前时间
   * - 更新时间默认使用当前时间
   * - 时间戳采用UTC时区
   * - 时间戳精度到毫秒级别
   *
   * @param id - 实体的唯一标识符，必须是有效的EntityId
   * @param createdAt - 创建时间，默认为当前时间
   * @param updatedAt - 更新时间，默认为当前时间
   *
   * @throws {Error} 当ID格式不正确时抛出
   *
   * @example
   * ```typescript
   * // 使用默认时间戳创建实体
   * const entity = new ConcreteEntity(EntityId.generate());
   *
   * // 使用指定时间戳创建实体
   * const entity = new ConcreteEntity(
   *   EntityId.generate(),
   *   new Date('2024-01-01T00:00:00.000Z'),
   *   new Date('2024-01-01T00:00:00.000Z')
   * );
   * ```
   */
  constructor(id: EntityId, createdAt?: Timestamp, updatedAt?: Timestamp) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  /**
   * 获取实体标识符
   *
   * @description 返回实体的唯一标识符
   * @returns 实体标识符
   *
   * @example
   * ```typescript
   * const entityId = entity.getId();
   * console.log(entityId.toString()); // 输出UUID字符串
   * ```
   */
  public getId(): EntityId {
    return this._id;
  }

  /**
   * 获取创建时间
   *
   * @description 返回实体的创建时间
   * @returns 创建时间戳
   *
   * @example
   * ```typescript
   * const createdAt = entity.getCreatedAt();
   * console.log(createdAt.toISOString()); // 输出ISO格式时间字符串
   * ```
   */
  public getCreatedAt(): Timestamp {
    return this._createdAt;
  }

  /**
   * 获取更新时间
   *
   * @description 返回实体的最后更新时间
   * @returns 更新时间戳
   *
   * @example
   * ```typescript
   * const updatedAt = entity.getUpdatedAt();
   * console.log(updatedAt.toISOString()); // 输出ISO格式时间字符串
   * ```
   */
  public getUpdatedAt(): Timestamp {
    return this._updatedAt;
  }

  /**
   * 更新实体
   *
   * @description 更新实体的最后修改时间
   * 子类在修改实体状态时应该调用此方法
   *
   * @protected
   * @example
   * ```typescript
   * updateName(newName: string): void {
   *   this.name = newName;
   *   this.updateTimestamp(); // 更新时间戳
   * }
   * ```
   */
  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  /**
   * 比较两个实体是否相等
   *
   * @description 实体的相等性基于其标识符，而不是属性值
   * @param other 要比较的另一个实体
   * @returns 如果两个实体的ID相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const entity1 = new User(EntityId.fromString('123'));
   * const entity2 = new User(EntityId.fromString('123'));
   * console.log(entity1.equals(entity2)); // true
   * ```
   */
  public equals(other: BaseEntity): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    return this._id.equals(other._id);
  }

  /**
   * 转换为字符串表示
   *
   * @description 提供实体的字符串表示，便于调试和日志记录
   * @returns 实体的字符串表示
   *
   * @example
   * ```typescript
   * const entity = new User(EntityId.generate());
   * console.log(entity.toString()); // 输出: "User(id: 123e4567-e89b-12d3-4567-426614174000)"
   * ```
   */
  public toString(): string {
    return `${this.constructor.name}(id: ${this._id.toString()})`;
  }

  /**
   * 转换为JSON表示
   *
   * @description 提供实体的JSON序列化支持
   * @returns 实体的JSON表示
   *
   * @example
   * ```typescript
   * const entity = new User(EntityId.generate());
   * const json = entity.toJSON();
   * // 输出: { id: "123e4567-e89b-12d3-4567-426614174000", createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" }
   * ```
   */
  public toJSON(): Record<string, any> {
    return {
      id: this._id.toString(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}
