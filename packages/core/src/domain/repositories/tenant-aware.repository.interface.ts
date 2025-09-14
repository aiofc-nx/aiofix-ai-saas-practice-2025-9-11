import { TenantAwareEntity } from '../entities/tenant-aware.entity';
import { EntityId } from '../value-objects/entity-id';
import { TenantId } from '../value-objects/tenant-id';
import { UserId } from '../value-objects/user-id';

/**
 * 租户感知仓储接口
 *
 * 租户感知仓储是多租户架构中的核心组件，负责管理租户级别的数据访问。
 * 提供租户隔离、权限控制和数据安全的基础功能。
 *
 * @description 定义租户感知仓储的标准接口，所有租户感知仓储都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 所有数据访问必须包含租户上下文
 * - 跨租户的数据访问被严格禁止
 * - 支持租户级别的数据隔离
 * - 支持组织级别和部门级别的数据隔离
 *
 * ### 权限控制规则
 * - 验证用户对租户数据的访问权限
 * - 支持角色权限和资源权限验证
 * - 权限验证失败时抛出相应异常
 * - 记录数据访问的审计日志
 *
 * ### 数据安全规则
 * - 所有数据操作必须验证租户上下文
 * - 敏感数据访问需要额外的权限验证
 * - 支持数据加密和脱敏处理
 * - 审计日志记录所有数据访问操作
 *
 * ### 查询优化规则
 * - 支持租户级别的查询优化
 * - 支持租户级别的索引优化
 * - 支持租户级别的缓存策略
 * - 支持租户级别的性能监控
 *
 * ### 事务管理规则
 * - 租户级别的数据操作必须在事务中进行
 * - 支持租户级别的事务隔离
 * - 事务失败时必须完全回滚
 * - 支持租户级别的事务补偿
 *
 * ## 业务逻辑流程
 *
 * 1. **租户验证**：验证租户ID的有效性和权限
 * 2. **权限检查**：验证用户对租户数据的访问权限
 * 3. **数据访问**：在租户上下文中执行数据操作
 * 4. **结果过滤**：根据用户权限过滤查询结果
 * 5. **审计记录**：记录数据访问的审计日志
 * 6. **事务管理**：管理租户级别的事务
 * 7. **缓存更新**：更新租户级别的缓存
 * 8. **结果返回**：返回操作结果
 *
 * @template TEntity 租户感知实体类型
 *
 * @example
 * ```typescript
 * class UserProfileRepository implements ITenantAwareRepository<UserProfile> {
 *   async findByTenant(tenantId: TenantId): Promise<UserProfile[]> {
 *     // 实现根据租户查找用户档案
 *   }
 *
 *   async findByTenantAndUser(tenantId: TenantId, userId: UserId): Promise<UserProfile | null> {
 *     // 实现根据租户和用户查找用户档案
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface ITenantAwareRepository<TEntity extends TenantAwareEntity> {
  /**
   * 根据租户ID查找所有实体
   *
   * @description 查找指定租户下的所有实体
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 只返回指定租户的实体
   * - 自动过滤其他租户的数据
   * - 验证租户ID的有效性
   * - 支持租户级别的数据隔离
   *
   * ### 权限控制规则
   * - 验证用户对租户数据的访问权限
   * - 支持角色权限和资源权限验证
   * - 权限验证失败时抛出相应异常
   * - 记录查询操作的审计日志
   *
   * ### 查询优化规则
   * - 支持租户级别的查询优化
   * - 支持租户级别的索引优化
   * - 支持分页查询避免大数据量
   * - 支持查询结果的缓存
   *
   * ### 数据过滤规则
   * - 自动过滤软删除的实体
   * - 支持按状态过滤实体
   * - 支持按组织、部门等条件过滤
   * - 结果按创建时间倒序排列
   *
   * @param tenantId - 租户ID
   * @param options - 查询选项，包括分页、排序、过滤等
   * @returns 实体数组，可能为空数组
   *
   * @throws {InvalidTenantIdError} 当租户ID格式不正确时抛出
   * @throws {AccessDeniedError} 当用户无权访问租户数据时抛出
   * @throws {Error} 当查询失败时抛出
   *
   * @example
   * ```typescript
   * const profiles = await userProfileRepository.findByTenant(tenantId, {
   *   page: 1,
   *   limit: 20,
   *   status: 'ACTIVE'
   * });
   * ```
   */
  findByTenant(
    tenantId: TenantId,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      organizationId?: EntityId;
      departmentId?: EntityId;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<TEntity[]>;

  /**
   * 根据租户ID和用户ID查找实体
   *
   * @description 查找指定租户和用户下的实体
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 只返回指定租户和用户的实体
   * - 自动过滤其他租户和用户的数据
   * - 验证租户ID和用户ID的有效性
   * - 支持租户级别的数据隔离
   *
   * ### 权限控制规则
   * - 验证用户对数据的访问权限
   * - 支持跨用户的数据访问权限验证
   * - 权限验证失败时抛出相应异常
   * - 记录查询操作的审计日志
   *
   * ### 数据过滤规则
   * - 自动过滤软删除的实体
   * - 支持按状态过滤实体
   * - 支持按组织、部门等条件过滤
   * - 返回单个实体或null
   *
   * @param tenantId - 租户ID
   * @param userId - 用户ID
   * @param options - 查询选项，包括状态过滤等
   * @returns 实体实例或null（如果不存在）
   *
   * @throws {InvalidTenantIdError} 当租户ID格式不正确时抛出
   * @throws {InvalidUserIdError} 当用户ID格式不正确时抛出
   * @throws {AccessDeniedError} 当用户无权访问数据时抛出
   * @throws {Error} 当查询失败时抛出
   *
   * @example
   * ```typescript
   * const profile = await userProfileRepository.findByTenantAndUser(
   *   tenantId,
   *   userId,
   *   { status: 'ACTIVE' }
   * );
   * ```
   */
  findByTenantAndUser(
    tenantId: TenantId,
    userId: UserId,
    options?: {
      status?: string;
      organizationId?: EntityId;
      departmentId?: EntityId;
    }
  ): Promise<TEntity | null>;

  /**
   * 根据租户ID和创建者ID查找实体
   *
   * @description 查找指定租户和创建者下的实体
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 只返回指定租户和创建者的实体
   * - 自动过滤其他租户和创建者的数据
   * - 验证租户ID和创建者ID的有效性
   * - 支持租户级别的数据隔离
   *
   * ### 权限控制规则
   * - 验证用户对创建者数据的访问权限
   * - 支持跨创建者的数据访问权限验证
   * - 权限验证失败时抛出相应异常
   * - 记录查询操作的审计日志
   *
   * ### 数据过滤规则
   * - 自动过滤软删除的实体
   * - 支持按状态过滤实体
   * - 支持按组织、部门等条件过滤
   * - 结果按创建时间倒序排列
   *
   * @param tenantId - 租户ID
   * @param createdBy - 创建者用户ID
   * @param options - 查询选项，包括分页、排序、过滤等
   * @returns 实体数组，可能为空数组
   *
   * @throws {InvalidTenantIdError} 当租户ID格式不正确时抛出
   * @throws {InvalidUserIdError} 当创建者ID格式不正确时抛出
   * @throws {AccessDeniedError} 当用户无权访问数据时抛出
   * @throws {Error} 当查询失败时抛出
   *
   * @example
   * ```typescript
   * const profiles = await userProfileRepository.findByTenantAndCreatedBy(
   *   tenantId,
   *   createdBy,
   *   { page: 1, limit: 20, status: 'ACTIVE' }
   * );
   * ```
   */
  findByTenantAndCreatedBy(
    tenantId: TenantId,
    createdBy: UserId,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      organizationId?: EntityId;
      departmentId?: EntityId;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<TEntity[]>;

  /**
   * 根据租户ID统计实体数量
   *
   * @description 统计指定租户下的实体数量
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 只统计指定租户的实体
   * - 自动过滤其他租户的数据
   * - 验证租户ID的有效性
   * - 支持租户级别的数据隔离
   *
   * ### 权限控制规则
   * - 验证用户对租户数据的访问权限
   * - 支持角色权限和资源权限验证
   * - 权限验证失败时抛出相应异常
   * - 记录统计操作的审计日志
   *
   * ### 统计规则
   * - 支持条件过滤的统计
   * - 自动过滤软删除的实体
   * - 支持按状态、组织、部门等条件过滤
   * - 统计结果返回数字类型
   *
   * ### 性能优化规则
   * - 使用高效的统计查询
   * - 支持统计结果的缓存
   * - 避免加载完整数据
   * - 支持批量统计操作
   *
   * @param tenantId - 租户ID
   * @param criteria - 统计条件，可选
   * @returns 实体数量
   *
   * @throws {InvalidTenantIdError} 当租户ID格式不正确时抛出
   * @throws {AccessDeniedError} 当用户无权访问租户数据时抛出
   * @throws {Error} 当统计失败时抛出
   *
   * @example
   * ```typescript
   * // 统计所有用户档案数量
   * const totalCount = await userProfileRepository.countByTenant(tenantId);
   *
   * // 统计活跃用户档案数量
   * const activeCount = await userProfileRepository.countByTenant(tenantId, {
   *   status: 'ACTIVE'
   * });
   * ```
   */
  countByTenant(
    tenantId: TenantId,
    criteria?: {
      status?: string;
      organizationId?: EntityId;
      departmentId?: EntityId;
      createdBy?: UserId;
      dateRange?: {
        startDate: Date;
        endDate: Date;
      };
    }
  ): Promise<number>;

  /**
   * 检查租户下的实体是否存在
   *
   * @description 检查指定租户下是否存在满足条件的实体
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 只在指定租户范围内检查
   * - 自动过滤其他租户的数据
   * - 验证租户ID的有效性
   * - 支持租户级别的数据隔离
   *
   * ### 权限控制规则
   * - 验证用户对租户数据的访问权限
   * - 支持角色权限和资源权限验证
   * - 权限验证失败时抛出相应异常
   * - 记录检查操作的审计日志
   *
   * ### 存在性检查规则
   * - 支持条件过滤的存在性检查
   * - 自动过滤软删除的实体
   * - 支持按状态、组织、部门等条件过滤
   * - 检查结果返回布尔值
   *
   * ### 性能优化规则
   * - 使用轻量级的查询检查存在性
   * - 支持存在性检查的缓存
   * - 避免加载完整的实体数据
   * - 支持批量存在性检查
   *
   * @param tenantId - 租户ID
   * @param criteria - 检查条件，可选
   * @returns 如果存在满足条件的实体则返回true，否则返回false
   *
   * @throws {InvalidTenantIdError} 当租户ID格式不正确时抛出
   * @throws {AccessDeniedError} 当用户无权访问租户数据时抛出
   * @throws {Error} 当检查失败时抛出
   *
   * @example
   * ```typescript
   * // 检查是否存在活跃用户档案
   * const hasActiveProfiles = await userProfileRepository.existsByTenant(tenantId, {
   *   status: 'ACTIVE'
   * });
   *
   * // 检查是否存在指定组织的用户档案
   * const hasOrgProfiles = await userProfileRepository.existsByTenant(tenantId, {
   *   organizationId: orgId
   * });
   * ```
   */
  existsByTenant(
    tenantId: TenantId,
    criteria?: {
      status?: string;
      organizationId?: EntityId;
      departmentId?: EntityId;
      createdBy?: UserId;
      dateRange?: {
        startDate: Date;
        endDate: Date;
      };
    }
  ): Promise<boolean>;
}
