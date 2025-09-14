import { BaseAggregateRoot } from '../aggregates/base.aggregate-root';
import { DomainEvent } from '../aggregates/base.aggregate-root';
import { EntityId } from '../value-objects/entity-id';

/**
 * 事件溯源仓储接口
 *
 * 事件溯源仓储是事件驱动架构中的核心组件，负责通过事件流重建聚合根状态。
 * 提供事件的保存、检索和聚合根状态重建功能。
 *
 * @description 定义事件溯源仓储的标准接口，所有事件溯源仓储都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 事件存储规则
 * - 所有领域事件必须持久化存储
 * - 事件存储必须保证事件的顺序性
 * - 事件存储必须支持事件的版本控制
 * - 事件存储必须支持事件的一致性保证
 *
 * ### 聚合根重建规则
 * - 通过事件流重建聚合根状态
 * - 支持从任意版本开始重建
 * - 支持增量重建和全量重建
 * - 重建过程必须保证状态一致性
 *
 * ### 版本控制规则
 * - 支持聚合根的乐观锁并发控制
 * - 版本冲突时抛出ConcurrencyError
 * - 支持版本号的自动管理
 * - 支持版本冲突的检测和处理
 *
 * ### 事务管理规则
 * - 事件保存必须在事务中进行
 * - 事务失败时必须完全回滚
 * - 支持嵌套事务和事务传播
 * - 支持事务的补偿机制
 *
 * ### 性能优化规则
 * - 支持事件的批量保存和检索
 * - 支持事件的缓存机制
 * - 支持事件的压缩和归档
 * - 支持事件的性能监控
 *
 * ## 业务逻辑流程
 *
 * 1. **事件保存**：保存聚合根的未提交事件
 * 2. **版本检查**：检查聚合根的版本一致性
 * 3. **事务开始**：开始数据库事务
 * 4. **事件持久化**：将事件保存到事件存储
 * 5. **状态更新**：更新聚合根的状态快照
 * 6. **事务提交**：提交数据库事务
 * 7. **事件发布**：发布事件到事件总线
 * 8. **结果返回**：返回保存结果
 *
 * @template TAggregate 聚合根类型
 *
 * @example
 * ```typescript
 * class UserEventSourcingRepository implements IEventSourcingRepository<User> {
 *   async save(aggregate: User): Promise<void> {
 *     // 实现用户聚合根的保存逻辑
 *   }
 *
 *   async getById(id: EntityId): Promise<User | null> {
 *     // 实现通过事件流重建用户聚合根
 *   }
 *
 *   async getEvents(id: EntityId): Promise<DomainEvent[]> {
 *     // 实现获取用户的所有事件
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface IEventSourcingRepository<
  TAggregate extends BaseAggregateRoot
> {
  /**
   * 保存聚合根
   *
   * @description 保存聚合根及其未提交的事件到事件存储
   *
   * ## 业务规则
   *
   * ### 事件保存规则
   * - 保存聚合根的所有未提交事件
   * - 事件保存必须保证顺序性
   * - 事件保存必须支持版本控制
   * - 事件保存失败时回滚整个操作
   *
   * ### 版本控制规则
   * - 检查聚合根的版本一致性
   * - 版本冲突时抛出ConcurrencyError
   * - 自动更新聚合根版本号
   * - 支持版本冲突的检测和处理
   *
   * ### 事务管理规则
   * - 保存操作必须在事务中进行
   * - 事务失败时完全回滚
   * - 支持嵌套事务和事务传播
   * - 支持事务的补偿机制
   *
   * ### 状态快照规则
   * - 支持聚合根状态的快照保存
   * - 快照保存失败不影响事件保存
   * - 支持快照的增量更新
   * - 支持快照的压缩和归档
   *
   * @param aggregate - 要保存的聚合根
   * @returns 保存结果
   *
   * @throws {ConcurrencyError} 当版本冲突时抛出
   * @throws {Error} 当保存失败时抛出
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), tenantId, name, email, createdBy);
   * await userEventSourcingRepository.save(user);
   * console.log('用户保存成功');
   * ```
   */
  save(aggregate: TAggregate): Promise<void>;

  /**
   * 根据ID获取聚合根
   *
   * @description 通过事件流重建聚合根状态
   *
   * ## 业务规则
   *
   * ### 事件检索规则
   * - 按顺序检索聚合根的所有事件
   * - 支持从指定版本开始检索
   * - 支持增量检索和全量检索
   * - 事件检索必须保证完整性
   *
   * ### 状态重建规则
   * - 通过事件流重建聚合根状态
   * - 重建过程必须保证状态一致性
   * - 支持从任意版本开始重建
   * - 重建失败时抛出相应异常
   *
   * ### 缓存优化规则
   * - 支持聚合根状态的缓存
   * - 缓存失效时自动重建
   * - 支持缓存的增量更新
   * - 支持缓存的性能优化
   *
   * ### 性能优化规则
   * - 支持快照加速重建过程
   * - 支持事件的批量检索
   * - 支持重建过程的监控
   * - 支持重建的性能优化
   *
   * @param id - 聚合根的唯一标识符
   * @param version - 目标版本，可选，默认获取最新版本
   * @returns 聚合根实例或null（如果不存在）
   *
   * @throws {Error} 当重建失败时抛出
   *
   * @example
   * ```typescript
   * // 获取最新版本的聚合根
   * const user = await userEventSourcingRepository.getById(userId);
   *
   * // 获取指定版本的聚合根
   * const userAtVersion = await userEventSourcingRepository.getById(userId, 5);
   * ```
   */
  getById(id: EntityId, version?: number): Promise<TAggregate | null>;

  /**
   * 获取聚合根的所有事件
   *
   * @description 获取指定聚合根的所有领域事件
   *
   * ## 业务规则
   *
   * ### 事件检索规则
   * - 按时间顺序检索所有事件
   * - 支持分页检索避免大数据量
   * - 支持按版本范围检索
   * - 事件检索必须保证完整性
   *
   * ### 过滤规则
   * - 支持按事件类型过滤
   * - 支持按时间范围过滤
   * - 支持按版本范围过滤
   * - 支持按事件属性过滤
   *
   * ### 性能优化规则
   * - 支持事件的批量检索
   * - 支持事件的缓存机制
   * - 支持事件的压缩和归档
   * - 支持检索的性能监控
   *
   * @param id - 聚合根的唯一标识符
   * @param options - 检索选项，包括分页、过滤、排序等
   * @returns 事件数组，可能为空数组
   *
   * @throws {Error} 当检索失败时抛出
   *
   * @example
   * ```typescript
   * // 获取所有事件
   * const events = await userEventSourcingRepository.getEvents(userId);
   *
   * // 获取分页事件
   * const events = await userEventSourcingRepository.getEvents(userId, {
   *   page: 1,
   *   limit: 20,
   *   eventType: 'UserCreated'
   * });
   * ```
   */
  getEvents(
    id: EntityId,
    options?: {
      page?: number;
      limit?: number;
      eventType?: string;
      fromVersion?: number;
      toVersion?: number;
      fromDate?: Date;
      toDate?: Date;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<DomainEvent[]>;

  /**
   * 获取聚合根的版本信息
   *
   * @description 获取指定聚合根的版本信息
   *
   * ## 业务规则
   *
   * ### 版本信息规则
   * - 返回聚合根的当前版本号
   * - 返回聚合根的创建时间
   * - 返回聚合根的最后更新时间
   * - 返回聚合根的事件数量
   *
   * ### 性能优化规则
   * - 使用轻量级的查询获取版本信息
   * - 支持版本信息的缓存
   * - 避免加载完整的聚合根数据
   * - 支持批量版本信息获取
   *
   * @param id - 聚合根的唯一标识符
   * @returns 版本信息对象
   *
   * @throws {Error} 当获取失败时抛出
   *
   * @example
   * ```typescript
   * const versionInfo = await userEventSourcingRepository.getVersionInfo(userId);
   * console.log(`当前版本: ${versionInfo.currentVersion}`);
   * console.log(`事件数量: ${versionInfo.eventCount}`);
   * ```
   */
  getVersionInfo(id: EntityId): Promise<{
    currentVersion: number;
    eventCount: number;
    createdAt: Date;
    updatedAt: Date;
  } | null>;

  /**
   * 检查聚合根是否存在
   *
   * @description 检查指定ID的聚合根是否存在
   *
   * ## 业务规则
   *
   * ### 存在性检查规则
   * - 根据聚合根ID检查存在性
   * - 支持软删除的聚合根过滤
   * - 支持缓存的存在性检查
   * - 检查结果返回布尔值
   *
   * ### 性能优化规则
   * - 使用轻量级的查询检查存在性
   * - 支持存在性检查的缓存
   * - 避免加载完整的聚合根数据
   * - 支持批量存在性检查
   *
   * @param id - 聚合根的唯一标识符
   * @returns 如果聚合根存在则返回true，否则返回false
   *
   * @throws {Error} 当检查失败时抛出
   *
   * @example
   * ```typescript
   * const exists = await userEventSourcingRepository.exists(userId);
   * if (exists) {
   *   console.log('用户存在');
   * } else {
   *   console.log('用户不存在');
   * }
   * ```
   */
  exists(id: EntityId): Promise<boolean>;

  /**
   * 删除聚合根
   *
   * @description 删除指定的聚合根及其所有事件
   *
   * ## 业务规则
   *
   * ### 删除规则
   * - 支持软删除，保留事件用于审计
   * - 支持硬删除，永久删除事件
   * - 删除前验证聚合根的存在性
   * - 删除操作记录审计日志
   *
   * ### 关联数据处理规则
   * - 删除前检查聚合根的关联数据
   * - 支持级联删除或约束检查
   * - 删除失败时提供详细错误信息
   * - 支持删除的补偿机制
   *
   * ### 事务管理规则
   * - 删除操作必须在事务中进行
   * - 事务失败时完全回滚
   * - 支持嵌套事务和事务传播
   * - 支持事务的补偿机制
   *
   * ### 权限控制规则
   * - 验证用户对聚合根的删除权限
   * - 支持角色权限和资源权限验证
   * - 权限验证失败时抛出相应异常
   * - 记录删除操作的审计日志
   *
   * @param id - 要删除的聚合根ID
   * @param options - 删除选项，包括软删除、硬删除等
   * @returns 删除结果
   *
   * @throws {EntityNotFoundError} 当聚合根不存在时抛出
   * @throws {PermissionDeniedError} 当权限不足时抛出
   * @throws {Error} 当删除失败时抛出
   *
   * @example
   * ```typescript
   * // 软删除
   * await userEventSourcingRepository.delete(userId);
   *
   * // 硬删除
   * await userEventSourcingRepository.delete(userId, { hard: true });
   * ```
   */
  delete(id: EntityId, options?: { hard?: boolean }): Promise<void>;
}
