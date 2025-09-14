import { Entity, Column, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 事件数据库实体类
 *
 * 事件数据库实体用于存储领域事件，支持Event Sourcing架构。
 * 提供事件的持久化存储、查询和重放功能。
 *
 * @description 领域事件的数据库存储实体
 * 提供事件ID、聚合根ID、事件类型、事件数据等字段
 *
 * ## 业务规则
 *
 * ### 事件存储规则
 * - 每个事件都有唯一的ID，用于事件标识
 * - 事件按聚合根ID和版本号有序存储
 * - 事件数据以JSON格式存储，支持复杂数据结构
 * - 事件类型用于事件路由和处理
 *
 * ### 事件版本规则
 * - 每个聚合根的事件都有递增的版本号
 * - 版本号用于事件重放和状态重建
 * - 版本号保证事件的顺序和一致性
 * - 支持从任意版本开始的事件重放
 *
 * ### 事件查询规则
 * - 支持按聚合根ID查询所有事件
 * - 支持按聚合根ID和版本范围查询事件
 * - 支持按事件类型查询事件
 * - 支持按租户ID查询租户事件
 *
 * ### 事件重放规则
 * - 支持从指定版本开始重放事件
 * - 支持重放特定类型的事件
 * - 支持事件重放的幂等性
 * - 支持事件重放的错误处理
 *
 * ## 业务逻辑流程
 *
 * 1. **事件存储**：将领域事件序列化存储到数据库
 * 2. **事件查询**：根据聚合根ID和版本查询事件
 * 3. **事件重放**：从事件历史重建聚合根状态
 * 4. **事件过滤**：按租户、类型等条件过滤事件
 * 5. **事件归档**：定期归档历史事件
 *
 * @example
 * ```typescript
 * @Entity('domain_events')
 * @Index(['aggregate_id', 'version'])
 * @Index(['event_type'])
 * @Index(['tenant_id'])
 * @Index(['created_at'])
 * class EventDatabaseEntity {
 *   // 事件存储实现
 * }
 * ```
 *
 * @since 1.0.0
 */
@Entity('domain_events')
@Index(['aggregate_id', 'version'])
@Index(['event_type'])
@Index(['tenant_id'])
@Index(['created_at'])
export class EventDatabaseEntity {
  /**
   * 事件ID
   *
   * @description 事件的唯一标识符
   * 使用数据库自增ID
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * 聚合根ID
   *
   * @description 产生此事件的聚合根标识符
   * 用于事件查询和聚合根状态重建
   */
  @Column({ name: 'aggregate_id', type: 'varchar', length: 36 })
  aggregateId!: string;

  /**
   * 聚合根类型
   *
   * @description 聚合根的类型名称
   * 用于多态处理和事件路由
   */
  @Column({ name: 'aggregate_type', type: 'varchar', length: 255 })
  aggregateType!: string;

  /**
   * 事件版本号
   *
   * @description 事件在聚合根中的版本号
   * 用于事件重放和状态重建
   */
  @Column({ type: 'int' })
  version!: number;

  /**
   * 事件类型
   *
   * @description 事件的类型名称
   * 用于事件路由和处理
   */
  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  eventType!: string;

  /**
   * 事件数据
   *
   * @description 事件的序列化数据
   * 以JSON格式存储事件的所有属性
   */
  @Column({ name: 'event_data', type: 'json' })
  eventData!: any;

  /**
   * 事件元数据
   *
   * @description 事件的元数据信息
   * 包括事件来源、时间戳等信息
   */
  @Column({ name: 'event_metadata', type: 'json', nullable: true })
  eventMetadata!: any | null;

  /**
   * 租户ID
   *
   * @description 事件所属的租户标识符
   * 用于多租户数据隔离
   */
  @Column({ name: 'tenant_id', type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  /**
   * 组织ID
   *
   * @description 事件所属的组织标识符
   * 用于组织级别的数据隔离
   */
  @Column({
    name: 'organization_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  organizationId!: string | null;

  /**
   * 部门ID
   *
   * @description 事件所属的部门标识符
   * 用于部门级别的数据隔离
   */
  @Column({
    name: 'department_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  departmentId!: string | null;

  /**
   * 事件发生时间
   *
   * @description 事件发生的时间戳
   * 用于事件排序和时间查询
   */
  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt!: Date;

  /**
   * 事件创建时间
   *
   * @description 事件存储到数据库的时间
   * 用于事件审计和追踪
   */
  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  /**
   * 事件处理状态
   *
   * @description 事件的处理状态
   * 用于事件处理的状态跟踪
   */
  @Column({
    name: 'processing_status',
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  processingStatus!: string;

  /**
   * 事件处理错误
   *
   * @description 事件处理过程中的错误信息
   * 用于错误诊断和处理
   */
  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError!: string | null;

  /**
   * 事件重试次数
   *
   * @description 事件处理的重试次数
   * 用于失败事件的重试控制
   */
  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  /**
   * 事件最大重试次数
   *
   * @description 事件处理的最大重试次数
   * 用于失败事件的重试控制
   */
  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries!: number;
}
