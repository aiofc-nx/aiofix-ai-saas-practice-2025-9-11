import { registerAs } from '@nestjs/config';

/**
 * Cache Configuration
 *
 * 缓存配置模块，定义IAM系统的缓存配置参数。
 * 支持Redis缓存、内存缓存、缓存管理器等配置。
 *
 * 主要原理与机制如下：
 * 1. 使用@nestjs/config的registerAs创建命名空间配置
 * 2. 从环境变量读取缓存配置参数
 * 3. 提供默认值确保配置的完整性
 * 4. 支持多环境配置（开发、测试、生产）
 *
 * 功能与业务规则：
 * 1. Redis缓存配置
 * 2. 内存缓存配置
 * 3. 缓存管理器配置
 * 4. 缓存失效配置
 * 5. 缓存键配置
 *
 * @returns 缓存配置对象
 */
export default registerAs('cache', () => ({
  /**
   * Redis缓存配置
   */
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
    retries: parseInt(process.env.REDIS_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    cluster: process.env.REDIS_CLUSTER === 'true',
    sentinel: process.env.REDIS_SENTINEL === 'true',
    sentinels: process.env.REDIS_SENTINELS
      ? JSON.parse(process.env.REDIS_SENTINELS)
      : undefined,
    name: process.env.REDIS_NAME || 'mymaster',
  },

  /**
   * 内存缓存配置
   */
  memory: {
    defaultTtl: parseInt(process.env.MEMORY_CACHE_TTL || '300000', 10), // 5分钟
    maxSize: parseInt(process.env.MEMORY_CACHE_MAX_SIZE || '1000', 10),
    cleanupInterval: parseInt(
      process.env.MEMORY_CACHE_CLEANUP_INTERVAL || '60000',
      10,
    ), // 1分钟
    enableCompression: process.env.MEMORY_CACHE_COMPRESSION === 'true',
    enableEncryption: process.env.MEMORY_CACHE_ENCRYPTION === 'true',
  },

  /**
   * 缓存管理器配置
   */
  manager: {
    enabled: process.env.CACHE_MANAGER_ENABLED !== 'false',
    defaultStrategy: process.env.CACHE_MANAGER_STRATEGY || 'LRU',
    monitoringInterval: parseInt(
      process.env.CACHE_MANAGER_MONITORING_INTERVAL || '30000',
      10,
    ),
    cleanupInterval: parseInt(
      process.env.CACHE_MANAGER_CLEANUP_INTERVAL || '60000',
      10,
    ),
    maxSize: parseInt(process.env.CACHE_MANAGER_MAX_SIZE || '10000', 10),
    enableStats: process.env.CACHE_MANAGER_STATS !== 'false',
    enableEvents: process.env.CACHE_MANAGER_EVENTS !== 'false',
  },

  /**
   * 缓存失效配置
   */
  invalidation: {
    enabled: process.env.CACHE_INVALIDATION_ENABLED !== 'false',
    defaultStrategy: process.env.CACHE_INVALIDATION_STRATEGY || 'exact',
    batchSize: parseInt(process.env.CACHE_INVALIDATION_BATCH_SIZE || '100', 10),
    concurrency: parseInt(process.env.CACHE_INVALIDATION_CONCURRENCY || '5', 10),
    timeout: parseInt(process.env.CACHE_INVALIDATION_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.CACHE_INVALIDATION_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.CACHE_INVALIDATION_RETRY_DELAY || '1000', 10),
    enableStats: process.env.CACHE_INVALIDATION_STATS !== 'false',
    enableEvents: process.env.CACHE_INVALIDATION_EVENTS !== 'false',
    monitoringInterval: parseInt(
      process.env.CACHE_INVALIDATION_MONITORING_INTERVAL || '60000',
      10,
    ),
  },

  /**
   * 缓存键配置
   */
  key: {
    defaultNamespace: process.env.CACHE_KEY_NAMESPACE || 'cache',
    separator: process.env.CACHE_KEY_SEPARATOR || ':',
    enableCompression: process.env.CACHE_KEY_COMPRESSION === 'true',
    maxKeyLength: parseInt(process.env.CACHE_KEY_MAX_LENGTH || '250', 10),
    enableValidation: process.env.CACHE_KEY_VALIDATION !== 'false',
  },

  /**
   * 缓存TTL配置
   */
  ttl: {
    userPermissions: parseInt(
      process.env.CACHE_TTL_USER_PERMISSIONS || '3600000',
      10,
    ), // 1小时
    userProfile: parseInt(process.env.CACHE_TTL_USER_PROFILE || '1800000', 10), // 30分钟
    userSessions: parseInt(process.env.CACHE_TTL_USER_SESSIONS || '7200000', 10), // 2小时
    orgTree: parseInt(process.env.CACHE_TTL_ORG_TREE || '1800000', 10), // 30分钟
    orgInfo: parseInt(process.env.CACHE_TTL_ORG_INFO || '3600000', 10), // 1小时
    tenantInfo: parseInt(process.env.CACHE_TTL_TENANT_INFO || '7200000', 10), // 2小时
    tenantConfig: parseInt(process.env.CACHE_TTL_TENANT_CONFIG || '3600000', 10), // 1小时
    rolePermissions: parseInt(
      process.env.CACHE_TTL_ROLE_PERMISSIONS || '3600000',
      10,
    ), // 1小时
    roleTemplates: parseInt(process.env.CACHE_TTL_ROLE_TEMPLATES || '86400000', 10), // 24小时
    systemConfig: parseInt(process.env.CACHE_TTL_SYSTEM_CONFIG || '86400000', 10), // 24小时
    apiRateLimit: parseInt(process.env.CACHE_TTL_API_RATE_LIMIT || '60000', 10), // 1分钟
  },

  /**
   * 缓存前缀配置
   */
  prefix: {
    user: process.env.CACHE_PREFIX_USER || 'user',
    org: process.env.CACHE_PREFIX_ORG || 'org',
    tenant: process.env.CACHE_PREFIX_TENANT || 'tenant',
    role: process.env.CACHE_PREFIX_ROLE || 'role',
    system: process.env.CACHE_PREFIX_SYSTEM || 'system',
    session: process.env.CACHE_PREFIX_SESSION || 'session',
    lock: process.env.CACHE_PREFIX_LOCK || 'lock',
  },
}));
