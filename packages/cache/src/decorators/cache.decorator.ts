/**
 * @file cache.decorator.ts
 * @description 缓存装饰器
 *
 * 该文件实现了基于AOP的缓存装饰器，包括：
 * - 缓存键装饰器
 * - 缓存TTL装饰器
 * - 缓存失效装饰器
 * - 缓存拦截器
 *
 * 提供声明式的缓存管理，简化缓存使用。
 */

import { SetMetadata } from '@nestjs/common';
import type { CacheOptions as ICacheOptions } from '../interfaces/cache.interface';

/**
 * @constant CACHE_KEY_METADATA
 * @description 缓存键元数据键名
 */
export const CACHE_KEY_METADATA = 'cache_key_metadata';

/**
 * @constant CACHE_TTL_METADATA
 * @description 缓存TTL元数据键名
 */
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';

/**
 * @constant CACHE_OPTIONS_METADATA
 * @description 缓存选项元数据键名
 */
export const CACHE_OPTIONS_METADATA = 'cache_options_metadata';

/**
 * @constant CACHE_EVICT_METADATA
 * @description 缓存失效元数据键名
 */
export const CACHE_EVICT_METADATA = 'cache_evict_metadata';

/**
 * @constant CACHE_EVICT_ALL_METADATA
 * @description 缓存全部失效元数据键名
 */
export const CACHE_EVICT_ALL_METADATA = 'cache_evict_all_metadata';

/**
 * @function CacheKey
 * @description 缓存键装饰器
 * @param {string | ((args: any[]) => string)} key 缓存键或键生成函数
 * @returns {Function} 装饰器函数
 */
export const CacheKey = (
  key: string | ((args: unknown[]) => string),
): MethodDecorator => SetMetadata(CACHE_KEY_METADATA, key);

/**
 * @function CacheTTL
 * @description 缓存TTL装饰器
 * @param {number} ttl 过期时间（毫秒）
 * @returns {Function} 装饰器函数
 */
export const CacheTTL = (ttl: number): MethodDecorator =>
  SetMetadata(CACHE_TTL_METADATA, ttl);

/**
 * @function CacheOptions
 * @description 缓存选项装饰器
 * @param {Partial<CacheOptions>} options 缓存选项
 * @returns {Function} 装饰器函数
 */
export const CacheOptions = (
  options: Partial<ICacheOptions>,
): MethodDecorator => SetMetadata(CACHE_OPTIONS_METADATA, options);

/**
 * @function CacheEvict
 * @description 缓存失效装饰器
 * @param {string | string[] | ((args: any[]) => string | string[])} keys 要失效的键
 * @returns {Function} 装饰器函数
 */
export const CacheEvict = (
  keys: string | string[] | ((args: unknown[]) => string | string[]),
): MethodDecorator => SetMetadata(CACHE_EVICT_METADATA, keys);

/**
 * @function CacheEvictAll
 * @description 缓存全部失效装饰器
 * @param {string} namespace 命名空间（可选）
 * @returns {Function} 装饰器函数
 */
export const CacheEvictAll = (namespace?: string): MethodDecorator =>
  SetMetadata(CACHE_EVICT_ALL_METADATA, namespace);

/**
 * @function Cacheable
 * @description 缓存装饰器组合
 * @param {string | ((args: any[]) => string)} key 缓存键
 * @param {number} ttl 过期时间（毫秒）
 * @param {Partial<CacheOptions>} options 缓存选项
 * @returns {Function} 装饰器函数
 */
export const Cacheable = (
  key: string | ((args: unknown[]) => string),
  ttl?: number,
  options?: Partial<ICacheOptions>,
) => {
  return (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    // 应用缓存键装饰器
    CacheKey(key)(target as object, propertyKey, descriptor);

    // 应用TTL装饰器（如果提供）
    if (ttl) {
      CacheTTL(ttl)(target as object, propertyKey, descriptor);
    }

    // 应用选项装饰器（如果提供）
    if (options) {
      CacheOptions(options)(target as object, propertyKey, descriptor);
    }

    return descriptor;
  };
};

/**
 * @function CacheEvictable
 * @description 缓存失效装饰器组合
 * @param {string | string[] | ((args: any[]) => string | string[])} keys 要失效的键
 * @param {string} namespace 命名空间（可选）
 * @returns {Function} 装饰器函数
 */
export const CacheEvictable = (
  keys?: string | string[] | ((args: unknown[]) => string | string[]),
  namespace?: string,
) => {
  return (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    // 应用键失效装饰器（如果提供）
    if (keys) {
      CacheEvict(keys)(target as object, propertyKey, descriptor);
    }

    // 应用全部失效装饰器（如果提供命名空间）
    if (namespace) {
      CacheEvictAll(namespace)(target as object, propertyKey, descriptor);
    }

    return descriptor;
  };
};

/**
 * @function CacheKeyPattern
 * @description 缓存键模式装饰器
 * @param {string} pattern 键模式，支持参数占位符
 * @returns {Function} 装饰器函数
 */
export const CacheKeyPattern = (pattern: string): MethodDecorator => {
  return CacheKey((args: unknown[]) => {
    // 简单的参数替换，支持 {0}, {1} 等占位符
    return pattern.replace(/\{(\d+)\}/g, (match, index) => {
      const argIndex = parseInt(index as string);
      const arg = args[argIndex];
      return arg !== undefined
        ? typeof arg === 'object' && arg !== null
          ? JSON.stringify(arg)
          : typeof arg === 'object'
            ? '[object]'
            : String(arg as string | number | boolean)
        : match;
    });
  });
};

/**
 * @function CacheKeyFromArgs
 * @description 从参数生成缓存键的装饰器
 * @param {string[]} argNames 参数名数组
 * @param {string} prefix 键前缀
 * @returns {Function} 装饰器函数
 */
export const CacheKeyFromArgs = (
  argNames: string[],
  prefix = '',
): MethodDecorator => {
  return CacheKey((args: unknown[]) => {
    const keyParts = argNames
      .map((name, index) => {
        const value = args[index];
        return value !== undefined
          ? `${name}:${typeof value === 'object' && value !== null ? JSON.stringify(value) : typeof value === 'object' ? '[object]' : String(value as string | number | boolean)}`
          : '';
      })
      .filter(part => part.length > 0);

    return prefix ? `${prefix}:${keyParts.join(':')}` : keyParts.join(':');
  });
};

/**
 * @function CacheKeyFromMethod
 * @description 从方法名和参数生成缓存键的装饰器
 * @param {string} prefix 键前缀
 * @returns {Function} 装饰器函数
 */
export const CacheKeyFromMethod = (prefix = ''): MethodDecorator => {
  return CacheKey((args: unknown[]) => {
    const argsHash =
      args.length > 0
        ? JSON.stringify(args).replace(/[^a-zA-Z0-9]/g, '_')
        : 'no_args';

    return prefix ? `${prefix}:${argsHash}` : `method:${argsHash}`;
  });
};

/**
 * @function CacheCondition
 * @description 缓存条件装饰器
 * @param {(args: any[], _result: unknown) => boolean} condition 缓存条件函数
 * @returns {Function} 装饰器函数
 */
export const CacheCondition = (
  condition: (args: unknown[], _result: unknown) => boolean,
): MethodDecorator => {
  return SetMetadata('cache_condition', condition);
};

/**
 * @function CacheUnless
 * @description 缓存排除条件装饰器
 * @param {(args: any[], _result: unknown) => boolean} condition 排除条件函数
 * @returns {Function} 装饰器函数
 */
export const CacheUnless = (
  condition: (args: unknown[], _result: unknown) => boolean,
): MethodDecorator => {
  return SetMetadata('cache_unless', condition);
};

/**
 * @function CacheSync
 * @description 同步缓存装饰器
 * @param {string | ((args: any[]) => string)} key 缓存键
 * @param {number} ttl 过期时间（毫秒）
 * @returns {Function} 装饰器函数
 */
export const CacheSync = (
  key: string | ((args: unknown[]) => string),
  ttl?: number,
) => {
  return (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = function (...args: unknown[]) {
      const cacheKey = typeof key === 'function' ? key(args) : key;
      const cacheService =
        (
          this as unknown as {
            cacheService?: unknown;
            cacheManager?: unknown;
          }
        ).cacheService ??
        (
          this as unknown as {
            cacheService?: unknown;
            cacheManager?: unknown;
          }
        ).cacheManager;

      if (!cacheService) {
        return originalMethod.apply(this, args);
      }

      // 尝试从缓存获取
      const cached = (cacheService as { get: (key: string) => unknown }).get(
        cacheKey,
      );
      if (cached !== null) {
        return cached;
      }

      // 执行原始方法
      const result = originalMethod.apply(this, args);

      // 缓存结果
      if (result !== null && result !== undefined) {
        (
          cacheService as {
            set: (
              key: string,
              value: unknown,
              options?: { ttl?: number },
            ) => void;
          }
        ).set(cacheKey, result, { ttl });
      }

      return result;
    };

    return descriptor;
  };
};
