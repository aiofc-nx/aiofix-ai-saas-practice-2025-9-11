import { SetMetadata } from '@nestjs/common';

/**
 * 缓存键生成器类型
 */
export type CacheKeyGenerator = (...args: any[]) => string;

/**
 * 缓存条件检查器类型
 */
export type CacheConditionChecker = (...args: any[]) => boolean;

/**
 * 缓存配置接口
 */
export interface CacheDecoratorOptions {
  /** 缓存键 */
  key?: string | CacheKeyGenerator;
  /** 缓存TTL（毫秒） */
  ttl?: number;
  /** 缓存类型 */
  cacheType?: 'command' | 'query' | 'event' | 'eventStore' | 'aggregate';
  /** 是否启用缓存 */
  enabled?: boolean;
  /** 缓存条件 */
  condition?: CacheConditionChecker;
  /** 缓存标签 */
  tags?: string[];
  /** 是否异步 */
  async?: boolean;
  /** 是否失效缓存 */
  evict?: boolean;
  /** 是否更新缓存 */
  put?: boolean;
}

/**
 * 缓存键元数据键
 */
export const CACHE_KEY_METADATA = 'cache:key';

/**
 * 缓存选项元数据键
 */
export const CACHE_OPTIONS_METADATA = 'cache:options';

/**
 * 缓存装饰器
 *
 * @description 为方法添加缓存功能，支持多种缓存策略和配置
 *
 * ## 业务规则
 *
 * ### 缓存键规则
 * - 支持静态字符串键
 * - 支持动态键生成器
 * - 支持参数化键生成
 * - 自动添加命名空间前缀
 *
 * ### 缓存策略规则
 * - 命令缓存：短期缓存，避免重复执行
 * - 查询缓存：中期缓存，提高查询性能
 * - 事件缓存：长期缓存，支持事件重放
 * - 聚合根缓存：中期缓存，减少数据库访问
 *
 * ### 缓存失效规则
 * - TTL过期：基于时间的自动过期
 * - 条件失效：基于业务逻辑的条件检查
 * - 手动失效：通过缓存服务手动清理
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Cacheable({
 *     key: 'user:profile',
 *     ttl: 300000, // 5分钟
 *     cacheType: 'query'
 *   })
 *   async getUserProfile(userId: string) {
 *     // 查询用户资料
 *   }
 *
 *   @Cacheable({
 *     key: (userId: string) => `user:commands:${userId}`,
 *     ttl: 60000, // 1分钟
 *     cacheType: 'command',
 *     condition: (userId: string) => userId !== 'admin'
 *   })
 *   async executeUserCommand(userId: string, command: any) {
 *     // 执行用户命令
 *   }
 * }
 * ```
 *
 * @param options 缓存配置选项
 * @returns 方法装饰器
 *
 * @since 1.0.0
 */
export function Cacheable(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // 设置缓存键元数据
    if (options.key) {
      SetMetadata(CACHE_KEY_METADATA, options.key)(
        target,
        propertyKey,
        descriptor,
      );
    }

    // 设置缓存选项元数据
    SetMetadata(CACHE_OPTIONS_METADATA, {
      ttl: options.ttl || 300000, // 默认5分钟
      cacheType: options.cacheType || 'query',
      enabled: options.enabled !== false,
      condition: options.condition,
      tags: options.tags || [],
      async: options.async !== false,
      ...options,
    })(target, propertyKey, descriptor);

    return descriptor;
  };
}

/**
 * 缓存失效装饰器
 *
 * @description 标记方法执行后需要失效指定的缓存
 *
 * @example
 * ```typescript
 * class UserService {
 *   @CacheEvict({
 *     key: 'user:profile',
 *     cacheType: 'query'
 *   })
 *   async updateUserProfile(userId: string, profile: any) {
 *     // 更新用户资料，失效相关缓存
 *   }
 * }
 * ```
 *
 * @param options 缓存失效配置选项
 * @returns 方法装饰器
 *
 * @since 1.0.0
 */
export function CacheEvict(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    SetMetadata(CACHE_OPTIONS_METADATA, {
      evict: true,
      ttl: 0, // 失效缓存
      cacheType: options.cacheType || 'query',
      enabled: options.enabled !== false,
      condition: options.condition,
      tags: options.tags || [],
      ...options,
    })(target, propertyKey, descriptor);

    return descriptor;
  };
}

/**
 * 缓存更新装饰器
 *
 * @description 标记方法执行后需要更新指定的缓存
 *
 * @example
 * ```typescript
 * class UserService {
 *   @CachePut({
 *     key: 'user:profile',
 *     ttl: 300000,
 *     cacheType: 'query'
 *   })
 *   async updateUserProfile(userId: string, profile: any) {
 *     // 更新用户资料，同时更新缓存
 *   }
 * }
 * ```
 *
 * @param options 缓存更新配置选项
 * @returns 方法装饰器
 *
 * @since 1.0.0
 */
export function CachePut(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    SetMetadata(CACHE_OPTIONS_METADATA, {
      put: true,
      ttl: options.ttl || 300000,
      cacheType: options.cacheType || 'query',
      enabled: options.enabled !== false,
      condition: options.condition,
      tags: options.tags || [],
      ...options,
    })(target, propertyKey, descriptor);

    return descriptor;
  };
}

/**
 * 缓存键装饰器
 *
 * @description 为参数添加缓存键信息
 *
 * @example
 * ```typescript
 * class UserService {
 *   async getUserProfile(@CacheKey() userId: string) {
 *     // userId 将作为缓存键的一部分
 *   }
 * }
 * ```
 *
 * @param key 缓存键名称
 * @returns 参数装饰器
 *
 * @since 1.0.0
 */
export function CacheKey(key?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingKeys =
      Reflect.getMetadata('cache:key:param', target, propertyKey) || {};

    Reflect.defineMetadata(
      'cache:key:param',
      {
        ...existingKeys,
        [parameterIndex]: {
          index: parameterIndex,
          key: key || `param_${parameterIndex}`,
        },
      },
      target,
      propertyKey,
    );
  };
}

/**
 * 缓存条件装饰器
 *
 * @description 为参数添加缓存条件信息
 *
 * @example
 * ```typescript
 * class UserService {
 *   async getUserProfile(
 *     @CacheKey() userId: string,
 *     @CacheCondition() includeSensitive: boolean
 *   ) {
 *     // includeSensitive 将用于缓存条件检查
 *   }
 * }
 * ```
 *
 * @param condition 条件检查器
 * @returns 参数装饰器
 *
 * @since 1.0.0
 */
export function CacheCondition(condition?: CacheConditionChecker) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingConditions =
      Reflect.getMetadata('cache:condition:param', target, propertyKey) || {};

    Reflect.defineMetadata(
      'cache:condition:param',
      {
        ...existingConditions,
        [parameterIndex]: {
          index: parameterIndex,
          condition: condition || ((value: any) => !!value),
        },
      },
      target,
      propertyKey,
    );
  };
}

/**
 * 缓存标签装饰器
 *
 * @description 为参数添加缓存标签信息
 *
 * @example
 * ```typescript
 * class UserService {
 *   async getUserProfile(
 *     @CacheKey() userId: string,
 *     @CacheTag('user') @CacheTag('profile') type: string
 *   ) {
 *     // type 参数将添加 'user' 和 'profile' 标签
 *   }
 * }
 * ```
 *
 * @param tag 缓存标签
 * @returns 参数装饰器
 *
 * @since 1.0.0
 */
export function CacheTag(tag: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingTags =
      Reflect.getMetadata('cache:tags:param', target, propertyKey) || {};
    const paramTags = existingTags[parameterIndex] || [];

    Reflect.defineMetadata(
      'cache:tags:param',
      {
        ...existingTags,
        [parameterIndex]: [...paramTags, tag],
      },
      target,
      propertyKey,
    );
  };
}
