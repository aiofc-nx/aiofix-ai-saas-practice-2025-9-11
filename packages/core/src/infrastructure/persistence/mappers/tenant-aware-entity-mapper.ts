import { TenantAwareEntity } from '../../../domain/entities/tenant-aware.entity';
import { TenantAwareDatabaseEntity } from '../entities/tenant-aware-database-entity';
import { BaseEntityMapperImpl } from './base-entity-mapper';

/**
 * 租户感知实体映射器
 *
 * 租户感知实体映射器提供租户感知领域实体和数据库实体之间的映射功能。
 * 处理租户相关的字段转换，包括租户ID、创建者、更新者等字段。
 *
 * @description 所有租户感知实体映射器的基类
 * 提供租户相关字段的映射功能和通用转换逻辑
 *
 * ## 业务规则
 *
 * ### 租户映射规则
 * - 租户ID保持字符串格式
 * - 创建者和更新者用户ID保持字符串格式
 * - 保持租户字段的一致性
 * - 处理null和undefined值
 *
 * ### 验证规则
 * - 验证租户ID的有效性
 * - 验证用户ID的有效性
 * - 验证租户字段的完整性
 * - 处理映射过程中的异常
 *
 * ### 权限规则
 * - 确保租户隔离的一致性
 * - 验证用户权限的有效性
 * - 处理跨租户访问的异常
 * - 维护数据安全边界
 *
 * ## 业务逻辑流程
 *
 * 1. **租户验证**：验证租户ID和用户ID的有效性
 * 2. **租户字段映射**：映射租户ID、创建者、更新者等字段
 * 3. **业务字段映射**：由子类实现具体的业务字段映射
 * 4. **数据验证**：验证映射结果的正确性
 * 5. **异常处理**：处理映射过程中的异常
 *
 * @template TDomainEntity 租户感知领域实体类型
 * @template TDatabaseEntity 租户感知数据库实体类型
 *
 * @example
 * ```typescript
 * class UserProfileEntityMapper extends TenantAwareEntityMapper<UserProfile, UserProfileDatabaseEntity> {
 *   protected createDatabaseEntity(): UserProfileDatabaseEntity {
 *     return new UserProfileDatabaseEntity();
 *   }
 *
 *   protected createDomainEntity(database: UserProfileDatabaseEntity): UserProfile {
 *     return new UserProfile(
 *       EntityId.fromString(database.id),
 *       TenantId.fromString(database.tenantId),
 *       UserId.fromString(database.createdBy),
 *       database.createdAt,
 *       database.updatedAt,
 *       UserId.fromString(database.updatedBy)
 *     );
 *   }
 *
 *   protected mapBusinessFields(domain: UserProfile, database: UserProfileDatabaseEntity): void {
 *     database.name = domain.getName();
 *     database.email = domain.getEmail();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class TenantAwareEntityMapper<
  TDomainEntity extends TenantAwareEntity,
  TDatabaseEntity extends TenantAwareDatabaseEntity
> extends BaseEntityMapperImpl<TDomainEntity, TDatabaseEntity> {
  /**
   * 映射基础字段（重写基类方法）
   *
   * @description 映射领域实体和数据库实体之间的基础字段
   * 包括ID、时间戳、租户相关字段等
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

    // 映射租户相关字段
    this.mapTenantFields(domainEntity, databaseEntity);
  }

  /**
   * 验证基础字段（重写基类方法）
   *
   * @description 验证数据库实体的基础字段是否有效
   * 包括ID、时间戳、租户相关字段等
   *
   * @param databaseEntity 数据库实体
   * @protected
   * @override
   * @throws {Error} 当字段无效时抛出
   */
  protected override validateBaseFields(databaseEntity: TDatabaseEntity): void {
    // 调用基类方法验证基础字段
    super.validateBaseFields(databaseEntity);

    // 验证租户相关字段
    this.validateTenantFields(databaseEntity);
  }

  /**
   * 映射租户相关字段
   *
   * @description 映射租户感知实体的租户相关字段
   * 包括租户ID、创建者、更新者等字段
   *
   * @param domainEntity 领域实体
   * @param databaseEntity 数据库实体
   * @protected
   */
  protected mapTenantFields(
    domainEntity: TDomainEntity,
    databaseEntity: TDatabaseEntity
  ): void {
    databaseEntity.tenantId = domainEntity.getTenantId().toString();
    databaseEntity.createdBy = domainEntity.getCreatedBy().toString();
    databaseEntity.updatedBy = domainEntity.getUpdatedBy().toString();
  }

  /**
   * 验证租户相关字段
   *
   * @description 验证数据库实体的租户相关字段是否有效
   * 包括租户ID、创建者、更新者等字段
   *
   * @param databaseEntity 数据库实体
   * @protected
   * @throws {Error} 当字段无效时抛出
   */
  protected validateTenantFields(databaseEntity: TDatabaseEntity): void {
    if (!databaseEntity.tenantId) {
      throw new Error('Database entity tenant ID is required');
    }

    if (!databaseEntity.createdBy) {
      throw new Error('Database entity created by user ID is required');
    }

    if (!databaseEntity.updatedBy) {
      throw new Error('Database entity updated by user ID is required');
    }
  }
}
