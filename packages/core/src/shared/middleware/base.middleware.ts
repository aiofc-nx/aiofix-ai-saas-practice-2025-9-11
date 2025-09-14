import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { catchError, tap, timeout, mergeMap } from 'rxjs/operators';
import { PinoLoggerService, LogContext } from '@aiofix/logging';
import type {
  IMiddleware,
  IMiddlewareRequest,
  IMiddlewareResponse,
  IMiddlewareConfig,
} from './middleware.types';

/**
 * 基础中间件抽象类
 *
 * 提供中间件的基础实现，包括错误处理、性能监控、日志记录等功能。
 * 所有自定义中间件都应该继承此类。
 *
 * @description 基础中间件抽象类，提供中间件的通用功能
 *
 * ## 业务规则
 *
 * ### 中间件执行规则
 * - 每个中间件都有唯一的名称和优先级
 * - 支持中间件的超时和重试机制
 * - 提供统一的错误处理和日志记录
 * - 支持性能监控和指标收集
 *
 * ### 生命周期规则
 * - 中间件执行前进行预处理
 * - 中间件执行后进行后处理
 * - 支持中间件的启用和禁用
 * - 提供中间件的配置管理
 *
 * ## 业务逻辑流程
 *
 * 1. **预处理**：执行中间件前的准备工作
 * 2. **核心处理**：执行中间件的核心逻辑
 * 3. **后处理**：执行中间件后的清理工作
 * 4. **错误处理**：处理执行过程中的错误
 * 5. **指标更新**：更新中间件的执行指标
 *
 * @example
 * ```typescript
 * // 创建自定义中间件
 * @Injectable()
 * export class LoggingMiddleware extends BaseMiddleware {
 *   constructor() {
 *     super('LoggingMiddleware', {
 *       enableLogging: true,
 *       enablePerformanceMonitoring: true
 *     });
 *   }
 *
 *   protected async processRequest<T>(
 *     request: IMiddlewareRequest<T>
 *   ): Promise<IMiddlewareResponse<T>> {
 *     this.logger.log(`Processing request: ${request.type}`);
 *
 *     // 执行下一个中间件
 *     const response = await this.executeNext(request);
 *
 *     this.logger.log(`Request processed: ${request.type}`);
 *     return response;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export abstract class BaseMiddleware<TRequest = any, TResponse = any>
  implements IMiddleware<TRequest, TResponse>
{
  protected readonly logger: PinoLoggerService;
  protected readonly _stats = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    totalProcessingTime: 0,
    lastUsed: new Date(),
  };

  /**
   * 构造函数
   *
   * @param logger 日志服务
   * @param name 中间件名称
   * @param config 中间件配置
   * @param priority 中间件优先级
   */
  constructor(
    logger: PinoLoggerService,
    public readonly name: string,
    public readonly config: IMiddlewareConfig = {},
    public readonly priority: number = 0,
  ) {
    this.logger = logger;

    // 设置默认配置
    this.config = {
      enabled: true,
      enableLogging: false,
      enablePerformanceMonitoring: false,
      enableErrorHandling: true,
      timeout: 30000, // 30秒
      retryCount: 0,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * 处理请求
   *
   * @description 处理中间件请求的主要方法
   * @param request 请求对象
   * @param next 下一个中间件
   * @returns 响应对象
   */
  handle(
    request: IMiddlewareRequest<TRequest>,
    next: () => Observable<IMiddlewareResponse<TResponse>>,
  ): Observable<IMiddlewareResponse<TResponse>> {
    // 检查中间件是否启用
    if (!this.config.enabled) {
      return next();
    }

    const startTime = new Date();
    this._stats.requestCount++;
    this._stats.lastUsed = startTime;

    if (this.config.enableLogging) {
      this.logger.debug(`Processing request: ${request.type}`);
    }

    // 执行预处理
    return this.preprocess(request).pipe(
      // 执行核心处理逻辑
      mergeMap(() => this.processRequest(request, next)),
      // 应用超时
      timeout(this.config.timeout || 30000),
      // 执行后处理
      mergeMap((response: IMiddlewareResponse<TResponse>) =>
        this.postprocess(request, response),
      ),
      // 错误处理
      catchError((error) => this.handleError(error, request, startTime)),
      // 更新统计信息
      tap((response: IMiddlewareResponse<TResponse>) =>
        this.updateStats(startTime, response.success),
      ),
    );
  }

  /**
   * 预处理
   *
   * @description 执行中间件前的预处理工作
   * @param request 请求对象
   * @returns 预处理结果
   */
  protected preprocess(
    request: IMiddlewareRequest<TRequest>,
  ): Observable<void> {
    if (this.config.enableLogging) {
      this.logger.debug(`Preprocessing request: ${request.type}`);
    }

    return of(undefined);
  }

  /**
   * 处理请求
   *
   * @description 执行中间件的核心处理逻辑，子类必须实现此方法
   * @param request 请求对象
   * @param next 下一个中间件
   * @returns 响应对象
   */
  protected abstract processRequest(
    request: IMiddlewareRequest<TRequest>,
    next: () => Observable<IMiddlewareResponse<TResponse>>,
  ): Observable<IMiddlewareResponse<TResponse>>;

  /**
   * 后处理
   *
   * @description 执行中间件后的后处理工作
   * @param request 请求对象
   * @param response 响应对象
   * @returns 后处理结果
   */
  protected postprocess(
    request: IMiddlewareRequest<TRequest>,
    response: IMiddlewareResponse<TResponse>,
  ): Observable<IMiddlewareResponse<TResponse>> {
    if (this.config.enableLogging) {
      this.logger.debug(`Postprocessing request: ${request.type}`);
    }

    return of(response);
  }

  /**
   * 处理错误
   *
   * @description 处理中间件执行过程中的错误
   * @param error 错误对象
   * @param request 请求对象
   * @param startTime 开始时间
   * @returns 错误响应
   */
  protected handleError(
    error: any,
    request: IMiddlewareRequest<TRequest>,
    startTime: Date,
  ): Observable<IMiddlewareResponse<TResponse>> {
    this._stats.errorCount++;

    if (this.config.enableErrorHandling) {
      this.logger.error(
        `Error in middleware ${this.name}: ${(error as Error).message}`,
        LogContext.SYSTEM,
        { stack: (error as Error).stack },
      );
    }

    const processingTime = new Date().getTime() - startTime.getTime();

    return of({
      error: error as Error,
      processingTime,
      success: false,
      metadata: {
        middlewareName: this.name,
        errorType: (error as Error).constructor.name,
        timestamp: new Date(),
      },
    });
  }

  /**
   * 更新统计信息
   *
   * @description 更新中间件的统计信息
   * @param startTime 开始时间
   * @param success 是否成功
   */
  protected updateStats(startTime: Date, success: boolean): void {
    const processingTime = new Date().getTime() - startTime.getTime();

    this._stats.totalProcessingTime += processingTime;

    if (success) {
      this._stats.successCount++;
    } else {
      this._stats.errorCount++;
    }

    if (this.config.enablePerformanceMonitoring) {
      this.logger.debug(
        `Middleware ${this.name} processing time: ${processingTime}ms`,
      );
    }
  }

  /**
   * 执行下一个中间件
   *
   * @description 执行下一个中间件的便捷方法
   * @param request 请求对象
   * @param next 下一个中间件
   * @returns 响应对象
   */
  protected executeNext(
    request: IMiddlewareRequest<TRequest>,
    next: () => Observable<IMiddlewareResponse<TResponse>>,
  ): Observable<IMiddlewareResponse<TResponse>> {
    return next();
  }

  /**
   * 创建成功响应
   *
   * @description 创建成功响应的便捷方法
   * @param data 响应数据
   * @param processingTime 处理时间
   * @param metadata 元数据
   * @returns 成功响应
   */
  protected createSuccessResponse(
    data?: TResponse,
    processingTime?: number,
    metadata?: Record<string, any>,
  ): IMiddlewareResponse<TResponse> {
    return {
      data,
      success: true,
      processingTime,
      metadata: {
        middlewareName: this.name,
        timestamp: new Date(),
        ...metadata,
      },
    };
  }

  /**
   * 创建错误响应
   *
   * @description 创建错误响应的便捷方法
   * @param error 错误对象
   * @param processingTime 处理时间
   * @param metadata 元数据
   * @returns 错误响应
   */
  protected createErrorResponse(
    error: Error,
    processingTime?: number,
    metadata?: Record<string, any>,
  ): IMiddlewareResponse<TResponse> {
    return {
      error,
      success: false,
      processingTime,
      metadata: {
        middlewareName: this.name,
        timestamp: new Date(),
        ...metadata,
      },
    };
  }

  /**
   * 获取中间件统计信息
   *
   * @description 获取中间件的统计信息
   * @returns 统计信息
   */
  getStats(): {
    requestCount: number;
    successCount: number;
    errorCount: number;
    averageProcessingTime: number;
    lastUsed: Date;
  } {
    return {
      ...this._stats,
      averageProcessingTime:
        this._stats.requestCount > 0
          ? this._stats.totalProcessingTime / this._stats.requestCount
          : 0,
    };
  }

  /**
   * 重置统计信息
   *
   * @description 重置中间件的统计信息
   */
  resetStats(): void {
    this._stats.requestCount = 0;
    this._stats.successCount = 0;
    this._stats.errorCount = 0;
    this._stats.totalProcessingTime = 0;
    this._stats.lastUsed = new Date();
  }

  /**
   * 启用中间件
   *
   * @description 启用中间件
   */
  enable(): void {
    this.config.enabled = true;
    this.logger.debug(`Middleware ${this.name} enabled`);
  }

  /**
   * 禁用中间件
   *
   * @description 禁用中间件
   */
  disable(): void {
    this.config.enabled = false;
    this.logger.debug(`Middleware ${this.name} disabled`);
  }

  /**
   * 检查中间件是否启用
   *
   * @description 检查中间件是否启用
   * @returns 是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled === true;
  }
}
