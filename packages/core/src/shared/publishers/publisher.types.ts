import type { Observable } from 'rxjs';
import { AsyncContext } from '../context';

/**
 * 基础发布者接口
 *
 * @description 定义所有发布者的基础接口
 */
export interface IBasePublisher<T> {
  /**
   * 发布单个项目
   *
   * @param item 要发布的项目
   * @param context 异步上下文
   */
  publish(item: T, context?: AsyncContext): void;

  /**
   * 发布多个项目
   *
   * @param items 要发布的项目数组
   * @param context 异步上下文
   */
  publishAll?(items: T[], context?: AsyncContext): void;

  /**
   * 获取发布流
   *
   * @returns 发布流的Observable
   */
  getStream(): Observable<T>;
}

/**
 * 命令发布者接口
 *
 * @description 定义命令发布者的接口
 */
export interface ICommandPublisher<TCommand = any>
  extends IBasePublisher<TCommand> {
  /**
   * 发布命令
   *
   * @param command 要发布的命令
   * @param context 异步上下文
   */
  publish(command: TCommand, context?: AsyncContext): void;

  /**
   * 批量发布命令
   *
   * @param commands 要发布的命令数组
   * @param context 异步上下文
   */
  publishAll(commands: TCommand[], context?: AsyncContext): void;
}

/**
 * 查询发布者接口
 *
 * @description 定义查询发布者的接口
 */
export interface IQueryPublisher<TQuery = any> extends IBasePublisher<TQuery> {
  /**
   * 发布查询
   *
   * @param query 要发布的查询
   * @param context 异步上下文
   */
  publish(query: TQuery, context?: AsyncContext): void;

  /**
   * 批量发布查询
   *
   * @param queries 要发布的查询数组
   * @param context 异步上下文
   */
  publishAll(queries: TQuery[], context?: AsyncContext): void;
}

/**
 * 事件发布者接口
 *
 * @description 定义事件发布者的接口
 */
export interface IEventPublisher<TEvent = any> extends IBasePublisher<TEvent> {
  /**
   * 发布事件
   *
   * @param event 要发布的事件
   * @param context 异步上下文
   */
  publish(event: TEvent, context?: AsyncContext): void;

  /**
   * 批量发布事件
   *
   * @param events 要发布的事件数组
   * @param context 异步上下文
   */
  publishAll(events: TEvent[], context?: AsyncContext): void;
}

/**
 * 发布者配置接口
 *
 * @description 定义发布者的配置选项
 */
export interface IPublisherConfig {
  /** 是否启用日志记录 */
  enableLogging?: boolean;
  /** 是否启用指标收集 */
  enableMetrics?: boolean;
  /** 是否启用重试机制 */
  enableRetry?: boolean;
  /** 重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用批量处理 */
  enableBatching?: boolean;
  /** 批量大小 */
  batchSize?: number;
  /** 批量处理延迟（毫秒） */
  batchDelay?: number;
}

/**
 * 发布者工厂接口
 *
 * @description 定义发布者工厂的接口
 */
export interface IPublisherFactory {
  /**
   * 创建命令发布者
   *
   * @param config 发布者配置
   * @returns 命令发布者实例
   */
  createCommandPublisher<TCommand = any>(
    config?: IPublisherConfig
  ): ICommandPublisher<TCommand>;

  /**
   * 创建查询发布者
   *
   * @param config 发布者配置
   * @returns 查询发布者实例
   */
  createQueryPublisher<TQuery = any>(
    config?: IPublisherConfig
  ): IQueryPublisher<TQuery>;

  /**
   * 创建事件发布者
   *
   * @param config 发布者配置
   * @returns 事件发布者实例
   */
  createEventPublisher<TEvent = any>(
    config?: IPublisherConfig
  ): IEventPublisher<TEvent>;
}

/**
 * 发布者中间件接口
 *
 * @description 定义发布者中间件的接口
 */
export interface IPublisherMiddleware<T> {
  /**
   * 处理发布前的逻辑
   *
   * @param item 要发布的项目
   * @param context 异步上下文
   * @param next 下一个中间件
   * @returns 处理后的项目
   */
  beforePublish?(item: T, context?: AsyncContext, next?: () => T): T;

  /**
   * 处理发布后的逻辑
   *
   * @param item 已发布的项目
   * @param context 异步上下文
   * @param next 下一个中间件
   */
  afterPublish?(item: T, context?: AsyncContext, next?: () => void): void;

  /**
   * 处理发布错误的逻辑
   *
   * @param item 要发布的项目
   * @param error 错误信息
   * @param context 异步上下文
   * @param next 下一个中间件
   */
  onError?(
    item: T,
    error: Error,
    context?: AsyncContext,
    next?: () => void
  ): void;
}

/**
 * 发布者统计信息接口
 *
 * @description 定义发布者的统计信息
 */
export interface IPublisherStats {
  /** 总发布次数 */
  totalPublished: number;
  /** 成功发布次数 */
  successfulPublished: number;
  /** 失败发布次数 */
  failedPublished: number;
  /** 批量发布次数 */
  batchPublished: number;
  /** 平均发布延迟（毫秒） */
  averageLatency: number;
  /** 最后发布时间 */
  lastPublishedAt?: Date;
  /** 错误统计 */
  errorStats: Record<string, number>;
}

/**
 * 发布者装饰器选项
 *
 * @description 定义发布者装饰器的选项
 */
export interface PublisherDecoratorOptions {
  /** 发布者类型 */
  type: 'command' | 'query' | 'event';
  /** 发布者配置 */
  config?: IPublisherConfig;
  /** 是否自动注册 */
  autoRegister?: boolean;
}
