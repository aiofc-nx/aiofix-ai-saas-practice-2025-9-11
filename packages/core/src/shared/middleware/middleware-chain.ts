import { Injectable, Logger } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import type {
  IMiddlewareChain,
  IMiddlewareRequest,
  IMiddlewareResponse,
  IMiddlewareChainConfig,
  IMiddlewareStats,
} from './middleware.types';
import type { IMiddleware } from './middleware.types';

/**
 * 中间件链实现
 *
 * 负责管理和执行中间件链，提供中间件的注册、排序、执行等功能。
 * 支持中间件的优先级排序和错误处理。
 *
 * @description 中间件链实现，提供中间件的链式执行功能
 *
 * ## 业务规则
 *
 * ### 中间件链管理规则
 * - 支持中间件的动态添加和移除
 * - 支持按优先级排序中间件
 * - 提供中间件链的执行和监控
 * - 支持中间件链的配置管理
 *
 * ### 执行规则
 * - 按优先级顺序执行中间件
 * - 支持中间件的错误处理和恢复
 * - 提供中间件链的统计和监控
 * - 支持中间件链的超时控制
 *
 * ## 业务逻辑流程
 *
 * 1. **中间件注册**：注册中间件到链中
 * 2. **优先级排序**：按优先级排序中间件
 * 3. **链式执行**：依次执行中间件
 * 4. **错误处理**：处理执行过程中的错误
 * 5. **统计收集**：收集执行统计信息
 *
 * @example
 * ```typescript
 * // 创建中间件链
 * const chain = new MiddlewareChain();
 *
 * // 添加中间件
 * chain.addMiddleware(new LoggingMiddleware());
 * chain.addMiddleware(new AuthMiddleware());
 * chain.addMiddleware(new ValidationMiddleware());
 *
 * // 执行中间件链
 * const response = await chain.execute({
 *   type: 'CreateUser',
 *   data: { name: 'John' },
 *   context: { requestId: 'req-123' }
 * });
 *
 * // 获取统计信息
 * const stats = chain.getStats();
 * console.log('Chain stats:', stats);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class MiddlewareChain<TRequest = any, TResponse = any>
  implements IMiddlewareChain<TRequest, TResponse>
{
  private readonly logger = new Logger(MiddlewareChain.name);
  private readonly _middlewares: IMiddleware<TRequest, TResponse>[] = [];
  private readonly _stats: IMiddlewareStats;

  /**
   * 构造函数
   *
   * @param config 中间件链配置
   */
  constructor(public readonly config: IMiddlewareChainConfig = {}) {
    // 设置默认配置
    this.config = {
      enableGlobalLogging: false,
      enableGlobalPerformanceMonitoring: false,
      enableGlobalErrorHandling: true,
      globalTimeout: 60000, // 1分钟
      sortByPriority: true,
      ...config,
    };

    // 初始化统计信息
    this._stats = {
      totalRequests: 0,
      successRequests: 0,
      errorRequests: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: Infinity,
      middlewareStats: {},
      lastUpdated: new Date(),
    };
  }

  /**
   * 获取中间件列表
   *
   * @description 获取中间件列表的副本
   * @returns 中间件列表
   */
  get middlewares(): IMiddleware<TRequest, TResponse>[] {
    return [...this._middlewares];
  }

  /**
   * 添加中间件
   *
   * @description 添加中间件到链中
   * @param middleware 中间件实例
   */
  addMiddleware(middleware: IMiddleware<TRequest, TResponse>): void {
    // 检查是否已存在同名中间件
    const existingIndex = this._middlewares.findIndex(
      (m) => m.name === middleware.name
    );

    if (existingIndex >= 0) {
      // 替换现有中间件
      this._middlewares[existingIndex] = middleware;
      this.logger.debug(`Replaced middleware: ${middleware.name}`);
    } else {
      // 添加新中间件
      this._middlewares.push(middleware);
      this.logger.debug(`Added middleware: ${middleware.name}`);
    }

    // 按优先级排序
    if (this.config.sortByPriority) {
      this._middlewares.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    // 初始化中间件统计
    if (!this._stats.middlewareStats[middleware.name]) {
      this._stats.middlewareStats[middleware.name] = {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        averageTime: 0,
        lastUsed: new Date(),
      };
    }
  }

  /**
   * 移除中间件
   *
   * @description 从链中移除指定名称的中间件
   * @param name 中间件名称
   */
  removeMiddleware(name: string): void {
    const index = this._middlewares.findIndex((m) => m.name === name);

    if (index >= 0) {
      this._middlewares.splice(index, 1);
      delete this._stats.middlewareStats[name];
      this.logger.debug(`Removed middleware: ${name}`);
    } else {
      this.logger.warn(`Middleware not found: ${name}`);
    }
  }

  /**
   * 执行中间件链
   *
   * @description 执行中间件链中的所有中间件
   * @param request 请求对象
   * @returns 响应对象
   */
  execute(
    request: IMiddlewareRequest<TRequest>
  ): Observable<IMiddlewareResponse<TResponse>> {
    const startTime = new Date();
    this._stats.totalRequests++;
    this._stats.lastUpdated = new Date();

    if (this.config.enableGlobalLogging) {
      this.logger.debug(
        `Executing middleware chain for request: ${request.type}`
      );
    }

    // 如果没有中间件，直接返回成功响应
    if (this._middlewares.length === 0) {
      return of(this.createSuccessResponse(request, startTime));
    }

    // 创建中间件执行器
    const executor = this.createExecutor(request, startTime);

    // 执行中间件链
    return executor().pipe(
      catchError((error) => {
        this._stats.errorRequests++;
        this.updateStats(startTime, false);

        if (this.config.enableGlobalErrorHandling) {
          this.logger.error(
            `Middleware chain error: ${(error as Error).message}`,
            (error as Error).stack
          );
        }

        return of({
          error: error as Error,
          success: false,
          processingTime: new Date().getTime() - startTime.getTime(),
          metadata: {
            chainName: 'MiddlewareChain',
            timestamp: new Date(),
          },
        });
      }),
      tap((response) => {
        if (response.success) {
          this._stats.successRequests++;
        } else {
          this._stats.errorRequests++;
        }
        this.updateStats(startTime, response.success);
      })
    );
  }

  /**
   * 创建中间件执行器
   *
   * @description 创建递归的中间件执行器
   * @param request 请求对象
   * @param startTime 开始时间
   * @returns 执行器函数
   */
  private createExecutor(
    request: IMiddlewareRequest<TRequest>,
    startTime: Date
  ): (index?: number) => Observable<IMiddlewareResponse<TResponse>> {
    return (index = 0): Observable<IMiddlewareResponse<TResponse>> => {
      // 如果没有更多中间件，返回成功响应
      if (index >= this._middlewares.length) {
        return of(this.createSuccessResponse(request, startTime));
      }

      const middleware = this._middlewares[index];
      const middlewareStartTime = new Date();

      // 更新中间件统计
      this.updateMiddlewareStats(middleware.name, middlewareStartTime);

      // 执行当前中间件
      return middleware
        .handle(request, () =>
          this.createExecutor(request, startTime)(index + 1)
        )
        .pipe(
          map((response) => {
            // 更新中间件统计
            const processingTime =
              new Date().getTime() - middlewareStartTime.getTime();
            this.updateMiddlewareStats(
              middleware.name,
              middlewareStartTime,
              true,
              processingTime
            );

            return response;
          }),
          catchError((error) => {
            // 更新中间件统计
            const processingTime =
              new Date().getTime() - middlewareStartTime.getTime();
            this.updateMiddlewareStats(
              middleware.name,
              middlewareStartTime,
              false,
              processingTime
            );

            throw error;
          })
        );
    };
  }

  /**
   * 创建成功响应
   *
   * @description 创建成功响应
   * @param request 请求对象
   * @param startTime 开始时间
   * @returns 成功响应
   */
  private createSuccessResponse(
    request: IMiddlewareRequest<TRequest>,
    startTime: Date
  ): IMiddlewareResponse<TResponse> {
    return {
      success: true,
      processingTime: new Date().getTime() - startTime.getTime(),
      metadata: {
        chainName: 'MiddlewareChain',
        timestamp: new Date(),
        middlewareCount: this._middlewares.length,
      },
    };
  }

  /**
   * 更新统计信息
   *
   * @description 更新中间件链的统计信息
   * @param startTime 开始时间
   * @param success 是否成功
   */
  private updateStats(startTime: Date, success: boolean): void {
    const processingTime = new Date().getTime() - startTime.getTime();

    // 更新处理时间统计
    this._stats.averageProcessingTime =
      (this._stats.averageProcessingTime * (this._stats.totalRequests - 1) +
        processingTime) /
      this._stats.totalRequests;

    this._stats.maxProcessingTime = Math.max(
      this._stats.maxProcessingTime,
      processingTime
    );
    this._stats.minProcessingTime = Math.min(
      this._stats.minProcessingTime,
      processingTime
    );
    this._stats.lastUpdated = new Date();
  }

  /**
   * 更新中间件统计信息
   *
   * @description 更新单个中间件的统计信息
   * @param middlewareName 中间件名称
   * @param startTime 开始时间
   * @param success 是否成功
   * @param processingTime 处理时间
   */
  private updateMiddlewareStats(
    middlewareName: string,
    startTime: Date,
    success?: boolean,
    processingTime?: number
  ): void {
    if (!this._stats.middlewareStats[middlewareName]) {
      this._stats.middlewareStats[middlewareName] = {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        averageTime: 0,
        lastUsed: new Date(),
      };
    }

    const stats = this._stats.middlewareStats[middlewareName];
    stats.requestCount++;
    stats.lastUsed = new Date();

    if (success !== undefined) {
      if (success) {
        stats.successCount++;
      } else {
        stats.errorCount++;
      }
    }

    if (processingTime !== undefined) {
      stats.averageTime =
        (stats.averageTime * (stats.requestCount - 1) + processingTime) /
        stats.requestCount;
    }
  }

  /**
   * 获取中间件统计信息
   *
   * @description 获取中间件链的统计信息
   * @returns 统计信息
   */
  getStats(): IMiddlewareStats {
    return {
      ...this._stats,
      middlewareStats: { ...this._stats.middlewareStats },
    };
  }

  /**
   * 清除统计信息
   *
   * @description 清除所有统计信息
   */
  clearStats(): void {
    this._stats.totalRequests = 0;
    this._stats.successRequests = 0;
    this._stats.errorRequests = 0;
    this._stats.averageProcessingTime = 0;
    this._stats.maxProcessingTime = 0;
    this._stats.minProcessingTime = Infinity;
    this._stats.middlewareStats = {};
    this._stats.lastUpdated = new Date();

    this.logger.debug('Middleware chain stats cleared');
  }

  /**
   * 获取中间件数量
   *
   * @description 获取中间件链中的中间件数量
   * @returns 中间件数量
   */
  getMiddlewareCount(): number {
    return this._middlewares.length;
  }

  /**
   * 检查是否包含中间件
   *
   * @description 检查中间件链是否包含指定名称的中间件
   * @param name 中间件名称
   * @returns 是否包含
   */
  hasMiddleware(name: string): boolean {
    return this._middlewares.some((m) => m.name === name);
  }

  /**
   * 获取中间件名称列表
   *
   * @description 获取所有中间件的名称列表
   * @returns 中间件名称列表
   */
  getMiddlewareNames(): string[] {
    return this._middlewares.map((m) => m.name);
  }
}
