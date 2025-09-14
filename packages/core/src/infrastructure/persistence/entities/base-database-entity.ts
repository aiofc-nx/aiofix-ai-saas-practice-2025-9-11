import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 基础数据库实体类
 *
 * 数据库实体是基础设施层的概念，用于在数据库中存储领域实体的数据。
 * 提供与TypeORM框架集成的数据库映射功能。
 *
 * @description 所有数据库实体的基类，提供数据库字段映射
 * 包括主键、创建时间、更新时间等基础数据库字段
 *
 * ## 业务规则
 *
 * ### 主键规则
 * - 使用UUID作为主键，与领域实体的EntityId对应
 * - 主键字段名为'id'，类型为varchar(36)
 * - 主键在数据库层面保证唯一性
 * - 主键不可为空，不可重复
 *
 * ### 时间戳规则
 * - 创建时间字段名为'created_at'，类型为timestamp
 * - 更新时间字段名为'updated_at'，类型为timestamp
 * - 时间戳采用UTC时区存储
 * - 时间戳精度到毫秒级别
 * - 创建时间由数据库自动设置
 * - 更新时间在记录更新时自动更新
 *
 * ### 字段命名规则
 * - 数据库字段使用下划线命名法（snake_case）
 * - 字段名与领域实体的属性名保持一致
 * - 外键字段以'_id'结尾
 * - 布尔字段以'is_'开头
 *
 * ### 索引规则
 * - 主键自动创建唯一索引
 * - 创建时间字段创建索引，用于时间范围查询
 * - 外键字段创建索引，用于关联查询
 * - 复合索引根据业务查询需求创建
 *
 * ## 业务逻辑流程
 *
 * 1. **实体映射**：将领域实体转换为数据库实体
 * 2. **数据持久化**：通过TypeORM将数据存储到数据库
 * 3. **查询优化**：通过索引和查询优化提升性能
 * 4. **数据一致性**：通过数据库约束保证数据完整性
 * 5. **审计追踪**：记录数据的创建和修改时间
 *
 * @example
 * ```typescript
 * @Entity('users')
 * class UserDatabaseEntity extends BaseDatabaseEntity {
 *   @Column({ type: 'varchar', length: 255 })
 *   name: string;
 *
 *   @Column({ type: 'varchar', length: 255, unique: true })
 *   email: string;
 * }
 * ```
 *
 * @since 1.0.0
 */
@Entity()
export abstract class BaseDatabaseEntity {
  /**
   * 主键ID
   *
   * @description 实体的唯一标识符，对应领域实体的EntityId
   * 使用UUID格式，长度为36个字符
   */
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  /**
   * 创建时间
   *
   * @description 记录实体的创建时间
   * 由数据库自动设置，不可修改
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  /**
   * 更新时间
   *
   * @description 记录实体的最后更新时间
   * 在记录更新时自动更新
   */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
