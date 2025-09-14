import { EntityId } from '../../domain/value-objects/entity-id';
import { TenantId } from '../../domain/value-objects/tenant-id';
import { OrganizationId } from '../../domain/value-objects/organization-id';
import { UserId } from '../../domain/value-objects/user-id';

/**
 * 租户上下文接口
 *
 * @description 定义租户上下文的结构
 */
export interface TenantContext {
  tenantId: TenantId;
  userId: UserId;
  organizationId?: OrganizationId;
  departmentId?: EntityId;
  permissions: string[];
  features: string[];
}

/**
 * 请求接口扩展
 *
 * @description 扩展Express Request接口，添加租户上下文
 */
export interface RequestWithTenantContext extends Request {
  tenantContext?: TenantContext;
}

/**
 * 租户上下文工具类
 *
 * 提供租户上下文提取、验证和管理功能。
 * 支持从HTTP请求中提取租户信息，并提供各种验证方法。
 *
 * @description 租户上下文工具类，提供租户相关的工具方法
 *
 * ## 业务规则
 *
 * ### 上下文提取规则
 * - 从HTTP请求头中提取租户信息
 * - 支持多种租户标识符格式
 * - 验证租户信息的有效性
 * - 提供默认值和错误处理
 *
 * ### 权限验证规则
 * - 验证用户权限的有效性
 * - 支持权限的层级验证
 * - 提供权限检查的便捷方法
 * - 支持动态权限验证
 *
 * ## 业务逻辑流程
 *
 * 1. **上下文提取**：从请求中提取租户信息
 * 2. **信息验证**：验证租户信息的有效性
 * 3. **权限检查**：检查用户权限和功能
 * 4. **上下文构建**：构建完整的租户上下文
 * 5. **错误处理**：处理无效或缺失的信息
 *
 * @example
 * ```typescript
 * // 从请求中提取租户上下文
 * const context = TenantContextUtils.extractFromRequest(req);
 *
 * // 验证租户权限
 * const hasPermission = TenantContextUtils.hasPermission(context, 'user.create');
 *
 * // 检查功能是否启用
 * const hasFeature = TenantContextUtils.hasFeature(context, 'ai.chat');
 * ```
 *
 * @since 1.0.0
 */
export class TenantContextUtils {
  /**
   * 从请求中提取租户上下文
   *
   * @description 从HTTP请求中提取租户上下文信息
   * @param req HTTP请求对象
   * @returns 租户上下文对象
   * @throws {Error} 当租户信息无效时抛出异常
   *
   * @example
   * ```typescript
   * const context = TenantContextUtils.extractFromRequest(req);
   * console.log(context.tenantId.toString()); // 输出租户ID
   * ```
   */
  static extractFromRequest(req: RequestWithTenantContext): TenantContext {
    if (!req.headers) {
      throw new Error('Request headers not found');
    }

    const tenantId = (req.headers as any)['x-tenant-id'] as string;
    const userId = (req.headers as any)['x-user-id'] as string;
    const organizationId = (req.headers as any)['x-organization-id'] as string;
    const departmentId = (req.headers as any)['x-department-id'] as string;
    const permissions = (req.headers as any)['x-permissions'] as string;
    const features = (req.headers as any)['x-features'] as string;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    return {
      tenantId: TenantId.fromString(tenantId),
      userId: UserId.fromString(userId),
      organizationId: organizationId
        ? OrganizationId.fromString(organizationId)
        : undefined,
      departmentId: departmentId
        ? EntityId.fromString(departmentId)
        : undefined,
      permissions: permissions
        ? permissions.split(',').map((p) => p.trim())
        : [],
      features: features ? features.split(',').map((f) => f.trim()) : [],
    };
  }

  /**
   * 检查用户是否具有指定权限
   *
   * @description 检查用户权限列表中是否包含指定权限
   * @param context 租户上下文
   * @param permission 要检查的权限
   * @returns 如果用户具有权限则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const hasPermission = TenantContextUtils.hasPermission(context, 'user.create');
   * if (hasPermission) {
   *   // 用户有创建用户的权限
   * }
   * ```
   */
  static hasPermission(context: TenantContext, permission: string): boolean {
    return context.permissions.includes(permission);
  }

  /**
   * 检查用户是否具有任一权限
   *
   * @description 检查用户权限列表中是否包含任一指定权限
   * @param context 租户上下文
   * @param permissions 要检查的权限列表
   * @returns 如果用户具有任一权限则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const hasAnyPermission = TenantContextUtils.hasAnyPermission(context, ['user.create', 'user.update']);
   * if (hasAnyPermission) {
   *   // 用户有创建或更新用户的权限
   * }
   * ```
   */
  static hasAnyPermission(
    context: TenantContext,
    permissions: string[]
  ): boolean {
    return permissions.some((permission) =>
      context.permissions.includes(permission)
    );
  }

  /**
   * 检查用户是否具有所有权限
   *
   * @description 检查用户权限列表中是否包含所有指定权限
   * @param context 租户上下文
   * @param permissions 要检查的权限列表
   * @returns 如果用户具有所有权限则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const hasAllPermissions = TenantContextUtils.hasAllPermissions(context, ['user.create', 'user.update']);
   * if (hasAllPermissions) {
   *   // 用户有创建和更新用户的权限
   * }
   * ```
   */
  static hasAllPermissions(
    context: TenantContext,
    permissions: string[]
  ): boolean {
    return permissions.every((permission) =>
      context.permissions.includes(permission)
    );
  }

  /**
   * 检查租户是否启用了指定功能
   *
   * @description 检查租户功能列表中是否包含指定功能
   * @param context 租户上下文
   * @param feature 要检查的功能
   * @returns 如果租户启用了功能则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const hasFeature = TenantContextUtils.hasFeature(context, 'ai.chat');
   * if (hasFeature) {
   *   // 租户启用了AI聊天功能
   * }
   * ```
   */
  static hasFeature(context: TenantContext, feature: string): boolean {
    return context.features.includes(feature);
  }

  /**
   * 检查租户是否启用了任一功能
   *
   * @description 检查租户功能列表中是否包含任一指定功能
   * @param context 租户上下文
   * @param features 要检查的功能列表
   * @returns 如果租户启用了任一功能则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const hasAnyFeature = TenantContextUtils.hasAnyFeature(context, ['ai.chat', 'ai.analysis']);
   * if (hasAnyFeature) {
   *   // 租户启用了AI聊天或分析功能
   * }
   * ```
   */
  static hasAnyFeature(context: TenantContext, features: string[]): boolean {
    return features.some((feature) => context.features.includes(feature));
  }

  /**
   * 检查租户是否启用了所有功能
   *
   * @description 检查租户功能列表中是否包含所有指定功能
   * @param context 租户上下文
   * @param features 要检查的功能列表
   * @returns 如果租户启用了所有功能则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const hasAllFeatures = TenantContextUtils.hasAllFeatures(context, ['ai.chat', 'ai.analysis']);
   * if (hasAllFeatures) {
   *   // 租户启用了AI聊天和分析功能
   * }
   * ```
   */
  static hasAllFeatures(context: TenantContext, features: string[]): boolean {
    return features.every((feature) => context.features.includes(feature));
  }

  /**
   * 验证租户上下文
   *
   * @description 验证租户上下文的完整性和有效性
   * @param context 租户上下文
   * @returns 如果上下文有效则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isValid = TenantContextUtils.validateContext(context);
   * if (!isValid) {
   *   // 租户上下文无效
   * }
   * ```
   */
  static validateContext(context: TenantContext): boolean {
    try {
      // 验证租户ID
      if (!context.tenantId || !context.tenantId.toString()) {
        return false;
      }

      // 验证用户ID
      if (!context.userId || !context.userId.toString()) {
        return false;
      }

      // 验证权限列表
      if (!Array.isArray(context.permissions)) {
        return false;
      }

      // 验证功能列表
      if (!Array.isArray(context.features)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建租户上下文
   *
   * @description 创建新的租户上下文对象
   * @param tenantId 租户ID
   * @param userId 用户ID
   * @param options 可选配置
   * @returns 租户上下文对象
   *
   * @example
   * ```typescript
   * const context = TenantContextUtils.createContext(
   *   TenantId.generate(),
   *   UserId.generate(),
   *   {
   *     organizationId: OrganizationId.generate(),
   *     permissions: ['user.create', 'user.update'],
   *     features: ['ai.chat']
   *   }
   * );
   * ```
   */
  static createContext(
    tenantId: TenantId,
    userId: UserId,
    options: {
      organizationId?: OrganizationId;
      departmentId?: EntityId;
      permissions?: string[];
      features?: string[];
    } = {}
  ): TenantContext {
    return {
      tenantId,
      userId,
      organizationId: options.organizationId,
      departmentId: options.departmentId,
      permissions: options.permissions || [],
      features: options.features || [],
    };
  }

  /**
   * 合并租户上下文
   *
   * @description 合并多个租户上下文，后面的上下文会覆盖前面的
   * @param contexts 要合并的上下文列表
   * @returns 合并后的租户上下文
   *
   * @example
   * ```typescript
   * const mergedContext = TenantContextUtils.mergeContexts([context1, context2, context3]);
   * ```
   */
  static mergeContexts(contexts: TenantContext[]): TenantContext {
    if (contexts.length === 0) {
      throw new Error('At least one context is required');
    }

    const merged: TenantContext = {
      tenantId: contexts[0].tenantId,
      userId: contexts[0].userId,
      organizationId: contexts[0].organizationId,
      departmentId: contexts[0].departmentId,
      permissions: [...contexts[0].permissions],
      features: [...contexts[0].features],
    };

    for (let i = 1; i < contexts.length; i++) {
      const context = contexts[i];

      if (context.organizationId) {
        merged.organizationId = context.organizationId;
      }

      if (context.departmentId) {
        merged.departmentId = context.departmentId;
      }

      // 合并权限（去重）
      merged.permissions = [
        ...new Set([...merged.permissions, ...context.permissions]),
      ];

      // 合并功能（去重）
      merged.features = [...new Set([...merged.features, ...context.features])];
    }

    return merged;
  }

  /**
   * 克隆租户上下文
   *
   * @description 创建租户上下文的深拷贝
   * @param context 要克隆的上下文
   * @returns 克隆后的租户上下文
   *
   * @example
   * ```typescript
   * const clonedContext = TenantContextUtils.cloneContext(originalContext);
   * ```
   */
  static cloneContext(context: TenantContext): TenantContext {
    return {
      tenantId: context.tenantId,
      userId: context.userId,
      organizationId: context.organizationId,
      departmentId: context.departmentId,
      permissions: [...context.permissions],
      features: [...context.features],
    };
  }
}
