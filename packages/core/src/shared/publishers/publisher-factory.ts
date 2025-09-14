import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '@aiofix/logging';
import { CoreConfigService } from '../../services/core-config.service';
import { CommandPublisher } from './command-publisher';
import { EventPublisher } from './event-publisher';
import { QueryPublisher } from './query-publisher';
import type { IPublisherFactory, IPublisherConfig } from './publisher.types';

/**
 * 发布者工厂
 *
 * 负责创建和管理各种类型的发布者实例。
 * 提供统一的发布者创建接口和配置管理。
 *
 * @description 发布者工厂，提供发布者的创建和管理功能
 *
 * ## 业务规则
 *
 * ### 发布者创建规则
 * - 每个发布者类型都有默认配置
 * - 支持自定义配置覆盖默认配置
 * - 提供发布者实例的缓存和复用
 * - 支持发布者的生命周期管理
 *
 * ### 配置管理规则
 * - 支持全局默认配置
 * - 支持按类型设置配置
 * - 支持实例级别的配置覆盖
 * - 提供配置的验证和合并
 *
 * ## 业务逻辑流程
 *
 * 1. **配置接收**：接收发布者配置请求
 * 2. **配置合并**：合并默认配置和自定义配置
 * 3. **发布者创建**：创建指定类型的发布者实例
 * 4. **实例缓存**：缓存发布者实例以供复用
 * 5. **生命周期管理**：管理发布者的生命周期
 *
 * @example
 * ```typescript
 * // 创建发布者工厂
 * const factory = new PublisherFactory();
 *
 * // 创建命令发布者
 * const commandPublisher = factory.createCommandPublisher({
 *   enableLogging: true,
 *   enableMetrics: true
 * });
 *
 * // 创建查询发布者
 * const queryPublisher = factory.createQueryPublisher({
 *   enableBatching: true,
 *   batchSize: 100
 * });
 *
 * // 创建事件发布者
 * const eventPublisher = factory.createEventPublisher({
 *   enableRetry: true,
 *   maxRetries: 3
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class PublisherFactory implements IPublisherFactory {
  private readonly _publishers = new Map<string, any>();
  private readonly _defaultConfigs = new Map<string, IPublisherConfig>();

  /**
   * 构造函数
   *
   * @param logger 日志服务
   * @param configService Core配置服务
   * @param defaultConfig 全局默认配置
   */
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly configService: CoreConfigService,
    defaultConfig: IPublisherConfig = {},
  ) {
    // 从配置服务获取默认配置
    const commandConfig = this.configService.getCommandBusConfig();
    const queryConfig = this.configService.getQueryBusConfig();
    const eventConfig = this.configService.getEventBusConfig();

    // 设置默认配置
    this.setDefaultConfig('command', {
      ...commandConfig,
      ...defaultConfig,
    });

    this.setDefaultConfig('query', {
      ...queryConfig,
      ...defaultConfig,
    });

    this.setDefaultConfig('event', {
      ...eventConfig,
      ...defaultConfig,
    });
  }

  /**
   * 创建命令发布者
   *
   * @description 创建命令发布者实例
   * @param config 发布者配置
   * @returns 命令发布者实例
   */
  createCommandPublisher<TCommand = any>(
    config?: IPublisherConfig,
  ): CommandPublisher<TCommand> {
    const mergedConfig = this.mergeConfig('command', config);
    const cacheKey = this.generateCacheKey('command', mergedConfig);

    // 检查缓存
    if (this._publishers.has(cacheKey)) {
      return this._publishers.get(cacheKey);
    }

    // 创建新实例
    const publisher = new CommandPublisher<TCommand>(this.logger, mergedConfig);
    this._publishers.set(cacheKey, publisher);

    return publisher;
  }

  /**
   * 创建查询发布者
   *
   * @description 创建查询发布者实例
   * @param config 发布者配置
   * @returns 查询发布者实例
   */
  createQueryPublisher<TQuery = any>(
    config?: IPublisherConfig,
  ): QueryPublisher<TQuery> {
    const mergedConfig = this.mergeConfig('query', config);
    const cacheKey = this.generateCacheKey('query', mergedConfig);

    // 检查缓存
    if (this._publishers.has(cacheKey)) {
      return this._publishers.get(cacheKey);
    }

    // 创建新实例
    const publisher = new QueryPublisher<TQuery>(this.logger, mergedConfig);
    this._publishers.set(cacheKey, publisher);

    return publisher;
  }

  /**
   * 创建事件发布者
   *
   * @description 创建事件发布者实例
   * @param config 发布者配置
   * @returns 事件发布者实例
   */
  createEventPublisher<TEvent = any>(
    config?: IPublisherConfig,
  ): EventPublisher<TEvent> {
    const mergedConfig = this.mergeConfig('event', config);
    const cacheKey = this.generateCacheKey('event', mergedConfig);

    // 检查缓存
    if (this._publishers.has(cacheKey)) {
      return this._publishers.get(cacheKey);
    }

    // 创建新实例
    const publisher = new EventPublisher<TEvent>(this.logger, mergedConfig);
    this._publishers.set(cacheKey, publisher);

    return publisher;
  }

  /**
   * 设置默认配置
   *
   * @description 为指定类型的发布者设置默认配置
   * @param type 发布者类型
   * @param config 默认配置
   */
  setDefaultConfig(type: string, config: IPublisherConfig): void {
    this._defaultConfigs.set(type, { ...config });
  }

  /**
   * 获取默认配置
   *
   * @description 获取指定类型的默认配置
   * @param type 发布者类型
   * @returns 默认配置
   */
  getDefaultConfig(type: string): IPublisherConfig | undefined {
    return this._defaultConfigs.get(type);
  }

  /**
   * 清除缓存
   *
   * @description 清除所有缓存的发布者实例
   */
  clearCache(): void {
    // 关闭所有发布者
    for (const publisher of this._publishers.values()) {
      if (publisher && typeof publisher.close === 'function') {
        publisher.close();
      }
    }

    this._publishers.clear();
  }

  /**
   * 获取缓存的发布者
   *
   * @description 获取指定类型和配置的缓存发布者
   * @param type 发布者类型
   * @param config 发布者配置
   * @returns 缓存的发布者实例，如果没有则返回undefined
   */
  getCachedPublisher(type: string, config?: IPublisherConfig): any {
    const mergedConfig = this.mergeConfig(type, config);
    const cacheKey = this.generateCacheKey(type, mergedConfig);
    return this._publishers.get(cacheKey);
  }

  /**
   * 获取所有缓存的发布者
   *
   * @description 获取所有缓存的发布者实例
   * @returns 发布者实例数组
   */
  getAllCachedPublishers(): any[] {
    return Array.from(this._publishers.values());
  }

  /**
   * 获取缓存统计信息
   *
   * @description 获取发布者缓存的统计信息
   * @returns 缓存统计信息
   */
  getCacheStats(): {
    totalCached: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};

    for (const [key] of this._publishers) {
      const type = key.split('_')[0];
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      totalCached: this._publishers.size,
      byType,
    };
  }

  /**
   * 合并配置
   *
   * @description 合并默认配置和自定义配置
   * @param type 发布者类型
   * @param config 自定义配置
   * @returns 合并后的配置
   */
  private mergeConfig(
    type: string,
    config?: IPublisherConfig,
  ): IPublisherConfig {
    const defaultConfig = this._defaultConfigs.get(type) || {};
    return {
      ...defaultConfig,
      ...config,
    };
  }

  /**
   * 生成缓存键
   *
   * @description 根据类型和配置生成缓存键
   * @param type 发布者类型
   * @param config 发布者配置
   * @returns 缓存键
   */
  private generateCacheKey(type: string, config: IPublisherConfig): string {
    const configStr = JSON.stringify(config, Object.keys(config).sort());
    return `${type}_${Buffer.from(configStr).toString('base64')}`;
  }
}
