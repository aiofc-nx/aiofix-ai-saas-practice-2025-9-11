import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CoreCacheService } from '../../services/core-cache.service';
import { PinoLoggerService, LogContext } from '@aiofix/logging';
import {
  CACHE_KEY_METADATA,
  CACHE_OPTIONS_METADATA,
  CacheDecoratorOptions,
  CacheKeyGenerator,
} from '../decorators/cache.decorator';

/**
 * Core缓存拦截器
 *
 * @description 为Core模块提供统一的缓存拦截功能，支持CQRS、事件溯源等场景的缓存需求
 *
 * ## 业务规则
 *
 * ### 缓存策略规则
 * - 命令缓存：短期缓存，避免重复执行相同命令
 * - 查询缓存：中期缓存，提高查询性能
 * - 事件缓存：长期缓存，支持事件重放和审计
 * - 聚合根缓存：中期缓存，减少数据库访问
 *
 * ### 缓存键生成规则
 * - 支持静态字符串键
 * - 支持动态键生成器
 * - 支持参数化键生成
 * - 自动添加命名空间前缀
 *
 * ### 缓存失效规则
 * - TTL过期：基于时间的自动过期
 * - 条件失效：基于业务逻辑的条件检查
 * - 手动失效：通过缓存服务手动清理
 *
 * ## 业务逻辑流程
 *
 * 1. **方法调用前**：检查缓存中是否存在结果
 * 2. **缓存命中**：直接返回缓存结果，跳过方法执行
 * 3. **缓存未命中**：执行原方法，获取结果
 * 4. **结果缓存**：将方法结果缓存到相应的缓存服务
 * 5. **缓存失效**：根据配置执行缓存失效操作
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Cacheable({
 *     key: 'user:profile',
 *     ttl: 300000,
 *     cacheType: 'query'
 *   })
 *   async getUserProfile(userId: string) {
 *     // 方法实现
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class CoreCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CoreCacheService,
    private readonly logger: PinoLoggerService,
  ) {}

  /**
   * 拦截方法调用
   *
   * @description 实现缓存拦截逻辑
   * @param context 执行上下文
   * @param next 下一个处理器
   * @returns 处理结果
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // 获取缓存配置
    const cacheOptions = this.reflector.get<CacheDecoratorOptions>(
      CACHE_OPTIONS_METADATA,
      context.getHandler(),
    );

    if (!cacheOptions || !cacheOptions.enabled) {
      return next.handle();
    }

    // 生成缓存键
    const cacheKey = await this.generateCacheKey(context, cacheOptions);
    if (!cacheKey) {
      return next.handle();
    }

    // 检查缓存条件
    if (!this.checkCacheCondition(context, cacheOptions)) {
      return next.handle();
    }

    // 获取缓存服务
    const cache = this.getCacheService(cacheOptions.cacheType);
    if (!cache) {
      return next.handle();
    }

    try {
      // 检查缓存是否存在
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult !== undefined && cachedResult !== null) {
        this.logger.debug('缓存命中', LogContext.SYSTEM, {
          cacheKey,
          cacheType: cacheOptions.cacheType,
        });
        return of(cachedResult);
      }

      // 缓存未命中，执行原方法
      this.logger.debug('缓存未命中，执行原方法', LogContext.SYSTEM, {
        cacheKey,
        cacheType: cacheOptions.cacheType,
      });

      return next.handle().pipe(
        tap(async (result) => {
          // 缓存结果
          await this.cacheResult(cache, cacheKey, result, cacheOptions);
        }),
      );
    } catch (error) {
      this.logger.error('缓存拦截器执行失败', LogContext.SYSTEM, {
        error,
        cacheKey,
        cacheType: cacheOptions.cacheType,
      });
      return next.handle();
    }
  }

  /**
   * 生成缓存键
   *
   * @description 根据配置和方法参数生成缓存键
   * @param context 执行上下文
   * @param options 缓存选项
   * @returns 缓存键
   * @private
   */
  private async generateCacheKey(
    context: ExecutionContext,
    options: CacheDecoratorOptions,
  ): Promise<string | null> {
    const cacheKeyMetadata = this.reflector.get<string | CacheKeyGenerator>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKeyMetadata) {
      // 如果没有指定缓存键，使用默认生成器
      return this.generateDefaultCacheKey(context);
    }

    if (typeof cacheKeyMetadata === 'string') {
      // 静态缓存键
      return this.resolveStaticCacheKey(cacheKeyMetadata, context);
    } else {
      // 动态缓存键生成器
      return this.executeCacheKeyGenerator(cacheKeyMetadata, context);
    }
  }

  /**
   * 生成默认缓存键
   *
   * @description 使用类名、方法名和参数生成默认缓存键
   * @param context 执行上下文
   * @returns 默认缓存键
   * @private
   */
  private generateDefaultCacheKey(context: ExecutionContext): string {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const args = context.getArgs();

    // 将参数序列化为字符串
    const argsString = args
      .map((arg) => {
        if (typeof arg === 'string' || typeof arg === 'number') {
          return String(arg);
        }
        if (typeof arg === 'object' && arg !== null) {
          return JSON.stringify(arg);
        }
        return String(arg);
      })
      .join(':');

    return `${className}:${methodName}:${argsString}`;
  }

  /**
   * 解析静态缓存键
   *
   * @description 解析包含占位符的静态缓存键
   * @param keyTemplate 缓存键模板
   * @param context 执行上下文
   * @returns 解析后的缓存键
   * @private
   */
  private resolveStaticCacheKey(
    keyTemplate: string,
    context: ExecutionContext,
  ): string {
    const args = context.getArgs();

    // 简单的参数替换
    let resolvedKey = keyTemplate;
    for (let i = 0; i < args.length; i++) {
      const placeholder = `{${i}}`;
      if (resolvedKey.includes(placeholder)) {
        resolvedKey = resolvedKey.replace(placeholder, String(args[i]));
      }
    }

    return resolvedKey;
  }

  /**
   * 执行缓存键生成器
   *
   * @description 执行动态缓存键生成器函数
   * @param generator 缓存键生成器
   * @param context 执行上下文
   * @returns 生成的缓存键
   * @private
   */
  private executeCacheKeyGenerator(
    generator: CacheKeyGenerator,
    context: ExecutionContext,
  ): string {
    const args = context.getArgs();
    return generator(...args);
  }

  /**
   * 检查缓存条件
   *
   * @description 检查是否满足缓存条件
   * @param context 执行上下文
   * @param options 缓存选项
   * @returns 是否满足缓存条件
   * @private
   */
  private checkCacheCondition(
    context: ExecutionContext,
    options: CacheDecoratorOptions,
  ): boolean {
    if (!options.condition) {
      return true;
    }

    const args = context.getArgs();
    return options.condition(...args);
  }

  /**
   * 获取缓存服务
   *
   * @description 根据缓存类型获取相应的缓存服务
   * @param cacheType 缓存类型
   * @returns 缓存服务实例
   * @private
   */
  private getCacheService(cacheType?: string): any {
    switch (cacheType) {
      case 'command':
        return this.cacheService.getCommandCache();
      case 'query':
        return this.cacheService.getQueryCache();
      case 'event':
        return this.cacheService.getEventCache();
      case 'eventStore':
        return this.cacheService.getEventStoreCache();
      case 'aggregate':
        return this.cacheService.getAggregateCache();
      default:
        return this.cacheService.getQueryCache(); // 默认使用查询缓存
    }
  }

  /**
   * 缓存结果
   *
   * @description 将方法执行结果缓存到相应的缓存服务
   * @param cache 缓存服务实例
   * @param cacheKey 缓存键
   * @param result 缓存结果
   * @param options 缓存选项
   * @private
   */
  private async cacheResult(
    cache: any,
    cacheKey: string,
    result: any,
    options: CacheDecoratorOptions,
  ): Promise<void> {
    try {
      if (options.evict) {
        // 缓存失效
        await cache.delete(cacheKey);
        this.logger.debug('缓存失效', LogContext.SYSTEM, { cacheKey });
      } else {
        // 缓存结果
        await cache.set(cacheKey, result, options.ttl);
        this.logger.debug('结果已缓存', LogContext.SYSTEM, {
          cacheKey,
          ttl: options.ttl,
        });
      }
    } catch (error) {
      this.logger.error('缓存操作失败', LogContext.SYSTEM, {
        error,
        cacheKey,
        operation: options.evict ? 'evict' : 'set',
      });
    }
  }
}
