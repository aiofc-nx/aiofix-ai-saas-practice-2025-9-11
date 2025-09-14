import { Injectable, Logger } from '@nestjs/common';
import { MiddlewareChain } from './middleware-chain';
import type {
  IMiddlewareManager,
  IMiddleware,
  IMiddlewareConfig,
  IMiddlewareChain,
  IMiddlewareChainConfig,
  IMiddlewareStats,
} from './middleware.types';

/**
 * 中间件管理器
 *
 * 负责管理所有中间件的注册、配置和执行。
 * 提供中间件的统一管理和中间件链的创建功能。
 *
 * @description 中间件管理器，提供中间件的统一管理功能
 *
 * ## 业务规则
 *
 * ### 中间件管理规则
 * - 支持中间件的注册和注销
 * - 提供中间件的配置管理
 * - 支持中间件链的创建和管理
 * - 提供中间件的统计和监控
 *
 * ### 中间件链规则
 * - 支持动态创建中间件链
 * - 提供中间件链的配置管理
 * - 支持中间件链的执行和监控
 * - 提供中间件链的统计信息
 *
 * ## 业务逻辑流程
 *
 * 1. **中间件注册**：注册中间件实例和配置
 * 2. **中间件管理**：管理中间件的生命周期
 * 3. **链创建**：根据需求创建中间件链
 * 4. **链执行**：执行中间件链处理请求
 * 5. **统计监控**：收集和管理统计信息
 *
 * @example
 * ```typescript
 * // 创建中间件管理器
 * const manager = new MiddlewareManager();
 *
 * // 注册中间件
 * manager.registerMiddleware(new LoggingMiddleware(), {
 *   enableLogging: true
 * });
 * manager.registerMiddleware(new MetricsMiddleware(), {
 *   enableMetrics: true
 * });
 *
 * // 创建中间件链
 * const chain = manager.createChain(['LoggingMiddleware', 'MetricsMiddleware'], {
 *   enableGlobalLogging: true
 * });
 *
 * // 执行中间件链
 * const response = await chain.execute(request);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class MiddlewareManager implements IMiddlewareManager {
  private readonly logger = new Logger(MiddlewareManager.name);
  private readonly _middlewares = new Map<
    string,
    { middleware: IMiddleware; config: IMiddlewareConfig }
  >();
  private readonly _chains = new Map<string, IMiddlewareChain>();
  private readonly _globalStats: IMiddlewareStats = {
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
    averageProcessingTime: 0,
    maxProcessingTime: 0,
    minProcessingTime: Infinity,
    middlewareStats: {},
    lastUpdated: new Date(),
  };

  /**
   * 注册中间件
   *
   * @description 注册中间件实例和配置
   * @param middleware 中间件实例
   * @param config 中间件配置
   */
  registerMiddleware(
    middleware: IMiddleware,
    config: IMiddlewareConfig = {}
  ): void {
    const name = middleware.name;

    if (this._middlewares.has(name)) {
      this.logger.warn(`Middleware already registered: ${name}`);
      return;
    }

    // 设置默认配置
    const defaultConfig: IMiddlewareConfig = {
      enabled: true,
      enableLogging: false,
      enablePerformanceMonitoring: false,
      enableErrorHandling: true,
      timeout: 30000,
      retryCount: 0,
      retryDelay: 1000,
      ...config,
    };

    this._middlewares.set(name, { middleware, config: defaultConfig });

    // 初始化中间件统计
    this._globalStats.middlewareStats[name] = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageTime: 0,
      lastUsed: new Date(),
    };

    this.logger.debug(`Registered middleware: ${name}`);
  }

  /**
   * 注销中间件
   *
   * @description 注销指定名称的中间件
   * @param name 中间件名称
   */
  unregisterMiddleware(name: string): void {
    const existed = this._middlewares.delete(name);

    if (existed) {
      // 从统计中移除
      delete this._globalStats.middlewareStats[name];

      // 从所有链中移除该中间件
      for (const chain of this._chains.values()) {
        chain.removeMiddleware(name);
      }

      this.logger.debug(`Unregistered middleware: ${name}`);
    } else {
      this.logger.warn(`Middleware not found: ${name}`);
    }
  }

  /**
   * 创建中间件链
   *
   * @description 根据中间件名称列表创建中间件链
   * @param names 中间件名称数组
   * @param config 链配置
   * @returns 中间件链
   */
  createChain(
    names: string[],
    config: IMiddlewareChainConfig = {}
  ): IMiddlewareChain {
    const chainName = names.join('_');

    // 检查是否已存在同名链
    if (this._chains.has(chainName)) {
      this.logger.debug(`Returning existing chain: ${chainName}`);
      return this._chains.get(chainName)!;
    }

    // 创建新的中间件链
    const chain = new MiddlewareChain(config);

    // 添加中间件到链中
    for (const name of names) {
      const middlewareInfo = this._middlewares.get(name);

      if (middlewareInfo) {
        chain.addMiddleware(middlewareInfo.middleware);
      } else {
        this.logger.warn(`Middleware not found for chain: ${name}`);
      }
    }

    // 缓存链
    this._chains.set(chainName, chain);

    this.logger.debug(
      `Created middleware chain: ${chainName} with ${names.length} middlewares`
    );

    return chain;
  }

  /**
   * 获取所有注册的中间件
   *
   * @description 获取所有已注册的中间件信息
   * @returns 中间件映射
   */
  getAllMiddlewares(): Map<
    string,
    { middleware: IMiddleware; config: IMiddlewareConfig }
  > {
    return new Map(this._middlewares);
  }

  /**
   * 获取中间件
   *
   * @description 获取指定名称的中间件信息
   * @param name 中间件名称
   * @returns 中间件信息，如果不存在则返回undefined
   */
  getMiddleware(
    name: string
  ): { middleware: IMiddleware; config: IMiddlewareConfig } | undefined {
    return this._middlewares.get(name);
  }

  /**
   * 获取中间件链
   *
   * @description 获取指定名称的中间件链
   * @param name 链名称
   * @returns 中间件链，如果不存在则返回undefined
   */
  getChain(name: string): IMiddlewareChain | undefined {
    return this._chains.get(name);
  }

  /**
   * 获取所有中间件链
   *
   * @description 获取所有已创建的中间件链
   * @returns 中间件链映射
   */
  getAllChains(): Map<string, IMiddlewareChain> {
    return new Map(this._chains);
  }

  /**
   * 获取中间件统计信息
   *
   * @description 获取全局中间件统计信息
   * @returns 统计信息
   */
  getStats(): IMiddlewareStats {
    // 更新全局统计信息
    this.updateGlobalStats();

    return {
      ...this._globalStats,
      middlewareStats: { ...this._globalStats.middlewareStats },
    };
  }

  /**
   * 更新全局统计信息
   *
   * @description 更新全局统计信息
   */
  private updateGlobalStats(): void {
    let totalRequests = 0;
    let successRequests = 0;
    let errorRequests = 0;
    let totalProcessingTime = 0;
    let maxProcessingTime = 0;
    let minProcessingTime = Infinity;

    // 收集所有中间件的统计信息
    for (const [name, middlewareInfo] of this._middlewares) {
      const middlewareStats = middlewareInfo.middleware.getStats?.();

      if (middlewareStats) {
        totalRequests += middlewareStats.requestCount;
        successRequests += middlewareStats.successCount;
        errorRequests += middlewareStats.errorCount;
        totalProcessingTime +=
          middlewareStats.averageProcessingTime * middlewareStats.requestCount;
        maxProcessingTime = Math.max(
          maxProcessingTime,
          middlewareStats.maxProcessingTime || 0
        );
        minProcessingTime = Math.min(
          minProcessingTime,
          middlewareStats.minProcessingTime || Infinity
        );

        // 更新中间件统计
        this._globalStats.middlewareStats[name] = {
          requestCount: middlewareStats.requestCount,
          successCount: middlewareStats.successCount,
          errorCount: middlewareStats.errorCount,
          averageTime: middlewareStats.averageProcessingTime,
          lastUsed: middlewareStats.lastUsed,
        };
      }
    }

    // 更新全局统计
    this._globalStats.totalRequests = totalRequests;
    this._globalStats.successRequests = successRequests;
    this._globalStats.errorRequests = errorRequests;
    this._globalStats.averageProcessingTime =
      totalRequests > 0 ? totalProcessingTime / totalRequests : 0;
    this._globalStats.maxProcessingTime = maxProcessingTime;
    this._globalStats.minProcessingTime =
      minProcessingTime === Infinity ? 0 : minProcessingTime;
    this._globalStats.lastUpdated = new Date();
  }

  /**
   * 清除所有统计信息
   *
   * @description 清除所有中间件和链的统计信息
   */
  clearAllStats(): void {
    // 清除中间件统计
    for (const middlewareInfo of this._middlewares.values()) {
      if (middlewareInfo.middleware.resetStats) {
        middlewareInfo.middleware.resetStats();
      }
    }

    // 清除链统计
    for (const chain of this._chains.values()) {
      if (chain.clearStats) {
        chain.clearStats();
      }
    }

    // 重置全局统计
    this._globalStats.totalRequests = 0;
    this._globalStats.successRequests = 0;
    this._globalStats.errorRequests = 0;
    this._globalStats.averageProcessingTime = 0;
    this._globalStats.maxProcessingTime = 0;
    this._globalStats.minProcessingTime = Infinity;
    this._globalStats.middlewareStats = {};
    this._globalStats.lastUpdated = new Date();

    this.logger.debug('All stats cleared');
  }

  /**
   * 获取中间件数量
   *
   * @description 获取已注册的中间件数量
   * @returns 中间件数量
   */
  getMiddlewareCount(): number {
    return this._middlewares.size;
  }

  /**
   * 获取中间件链数量
   *
   * @description 获取已创建的中间件链数量
   * @returns 中间件链数量
   */
  getChainCount(): number {
    return this._chains.size;
  }

  /**
   * 检查中间件是否存在
   *
   * @description 检查指定名称的中间件是否存在
   * @param name 中间件名称
   * @returns 是否存在
   */
  hasMiddleware(name: string): boolean {
    return this._middlewares.has(name);
  }

  /**
   * 检查中间件链是否存在
   *
   * @description 检查指定名称的中间件链是否存在
   * @param name 链名称
   * @returns 是否存在
   */
  hasChain(name: string): boolean {
    return this._chains.has(name);
  }

  /**
   * 获取中间件名称列表
   *
   * @description 获取所有已注册的中间件名称列表
   * @returns 中间件名称列表
   */
  getMiddlewareNames(): string[] {
    return Array.from(this._middlewares.keys());
  }

  /**
   * 获取中间件链名称列表
   *
   * @description 获取所有已创建的中间件链名称列表
   * @returns 中间件链名称列表
   */
  getChainNames(): string[] {
    return Array.from(this._chains.keys());
  }

  /**
   * 清除所有中间件和链
   *
   * @description 清除所有已注册的中间件和已创建的链
   */
  clearAll(): void {
    this._middlewares.clear();
    this._chains.clear();
    this.clearAllStats();

    this.logger.debug('All middlewares and chains cleared');
  }
}
