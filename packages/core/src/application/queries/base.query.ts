import { EntityId } from '../../domain/value-objects/entity-id';
import { Timestamp } from '../../shared/types/common';

/**
 * 基础查询类
 *
 * 查询是CQRS模式中的核心概念，用于表示用户或系统发起的只读操作。
 * 查询封装了获取数据所需的所有条件，并通过查询总线路由到相应的处理器。
 *
 * @description 所有查询的基类，提供查询的一致行为
 * 包括查询ID、时间戳、用户上下文等基础属性
 *
 * ## 业务规则
 *
 * ### 查询标识规则
 * - 每个查询必须具有唯一的查询ID
 * - 查询ID采用UUID格式，确保全局唯一性
 * - 查询ID用于查询的追踪和缓存
 * - 查询ID在查询创建时生成，不可变更
 *
 * ### 时间戳规则
 * - 查询发起时间记录查询的发起时间
 * - 时间戳采用UTC时区，确保跨时区一致性
 * - 时间戳精度到毫秒级别
 * - 时间戳用于查询的排序和审计
 *
 * ### 用户上下文规则
 * - 查询必须包含发起用户的信息
 * - 用户ID用于权限验证和数据过滤
 * - 支持系统查询（系统用户发起）
 * - 用户上下文在查询执行时验证
 *
 * ### 查询验证规则
 * - 查询创建时必须验证所有必需字段
 * - 查询条件必须符合业务规则
 * - 验证失败的查询不能提交到查询总线
 * - 支持查询的预验证和延迟验证
 *
 * ### 查询执行规则
 * - 查询通过查询总线路由到处理器
 * - 查询处理器负责执行数据检索逻辑
 * - 查询结果通过Result类型返回
 * - 支持查询的缓存和性能优化
 *
 * ### 数据安全规则
 * - 查询结果必须符合用户权限
 * - 支持多租户数据隔离
 * - 敏感数据访问需要额外验证
 * - 查询操作记录审计日志
 *
 * ## 业务逻辑流程
 *
 * 1. **查询创建**：通过构造函数创建查询实例
 * 2. **条件验证**：验证查询条件的完整性和有效性
 * 3. **权限检查**：验证用户对查询数据的访问权限
 * 4. **查询提交**：将查询提交到查询总线
 * 5. **路由分发**：查询总线根据查询类型路由到处理器
 * 6. **数据检索**：查询处理器执行数据检索逻辑
 * 7. **结果过滤**：根据用户权限过滤查询结果
 * 8. **结果返回**：返回查询执行结果
 *
 * @example
 * ```typescript
 * class GetUserByIdQuery extends BaseQuery {
 *   constructor(
 *     public readonly userId: EntityId,
 *     queryId?: EntityId,
 *     initiatedBy?: EntityId,
 *     initiatedAt?: Timestamp
 *   ) {
 *     super(queryId, initiatedBy, initiatedAt);
 *   }
 *
 *   validate(): void {
 *     if (!this.userId) {
 *       throw new Error('用户ID不能为空');
 *     }
 *   }
 * }
 *
 * // 创建查询
 * const query = new GetUserByIdQuery(
 *   userId,
 *   undefined,
 *   currentUserId
 * );
 *
 * // 执行查询
 * const result = await queryBus.execute(query);
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseQuery {
  public readonly queryId: EntityId;
  public readonly initiatedBy: EntityId;
  public readonly initiatedAt: Timestamp;

  /**
   * 构造函数
   *
   * @description 创建基础查询实例，初始化查询的核心属性
   *
   * ## 业务规则
   *
   * ### 标识符验证规则
   * - 查询ID不能为null或undefined
   * - 查询ID必须符合EntityId的格式要求
   * - 查询ID在创建后不可变更
   *
   * ### 用户上下文验证规则
   * - 发起用户ID不能为null或undefined
   * - 发起用户ID必须符合EntityId的格式要求
   * - 支持系统用户（系统查询）
   *
   * ### 时间戳规则
   * - 发起时间默认使用当前时间
   * - 时间戳采用UTC时区
   * - 时间戳精度到毫秒级别
   *
   * @param queryId - 查询的唯一标识符，默认为新生成的ID
   * @param initiatedBy - 发起查询的用户ID，默认为系统用户
   * @param initiatedAt - 查询发起时间，默认为当前时间
   *
   * @throws {Error} 当ID格式不正确时抛出
   *
   * @example
   * ```typescript
   * // 使用默认参数创建查询
   * const query = new ConcreteQuery(criteria);
   *
   * // 使用指定参数创建查询
   * const query = new ConcreteQuery(
   *   criteria,
   *   EntityId.generate(),
   *   userId,
   *   new Date()
   * );
   * ```
   */
  constructor(
    queryId?: EntityId,
    initiatedBy?: EntityId,
    initiatedAt?: Timestamp
  ) {
    this.queryId = queryId || EntityId.generate();
    this.initiatedBy =
      initiatedBy ||
      EntityId.fromString('00000000-0000-0000-0000-000000000000'); // 系统用户ID
    this.initiatedAt = initiatedAt || new Date();
  }

  /**
   * 获取查询标识符
   *
   * @description 返回查询的唯一标识符
   * @returns 查询标识符
   *
   * @example
   * ```typescript
   * const queryId = query.getQueryId();
   * console.log(queryId.toString()); // 输出查询UUID字符串
   * ```
   */
  public getQueryId(): EntityId {
    return this.queryId;
  }

  /**
   * 获取发起用户ID
   *
   * @description 返回发起查询的用户标识符
   * @returns 发起用户ID
   *
   * @example
   * ```typescript
   * const initiatedBy = query.getInitiatedBy();
   * console.log(initiatedBy.toString()); // 输出用户UUID字符串
   * ```
   */
  public getInitiatedBy(): EntityId {
    return this.initiatedBy;
  }

  /**
   * 获取查询发起时间
   *
   * @description 返回查询发起的时间戳
   * @returns 查询发起时间
   *
   * @example
   * ```typescript
   * const initiatedAt = query.getInitiatedAt();
   * console.log(initiatedAt.toISOString()); // 输出ISO格式时间字符串
   * ```
   */
  public getInitiatedAt(): Timestamp {
    return this.initiatedAt;
  }

  /**
   * 验证查询条件
   *
   * @description 验证查询条件的完整性和有效性
   * 子类应该重写此方法来实现具体的验证逻辑
   *
   * @throws {Error} 当查询条件无效时抛出
   *
   * @example
   * ```typescript
   * class GetUserByIdQuery extends BaseQuery {
   *   validate(): void {
   *     if (!this.userId) {
   *       throw new Error('用户ID不能为空');
   *     }
   *     // 其他验证逻辑...
   *   }
   * }
   * ```
   */
  public validate(): void {
    // 默认实现为空，子类可以重写
  }

  /**
   * 转换为字符串表示
   *
   * @description 提供查询的字符串表示，便于调试和日志记录
   * @returns 查询的字符串表示
   *
   * @example
   * ```typescript
   * const query = new GetUserByIdQuery(userId);
   * console.log(query.toString()); // 输出: "GetUserByIdQuery(id: ..., initiatedBy: ...)"
   * ```
   */
  public toString(): string {
    return `${
      this.constructor.name
    }(queryId: ${this.queryId.toString()}, initiatedBy: ${this.initiatedBy.toString()})`;
  }

  /**
   * 转换为JSON表示
   *
   * @description 提供查询的JSON序列化支持
   * @returns 查询的JSON表示
   *
   * @example
   * ```typescript
   * const query = new GetUserByIdQuery(userId);
   * const json = query.toJSON();
   * // 输出: { queryId: "...", initiatedBy: "...", initiatedAt: "...", ... }
   * ```
   */
  public toJSON(): Record<string, any> {
    return {
      queryId: this.queryId.toString(),
      initiatedBy: this.initiatedBy.toString(),
      initiatedAt: this.initiatedAt.toISOString(),
    };
  }

  /**
   * 比较两个查询是否相等
   *
   * @description 查询的相等性基于查询ID
   * @param other 要比较的另一个查询
   * @returns 如果两个查询的ID相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const query1 = new GetUserByIdQuery(userId1);
   * const query2 = new GetUserByIdQuery(userId2);
   * console.log(query1.equals(query2)); // false（不同的查询ID）
   * ```
   */
  public equals(other: BaseQuery): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return this.queryId.equals(other.queryId);
  }
}
