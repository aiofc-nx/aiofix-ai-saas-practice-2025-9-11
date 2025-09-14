import { BaseEntity } from '../entities/base.entity';
import { EntityId } from '../value-objects/entity-id';

/**
 * 基础仓储接口
 *
 * 仓储是领域驱动设计中的重要概念，用于抽象数据访问逻辑。
 * 仓储提供了聚合根的持久化接口，将领域模型与数据访问技术分离。
 *
 * @description 定义仓储的标准接口，所有仓储都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 数据访问规则
 * - 仓储只能通过聚合根ID访问数据
 * - 仓储不能直接暴露数据访问技术细节
 * - 仓储必须保证数据访问的一致性
 * - 仓储必须支持事务管理
 *
 * ### 聚合根管理规则
 * - 仓储负责聚合根的保存和检索
 * - 仓储必须维护聚合根的完整性
 * - 仓储必须支持聚合根的版本控制
 * - 仓储必须支持聚合根的软删除
 *
 * ### 事务管理规则
 * - 仓储操作必须在事务中进行
 * - 支持嵌套事务和事务传播
 * - 事务失败时必须完全回滚
 * - 支持事务的补偿机制
 *
 * ### 并发控制规则
 * - 仓储必须支持乐观锁并发控制
 * - 版本冲突时抛出ConcurrencyError
 * - 支持聚合根的并发更新
 * - 支持并发冲突的检测和处理
 *
 * ### 缓存管理规则
 * - 仓储可以支持查询结果缓存
 * - 缓存失效时自动更新
 * - 支持缓存的一致性保证
 * - 支持缓存的性能优化
 *
 * ## 业务逻辑流程
 *
 * 1. **聚合根保存**：接收聚合根并保存到存储
 * 2. **版本检查**：检查聚合根的版本一致性
 * 3. **事务开始**：开始数据库事务
 * 4. **数据持久化**：将聚合根状态保存到存储
 * 5. **事件保存**：保存聚合根的领域事件
 * 6. **事务提交**：提交数据库事务
 * 7. **缓存更新**：更新相关缓存
 * 8. **结果返回**：返回保存结果
 *
 * @template TEntity 聚合根类型
 *
 * @example
 * ```typescript
 * class UserRepository implements IBaseRepository<User> {
 *   async findById(id: EntityId): Promise<User | null> {
 *     // 实现根据ID查找用户
 *   }
 *
 *   async save(user: User): Promise<void> {
 *     // 实现用户保存逻辑
 *   }
 *
 *   async delete(id: EntityId): Promise<void> {
 *     // 实现用户删除逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface IBaseRepository<TEntity extends BaseEntity> {
  /**
   * 根据ID查找聚合根
   *
   * @description 根据聚合根ID查找指定的聚合根
   *
   * ## 业务规则
   *
   * ### 查找规则
   * - 根据聚合根ID进行精确查找
   * - 支持软删除的聚合根过滤
   * - 支持聚合根的版本检查
   * - 查找失败时返回null
   *
   * ### 缓存规则
   * - 支持查找结果的缓存
   * - 缓存失效时自动更新
   * - 支持缓存的一致性保证
   * - 支持缓存的性能优化
   *
   * ### 异常处理规则
   * - 数据访问异常转换为领域异常
   * - 记录详细的错误日志
   * - 不泄露敏感的系统信息
   * - 支持异常的重试机制
   *
   * @param id - 聚合根的唯一标识符
   * @returns 聚合根实例或null（如果不存在）
   *
   * @throws {Error} 当数据访问失败时抛出
   *
   * @example
   * ```typescript
   * const user = await userRepository.findById(userId);
   * if (user) {
   *   console.log('找到用户:', user.getName());
   * } else {
   *   console.log('用户不存在');
   * }
   * ```
   */
  findById(id: EntityId): Promise<TEntity | null>;

  /**
   * 保存聚合根
   *
   * @description 保存聚合根到持久化存储，包括新增和更新操作
   *
   * ## 业务规则
   *
   * ### 保存规则
   * - 支持聚合根的新增和更新
   * - 自动检测聚合根是新增还是更新
   * - 保存聚合根的所有状态变更
   * - 保存聚合根的领域事件
   *
   * ### 版本控制规则
   * - 支持乐观锁并发控制
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
   * ### 事件保存规则
   * - 保存聚合根的未提交事件
   * - 事件保存失败时回滚整个操作
   * - 支持事件的批量保存
   * - 支持事件的一致性保证
   *
   * @param entity - 要保存的聚合根
   * @returns 保存结果
   *
   * @throws {ConcurrencyError} 当版本冲突时抛出
   * @throws {Error} 当保存失败时抛出
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), tenantId, name, email, createdBy);
   * await userRepository.save(user);
   * console.log('用户保存成功');
   * ```
   */
  save(entity: TEntity): Promise<void>;

  /**
   * 删除聚合根
   *
   * @description 删除指定的聚合根，支持软删除和硬删除
   *
   * ## 业务规则
   *
   * ### 删除规则
   * - 默认使用软删除，保留数据用于审计
   * - 支持硬删除，永久删除数据
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
   * await userRepository.delete(userId);
   *
   * // 硬删除
   * await userRepository.delete(userId, { hard: true });
   * ```
   */
  delete(id: EntityId, options?: { hard?: boolean }): Promise<void>;

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
   * @example
   * ```typescript
   * const exists = await userRepository.exists(userId);
   * if (exists) {
   *   console.log('用户存在');
   * } else {
   *   console.log('用户不存在');
   * }
   * ```
   */
  exists(id: EntityId): Promise<boolean>;

  /**
   * 获取聚合根数量
   *
   * @description 获取满足条件的聚合根数量
   *
   * ## 业务规则
   *
   * ### 计数规则
   * - 支持条件过滤的计数
   * - 支持软删除的聚合根过滤
   * - 支持缓存的计数结果
   * - 计数结果返回数字类型
   *
   * ### 性能优化规则
   * - 使用高效的计数查询
   * - 支持计数结果的缓存
   * - 避免加载完整数据
   * - 支持批量计数操作
   *
   * @param criteria - 计数条件，可选
   * @returns 聚合根数量
   *
   * @example
   * ```typescript
   * // 获取所有用户数量
   * const totalCount = await userRepository.count();
   *
   * // 获取满足条件的用户数量
   * const activeCount = await userRepository.count({ status: 'ACTIVE' });
   * ```
   */
  count(criteria?: Record<string, any>): Promise<number>;
}
