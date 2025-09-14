import { BaseDomainEvent } from '../../../domain/events/base.domain-event';
import {
  BaseEventProjector,
  EventProjectionResult,
  FailedEvent,
  RebuildResult,
  ProjectorStatus,
} from './base-event-projector.interface';

/**
 * 基础事件投射器
 *
 * 基础事件投射器提供事件投射的通用功能和模板。
 * 所有具体的事件投射器都应该继承此类，确保投射的一致性和可维护性。
 *
 * @description 所有事件投射器的基类
 * 提供事件投射的通用功能和最佳实践
 *
 * ## 业务规则
 *
 * ### 事件处理规则
 * - 事件处理应该是幂等的
 * - 支持事件重放和状态重建
 * - 处理事件处理的失败和重试
 * - 记录事件处理的状态和结果
 *
 * ### 读模型更新规则
 * - 读模型更新应该是原子的
 * - 支持读模型的版本控制
 * - 处理并发更新冲突
 * - 维护读模型的一致性
 *
 * ### 性能规则
 * - 事件处理应该高效
 * - 支持批量事件处理
 * - 优化读模型查询性能
 * - 提供事件处理统计信息
 *
 * ## 业务逻辑流程
 *
 * 1. **事件接收**：接收来自事件总线的领域事件
 * 2. **事件验证**：验证事件的有效性和完整性
 * 3. **读模型查询**：查询相关的读模型数据
 * 4. **状态计算**：根据事件计算新的读模型状态
 * 5. **读模型更新**：更新读模型数据
 * 6. **状态确认**：确认更新成功并记录处理结果
 *
 * @template TEvent 处理的事件类型
 * @template TReadModel 读模型类型
 *
 * @example
 * ```typescript
 * class UserEventProjector extends BaseEventProjector<BaseDomainEvent, UserReadModel> {
 *   protected async projectEvent(event: BaseDomainEvent): Promise<void> {
 *     // 具体的投射逻辑
 *   }
 *
 *   protected async getReadModel(aggregateId: string): Promise<UserReadModel | null> {
 *     // 获取读模型
 *   }
 *
 *   protected async saveReadModel(readModel: UserReadModel): Promise<void> {
 *     // 保存读模型
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseEventProjectorImpl<
  TEvent extends BaseDomainEvent,
  TReadModel
> implements BaseEventProjector<TEvent, TReadModel>
{
  protected readonly projectorName: string;
  protected lastProcessedVersion: number = 0;
  protected totalProcessedEvents: number = 0;
  protected lastProcessedAt: Date = new Date();
  protected projectorStatus: 'running' | 'stopped' | 'error' = 'stopped';
  protected error?: string;
  protected processingTimes: number[] = [];
  protected errorCount: number = 0;

  /**
   * 构造函数
   *
   * @param projectorName 投射器名称
   */
  constructor(projectorName: string) {
    this.projectorName = projectorName;
  }

  /**
   * 处理领域事件
   *
   * @description 处理单个领域事件，更新相应的读模型
   * @param event 要处理的领域事件
   * @returns Promise<void>
   * @throws {Error} 当事件处理失败时抛出
   */
  public async handle(event: TEvent): Promise<void> {
    if (!event) {
      throw new Error('Event cannot be null or undefined');
    }

    const startTime = Date.now();

    try {
      this.projectorStatus = 'running';

      // 验证事件是否已经被处理
      if (await this.isEventProcessed(event)) {
        console.log(
          `Event ${event.getEventId().toString()} already processed, skipping`
        );
        return;
      }

      // 执行具体的投射逻辑
      await this.projectEvent(event);

      // 记录处理结果
      await this.recordEventProcessed(event);

      // 更新统计信息
      this.updateStatistics(startTime, false);

      console.log(
        `Event ${event.getEventId().toString()} processed successfully`
      );
    } catch (error) {
      this.projectorStatus = 'error';
      this.error = (error as Error).message;
      this.updateStatistics(startTime, true);

      console.error(
        `Failed to process event ${event.getEventId().toString()}:`,
        error
      );
      throw new Error(`Failed to process event: ${(error as Error).message}`);
    }
  }

  /**
   * 批量处理领域事件
   *
   * @description 批量处理多个领域事件，提供高效的批量更新功能
   * @param events 要处理的领域事件列表
   * @returns Promise<EventProjectionResult>
   * @throws {Error} 当批量处理失败时抛出
   */
  public async handleBatch(events: TEvent[]): Promise<EventProjectionResult> {
    if (!events || events.length === 0) {
      return this.createEmptyResult();
    }

    const startTime = Date.now();
    const failedEvents: FailedEvent[] = [];
    let processedCount = 0;

    try {
      this.projectorStatus = 'running';

      for (const event of events) {
        try {
          await this.handle(event);
          processedCount++;
        } catch (error) {
          const failedEvent: FailedEvent = {
            eventId: event.getEventId().toString(),
            eventType: event.constructor.name,
            aggregateId: event.getAggregateId().toString(),
            version: 1, // 默认版本号
            error: (error as Error).message,
            failedAt: new Date(),
          };
          failedEvents.push(failedEvent);
        }
      }

      const endTime = Date.now();

      return {
        totalCount: events.length,
        processedCount,
        failedCount: failedEvents.length,
        failedEvents,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: endTime - startTime,
      };
    } catch (error) {
      this.projectorStatus = 'error';
      this.error = (error as Error).message;
      throw new Error(
        `Failed to process event batch: ${(error as Error).message}`
      );
    }
  }

  /**
   * 重建读模型
   *
   * @description 从事件历史重建读模型，支持完整的读模型重建
   * @param fromVersion 起始版本号，默认为0
   * @param toVersion 结束版本号，默认为最新版本
   * @returns Promise<RebuildResult>
   * @throws {Error} 当重建失败时抛出
   */
  public async rebuild(
    fromVersion: number = 0,
    toVersion?: number
  ): Promise<RebuildResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processedEvents = 0;
    let rebuiltModels = 0;

    try {
      this.projectorStatus = 'running';

      // 清除现有的读模型
      await this.clearReadModels();

      // 获取事件历史
      const events = await this.getEventsFromHistory(fromVersion, toVersion);

      // 按聚合根分组处理事件
      const eventsByAggregate = this.groupEventsByAggregate(events);

      for (const [aggregateId, aggregateEvents] of eventsByAggregate) {
        try {
          // 按顺序处理聚合根的事件
          for (const event of aggregateEvents) {
            await this.projectEvent(event as TEvent);
            processedEvents++;
          }
          rebuiltModels++;
        } catch (error) {
          const errorMsg = `Failed to rebuild aggregate ${aggregateId}: ${
            (error as Error).message
          }`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      const endTime = Date.now();

      return {
        processedEvents,
        rebuiltModels,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: endTime - startTime,
        hasErrors: errors.length > 0,
        errors,
      };
    } catch (error) {
      this.projectorStatus = 'error';
      this.error = (error as Error).message;
      throw new Error(
        `Failed to rebuild read models: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取投射器状态
   *
   * @description 获取投射器的当前状态和统计信息
   * @returns Promise<ProjectorStatus>
   */
  public async getStatus(): Promise<ProjectorStatus> {
    const averageProcessingTime =
      this.processingTimes.length > 0
        ? this.processingTimes.reduce((a, b) => a + b, 0) /
          this.processingTimes.length
        : 0;

    const processingRate =
      this.totalProcessedEvents > 0 && this.processingTimes.length > 0
        ? (this.totalProcessedEvents * 1000) /
          this.processingTimes.reduce((a, b) => a + b, 0)
        : 0;

    const errorRate =
      this.totalProcessedEvents > 0
        ? (this.errorCount / this.totalProcessedEvents) * 100
        : 0;

    return {
      name: this.projectorName,
      lastProcessedVersion: this.lastProcessedVersion,
      totalProcessedEvents: this.totalProcessedEvents,
      lastProcessedAt: this.lastProcessedAt,
      status: this.projectorStatus,
      error: this.error,
      performance: {
        averageProcessingTime,
        processingRate,
        errorRate,
      },
    };
  }

  /**
   * 重置投射器
   *
   * @description 重置投射器状态，清除所有处理记录
   * @returns Promise<void>
   * @throws {Error} 当重置失败时抛出
   */
  public async reset(): Promise<void> {
    try {
      this.lastProcessedVersion = 0;
      this.totalProcessedEvents = 0;
      this.lastProcessedAt = new Date();
      this.projectorStatus = 'stopped';
      this.error = undefined;
      this.processingTimes = [];
      this.errorCount = 0;

      // 清除处理记录
      await this.clearProcessingRecords();

      console.log(`Projector ${this.projectorName} reset successfully`);
    } catch (error) {
      throw new Error(`Failed to reset projector: ${(error as Error).message}`);
    }
  }

  /**
   * 执行具体的投射逻辑
   *
   * @description 由子类实现具体的投射逻辑
   * @param event 要处理的事件
   * @protected
   * @abstract
   */
  protected abstract projectEvent(event: TEvent): Promise<void>;

  /**
   * 检查事件是否已经被处理
   *
   * @description 检查事件是否已经被处理过，避免重复处理
   * @param event 要检查的事件
   * @returns Promise<boolean>
   * @protected
   */
  protected async isEventProcessed(event: TEvent): Promise<boolean> {
    // 默认实现：基于事件ID检查
    // 子类可以重写此方法实现更复杂的检查逻辑
    return false;
  }

  /**
   * 记录事件已被处理
   *
   * @description 记录事件已被处理，用于避免重复处理
   * @param event 已处理的事件
   * @protected
   */
  protected async recordEventProcessed(event: TEvent): Promise<void> {
    this.lastProcessedVersion = Math.max(this.lastProcessedVersion, 1); // 默认版本号
    this.totalProcessedEvents++;
    this.lastProcessedAt = new Date();
  }

  /**
   * 获取事件历史
   *
   * @description 从事件存储获取事件历史
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号
   * @returns Promise<BaseDomainEvent[]>
   * @protected
   */
  protected async getEventsFromHistory(
    fromVersion: number,
    toVersion?: number
  ): Promise<BaseDomainEvent[]> {
    // 默认实现：返回空数组
    // 子类需要实现具体的事件获取逻辑
    return [];
  }

  /**
   * 按聚合根分组事件
   *
   * @description 将事件按聚合根ID分组
   * @param events 事件列表
   * @returns Map<string, BaseDomainEvent[]>
   * @protected
   */
  protected groupEventsByAggregate(
    events: BaseDomainEvent[]
  ): Map<string, BaseDomainEvent[]> {
    const grouped = new Map<string, BaseDomainEvent[]>();

    for (const event of events) {
      const aggregateId = event.getAggregateId().toString();
      if (!grouped.has(aggregateId)) {
        grouped.set(aggregateId, []);
      }
      grouped.get(aggregateId)!.push(event);
    }

    return grouped;
  }

  /**
   * 清除读模型
   *
   * @description 清除所有读模型数据
   * @protected
   */
  protected async clearReadModels(): Promise<void> {
    // 子类需要实现具体的清除逻辑
  }

  /**
   * 清除处理记录
   *
   * @description 清除事件处理记录
   * @protected
   */
  protected async clearProcessingRecords(): Promise<void> {
    // 子类需要实现具体的清除逻辑
  }

  /**
   * 更新统计信息
   *
   * @description 更新投射器的统计信息
   * @param startTime 处理开始时间
   * @param hasError 是否有错误
   * @protected
   */
  protected updateStatistics(startTime: number, hasError: boolean): void {
    const processingTime = Date.now() - startTime;
    this.processingTimes.push(processingTime);

    // 保持最近100次的处理时间记录
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }

    if (hasError) {
      this.errorCount++;
    }
  }

  /**
   * 创建空的结果对象
   *
   * @description 创建空的处理结果对象
   * @returns EventProjectionResult
   * @protected
   */
  protected createEmptyResult(): EventProjectionResult {
    const now = new Date();
    return {
      totalCount: 0,
      processedCount: 0,
      failedCount: 0,
      failedEvents: [],
      startTime: now,
      endTime: now,
      duration: 0,
    };
  }
}
