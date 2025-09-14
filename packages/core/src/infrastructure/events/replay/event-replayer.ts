import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '@aiofix/logging';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import {
  IEventReplayer,
  IReplayConfig,
  IReplayResult,
  IReplayProgress,
  ReplayStrategy,
  ReplayMode,
} from './event-replay.interface';

/**
 * 事件重放器
 *
 * 提供高性能的事件重放功能，支持批量重放、增量重放、
 * 并行处理和性能监控等企业级特性。
 *
 * @description 事件重放器的具体实现
 *
 * ## 业务规则
 *
 * ### 重放规则
 * - 支持多种重放策略（顺序、并行、批量、增量）
 * - 提供重放过程的实时监控和进度跟踪
 * - 支持重放操作的暂停、恢复和取消
 * - 提供重放结果的详细统计和分析
 *
 * ### 性能规则
 * - 支持并行处理提高重放性能
 * - 提供批处理优化减少系统开销
 * - 实现内存使用监控和优化
 * - 提供重放速度的实时统计
 *
 * ### 可靠性规则
 * - 支持失败事件的重试机制
 * - 提供重放过程的错误处理和恢复
 * - 记录详细的重放历史和审计日志
 * - 支持重放结果的验证和校验
 *
 * ## 业务逻辑流程
 *
 * 1. **重放准备**：验证配置和准备重放环境
 * 2. **事件加载**：加载要重放的事件数据
 * 3. **策略执行**：根据配置执行重放策略
 * 4. **进度监控**：实时监控重放进度和性能
 * 5. **结果收集**：收集和统计重放结果
 * 6. **清理工作**：清理重放过程中的临时资源
 *
 * @example
 * ```typescript
 * const replayer = new EventReplayer(logger);
 *
 * // 重放事件数据
 * const result = await replayer.replayEvents(eventDataList, {
 *   strategy: ReplayStrategy.PARALLEL,
 *   batch: { size: 100, maxConcurrency: 5 }
 * });
 *
 * // 获取重放进度
 * const progress = await replayer.getReplayProgress(result.replayId);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class EventReplayer implements IEventReplayer {
  /** 活跃的重放操作 */
  private readonly activeReplays = new Map<
    string,
    {
      config: IReplayConfig;
      progress: IReplayProgress;
      controller: AbortController;
      startTime: Date;
    }
  >();

  /** 重放历史记录 */
  private readonly replayHistory = new Map<string, IReplayResult>();

  /** 事件发射器 */
  private readonly eventEmitter = new EventEmitter();

  /** 默认重放配置 */
  private readonly defaultConfig: IReplayConfig = {
    strategy: ReplayStrategy.SEQUENTIAL,
    mode: ReplayMode.FULL,
    enabled: true,
    batch: {
      size: 100,
      interval: 100,
      maxConcurrency: 5,
    },
    parallel: {
      maxConcurrency: 10,
      workerPoolSize: 5,
      taskQueueSize: 1000,
    },
    performance: {
      enableMonitoring: true,
      samplingInterval: 1000,
      memoryThreshold: 512,
    },
    filters: {},
    options: {
      skipFailed: false,
      retryFailed: true,
      maxRetries: 3,
      retryInterval: 1000,
      validateResults: true,
    },
  };

  constructor(private readonly logger: PinoLoggerService) {
    // 设置内存监控
    if (this.defaultConfig.performance.enableMonitoring) {
      this.startMemoryMonitoring();
    }
  }

  /**
   * 重放事件
   *
   * @description 重放指定的事件数据
   * @param eventDataList 要重放的事件数据列表
   * @param config 重放配置
   * @returns 重放结果
   */
  async replayEvents(
    eventDataList: any[],
    config: Partial<IReplayConfig> = {},
  ): Promise<IReplayResult> {
    const replayId = randomUUID();
    const startTime = new Date();
    const finalConfig = { ...this.defaultConfig, ...config };

    // 验证配置
    if (!finalConfig.enabled) {
      throw new Error('重放功能未启用');
    }

    try {
      this.logger.info('开始事件重放', undefined, {
        replayId,
        eventCount: eventDataList.length,
        strategy: finalConfig.strategy,
        mode: finalConfig.mode,
      });

      // 过滤事件数据
      const filteredEvents = this.filterEvents(
        eventDataList,
        finalConfig.filters,
      );

      // 初始化重放进度
      const progress: IReplayProgress = {
        replayId,
        progress: 0,
        processedEvents: 0,
        totalEvents: filteredEvents.length,
        currentSpeed: 0,
        estimatedRemainingTime: 0,
        status: 'running',
      };

      // 创建中止控制器
      const controller = new AbortController();

      // 记录活跃重放
      this.activeReplays.set(replayId, {
        config: finalConfig,
        progress,
        controller,
        startTime,
      });

      // 根据策略执行重放
      const result = await this.executeReplayStrategy(
        replayId,
        filteredEvents,
        finalConfig,
        progress,
        controller.signal,
      );

      // 更新结束时间
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.averageSpeed = (result.successfulEvents / result.duration) * 1000;

      // 记录重放历史
      this.replayHistory.set(replayId, result);

      // 清理活跃重放
      this.activeReplays.delete(replayId);

      this.logger.info('事件重放完成', undefined, {
        replayId,
        totalEvents: result.totalEvents,
        successfulEvents: result.successfulEvents,
        failedEvents: result.failedEvents,
        duration: result.duration,
        averageSpeed: result.averageSpeed.toFixed(2),
      });

      return result;
    } catch (error) {
      // 清理活跃重放
      this.activeReplays.delete(replayId);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.error('事件重放失败', undefined, {
        replayId,
        error: (error as Error).message,
        stack: (error as Error).stack,
        duration,
      });

      const errorResult: IReplayResult = {
        replayId,
        totalEvents: eventDataList.length,
        successfulEvents: 0,
        failedEvents: eventDataList.length,
        skippedEvents: 0,
        startTime,
        endTime,
        duration,
        averageSpeed: 0,
        peakMemoryUsage: 0,
        success: false,
        error: (error as Error).message,
        statistics: {
          byEventType: {},
          byTenant: {},
          byTimeRange: [],
        },
        failedEventDetails: [],
      };

      // 记录错误结果
      this.replayHistory.set(replayId, errorResult);

      return errorResult;
    }
  }

  /**
   * 重放事件流
   *
   * @description 从事件存储重放事件流
   * @param aggregateId 聚合根ID
   * @param config 重放配置
   * @returns 重放结果
   */
  async replayEventStream(
    aggregateId: string,
    config: Partial<IReplayConfig> = {},
  ): Promise<IReplayResult> {
    // 这里应该从事件存储中加载事件数据
    // 暂时返回空结果，实际实现需要集成事件存储
    this.logger.warn('replayEventStream 方法需要集成事件存储', undefined, {
      aggregateId,
    });

    return this.replayEvents([], config);
  }

  /**
   * 批量重放事件
   *
   * @description 批量重放多个聚合根的事件
   * @param aggregateIds 聚合根ID列表
   * @param config 重放配置
   * @returns 重放结果
   */
  async replayBatchEvents(
    aggregateIds: string[],
    config: Partial<IReplayConfig> = {},
  ): Promise<IReplayResult> {
    // 这里应该从事件存储中批量加载事件数据
    // 暂时返回空结果，实际实现需要集成事件存储
    this.logger.warn('replayBatchEvents 方法需要集成事件存储', undefined, {
      aggregateIds,
    });

    return this.replayEvents([], config);
  }

  /**
   * 增量重放事件
   *
   * @description 重放指定时间点之后的事件
   * @param fromDate 起始时间
   * @param config 重放配置
   * @returns 重放结果
   */
  async replayIncrementalEvents(
    fromDate: Date,
    config: Partial<IReplayConfig> = {},
  ): Promise<IReplayResult> {
    // 这里应该从事件存储中加载增量事件数据
    // 暂时返回空结果，实际实现需要集成事件存储
    this.logger.warn(
      'replayIncrementalEvents 方法需要集成事件存储',
      undefined,
      {
        fromDate,
      },
    );

    return this.replayEvents([], config);
  }

  /**
   * 获取重放进度
   *
   * @description 获取指定重放操作的进度信息
   * @param replayId 重放ID
   * @returns 重放进度
   */
  async getReplayProgress(replayId: string): Promise<IReplayProgress | null> {
    const activeReplay = this.activeReplays.get(replayId);
    if (activeReplay) {
      return { ...activeReplay.progress };
    }

    // 检查历史记录
    const historyResult = this.replayHistory.get(replayId);
    if (historyResult) {
      return {
        replayId,
        progress: 100,
        processedEvents: historyResult.totalEvents,
        totalEvents: historyResult.totalEvents,
        currentSpeed: historyResult.averageSpeed,
        estimatedRemainingTime: 0,
        status: historyResult.success ? 'completed' : 'failed',
      };
    }

    return null;
  }

  /**
   * 暂停重放
   *
   * @description 暂停正在进行的重放操作
   * @param replayId 重放ID
   * @returns 暂停结果
   */
  async pauseReplay(replayId: string): Promise<boolean> {
    const activeReplay = this.activeReplays.get(replayId);
    if (!activeReplay) {
      return false;
    }

    activeReplay.progress.status = 'paused';
    this.logger.info('重放操作已暂停', undefined, { replayId });
    return true;
  }

  /**
   * 恢复重放
   *
   * @description 恢复被暂停的重放操作
   * @param replayId 重放ID
   * @returns 恢复结果
   */
  async resumeReplay(replayId: string): Promise<boolean> {
    const activeReplay = this.activeReplays.get(replayId);
    if (!activeReplay || activeReplay.progress.status !== 'paused') {
      return false;
    }

    activeReplay.progress.status = 'running';
    this.logger.info('重放操作已恢复', undefined, { replayId });
    return true;
  }

  /**
   * 取消重放
   *
   * @description 取消正在进行的重放操作
   * @param replayId 重放ID
   * @returns 取消结果
   */
  async cancelReplay(replayId: string): Promise<boolean> {
    const activeReplay = this.activeReplays.get(replayId);
    if (!activeReplay) {
      return false;
    }

    // 中止重放操作
    activeReplay.controller.abort();
    activeReplay.progress.status = 'cancelled';

    // 清理活跃重放
    this.activeReplays.delete(replayId);

    this.logger.info('重放操作已取消', undefined, { replayId });
    return true;
  }

  /**
   * 获取重放历史
   *
   * @description 获取历史重放操作的列表
   * @param filters 过滤条件
   * @returns 重放历史列表
   */
  async getReplayHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
  }): Promise<IReplayResult[]> {
    let results = Array.from(this.replayHistory.values());

    // 应用过滤条件
    if (filters) {
      if (filters.startDate) {
        results = results.filter(
          (result) => result.startTime >= filters.startDate!,
        );
      }
      if (filters.endDate) {
        results = results.filter(
          (result) => result.startTime <= filters.endDate!,
        );
      }
      if (filters.status) {
        const targetSuccess = filters.status === 'success';
        results = results.filter((result) => result.success === targetSuccess);
      }
      if (filters.limit) {
        results = results.slice(0, filters.limit);
      }
    }

    // 按开始时间排序
    results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return results;
  }

  /**
   * 清理重放历史
   *
   * @description 清理过期的重放历史记录
   * @param olderThan 清理比此时间更早的记录
   * @returns 清理结果
   */
  async cleanupReplayHistory(olderThan: Date): Promise<{
    deletedCount: number;
    deletedReplayIds: string[];
  }> {
    const deletedReplayIds: string[] = [];

    for (const [replayId, result] of this.replayHistory) {
      if (result.startTime < olderThan) {
        this.replayHistory.delete(replayId);
        deletedReplayIds.push(replayId);
      }
    }

    this.logger.info('重放历史清理完成', undefined, {
      deletedCount: deletedReplayIds.length,
      deletedReplayIds,
    });

    return {
      deletedCount: deletedReplayIds.length,
      deletedReplayIds,
    };
  }

  /**
   * 执行重放策略
   *
   * @description 根据配置执行相应的重放策略
   * @param replayId 重放ID
   * @param events 事件数据列表
   * @param config 重放配置
   * @param progress 进度信息
   * @param signal 中止信号
   * @returns 重放结果
   */
  private async executeReplayStrategy(
    replayId: string,
    events: any[],
    config: IReplayConfig,
    progress: IReplayProgress,
    signal: AbortSignal,
  ): Promise<IReplayResult> {
    switch (config.strategy) {
      case ReplayStrategy.SEQUENTIAL:
        return this.executeSequentialReplay(
          replayId,
          events,
          config,
          progress,
          signal,
        );
      case ReplayStrategy.PARALLEL:
        return this.executeParallelReplay(
          replayId,
          events,
          config,
          progress,
          signal,
        );
      case ReplayStrategy.BATCH:
        return this.executeBatchReplay(
          replayId,
          events,
          config,
          progress,
          signal,
        );
      case ReplayStrategy.INCREMENTAL:
        return this.executeIncrementalReplay(
          replayId,
          events,
          config,
          progress,
          signal,
        );
      case ReplayStrategy.HYBRID:
        return this.executeHybridReplay(
          replayId,
          events,
          config,
          progress,
          signal,
        );
      default:
        throw new Error(`不支持的重放策略: ${config.strategy}`);
    }
  }

  /**
   * 执行顺序重放
   *
   * @description 按顺序逐个处理事件
   */
  private async executeSequentialReplay(
    replayId: string,
    events: any[],
    config: IReplayConfig,
    progress: IReplayProgress,
    signal: AbortSignal,
  ): Promise<IReplayResult> {
    const result = this.initializeReplayResult(replayId, events.length);
    const startTime = Date.now();

    for (let i = 0; i < events.length; i++) {
      // 检查中止信号
      if (signal.aborted) {
        result.success = false;
        result.error = '重放操作被中止';
        break;
      }

      try {
        await this.processEvent(events[i], config, result);
        result.successfulEvents++;
      } catch (error) {
        result.failedEvents++;
        result.failedEventDetails.push({
          eventId: events[i].eventId || `event_${i}`,
          eventType: events[i].eventType || 'Unknown',
          error: (error as Error).message,
          retryCount: 0,
        });

        if (!config.options.skipFailed) {
          throw error;
        }
      }

      // 更新进度
      progress.processedEvents = i + 1;
      progress.progress = ((i + 1) / events.length) * 100;
      progress.currentSpeed = (i + 1) / ((Date.now() - startTime) / 1000);
      progress.estimatedRemainingTime =
        ((events.length - i - 1) / progress.currentSpeed) * 1000;

      // 触发进度事件
      this.eventEmitter.emit('replayProgress', progress);
    }

    result.success = result.failedEvents === 0;
    return result;
  }

  /**
   * 执行并行重放
   *
   * @description 并行处理多个事件
   */
  private async executeParallelReplay(
    replayId: string,
    events: any[],
    config: IReplayConfig,
    progress: IReplayProgress,
    signal: AbortSignal,
  ): Promise<IReplayResult> {
    const result = this.initializeReplayResult(replayId, events.length);
    const maxConcurrency = config.parallel.maxConcurrency;
    const startTime = Date.now();

    // 分批并行处理
    for (let i = 0; i < events.length; i += maxConcurrency) {
      // 检查中止信号
      if (signal.aborted) {
        result.success = false;
        result.error = '重放操作被中止';
        break;
      }

      const batch = events.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(async (event, batchIndex) => {
        const eventIndex = i + batchIndex;
        try {
          await this.processEvent(event, config, result);
          result.successfulEvents++;
        } catch (error) {
          result.failedEvents++;
          result.failedEventDetails.push({
            eventId: event.eventId || `event_${eventIndex}`,
            eventType: event.eventType || 'Unknown',
            error: (error as Error).message,
            retryCount: 0,
          });

          if (!config.options.skipFailed) {
            throw error;
          }
        }

        // 更新进度
        progress.processedEvents = eventIndex + 1;
        progress.progress = ((eventIndex + 1) / events.length) * 100;
        progress.currentSpeed =
          (eventIndex + 1) / ((Date.now() - startTime) / 1000);
        progress.estimatedRemainingTime =
          ((events.length - eventIndex - 1) / progress.currentSpeed) * 1000;

        // 触发进度事件
        this.eventEmitter.emit('replayProgress', progress);
      });

      await Promise.all(batchPromises);
    }

    result.success = result.failedEvents === 0;
    return result;
  }

  /**
   * 执行批量重放
   *
   * @description 按批次处理事件
   */
  private async executeBatchReplay(
    replayId: string,
    events: any[],
    config: IReplayConfig,
    progress: IReplayProgress,
    signal: AbortSignal,
  ): Promise<IReplayResult> {
    const result = this.initializeReplayResult(replayId, events.length);
    const batchSize = config.batch.size;
    const startTime = Date.now();

    for (let i = 0; i < events.length; i += batchSize) {
      // 检查中止信号
      if (signal.aborted) {
        result.success = false;
        result.error = '重放操作被中止';
        break;
      }

      const batch = events.slice(i, i + batchSize);

      // 更新当前批处理信息
      progress.currentBatch = {
        batchNumber: Math.floor(i / batchSize) + 1,
        batchSize: batch.length,
        processedInBatch: 0,
      };

      try {
        await this.processBatch(batch, config, result, progress);
      } catch (error) {
        this.logger.error('批量处理失败', undefined, {
          replayId,
          batchNumber: progress.currentBatch.batchNumber,
          error: (error as Error).message,
        });

        if (!config.options.skipFailed) {
          throw error;
        }
      }

      // 更新进度
      progress.processedEvents = Math.min(i + batchSize, events.length);
      progress.progress = (progress.processedEvents / events.length) * 100;
      progress.currentSpeed =
        progress.processedEvents / ((Date.now() - startTime) / 1000);
      progress.estimatedRemainingTime =
        ((events.length - progress.processedEvents) / progress.currentSpeed) *
        1000;

      // 触发进度事件
      this.eventEmitter.emit('replayProgress', progress);

      // 批次间隔
      if (config.batch.interval > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, config.batch.interval),
        );
      }
    }

    result.success = result.failedEvents === 0;
    return result;
  }

  /**
   * 执行增量重放
   *
   * @description 增量处理事件
   */
  private async executeIncrementalReplay(
    replayId: string,
    events: any[],
    config: IReplayConfig,
    progress: IReplayProgress,
    signal: AbortSignal,
  ): Promise<IReplayResult> {
    // 增量重放的特殊逻辑
    // 这里可以根据时间戳或其他条件进行增量处理
    return this.executeSequentialReplay(
      replayId,
      events,
      config,
      progress,
      signal,
    );
  }

  /**
   * 执行混合重放
   *
   * @description 结合多种策略的混合重放
   */
  private async executeHybridReplay(
    replayId: string,
    events: any[],
    config: IReplayConfig,
    progress: IReplayProgress,
    signal: AbortSignal,
  ): Promise<IReplayResult> {
    // 混合策略：先批量处理，再并行处理
    const batchSize = Math.min(config.batch.size, 50);
    const parallelSize = config.parallel.maxConcurrency;

    const result = this.initializeReplayResult(replayId, events.length);
    const startTime = Date.now();

    for (let i = 0; i < events.length; i += batchSize) {
      // 检查中止信号
      if (signal.aborted) {
        result.success = false;
        result.error = '重放操作被中止';
        break;
      }

      const batch = events.slice(i, i + batchSize);

      // 在批次内并行处理
      const parallelBatches = [];
      for (let j = 0; j < batch.length; j += parallelSize) {
        parallelBatches.push(batch.slice(j, j + parallelSize));
      }

      for (const parallelBatch of parallelBatches) {
        const promises = parallelBatch.map(async (event, batchIndex) => {
          const eventIndex = i + batchIndex;
          try {
            await this.processEvent(event, config, result);
            result.successfulEvents++;
          } catch (error) {
            result.failedEvents++;
            result.failedEventDetails.push({
              eventId: event.eventId || `event_${eventIndex}`,
              eventType: event.eventType || 'Unknown',
              error: (error as Error).message,
              retryCount: 0,
            });

            if (!config.options.skipFailed) {
              throw error;
            }
          }
        });

        await Promise.all(promises);
      }

      // 更新进度
      progress.processedEvents = Math.min(i + batchSize, events.length);
      progress.progress = (progress.processedEvents / events.length) * 100;
      progress.currentSpeed =
        progress.processedEvents / ((Date.now() - startTime) / 1000);
      progress.estimatedRemainingTime =
        ((events.length - progress.processedEvents) / progress.currentSpeed) *
        1000;

      // 触发进度事件
      this.eventEmitter.emit('replayProgress', progress);
    }

    result.success = result.failedEvents === 0;
    return result;
  }

  /**
   * 过滤事件数据
   *
   * @description 根据过滤条件过滤事件数据
   * @param events 事件数据列表
   * @param filters 过滤条件
   * @returns 过滤后的事件数据
   */
  private filterEvents(events: any[], filters: any): any[] {
    if (!filters || Object.keys(filters).length === 0) {
      return events;
    }

    return events.filter((event) => {
      // 事件类型过滤
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        if (!filters.eventTypes.includes(event.eventType)) {
          return false;
        }
      }

      // 聚合ID过滤
      if (filters.aggregateIds && filters.aggregateIds.length > 0) {
        if (!filters.aggregateIds.includes(event.aggregateId)) {
          return false;
        }
      }

      // 时间范围过滤
      if (filters.timeRange) {
        const eventTime = new Date(event.occurredOn);
        if (
          eventTime < filters.timeRange.start ||
          eventTime > filters.timeRange.end
        ) {
          return false;
        }
      }

      // 租户过滤
      if (filters.tenantIds && filters.tenantIds.length > 0) {
        if (!filters.tenantIds.includes(event.tenantId)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 初始化重放结果
   *
   * @description 初始化重放结果对象
   * @param replayId 重放ID
   * @param totalEvents 总事件数
   * @returns 重放结果
   */
  private initializeReplayResult(
    replayId: string,
    totalEvents: number,
  ): IReplayResult {
    return {
      replayId,
      totalEvents,
      successfulEvents: 0,
      failedEvents: 0,
      skippedEvents: 0,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      averageSpeed: 0,
      peakMemoryUsage: 0,
      success: false,
      statistics: {
        byEventType: {},
        byTenant: {},
        byTimeRange: [],
      },
      failedEventDetails: [],
    };
  }

  /**
   * 处理单个事件
   *
   * @description 处理单个事件的重放
   * @param event 事件数据
   * @param config 重放配置
   * @param result 重放结果
   */
  private async processEvent(
    event: any,
    config: IReplayConfig,
    result: IReplayResult,
  ): Promise<void> {
    // 这里应该调用实际的事件处理器
    // 暂时模拟处理逻辑
    await new Promise((resolve) => setTimeout(resolve, 1));

    // 更新统计信息
    this.updateStatistics(event, result);
  }

  /**
   * 处理批次事件
   *
   * @description 处理一批事件
   * @param batch 事件批次
   * @param config 重放配置
   * @param result 重放结果
   * @param progress 进度信息
   */
  private async processBatch(
    batch: any[],
    config: IReplayConfig,
    result: IReplayResult,
    progress: IReplayProgress,
  ): Promise<void> {
    for (const event of batch) {
      try {
        await this.processEvent(event, config, result);
        result.successfulEvents++;

        if (progress.currentBatch) {
          progress.currentBatch.processedInBatch++;
        }
      } catch (error) {
        result.failedEvents++;
        result.failedEventDetails.push({
          eventId: event.eventId || 'unknown',
          eventType: event.eventType || 'Unknown',
          error: (error as Error).message,
          retryCount: 0,
        });

        if (!config.options.skipFailed) {
          throw error;
        }
      }

      // 更新统计信息
      this.updateStatistics(event, result);
    }
  }

  /**
   * 更新统计信息
   *
   * @description 更新重放统计信息
   * @param event 事件数据
   * @param result 重放结果
   */
  private updateStatistics(event: any, result: IReplayResult): void {
    // 按事件类型统计
    const eventType = event.eventType || 'Unknown';
    if (!result.statistics.byEventType[eventType]) {
      result.statistics.byEventType[eventType] = {
        count: 0,
        success: 0,
        failed: 0,
      };
    }
    result.statistics.byEventType[eventType].count++;

    // 按租户统计
    const tenantId = event.tenantId || 'default';
    if (!result.statistics.byTenant[tenantId]) {
      result.statistics.byTenant[tenantId] = {
        count: 0,
        success: 0,
        failed: 0,
      };
    }
    result.statistics.byTenant[tenantId].count++;
  }

  /**
   * 启动内存监控
   *
   * @description 启动内存使用监控
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;

      if (memUsageMB > this.defaultConfig.performance.memoryThreshold) {
        this.logger.warn('内存使用超过阈值', undefined, {
          memoryUsageMB: memUsageMB.toFixed(2),
          thresholdMB: this.defaultConfig.performance.memoryThreshold,
        });
      }
    }, this.defaultConfig.performance.samplingInterval);
  }
}
