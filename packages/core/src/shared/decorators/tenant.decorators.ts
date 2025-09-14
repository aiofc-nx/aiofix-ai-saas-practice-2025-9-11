// 临时定义异常类，后续会从exceptions模块导入
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 租户上下文接口
 *
 * @description 定义租户上下文的结构
 */
export interface TenantContext {
  tenantId: string;
  userId: string;
  organizationId?: string;
  departmentId?: string;
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
 * 租户验证装饰器
 *
 * 用于验证请求是否包含有效的租户上下文。
 * 如果没有租户上下文，则抛出未授权异常。
 *
 * @description 验证租户上下文的装饰器
 *
 * ## 业务规则
 *
 * ### 租户验证规则
 * - 请求必须包含有效的租户上下文
 * - 租户ID不能为空或无效
 * - 用户ID不能为空或无效
 * - 租户上下文必须通过中间件设置
 * - 验证失败时抛出未授权异常
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Post()
 *   @RequireTenant
 *   async createUser(@Body() dto: CreateUserDto, @Req() req: RequestWithTenantContext) {
 *     // 确保有租户上下文
 *     const tenantId = req.tenantContext!.tenantId;
 *     const userId = req.tenantContext!.userId;
 *     // ... 业务逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function RequireTenant(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const req = args.find(
      (arg) => arg && typeof arg === 'object' && 'tenantContext' in arg
    ) as RequestWithTenantContext;

    if (!req?.tenantContext?.tenantId) {
      throw new UnauthorizedError('Tenant context required');
    }

    if (!req.tenantContext.userId) {
      throw new UnauthorizedError('User context required');
    }

    return originalMethod.apply(this, args);
  };
}

/**
 * 权限验证装饰器
 *
 * 用于验证用户是否具有指定的权限。
 * 如果用户没有所需权限，则抛出禁止访问异常。
 *
 * @description 验证用户权限的装饰器
 *
 * ## 业务规则
 *
 * ### 权限验证规则
 * - 用户必须具有指定的权限
 * - 权限列表不能为空
 * - 权限验证基于用户的权限列表
 * - 验证失败时抛出禁止访问异常
 * - 支持多个权限的验证
 *
 * @param permission 所需的权限名称
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Post()
 *   @RequirePermission('user.create')
 *   async createUser(@Body() dto: CreateUserDto, @Req() req: RequestWithTenantContext) {
 *     // 确保用户有创建用户的权限
 *     // ... 业务逻辑
 *   }
 *
 *   @Delete(':id')
 *   @RequirePermission('user.delete')
 *   async deleteUser(@Param('id') id: string, @Req() req: RequestWithTenantContext) {
 *     // 确保用户有删除用户的权限
 *     // ... 业务逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function RequirePermission(permission: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args.find(
        (arg) => arg && typeof arg === 'object' && 'tenantContext' in arg
      ) as RequestWithTenantContext;

      if (!req?.tenantContext) {
        throw new UnauthorizedError('Tenant context required');
      }

      const userPermissions = req.tenantContext.permissions || [];
      if (!userPermissions.includes(permission)) {
        throw new ForbiddenError(`Permission '${permission}' required`);
      }

      return originalMethod.apply(this, args);
    };
  };
}

/**
 * 组织验证装饰器
 *
 * 用于验证请求是否包含有效的组织上下文。
 * 如果没有组织上下文，则抛出禁止访问异常。
 *
 * @description 验证组织上下文的装饰器
 *
 * ## 业务规则
 *
 * ### 组织验证规则
 * - 请求必须包含有效的组织上下文
 * - 组织ID不能为空或无效
 * - 组织上下文必须通过中间件设置
 * - 验证失败时抛出禁止访问异常
 *
 * @example
 * ```typescript
 * @Controller('projects')
 * export class ProjectController {
 *   @Post()
 *   @RequireOrganization
 *   async createProject(@Body() dto: CreateProjectDto, @Req() req: RequestWithTenantContext) {
 *     // 确保有组织上下文
 *     const organizationId = req.tenantContext!.organizationId;
 *     // ... 业务逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function RequireOrganization(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const req = args.find(
      (arg) => arg && typeof arg === 'object' && 'tenantContext' in arg
    ) as RequestWithTenantContext;

    if (!req?.tenantContext) {
      throw new UnauthorizedError('Tenant context required');
    }

    if (!req.tenantContext.organizationId) {
      throw new ForbiddenError('Organization context required');
    }

    return originalMethod.apply(this, args);
  };
}

/**
 * 部门验证装饰器
 *
 * 用于验证请求是否包含有效的部门上下文。
 * 如果没有部门上下文，则抛出禁止访问异常。
 *
 * @description 验证部门上下文的装饰器
 *
 * ## 业务规则
 *
 * ### 部门验证规则
 * - 请求必须包含有效的部门上下文
 * - 部门ID不能为空或无效
 * - 部门上下文必须通过中间件设置
 * - 验证失败时抛出禁止访问异常
 *
 * @example
 * ```typescript
 * @Controller('tasks')
 * export class TaskController {
 *   @Post()
 *   @RequireDepartment
 *   async createTask(@Body() dto: CreateTaskDto, @Req() req: RequestWithTenantContext) {
 *     // 确保有部门上下文
 *     const departmentId = req.tenantContext!.departmentId;
 *     // ... 业务逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function RequireDepartment(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const req = args.find(
      (arg) => arg && typeof arg === 'object' && 'tenantContext' in arg
    ) as RequestWithTenantContext;

    if (!req?.tenantContext) {
      throw new UnauthorizedError('Tenant context required');
    }

    if (!req.tenantContext.departmentId) {
      throw new ForbiddenError('Department context required');
    }

    return originalMethod.apply(this, args);
  };
}

/**
 * 功能验证装饰器
 *
 * 用于验证租户是否启用了指定的功能。
 * 如果功能未启用，则抛出禁止访问异常。
 *
 * @description 验证租户功能的装饰器
 *
 * ## 业务规则
 *
 * ### 功能验证规则
 * - 租户必须启用了指定的功能
 * - 功能列表不能为空
 * - 功能验证基于租户的功能列表
 * - 验证失败时抛出禁止访问异常
 * - 支持多个功能的验证
 *
 * @param feature 所需的功能名称
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('ai')
 * export class AIController {
 *   @Post('chat')
 *   @RequireFeature('ai.chat')
 *   async chat(@Body() dto: ChatDto, @Req() req: RequestWithTenantContext) {
 *     // 确保租户启用了AI聊天功能
 *     // ... 业务逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function RequireFeature(feature: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args.find(
        (arg) => arg && typeof arg === 'object' && 'tenantContext' in arg
      ) as RequestWithTenantContext;

      if (!req?.tenantContext) {
        throw new UnauthorizedError('Tenant context required');
      }

      const tenantFeatures = req.tenantContext.features || [];
      if (!tenantFeatures.includes(feature)) {
        throw new ForbiddenError(
          `Feature '${feature}' not enabled for this tenant`
        );
      }

      return originalMethod.apply(this, args);
    };
  };
}

/**
 * 组合验证装饰器
 *
 * 用于同时验证多个条件，如租户、权限、组织等。
 * 所有条件都必须满足，否则抛出相应异常。
 *
 * @description 组合验证装饰器，支持多个验证条件
 *
 * @param options 验证选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Post()
 *   @RequireAll({
 *     tenant: true,
 *     permission: 'user.create',
 *     organization: true
 *   })
 *   async createUser(@Body() dto: CreateUserDto, @Req() req: RequestWithTenantContext) {
 *     // 确保有租户上下文、创建用户权限和组织上下文
 *     // ... 业务逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function RequireAll(options: {
  tenant?: boolean;
  permission?: string;
  organization?: boolean;
  department?: boolean;
  feature?: string;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args.find(
        (arg) => arg && typeof arg === 'object' && 'tenantContext' in arg
      ) as RequestWithTenantContext;

      if (!req?.tenantContext) {
        throw new UnauthorizedError('Tenant context required');
      }

      const { tenantContext } = req;

      // 验证租户
      if (options.tenant && !tenantContext.tenantId) {
        throw new UnauthorizedError('Tenant context required');
      }

      // 验证权限
      if (options.permission) {
        const userPermissions = tenantContext.permissions || [];
        if (!userPermissions.includes(options.permission)) {
          throw new ForbiddenError(
            `Permission '${options.permission}' required`
          );
        }
      }

      // 验证组织
      if (options.organization && !tenantContext.organizationId) {
        throw new ForbiddenError('Organization context required');
      }

      // 验证部门
      if (options.department && !tenantContext.departmentId) {
        throw new ForbiddenError('Department context required');
      }

      // 验证功能
      if (options.feature) {
        const tenantFeatures = tenantContext.features || [];
        if (!tenantFeatures.includes(options.feature)) {
          throw new ForbiddenError(
            `Feature '${options.feature}' not enabled for this tenant`
          );
        }
      }

      return originalMethod.apply(this, args);
    };
  };
}
