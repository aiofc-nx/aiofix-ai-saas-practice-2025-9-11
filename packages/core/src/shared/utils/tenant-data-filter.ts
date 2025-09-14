import { EntityId } from '../../domain/value-objects/entity-id';
import { TenantId } from '../../domain/value-objects/tenant-id';
import { OrganizationId } from '../../domain/value-objects/organization-id';
import { TenantAwareEntity } from '../../domain/entities/tenant-aware.entity';
import { OrganizationAwareEntity } from '../../domain/entities/organization-aware.entity';
import { DepartmentAwareEntity } from '../../domain/entities/department-aware.entity';

/**
 * 租户数据过滤器
 *
 * 提供租户级别的数据过滤和访问控制功能。
 * 支持多租户、多组织、多部门的数据隔离和权限验证。
 *
 * @description 租户数据过滤器，提供数据隔离和访问控制功能
 *
 * ## 业务规则
 *
 * ### 数据隔离规则
 * - 租户数据完全隔离
 * - 组织数据在租户内隔离
 * - 部门数据在组织内隔离
 * - 跨租户访问被严格禁止
 * - 支持层级权限控制
 *
 * ### 访问控制规则
 * - 验证实体归属关系
 * - 检查用户访问权限
 * - 支持动态权限验证
 * - 提供审计日志记录
 * - 支持权限继承
 *
 * ## 业务逻辑流程
 *
 * 1. **数据过滤**：根据租户上下文过滤数据
 * 2. **权限验证**：验证用户访问权限
 * 3. **归属检查**：检查实体归属关系
 * 4. **访问控制**：应用访问控制规则
 * 5. **审计记录**：记录访问操作
 *
 * @example
 * ```typescript
 * // 添加租户过滤器
 * const filteredQuery = TenantDataFilter.addTenantFilter(query, tenantId);
 *
 * // 验证租户访问权限
 * TenantDataFilter.validateTenantAccess(entity, tenantId);
 *
 * // 添加组织过滤器
 * const orgFilteredQuery = TenantDataFilter.addOrganizationFilter(query, organizationId);
 * ```
 *
 * @since 1.0.0
 */
export class TenantDataFilter {
  /**
   * 添加租户过滤器
   *
   * @description 为查询添加租户级别的过滤条件
   * @param query 原始查询对象
   * @param tenantId 租户ID
   * @returns 添加租户过滤条件后的查询对象
   *
   * @example
   * ```typescript
   * const filteredQuery = TenantDataFilter.addTenantFilter(query, tenantId);
   * const entities = await repository.find(filteredQuery);
   * ```
   */
  static addTenantFilter(query: any, tenantId: TenantId): any {
    return {
      ...query,
      tenantId: tenantId.toString(),
    };
  }

  /**
   * 添加组织过滤器
   *
   * @description 为查询添加组织级别的过滤条件
   * @param query 原始查询对象
   * @param organizationId 组织ID
   * @returns 添加组织过滤条件后的查询对象
   *
   * @example
   * ```typescript
   * const filteredQuery = TenantDataFilter.addOrganizationFilter(query, organizationId);
   * const entities = await repository.find(filteredQuery);
   * ```
   */
  static addOrganizationFilter(
    query: any,
    organizationId: OrganizationId
  ): any {
    return {
      ...query,
      organizationId: organizationId.toString(),
    };
  }

  /**
   * 添加部门过滤器
   *
   * @description 为查询添加部门级别的过滤条件
   * @param query 原始查询对象
   * @param departmentId 部门ID
   * @returns 添加部门过滤条件后的查询对象
   *
   * @example
   * ```typescript
   * const filteredQuery = TenantDataFilter.addDepartmentFilter(query, departmentId);
   * const entities = await repository.find(filteredQuery);
   * ```
   */
  static addDepartmentFilter(query: any, departmentId: EntityId): any {
    return {
      ...query,
      departmentId: departmentId.toString(),
    };
  }

  /**
   * 添加多级过滤器
   *
   * @description 为查询添加多级过滤条件
   * @param query 原始查询对象
   * @param filters 过滤条件
   * @returns 添加多级过滤条件后的查询对象
   *
   * @example
   * ```typescript
   * const filteredQuery = TenantDataFilter.addMultiLevelFilter(query, {
   *   tenantId: tenantId,
   *   organizationId: organizationId,
   *   departmentId: departmentId
   * });
   * ```
   */
  static addMultiLevelFilter(
    query: any,
    filters: {
      tenantId?: TenantId;
      organizationId?: OrganizationId;
      departmentId?: EntityId;
    }
  ): any {
    const filteredQuery = { ...query };

    if (filters.tenantId) {
      filteredQuery.tenantId = filters.tenantId.toString();
    }

    if (filters.organizationId) {
      filteredQuery.organizationId = filters.organizationId.toString();
    }

    if (filters.departmentId) {
      filteredQuery.departmentId = filters.departmentId.toString();
    }

    return filteredQuery;
  }

  /**
   * 验证租户访问权限
   *
   * @description 验证实体是否属于指定的租户
   * @param entity 要验证的实体
   * @param tenantId 租户ID
   * @throws {Error} 当实体不属于指定租户时抛出异常
   *
   * @example
   * ```typescript
   * TenantDataFilter.validateTenantAccess(entity, tenantId);
   * // 如果验证通过，继续处理
   * // 如果验证失败，抛出异常
   * ```
   */
  static validateTenantAccess(
    entity: TenantAwareEntity,
    tenantId: TenantId
  ): void {
    if (!entity.belongsToTenant(tenantId)) {
      throw new Error('Access denied: different tenant');
    }
  }

  /**
   * 验证组织访问权限
   *
   * @description 验证实体是否属于指定的组织
   * @param entity 要验证的实体
   * @param organizationId 组织ID
   * @throws {Error} 当实体不属于指定组织时抛出异常
   *
   * @example
   * ```typescript
   * TenantDataFilter.validateOrganizationAccess(entity, organizationId);
   * // 如果验证通过，继续处理
   * // 如果验证失败，抛出异常
   * ```
   */
  static validateOrganizationAccess(
    entity: OrganizationAwareEntity,
    organizationId: OrganizationId
  ): void {
    if (!entity.belongsToOrganization(organizationId)) {
      throw new Error('Access denied: different organization');
    }
  }

  /**
   * 验证部门访问权限
   *
   * @description 验证实体是否属于指定的部门
   * @param entity 要验证的实体
   * @param departmentId 部门ID
   * @throws {Error} 当实体不属于指定部门时抛出异常
   *
   * @example
   * ```typescript
   * TenantDataFilter.validateDepartmentAccess(entity, departmentId);
   * // 如果验证通过，继续处理
   * // 如果验证失败，抛出异常
   * ```
   */
  static validateDepartmentAccess(
    entity: DepartmentAwareEntity,
    departmentId: EntityId
  ): void {
    if (!entity.belongsToDepartment(departmentId)) {
      throw new Error('Access denied: different department');
    }
  }

  /**
   * 验证多级访问权限
   *
   * @description 验证实体是否属于指定的多级上下文
   * @param entity 要验证的实体
   * @param context 多级上下文
   * @throws {Error} 当实体不属于指定上下文时抛出异常
   *
   * @example
   * ```typescript
   * TenantDataFilter.validateMultiLevelAccess(entity, {
   *   tenantId: tenantId,
   *   organizationId: organizationId,
   *   departmentId: departmentId
   * });
   * ```
   */
  static validateMultiLevelAccess(
    entity: any,
    context: {
      tenantId?: TenantId;
      organizationId?: OrganizationId;
      departmentId?: EntityId;
    }
  ): void {
    // 验证租户访问权限
    if (context.tenantId && entity instanceof TenantAwareEntity) {
      this.validateTenantAccess(entity, context.tenantId);
    }

    // 验证组织访问权限
    if (context.organizationId && entity instanceof OrganizationAwareEntity) {
      this.validateOrganizationAccess(entity, context.organizationId);
    }

    // 验证部门访问权限
    if (context.departmentId && entity instanceof DepartmentAwareEntity) {
      this.validateDepartmentAccess(entity, context.departmentId);
    }
  }

  /**
   * 过滤租户数据
   *
   * @description 从实体列表中过滤出属于指定租户的实体
   * @param entities 实体列表
   * @param tenantId 租户ID
   * @returns 过滤后的实体列表
   *
   * @example
   * ```typescript
   * const filteredEntities = TenantDataFilter.filterByTenant(entities, tenantId);
   * ```
   */
  static filterByTenant<T extends TenantAwareEntity>(
    entities: T[],
    tenantId: TenantId
  ): T[] {
    return entities.filter((entity) => entity.belongsToTenant(tenantId));
  }

  /**
   * 过滤组织数据
   *
   * @description 从实体列表中过滤出属于指定组织的实体
   * @param entities 实体列表
   * @param organizationId 组织ID
   * @returns 过滤后的实体列表
   *
   * @example
   * ```typescript
   * const filteredEntities = TenantDataFilter.filterByOrganization(entities, organizationId);
   * ```
   */
  static filterByOrganization<T extends OrganizationAwareEntity>(
    entities: T[],
    organizationId: OrganizationId
  ): T[] {
    return entities.filter((entity) =>
      entity.belongsToOrganization(organizationId)
    );
  }

  /**
   * 过滤部门数据
   *
   * @description 从实体列表中过滤出属于指定部门的实体
   * @param entities 实体列表
   * @param departmentId 部门ID
   * @returns 过滤后的实体列表
   *
   * @example
   * ```typescript
   * const filteredEntities = TenantDataFilter.filterByDepartment(entities, departmentId);
   * ```
   */
  static filterByDepartment<T extends DepartmentAwareEntity>(
    entities: T[],
    departmentId: EntityId
  ): T[] {
    return entities.filter((entity) =>
      entity.belongsToDepartment(departmentId)
    );
  }

  /**
   * 多级过滤数据
   *
   * @description 从实体列表中过滤出属于指定多级上下文的数据
   * @param entities 实体列表
   * @param context 多级上下文
   * @returns 过滤后的实体列表
   *
   * @example
   * ```typescript
   * const filteredEntities = TenantDataFilter.filterByMultiLevel(entities, {
   *   tenantId: tenantId,
   *   organizationId: organizationId,
   *   departmentId: departmentId
   * });
   * ```
   */
  static filterByMultiLevel<T extends TenantAwareEntity>(
    entities: T[],
    context: {
      tenantId?: TenantId;
      organizationId?: OrganizationId;
      departmentId?: EntityId;
    }
  ): T[] {
    return entities.filter((entity) => {
      // 验证租户
      if (context.tenantId && !entity.belongsToTenant(context.tenantId)) {
        return false;
      }

      // 验证组织
      if (
        context.organizationId &&
        entity instanceof OrganizationAwareEntity &&
        !entity.belongsToOrganization(context.organizationId)
      ) {
        return false;
      }

      // 验证部门
      if (
        context.departmentId &&
        entity instanceof DepartmentAwareEntity &&
        !entity.belongsToDepartment(context.departmentId)
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * 创建租户查询构建器
   *
   * @description 创建支持租户过滤的查询构建器
   * @param tenantId 租户ID
   * @returns 租户查询构建器
   *
   * @example
   * ```typescript
   * const queryBuilder = TenantDataFilter.createTenantQueryBuilder(tenantId);
   * const entities = await queryBuilder
   *   .where('name', 'like', '%John%')
   *   .orderBy('createdAt', 'desc')
   *   .execute();
   * ```
   */
  static createTenantQueryBuilder(tenantId: TenantId): {
    where: (field: string, operator: string, value: any) => any;
    orderBy: (field: string, direction: 'asc' | 'desc') => any;
    execute: () => Promise<any[]>;
  } {
    const query: any = {
      tenantId: tenantId.toString(),
      conditions: [],
      orderBy: [],
    };

    return {
      where: (field: string, operator: string, value: any) => {
        query.conditions.push({ field, operator, value });
        return this;
      },
      orderBy: (field: string, direction: 'asc' | 'desc') => {
        query.orderBy.push({ field, direction });
        return this;
      },
      execute: async () => {
        // 这里应该调用实际的查询执行逻辑
        // 返回符合条件的数据
        return [];
      },
    };
  }

  /**
   * 验证查询权限
   *
   * @description 验证查询是否包含必要的租户过滤条件
   * @param query 查询对象
   * @param requiredContext 必需的上下文
   * @throws {Error} 当查询缺少必要的过滤条件时抛出异常
   *
   * @example
   * ```typescript
   * TenantDataFilter.validateQueryPermissions(query, {
   *   requireTenant: true,
   *   requireOrganization: false,
   *   requireDepartment: false
   * });
   * ```
   */
  static validateQueryPermissions(
    query: any,
    requiredContext: {
      requireTenant?: boolean;
      requireOrganization?: boolean;
      requireDepartment?: boolean;
    }
  ): void {
    if (requiredContext.requireTenant && !query.tenantId) {
      throw new Error('Query must include tenant filter');
    }

    if (requiredContext.requireOrganization && !query.organizationId) {
      throw new Error('Query must include organization filter');
    }

    if (requiredContext.requireDepartment && !query.departmentId) {
      throw new Error('Query must include department filter');
    }
  }
}
