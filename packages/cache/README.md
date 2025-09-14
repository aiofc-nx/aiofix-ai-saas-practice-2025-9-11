# @aiofix/cache

Aiofix-AI-SaaS平台的高性能缓存管理库，提供多级缓存、分布式缓存、缓存策略管理等功能。

## 特性

- 🚀 **多级缓存**: L1内存缓存 + L2 Redis缓存的层次化架构
- 🔄 **多种策略**: LRU、LFU、FIFO、TTL等缓存策略
- 🌐 **分布式缓存**: Redis集群、哨兵模式支持
- 🏢 **多租户**: 租户隔离的缓存键管理
- 📊 **监控统计**: 详细的命中率、响应时间等统计信息
- 🛡️ **并发安全**: 线程安全的并发访问控制
- 🎯 **AOP支持**: 装饰器和拦截器支持
- ⚡ **高性能**: 优化的内存管理和缓存提升机制

## 安装

```bash
pnpm add @aiofix/cache
```

## 快速开始

### 基础使用

```typescript
import { CacheModule } from '@aiofix/cache';

@Module({
  imports: [CacheModule.forRoot()],
  providers: [MyService],
})
export class AppModule {}
```

### 在服务中使用

```typescript
import { Injectable } from '@nestjs/common';
import { RedisCacheService, CacheKeyFactory } from '@aiofix/cache';

@Injectable()
export class UserService {
  constructor(
    private readonly cache: RedisCacheService,
    private readonly keyFactory: CacheKeyFactory,
  ) {}

  async getUserProfile(userId: string) {
    const key = this.keyFactory.createUser(userId, 'profile');
    let profile = await this.cache.get(key);
    
    if (!profile) {
      profile = await this.fetchUserProfile(userId);
      await this.cache.set(key, profile, { ttl: 3600000 }); // 缓存1小时
    }
    
    return profile;
  }
}
```

## 缓存架构

### 多级缓存层次

```
┌─────────────────┐
│   Application   │
└─────────┬───────┘
          │
┌─────────▼───────┐
│ Cache Manager   │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐   ┌───▼───┐
│ L1    │   │ L2    │
│Memory │   │Redis  │
│Cache  │   │Cache  │
└───────┘   └───────┘
```

### 缓存策略

#### LRU (Least Recently Used)

```typescript
await cache.set(key, value, { strategy: CacheStrategy.LRU });
```

#### LFU (Least Frequently Used)

```typescript
await cache.set(key, value, { strategy: CacheStrategy.LFU });
```

#### FIFO (First In First Out)

```typescript
await cache.set(key, value, { strategy: CacheStrategy.FIFO });
```

#### TTL (Time To Live)

```typescript
await cache.set(key, value, { strategy: CacheStrategy.TTL, ttl: 3600000 });
```

## 配置选项

### 基础配置

```typescript
CacheModule.forRoot({
  config: {
    redis: {
      host: 'localhost',
      port: 6379,
      password: 'your-password',
      db: 0,
    },
    memory: {
      defaultTtl: 3600000,
      maxSize: 10000,
      defaultStrategy: CacheStrategy.LRU,
    },
    manager: {
      enabled: true,
      monitoringInterval: 30000,
      cleanupInterval: 60000,
    },
  },
})
```

### Redis配置

```typescript
// 单机模式
const redisConfig = {
  host: 'localhost',
  port: 6379,
  password: 'password',
  db: 0,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// 集群模式
const redisConfig = {
  cluster: true,
  nodes: [
    { host: 'redis-1', port: 6379 },
    { host: 'redis-2', port: 6379 },
    { host: 'redis-3', port: 6379 },
  ],
};

// 哨兵模式
const redisConfig = {
  sentinel: true,
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
  ],
  name: 'mymaster',
};
```

### 内存缓存配置

```typescript
const memoryConfig = {
  defaultTtl: 3600000,        // 默认过期时间（毫秒）
  maxSize: 10000,             // 最大缓存项数量
  defaultStrategy: CacheStrategy.LRU, // 默认策略
  cleanupInterval: 60000,     // 清理间隔（毫秒）
  enableCompression: false,   // 是否启用压缩
  enableEncryption: false,    // 是否启用加密
};
```

## 缓存键管理

### 基础键创建

```typescript
import { CacheKeyFactory } from '@aiofix/cache';

@Injectable()
export class MyService {
  constructor(private readonly keyFactory: CacheKeyFactory) {}

  async cacheUserData(userId: string) {
    // 基础键
    const basicKey = this.keyFactory.create('user-data');
    
    // 命名空间键
    const namespaceKey = this.keyFactory.createNamespace('users', 'profile');
    
    // 租户键
    const tenantKey = this.keyFactory.createTenant('tenant-123', 'settings');
    
    // 用户键
    const userKey = this.keyFactory.createUser(userId, 'preferences');
    
    // 带标签的键
    const taggedKey = this.keyFactory.createTagged('cache-key', ['user', 'profile']);
  }
}
```

### 键解析和匹配

```typescript
// 解析键字符串
const cacheKey = this.keyFactory.parse('tenant:tenant-123:user:profile');

// 模式匹配
const pattern = this.keyFactory.createPattern('tenant:*:user:*');
const matches = this.keyFactory.matchPattern(pattern, 'tenant:123:user:456');

// 提取信息
const namespace = this.keyFactory.extractNamespace(cacheKey);
const tenantId = this.keyFactory.extractTenantId(cacheKey);
const tags = this.keyFactory.extractTags(cacheKey);
```

## AOP缓存支持

### 装饰器使用

```typescript
import { Cacheable, CacheEvict, CacheKey } from '@aiofix/cache';

@Injectable()
export class UserService {
  @Cacheable('user:profile', 3600000) // 缓存1小时
  async getUserProfile(@CacheKey() userId: string) {
    return this.userRepository.findById(userId);
  }

  @CacheEvict('user:profile')
  async updateUserProfile(@CacheKey() userId: string, profile: UserProfile) {
    return this.userRepository.update(userId, profile);
  }

  @CacheEvictAll('user:*')
  async clearUserCache() {
    // 清除所有用户相关缓存
  }
}
```

### 条件缓存

```typescript
@Injectable()
export class ProductService {
  @Cacheable('product:detail', 1800000)
  @CacheCondition((userId: string, includePrice: boolean) => !includePrice)
  async getProductDetail(userId: string, includePrice: boolean) {
    return this.productRepository.findById(userId, { includePrice });
  }

  @Cacheable('product:list', 900000)
  @CacheUnless((filters: ProductFilters) => filters.category === 'sensitive')
  async getProductList(filters: ProductFilters) {
    return this.productRepository.findByFilters(filters);
  }
}
```

### 拦截器使用

```typescript
@Injectable()
export class CacheInterceptor extends BaseCacheInterceptor {
  constructor(
    @Inject('ICacheService') private readonly cache: ICacheService,
    @Inject('ICacheKeyFactory') private readonly keyFactory: ICacheKeyFactory,
  ) {
    super();
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const key = this.keyFactory.create(`api:${request.url}`);
    
    const cached = await this.cache.get(key);
    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.cache.set(key, response, { ttl: 300000 }); // 缓存5分钟
      }),
    );
  }
}
```

## 缓存管理

### 缓存管理器

```typescript
import { CacheManagerService } from '@aiofix/cache';

@Injectable()
export class CacheService {
  constructor(private readonly cacheManager: CacheManagerService) {}

  async getFromCache<T>(key: CacheKey): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  async setToCache<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<boolean> {
    return this.cacheManager.set(key, value, options);
  }

  // 添加自定义缓存层
  addCustomLayer() {
    this.cacheManager.addLayer({
      name: 'custom-cache',
      priority: 1,
      service: this.customCacheService,
      enabled: true,
      readOnly: false,
      fallback: false,
    });
  }
}
```

### 缓存失效

```typescript
import { CacheInvalidationService } from '@aiofix/cache';

@Injectable()
export class CacheInvalidationService {
  constructor(private readonly invalidationService: CacheInvalidationService) {}

  async invalidateUserCache(userId: string) {
    // 按用户ID失效
    await this.invalidationService.invalidateByUser(userId);
    
    // 按模式失效
    await this.invalidationService.invalidateByPattern(`user:${userId}:*`);
    
    // 按标签失效
    await this.invalidationService.invalidateByTags(['user', 'profile']);
  }

  async scheduleInvalidation(key: CacheKey, delay: number) {
    const scheduleId = await this.invalidationService.scheduleInvalidation(key, delay);
    return scheduleId;
  }
}
```

### 缓存预热

```typescript
import { CacheWarmupService } from '@aiofix/cache';

@Injectable()
export class CacheWarmupService {
  constructor(private readonly warmupService: CacheWarmupService) {}

  async warmupUserProfiles() {
    const users = await this.userRepository.findAll();
    
    for (const user of users) {
      const key = this.keyFactory.createUser(user.id, 'profile');
      const profile = await this.userRepository.getProfile(user.id);
      await this.warmupService.addWarmupItem({
        key,
        value: profile,
        priority: 1,
      });
    }
    
    await this.warmupService.startWarmup();
  }
}
```

## 监控和统计

### 缓存统计

```typescript
@Injectable()
export class CacheStatsService {
  constructor(private readonly cache: RedisCacheService) {}

  async getCacheStats() {
    const stats = await this.cache.getStats();
    
    console.log(`缓存命中率: ${(stats.hitRate * 100).toFixed(2)}%`);
    console.log(`总条目数: ${stats.totalEntries}`);
    console.log(`总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`平均大小: ${(stats.averageSize / 1024).toFixed(2)} KB`);
    
    return stats;
  }
}
```

### 健康检查

```typescript
@Injectable()
export class HealthCheckService {
  constructor(private readonly cache: RedisCacheService) {}

  async checkCacheHealth() {
    const health = await this.cache.getHealth();
    
    if (!health.healthy) {
      console.error(`缓存服务不健康: ${health.error}`);
    } else {
      console.log(`缓存服务响应时间: ${health.responseTime}ms`);
    }
    
    return health;
  }
}
```

## 最佳实践

### 1. 键命名规范

```typescript
// 使用有意义的命名空间
const userKey = this.keyFactory.createNamespace('user', 'profile');
const productKey = this.keyFactory.createNamespace('product', 'detail');

// 使用租户隔离
const tenantKey = this.keyFactory.createTenant(tenantId, 'settings');

// 使用标签便于批量操作
const taggedKey = this.keyFactory.createTagged('data', ['user', 'profile', 'public']);
```

### 2. 缓存策略选择

```typescript
// 用户配置 - 使用LRU，经常访问的配置保留
await cache.set(userConfigKey, config, { 
  strategy: CacheStrategy.LRU,
  ttl: 3600000 
});

// 临时数据 - 使用TTL，自动过期
await cache.set(tempDataKey, data, { 
  strategy: CacheStrategy.TTL,
  ttl: 300000 
});

// 热点数据 - 使用LFU，频繁访问的数据优先
await cache.set(hotDataKey, data, { 
  strategy: CacheStrategy.LFU 
});
```

### 3. 缓存更新策略

```typescript
@Injectable()
export class UserService {
  async updateUserProfile(userId: string, profile: UserProfile) {
    // 先更新数据库
    const updatedProfile = await this.userRepository.update(userId, profile);
    
    // 更新缓存
    const key = this.keyFactory.createUser(userId, 'profile');
    await this.cache.set(key, updatedProfile, { ttl: 3600000 });
    
    // 失效相关缓存
    await this.invalidationService.invalidateByTags(['user', 'profile']);
    
    return updatedProfile;
  }
}
```

### 4. 错误处理

```typescript
@Injectable()
export class ResilientCacheService {
  constructor(private readonly cache: RedisCacheService) {}

  async getWithFallback<T>(key: CacheKey, fallback: () => Promise<T>): Promise<T> {
    try {
      const cached = await this.cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      console.warn('缓存读取失败，使用后备方案:', error);
    }
    
    // 缓存未命中或读取失败，使用后备方案
    const result = await fallback();
    
    try {
      await this.cache.set(key, result, { ttl: 1800000 });
    } catch (error) {
      console.warn('缓存写入失败:', error);
    }
    
    return result;
  }
}
```

### 5. 性能优化

```typescript
@Injectable()
export class OptimizedCacheService {
  constructor(private readonly cacheManager: CacheManagerService) {}

  async batchGet<T>(keys: CacheKey[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    // 并发获取所有键
    const promises = keys.map(async (key) => {
      const keyString = this.keyFactory.toString(key);
      const value = await this.cacheManager.get<T>(key);
      return { keyString, value };
    });
    
    const resolved = await Promise.all(promises);
    
    for (const { keyString, value } of resolved) {
      results.set(keyString, value);
    }
    
    return results;
  }

  async batchSet<T>(entries: Array<{ key: CacheKey; value: T; options?: CacheOptions }>): Promise<boolean[]> {
    // 并发设置所有键值对
    const promises = entries.map(({ key, value, options }) =>
      this.cacheManager.set(key, value, options)
    );
    
    return Promise.all(promises);
  }
}
```

## 测试支持

### 单元测试

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService, CacheKeyFactory } from '@aiofix/cache';

describe('UserService', () => {
  let service: UserService;
  let cache: RedisCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: RedisCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CacheKeyFactory,
          useValue: {
            createUser: jest.fn(),
            toString: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    cache = module.get<RedisCacheService>(RedisCacheService);
  });

  it('should cache user profile', async () => {
    const userId = 'user-123';
    const profile = { id: userId, name: 'John Doe' };
    
    (cache.get as jest.Mock).mockResolvedValue(null);
    (cache.set as jest.Mock).mockResolvedValue(true);
    
    const result = await service.getUserProfile(userId);
    
    expect(cache.get).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledWith(expect.any(Object), profile, expect.any(Object));
    expect(result).toEqual(profile);
  });
});
```

### 集成测试

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@aiofix/cache';

describe('Cache Integration', () => {
  let module: TestingModule;
  let cacheService: RedisCacheService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        CacheModule.forRoot({
          config: {
            redis: {
              host: 'localhost',
              port: 6379,
              db: 1, // 使用测试数据库
            },
          },
        }),
      ],
    }).compile();

    cacheService = module.get<RedisCacheService>(RedisCacheService);
  });

  afterAll(async () => {
    await cacheService.clear(); // 清理测试数据
    await module.close();
  });

  it('should store and retrieve data', async () => {
    const key = { key: 'test-key' };
    const value = { message: 'Hello World' };
    
    await cacheService.set(key, value);
    const retrieved = await cacheService.get(key);
    
    expect(retrieved).toEqual(value);
  });
});
```

## 环境变量配置

```bash
# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0

# 缓存配置
CACHE_DEFAULT_TTL=3600000
CACHE_MAX_SIZE=10000
CACHE_CLEANUP_INTERVAL=60000
CACHE_MONITORING_INTERVAL=30000

# 集群配置
REDIS_CLUSTER_ENABLED=false
REDIS_SENTINEL_ENABLED=false
REDIS_SENTINEL_NAME=mymaster
```

## 许可证

MIT License
