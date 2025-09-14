import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PinoLoggerService, LogContext } from '@aiofix/logging';
import { CoreConfigService } from '../../services/core-config.service';
import { BaseMiddleware } from './base.middleware';
import type {
  IMiddlewareRequest,
  IMiddlewareResponse,
} from './middleware.types';

/**
 * 日志记录中间件
 *
 * 提供请求和响应的日志记录功能，支持不同级别的日志输出。
 * 记录请求的详细信息、处理时间和响应状态。
 *
 * @description 日志记录中间件，提供详细的请求和响应日志
 *
 * ## 业务规则
 *
 * ### 日志记录规则
 * - 记录所有请求的基本信息
 * - 记录请求的处理时间
 * - 记录响应的状态和结果
 * - 支持敏感数据的脱敏处理
 *
 * ### 性能规则
 * - 异步日志记录不影响主流程
 * - 支持日志级别的配置
 * - 提供日志格式的自定义
 * - 支持日志的批量输出
 *
 * ## 业务逻辑流程
 *
 * 1. **请求日志**：记录请求的基本信息
 * 2. **处理跟踪**：跟踪请求的处理过程
 * 3. **响应日志**：记录响应的结果信息
 * 4. **性能统计**：统计处理时间和性能指标
 * 5. **错误日志**：记录处理过程中的错误
 *
 * @example
 * ```typescript
 * // 创建日志中间件
 * const loggingMiddleware = new LoggingMiddleware({
 *   enableLogging: true,
 *   logLevel: 'info',
 *   maskSensitiveData: true
 * });
 *
 * // 添加到中间件链
 * chain.addMiddleware(loggingMiddleware);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class LoggingMiddleware extends BaseMiddleware {
  /**
   * 构造函数
   *
   * @param logger 日志服务
   * @param configService Core配置服务
   * @param config 中间件配置覆盖
   * @param priority 中间件优先级
   */
  constructor(
    private readonly pinoLogger: PinoLoggerService,
    private readonly configService: CoreConfigService,
    config: {
      enableLogging?: boolean;
      logLevel?: 'debug' | 'info' | 'warn' | 'error';
      maskSensitiveData?: boolean;
      logRequestData?: boolean;
      logResponseData?: boolean;
    } = {},
    priority: number = 100,
  ) {
    // 从配置服务获取中间件配置
    const middlewareConfig = configService.getMiddlewareConfig();

    super(
      pinoLogger,
      'LoggingMiddleware',
      {
        enableLogging: middlewareConfig.enableLogging,
        enablePerformanceMonitoring: true,
        logLevel: config.logLevel || middlewareConfig.logLevel,
        maskSensitiveData:
          config.maskSensitiveData !== undefined
            ? config.maskSensitiveData
            : middlewareConfig.maskSensitiveData,
        logRequestData:
          config.logRequestData !== undefined
            ? config.logRequestData
            : middlewareConfig.logRequestData,
        logResponseData:
          config.logResponseData !== undefined
            ? config.logResponseData
            : middlewareConfig.logResponseData,
        ...config,
      },
      priority,
    );
  }

  /**
   * 处理请求
   *
   * @description 记录请求日志并执行下一个中间件
   * @param request 请求对象
   * @param next 下一个中间件
   * @returns 响应对象
   */
  protected processRequest<T>(
    request: IMiddlewareRequest<T>,
    next: () => Observable<IMiddlewareResponse<T>>,
  ): Observable<IMiddlewareResponse<T>> {
    const startTime = new Date();

    // 记录请求日志
    this.logRequest(request, startTime);

    // 执行下一个中间件
    return next().pipe(
      tap((response) => {
        // 记录响应日志
        this.logResponse(request, response, startTime);
      }),
    );
  }

  /**
   * 记录请求日志
   *
   * @description 记录请求的详细信息
   * @param request 请求对象
   * @param startTime 开始时间
   */
  private logRequest<T>(request: IMiddlewareRequest<T>, startTime: Date): void {
    const logData = {
      type: 'REQUEST',
      requestType: request.type,
      requestId: request.context.requestId,
      tenantId: request.context.tenantId,
      userId: request.context.userId,
      timestamp: startTime.toISOString(),
      data: this.config.logRequestData
        ? this.maskSensitiveData(request.data)
        : '[DATA_MASKED]',
      metadata: request.metadata,
    };

    this.logByLevel(logData);
  }

  /**
   * 记录响应日志
   *
   * @description 记录响应的详细信息
   * @param request 请求对象
   * @param response 响应对象
   * @param startTime 开始时间
   */
  private logResponse<T>(
    request: IMiddlewareRequest<T>,
    response: IMiddlewareResponse<T>,
    startTime: Date,
  ): void {
    const endTime = new Date();
    const processingTime = endTime.getTime() - startTime.getTime();

    const logData = {
      type: 'RESPONSE',
      requestType: request.type,
      requestId: request.context.requestId,
      tenantId: request.context.tenantId,
      userId: request.context.userId,
      success: response.success,
      processingTime,
      timestamp: endTime.toISOString(),
      data: this.config.logResponseData
        ? this.maskSensitiveData(response.data)
        : '[DATA_MASKED]',
      error: response.error
        ? {
            name: response.error.name,
            message: response.error.message,
            stack: response.error.stack,
          }
        : undefined,
      metadata: response.metadata,
    };

    this.logByLevel(logData);
  }

  /**
   * 根据级别记录日志
   *
   * @description 根据配置的日志级别记录日志，使用统一的PinoLoggerService
   * @param data 日志数据
   */
  private logByLevel(data: any): void {
    const logLevel = this.config.logLevel || 'info';
    const message =
      data.type === 'REQUEST'
        ? `Request: ${data.requestType}`
        : `Response: ${data.requestType}`;

    // 使用PinoLoggerService的上下文方法
    const childLogger = this.pinoLogger.child(LogContext.SYSTEM, {
      requestId: data.requestId,
      tenantId: data.tenantId,
      userId: data.userId,
      processingTime: data.processingTime,
    });

    switch (logLevel) {
      case 'debug':
        childLogger.debug(message, data);
        break;
      case 'info':
        childLogger.info(message, data);
        break;
      case 'warn':
        childLogger.warn(message, data);
        break;
      case 'error':
        childLogger.error(message, data);
        break;
      default:
        childLogger.info(message, data);
    }
  }

  /**
   * 脱敏敏感数据
   *
   * @description 对敏感数据进行脱敏处理
   * @param data 原始数据
   * @returns 脱敏后的数据
   */
  private maskSensitiveData(data: any): any {
    if (!this.config.maskSensitiveData || !data) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
    ];
    const maskedData = { ...data };

    for (const field of sensitiveFields) {
      if (maskedData[field]) {
        maskedData[field] = '[MASKED]';
      }
    }

    return maskedData;
  }
}
