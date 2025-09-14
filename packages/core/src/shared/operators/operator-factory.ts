import { Injectable, Logger } from '@nestjs/common';
import { Observable, OperatorFunction, throwError, timer } from 'rxjs';
import {
  map,
  filter,
  mergeMap,
  switchMap,
  catchError,
  retry,
  retryWhen,
  debounceTime,
  throttleTime,
  tap,
  finalize,
  delay,
} from 'rxjs/operators';
import { EnhancedOfTypeOperator } from './enhanced-of-type.operator';
import type { IOperatorFactory, IOperatorConfig } from './operator.types';

/**
 * 操作符工厂
 *
 * 提供增强的RxJS操作符创建功能，支持指标收集、缓存、错误处理等特性。
 * 为CQRS系统提供高性能和可观测的操作符实现。
 *
 * @description 操作符工厂，提供增强的RxJS操作符创建功能
 *
 * ## 业务规则
 *
 * ### 操作符创建规则
 * - 支持多种RxJS操作符的增强版本
 * - 提供统一的配置和监控接口
 * - 支持操作符的性能和错误监控
 * - 提供操作符的缓存和优化功能
 *
 * ### 性能优化规则
 * - 自动收集操作符性能指标
 * - 提供缓存支持提高响应速度
 * - 支持错误重试和恢复机制
 * - 提供操作符的统计和监控
 *
 * ## 业务逻辑流程
 *
 * 1. **操作符创建**：根据配置创建增强的操作符
 * 2. **性能监控**：自动收集性能指标
 * 3. **错误处理**：处理操作符执行错误
 * 4. **缓存管理**：管理操作符缓存
 * 5. **统计收集**：收集操作符统计信息
 *
 * @example
 * ```typescript
 * // 创建操作符工厂
 * const factory = new OperatorFactory();
 *
 * // 创建增强的ofType操作符
 * const ofType = factory.createOfType([UserCreatedEvent], {
 *   enableMetrics: true,
 *   enableCache: true
 * });
 *
 * // 创建增强的map操作符
 * const map = factory.createMap(event => event.userId, {
 *   enablePerformanceMonitoring: true
 * });
 *
 * // 使用操作符
 * const result$ = eventBus.pipe(
 *   ofType,
 *   map
 * );
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class OperatorFactory implements IOperatorFactory {
  private readonly logger = new Logger(OperatorFactory.name);
  private readonly _operators = new Map<string, any>();

  /**
   * 创建增强的ofType操作符
   *
   * @description 创建增强的ofType操作符
   * @param types 事件类型数组
   * @param config 操作符配置
   * @returns 增强的ofType操作符
   */
  createOfType<T>(
    types: Array<new (...args: any[]) => T>,
    config?: IOperatorConfig
  ): OperatorFunction<any, T> {
    const operator = new EnhancedOfTypeOperator(config);
    const operatorKey = `ofType_${types.map((t) => t.name).join('_')}`;

    // 缓存操作符实例
    this._operators.set(operatorKey, operator);

    return operator.createOperator(...types);
  }

  /**
   * 创建增强的map操作符
   *
   * @description 创建增强的map操作符
   * @param project 映射函数
   * @param config 操作符配置
   * @returns 增强的map操作符
   */
  createMap<T, R>(
    project: (value: T, index: number) => R,
    config?: IOperatorConfig
  ): OperatorFunction<T, R> {
    const operatorConfig = {
      name: 'EnhancedMap',
      enableMetrics: true,
      enableLogging: false,
      enableErrorHandling: true,
      enablePerformanceMonitoring: false,
      ...config,
    };

    return (source: Observable<T>): Observable<R> => {
      return source.pipe(
        tap(() => {
          if (operatorConfig.enableLogging) {
            this.logger.debug(`Enhanced map operator processing value`);
          }
        }),
        map((value: T, index: number) => {
          const startTime = new Date();

          try {
            const result = project(value, index);

            if (operatorConfig.enablePerformanceMonitoring) {
              const duration = new Date().getTime() - startTime.getTime();
              this.logger.debug(`Map operation completed in ${duration}ms`);
            }

            return result;
          } catch (error) {
            if (operatorConfig.enableErrorHandling) {
              this.logger.error(
                `Error in map operator: ${(error as Error).message}`,
                (error as Error).stack
              );
            }
            throw error;
          }
        }),
        catchError((error) => {
          if (operatorConfig.enableErrorHandling) {
            this.logger.error(
              `Map operator error: ${(error as Error).message}`,
              (error as Error).stack
            );
          }
          return throwError(() => error);
        })
      );
    };
  }

  /**
   * 创建增强的filter操作符
   *
   * @description 创建增强的filter操作符
   * @param predicate 过滤函数
   * @param config 操作符配置
   * @returns 增强的filter操作符
   */
  createFilter<T>(
    predicate: (value: T, index: number) => boolean,
    config?: IOperatorConfig
  ): OperatorFunction<T, T> {
    const operatorConfig = {
      name: 'EnhancedFilter',
      enableMetrics: true,
      enableLogging: false,
      enableErrorHandling: true,
      ...config,
    };

    return (source: Observable<T>): Observable<T> => {
      return source.pipe(
        filter((value: T, index: number) => {
          const startTime = new Date();

          try {
            const result = predicate(value, index);

            if (operatorConfig.enableLogging) {
              this.logger.debug(`Filter operation: ${result}`);
            }

            return result;
          } catch (error) {
            if (operatorConfig.enableErrorHandling) {
              this.logger.error(
                `Error in filter operator: ${(error as Error).message}`,
                (error as Error).stack
              );
            }
            return false;
          }
        })
      );
    };
  }

  /**
   * 创建增强的mergeMap操作符
   *
   * @description 创建增强的mergeMap操作符
   * @param project 映射函数
   * @param config 操作符配置
   * @returns 增强的mergeMap操作符
   */
  createMergeMap<T, R>(
    project: (value: T, index: number) => Observable<R>,
    config?: IOperatorConfig
  ): OperatorFunction<T, R> {
    const operatorConfig = {
      name: 'EnhancedMergeMap',
      enableMetrics: true,
      enableLogging: false,
      enableErrorHandling: true,
      ...config,
    };

    return (source: Observable<T>): Observable<R> => {
      return source.pipe(
        mergeMap((value: T, index: number) => {
          const startTime = new Date();

          try {
            const result$ = project(value, index);

            if (operatorConfig.enableLogging) {
              this.logger.debug(`MergeMap operation started`);
            }

            return result$.pipe(
              finalize(() => {
                if (operatorConfig.enablePerformanceMonitoring) {
                  const duration = new Date().getTime() - startTime.getTime();
                  this.logger.debug(
                    `MergeMap operation completed in ${duration}ms`
                  );
                }
              })
            );
          } catch (error) {
            if (operatorConfig.enableErrorHandling) {
              this.logger.error(
                `Error in mergeMap operator: ${(error as Error).message}`,
                (error as Error).stack
              );
            }
            return throwError(() => error);
          }
        })
      );
    };
  }

  /**
   * 创建增强的switchMap操作符
   *
   * @description 创建增强的switchMap操作符
   * @param project 映射函数
   * @param config 操作符配置
   * @returns 增强的switchMap操作符
   */
  createSwitchMap<T, R>(
    project: (value: T, index: number) => Observable<R>,
    config?: IOperatorConfig
  ): OperatorFunction<T, R> {
    const operatorConfig = {
      name: 'EnhancedSwitchMap',
      enableMetrics: true,
      enableLogging: false,
      enableErrorHandling: true,
      ...config,
    };

    return (source: Observable<T>): Observable<R> => {
      return source.pipe(
        switchMap((value: T, index: number) => {
          const startTime = new Date();

          try {
            const result$ = project(value, index);

            if (operatorConfig.enableLogging) {
              this.logger.debug(`SwitchMap operation started`);
            }

            return result$.pipe(
              finalize(() => {
                if (operatorConfig.enablePerformanceMonitoring) {
                  const duration = new Date().getTime() - startTime.getTime();
                  this.logger.debug(
                    `SwitchMap operation completed in ${duration}ms`
                  );
                }
              })
            );
          } catch (error) {
            if (operatorConfig.enableErrorHandling) {
              this.logger.error(
                `Error in switchMap operator: ${(error as Error).message}`,
                (error as Error).stack
              );
            }
            return throwError(() => error);
          }
        })
      );
    };
  }

  /**
   * 创建增强的catchError操作符
   *
   * @description 创建增强的catchError操作符
   * @param selector 错误处理函数
   * @param config 操作符配置
   * @returns 增强的catchError操作符
   */
  createCatchError<T, R>(
    selector: (error: any, caught: Observable<T>) => Observable<R>,
    config?: IOperatorConfig
  ): OperatorFunction<T, R> {
    const operatorConfig = {
      name: 'EnhancedCatchError',
      enableMetrics: true,
      enableLogging: true,
      enableErrorHandling: true,
      ...config,
    };

    return (source: Observable<T>): Observable<R> => {
      return source.pipe(
        catchError((error, caught) => {
          if (operatorConfig.enableLogging) {
            this.logger.error(
              `Error caught in stream: ${(error as Error).message}`,
              (error as Error).stack
            );
          }

          try {
            return selector(error, caught);
          } catch (selectorError) {
            if (operatorConfig.enableErrorHandling) {
              this.logger.error(
                `Error in error selector: ${(selectorError as Error).message}`,
                (selectorError as Error).stack
              );
            }
            return throwError(() => selectorError);
          }
        })
      );
    };
  }

  /**
   * 创建增强的retry操作符
   *
   * @description 创建增强的retry操作符
   * @param count 重试次数
   * @param config 操作符配置
   * @returns 增强的retry操作符
   */
  createRetry<T>(
    count: number,
    config?: IOperatorConfig
  ): OperatorFunction<T, T> {
    const operatorConfig = {
      name: 'EnhancedRetry',
      enableMetrics: true,
      enableLogging: true,
      enableErrorHandling: true,
      maxRetries: count,
      retryDelay: 1000,
      ...config,
    };

    return (source: Observable<T>): Observable<T> => {
      return source.pipe(
        retryWhen((errors) => {
          return errors.pipe(
            mergeMap((error, index) => {
              if (index >= operatorConfig.maxRetries!) {
                if (operatorConfig.enableLogging) {
                  this.logger.error(
                    `Max retry attempts (${operatorConfig.maxRetries}) exceeded`
                  );
                }
                return throwError(() => error);
              }

              if (operatorConfig.enableLogging) {
                this.logger.warn(
                  `Retry attempt ${index + 1}/${operatorConfig.maxRetries}`
                );
              }

              return timer(operatorConfig.retryDelay!);
            })
          );
        })
      );
    };
  }

  /**
   * 创建增强的debounceTime操作符
   *
   * @description 创建增强的debounceTime操作符
   * @param dueTime 防抖时间（毫秒）
   * @param config 操作符配置
   * @returns 增强的debounceTime操作符
   */
  createDebounceTime<T>(
    dueTime: number,
    config?: IOperatorConfig
  ): OperatorFunction<T, T> {
    const operatorConfig = {
      name: 'EnhancedDebounceTime',
      enableMetrics: true,
      enableLogging: false,
      ...config,
    };

    return (source: Observable<T>): Observable<T> => {
      return source.pipe(
        debounceTime(dueTime),
        tap(() => {
          if (operatorConfig.enableLogging) {
            this.logger.debug(`Debounced value emitted after ${dueTime}ms`);
          }
        })
      );
    };
  }

  /**
   * 创建增强的throttleTime操作符
   *
   * @description 创建增强的throttleTime操作符
   * @param duration 节流时间（毫秒）
   * @param config 操作符配置
   * @returns 增强的throttleTime操作符
   */
  createThrottleTime<T>(
    duration: number,
    config?: IOperatorConfig
  ): OperatorFunction<T, T> {
    const operatorConfig = {
      name: 'EnhancedThrottleTime',
      enableMetrics: true,
      enableLogging: false,
      ...config,
    };

    return (source: Observable<T>): Observable<T> => {
      return source.pipe(
        throttleTime(duration),
        tap(() => {
          if (operatorConfig.enableLogging) {
            this.logger.debug(`Throttled value emitted after ${duration}ms`);
          }
        })
      );
    };
  }

  /**
   * 获取所有操作符实例
   *
   * @description 获取所有创建的操作符实例
   * @returns 操作符实例映射
   */
  getAllOperators(): Map<string, any> {
    return new Map(this._operators);
  }

  /**
   * 清除所有操作符实例
   *
   * @description 清除所有操作符实例
   */
  clearAllOperators(): void {
    this._operators.clear();
    this.logger.debug('All operators cleared');
  }
}
