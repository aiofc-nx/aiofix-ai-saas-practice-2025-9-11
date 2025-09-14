import { BaseEntity } from '../../domain/entities/base.entity';
import { EntityId } from '../../domain/value-objects/entity-id';
import { IBaseRepository } from '../../domain/repositories';
import { ResultType, Result } from '../../shared/types/common';

/**
 * 基础仓储实现
 *
 * 基础仓储提供了仓储接口的通用实现，包含基础的CRUD操作、
 * 事务管理、并发控制等功能。所有具体仓储都应该继承此类。
 *
 * @description 基础仓储的抽象实现，提供仓储的通用功能
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
 * ## 业务逻辑流程
 *
 * 1. **聚合根保存**：接收聚合根并保存到存储
 * 2. **版本检查**：检查聚合根的版本一致性
 * 3. **事务开始**：开始数据库事务
 * 4. **数据持久化**：将聚合根状态保存到存储
 * 5. **事件保存**：保存聚合根的领域事件
 * 6. **事务提交**：提交数据库事务
 * 7. **缓存更新**：更新相关缓存
 *
 * @template TEntity 实体类型
 * @template TId 实体ID类型，默认为EntityId
 *
 * @example
 * ```typescript
 * // 具体仓储实现
 * class UserRepository extends BaseRepository<User, EntityId> {
 *   protected async saveEntity(entity: User): Promise<void> {
 *     // 实现具体的保存逻辑
 *   }
 *
 *   protected async loadEntity(id: EntityId): Promise<User | null> {
 *     // 实现具体的加载逻辑
 *   }
 *
 *   protected async deleteEntity(id: EntityId): Promise<void> {
 *     // 实现具体的删除逻辑
 *   }
 * }
 *
 * // 使用仓储
 * const userRepository = new UserRepository();
 * const user = await userRepository.findById(userId);
 * if (user) {
 *   user.updateName('新名称');
 *   await userRepository.save(user);
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseRepository<
  TEntity extends BaseEntity & { id: EntityId; version: number },
  TId extends EntityId = EntityId
> implements IBaseRepository<TEntity>
{
  /**
   * 根据ID查找实体
   *
   * @description 根据实体ID查找指定的实体
   * @param id 实体ID
   * @returns Promise<ResultType<TEntity | null>> 查找结果
   *
   * @example
   * ```typescript
   * const result = await repository.findById(entityId);
   * if (result.isSuccess && result.value) {
   *   console.log('找到实体:', result.value);
   * }
   * ```
   */
  public async findById(id: EntityId): Promise<TEntity | null> {
    try {
      if (!id || !EntityId.isValid(id.toString())) {
        return null;
      }

      const entity = await this.loadEntity(id as TId);
      return entity;
    } catch (error) {
      console.error(`查找实体失败，ID: ${id}`, error);
      return null;
    }
  }

  /**
   * 保存实体
   *
   * @description 保存实体到存储，支持新增和更新操作
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
  public async save(entity: TEntity): Promise<void> {
    try {
      if (!entity) {
        throw new Error('Entity cannot be null or undefined');
      }

      if (!EntityId.isValid(entity.id.toString())) {
        throw new Error('Invalid entity ID');
      }

      // 检查是否存在版本冲突
      const existingEntity = await this.loadEntity(entity.id as TId);
      if (existingEntity && existingEntity.version !== entity.version) {
        throw new Error(
          `Version conflict: expected ${existingEntity.version}, got ${entity.version}`
        );
      }

      await this.saveEntity(entity);
    } catch (error) {
      console.error(`保存实体失败，ID: ${entity.id}`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * 删除实体
   *
   * @description 从存储中删除指定的实体
   * @param id 实体ID
   * @returns Promise<ResultType<void>> 删除结果
   *
   * @example
   * ```typescript
   * const result = await repository.delete(entityId);
   * if (result.isSuccess) {
   *   console.log('实体删除成功');
   * }
   * ```
   */
  public async delete(
    id: EntityId,
    options?: { hard?: boolean }
  ): Promise<void> {
    try {
      if (!id || !EntityId.isValid(id.toString())) {
        throw new Error('Invalid entity ID');
      }

      const entity = await this.loadEntity(id as TId);
      if (!entity) {
        throw new Error('Entity not found');
      }

      await this.deleteEntity(id as TId);
    } catch (error) {
      console.error(`删除实体失败，ID: ${id}`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * 检查实体是否存在
   *
   * @description 检查指定ID的实体是否存在
   * @param id 实体ID
   * @returns Promise<ResultType<boolean>> 检查结果
   *
   * @example
   * ```typescript
   * const result = await repository.exists(entityId);
   * if (result.isSuccess && result.value) {
   *   console.log('实体存在');
   * }
   * ```
   */
  public async exists(id: EntityId): Promise<boolean> {
    try {
      if (!id || !EntityId.isValid(id.toString())) {
        return false;
      }

      const entity = await this.loadEntity(id as TId);
      return entity !== null;
    } catch (error) {
      console.error(`检查实体存在性失败，ID: ${id}`, error);
      return false;
    }
  }

  /**
   * 获取所有实体
   *
   * @description 获取所有实体的列表
   * @returns Promise<ResultType<TEntity[]>> 实体列表
   *
   * @example
   * ```typescript
   * const result = await repository.findAll();
   * if (result.isSuccess) {
   *   console.log('实体数量:', result.value.length);
   * }
   * ```
   */
  public async findAll(): Promise<ResultType<TEntity[]>> {
    try {
      const entities = await this.loadAllEntities();
      return Result.success(entities);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 批量保存实体
   *
   * @description 批量保存多个实体
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
      }

      await this.saveEntitiesBatch(entities);
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
   * @description 批量删除多个实体
   * @param ids 要删除的实体ID数组
   * @returns Promise<ResultType<void>> 删除结果
   *
   * @example
   * ```typescript
   * const result = await repository.deleteAll([id1, id2, id3]);
   * if (result.isSuccess) {
   *   console.log('批量删除成功');
   * }
   * ```
   */
  public async deleteAll(ids: TId[]): Promise<ResultType<void>> {
    try {
      if (!ids || ids.length === 0) {
        return Result.success(undefined);
      }

      // 验证所有ID
      for (const id of ids) {
        if (!id || !EntityId.isValid(id.toString())) {
          return Result.failure(new Error('Invalid entity ID in batch'));
        }
      }

      await this.deleteEntitiesBatch(ids);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 获取实体数量
   *
   * @description 获取存储中实体的总数量
   * @returns Promise<ResultType<number>> 实体数量
   *
   * @example
   * ```typescript
   * const result = await repository.count();
   * if (result.isSuccess) {
   *   console.log('实体数量:', result.value);
   * }
   * ```
   */
  public async count(criteria?: Record<string, any>): Promise<number> {
    try {
      const count = await this.getEntityCount();
      return count;
    } catch (error) {
      console.error('获取实体数量失败', error);
      return 0;
    }
  }

  /**
   * 清除所有实体
   *
   * @description 清除存储中的所有实体（仅用于测试）
   * @returns Promise<ResultType<void>> 清除结果
   *
   * @example
   * ```typescript
   * const result = await repository.clear();
   * if (result.isSuccess) {
   *   console.log('所有实体已清除');
   * }
   * ```
   */
  public async clear(): Promise<ResultType<void>> {
    try {
      await this.clearAllEntities();
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
   * @description 将实体保存到具体的存储实现中
   * @param entity 要保存的实体
   * @returns Promise<void>
   * @protected
   * @abstract
   */
  protected abstract saveEntity(entity: TEntity): Promise<void>;

  /**
   * 从存储加载实体
   *
   * @description 从具体的存储实现中加载实体
   * @param id 实体ID
   * @returns Promise<TEntity | null> 加载的实体或null
   * @protected
   * @abstract
   */
  protected abstract loadEntity(id: TId): Promise<TEntity | null>;

  /**
   * 从存储删除实体
   *
   * @description 从具体的存储实现中删除实体
   * @param id 实体ID
   * @returns Promise<void>
   * @protected
   * @abstract
   */
  protected abstract deleteEntity(id: TId): Promise<void>;

  /**
   * 从存储加载所有实体
   *
   * @description 从具体的存储实现中加载所有实体
   * @returns Promise<TEntity[]> 实体数组
   * @protected
   * @abstract
   */
  protected abstract loadAllEntities(): Promise<TEntity[]>;

  /**
   * 批量保存实体到存储
   *
   * @description 将多个实体批量保存到具体的存储实现中
   * @param entities 要保存的实体数组
   * @returns Promise<void>
   * @protected
   */
  protected async saveEntitiesBatch(entities: TEntity[]): Promise<void> {
    for (const entity of entities) {
      await this.saveEntity(entity);
    }
  }

  /**
   * 批量从存储删除实体
   *
   * @description 从具体的存储实现中批量删除实体
   * @param ids 要删除的实体ID数组
   * @returns Promise<void>
   * @protected
   */
  protected async deleteEntitiesBatch(ids: TId[]): Promise<void> {
    for (const id of ids) {
      await this.deleteEntity(id);
    }
  }

  /**
   * 获取存储中的实体数量
   *
   * @description 获取具体存储实现中的实体数量
   * @returns Promise<number> 实体数量
   * @protected
   * @abstract
   */
  protected abstract getEntityCount(): Promise<number>;

  /**
   * 清除存储中的所有实体
   *
   * @description 清除具体存储实现中的所有实体
   * @returns Promise<void>
   * @protected
   * @abstract
   */
  protected abstract clearAllEntities(): Promise<void>;
}
