/**
 * Core模块配置接口
 *
 * @description 定义Core模块的所有配置选项，包括CQRS、中间件、发布者等配置
 *
 * ## 业务规则
 *
 * ### 配置管理规则
 * - 所有配置都有默认值，确保系统可以正常运行
 * - 支持环境变量覆盖配置值
 * - 配置值在运行时不可修改，确保一致性
 * - 提供类型安全的配置访问接口
 *
 * ### 性能配置规则
 * - 中间件超时时间可配置，默认30秒
 * - 发布者重试次数和延迟可配置
 * - 指标收集间隔可配置，默认1分钟
 * - 日志级别和输出格式可配置
 *
 * @example
 * ```typescript
 * // 使用配置服务获取core配置
 * const coreConfig = configService.getConfigValue('core');
 *
 * // 获取中间件配置
 * const middlewareConfig = coreConfig.middleware;
 *
 * // 获取发布者配置
 * const publisherConfig = coreConfig.publisher;
 * ```
 *
 * @since 1.0.0
 */

/**
 * 中间件配置接口
 */
export interface IMiddlewareConfig {
  /** 是否启用日志中间件 */
  enableLogging: boolean;
  /** 是否启用指标中间件 */
  enableMetrics: boolean;
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** 是否脱敏敏感数据 */
  maskSensitiveData: boolean;
  /** 是否记录请求数据 */
  logRequestData: boolean;
  /** 是否记录响应数据 */
  logResponseData: boolean;
  /** 中间件超时时间（毫秒） */
  timeout: number;
  /** 指标导出间隔（毫秒） */
  metricsExportInterval: number;
  /** 历史记录大小 */
  historySize: number;
}

/**
 * 发布者配置接口
 */
export interface IPublisherConfig {
  /** 是否启用日志记录 */
  enableLogging: boolean;
  /** 是否启用指标收集 */
  enableMetrics: boolean;
  /** 是否启用重试机制 */
  enableRetry: boolean;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 是否启用批量处理 */
  enableBatching: boolean;
  /** 批量大小 */
  batchSize: number;
  /** 批量延迟（毫秒） */
  batchDelay: number;
}

/**
 * CQRS配置接口
 */
export interface ICqrsConfig {
  /** 命令总线配置 */
  commandBus: IPublisherConfig;
  /** 查询总线配置 */
  queryBus: IPublisherConfig;
  /** 事件总线配置 */
  eventBus: IPublisherConfig;
  /** 事件存储配置 */
  eventStore: {
    /** 是否启用事件存储 */
    enabled: boolean;
    /** 事件存储表名 */
    tableName: string;
    /** 是否启用事件投影 */
    enableProjections: boolean;
  };
}

/**
 * 缓存配置接口
 */
export interface ICacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 缓存类型 */
  cacheType: 'memory' | 'redis' | 'hybrid';
  /** 默认TTL（毫秒） */
  defaultTtl: number;
  /** 最大缓存大小 */
  maxSize: number;
  /** 是否启用压缩 */
  enableCompression: boolean;
  /** 是否启用加密 */
  enableEncryption: boolean;
  /** 缓存策略 */
  strategy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  /** 重试次数 */
  retries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 连接超时（毫秒） */
  timeout: number;
}

/**
 * CQRS缓存配置接口
 */
export interface ICqrsCacheConfig {
  /** 命令缓存配置 */
  command: ICacheConfig;
  /** 查询缓存配置 */
  query: ICacheConfig;
  /** 事件缓存配置 */
  event: ICacheConfig;
  /** 事件存储缓存配置 */
  eventStore: ICacheConfig;
  /** 聚合根缓存配置 */
  aggregate: ICacheConfig;
}

/**
 * Core模块配置接口
 */
export interface ICoreConfig {
  /** 中间件配置 */
  middleware: IMiddlewareConfig;
  /** CQRS配置 */
  cqrs: ICqrsConfig;
  /** 发布者配置 */
  publisher: IPublisherConfig;
  /** 缓存配置 */
  cache: ICqrsCacheConfig;
  /** 性能监控配置 */
  performance: {
    /** 是否启用性能监控 */
    enabled: boolean;
    /** 监控间隔（毫秒） */
    interval: number;
    /** 是否启用内存监控 */
    enableMemoryMonitoring: boolean;
    /** 是否启用CPU监控 */
    enableCpuMonitoring: boolean;
  };
}

/**
 * Core模块默认配置
 */
export const DEFAULT_CORE_CONFIG: ICoreConfig = {
  middleware: {
    enableLogging: true,
    enableMetrics: true,
    logLevel: 'info',
    maskSensitiveData: true,
    logRequestData: true,
    logResponseData: true,
    timeout: 30000, // 30秒
    metricsExportInterval: 60000, // 1分钟
    historySize: 1000,
  },
  cqrs: {
    commandBus: {
      enableLogging: true,
      enableMetrics: true,
      enableRetry: false,
      maxRetries: 3,
      retryDelay: 1000,
      enableBatching: true,
      batchSize: 50,
      batchDelay: 100,
    },
    queryBus: {
      enableLogging: true,
      enableMetrics: true,
      enableRetry: false,
      maxRetries: 3,
      retryDelay: 1000,
      enableBatching: true,
      batchSize: 100,
      batchDelay: 50,
    },
    eventBus: {
      enableLogging: true,
      enableMetrics: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableBatching: true,
      batchSize: 200,
      batchDelay: 50,
    },
    eventStore: {
      enabled: true,
      tableName: 'domain_events',
      enableProjections: true,
    },
  },
  publisher: {
    enableLogging: true,
    enableMetrics: true,
    enableRetry: false,
    maxRetries: 3,
    retryDelay: 1000,
    enableBatching: false,
    batchSize: 100,
    batchDelay: 100,
  },
  cache: {
    command: {
      enabled: true,
      cacheType: 'memory',
      defaultTtl: 300000, // 5分钟
      maxSize: 1000,
      enableCompression: false,
      enableEncryption: false,
      strategy: 'lru',
      retries: 3,
      retryDelay: 1000,
      timeout: 5000,
    },
    query: {
      enabled: true,
      cacheType: 'hybrid',
      defaultTtl: 600000, // 10分钟
      maxSize: 5000,
      enableCompression: true,
      enableEncryption: false,
      strategy: 'lru',
      retries: 3,
      retryDelay: 1000,
      timeout: 5000,
    },
    event: {
      enabled: true,
      cacheType: 'redis',
      defaultTtl: 3600000, // 1小时
      maxSize: 10000,
      enableCompression: true,
      enableEncryption: true,
      strategy: 'ttl',
      retries: 3,
      retryDelay: 1000,
      timeout: 5000,
    },
    eventStore: {
      enabled: true,
      cacheType: 'redis',
      defaultTtl: 7200000, // 2小时
      maxSize: 20000,
      enableCompression: true,
      enableEncryption: true,
      strategy: 'lru',
      retries: 3,
      retryDelay: 1000,
      timeout: 5000,
    },
    aggregate: {
      enabled: true,
      cacheType: 'hybrid',
      defaultTtl: 1800000, // 30分钟
      maxSize: 2000,
      enableCompression: false,
      enableEncryption: false,
      strategy: 'lru',
      retries: 3,
      retryDelay: 1000,
      timeout: 5000,
    },
  },
  performance: {
    enabled: true,
    interval: 30000, // 30秒
    enableMemoryMonitoring: true,
    enableCpuMonitoring: false,
  },
};
