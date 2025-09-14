import { Entity, Column, Index } from 'typeorm';
import { BaseDatabaseEntity } from './base-database-entity';

/**
 * 租户感知数据库实体类
 *
 * 租户感知数据库实体是多租户架构中的核心概念，每个数据库实体都属于特定的租户。
 * 提供租户隔离和权限控制的数据库映射功能。
 *
 * @description 所有需要租户隔离的数据库实体的基类
 * 提供租户ID、创建者、更新者等租户相关数据库字段
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 每个实体必须属于特定的租户
 * - 租户ID字段名为'tenant_id'，类型为varchar(36)
 * - 租户ID在数据库层面保证数据隔离
 * - 所有查询操作必须包含租户过滤条件
 * - 跨租户的数据访问被严格禁止
 *
 * ### 用户追踪规则
 * - 创建者字段名为'created_by'，类型为varchar(36)
 * - 更新者字段名为'updated_by'，类型为varchar(36)
 * - 用户ID用于审计追踪和权限控制
 * - 支持创建者和更新者的查询和验证
 * - 用户ID变更会触发相应的审计事件
 *
 * ### 索引规则
 * - 租户ID字段创建索引，用于租户数据过滤
 * - 创建者字段创建索引，用于用户数据查询
 * - 租户ID和创建时间创建复合索引，用于租户时间范围查询
 * - 租户ID和更新者创建复合索引，用于租户用户操作查询
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
 * 1. **实体映射**：将租户感知领域实体转换为数据库实体
 * 2. **租户验证**：验证租户ID的有效性和权限
 * 3. **用户追踪**：记录创建者和更新者信息
 * 4. **数据隔离**：通过租户ID实现数据隔离
 * 5. **权限检查**：每次操作前验证租户权限
 * 6. **审计记录**：记录所有状态变更和操作者
 *
 * @example
 * ```typescript
 * @Entity('user_profiles')
 * @Index(['tenant_id'])
 * @Index(['tenant_id', 'created_at'])
 * class UserProfileDatabaseEntity extends TenantAwareDatabaseEntity {
 *   @Column({ type: 'varchar', length: 255 })
 *   name: string;
 *
 *   @Column({ type: 'varchar', length: 255 })
 *   email: string;
 * }
 * ```
 *
 * @since 1.0.0
 */
@Entity()
@Index(['tenant_id'])
@Index(['tenant_id', 'created_at'])
@Index(['tenant_id', 'created_by'])
@Index(['tenant_id', 'updated_by'])
export abstract class TenantAwareDatabaseEntity extends BaseDatabaseEntity {
  /**
   * 租户ID
   *
   * @description 实体所属的租户标识符
   * 用于实现多租户数据隔离
   */
  @Column({ name: 'tenant_id', type: 'varchar', length: 36 })
  tenantId!: string;

  /**
   * 创建者用户ID
   *
   * @description 创建此实体的用户标识符
   * 用于审计追踪和权限控制
   */
  @Column({ name: 'created_by', type: 'varchar', length: 36 })
  createdBy!: string;

  /**
   * 更新者用户ID
   *
   * @description 最后更新此实体的用户标识符
   * 用于审计追踪和权限控制
   */
  @Column({ name: 'updated_by', type: 'varchar', length: 36 })
  updatedBy!: string;
}
