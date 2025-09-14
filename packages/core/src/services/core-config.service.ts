import { Injectable } from '@nestjs/common';
import { ConfigService } from '@aiofix/config';
import { PinoLoggerService, LogContext } from '@aiofix/logging';
import { ICoreConfig, DEFAULT_CORE_CONFIG } from '../config/core.config';

/**
 * Core配置服务
 *
 * @description 提供Core模块的配置管理功能，从统一配置服务中获取配置
 * 并提供类型安全的配置访问接口
 *
 * ## 业务规则
 *
 * ### 配置获取规则
 * - 优先使用环境变量覆盖的配置值
 * - 其次使用配置文件中的配置值
 * - 最后使用默认配置值
 * - 所有配置在运行时只读，确保一致性
 *
 * ### 配置验证规则
 * - 验证配置值的类型和范围
 * - 对无效配置提供警告日志
 * - 确保关键配置项不为空
 * - 提供配置热重载支持
 *
 * ## 业务逻辑流程
 *
 * 1. **配置初始化**：从ConfigService获取配置并合并默认值
 * 2. **配置验证**：验证配置值的有效性
 * 3. **配置缓存**：缓存验证后的配置，提高访问性能
 * 4. **配置监听**：监听配置变更，支持热重载
 * 5. **配置访问**：提供类型安全的配置访问接口
 *
 * @example
 * ```typescript
 * // 获取中间件配置
 * const middlewareConfig = coreConfigService.getMiddlewareConfig();
 *
 * // 获取CQRS配置
 * const cqrsConfig = coreConfigService.getCqrsConfig();
 *
 * // 获取发布者配置
 * const publisherConfig = coreConfigService.getPublisherConfig();
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class CoreConfigService {
  private coreConfig!: ICoreConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLoggerService,
  ) {
    this.initializeConfig();
  }

  /**
   * 初始化配置
   *
   * @description 从ConfigService获取配置并合并默认值
   * @private
   */
  private initializeConfig(): void {
    try {
      // 从统一配置服务获取core配置
      const configFromService =
        ((this.configService as any).getConfigValue(
          'core',
        ) as Partial<ICoreConfig>) || {};

      // 合并默认配置
      this.coreConfig = this.mergeConfig(
        DEFAULT_CORE_CONFIG,
        configFromService,
      );

      // 验证配置
      this.validateConfig(this.coreConfig);

      this.logger.info('Core配置初始化成功', LogContext.CONFIG, {
        middlewareEnabled: this.coreConfig.middleware.enableLogging,
        cqrsEnabled: this.coreConfig.cqrs.eventStore.enabled,
        performanceEnabled: this.coreConfig.performance.enabled,
      });
    } catch (error) {
      this.logger.error('Core配置初始化失败，使用默认配置', LogContext.CONFIG, {
        error,
      });
      this.coreConfig = DEFAULT_CORE_CONFIG;
    }
  }

  /**
   * 合并配置
   *
   * @description 深度合并配置对象，支持嵌套对象合并
   * @param defaultConfig 默认配置
   * @param userConfig 用户配置
   * @returns 合并后的配置
   * @private
   */
  private mergeConfig<T extends Record<string, any>>(
    defaultConfig: T,
    userConfig: Partial<T>,
  ): T {
    const merged = { ...defaultConfig };

    for (const key in userConfig) {
      if (userConfig.hasOwnProperty(key)) {
        const userValue = userConfig[key];
        const defaultValue = defaultConfig[key];

        if (
          userValue &&
          typeof userValue === 'object' &&
          !Array.isArray(userValue) &&
          defaultValue &&
          typeof defaultValue === 'object' &&
          !Array.isArray(defaultValue)
        ) {
          merged[key] = this.mergeConfig(defaultValue, userValue);
        } else if (userValue !== undefined) {
          (merged as any)[key] = userValue;
        }
      }
    }

    return merged;
  }

  /**
   * 验证配置
   *
   * @description 验证配置值的有效性
   * @param config 要验证的配置
   * @private
   */
  private validateConfig(config: ICoreConfig): void {
    // 验证超时时间
    if (config.middleware.timeout <= 0 || config.middleware.timeout > 300000) {
      this.logger.warn(
        '中间件超时时间配置无效，使用默认值',
        LogContext.CONFIG,
        {
          currentTimeout: config.middleware.timeout,
          defaultTimeout: DEFAULT_CORE_CONFIG.middleware.timeout,
        },
      );
      config.middleware.timeout = DEFAULT_CORE_CONFIG.middleware.timeout;
    }

    // 验证批量大小
    if (config.publisher.batchSize <= 0 || config.publisher.batchSize > 10000) {
      this.logger.warn('批量大小配置无效，使用默认值', LogContext.CONFIG, {
        currentBatchSize: config.publisher.batchSize,
        defaultBatchSize: DEFAULT_CORE_CONFIG.publisher.batchSize,
      });
      config.publisher.batchSize = DEFAULT_CORE_CONFIG.publisher.batchSize;
    }

    // 验证重试次数
    if (config.publisher.maxRetries < 0 || config.publisher.maxRetries > 10) {
      this.logger.warn('重试次数配置无效，使用默认值', LogContext.CONFIG, {
        currentMaxRetries: config.publisher.maxRetries,
        defaultMaxRetries: DEFAULT_CORE_CONFIG.publisher.maxRetries,
      });
      config.publisher.maxRetries = DEFAULT_CORE_CONFIG.publisher.maxRetries;
    }
  }

  /**
   * 获取完整Core配置
   *
   * @description 获取完整的Core模块配置
   * @returns Core配置对象
   */
  getCoreConfig(): Readonly<ICoreConfig> {
    return Object.freeze({ ...this.coreConfig });
  }

  /**
   * 获取中间件配置
   *
   * @description 获取中间件相关配置
   * @returns 中间件配置
   */
  getMiddlewareConfig(): Readonly<ICoreConfig['middleware']> {
    return Object.freeze({ ...this.coreConfig.middleware });
  }

  /**
   * 获取CQRS配置
   *
   * @description 获取CQRS相关配置
   * @returns CQRS配置
   */
  getCqrsConfig(): Readonly<ICoreConfig['cqrs']> {
    return Object.freeze({ ...this.coreConfig.cqrs });
  }

  /**
   * 获取发布者配置
   *
   * @description 获取发布者相关配置
   * @returns 发布者配置
   */
  getPublisherConfig(): Readonly<ICoreConfig['publisher']> {
    return Object.freeze({ ...this.coreConfig.publisher });
  }

  /**
   * 获取性能监控配置
   *
   * @description 获取性能监控相关配置
   * @returns 性能监控配置
   */
  getPerformanceConfig(): Readonly<ICoreConfig['performance']> {
    return Object.freeze({ ...this.coreConfig.performance });
  }

  /**
   * 获取命令总线配置
   *
   * @description 获取命令总线特定配置
   * @returns 命令总线配置
   */
  getCommandBusConfig(): Readonly<ICoreConfig['cqrs']['commandBus']> {
    return Object.freeze({ ...this.coreConfig.cqrs.commandBus });
  }

  /**
   * 获取查询总线配置
   *
   * @description 获取查询总线特定配置
   * @returns 查询总线配置
   */
  getQueryBusConfig(): Readonly<ICoreConfig['cqrs']['queryBus']> {
    return Object.freeze({ ...this.coreConfig.cqrs.queryBus });
  }

  /**
   * 获取事件总线配置
   *
   * @description 获取事件总线特定配置
   * @returns 事件总线配置
   */
  getEventBusConfig(): Readonly<ICoreConfig['cqrs']['eventBus']> {
    return Object.freeze({ ...this.coreConfig.cqrs.eventBus });
  }

  /**
   * 获取缓存配置
   *
   * @description 获取缓存相关配置
   * @returns 缓存配置
   */
  getCacheConfig(): Readonly<ICoreConfig['cache']> {
    return Object.freeze({ ...this.coreConfig.cache });
  }

  /**
   * 获取命令缓存配置
   *
   * @description 获取命令缓存特定配置
   * @returns 命令缓存配置
   */
  getCommandCacheConfig(): Readonly<ICoreConfig['cache']['command']> {
    return Object.freeze({ ...this.coreConfig.cache.command });
  }

  /**
   * 获取查询缓存配置
   *
   * @description 获取查询缓存特定配置
   * @returns 查询缓存配置
   */
  getQueryCacheConfig(): Readonly<ICoreConfig['cache']['query']> {
    return Object.freeze({ ...this.coreConfig.cache.query });
  }

  /**
   * 获取事件缓存配置
   *
   * @description 获取事件缓存特定配置
   * @returns 事件缓存配置
   */
  getEventCacheConfig(): Readonly<ICoreConfig['cache']['event']> {
    return Object.freeze({ ...this.coreConfig.cache.event });
  }

  /**
   * 获取事件存储缓存配置
   *
   * @description 获取事件存储缓存特定配置
   * @returns 事件存储缓存配置
   */
  getEventStoreCacheConfig(): Readonly<ICoreConfig['cache']['eventStore']> {
    return Object.freeze({ ...this.coreConfig.cache.eventStore });
  }

  /**
   * 获取聚合根缓存配置
   *
   * @description 获取聚合根缓存特定配置
   * @returns 聚合根缓存配置
   */
  getAggregateCacheConfig(): Readonly<ICoreConfig['cache']['aggregate']> {
    return Object.freeze({ ...this.coreConfig.cache.aggregate });
  }

  /**
   * 重新加载配置
   *
   * @description 重新从ConfigService加载配置
   */
  reloadConfig(): void {
    this.logger.info('重新加载Core配置', LogContext.CONFIG);
    this.initializeConfig();
  }
}
