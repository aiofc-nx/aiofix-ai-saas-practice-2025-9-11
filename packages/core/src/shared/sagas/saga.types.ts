import type { Observable } from 'rxjs';

// 临时定义接口，后续应该从对应的模块导入
export interface ICommand {}
export interface IEvent {}

/**
 * Saga接口
 *
 * @description 定义Saga的基本接口，用于处理复杂业务流程
 */
export interface ISaga<TEvent extends IEvent = IEvent> {
  /**
   * 执行Saga逻辑
   *
   * @param eventBus 事件总线
   * @returns 命令流
   */
  (eventBus: ISagaEventBus<TEvent>): Observable<ICommand>;
}

/**
 * Saga事件总线接口
 *
 * @description 定义Saga使用的事件总线接口
 */
export interface ISagaEventBus<TEvent extends IEvent = IEvent> {
  /**
   * 过滤特定类型的事件
   *
   * @param types 事件类型数组
   * @returns 过滤后的事件流
   */
  ofType<T extends TEvent>(
    ...types: Array<new (...args: any[]) => T>
  ): Observable<T>;
}

/**
 * Saga配置接口
 *
 * @description 定义Saga的配置选项
 */
export interface ISagaConfig {
  /** Saga名称 */
  name?: string;
  /** 是否启用自动重启 */
  autoRestart?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否启用日志记录 */
  enableLogging?: boolean;
  /** 是否启用指标收集 */
  enableMetrics?: boolean;
}

/**
 * Saga状态枚举
 *
 * @description 定义Saga的执行状态
 */
export enum SagaState {
  /** 未开始 */
  NOT_STARTED = 'NOT_STARTED',
  /** 运行中 */
  RUNNING = 'RUNNING',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 已失败 */
  FAILED = 'FAILED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
  /** 已暂停 */
  PAUSED = 'PAUSED',
}

/**
 * Saga步骤接口
 *
 * @description 定义Saga中的单个步骤
 */
export interface ISagaStep {
  /** 步骤ID */
  id: string;
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description?: string;
  /** 步骤类型 */
  type: 'command' | 'query' | 'event' | 'delay' | 'condition';
  /** 步骤配置 */
  config?: Record<string, any>;
  /** 补偿操作 */
  compensate?: () => Promise<void> | void;
  /** 前置条件 */
  precondition?: () => Promise<boolean> | boolean;
  /** 后置条件 */
  postcondition?: () => Promise<boolean> | boolean;
}

/**
 * Saga执行上下文接口
 *
 * @description 定义Saga执行过程中的上下文信息
 */
export interface ISagaExecutionContext {
  /** 执行ID */
  executionId: string;
  /** Saga ID */
  sagaId: string;
  /** 当前状态 */
  state: SagaState;
  /** 当前步骤索引 */
  currentStepIndex: number;
  /** 执行开始时间 */
  startTime: Date;
  /** 执行结束时间 */
  endTime?: Date;
  /** 错误信息 */
  error?: Error;
  /** 执行数据 */
  data: Record<string, any>;
  /** 步骤历史 */
  stepHistory: ISagaStepExecution[];
}

/**
 * Saga步骤执行记录接口
 *
 * @description 定义Saga步骤的执行记录
 */
export interface ISagaStepExecution {
  /** 步骤ID */
  stepId: string;
  /** 执行开始时间 */
  startTime: Date;
  /** 执行结束时间 */
  endTime?: Date;
  /** 执行状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  /** 执行结果 */
  result?: any;
  /** 错误信息 */
  error?: Error;
  /** 执行时间（毫秒） */
  duration?: number;
}

/**
 * Saga管理器接口
 *
 * @description 定义Saga管理器的接口
 */
export interface ISagaManager {
  /**
   * 注册Saga
   *
   * @param saga Saga实例
   * @param config Saga配置
   */
  registerSaga(saga: ISaga, config?: ISagaConfig): void;

  /**
   * 启动Saga
   *
   * @param sagaId Saga ID
   * @param initialData 初始数据
   * @returns 执行上下文
   */
  startSaga(
    sagaId: string,
    initialData?: Record<string, any>
  ): Promise<ISagaExecutionContext>;

  /**
   * 暂停Saga
   *
   * @param executionId 执行ID
   */
  pauseSaga(executionId: string): Promise<void>;

  /**
   * 恢复Saga
   *
   * @param executionId 执行ID
   */
  resumeSaga(executionId: string): Promise<void>;

  /**
   * 取消Saga
   *
   * @param executionId 执行ID
   */
  cancelSaga(executionId: string): Promise<void>;

  /**
   * 获取Saga执行状态
   *
   * @param executionId 执行ID
   * @returns 执行上下文
   */
  getSagaExecution(executionId: string): ISagaExecutionContext | undefined;

  /**
   * 获取所有活跃的Saga执行
   *
   * @returns 执行上下文数组
   */
  getAllActiveExecutions(): ISagaExecutionContext[];
}

/**
 * Saga装饰器选项
 *
 * @description 定义Saga装饰器的选项
 */
export interface SagaDecoratorOptions {
  /** Saga名称 */
  name?: string;
  /** Saga配置 */
  config?: ISagaConfig;
  /** 是否自动注册 */
  autoRegister?: boolean;
}
