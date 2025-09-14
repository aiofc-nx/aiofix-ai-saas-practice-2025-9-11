import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import 'reflect-metadata';
import type { ISagaConfig, SagaDecoratorOptions } from './saga.types';

/**
 * Saga元数据键
 */
export const SAGA_METADATA = Symbol('SAGA_METADATA');
export const SAGA_CONFIG_METADATA = Symbol('SAGA_CONFIG_METADATA');

/**
 * Saga装饰器
 *
 * 用于标记类为Saga处理器，支持Saga的自动注册和配置。
 * 提供Saga的生命周期管理和依赖注入支持。
 *
 * @description Saga装饰器，用于标记和配置Saga处理器
 *
 * ## 业务规则
 *
 * ### 装饰器规则
 * - 每个Saga类必须有唯一的标识符
 * - 支持Saga的配置选项设置
 * - 提供Saga的依赖注入支持
 * - 支持Saga的自动注册机制
 *
 * ### 元数据规则
 * - 自动生成Saga的唯一标识符
 * - 存储Saga的配置信息
 * - 支持Saga的元数据查询
 * - 提供Saga的类型信息
 *
 * ## 业务逻辑流程
 *
 * 1. **装饰器应用**：将装饰器应用到Saga类上
 * 2. **元数据设置**：设置Saga的元数据信息
 * 3. **配置存储**：存储Saga的配置选项
 * 4. **依赖注入**：应用依赖注入装饰器
 * 5. **自动注册**：在模块启动时自动注册Saga
 *
 * @example
 * ```typescript
 * @Saga({
 *   name: 'UserWelcomeSaga',
 *   config: {
 *     enableLogging: true,
 *     enableMetrics: true,
 *     maxRetries: 3
 *   }
 * })
 * export class UserWelcomeSaga implements ISaga {
 *   execute(eventBus: ISagaEventBus): Observable<ICommand> {
 *     return eventBus.ofType(UserCreatedEvent).pipe(
 *       map(event => new SendWelcomeEmailCommand(event.userId))
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function Saga(options: SagaDecoratorOptions = {}): ClassDecorator {
  return (target: Function) => {
    // 生成Saga的唯一标识符
    const sagaId = options.name || target.name || randomUUID();

    // 设置Saga元数据
    Reflect.defineMetadata(
      SAGA_METADATA,
      {
        id: sagaId,
        name: target.name,
        target,
      },
      target
    );

    // 设置Saga配置元数据
    if (options.config) {
      Reflect.defineMetadata(SAGA_CONFIG_METADATA, options.config, target);
    }

    // 应用Injectable装饰器
    if (options.autoRegister !== false) {
      Injectable()(target);
    }

    // 如果提供了Injectable选项，则应用
    if (options.config?.enableLogging) {
      // 可以在这里添加日志相关的配置
    }
  };
}

/**
 * 获取Saga元数据
 *
 * @description 获取指定类的Saga元数据
 * @param target 目标类
 * @returns Saga元数据，如果不存在则返回undefined
 */
export function getSagaMetadata(target: Function):
  | {
      id: string;
      name: string;
      target: Function;
    }
  | undefined {
  return Reflect.getMetadata(SAGA_METADATA, target);
}

/**
 * 获取Saga配置
 *
 * @description 获取指定类的Saga配置
 * @param target 目标类
 * @returns Saga配置，如果不存在则返回undefined
 */
export function getSagaConfig(target: Function): ISagaConfig | undefined {
  return Reflect.getMetadata(SAGA_CONFIG_METADATA, target);
}

/**
 * 检查是否为Saga
 *
 * @description 检查指定类是否为Saga
 * @param target 目标类
 * @returns 如果是Saga则返回true，否则返回false
 */
export function isSaga(target: Function): boolean {
  return Reflect.hasMetadata(SAGA_METADATA, target);
}

/**
 * 获取所有Saga元数据
 *
 * @description 获取所有已注册的Saga元数据
 * @param targets 目标类数组
 * @returns Saga元数据数组
 */
export function getAllSagaMetadata(targets: Function[]): Array<{
  id: string;
  name: string;
  target: Function;
  config?: ISagaConfig;
}> {
  return targets
    .filter(isSaga)
    .map((target) => {
      const metadata = getSagaMetadata(target);
      const config = getSagaConfig(target);

      if (!metadata) {
        return null;
      }

      return {
        ...metadata,
        config,
      };
    })
    .filter(
      (metadata): metadata is NonNullable<typeof metadata> => metadata !== null
    );
}
