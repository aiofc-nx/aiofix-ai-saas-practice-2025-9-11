import type { Observable } from 'rxjs';

/**
 * 中间件上下文接口
 *
 * @description 定义中间件执行过程中的上下文信息
 */
export interface IMiddlewareContext {
  /** 请求ID */
  requestId: string;
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
  /** 会话ID */
  sessionId?: string;
  /** 时间戳 */
  timestamp: Date;
  /** 元数据 */
  metadata: Record<string, any>;
  /** 自定义属性 */
  attributes: Record<string, any>;
}

/**
 * 中间件请求接口
 *
 * @description 定义中间件处理的请求对象
 */
export interface IMiddlewareRequest<T = any> {
  /** 请求类型 */
  type: string;
  /** 请求数据 */
  data: T;
  /** 上下文信息 */
  context: IMiddlewareContext;
  /** 请求元数据 */
  metadata?: Record<string, any>;
}

/**
 * 中间件响应接口
 *
 * @description 定义中间件处理的响应对象
 */
export interface IMiddlewareResponse<T = any> {
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: Error;
  /** 响应元数据 */
  metadata?: Record<string, any>;
  /** 处理时间（毫秒） */
  processingTime?: number;
  /** 是否成功 */
  success: boolean;
}

/**
 * 中间件接口
 *
 * @description 定义中间件的基本接口
 */
export interface IMiddleware<TRequest = any, TResponse = any> {
  /** 中间件名称 */
  name: string;
  /** 中间件优先级 */
  priority?: number;
  /** 中间件配置 */
  config?: IMiddlewareConfig;

  /**
   * 处理请求
   *
   * @param request 请求对象
   * @param next 下一个中间件
   * @returns 响应对象
   */
  handle(
    request: IMiddlewareRequest<TRequest>,
    next: () => Observable<IMiddlewareResponse<TResponse>>
  ): Observable<IMiddlewareResponse<TResponse>>;
}

/**
 * 中间件配置接口
 *
 * @description 定义中间件的配置选项
 */
export interface IMiddlewareConfig {
  /** 是否启用中间件 */
  enabled?: boolean;
  /** 是否启用日志记录 */
  enableLogging?: boolean;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
  /** 是否启用错误处理 */
  enableErrorHandling?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 自定义配置 */
  custom?: Record<string, any>;
}

/**
 * 中间件链接口
 *
 * @description 定义中间件链的接口
 */
export interface IMiddlewareChain<TRequest = any, TResponse = any> {
  /** 中间件列表 */
  middlewares: IMiddleware<TRequest, TResponse>[];
  /** 中间件配置 */
  config?: IMiddlewareChainConfig;

  /**
   * 添加中间件
   *
   * @param middleware 中间件实例
   */
  addMiddleware(middleware: IMiddleware<TRequest, TResponse>): void;

  /**
   * 移除中间件
   *
   * @param name 中间件名称
   */
  removeMiddleware(name: string): void;

  /**
   * 执行中间件链
   *
   * @param request 请求对象
   * @returns 响应对象
   */
  execute(
    request: IMiddlewareRequest<TRequest>
  ): Observable<IMiddlewareResponse<TResponse>>;

  /**
   * 获取中间件统计信息
   *
   * @returns 统计信息
   */
  getStats(): IMiddlewareStats;
}

/**
 * 中间件链配置接口
 *
 * @description 定义中间件链的配置选项
 */
export interface IMiddlewareChainConfig {
  /** 是否启用全局日志记录 */
  enableGlobalLogging?: boolean;
  /** 是否启用全局性能监控 */
  enableGlobalPerformanceMonitoring?: boolean;
  /** 是否启用全局错误处理 */
  enableGlobalErrorHandling?: boolean;
  /** 全局超时时间（毫秒） */
  globalTimeout?: number;
  /** 是否按优先级排序 */
  sortByPriority?: boolean;
  /** 自定义配置 */
  custom?: Record<string, any>;
}

/**
 * 中间件统计信息接口
 *
 * @description 定义中间件的统计信息
 */
export interface IMiddlewareStats {
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successRequests: number;
  /** 失败请求数 */
  errorRequests: number;
  /** 平均处理时间（毫秒） */
  averageProcessingTime: number;
  /** 最大处理时间（毫秒） */
  maxProcessingTime: number;
  /** 最小处理时间（毫秒） */
  minProcessingTime: number;
  /** 中间件统计 */
  middlewareStats: Record<
    string,
    {
      requestCount: number;
      successCount: number;
      errorCount: number;
      averageTime: number;
      lastUsed: Date;
    }
  >;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 中间件管理器接口
 *
 * @description 定义中间件管理器的接口
 */
export interface IMiddlewareManager {
  /**
   * 注册中间件
   *
   * @param middleware 中间件实例
   * @param config 中间件配置
   */
  registerMiddleware(middleware: IMiddleware, config?: IMiddlewareConfig): void;

  /**
   * 注销中间件
   *
   * @param name 中间件名称
   */
  unregisterMiddleware(name: string): void;

  /**
   * 创建中间件链
   *
   * @param names 中间件名称数组
   * @param config 链配置
   * @returns 中间件链
   */
  createChain(
    names: string[],
    config?: IMiddlewareChainConfig
  ): IMiddlewareChain;

  /**
   * 获取所有注册的中间件
   *
   * @returns 中间件映射
   */
  getAllMiddlewares(): Map<
    string,
    { middleware: IMiddleware; config: IMiddlewareConfig }
  >;

  /**
   * 获取中间件统计信息
   *
   * @returns 统计信息
   */
  getStats(): IMiddlewareStats;
}

/**
 * 中间件装饰器选项
 *
 * @description 定义中间件装饰器的选项
 */
export interface MiddlewareDecoratorOptions {
  /** 中间件名称 */
  name?: string;
  /** 中间件优先级 */
  priority?: number;
  /** 中间件配置 */
  config?: IMiddlewareConfig;
  /** 是否自动注册 */
  autoRegister?: boolean;
}

/**
 * 中间件类型枚举
 *
 * @description 定义中间件的类型
 */
export enum MiddlewareType {
  /** 认证中间件 */
  AUTHENTICATION = 'authentication',
  /** 授权中间件 */
  AUTHORIZATION = 'authorization',
  /** 日志记录中间件 */
  LOGGING = 'logging',
  /** 指标收集中间件 */
  METRICS = 'metrics',
  /** 缓存中间件 */
  CACHE = 'cache',
  /** 限流中间件 */
  RATE_LIMITING = 'rate_limiting',
  /** 验证中间件 */
  VALIDATION = 'validation',
  /** 转换中间件 */
  TRANSFORMATION = 'transformation',
  /** 错误处理中间件 */
  ERROR_HANDLING = 'error_handling',
  /** 性能监控中间件 */
  PERFORMANCE_MONITORING = 'performance_monitoring',
  /** 自定义中间件 */
  CUSTOM = 'custom',
}

/**
 * 中间件执行结果接口
 *
 * @description 定义中间件执行的结果
 */
export interface IMiddlewareExecutionResult<T = any> {
  /** 是否继续执行 */
  continue: boolean;
  /** 响应数据 */
  response?: T;
  /** 错误信息 */
  error?: Error;
  /** 执行时间（毫秒） */
  executionTime: number;
  /** 中间件名称 */
  middlewareName: string;
  /** 执行上下文 */
  context: IMiddlewareContext;
}
