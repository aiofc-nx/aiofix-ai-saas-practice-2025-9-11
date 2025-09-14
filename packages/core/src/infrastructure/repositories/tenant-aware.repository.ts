import { TenantAwareEntity } from '../../domain/entities/tenant-aware.entity';
import { EntityId, TenantId, UserId } from '../../domain/value-objects';
import { ITenantAwareRepository } from '../../domain/repositories';
import { ResultType, Result } from '../../shared/types/common';

/**
 * 租户感知仓储实现
 *
 * 租户感知仓储提供了多租户环境下的数据访问抽象，确保数据隔离
 * 和安全性。所有租户相关的实体仓储都应该继承此类。
 *
 * @description 租户感知仓储的抽象实现，提供多租户数据访问功能
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 所有数据操作必须基于租户ID进行隔离
 * - 不能跨租户访问数据
 * - 租户ID必须存在于所有查询条件中
 * - 租户ID验证失败时拒绝操作
 *
 * ### 数据安全规则
 * - 确保数据访问的租户边界
 * - 防止租户数据泄露
 * - 支持租户级别的权限控制
 * - 支持租户级别的数据加密
 *
 * ### 查询优化规则
 * - 所有查询自动添加租户过滤条件
 * - 支持租户级别的查询优化
 * - 支持租户级别的索引策略
 * - 支持租户级别的缓存策略
 *
 * ### 事务管理规则
 * - 租户操作必须在租户事务中进行
 * - 支持租户级别的事务隔离
 * - 事务失败时必须完全回滚
 * - 支持租户级别的补偿机制
 *
 * ## 业务逻辑流程
 *
 * 1. **租户验证**：验证租户ID的有效性
 * 2. **数据隔离**：确保操作仅限于指定租户
 * 3. **查询过滤**：自动添加租户过滤条件
 * 4. **事务管理**：在租户事务中执行操作
 * 5. **结果返回**：返回租户隔离的结果
 *
 * @template TEntity 租户感知实体类型
 * @template TId 实体ID类型，默认为EntityId
 *
 * @example
 * ```typescript
 * // 具体租户仓储实现
 * class UserRepository extends TenantAwareRepository<User, EntityId> {
 *   protected async saveEntity(entity: User, tenantId: TenantId): Promise<void> {
 *     // 实现具体的租户感知保存逻辑
 *   }
 *
 *   protected async loadEntity(id: EntityId, tenantId: TenantId): Promise<User | null> {
 *     // 实现具体的租户感知加载逻辑
 *   }
 *
 *   protected async loadEntitiesByTenant(tenantId: TenantId): Promise<User[]> {
 *     // 实现具体的租户实体加载逻辑
 *   }
 * }
 *
 * // 使用租户仓储
 * const userRepository = new UserRepository();
 * const users = await userRepository.findByTenant(tenantId);
 * const user = await userRepository.findById(userId, tenantId);
 * ```
 *
 * @since 1.0.0
 */
export abstract class TenantAwareRepository<
  TEntity extends TenantAwareEntity & {
    id: EntityId;
    tenantId: TenantId;
    version: number;
  },
  TId extends EntityId = EntityId
> implements ITenantAwareRepository<TEntity>
{
  /**
   * 根据ID和租户ID查找实体
   *
   * @description 根据实体ID和租户ID查找指定的实体
   * @param id 实体ID
   * @param tenantId 租户ID
   * @returns Promise<ResultType<TEntity | null>> 查找结果
   *
   * @example
   * ```typescript
   * const result = await repository.findById(entityId, tenantId);
   * if (result.isSuccess && result.value) {
   *   console.log('找到实体:', result.value);
   * }
   * ```
   */
  public async findById(
    id: TId,
    tenantId: TenantId
  ): Promise<ResultType<TEntity | null>> {
    try {
      if (!id || !EntityId.isValid(id.toString())) {
        return Result.failure(new Error('Invalid entity ID'));
      }

      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return Result.failure(new Error('Invalid tenant ID'));
      }

      const entity = await this.loadEntity(id, tenantId);
      return Result.success(entity);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 保存实体
   *
   * @description 保存租户感知实体到存储，确保租户隔离
   * @param entity 要保存的实体
   * @returns Promise<ResultType<void>> 保存结果
   *
   * @example
   * ```typescript
   * const result = await repository.save(entity);
   * if (result.isSuccess) {
   *   console.log('实体保存成功');
   * }
   * ```
   */
  public async save(entity: TEntity): Promise<ResultType<void>> {
    try {
      if (!entity) {
        return Result.failure(new Error('Entity cannot be null or undefined'));
      }

      if (!EntityId.isValid(entity.id.toString())) {
        return Result.failure(new Error('Invalid entity ID'));
      }

      if (!TenantId.isValid(entity.tenantId.toString())) {
        return Result.failure(new Error('Invalid tenant ID'));
      }

      // 检查是否存在版本冲突
      const existingEntity = await this.loadEntity(
        entity.id as TId,
        entity.tenantId
      );
      if (existingEntity && existingEntity.version !== entity.version) {
        return Result.failure(
          new Error(
            `Version conflict: expected ${existingEntity.version}, got ${entity.version}`
          )
        );
      }

      await this.saveEntity(entity, entity.tenantId);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 删除实体
   *
   * @description 从存储中删除指定的租户感知实体
   * @param id 实体ID
   * @param tenantId 租户ID
   * @returns Promise<ResultType<void>> 删除结果
   *
   * @example
   * ```typescript
   * const result = await repository.delete(entityId, tenantId);
   * if (result.isSuccess) {
   *   console.log('实体删除成功');
   * }
   * ```
   */
  public async delete(id: TId, tenantId: TenantId): Promise<ResultType<void>> {
    try {
      if (!id || !EntityId.isValid(id.toString())) {
        return Result.failure(new Error('Invalid entity ID'));
      }

      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return Result.failure(new Error('Invalid tenant ID'));
      }

      const entity = await this.loadEntity(id, tenantId);
      if (!entity) {
        return Result.failure(new Error('Entity not found'));
      }

      await this.deleteEntity(id, tenantId);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 检查实体是否存在
   *
   * @description 检查指定ID和租户ID的实体是否存在
   * @param id 实体ID
   * @param tenantId 租户ID
   * @returns Promise<ResultType<boolean>> 检查结果
   *
   * @example
   * ```typescript
   * const result = await repository.exists(entityId, tenantId);
   * if (result.isSuccess && result.value) {
   *   console.log('实体存在');
   * }
   * ```
   */
  public async exists(
    id: TId,
    tenantId: TenantId
  ): Promise<ResultType<boolean>> {
    try {
      if (!id || !EntityId.isValid(id.toString())) {
        return Result.failure(new Error('Invalid entity ID'));
      }

      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return Result.failure(new Error('Invalid tenant ID'));
      }

      const entity = await this.loadEntity(id, tenantId);
      return Result.success(entity !== null);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 根据租户ID获取所有实体
   *
   * @description 获取指定租户的所有实体列表
   * @param tenantId 租户ID
   * @returns Promise<ResultType<TEntity[]>> 实体列表
   *
   * @example
   * ```typescript
   * const result = await repository.findByTenant(tenantId);
   * if (result.isSuccess) {
   *   console.log('实体数量:', result.value.length);
   * }
   * ```
   */
  public async findByTenant(
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
  ): Promise<TEntity[]> {
    try {
      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return [];
      }

      const entities = await this.loadEntitiesByTenant(tenantId);
      return entities;
    } catch (error) {
      console.error(`根据租户ID查找实体失败，租户ID: ${tenantId}`, error);
      return [];
    }
  }

  /**
   * 根据租户ID和用户ID查找实体
   *
   * @description 查找指定租户和用户下的实体
   * @param tenantId 租户ID
   * @param userId 用户ID
   * @param options 查询选项
   * @returns Promise<TEntity | null> 查找结果
   */
  public async findByTenantAndUser(
    tenantId: TenantId,
    userId: UserId,
    options?: {
      status?: string;
      organizationId?: EntityId;
      departmentId?: EntityId;
    }
  ): Promise<TEntity | null> {
    try {
      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return null;
      }

      if (!userId || !EntityId.isValid(userId.toString())) {
        return null;
      }

      const entity = await this.loadEntityByTenantAndUser(tenantId, userId);
      return entity;
    } catch (error) {
      console.error(
        `根据租户ID和用户ID查找实体失败，租户ID: ${tenantId}, 用户ID: ${userId}`,
        error
      );
      return null;
    }
  }

  /**
   * 根据租户ID和创建者ID查找实体
   *
   * @description 查找指定租户和创建者下的实体列表
   * @param tenantId 租户ID
   * @param createdBy 创建者ID
   * @param options 查询选项
   * @returns Promise<TEntity[]> 实体列表
   */
  public async findByTenantAndCreatedBy(
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
  ): Promise<TEntity[]> {
    try {
      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return [];
      }

      if (!createdBy || !EntityId.isValid(createdBy.toString())) {
        return [];
      }

      const entities = await this.loadEntitiesByTenantAndCreatedBy(
        tenantId,
        createdBy
      );
      return entities;
    } catch (error) {
      console.error(
        `根据租户ID和创建者ID查找实体失败，租户ID: ${tenantId}, 创建者ID: ${createdBy}`,
        error
      );
      return [];
    }
  }

  /**
   * 检查租户下是否存在实体
   *
   * @description 检查指定租户下是否存在满足条件的实体
   * @param tenantId 租户ID
   * @param criteria 查询条件
   * @returns Promise<boolean> 是否存在
   */
  public async existsByTenant(
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
  ): Promise<boolean> {
    try {
      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return false;
      }

      const exists = await this.checkEntityExistsByTenant(tenantId, criteria);
      return exists;
    } catch (error) {
      console.error(`检查租户实体存在性失败，租户ID: ${tenantId}`, error);
      return false;
    }
  }

  /**
   * 批量保存实体
   *
   * @description 批量保存多个租户感知实体
   * @param entities 要保存的实体数组
   * @returns Promise<ResultType<void>> 保存结果
   *
   * @example
   * ```typescript
   * const result = await repository.saveAll([entity1, entity2, entity3]);
   * if (result.isSuccess) {
   *   console.log('批量保存成功');
   * }
   * ```
   */
  public async saveAll(entities: TEntity[]): Promise<ResultType<void>> {
    try {
      if (!entities || entities.length === 0) {
        return Result.success(undefined);
      }

      // 验证所有实体
      for (const entity of entities) {
        if (!entity || !EntityId.isValid(entity.id.toString())) {
          return Result.failure(new Error('Invalid entity in batch'));
        }

        if (!TenantId.isValid(entity.tenantId.toString())) {
          return Result.failure(new Error('Invalid tenant ID in entity'));
        }
      }

      // 按租户分组保存
      const entitiesByTenant = new Map<string, TEntity[]>();
      for (const entity of entities) {
        const tenantIdStr = entity.tenantId.toString();
        if (!entitiesByTenant.has(tenantIdStr)) {
          entitiesByTenant.set(tenantIdStr, []);
        }
        entitiesByTenant.get(tenantIdStr)!.push(entity);
      }

      for (const [tenantIdStr, tenantEntities] of entitiesByTenant) {
        const tenantId = TenantId.fromString(tenantIdStr);
        await this.saveEntitiesBatch(tenantEntities, tenantId);
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 批量删除实体
   *
   * @description 批量删除多个租户感知实体
   * @param ids 要删除的实体ID数组
   * @param tenantId 租户ID
   * @returns Promise<ResultType<void>> 删除结果
   *
   * @example
   * ```typescript
   * const result = await repository.deleteAll([id1, id2, id3], tenantId);
   * if (result.isSuccess) {
   *   console.log('批量删除成功');
   * }
   * ```
   */
  public async deleteAll(
    ids: TId[],
    tenantId: TenantId
  ): Promise<ResultType<void>> {
    try {
      if (!ids || ids.length === 0) {
        return Result.success(undefined);
      }

      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return Result.failure(new Error('Invalid tenant ID'));
      }

      // 验证所有ID
      for (const id of ids) {
        if (!id || !EntityId.isValid(id.toString())) {
          return Result.failure(new Error('Invalid entity ID in batch'));
        }
      }

      await this.deleteEntitiesBatch(ids, tenantId);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 获取租户实体数量
   *
   * @description 获取指定租户的实体总数量
   * @param tenantId 租户ID
   * @returns Promise<ResultType<number>> 实体数量
   *
   * @example
   * ```typescript
   * const result = await repository.countByTenant(tenantId);
   * if (result.isSuccess) {
   *   console.log('实体数量:', result.value);
   * }
   * ```
   */
  public async countByTenant(
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
  ): Promise<number> {
    try {
      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return 0;
      }

      const count = await this.getEntityCountByTenant(tenantId);
      return count;
    } catch (error) {
      console.error(`根据租户ID统计实体数量失败，租户ID: ${tenantId}`, error);
      return 0;
    }
  }

  /**
   * 清除租户所有实体
   *
   * @description 清除指定租户的所有实体（仅用于测试）
   * @param tenantId 租户ID
   * @returns Promise<ResultType<void>> 清除结果
   *
   * @example
   * ```typescript
   * const result = await repository.clearByTenant(tenantId);
   * if (result.isSuccess) {
   *   console.log('租户所有实体已清除');
   * }
   * ```
   */
  public async clearByTenant(tenantId: TenantId): Promise<ResultType<void>> {
    try {
      if (!tenantId || !TenantId.isValid(tenantId.toString())) {
        return Result.failure(new Error('Invalid tenant ID'));
      }

      await this.clearAllEntitiesByTenant(tenantId);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 保存实体到存储
   *
   * @description 将租户感知实体保存到具体的存储实现中
   * @param entity 要保存的实体
   * @param tenantId 租户ID
   * @returns Promise<void>
   * @protected
   * @abstract
   */
  protected abstract saveEntity(
    entity: TEntity,
    tenantId: TenantId
  ): Promise<void>;

  /**
   * 从存储加载实体
   *
   * @description 从具体的存储实现中加载租户感知实体
   * @param id 实体ID
   * @param tenantId 租户ID
   * @returns Promise<TEntity | null> 加载的实体或null
   * @protected
   * @abstract
   */
  protected abstract loadEntity(
    id: TId,
    tenantId: TenantId
  ): Promise<TEntity | null>;

  /**
   * 从存储删除实体
   *
   * @description 从具体的存储实现中删除租户感知实体
   * @param id 实体ID
   * @param tenantId 租户ID
   * @returns Promise<void>
   * @protected
   * @abstract
   */
  protected abstract deleteEntity(id: TId, tenantId: TenantId): Promise<void>;

  /**
   * 从存储加载租户所有实体
   *
   * @description 从具体的存储实现中加载指定租户的所有实体
   * @param tenantId 租户ID
   * @returns Promise<TEntity[]> 实体数组
   * @protected
   * @abstract
   */
  protected abstract loadEntitiesByTenant(
    tenantId: TenantId
  ): Promise<TEntity[]>;

  /**
   * 批量保存实体到存储
   *
   * @description 将多个租户感知实体批量保存到具体的存储实现中
   * @param entities 要保存的实体数组
   * @param tenantId 租户ID
   * @returns Promise<void>
   * @protected
   */
  protected async saveEntitiesBatch(
    entities: TEntity[],
    tenantId: TenantId
  ): Promise<void> {
    for (const entity of entities) {
      await this.saveEntity(entity, tenantId);
    }
  }

  /**
   * 批量从存储删除实体
   *
   * @description 从具体的存储实现中批量删除租户感知实体
   * @param ids 要删除的实体ID数组
   * @param tenantId 租户ID
   * @returns Promise<void>
   * @protected
   */
  protected async deleteEntitiesBatch(
    ids: TId[],
    tenantId: TenantId
  ): Promise<void> {
    for (const id of ids) {
      await this.deleteEntity(id, tenantId);
    }
  }

  /**
   * 获取存储中租户的实体数量
   *
   * @description 获取具体存储实现中指定租户的实体数量
   * @param tenantId 租户ID
   * @returns Promise<number> 实体数量
   * @protected
   * @abstract
   */
  protected abstract getEntityCountByTenant(
    tenantId: TenantId
  ): Promise<number>;

  /**
   * 清除存储中租户的所有实体
   *
   * @description 清除具体存储实现中指定租户的所有实体
   * @param tenantId 租户ID
   * @returns Promise<void>
   * @protected
   * @abstract
   */
  protected abstract clearAllEntitiesByTenant(
    tenantId: TenantId
  ): Promise<void>;

  /**
   * 根据租户ID和用户ID加载实体
   *
   * @description 从具体的存储实现中加载指定租户和用户的实体
   * @param tenantId 租户ID
   * @param userId 用户ID
   * @returns Promise<TEntity | null> 加载的实体或null
   * @protected
   * @abstract
   */
  protected abstract loadEntityByTenantAndUser(
    tenantId: TenantId,
    userId: UserId
  ): Promise<TEntity | null>;

  /**
   * 根据租户ID和创建者ID加载实体列表
   *
   * @description 从具体的存储实现中加载指定租户和创建者的实体列表
   * @param tenantId 租户ID
   * @param createdBy 创建者ID
   * @returns Promise<TEntity[]> 实体数组
   * @protected
   * @abstract
   */
  protected abstract loadEntitiesByTenantAndCreatedBy(
    tenantId: TenantId,
    createdBy: UserId
  ): Promise<TEntity[]>;

  /**
   * 检查租户下是否存在实体
   *
   * @description 检查具体存储实现中指定租户下是否存在满足条件的实体
   * @param tenantId 租户ID
   * @param criteria 查询条件
   * @returns Promise<boolean> 是否存在
   * @protected
   * @abstract
   */
  protected abstract checkEntityExistsByTenant(
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
