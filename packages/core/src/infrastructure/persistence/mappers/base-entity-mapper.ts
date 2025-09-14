import { BaseEntity } from '../../../domain/entities/base.entity';
import { BaseDatabaseEntity } from '../entities/base-database-entity';
import { BaseEntityMapper } from './base-entity-mapper.interface';

/**
 * 基础实体映射器
 *
 * 基础实体映射器提供领域实体和数据库实体之间的通用映射功能。
 * 处理基础字段的转换，包括ID、时间戳等通用字段。
 *
 * @description 所有实体映射器的基类
 * 提供基础字段的映射功能和通用转换逻辑
 *
 * ## 业务规则
 *
 * ### 映射规则
 * - EntityId转换为字符串格式的ID
 * - 时间戳保持Date格式
 * - 保持字段名称的一致性
 * - 处理null和undefined值
 *
 * ### 验证规则
 * - 验证输入实体的有效性
 * - 验证转换结果的完整性
 * - 处理转换过程中的异常
 * - 提供详细的错误信息
 *
 * ### 性能规则
 * - 映射操作应该高效
 * - 支持批量映射操作
 * - 避免重复的映射计算
 * - 缓存常用的映射结果
 *
 * ## 业务逻辑流程
 *
 * 1. **数据验证**：验证输入数据的完整性
 * 2. **基础字段映射**：映射ID、时间戳等基础字段
 * 3. **业务字段映射**：由子类实现具体的业务字段映射
 * 4. **数据验证**：验证映射结果的正确性
 * 5. **异常处理**：处理映射过程中的异常
 *
 * @template TDomainEntity 领域实体类型
 * @template TDatabaseEntity 数据库实体类型
 *
 * @example
 * ```typescript
 * class UserEntityMapper extends BaseEntityMapper<User, UserDatabaseEntity> {
 *   protected mapBusinessFields(domain: User, database: UserDatabaseEntity): void {
 *     database.name = domain.getName();
 *     database.email = domain.getEmail();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseEntityMapperImpl<
  TDomainEntity extends BaseEntity,
  TDatabaseEntity extends BaseDatabaseEntity
> implements BaseEntityMapper<TDomainEntity, TDatabaseEntity>
{
  /**
   * 将领域实体转换为数据库实体
   *
   * @description 将领域实体转换为对应的数据库实体
   * 首先映射基础字段，然后调用子类实现业务字段映射
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
  public toDatabase(domainEntity: TDomainEntity): TDatabaseEntity {
    if (!domainEntity) {
      throw new Error('Domain entity cannot be null or undefined');
    }

    try {
      const databaseEntity = this.createDatabaseEntity();

      // 映射基础字段
      this.mapBaseFields(domainEntity, databaseEntity);

      // 映射业务字段（由子类实现）
      this.mapBusinessFields(domainEntity, databaseEntity);

      return databaseEntity;
    } catch (error) {
      throw new Error(
        `Failed to convert domain entity to database entity: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * 将数据库实体转换为领域实体
   *
   * @description 将数据库实体转换为对应的领域实体
   * 首先验证基础字段，然后调用子类实现业务字段映射
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
  public toDomain(databaseEntity: TDatabaseEntity): TDomainEntity {
    if (!databaseEntity) {
      throw new Error('Database entity cannot be null or undefined');
    }

    try {
      // 验证基础字段
      this.validateBaseFields(databaseEntity);

      // 创建领域实体（由子类实现）
      const domainEntity = this.createDomainEntity(databaseEntity);

      return domainEntity;
    } catch (error) {
      throw new Error(
        `Failed to convert database entity to domain entity: ${
          (error as Error).message
        }`
      );
    }
  }

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
  public toDatabaseBatch(domainEntities: TDomainEntity[]): TDatabaseEntity[] {
    if (!domainEntities || domainEntities.length === 0) {
      return [];
    }

    try {
      return domainEntities.map((entity) => this.toDatabase(entity));
    } catch (error) {
      throw new Error(
        `Failed to convert domain entities batch: ${(error as Error).message}`
      );
    }
  }

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
  public toDomainBatch(databaseEntities: TDatabaseEntity[]): TDomainEntity[] {
    if (!databaseEntities || databaseEntities.length === 0) {
      return [];
    }

    try {
      return databaseEntities.map((entity) => this.toDomain(entity));
    } catch (error) {
      throw new Error(
        `Failed to convert database entities batch: ${(error as Error).message}`
      );
    }
  }

  /**
   * 映射基础字段
   *
   * @description 映射领域实体和数据库实体之间的基础字段
   * 包括ID、创建时间、更新时间等通用字段
   *
   * @param domainEntity 领域实体
   * @param databaseEntity 数据库实体
   * @protected
   */
  protected mapBaseFields(
    domainEntity: TDomainEntity,
    databaseEntity: TDatabaseEntity
  ): void {
    databaseEntity.id = domainEntity.getId().toString();
    databaseEntity.createdAt = domainEntity.getCreatedAt();
    databaseEntity.updatedAt = domainEntity.getUpdatedAt();
  }

  /**
   * 验证基础字段
   *
   * @description 验证数据库实体的基础字段是否有效
   * 包括ID、创建时间、更新时间等通用字段
   *
   * @param databaseEntity 数据库实体
   * @protected
   * @throws {Error} 当字段无效时抛出
   */
  protected validateBaseFields(databaseEntity: TDatabaseEntity): void {
    if (!databaseEntity.id) {
      throw new Error('Database entity ID is required');
    }

    if (!databaseEntity.createdAt) {
      throw new Error('Database entity created date is required');
    }

    if (!databaseEntity.updatedAt) {
      throw new Error('Database entity updated date is required');
    }
  }

  /**
   * 创建数据库实体实例
   *
   * @description 创建数据库实体的实例
   * 由子类实现具体的数据库实体类型
   *
   * @returns 数据库实体实例
   * @protected
   * @abstract
   */
  protected abstract createDatabaseEntity(): TDatabaseEntity;

  /**
   * 创建领域实体实例
   *
   * @description 根据数据库实体创建领域实体实例
   * 由子类实现具体的领域实体类型和构造逻辑
   *
   * @param databaseEntity 数据库实体
   * @returns 领域实体实例
   * @protected
   * @abstract
   */
  protected abstract createDomainEntity(
    databaseEntity: TDatabaseEntity
  ): TDomainEntity;

  /**
   * 映射业务字段
   *
   * @description 映射领域实体和数据库实体之间的业务字段
   * 由子类实现具体的业务字段映射逻辑
   *
   * @param domainEntity 领域实体
   * @param databaseEntity 数据库实体
   * @protected
   * @abstract
   */
  protected abstract mapBusinessFields(
    domainEntity: TDomainEntity,
    databaseEntity: TDatabaseEntity
  ): void;
}
