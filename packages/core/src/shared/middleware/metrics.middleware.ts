import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseMiddleware } from './base.middleware';
import type {
  IMiddlewareRequest,
  IMiddlewareResponse,
} from './middleware.types';

/**
 * 指标收集中间件
 *
 * 提供请求和响应的指标收集功能，包括处理时间、成功率、错误率等指标。
 * 支持自定义指标和实时监控。
 *
 * @description 指标收集中间件，提供详细的性能和使用指标
 *
 * ## 业务规则
 *
 * ### 指标收集规则
 * - 收集所有请求的基本指标
 * - 记录处理时间和性能指标
 * - 统计成功率和错误率
 * - 支持自定义指标收集
 *
 * ### 性能规则
 * - 指标收集不影响主流程性能
 * - 支持指标的实时查询
 * - 提供指标的导出和报告
 * - 支持指标的阈值告警
 *
 * ## 业务逻辑流程
 *
 * 1. **指标初始化**：初始化指标收集器
 * 2. **请求指标**：收集请求的基本指标
 * 3. **处理跟踪**：跟踪请求的处理过程
 * 4. **响应指标**：收集响应的结果指标
 * 5. **指标更新**：更新累计指标统计
 *
 * @example
 * ```typescript
 * // 创建指标中间件
 * const metricsMiddleware = new MetricsMiddleware({
 *   enableMetrics: true,
 *   collectCustomMetrics: true,
 *   exportInterval: 60000 // 1分钟
 * });
 *
 * // 添加到中间件链
 * chain.addMiddleware(metricsMiddleware);
 *
 * // 获取指标
 * const metrics = metricsMiddleware.getMetrics();
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class MetricsMiddleware extends BaseMiddleware {
  private readonly _metrics = {
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    maxProcessingTime: 0,
    minProcessingTime: Infinity,
    requestsPerMinute: 0,
    errorsPerMinute: 0,
    customMetrics: new Map<string, number>(),
    lastResetTime: new Date(),
    requestHistory: [] as Array<{
      timestamp: Date;
      type: string;
      success: boolean;
      processingTime: number;
      tenantId?: string;
      userId?: string;
    }>,
  };

  /**
   * 构造函数
   *
   * @param config 中间件配置
   * @param priority 中间件优先级
   */
  constructor(
    config: {
      enableMetrics?: boolean;
      collectCustomMetrics?: boolean;
      exportInterval?: number;
      historySize?: number;
      enableRealTimeMetrics?: boolean;
    } = {},
    priority: number = 200
  ) {
    super(
      'MetricsMiddleware',
      {
        enablePerformanceMonitoring: true,
        enableLogging: false,
        ...config,
      },
      priority
    );

    this.config = {
      ...this.config,
      collectCustomMetrics: config.collectCustomMetrics !== false,
      exportInterval: config.exportInterval || 60000, // 1分钟
      historySize: config.historySize || 1000,
      enableRealTimeMetrics: config.enableRealTimeMetrics !== false,
    };

    // 启动指标导出定时器
    if (this.config.exportInterval > 0) {
      this.startMetricsExport();
    }
  }

  /**
   * 处理请求
   *
   * @description 收集请求指标并执行下一个中间件
   * @param request 请求对象
   * @param next 下一个中间件
   * @returns 响应对象
   */
  protected processRequest<T>(
    request: IMiddlewareRequest<T>,
    next: () => Observable<IMiddlewareResponse<T>>
  ): Observable<IMiddlewareResponse<T>> {
    const startTime = new Date();

    // 收集请求指标
    this.collectRequestMetrics(request, startTime);

    // 执行下一个中间件
    return next().pipe(
      tap((response) => {
        // 收集响应指标
        this.collectResponseMetrics(request, response, startTime);
      })
    );
  }

  /**
   * 收集请求指标
   *
   * @description 收集请求的基本指标
   * @param request 请求对象
   * @param startTime 开始时间
   */
  private collectRequestMetrics<T>(
    request: IMiddlewareRequest<T>,
    startTime: Date
  ): void {
    this._metrics.totalRequests++;

    // 收集自定义指标
    if (this.config.collectCustomMetrics) {
      this.collectCustomMetrics('request_count', 1);
      this.collectCustomMetrics(`request_type_${request.type}`, 1);

      if (request.context.tenantId) {
        this.collectCustomMetrics(`tenant_${request.context.tenantId}`, 1);
      }

      if (request.context.userId) {
        this.collectCustomMetrics(`user_${request.context.userId}`, 1);
      }
    }
  }

  /**
   * 收集响应指标
   *
   * @description 收集响应的结果指标
   * @param request 请求对象
   * @param response 响应对象
   * @param startTime 开始时间
   */
  private collectResponseMetrics<T>(
    request: IMiddlewareRequest<T>,
    response: IMiddlewareResponse<T>,
    startTime: Date
  ): void {
    const processingTime = new Date().getTime() - startTime.getTime();

    // 更新基本指标
    if (response.success) {
      this._metrics.successRequests++;
    } else {
      this._metrics.errorRequests++;
    }

    // 更新处理时间指标
    this._metrics.totalProcessingTime += processingTime;
    this._metrics.averageProcessingTime =
      this._metrics.totalProcessingTime / this._metrics.totalRequests;
    this._metrics.maxProcessingTime = Math.max(
      this._metrics.maxProcessingTime,
      processingTime
    );
    this._metrics.minProcessingTime = Math.min(
      this._metrics.minProcessingTime,
      processingTime
    );

    // 记录请求历史
    this.recordRequestHistory(request, response, processingTime);

    // 收集自定义指标
    if (this.config.collectCustomMetrics) {
      this.collectCustomMetrics('response_count', 1);
      this.collectCustomMetrics(`response_type_${request.type}`, 1);
      this.collectCustomMetrics(
        `processing_time_${request.type}`,
        processingTime
      );

      if (response.success) {
        this.collectCustomMetrics('success_count', 1);
        this.collectCustomMetrics(`success_type_${request.type}`, 1);
      } else {
        this.collectCustomMetrics('error_count', 1);
        this.collectCustomMetrics(`error_type_${request.type}`, 1);

        if (response.error) {
          this.collectCustomMetrics(
            `error_class_${response.error.constructor.name}`,
            1
          );
        }
      }
    }
  }

  /**
   * 记录请求历史
   *
   * @description 记录请求的历史信息
   * @param request 请求对象
   * @param response 响应对象
   * @param processingTime 处理时间
   */
  private recordRequestHistory<T>(
    request: IMiddlewareRequest<T>,
    response: IMiddlewareResponse<T>,
    processingTime: number
  ): void {
    const historyItem = {
      timestamp: new Date(),
      type: request.type,
      success: response.success,
      processingTime,
      tenantId: request.context.tenantId,
      userId: request.context.userId,
    };

    this._metrics.requestHistory.push(historyItem);

    // 限制历史记录大小
    if (
      this._metrics.requestHistory.length > (this.config.historySize || 1000)
    ) {
      this._metrics.requestHistory.shift();
    }
  }

  /**
   * 收集自定义指标
   *
   * @description 收集自定义指标
   * @param name 指标名称
   * @param value 指标值
   */
  private collectCustomMetrics(name: string, value: number): void {
    const currentValue = this._metrics.customMetrics.get(name) || 0;
    this._metrics.customMetrics.set(name, currentValue + value);
  }

  /**
   * 启动指标导出
   *
   * @description 启动定时指标导出
   */
  private startMetricsExport(): void {
    setInterval(() => {
      this.exportMetrics();
    }, this.config.exportInterval);
  }

  /**
   * 导出指标
   *
   * @description 导出当前指标到日志或外部系统
   */
  private exportMetrics(): void {
    const metrics = this.getMetrics();

    if (this.config.enableLogging) {
      this.logger.debug('Metrics exported:', JSON.stringify(metrics, null, 2));
    }

    // 这里可以添加导出到外部系统的逻辑
    // 例如：Prometheus、InfluxDB、CloudWatch等
  }

  /**
   * 获取指标
   *
   * @description 获取当前的指标数据
   * @returns 指标数据
   */
  getMetrics(): {
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    successRate: number;
    errorRate: number;
    averageProcessingTime: number;
    maxProcessingTime: number;
    minProcessingTime: number;
    requestsPerMinute: number;
    errorsPerMinute: number;
    customMetrics: Record<string, number>;
    recentRequests: Array<{
      timestamp: Date;
      type: string;
      success: boolean;
      processingTime: number;
      tenantId?: string;
      userId?: string;
    }>;
    uptime: number;
  } {
    const now = new Date();
    const uptime = now.getTime() - this._metrics.lastResetTime.getTime();

    // 计算每分钟请求数和错误数
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentRequests = this._metrics.requestHistory.filter(
      (req) => req.timestamp >= oneMinuteAgo
    );

    const requestsPerMinute = recentRequests.length;
    const errorsPerMinute = recentRequests.filter((req) => !req.success).length;

    return {
      totalRequests: this._metrics.totalRequests,
      successRequests: this._metrics.successRequests,
      errorRequests: this._metrics.errorRequests,
      successRate:
        this._metrics.totalRequests > 0
          ? this._metrics.successRequests / this._metrics.totalRequests
          : 0,
      errorRate:
        this._metrics.totalRequests > 0
          ? this._metrics.errorRequests / this._metrics.totalRequests
          : 0,
      averageProcessingTime: this._metrics.averageProcessingTime,
      maxProcessingTime: this._metrics.maxProcessingTime,
      minProcessingTime:
        this._metrics.minProcessingTime === Infinity
          ? 0
          : this._metrics.minProcessingTime,
      requestsPerMinute,
      errorsPerMinute,
      customMetrics: Object.fromEntries(this._metrics.customMetrics),
      recentRequests: this._metrics.requestHistory.slice(-10), // 最近10个请求
      uptime,
    };
  }

  /**
   * 重置指标
   *
   * @description 重置所有指标数据
   */
  resetMetrics(): void {
    this._metrics.totalRequests = 0;
    this._metrics.successRequests = 0;
    this._metrics.errorRequests = 0;
    this._metrics.totalProcessingTime = 0;
    this._metrics.averageProcessingTime = 0;
    this._metrics.maxProcessingTime = 0;
    this._metrics.minProcessingTime = Infinity;
    this._metrics.customMetrics.clear();
    this._metrics.lastResetTime = new Date();
    this._metrics.requestHistory = [];

    this.logger.debug('Metrics reset');
  }

  /**
   * 获取自定义指标
   *
   * @description 获取指定名称的自定义指标
   * @param name 指标名称
   * @returns 指标值
   */
  getCustomMetric(name: string): number {
    return this._metrics.customMetrics.get(name) || 0;
  }

  /**
   * 设置自定义指标
   *
   * @description 设置指定名称的自定义指标
   * @param name 指标名称
   * @param value 指标值
   */
  setCustomMetric(name: string, value: number): void {
    this._metrics.customMetrics.set(name, value);
  }
}
