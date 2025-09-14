import { Injectable } from '@nestjs/common';
import { RedisCacheService, MemoryCacheService } from '@aiofix/cache';
import { PinoLoggerService, LogContext } from '@aiofix/logging';
import { CoreConfigService } from './core-config.service';
import { ICacheConfig } from '../config/core.config';

/**
 * Core缓存服务
 *
 * @description 为Core模块提供统一的缓存管理服务，支持CQRS、事件溯源等场景的缓存需求
 *
 * ## 业务规则
 *
 * ### 缓存层级规则
 * - L1缓存：内存缓存，用于高频访问的热数据
 * - L2缓存：Redis缓存，用于跨实例共享的数据
 * - 混合缓存：根据配置自动选择最优缓存策略
 *
 * ### 缓存策略规则
 * - 命令缓存：短期缓存，避免重复执行相同命令
 * - 查询缓存：中期缓存，提高查询性能
 * - 事件缓存：长期缓存，支持事件重放和审计
 * - 聚合根缓存：中期缓存，减少数据库访问
 *
 * ### 缓存失效规则
 * - TTL过期：基于时间的自动过期
 * - LRU淘汰：最近最少使用算法
 * - 手动失效：业务逻辑触发的缓存清理
 * - 版本失效：数据版本变更时的缓存失效
 *
 * ## 业务逻辑流程
 *
 * 1. **缓存初始化**：根据配置创建不同层级的缓存服务
 * 2. **缓存策略选择**：根据业务场景选择最优缓存策略
 * 3. **缓存读写**：提供统一的缓存读写接口
 * 4. **缓存监控**：监控缓存性能和命中率
 * 5. **缓存清理**：定期清理过期和无效缓存
 *
 * @example
 * ```typescript
 * // 获取命令缓存
 * const commandCache = coreCacheService.getCommandCache();
 * await commandCache.set('cmd:123', commandData, 300000);
 *
 * // 获取查询缓存
 * const queryCache = coreCacheService.getQueryCache();
 * const result = await queryCache.get('query:user:123');
 *
 * // 获取事件缓存
 * const eventCache = coreCacheService.getEventCache();
 * await eventCache.set('event:456', eventData, 3600000);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class CoreCacheService {
  private readonly cacheServices = new Map<string, any>();

  constructor(
    private readonly redisCache: RedisCacheService,
    private readonly memoryCache: MemoryCacheService,
    private readonly configService: CoreConfigService,
    private readonly logger: PinoLoggerService,
  ) {
    this.initializeCacheServices();
  }

  /**
   * 初始化缓存服务
   *
   * @description 根据配置创建各种类型的缓存服务实例
   * @private
   */
  private initializeCacheServices(): void {
    const cacheConfig = this.configService.getCacheConfig();

    // 初始化命令缓存
    this.createCacheService('command', cacheConfig.command);

    // 初始化查询缓存
    this.createCacheService('query', cacheConfig.query);

    // 初始化事件缓存
    this.createCacheService('event', cacheConfig.event);

    // 初始化事件存储缓存
    this.createCacheService('eventStore', cacheConfig.eventStore);

    // 初始化聚合根缓存
    this.createCacheService('aggregate', cacheConfig.aggregate);

    this.logger.info('Core缓存服务初始化完成', LogContext.SYSTEM, {
      cacheTypes: Array.from(this.cacheServices.keys()),
      totalServices: this.cacheServices.size,
    });
  }

  /**
   * 创建缓存服务实例
   *
   * @description 根据配置创建特定类型的缓存服务
   * @param type 缓存类型
   * @param config 缓存配置
   * @private
   */
  private createCacheService(type: string, config: ICacheConfig): void {
    if (!config.enabled) {
      this.logger.debug(`缓存服务 ${type} 已禁用`, LogContext.SYSTEM);
      return;
    }

    try {
      // 创建缓存服务实例 - 使用工厂方法或直接使用底层缓存服务
      let cacheService: any;

      switch (config.cacheType) {
        case 'memory':
          cacheService = this.memoryCache;
          break;
        case 'redis':
          cacheService = this.redisCache;
          break;
        case 'hybrid':
          // 对于混合缓存，我们创建一个简单的包装器
          cacheService = this.createHybridCacheService(config);
          break;
        default:
          cacheService = this.memoryCache;
      }

      this.cacheServices.set(type, cacheService);

      this.logger.debug(`缓存服务 ${type} 创建成功`, LogContext.SYSTEM, {
        cacheType: config.cacheType,
        strategy: config.strategy,
        ttl: config.defaultTtl,
        maxSize: config.maxSize,
      });
    } catch (error) {
      this.logger.error(`创建缓存服务 ${type} 失败`, LogContext.SYSTEM, {
        error,
      });
    }
  }

  /**
   * 创建混合缓存服务
   *
   * @description 创建一个简单的混合缓存包装器
   * @param config 缓存配置
   * @returns 混合缓存服务实例
   * @private
   */
  private createHybridCacheService(config: ICacheConfig): any {
    return {
      async get(key: string): Promise<any> {
        // 先尝试从内存缓存获取
        try {
          const memoryResult = await this.memoryCache.get(key);
          if (memoryResult !== undefined && memoryResult !== null) {
            return memoryResult;
          }
        } catch (error) {
          this.logger.debug(
            '内存缓存获取失败，尝试Redis缓存',
            LogContext.SYSTEM,
            { error },
          );
        }

        // 从Redis缓存获取
        try {
          const redisResult = await this.redisCache.get(key);
          if (redisResult !== undefined && redisResult !== null) {
            // 将结果写回内存缓存
            await this.memoryCache.set(
              key,
              redisResult,
              Math.min(config.defaultTtl, 300000),
            );
            return redisResult;
          }
        } catch (error) {
          this.logger.error('Redis缓存获取失败', LogContext.SYSTEM, { error });
        }

        return undefined;
      },

      async set(key: string, value: any, ttl?: number): Promise<void> {
        const actualTtl = ttl || config.defaultTtl;

        // 同时写入内存和Redis缓存
        const promises = [
          this.memoryCache.set(key, value, Math.min(actualTtl, 300000)),
          this.redisCache.set(key, value, actualTtl),
        ];

        await Promise.allSettled(promises);
      },

      async delete(key: string): Promise<void> {
        // 同时从内存和Redis缓存删除
        const promises = [
          this.memoryCache.delete(key),
          this.redisCache.delete(key),
        ];

        await Promise.allSettled(promises);
      },

      async clear(): Promise<void> {
        // 清理所有缓存
        const promises = [this.memoryCache.clear(), this.redisCache.clear()];

        await Promise.allSettled(promises);
      },

      getStats(): any {
        return {
          memory: this.memoryCache.getStats(),
          redis: this.redisCache.getStats(),
        };
      },
    };
  }

  /**
   * 获取命令缓存服务
   *
   * @description 获取用于缓存命令的缓存服务
   * @returns 命令缓存服务实例
   */
  getCommandCache(): any {
    const cache = this.cacheServices.get('command');
    if (!cache) {
      throw new Error('命令缓存服务未初始化');
    }
    return cache;
  }

  /**
   * 获取查询缓存服务
   *
   * @description 获取用于缓存查询结果的缓存服务
   * @returns 查询缓存服务实例
   */
  getQueryCache(): any {
    const cache = this.cacheServices.get('query');
    if (!cache) {
      throw new Error('查询缓存服务未初始化');
    }
    return cache;
  }

  /**
   * 获取事件缓存服务
   *
   * @description 获取用于缓存事件的缓存服务
   * @returns 事件缓存服务实例
   */
  getEventCache(): any {
    const cache = this.cacheServices.get('event');
    if (!cache) {
      throw new Error('事件缓存服务未初始化');
    }
    return cache;
  }

  /**
   * 获取事件存储缓存服务
   *
   * @description 获取用于缓存事件存储的缓存服务
   * @returns 事件存储缓存服务实例
   */
  getEventStoreCache(): any {
    const cache = this.cacheServices.get('eventStore');
    if (!cache) {
      throw new Error('事件存储缓存服务未初始化');
    }
    return cache;
  }

  /**
   * 获取聚合根缓存服务
   *
   * @description 获取用于缓存聚合根的缓存服务
   * @returns 聚合根缓存服务实例
   */
  getAggregateCache(): any {
    const cache = this.cacheServices.get('aggregate');
    if (!cache) {
      throw new Error('聚合根缓存服务未初始化');
    }
    return cache;
  }

  /**
   * 获取缓存服务统计信息
   *
   * @description 获取所有缓存服务的统计信息
   * @returns 缓存统计信息
   */
  getCacheStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [type, service] of this.cacheServices) {
      try {
        stats[type] = service.getStats();
      } catch (error) {
        this.logger.warn(
          `获取缓存服务 ${type} 统计信息失败`,
          LogContext.SYSTEM,
          { error },
        );
        stats[type] = { error: (error as Error).message };
      }
    }

    return stats;
  }

  /**
   * 清理所有缓存
   *
   * @description 清理所有缓存服务中的数据
   */
  async clearAllCache(): Promise<void> {
    this.logger.info('开始清理所有缓存', LogContext.SYSTEM);

    const clearPromises = Array.from(this.cacheServices.values()).map(
      async (service) => {
        try {
          await service.clear();
        } catch (error) {
          this.logger.error('清理缓存失败', LogContext.SYSTEM, { error });
        }
      },
    );

    await Promise.all(clearPromises);

    this.logger.info('所有缓存清理完成', LogContext.SYSTEM);
  }

  /**
   * 重新加载缓存配置
   *
   * @description 重新加载缓存配置并重新初始化缓存服务
   */
  reloadCacheConfig(): void {
    this.logger.info('重新加载缓存配置', LogContext.SYSTEM);

    // 清理现有缓存服务
    this.cacheServices.clear();

    // 重新初始化
    this.initializeCacheServices();
  }

  /**
   * 获取缓存健康状态
   *
   * @description 检查所有缓存服务的健康状态
   * @returns 缓存健康状态
   */
  async getCacheHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};

    for (const [type, service] of this.cacheServices) {
      try {
        // 检查缓存服务是否可用
        const stats = service.getStats();
        health[type] = {
          status: 'healthy',
          stats,
        };
      } catch (error) {
        this.logger.warn(
          `检查缓存服务 ${type} 健康状态失败`,
          LogContext.SYSTEM,
          { error },
        );
        health[type] = {
          status: 'unhealthy',
          error: (error as Error).message,
        };
      }
    }

    return health;
  }
}
