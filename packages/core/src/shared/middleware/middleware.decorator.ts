import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import 'reflect-metadata';
import type {
  IMiddleware,
  IMiddlewareConfig,
  MiddlewareDecoratorOptions,
} from './middleware.types';

/**
 * 中间件元数据键
 */
export const MIDDLEWARE_METADATA = Symbol('MIDDLEWARE_METADATA');
export const MIDDLEWARE_CONFIG_METADATA = Symbol('MIDDLEWARE_CONFIG_METADATA');

/**
 * 中间件装饰器
 *
 * 用于标记类为中间件处理器，支持中间件的自动注册和配置。
 * 提供中间件的生命周期管理和依赖注入支持。
 *
 * @description 中间件装饰器，用于标记和配置中间件处理器
 *
 * ## 业务规则
 *
 * ### 装饰器规则
 * - 每个中间件类必须有唯一的标识符
 * - 支持中间件的配置选项设置
 * - 提供中间件的依赖注入支持
 * - 支持中间件的自动注册机制
 *
 * ### 元数据规则
 * - 自动生成中间件的唯一标识符
 * - 存储中间件的配置信息
 * - 支持中间件的元数据查询
 * - 提供中间件的类型信息
 *
 * ## 业务逻辑流程
 *
 * 1. **装饰器应用**：将装饰器应用到中间件类上
 * 2. **元数据设置**：设置中间件的元数据信息
 * 3. **配置存储**：存储中间件的配置选项
 * 4. **依赖注入**：应用依赖注入装饰器
 * 5. **自动注册**：在模块启动时自动注册中间件
 *
 * @example
 * ```typescript
 * @Middleware({
 *   name: 'LoggingMiddleware',
 *   priority: 100,
 *   config: {
 *     enableLogging: true,
 *     enablePerformanceMonitoring: true
 *   }
 * })
 * export class LoggingMiddleware implements IMiddleware {
 *   handle(request: IMiddlewareRequest, next: () => Observable<IMiddlewareResponse>) {
 *     // 中间件逻辑
 *     return next();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function Middleware(
  options: MiddlewareDecoratorOptions = {}
): ClassDecorator {
  return (target: Function) => {
    // 生成中间件的唯一标识符
    const middlewareId = options.name || target.name || randomUUID();

    // 设置中间件元数据
    Reflect.defineMetadata(
      MIDDLEWARE_METADATA,
      {
        id: middlewareId,
        name: target.name,
        target,
      },
      target
    );

    // 设置中间件配置元数据
    if (options.config) {
      Reflect.defineMetadata(
        MIDDLEWARE_CONFIG_METADATA,
        options.config,
        target
      );
    }

    // 设置优先级元数据
    if (options.priority !== undefined) {
      Reflect.defineMetadata('middleware_priority', options.priority, target);
    }

    // 应用Injectable装饰器
    if (options.autoRegister !== false) {
      Injectable()(target);
    }

    // 如果提供了日志配置，则应用
    if (options.config?.enableLogging) {
      // 可以在这里添加日志相关的配置
    }
  };
}

/**
 * 获取中间件元数据
 *
 * @description 获取指定类的中间件元数据
 * @param target 目标类
 * @returns 中间件元数据，如果不存在则返回undefined
 */
export function getMiddlewareMetadata(target: Function):
  | {
      id: string;
      name: string;
      target: Function;
    }
  | undefined {
  return Reflect.getMetadata(MIDDLEWARE_METADATA, target);
}

/**
 * 获取中间件配置
 *
 * @description 获取指定类的中间件配置
 * @param target 目标类
 * @returns 中间件配置，如果不存在则返回undefined
 */
export function getMiddlewareConfig(
  target: Function
): IMiddlewareConfig | undefined {
  return Reflect.getMetadata(MIDDLEWARE_CONFIG_METADATA, target);
}

/**
 * 获取中间件优先级
 *
 * @description 获取指定类的中间件优先级
 * @param target 目标类
 * @returns 中间件优先级，如果不存在则返回0
 */
export function getMiddlewarePriority(target: Function): number {
  return Reflect.getMetadata('middleware_priority', target) || 0;
}

/**
 * 检查是否为中间件
 *
 * @description 检查指定类是否为中间件
 * @param target 目标类
 * @returns 如果是中间件则返回true，否则返回false
 */
export function isMiddleware(target: Function): boolean {
  return Reflect.hasMetadata(MIDDLEWARE_METADATA, target);
}

/**
 * 获取所有中间件元数据
 *
 * @description 获取所有已注册的中间件元数据
 * @param targets 目标类数组
 * @returns 中间件元数据数组
 */
export function getAllMiddlewareMetadata(targets: Function[]): Array<{
  id: string;
  name: string;
  target: Function;
  priority: number;
  config?: IMiddlewareConfig;
}> {
  return targets
    .filter(isMiddleware)
    .map((target) => {
      const metadata = getMiddlewareMetadata(target);
      const config = getMiddlewareConfig(target);
      const priority = getMiddlewarePriority(target);

      if (!metadata) {
        return null;
      }

      return {
        ...metadata,
        priority,
        config,
      };
    })
    .filter(
      (metadata): metadata is NonNullable<typeof metadata> => metadata !== null
    );
}

/**
 * 中间件工厂装饰器
 *
 * @description 用于标记中间件工厂方法
 * @param name 中间件名称
 * @param priority 优先级
 * @param config 配置
 */
export function MiddlewareFactory(
  name: string,
  priority: number = 0,
  config: IMiddlewareConfig = {}
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    // 设置工厂方法元数据
    Reflect.defineMetadata(
      'middleware_factory',
      {
        name,
        priority,
        config,
        method: propertyKey,
      },
      target
    );

    return descriptor;
  };
}

/**
 * 获取中间件工厂信息
 *
 * @description 获取指定类的中间件工厂信息
 * @param target 目标类
 * @returns 中间件工厂信息，如果不存在则返回undefined
 */
export function getMiddlewareFactory(target: Function):
  | {
      name: string;
      priority: number;
      config: IMiddlewareConfig;
      method: string | symbol;
    }
  | undefined {
  return Reflect.getMetadata('middleware_factory', target);
}

/**
 * 中间件链装饰器
 *
 * @description 用于标记中间件链配置
 * @param names 中间件名称数组
 * @param config 链配置
 */
export function MiddlewareChain(
  names: string[],
  config: {
    enableGlobalLogging?: boolean;
    enableGlobalPerformanceMonitoring?: boolean;
    enableGlobalErrorHandling?: boolean;
    globalTimeout?: number;
    sortByPriority?: boolean;
  } = {}
): ClassDecorator {
  return (target: Function) => {
    // 设置中间件链元数据
    Reflect.defineMetadata(
      'middleware_chain',
      {
        names,
        config,
        target,
      },
      target
    );

    // 应用Injectable装饰器
    Injectable()(target);
  };
}

/**
 * 获取中间件链信息
 *
 * @description 获取指定类的中间件链信息
 * @param target 目标类
 * @returns 中间件链信息，如果不存在则返回undefined
 */
export function getMiddlewareChain(target: Function):
  | {
      names: string[];
      config: any;
      target: Function;
    }
  | undefined {
  return Reflect.getMetadata('middleware_chain', target);
}
