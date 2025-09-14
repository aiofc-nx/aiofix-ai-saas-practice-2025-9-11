/**
 * 基础实体映射器接口
 *
 * 实体映射器是基础设施层的核心组件，负责在领域实体和数据库实体之间进行转换。
 * 提供领域模型和持久化模型之间的解耦。
 *
 * @description 所有实体映射器的基接口
 * 定义领域实体和数据库实体之间的映射规范
 *
 * ## 业务规则
 *
 * ### 映射规则
 * - 领域实体到数据库实体的转换
 * - 数据库实体到领域实体的转换
 * - 保持领域模型的完整性
 * - 处理类型转换和格式转换
 *
 * ### 数据转换规则
 * - 值对象的序列化和反序列化
 * - 时间戳的格式转换
 * - 枚举值的转换
 * - 复杂对象的JSON序列化
 *
 * ### 验证规则
 * - 映射前验证数据完整性
 * - 映射后验证结果正确性
 * - 处理映射过程中的异常
 * - 提供映射错误的详细信息
 *
 * ### 性能规则
 * - 映射操作应该高效
 * - 支持批量映射操作
 * - 缓存映射结果
 * - 避免重复的映射计算
 *
 * ## 业务逻辑流程
 *
 * 1. **数据验证**：验证输入数据的完整性
 * 2. **类型转换**：进行必要的类型转换
 * 3. **字段映射**：将字段从源实体映射到目标实体
 * 4. **数据验证**：验证映射结果的正确性
 * 5. **异常处理**：处理映射过程中的异常
 *
 * @template TDomainEntity 领域实体类型
 * @template TDatabaseEntity 数据库实体类型
 *
 * @example
 * ```typescript
 * interface UserEntityMapper extends BaseEntityMapper<User, UserDatabaseEntity> {
 *   // 用户实体映射器实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface BaseEntityMapper<TDomainEntity, TDatabaseEntity> {
  /**
   * 将领域实体转换为数据库实体
   *
   * @description 将领域实体转换为对应的数据库实体
   * 处理所有必要的类型转换和格式转换
   *
   * ## 业务规则
   *
   * ### 转换规则
   * - 保持数据完整性
   * - 处理值对象的序列化
   * - 转换时间戳格式
   * - 处理枚举值转换
   *
   * ### 验证规则
   * - 验证输入领域实体的有效性
   * - 验证转换结果的正确性
   * - 处理转换过程中的异常
   *
   * @param domainEntity 领域实体
   * @returns 数据库实体
   * @throws {Error} 当转换失败时抛出
   *
   * @example
   * ```typescript
   * const domainUser = new User(id, name, email);
   * const databaseUser = mapper.toDatabase(domainUser);
   * ```
   */
  toDatabase(domainEntity: TDomainEntity): TDatabaseEntity;

  /**
   * 将数据库实体转换为领域实体
   *
   * @description 将数据库实体转换为对应的领域实体
   * 处理所有必要的类型转换和格式转换
   *
   * ## 业务规则
   *
   * ### 转换规则
   * - 保持数据完整性
   * - 处理值对象的反序列化
   * - 转换时间戳格式
   * - 处理枚举值转换
   *
   * ### 验证规则
   * - 验证输入数据库实体的有效性
   * - 验证转换结果的正确性
   * - 处理转换过程中的异常
   *
   * @param databaseEntity 数据库实体
   * @returns 领域实体
   * @throws {Error} 当转换失败时抛出
   *
   * @example
   * ```typescript
   * const databaseUser = await repository.findById(id);
   * const domainUser = mapper.toDomain(databaseUser);
   * ```
   */
  toDomain(databaseEntity: TDatabaseEntity): TDomainEntity;

  /**
   * 批量将领域实体转换为数据库实体
   *
   * @description 批量转换领域实体列表为数据库实体列表
   * 提供高效的批量转换功能
   *
   * @param domainEntities 领域实体列表
   * @returns 数据库实体列表
   * @throws {Error} 当转换失败时抛出
   *
   * @example
   * ```typescript
   * const domainUsers = [user1, user2, user3];
   * const databaseUsers = mapper.toDatabaseBatch(domainUsers);
   * ```
   */
  toDatabaseBatch(domainEntities: TDomainEntity[]): TDatabaseEntity[];

  /**
   * 批量将数据库实体转换为领域实体
   *
   * @description 批量转换数据库实体列表为领域实体列表
   * 提供高效的批量转换功能
   *
   * @param databaseEntities 数据库实体列表
   * @returns 领域实体列表
   * @throws {Error} 当转换失败时抛出
   *
   * @example
   * ```typescript
   * const databaseUsers = await repository.findAll();
   * const domainUsers = mapper.toDomainBatch(databaseUsers);
   * ```
   */
  toDomainBatch(databaseEntities: TDatabaseEntity[]): TDomainEntity[];
}
