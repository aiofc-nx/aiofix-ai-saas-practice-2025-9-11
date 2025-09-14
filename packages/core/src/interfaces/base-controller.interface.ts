import { Request, Response } from 'express';

/**
 * 基础控制器接口
 *
 * 基础控制器接口定义了所有控制器的通用规范和最佳实践。
 * 提供统一的请求处理、响应格式、错误处理等功能。
 *
 * @description 所有控制器的基接口
 * 定义控制器操作的通用规范和最佳实践
 *
 * ## 业务规则
 *
 * ### 请求处理规则
 * - 所有请求都应该经过统一的验证和预处理
 * - 支持请求参数的自动验证和转换
 * - 提供统一的错误处理和响应格式
 * - 支持请求的审计和日志记录
 *
 * ### 响应格式规则
 * - 所有响应都应该遵循统一的格式规范
 * - 支持成功和失败响应的标准化格式
 * - 提供分页、排序等通用响应结构
 * - 支持多语言和国际化响应
 *
 * ### 安全规则
 * - 所有请求都应该经过身份验证和授权检查
 * - 支持多租户数据隔离
 * - 提供请求频率限制和防护
 * - 记录安全相关的操作日志
 *
 * ### 性能规则
 * - 支持请求缓存和优化
 * - 提供请求性能监控
 * - 支持异步处理和批量操作
 * - 优化响应时间和资源使用
 *
 * ## 业务逻辑流程
 *
 * 1. **请求接收**：接收HTTP请求并进行预处理
 * 2. **身份验证**：验证用户身份和权限
 * 3. **参数验证**：验证和转换请求参数
 * 4. **业务处理**：执行业务逻辑
 * 5. **响应构建**：构建标准化响应
 * 6. **日志记录**：记录操作日志和审计信息
 *
 * @example
 * ```typescript
 * interface UserController extends BaseController {
 *   // 用户控制器实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface BaseController {
  /**
   * 处理GET请求
   *
   * @description 处理HTTP GET请求，用于查询操作
   *
   * ## 业务规则
   *
   * ### 查询规则
   * - 支持分页、排序、过滤等查询选项
   * - 提供查询结果的缓存机制
   * - 支持复杂查询条件的构建
   * - 优化查询性能和响应时间
   *
   * ### 安全规则
   * - 验证用户查询权限
   * - 支持多租户数据隔离
   * - 防止敏感数据泄露
   * - 记录查询操作日志
   *
   * @param req Express请求对象
   * @param res Express响应对象
   * @returns Promise<void>
   * @throws {Error} 当处理失败时抛出
   *
   * @example
   * ```typescript
   * async get(req: Request, res: Response): Promise<void> {
   *   // GET请求处理逻辑
   * }
   * ```
   */
  get(req: Request, res: Response): Promise<void>;

  /**
   * 处理POST请求
   *
   * @description 处理HTTP POST请求，用于创建操作
   *
   * ## 业务规则
   *
   * ### 创建规则
   * - 验证创建数据的完整性和有效性
   * - 支持事务性创建操作
   * - 处理创建冲突和重复数据
   * - 提供创建结果的验证
   *
   * ### 安全规则
   * - 验证用户创建权限
   * - 防止恶意数据注入
   * - 支持数据加密和脱敏
   * - 记录创建操作审计
   *
   * @param req Express请求对象
   * @param res Express响应对象
   * @returns Promise<void>
   * @throws {Error} 当处理失败时抛出
   *
   * @example
   * ```typescript
   * async post(req: Request, res: Response): Promise<void> {
   *   // POST请求处理逻辑
   * }
   * ```
   */
  post(req: Request, res: Response): Promise<void>;

  /**
   * 处理PUT请求
   *
   * @description 处理HTTP PUT请求，用于更新操作
   *
   * ## 业务规则
   *
   * ### 更新规则
   * - 支持部分更新和完整更新
   * - 验证更新数据的有效性
   * - 处理更新冲突和版本控制
   * - 提供更新结果的验证
   *
   * ### 安全规则
   * - 验证用户更新权限
   * - 防止未授权数据修改
   * - 支持更新操作的审计
   * - 记录更新操作日志
   *
   * @param req Express请求对象
   * @param res Express响应对象
   * @returns Promise<void>
   * @throws {Error} 当处理失败时抛出
   *
   * @example
   * ```typescript
   * async put(req: Request, res: Response): Promise<void> {
   *   // PUT请求处理逻辑
   * }
   * ```
   */
  put(req: Request, res: Response): Promise<void>;

  /**
   * 处理DELETE请求
   *
   * @description 处理HTTP DELETE请求，用于删除操作
   *
   * ## 业务规则
   *
   * ### 删除规则
   * - 支持软删除和硬删除
   * - 验证删除权限和依赖关系
   * - 处理级联删除和关联数据
   * - 提供删除确认和恢复机制
   *
   * ### 安全规则
   * - 验证用户删除权限
   * - 防止误删除和数据丢失
   * - 支持删除操作的审计
   * - 记录删除操作日志
   *
   * @param req Express请求对象
   * @param res Express响应对象
   * @returns Promise<void>
   * @throws {Error} 当处理失败时抛出
   *
   * @example
   * ```typescript
   * async delete(req: Request, res: Response): Promise<void> {
   *   // DELETE请求处理逻辑
   * }
   * ```
   */
  delete(req: Request, res: Response): Promise<void>;

  /**
   * 处理PATCH请求
   *
   * @description 处理HTTP PATCH请求，用于部分更新操作
   *
   * ## 业务规则
   *
   * ### 部分更新规则
   * - 只更新指定的字段
   * - 验证部分更新数据的有效性
   * - 处理部分更新冲突
   * - 提供部分更新结果的验证
   *
   * ### 性能规则
   * - 优化部分更新的性能
   * - 减少不必要的数据传输
   * - 支持批量部分更新
   * - 提供更新操作的监控
   *
   * @param req Express请求对象
   * @param res Express响应对象
   * @returns Promise<void>
   * @throws {Error} 当处理失败时抛出
   *
   * @example
   * ```typescript
   * async patch(req: Request, res: Response): Promise<void> {
   *   // PATCH请求处理逻辑
   * }
   * ```
   */
  patch(req: Request, res: Response): Promise<void>;
}

/**
 * 控制器响应接口
 *
 * @description 定义控制器响应的标准格式
 */
export interface ControllerResponse<T = any> {
  /** 响应状态 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  /** 元数据 */
  meta?: {
    /** 请求ID */
    requestId: string;
    /** 响应时间戳 */
    timestamp: Date;
    /** 处理耗时（毫秒） */
    duration: number;
    /** 分页信息 */
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * 控制器请求上下文
 *
 * @description 包含请求的上下文信息
 */
export interface ControllerRequestContext {
  /** 用户ID */
  userId?: string;
  /** 租户ID */
  tenantId?: string;
  /** 组织ID */
  organizationId?: string;
  /** 部门ID */
  departmentId?: string;
  /** 请求ID */
  requestId: string;
  /** 请求时间戳 */
  timestamp: Date;
  /** 客户端信息 */
  clientInfo?: {
    userAgent: string;
    ip: string;
    referer?: string;
  };
  /** 权限信息 */
  permissions?: string[];
  /** 语言设置 */
  language?: string;
  /** 时区设置 */
  timezone?: string;
}

/**
 * 控制器错误类型
 *
 * @description 定义控制器可能出现的错误类型
 */
export enum ControllerErrorType {
  /** 验证错误 */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** 认证错误 */
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  /** 授权错误 */
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  /** 业务逻辑错误 */
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  /** 资源未找到 */
  NOT_FOUND = 'NOT_FOUND',
  /** 资源冲突 */
  CONFLICT = 'CONFLICT',
  /** 服务器内部错误 */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  /** 请求超时 */
  TIMEOUT = 'TIMEOUT',
  /** 请求频率限制 */
  RATE_LIMIT = 'RATE_LIMIT',
}

/**
 * 控制器错误
 *
 * @description 控制器专用的错误类
 */
export class ControllerError extends Error {
  public readonly type: ControllerErrorType;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    type: ControllerErrorType,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'ControllerError';
    this.type = type;
    this.code = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}
