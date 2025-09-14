import { Entity, Column, Index } from 'typeorm';
import { BaseDatabaseEntity } from './base-database-entity';

/**
 * 聚合根数据库实体类
 *
 * 聚合根数据库实体用于存储聚合根的当前状态和版本信息。
 * 支持Event Sourcing架构中的状态重建和版本控制。
 *
 * @description 所有聚合根数据库实体的基类
 * 提供版本号、事件版本等聚合根相关数据库字段
 *
 * ## 业务规则
 *
 * ### 版本控制规则
 * - 每个聚合根都有版本号，用于乐观锁控制
 * - 版本号从0开始，每次更新递增1
 * - 版本号用于检测并发修改冲突
 * - 事件版本号记录已处理的事件版本
 *
 * ### 状态存储规则
 * - 聚合根状态以JSON格式存储在数据库中
 * - 状态快照用于快速恢复聚合根状态
 * - 状态变更通过事件溯源机制记录
 * - 支持状态版本化和回滚操作
 *
 * ### 事件溯源规则
 * - 事件版本号记录已处理的事件数量
 * - 支持从任意版本开始重建状态
 * - 事件和状态快照分离存储
 * - 支持事件重放和状态重建
 *
 * ### 并发控制规则
 * - 使用乐观锁防止并发修改冲突
 * - 版本号冲突时抛出并发异常
 * - 支持重试机制处理并发冲突
 * - 事件处理保证幂等性
 *
 * ## 业务逻辑流程
 *
 * 1. **状态存储**：将聚合根状态序列化存储
 * 2. **版本控制**：记录版本号和事件版本
 * 3. **并发检测**：通过版本号检测并发修改
 * 4. **状态重建**：从事件历史重建当前状态
 * 5. **快照优化**：定期创建状态快照提升性能
 *
 * @example
 * ```typescript
 * @Entity('user_aggregates')
 * @Index(['version'])
 * @Index(['event_version'])
 * class UserAggregateDatabaseEntity extends AggregateDatabaseEntity {
 *   @Column({ type: 'json' })
 *   state: any;
 * }
 * ```
 *
 * @since 1.0.0
 */
@Entity()
@Index(['version'])
@Index(['event_version'])
export abstract class AggregateDatabaseEntity extends BaseDatabaseEntity {
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
