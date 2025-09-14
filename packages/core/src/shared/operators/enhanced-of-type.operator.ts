import { Injectable, Logger } from '@nestjs/common';
import { Observable, OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import { OperatorCache } from './operator-cache';
import type {
  IOperatorConfig,
  IOperatorMetrics,
  IOperatorError,
  IOperatorPerformance,
} from './operator.types';

/**
 * 增强的ofType操作符
 *
 * 基于@nestjs/cqrs的ofType操作符，添加了指标收集、缓存、错误处理等增强功能。
 * 提供类型安全的事件过滤和性能监控能力。
 *
 * @description 增强的ofType操作符，提供事件过滤和性能监控功能
 *
 * ## 业务规则
 *
 * ### 事件过滤规则
 * - 支持按事件类型过滤事件流
 * - 提供类型安全的事件处理
 * - 支持多个事件类型的组合过滤
 * - 提供事件流的转换和映射
 *
 * ### 性能监控规则
 * - 收集处理时间和性能指标
 * - 提供缓存支持提高性能
 * - 记录错误和异常信息
 * - 支持指标查询和统计
 *
 * ## 业务逻辑流程
 *
 * 1. **事件接收**：接收来自事件流的事件
 * 2. **类型检查**：检查事件类型是否匹配
 * 3. **缓存查询**：如果启用缓存，查询缓存结果
 * 4. **事件过滤**：过滤匹配的事件类型
 * 5. **指标更新**：更新处理指标和统计信息
 *
 * @example
 * ```typescript
 * // 创建增强的ofType操作符
 * const ofType = createEnhancedOfType({
 *   enableMetrics: true,
 *   enableCache: true,
 *   enableLogging: true
 * });
 *
 * // 使用操作符
 * const userEvents$ = eventBus.pipe(
 *   ofType(UserCreatedEvent, UserUpdatedEvent)
 * );
 *
 * // 获取操作符统计
 * const stats = ofType.getStats();
 * console.log('Processed events:', stats.metrics.messageCount);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class EnhancedOfTypeOperator {
  private readonly logger = new Logger(EnhancedOfTypeOperator.name);
  private readonly _cache?: OperatorCache<boolean>;
  private readonly _metrics: IOperatorMetrics;
  private readonly _errors: IOperatorError[] = [];
  private readonly _performance: IOperatorPerformance[] = [];
  private readonly _config: IOperatorConfig;

  /**
   * 构造函数
   *
   * @param config 操作符配置
   */
  constructor(config: IOperatorConfig = {}) {
    this._config = {
      name: 'EnhancedOfType',
      enableMetrics: true,
      enableCache: false,
      enableLogging: false,
      enableErrorHandling: true,
      enablePerformanceMonitoring: false,
      ...config,
    };

    // 初始化缓存
    if (this._config.enableCache) {
      this._cache = new OperatorCache<boolean>(
        this._config.cacheSize || 1000,
        this._config.cacheExpiry
      );
    }

    // 初始化指标
    this._metrics = {
      name: this._config.name || 'EnhancedOfType',
      messageCount: 0,
      successCount: 0,
      errorCount: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: Infinity,
      cacheHits: 0,
      cacheMisses: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * 创建增强的ofType操作符
   *
   * @description 创建增强的ofType操作符函数
   * @param types 事件类型数组
   * @returns 操作符函数
   */
  createOperator<T>(
    ...types: Array<new (...args: any[]) => T>
  ): OperatorFunction<any, T> {
    const typeNames = types.map((type) => type.name);

    if (this._config.enableLogging) {
      this.logger.debug(
        `Creating enhanced ofType operator for types: ${typeNames.join(', ')}`
      );
    }

    return (source: Observable<any>): Observable<T> => {
      return source.pipe(
        filter((event: any) => {
          const startTime = new Date();

          try {
            // 检查缓存
            if (this._config.enableCache && this._cache) {
              const cacheKey = this.getCacheKey(event, typeNames);
              const cachedResult = this._cache.get(cacheKey);

              if (cachedResult !== undefined) {
                this._metrics.cacheHits++;
                this.updateMetrics(startTime, true);
                return cachedResult;
              }

              this._metrics.cacheMisses++;
            }

            // 执行类型检查
            const result = types.some((type) => event instanceof type);

            // 更新缓存
            if (this._config.enableCache && this._cache) {
              const cacheKey = this.getCacheKey(event, typeNames);
              this._cache.set(cacheKey, result);
            }

            // 更新指标
            this.updateMetrics(startTime, true);

            return result;
          } catch (error) {
            this.handleError(error, event, startTime);
            return false;
          }
        })
      );
    };
  }

  /**
   * 获取操作符统计信息
   *
   * @description 获取操作符的统计信息
   * @returns 统计信息
   */
  getStats(): {
    metrics: IOperatorMetrics;
    cache?: any;
    errorCount: number;
    performanceCount: number;
  } {
    return {
      metrics: { ...this._metrics },
      cache: this._cache?.getStats(),
      errorCount: this._errors.length,
      performanceCount: this._performance.length,
    };
  }

  /**
   * 重置指标
   *
   * @description 重置所有指标数据
   */
  resetMetrics(): void {
    this._metrics.messageCount = 0;
    this._metrics.successCount = 0;
    this._metrics.errorCount = 0;
    this._metrics.averageProcessingTime = 0;
    this._metrics.maxProcessingTime = 0;
    this._metrics.minProcessingTime = Infinity;
    this._metrics.cacheHits = 0;
    this._metrics.cacheMisses = 0;
    this._metrics.lastUpdated = new Date();

    if (this._config.enableLogging) {
      this.logger.debug('Metrics reset');
    }
  }

  /**
   * 清除缓存
   *
   * @description 清除所有缓存数据
   */
  clearCache(): void {
    if (this._cache) {
      this._cache.clear();

      if (this._config.enableLogging) {
        this.logger.debug('Cache cleared');
      }
    }
  }

  /**
   * 清除错误历史
   *
   * @description 清除所有错误记录
   */
  clearErrors(): void {
    this._errors.length = 0;

    if (this._config.enableLogging) {
      this.logger.debug('Errors cleared');
    }
  }

  /**
   * 清除性能历史
   *
   * @description 清除所有性能记录
   */
  clearPerformance(): void {
    this._performance.length = 0;

    if (this._config.enableLogging) {
      this.logger.debug('Performance history cleared');
    }
  }

  /**
   * 获取缓存键
   *
   * @description 生成事件的缓存键
   * @param event 事件对象
   * @param typeNames 类型名称数组
   * @returns 缓存键
   */
  private getCacheKey(event: any, typeNames: string[]): string {
    const eventType = event.constructor.name;
    const eventId = event.id || event.aggregateId || 'unknown';
    return `${eventType}:${eventId}:${typeNames.join(',')}`;
  }

  /**
   * 更新指标
   *
   * @description 更新操作符指标
   * @param startTime 开始时间
   * @param success 是否成功
   */
  private updateMetrics(startTime: Date, success: boolean): void {
    if (!this._config.enableMetrics) {
      return;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    this._metrics.messageCount++;

    if (success) {
      this._metrics.successCount++;
    } else {
      this._metrics.errorCount++;
    }

    // 更新处理时间指标
    this._metrics.averageProcessingTime =
      (this._metrics.averageProcessingTime * (this._metrics.messageCount - 1) +
        duration) /
      this._metrics.messageCount;

    this._metrics.maxProcessingTime = Math.max(
      this._metrics.maxProcessingTime,
      duration
    );
    this._metrics.minProcessingTime = Math.min(
      this._metrics.minProcessingTime,
      duration
    );
    this._metrics.lastUpdated = endTime;

    // 记录性能信息
    if (this._config.enablePerformanceMonitoring) {
      this._performance.push({
        name: this._metrics.name,
        startTime,
        endTime,
        duration,
        inputSize: JSON.stringify(startTime).length,
        outputSize: JSON.stringify(success).length,
      });

      // 限制性能记录数量
      if (this._performance.length > 1000) {
        this._performance.shift();
      }
    }
  }

  /**
   * 处理错误
   *
   * @description 处理操作符执行过程中的错误
   * @param error 错误对象
   * @param event 事件对象
   * @param startTime 开始时间
   */
  private handleError(error: any, event: any, startTime: Date): void {
    if (!this._config.enableErrorHandling) {
      return;
    }

    const errorInfo: IOperatorError = {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      operatorName: this._metrics.name,
      inputData: {
        eventType: event.constructor.name,
        eventId: event.id || event.aggregateId,
      },
      context: {
        config: this._config,
      },
    };

    this._errors.push(errorInfo);
    this.updateMetrics(startTime, false);

    // 限制错误记录数量
    if (this._errors.length > 100) {
      this._errors.shift();
    }

    if (this._config.enableLogging) {
      this.logger.error(
        `Error in enhanced ofType operator: ${error.message}`,
        error.stack
      );
    }
  }
}

/**
 * 创建增强的ofType操作符
 *
 * @description 创建增强的ofType操作符的工厂函数
 * @param config 操作符配置
 * @returns 增强的ofType操作符实例
 */
export function createEnhancedOfType(
  config?: IOperatorConfig
): EnhancedOfTypeOperator {
  return new EnhancedOfTypeOperator(config);
}
