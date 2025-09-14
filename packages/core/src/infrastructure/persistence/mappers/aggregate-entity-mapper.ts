import { BaseAggregateRoot } from '../../../domain/aggregates/base.aggregate-root';
import { AggregateDatabaseEntity } from '../entities/aggregate-database-entity';
import { BaseEntityMapperImpl } from './base-entity-mapper';

/**
 * 聚合根实体映射器
 *
 * 聚合根实体映射器提供聚合根领域实体和数据库实体之间的映射功能。
 * 处理聚合根特有的字段转换，包括版本号、事件版本、状态快照等字段。
 *
 * @description 所有聚合根实体映射器的基类
 * 提供聚合根相关字段的映射功能和通用转换逻辑
 *
 * ## 业务规则
 *
 * ### 版本映射规则
 * - 聚合根版本号保持整数格式
 * - 事件版本号保持整数格式
 * - 版本号用于乐观锁控制
 * - 版本号用于事件溯源
 *
 * ### 状态映射规则
 * - 聚合根状态以JSON格式存储
 * - 状态快照用于快速恢复
 * - 状态序列化和反序列化
 * - 状态版本化管理
 *
 * ### 类型映射规则
 * - 聚合根类型保持字符串格式
 * - 类型用于多态存储
 * - 类型用于事件路由
 * - 类型用于状态重建
 *
 * ## 业务逻辑流程
 *
 * 1. **版本验证**：验证版本号的有效性
 * 2. **状态映射**：映射聚合根状态到JSON格式
 * 3. **类型映射**：映射聚合根类型
 * 4. **数据验证**：验证映射结果的正确性
 * 5. **异常处理**：处理映射过程中的异常
 *
 * @template TDomainEntity 聚合根领域实体类型
 * @template TDatabaseEntity 聚合根数据库实体类型
 *
 * @example
 * ```typescript
 * class UserAggregateMapper extends AggregateEntityMapper<UserAggregate, UserAggregateDatabaseEntity> {
 *   protected createDatabaseEntity(): UserAggregateDatabaseEntity {
 *     return new UserAggregateDatabaseEntity();
 *   }
 *
 *   protected createDomainEntity(database: UserAggregateDatabaseEntity): UserAggregate {
 *     return new UserAggregate(
 *       EntityId.fromString(database.id),
 *       database.version,
 *       database.createdAt,
 *       database.updatedAt
 *     );
 *   }
 *
 *   protected mapBusinessFields(domain: UserAggregate, database: UserAggregateDatabaseEntity): void {
 *     database.state = domain.getState();
 *     database.aggregateType = domain.constructor.name;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class AggregateEntityMapper<
  TDomainEntity extends BaseAggregateRoot,
  TDatabaseEntity extends AggregateDatabaseEntity
> extends BaseEntityMapperImpl<TDomainEntity, TDatabaseEntity> {
  /**
   * 映射基础字段（重写基类方法）
   *
   * @description 映射聚合根领域实体和数据库实体之间的基础字段
   * 包括ID、时间戳、版本相关字段等
   *
   * @param domainEntity 领域实体
   * @param databaseEntity 数据库实体
   * @protected
   * @override
   */
  protected override mapBaseFields(
    domainEntity: TDomainEntity,
    databaseEntity: TDatabaseEntity
  ): void {
    // 调用基类方法映射基础字段
    super.mapBaseFields(domainEntity, databaseEntity);

    // 映射聚合根相关字段
    this.mapAggregateFields(domainEntity, databaseEntity);
  }

  /**
   * 验证基础字段（重写基类方法）
   *
   * @description 验证数据库实体的基础字段是否有效
   * 包括ID、时间戳、版本相关字段等
   *
   * @param databaseEntity 数据库实体
   * @protected
   * @override
   * @throws {Error} 当字段无效时抛出
   */
  protected override validateBaseFields(databaseEntity: TDatabaseEntity): void {
    // 调用基类方法验证基础字段
    super.validateBaseFields(databaseEntity);

    // 验证聚合根相关字段
    this.validateAggregateFields(databaseEntity);
  }

  /**
   * 映射聚合根相关字段
   *
   * @description 映射聚合根的版本和状态相关字段
   * 包括版本号、事件版本、状态快照、聚合根类型等字段
   *
   * @param domainEntity 领域实体
   * @param databaseEntity 数据库实体
   * @protected
   */
  protected mapAggregateFields(
    domainEntity: TDomainEntity,
    databaseEntity: TDatabaseEntity
  ): void {
    databaseEntity.version = domainEntity.getVersion();
    databaseEntity.eventVersion = 0; // 默认事件版本号，实际应该从聚合根获取
    databaseEntity.state = this.serializeState(domainEntity);
    databaseEntity.aggregateType = domainEntity.constructor.name;
  }

  /**
   * 验证聚合根相关字段
   *
   * @description 验证数据库实体的聚合根相关字段是否有效
   * 包括版本号、事件版本、状态快照、聚合根类型等字段
   *
   * @param databaseEntity 数据库实体
   * @protected
   * @throws {Error} 当字段无效时抛出
   */
  protected validateAggregateFields(databaseEntity: TDatabaseEntity): void {
    if (
      typeof databaseEntity.version !== 'number' ||
      databaseEntity.version < 0
    ) {
      throw new Error('Database entity version must be a non-negative number');
    }

    if (
      typeof databaseEntity.eventVersion !== 'number' ||
      databaseEntity.eventVersion < 0
    ) {
      throw new Error(
        'Database entity event version must be a non-negative number'
      );
    }

    if (!databaseEntity.aggregateType) {
      throw new Error('Database entity aggregate type is required');
    }
  }

  /**
   * 序列化聚合根状态
   *
   * @description 将聚合根的状态序列化为JSON格式
   * 用于存储到数据库中
   *
   * @param domainEntity 领域实体
   * @returns 序列化后的状态
   * @protected
   */
  protected serializeState(domainEntity: TDomainEntity): any {
    try {
      // 获取聚合根的状态快照
      const state = (domainEntity as any).getStateSnapshot?.() || {};
      return JSON.parse(JSON.stringify(state));
    } catch (error) {
      throw new Error(
        `Failed to serialize aggregate state: ${(error as Error).message}`
      );
    }
  }

  /**
   * 反序列化聚合根状态
   *
   * @description 将JSON格式的状态反序列化为聚合根状态
   * 用于从数据库恢复聚合根状态
   *
   * @param stateData 序列化的状态数据
   * @returns 反序列化后的状态
   * @protected
   */
  protected deserializeState(stateData: any): any {
    if (!stateData) {
      return null;
    }

    try {
      return JSON.parse(JSON.stringify(stateData));
    } catch (error) {
      throw new Error(
        `Failed to deserialize aggregate state: ${(error as Error).message}`
      );
    }
  }
}
