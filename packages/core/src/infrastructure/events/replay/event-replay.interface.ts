/**
 * 事件重放接口
 *
 * 定义事件重放的核心接口，支持批量重放、增量重放、
 * 并行处理和性能优化等功能。
 *
 * @description 事件重放功能的接口定义
 */

/**
 * 重放策略类型枚举
 */
export enum ReplayStrategy {
  /** 顺序重放 */
  SEQUENTIAL = 'sequential',
  /** 并行重放 */
  PARALLEL = 'parallel',
  /** 批量重放 */
  BATCH = 'batch',
  /** 增量重放 */
  INCREMENTAL = 'incremental',
  /** 混合策略 */
  HYBRID = 'hybrid',
}

/**
 * 重放模式枚举
 */
export enum ReplayMode {
  /** 完整重放 */
  FULL = 'full',
  /** 增量重放 */
  INCREMENTAL = 'incremental',
  /** 选择性重放 */
  SELECTIVE = 'selective',
  /** 测试重放 */
  TEST = 'test',
}

/**
 * 重放配置接口
 *
 * @description 定义事件重放的配置选项
 */
export interface IReplayConfig {
  /** 重放策略 */
  strategy: ReplayStrategy;
  /** 重放模式 */
  mode: ReplayMode;
  /** 是否启用重放 */
  enabled: boolean;
  /** 批处理配置 */
  batch: {
    /** 批处理大小 */
    size: number;
    /** 批处理间隔（毫秒） */
    interval: number;
    /** 最大并发批次数 */
    maxConcurrency: number;
  };
  /** 并行处理配置 */
  parallel: {
    /** 最大并行数 */
    maxConcurrency: number;
    /** 工作线程池大小 */
    workerPoolSize: number;
    /** 任务队列大小 */
    taskQueueSize: number;
  };
  /** 性能配置 */
  performance: {
    /** 启用性能监控 */
    enableMonitoring: boolean;
    /** 性能采样间隔（毫秒） */
    samplingInterval: number;
    /** 内存使用阈值（MB） */
    memoryThreshold: number;
  };
  /** 过滤配置 */
  filters: {
    /** 事件类型过滤 */
    eventTypes?: string[];
    /** 聚合ID过滤 */
    aggregateIds?: string[];
    /** 时间范围过滤 */
    timeRange?: {
      start: Date;
      end: Date;
    };
    /** 租户过滤 */
    tenantIds?: string[];
  };
  /** 重放选项 */
  options: {
    /** 跳过失败的事件 */
    skipFailed: boolean;
    /** 重试失败的事件 */
    retryFailed: boolean;
    /** 最大重试次数 */
    maxRetries: number;
    /** 重试间隔（毫秒） */
    retryInterval: number;
    /** 验证重放结果 */
    validateResults: boolean;
  };
}

/**
 * 重放结果接口
 *
 * @description 事件重放操作的结果信息
 */
export interface IReplayResult {
  /** 重放ID */
  replayId: string;
  /** 总事件数 */
  totalEvents: number;
  /** 成功处理的事件数 */
  successfulEvents: number;
  /** 失败的事件数 */
  failedEvents: number;
  /** 跳过的消息数 */
  skippedEvents: number;
  /** 重放开始时间 */
  startTime: Date;
  /** 重放结束时间 */
  endTime: Date;
  /** 重放耗时（毫秒） */
  duration: number;
  /** 平均处理速度（事件/秒） */
  averageSpeed: number;
  /** 内存峰值使用（MB） */
  peakMemoryUsage: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 详细统计信息 */
  statistics: {
    /** 按事件类型统计 */
    byEventType: Record<
      string,
      { count: number; success: number; failed: number }
    >;
    /** 按租户统计 */
    byTenant: Record<
      string,
      { count: number; success: number; failed: number }
    >;
    /** 按时间段统计 */
    byTimeRange: Array<{
      timeRange: string;
      count: number;
      success: number;
      failed: number;
    }>;
  };
  /** 失败事件详情 */
  failedEventDetails: Array<{
    eventId: string;
    eventType: string;
    error: string;
    retryCount: number;
  }>;
}

/**
 * 重放进度接口
 *
 * @description 事件重放的进度信息
 */
export interface IReplayProgress {
  /** 重放ID */
  replayId: string;
  /** 当前进度百分比 */
  progress: number;
  /** 已处理事件数 */
  processedEvents: number;
  /** 总事件数 */
  totalEvents: number;
  /** 当前处理速度（事件/秒） */
  currentSpeed: number;
  /** 预计剩余时间（毫秒） */
  estimatedRemainingTime: number;
  /** 当前状态 */
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  /** 当前批处理信息 */
  currentBatch?: {
    batchNumber: number;
    batchSize: number;
    processedInBatch: number;
  };
}

/**
 * 事件重放器接口
 *
 * @description 提供事件重放功能的核心接口
 */
export interface IEventReplayer {
  /**
   * 重放事件
   *
   * @description 重放指定的事件数据
   * @param eventDataList 要重放的事件数据列表
   * @param config 重放配置
   * @returns 重放结果
   */
  replayEvents(
    eventDataList: any[],
    config?: Partial<IReplayConfig>,
  ): Promise<IReplayResult>;

  /**
   * 重放事件流
   *
   * @description 从事件存储重放事件流
   * @param aggregateId 聚合根ID
   * @param config 重放配置
   * @returns 重放结果
   */
  replayEventStream(
    aggregateId: string,
    config?: Partial<IReplayConfig>,
  ): Promise<IReplayResult>;

  /**
   * 批量重放事件
   *
   * @description 批量重放多个聚合根的事件
   * @param aggregateIds 聚合根ID列表
   * @param config 重放配置
   * @returns 重放结果
   */
  replayBatchEvents(
    aggregateIds: string[],
    config?: Partial<IReplayConfig>,
  ): Promise<IReplayResult>;

  /**
   * 增量重放事件
   *
   * @description 重放指定时间点之后的事件
   * @param fromDate 起始时间
   * @param config 重放配置
   * @returns 重放结果
   */
  replayIncrementalEvents(
    fromDate: Date,
    config?: Partial<IReplayConfig>,
  ): Promise<IReplayResult>;

  /**
   * 获取重放进度
   *
   * @description 获取指定重放操作的进度信息
   * @param replayId 重放ID
   * @returns 重放进度
   */
  getReplayProgress(replayId: string): Promise<IReplayProgress | null>;

  /**
   * 暂停重放
   *
   * @description 暂停正在进行的重放操作
   * @param replayId 重放ID
   * @returns 暂停结果
   */
  pauseReplay(replayId: string): Promise<boolean>;

  /**
   * 恢复重放
   *
   * @description 恢复被暂停的重放操作
   * @param replayId 重放ID
   * @returns 恢复结果
   */
  resumeReplay(replayId: string): Promise<boolean>;

  /**
   * 取消重放
   *
   * @description 取消正在进行的重放操作
   * @param replayId 重放ID
   * @returns 取消结果
   */
  cancelReplay(replayId: string): Promise<boolean>;

  /**
   * 获取重放历史
   *
   * @description 获取历史重放操作的列表
   * @param filters 过滤条件
   * @returns 重放历史列表
   */
  getReplayHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
  }): Promise<IReplayResult[]>;

  /**
   * 清理重放历史
   *
   * @description 清理过期的重放历史记录
   * @param olderThan 清理比此时间更早的记录
   * @returns 清理结果
   */
  cleanupReplayHistory(olderThan: Date): Promise<{
    deletedCount: number;
    deletedReplayIds: string[];
  }>;
}

/**
 * 重放处理器接口
 *
 * @description 处理单个事件重放的接口
 */
export interface IReplayHandler {
  /**
   * 处理事件重放
   *
   * @description 处理单个事件的重放
   * @param eventData 事件数据
   * @param context 重放上下文
   * @returns 处理结果
   */
  handleReplay(
    eventData: any,
    context: IReplayContext,
  ): Promise<IReplayHandlerResult>;
}

/**
 * 重放上下文接口
 *
 * @description 重放操作的上下文信息
 */
export interface IReplayContext {
  /** 重放ID */
  replayId: string;
  /** 重放配置 */
  config: IReplayConfig;
  /** 当前批处理信息 */
  currentBatch?: {
    batchNumber: number;
    batchSize: number;
    processedInBatch: number;
  };
  /** 重放统计信息 */
  statistics: {
    processedEvents: number;
    successfulEvents: number;
    failedEvents: number;
    skippedEvents: number;
  };
  /** 开始时间 */
  startTime: Date;
}

/**
 * 重放处理器结果接口
 *
 * @description 单个事件重放处理的结果
 */
export interface IReplayHandlerResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 处理耗时（毫秒） */
  processingTime: number;
  /** 是否需要重试 */
  shouldRetry: boolean;
  /** 重试次数 */
  retryCount: number;
  /** 处理结果数据 */
  result?: any;
}
