import { Entity, Column, Index } from 'typeorm';
import { TenantAwareDatabaseEntity } from './tenant-aware-database-entity';

/**
 * 租户感知聚合根数据库实体类
 *
 * 租户感知聚合根数据库实体是多租户架构中的核心概念，
 * 用于存储租户感知聚合根的当前状态和版本信息。
 *
 * @description 所有租户感知聚合根数据库实体的基类
 * 提供租户隔离、版本控制、事件溯源等聚合根相关功能
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 每个聚合根都属于特定的租户
 * - 租户ID用于数据隔离和权限控制
 * - 跨租户的聚合根操作被严格禁止
 * - 所有查询操作必须包含租户过滤条件
 *
 * ### 版本控制规则
 * - 每个聚合根都有版本号，用于乐观锁控制
 * - 版本号从0开始，每次更新递增1
 * - 版本号用于检测并发修改冲突
 * - 事件版本号记录已处理的事件版本
 *
 * ### 事件溯源规则
 * - 事件版本号记录已处理的事件数量
 * - 支持从任意版本开始重建状态
 * - 事件和状态快照分离存储
 * - 支持事件重放和状态重建
 *
 * ### 权限控制规则
 * - 用户只能访问其所属租户的聚合根
 * - 跨租户操作需要特殊权限验证
 * - 支持组织级别和部门级别的权限控制
 * - 权限验证基于租户上下文和用户身份
 *
 * ## 业务逻辑流程
 *
 * 1. **状态存储**：将租户感知聚合根状态序列化存储
 * 2. **租户验证**：验证租户ID的有效性和权限
 * 3. **版本控制**：记录版本号和事件版本
 * 4. **并发检测**：通过版本号检测并发修改
 * 5. **状态重建**：从事件历史重建当前状态
 * 6. **权限检查**：每次操作前验证租户权限
 *
 * @example
 * ```typescript
 * @Entity('user_aggregates')
 * @Index(['tenant_id'])
 * @Index(['tenant_id', 'version'])
 * @Index(['tenant_id', 'event_version'])
 * class UserAggregateDatabaseEntity extends TenantAwareAggregateDatabaseEntity {
 *   @Column({ type: 'json' })
 *   state: any;
 * }
 * ```
 *
 * @since 1.0.0
 */
@Entity()
@Index(['tenant_id'])
@Index(['tenant_id', 'version'])
@Index(['tenant_id', 'event_version'])
@Index(['tenant_id', 'aggregate_type'])
export abstract class TenantAwareAggregateDatabaseEntity extends TenantAwareDatabaseEntity {
  /**
   * 聚合根版本号
   *
   * @description 聚合根的当前版本号，用于乐观锁控制
   * 从0开始，每次更新递增1
   */
  @Column({ type: 'int', default: 0 })
  version!: number;

  /**
   * 事件版本号
   *
   * @description 已处理的事件版本号，用于事件溯源
   * 记录已处理的事件数量
   */
  @Column({ name: 'event_version', type: 'int', default: 0 })
  eventVersion!: number;

  /**
   * 聚合根状态快照
   *
   * @description 聚合根的当前状态，以JSON格式存储
   * 用于快速恢复聚合根状态，避免从事件重建
   */
  @Column({ type: 'json', nullable: true })
  state: any;

  /**
   * 聚合根类型
   *
   * @description 聚合根的类型名称，用于多态存储
   * 用于区分不同类型的聚合根
   */
  @Column({ name: 'aggregate_type', type: 'varchar', length: 255 })
  aggregateType!: string;
}
