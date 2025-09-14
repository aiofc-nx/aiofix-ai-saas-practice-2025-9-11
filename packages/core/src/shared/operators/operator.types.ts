import type { Observable, OperatorFunction } from 'rxjs';

/**
 * 操作符配置接口
 *
 * @description 定义操作符的配置选项
 */
export interface IOperatorConfig {
  /** 操作符名称 */
  name?: string;
  /** 是否启用指标收集 */
  enableMetrics?: boolean;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存大小限制 */
  cacheSize?: number;
  /** 缓存过期时间（毫秒） */
  cacheExpiry?: number;
  /** 是否启用日志记录 */
  enableLogging?: boolean;
  /** 是否启用错误处理 */
  enableErrorHandling?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
}

/**
 * 操作符指标接口
 *
 * @description 定义操作符的指标信息
 */
export interface IOperatorMetrics {
  /** 操作符名称 */
  name: string;
  /** 处理的消息数量 */
  messageCount: number;
  /** 成功处理的消息数量 */
  successCount: number;
  /** 失败处理的消息数量 */
  errorCount: number;
  /** 平均处理时间（毫秒） */
  averageProcessingTime: number;
  /** 最大处理时间（毫秒） */
  maxProcessingTime: number;
  /** 最小处理时间（毫秒） */
  minProcessingTime: number;
  /** 缓存命中次数 */
  cacheHits: number;
  /** 缓存未命中次数 */
  cacheMisses: number;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 操作符缓存接口
 *
 * @description 定义操作符的缓存功能
 */
export interface IOperatorCache<T> {
  /**
   * 获取缓存值
   *
   * @param key 缓存键
   * @returns 缓存值，如果不存在则返回undefined
   */
  get(key: string): T | undefined;

  /**
   * 设置缓存值
   *
   * @param key 缓存键
   * @param value 缓存值
   * @param expiry 过期时间（毫秒）
   */
  set(key: string, value: T, expiry?: number): void;

  /**
   * 删除缓存值
   *
   * @param key 缓存键
   * @returns 如果删除成功则返回true，否则返回false
   */
  delete(key: string): boolean;

  /**
   * 清空所有缓存
   */
  clear(): void;

  /**
   * 获取缓存统计信息
   *
   * @returns 缓存统计信息
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
}

/**
 * 操作符错误信息接口
 *
 * @description 定义操作符的错误信息
 */
export interface IOperatorError {
  /** 错误类型 */
  type: string;
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 发生时间 */
  timestamp: Date;
  /** 操作符名称 */
  operatorName: string;
  /** 输入数据 */
  inputData?: any;
  /** 上下文信息 */
  context?: Record<string, any>;
}

/**
 * 操作符性能信息接口
 *
 * @description 定义操作符的性能信息
 */
export interface IOperatorPerformance {
  /** 操作符名称 */
  name: string;
  /** 执行开始时间 */
  startTime: Date;
  /** 执行结束时间 */
  endTime: Date;
  /** 执行持续时间（毫秒） */
  duration: number;
  /** 输入数据大小（字节） */
  inputSize?: number;
  /** 输出数据大小（字节） */
  outputSize?: number;
  /** 内存使用量（字节） */
  memoryUsage?: number;
}

/**
 * 增强操作符接口
 *
 * @description 定义增强操作符的基本接口
 */
export interface IEnhancedOperator<T, R> {
  /** 操作符名称 */
  name: string;
  /** 操作符配置 */
  config: IOperatorConfig;
  /** 操作符指标 */
  metrics: IOperatorMetrics;
  /** 操作符缓存 */
  cache?: IOperatorCache<R>;
  /** 操作符错误历史 */
  errors: IOperatorError[];
  /** 操作符性能历史 */
  performance: IOperatorPerformance[];

  /**
   * 执行操作符逻辑
   *
   * @param source 输入Observable
   * @returns 输出Observable
   */
  call(source: Observable<T>): Observable<R>;

  /**
   * 重置指标
   */
  resetMetrics(): void;

  /**
   * 清除缓存
   */
  clearCache(): void;

  /**
   * 清除错误历史
   */
  clearErrors(): void;

  /**
   * 清除性能历史
   */
  clearPerformance(): void;

  /**
   * 获取操作符统计信息
   *
   * @returns 统计信息
   */
  getStats(): {
    metrics: IOperatorMetrics;
    cache?: IOperatorCache<R>['getStats'];
    errorCount: number;
    performanceCount: number;
  };
}

/**
 * 操作符工厂接口
 *
 * @description 定义操作符工厂的接口
 */
export interface IOperatorFactory {
  /**
   * 创建增强的ofType操作符
   *
   * @param types 事件类型数组
   * @param config 操作符配置
   * @returns 增强的ofType操作符
   */
  createOfType<T>(
    types: Array<new (...args: any[]) => T>,
    config?: IOperatorConfig
  ): OperatorFunction<any, T>;

  /**
   * 创建增强的map操作符
   *
   * @param project 映射函数
   * @param config 操作符配置
   * @returns 增强的map操作符
   */
  createMap<T, R>(
    project: (value: T, index: number) => R,
    config?: IOperatorConfig
  ): OperatorFunction<T, R>;

  /**
   * 创建增强的filter操作符
   *
   * @param predicate 过滤函数
   * @param config 操作符配置
   * @returns 增强的filter操作符
   */
  createFilter<T>(
    predicate: (value: T, index: number) => boolean,
    config?: IOperatorConfig
  ): OperatorFunction<T, T>;

  /**
   * 创建增强的mergeMap操作符
   *
   * @param project 映射函数
   * @param config 操作符配置
   * @returns 增强的mergeMap操作符
   */
  createMergeMap<T, R>(
    project: (value: T, index: number) => Observable<R>,
    config?: IOperatorConfig
  ): OperatorFunction<T, R>;

  /**
   * 创建增强的switchMap操作符
   *
   * @param project 映射函数
   * @param config 操作符配置
   * @returns 增强的switchMap操作符
   */
  createSwitchMap<T, R>(
    project: (value: T, index: number) => Observable<R>,
    config?: IOperatorConfig
  ): OperatorFunction<T, R>;

  /**
   * 创建增强的catchError操作符
   *
   * @param selector 错误处理函数
   * @param config 操作符配置
   * @returns 增强的catchError操作符
   */
  createCatchError<T, R>(
    selector: (error: any, caught: Observable<T>) => Observable<R>,
    config?: IOperatorConfig
  ): OperatorFunction<T, R>;

  /**
   * 创建增强的retry操作符
   *
   * @param count 重试次数
   * @param config 操作符配置
   * @returns 增强的retry操作符
   */
  createRetry<T>(
    count: number,
    config?: IOperatorConfig
  ): OperatorFunction<T, T>;

  /**
   * 创建增强的debounceTime操作符
   *
   * @param dueTime 防抖时间（毫秒）
   * @param config 操作符配置
   * @returns 增强的debounceTime操作符
   */
  createDebounceTime<T>(
    dueTime: number,
    config?: IOperatorConfig
  ): OperatorFunction<T, T>;

  /**
   * 创建增强的throttleTime操作符
   *
   * @param duration 节流时间（毫秒）
   * @param config 操作符配置
   * @returns 增强的throttleTime操作符
   */
  createThrottleTime<T>(
    duration: number,
    config?: IOperatorConfig
  ): OperatorFunction<T, T>;
}
