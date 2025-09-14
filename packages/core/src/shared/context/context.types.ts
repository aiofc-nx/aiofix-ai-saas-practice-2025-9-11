import { AsyncContext } from './async-context';

/**
 * 上下文数据接口
 *
 * @description 定义上下文中存储的数据结构
 */
export interface ContextData {
  [key: string]: any;
}

/**
 * 请求上下文接口
 *
 * @description 定义请求级别的上下文数据
 */
export interface RequestContext extends ContextData {
  /** 请求ID */
  requestId?: string;
  /** 用户ID */
  userId?: string;
  /** 租户ID */
  tenantId?: string;
  /** 组织ID */
  organizationId?: string;
  /** 部门ID */
  departmentId?: string;
  /** 会话ID */
  sessionId?: string;
  /** 客户端IP */
  clientIp?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 请求时间戳 */
  timestamp?: Date;
  /** 请求来源 */
  source?: string;
  /** 请求版本 */
  version?: string;
  /** 语言设置 */
  language?: string;
  /** 时区设置 */
  timezone?: string;
}

/**
 * 上下文工厂接口
 *
 * @description 定义上下文创建工厂的接口
 */
export interface IContextFactory {
  /**
   * 创建请求上下文
   *
   * @param data 上下文数据
   * @returns 异步上下文实例
   */
  createRequestContext(data?: RequestContext): AsyncContext;

  /**
   * 创建子上下文
   *
   * @param parent 父级上下文
   * @param data 上下文数据
   * @returns 异步上下文实例
   */
  createChildContext(parent: AsyncContext, data?: ContextData): AsyncContext;
}

/**
 * 上下文提供者接口
 *
 * @description 定义上下文提供者的接口
 */
export interface IContextProvider {
  /**
   * 获取当前上下文
   *
   * @returns 当前异步上下文，如果没有则返回undefined
   */
  getCurrentContext(): AsyncContext | undefined;

  /**
   * 设置当前上下文
   *
   * @param context 要设置的异步上下文
   */
  setCurrentContext(context: AsyncContext): void;

  /**
   * 清除当前上下文
   */
  clearCurrentContext(): void;
}

/**
 * 上下文中间件接口
 *
 * @description 定义上下文处理中间件的接口
 */
export interface IContextMiddleware {
  /**
   * 处理上下文
   *
   * @param context 要处理的异步上下文
   * @param next 下一个中间件
   * @returns 处理后的异步上下文
   */
  process(
    context: AsyncContext,
    next: () => Promise<AsyncContext>
  ): Promise<AsyncContext>;
}

/**
 * 上下文装饰器选项
 *
 * @description 定义上下文装饰器的选项
 */
export interface ContextDecoratorOptions {
  /** 是否自动创建上下文 */
  autoCreate?: boolean;
  /** 是否继承父级上下文 */
  inherit?: boolean;
  /** 是否自动清理上下文 */
  autoCleanup?: boolean;
  /** 上下文数据 */
  data?: ContextData;
}

/**
 * 上下文生命周期钩子
 *
 * @description 定义上下文生命周期钩子的接口
 */
export interface IContextLifecycle {
  /**
   * 上下文创建时调用
   *
   * @param context 创建的异步上下文
   */
  onContextCreated?(context: AsyncContext): void | Promise<void>;

  /**
   * 上下文销毁时调用
   *
   * @param context 销毁的异步上下文
   */
  onContextDestroyed?(context: AsyncContext): void | Promise<void>;

  /**
   * 上下文数据变更时调用
   *
   * @param context 异步上下文
   * @param key 变更的键
   * @param oldValue 旧值
   * @param newValue 新值
   */
  onContextDataChanged?(
    context: AsyncContext,
    key: string,
    oldValue: any,
    newValue: any
  ): void | Promise<void>;
}
