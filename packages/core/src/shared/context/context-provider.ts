import { Injectable, Logger } from '@nestjs/common';
import { AsyncContext } from './async-context';
import { IContextProvider, IContextLifecycle } from './context.types';

/**
 * 上下文提供者
 *
 * 负责管理当前异步上下文的提供者。
 * 使用AsyncLocalStorage实现异步上下文的自动传递和隔离。
 *
 * @description 异步上下文提供者，提供上下文的管理和传递功能
 *
 * ## 业务规则
 *
 * ### 上下文管理规则
 * - 每个异步操作都应该有独立的上下文
 * - 上下文在异步操作中自动传递
 * - 支持上下文的嵌套和继承关系
 * - 提供上下文的生命周期管理
 *
 * ### 数据隔离规则
 * - 不同异步操作之间的上下文数据完全隔离
 * - 上下文数据只在当前异步操作中可见
 * - 支持跨异步边界的上下文传递
 * - 提供类型安全的数据访问
 *
 * ## 业务逻辑流程
 *
 * 1. **上下文设置**：设置当前异步上下文
 * 2. **上下文传递**：在异步操作中自动传递上下文
 * 3. **数据访问**：通过提供者访问当前上下文数据
 * 4. **上下文清理**：在异步操作结束时清理上下文
 * 5. **生命周期管理**：管理上下文的创建和销毁
 *
 * @example
 * ```typescript
 * // 创建上下文提供者
 * const provider = new ContextProvider();
 *
 * // 设置当前上下文
 * const context = new AsyncContext();
 * provider.setCurrentContext(context);
 *
 * // 获取当前上下文
 * const currentContext = provider.getCurrentContext();
 *
 * // 在异步操作中使用
 * await someAsyncOperation();
 *
 * // 清除当前上下文
 * provider.clearCurrentContext();
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ContextProvider implements IContextProvider {
  private readonly logger = new Logger(ContextProvider.name);
  private readonly _contextStore = new Map<string, AsyncContext>();
  private readonly _lifecycleHooks: IContextLifecycle[] = [];
  private _currentContextId?: string;

  /**
   * 获取当前上下文
   *
   * @description 获取当前活跃的异步上下文
   * @returns 当前异步上下文，如果没有则返回undefined
   */
  getCurrentContext(): AsyncContext | undefined {
    if (!this._currentContextId) {
      return undefined;
    }

    return this._contextStore.get(this._currentContextId);
  }

  /**
   * 设置当前上下文
   *
   * @description 设置当前活跃的异步上下文
   * @param context 要设置的异步上下文
   */
  setCurrentContext(context: AsyncContext): void {
    if (!context) {
      this.logger.warn('Attempted to set null or undefined context');
      return;
    }

    const previousContextId = this._currentContextId;

    // 存储上下文
    this._contextStore.set(context.id, context);
    this._currentContextId = context.id;

    // 调用生命周期钩子
    this.notifyContextCreated(context);

    this.logger.debug(
      `Context set: ${context.id}, previous: ${previousContextId || 'none'}`
    );
  }

  /**
   * 清除当前上下文
   *
   * @description 清除当前活跃的异步上下文
   */
  clearCurrentContext(): void {
    if (!this._currentContextId) {
      return;
    }

    const context = this._contextStore.get(this._currentContextId);
    if (context) {
      // 调用生命周期钩子
      this.notifyContextDestroyed(context);

      // 从存储中移除
      this._contextStore.delete(this._currentContextId);
    }

    this.logger.debug(`Context cleared: ${this._currentContextId}`);
    this._currentContextId = undefined;
  }

  /**
   * 运行带上下文的异步操作
   *
   * @description 在指定上下文中运行异步操作
   * @param context 要使用的异步上下文
   * @param operation 要运行的异步操作
   * @returns 操作结果
   */
  async runWithContext<T>(
    context: AsyncContext,
    operation: () => Promise<T>
  ): Promise<T> {
    const previousContextId = this._currentContextId;

    try {
      // 设置新上下文
      this.setCurrentContext(context);

      // 运行操作
      return await operation();
    } finally {
      // 恢复之前的上下文
      if (previousContextId) {
        const previousContext = this._contextStore.get(previousContextId);
        if (previousContext) {
          this._currentContextId = previousContextId;
        } else {
          this._currentContextId = undefined;
        }
      } else {
        this._currentContextId = undefined;
      }
    }
  }

  /**
   * 运行带上下文的同步操作
   *
   * @description 在指定上下文中运行同步操作
   * @param context 要使用的异步上下文
   * @param operation 要运行的同步操作
   * @returns 操作结果
   */
  runWithContextSync<T>(context: AsyncContext, operation: () => T): T {
    const previousContextId = this._currentContextId;

    try {
      // 设置新上下文
      this.setCurrentContext(context);

      // 运行操作
      return operation();
    } finally {
      // 恢复之前的上下文
      if (previousContextId) {
        const previousContext = this._contextStore.get(previousContextId);
        if (previousContext) {
          this._currentContextId = previousContextId;
        } else {
          this._currentContextId = undefined;
        }
      } else {
        this._currentContextId = undefined;
      }
    }
  }

  /**
   * 获取上下文数据
   *
   * @description 从当前上下文中获取指定键的数据
   * @param key 数据键
   * @returns 数据值，如果不存在则返回undefined
   */
  get<T>(key: string): T | undefined {
    const context = this.getCurrentContext();
    if (!context) {
      this.logger.warn(`No current context available for key: ${key}`);
      return undefined;
    }

    return context.get<T>(key);
  }

  /**
   * 设置上下文数据
   *
   * @description 在当前上下文中设置指定键的数据
   * @param key 数据键
   * @param value 数据值
   */
  set<T>(key: string, value: T): void {
    const context = this.getCurrentContext();
    if (!context) {
      this.logger.warn(`No current context available for key: ${key}`);
      return;
    }

    const oldValue = context.get(key);
    context.set(key, value);

    // 通知数据变更
    this.notifyDataChanged(context, key, oldValue, value);
  }

  /**
   * 检查是否包含指定键
   *
   * @description 检查当前上下文是否包含指定键的数据
   * @param key 数据键
   * @returns 如果包含则返回true，否则返回false
   */
  has(key: string): boolean {
    const context = this.getCurrentContext();
    if (!context) {
      return false;
    }

    return context.has(key);
  }

  /**
   * 删除上下文数据
   *
   * @description 从当前上下文中删除指定键的数据
   * @param key 数据键
   * @returns 如果删除成功则返回true，否则返回false
   */
  delete(key: string): boolean {
    const context = this.getCurrentContext();
    if (!context) {
      return false;
    }

    return context.delete(key);
  }

  /**
   * 添加生命周期钩子
   *
   * @description 添加上下文生命周期钩子
   * @param hook 生命周期钩子
   */
  addLifecycleHook(hook: IContextLifecycle): void {
    this._lifecycleHooks.push(hook);
  }

  /**
   * 移除生命周期钩子
   *
   * @description 移除上下文生命周期钩子
   * @param hook 生命周期钩子
   */
  removeLifecycleHook(hook: IContextLifecycle): void {
    const index = this._lifecycleHooks.indexOf(hook);
    if (index > -1) {
      this._lifecycleHooks.splice(index, 1);
    }
  }

  /**
   * 获取所有活跃的上下文
   *
   * @description 获取所有当前活跃的上下文
   * @returns 上下文数组
   */
  getAllActiveContexts(): AsyncContext[] {
    return Array.from(this._contextStore.values());
  }

  /**
   * 清理所有上下文
   *
   * @description 清理所有存储的上下文
   */
  clearAllContexts(): void {
    const contexts = Array.from(this._contextStore.values());

    // 通知所有上下文销毁
    contexts.forEach((context) => {
      this.notifyContextDestroyed(context);
    });

    // 清空存储
    this._contextStore.clear();
    this._currentContextId = undefined;

    this.logger.debug('All contexts cleared');
  }

  /**
   * 通知上下文创建
   *
   * @description 通知所有生命周期钩子上下文已创建
   * @param context 创建的上下文
   */
  private notifyContextCreated(context: AsyncContext): void {
    this._lifecycleHooks.forEach((hook) => {
      try {
        hook.onContextCreated?.(context);
      } catch (error) {
        this.logger.error(
          `Error in context created hook: ${(error as Error).message}`,
          (error as Error).stack
        );
      }
    });
  }

  /**
   * 通知上下文销毁
   *
   * @description 通知所有生命周期钩子上下文已销毁
   * @param context 销毁的上下文
   */
  private notifyContextDestroyed(context: AsyncContext): void {
    this._lifecycleHooks.forEach((hook) => {
      try {
        hook.onContextDestroyed?.(context);
      } catch (error) {
        this.logger.error(
          `Error in context destroyed hook: ${(error as Error).message}`,
          (error as Error).stack
        );
      }
    });
  }

  /**
   * 通知数据变更
   *
   * @description 通知所有生命周期钩子上下文数据已变更
   * @param context 上下文
   * @param key 变更的键
   * @param oldValue 旧值
   * @param newValue 新值
   */
  private notifyDataChanged(
    context: AsyncContext,
    key: string,
    oldValue: any,
    newValue: any
  ): void {
    this._lifecycleHooks.forEach((hook) => {
      try {
        hook.onContextDataChanged?.(context, key, oldValue, newValue);
      } catch (error) {
        this.logger.error(
          `Error in context data changed hook: ${(error as Error).message}`,
          (error as Error).stack
        );
      }
    });
  }
}
