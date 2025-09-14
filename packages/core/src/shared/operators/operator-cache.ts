import { Injectable, Logger } from '@nestjs/common';

/**
 * 缓存项接口
 *
 * @description 定义缓存项的结构
 */
interface ICacheItem<T> {
  /** 缓存值 */
  value: T;
  /** 创建时间 */
  createdAt: Date;
  /** 过期时间 */
  expiresAt?: Date;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessedAt: Date;
}

/**
 * 操作符缓存实现
 *
 * 提供基于内存的缓存功能，支持过期时间、LRU淘汰策略等。
 * 为RxJS操作符提供缓存支持，提高性能和响应速度。
 *
 * @description 操作符缓存实现，提供高性能的缓存功能
 *
 * ## 业务规则
 *
 * ### 缓存管理规则
 * - 支持缓存项的过期时间设置
 * - 提供LRU（最近最少使用）淘汰策略
 * - 支持缓存大小限制
 * - 提供缓存统计信息
 *
 * ### 性能优化规则
 * - 使用Map数据结构提高查找性能
 * - 支持缓存预热和批量操作
 * - 提供缓存命中率统计
 * - 支持缓存压缩和优化
 *
 * ## 业务逻辑流程
 *
 * 1. **缓存设置**：设置缓存项和过期时间
 * 2. **缓存获取**：根据键获取缓存值
 * 3. **过期检查**：自动检查和处理过期项
 * 4. **淘汰策略**：当缓存满时执行LRU淘汰
 * 5. **统计更新**：更新缓存统计信息
 *
 * @example
 * ```typescript
 * // 创建缓存实例
 * const cache = new OperatorCache<string, number>({
 *   maxSize: 1000,
 *   defaultExpiry: 300000 // 5分钟
 * });
 *
 * // 设置缓存
 * cache.set('key1', 42, 60000); // 1分钟过期
 *
 * // 获取缓存
 * const value = cache.get('key1');
 * console.log(value); // 42
 *
 * // 获取统计信息
 * const stats = cache.getStats();
 * console.log('Hit rate:', stats.hitRate);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class OperatorCache<T> {
  private readonly logger = new Logger(OperatorCache.name);
  private readonly _cache = new Map<string, ICacheItem<T>>();
  private readonly _accessOrder: string[] = [];
  private _hits = 0;
  private _misses = 0;

  /**
   * 构造函数
   *
   * @param maxSize 最大缓存大小
   * @param defaultExpiry 默认过期时间（毫秒）
   */
  constructor(
    private readonly maxSize: number = 1000,
    private readonly defaultExpiry?: number
  ) {
    if (maxSize <= 0) {
      throw new Error('Cache max size must be greater than 0');
    }
  }

  /**
   * 获取缓存值
   *
   * @description 根据键获取缓存值
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期则返回undefined
   */
  get(key: string): T | undefined {
    const item = this._cache.get(key);

    if (!item) {
      this._misses++;
      return undefined;
    }

    // 检查是否过期
    if (item.expiresAt && item.expiresAt < new Date()) {
      this.delete(key);
      this._misses++;
      return undefined;
    }

    // 更新访问信息
    item.accessCount++;
    item.lastAccessedAt = new Date();

    // 更新访问顺序
    this.updateAccessOrder(key);

    this._hits++;
    return item.value;
  }

  /**
   * 设置缓存值
   *
   * @description 设置缓存项和过期时间
   * @param key 缓存键
   * @param value 缓存值
   * @param expiry 过期时间（毫秒），如果未提供则使用默认值
   */
  set(key: string, value: T, expiry?: number): void {
    const now = new Date();
    const expiresAt = expiry
      ? new Date(now.getTime() + expiry)
      : this.defaultExpiry
      ? new Date(now.getTime() + this.defaultExpiry)
      : undefined;

    const item: ICacheItem<T> = {
      value,
      createdAt: now,
      expiresAt,
      accessCount: 0,
      lastAccessedAt: now,
    };

    // 如果缓存已满，执行淘汰策略
    if (this._cache.size >= this.maxSize && !this._cache.has(key)) {
      this.evictLRU();
    }

    this._cache.set(key, item);
    this.updateAccessOrder(key);
  }

  /**
   * 删除缓存值
   *
   * @description 删除指定键的缓存项
   * @param key 缓存键
   * @returns 如果删除成功则返回true，否则返回false
   */
  delete(key: string): boolean {
    const existed = this._cache.delete(key);
    if (existed) {
      this.removeFromAccessOrder(key);
    }
    return existed;
  }

  /**
   * 清空所有缓存
   *
   * @description 清空所有缓存项和统计信息
   */
  clear(): void {
    this._cache.clear();
    this._accessOrder.length = 0;
    this._hits = 0;
    this._misses = 0;

    if (this.logger.debug) {
      this.logger.debug('Cache cleared');
    }
  }

  /**
   * 获取缓存统计信息
   *
   * @description 获取缓存的统计信息
   * @returns 缓存统计信息
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    maxSize: number;
    usageRate: number;
  } {
    const total = this._hits + this._misses;
    const hitRate = total > 0 ? this._hits / total : 0;
    const usageRate = this.maxSize > 0 ? this._cache.size / this.maxSize : 0;

    return {
      size: this._cache.size,
      hits: this._hits,
      misses: this._misses,
      hitRate,
      maxSize: this.maxSize,
      usageRate,
    };
  }

  /**
   * 检查缓存是否包含指定键
   *
   * @description 检查缓存是否包含指定键（不考虑过期）
   * @param key 缓存键
   * @returns 如果包含则返回true，否则返回false
   */
  has(key: string): boolean {
    return this._cache.has(key);
  }

  /**
   * 获取所有缓存键
   *
   * @description 获取所有缓存键的数组
   * @returns 缓存键数组
   */
  keys(): string[] {
    return Array.from(this._cache.keys());
  }

  /**
   * 获取所有缓存值
   *
   * @description 获取所有缓存值的数组
   * @returns 缓存值数组
   */
  values(): T[] {
    return Array.from(this._cache.values()).map((item) => item.value);
  }

  /**
   * 获取缓存项详情
   *
   * @description 获取指定键的缓存项详情
   * @param key 缓存键
   * @returns 缓存项详情，如果不存在则返回undefined
   */
  getItemDetails(key: string):
    | {
        value: T;
        createdAt: Date;
        expiresAt?: Date;
        accessCount: number;
        lastAccessedAt: Date;
        isExpired: boolean;
      }
    | undefined {
    const item = this._cache.get(key);
    if (!item) {
      return undefined;
    }

    const isExpired = item.expiresAt ? item.expiresAt < new Date() : false;

    return {
      value: item.value,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      accessCount: item.accessCount,
      lastAccessedAt: item.lastAccessedAt,
      isExpired,
    };
  }

  /**
   * 清理过期项
   *
   * @description 清理所有过期的缓存项
   * @returns 清理的项数量
   */
  cleanExpired(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, item] of this._cache) {
      if (item.expiresAt && item.expiresAt < now) {
        this.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && this.logger.debug) {
      this.logger.debug(`Cleaned ${cleanedCount} expired cache items`);
    }

    return cleanedCount;
  }

  /**
   * 预热缓存
   *
   * @description 批量设置缓存项
   * @param items 缓存项映射
   * @param expiry 过期时间（毫秒）
   */
  warmup(items: Record<string, T>, expiry?: number): void {
    for (const [key, value] of Object.entries(items)) {
      this.set(key, value, expiry);
    }

    if (this.logger.debug) {
      this.logger.debug(
        `Warmed up cache with ${Object.keys(items).length} items`
      );
    }
  }

  /**
   * 更新访问顺序
   *
   * @description 更新LRU访问顺序
   * @param key 缓存键
   */
  private updateAccessOrder(key: string): void {
    // 移除旧的位置
    this.removeFromAccessOrder(key);
    // 添加到末尾
    this._accessOrder.push(key);
  }

  /**
   * 从访问顺序中移除
   *
   * @description 从LRU访问顺序中移除指定键
   * @param key 缓存键
   */
  private removeFromAccessOrder(key: string): void {
    const index = this._accessOrder.indexOf(key);
    if (index > -1) {
      this._accessOrder.splice(index, 1);
    }
  }

  /**
   * 执行LRU淘汰策略
   *
   * @description 淘汰最近最少使用的缓存项
   */
  private evictLRU(): void {
    if (this._accessOrder.length === 0) {
      return;
    }

    const oldestKey = this._accessOrder.shift();
    if (oldestKey) {
      this._cache.delete(oldestKey);

      if (this.logger.debug) {
        this.logger.debug(`Evicted LRU item: ${oldestKey}`);
      }
    }
  }
}
