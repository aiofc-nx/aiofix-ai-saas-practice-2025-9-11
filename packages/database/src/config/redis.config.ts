import { Injectable } from '@nestjs/common';
import { ConfigService } from '@aiofix/config';
import { PinoLoggerService } from '@aiofix/logging';

/**
 * @class RedisConfig
 * @description
 * Redis配置类，负责管理Redis缓存和消息队列的配置信息。
 *
 * 配置管理职责：
 * 1. 提供Redis缓存配置
 * 2. 提供消息队列配置
 * 3. 管理连接池和性能配置
 * 4. 支持多租户缓存隔离
 *
 * 多租户支持：
 * 1. 基于租户ID的缓存键命名空间
 * 2. 租户级缓存隔离
 * 3. 租户级队列隔离
 * 4. 缓存统计和监控
 *
 * @param {ConfigService} configService 配置服务
 * @param {PinoLoggerService} logger 日志服务
 *
 * @example
 * ```typescript
 * const redisConfig = new RedisConfig(configService, logger);
 * const cacheConfig = redisConfig.getCacheConfig();
 * const queueConfig = redisConfig.getQueueConfig();
 * ```
 * @since 1.0.0
 */
@Injectable()
export class RedisConfig {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLoggerService,
  ) {}

  /**
   * @method getCacheConfig
   * @description 获取Redis缓存配置
   * @returns {object} Redis缓存配置对象
   *
   * 配置包含：
   * 1. 连接配置
   * 2. 缓存策略配置
   * 3. 性能优化配置
   * 4. 多租户支持配置
   */
  getCacheConfig() {
    return {
      // 连接配置
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: parseInt(this.configService.get('REDIS_PORT') || '6379'),
      password: this.configService.get('REDIS_PASSWORD') || '',
      db: parseInt(this.configService.get('REDIS_DB') || '0'),

      // 连接池配置
      pool: {
        min: parseInt(this.configService.get('REDIS_POOL_MIN') || '2'),
        max: parseInt(this.configService.get('REDIS_POOL_MAX') || '10'),
        idleTimeoutMillis: parseInt(
          this.configService.get('REDIS_POOL_IDLE_TIMEOUT') || '30000',
        ),
      },

      // 缓存配置
      cache: {
        ttl: parseInt(this.configService.get('CACHE_TTL') || '3600'), // 默认1小时
        maxItems: parseInt(this.configService.get('CACHE_MAX_ITEMS') || '1000'),
        checkPeriod: parseInt(
          this.configService.get('CACHE_CHECK_PERIOD') || '600',
        ), // 10分钟
      },

      // 多租户配置
      tenant: {
        keyPrefix: 'tenant:',
        namespaceSeparator: ':',
        defaultTenant: 'platform',
      },

      // 性能配置
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,

      // 集群配置（如果需要）
      cluster: {
        enabled: false,
        nodes: [],
      },
    };
  }

  /**
   * @method getQueueConfig
   * @description 获取消息队列配置
   * @returns {object} 消息队列配置对象
   *
   * 配置包含：
   * 1. Bull队列配置
   * 2. 重试和错误处理配置
   * 3. 并发和性能配置
   * 4. 监控和统计配置
   */
  getQueueConfig() {
    return {
      // Redis连接配置
      redis: {
        host: this.configService.get('BULL_REDIS_HOST') || 'localhost',
        port: parseInt(this.configService.get('BULL_REDIS_PORT') || '6379'),
        password: this.configService.get('BULL_REDIS_PASSWORD') || '',
        db: parseInt(this.configService.get('BULL_REDIS_DB') || '1'),
      },

      // 队列配置
      queue: {
        concurrency: parseInt(
          this.configService.get('QUEUE_CONCURRENCY') || '5',
        ),
        attempts: parseInt(this.configService.get('QUEUE_ATTEMPTS') || '3'),
        backoff: {
          type: 'exponential',
          delay: parseInt(
            this.configService.get('QUEUE_BACKOFF_DELAY') || '2000',
          ),
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },

      // 队列类型配置
      queues: {
        'domain-events': {
          concurrency: 10,
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
        },
        notifications: {
          concurrency: 20,
          attempts: 3,
          backoff: { type: 'fixed', delay: 1000 },
        },
        emails: {
          concurrency: 5,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
        'push-notifications': {
          concurrency: 15,
          attempts: 3,
          backoff: { type: 'fixed', delay: 2000 },
        },
        sms: {
          concurrency: 10,
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
        },
      },

      // 多租户队列配置
      tenant: {
        keyPrefix: 'queue:tenant:',
        namespaceSeparator: ':',
      },
    };
  }

  /**
   * @method getTenantCacheKey
   * @description 生成租户级缓存键
   * @param {string} tenantId 租户ID
   * @param {string} key 原始键
   * @returns {string} 租户级缓存键
   */
  getTenantCacheKey(tenantId: string, key: string): string {
    const config = this.getCacheConfig();
    return `${config.tenant.keyPrefix}${tenantId}${config.tenant.namespaceSeparator}${key}`;
  }

  /**
   * @method getTenantQueueName
   * @description 生成租户级队列名称
   * @param {string} tenantId 租户ID
   * @param {string} queueName 原始队列名称
   * @returns {string} 租户级队列名称
   */
  getTenantQueueName(tenantId: string, queueName: string): string {
    const config = this.getQueueConfig();
    return `${config.tenant.keyPrefix}${tenantId}${config.tenant.namespaceSeparator}${queueName}`;
  }

  /**
   * @method validateConfig
   * @description 验证Redis配置
   * @returns {boolean} 配置是否有效
   */
  validateConfig(): boolean {
    try {
      const cacheConfig = this.getCacheConfig();
      const queueConfig = this.getQueueConfig();

      // 验证缓存配置
      if (
        !cacheConfig.host ||
        typeof cacheConfig.port !== 'number' ||
        isNaN(cacheConfig.port) ||
        cacheConfig.port <= 0
      ) {
        this.logger.error('Redis缓存配置不完整');
        return false;
      }

      // 验证队列配置
      if (
        !queueConfig.redis.host ||
        typeof queueConfig.redis.port !== 'number' ||
        isNaN(queueConfig.redis.port) ||
        queueConfig.redis.port <= 0
      ) {
        this.logger.error('Redis队列配置不完整');
        return false;
      }

      this.logger.info('Redis配置验证通过');
      return true;
    } catch (error) {
      this.logger.error('Redis配置验证失败', undefined, {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
