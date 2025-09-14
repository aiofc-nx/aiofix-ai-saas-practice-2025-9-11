import { BaseDomainEvent } from '../../../domain/events/base.domain-event';

/**
 * 基础事件投射器接口
 *
 * 事件投射器是Event Sourcing架构中的核心组件，负责将领域事件投射到读模型。
 * 提供事件处理、状态重建、读模型更新等功能。
 *
 * @description 所有事件投射器的基接口
 * 定义事件投射的通用规范和最佳实践
 *
 * ## 业务规则
 *
 * ### 事件处理规则
 * - 事件投射器应该具有幂等性
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
 * ### 错误处理规则
 * - 事件处理失败时应该记录错误
 * - 支持事件处理的重试机制
 * - 提供错误恢复策略
 * - 监控事件处理的健康状态
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
 * interface UserEventProjector extends BaseEventProjector<BaseDomainEvent, UserReadModel> {
 *   // 用户事件投射器实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface BaseEventProjector<
  TEvent extends BaseDomainEvent,
  TReadModel
> {
  /**
   * 处理领域事件
   *
   * @description 处理单个领域事件，更新相应的读模型
   *
   * ## 业务规则
   *
   * ### 处理规则
   * - 事件处理应该是幂等的
   * - 处理过程中不应该修改领域事件
   * - 支持事件处理的异步执行
   * - 记录事件处理的详细信息
   *
   * ### 验证规则
   * - 验证事件的有效性
   * - 检查事件是否已经被处理
   * - 验证读模型的状态一致性
   * - 处理重复事件的检测
   *
   * @param event 要处理的领域事件
   * @returns Promise<void>
   * @throws {Error} 当事件处理失败时抛出
   *
   * @example
   * ```typescript
   * await userProjector.handle(userCreatedEvent);
   * ```
   */
  handle(event: TEvent): Promise<void>;

  /**
   * 批量处理领域事件
   *
   * @description 批量处理多个领域事件，提供高效的批量更新功能
   *
   * ## 业务规则
   *
   * ### 批量处理规则
   * - 批量处理应该保持事务性
   * - 支持批量处理的部分成功
   * - 提供批量处理的进度反馈
   * - 优化批量处理的性能
   *
   * ### 错误处理规则
   * - 单个事件处理失败不应该影响其他事件
   * - 记录批量处理的详细结果
   * - 提供失败事件的重新处理机制
   * - 支持批量处理的回滚操作
   *
   * @param events 要处理的领域事件列表
   * @returns Promise<EventProjectionResult>
   * @throws {Error} 当批量处理失败时抛出
   *
   * @example
   * ```typescript
   * const result = await userProjector.handleBatch([event1, event2, event3]);
   * console.log(`处理了${result.processedCount}个事件，失败${result.failedCount}个`);
   * ```
   */
  handleBatch(events: TEvent[]): Promise<EventProjectionResult>;

  /**
   * 重建读模型
   *
   * @description 从事件历史重建读模型，支持完整的读模型重建
   *
   * ## 业务规则
   *
   * ### 重建规则
   * - 重建过程应该是幂等的
   * - 支持从指定时间点重建
   * - 提供重建过程的进度反馈
   * - 处理重建过程中的错误
   *
   * ### 性能规则
   * - 重建过程应该高效
   * - 支持增量重建
   * - 优化大量事件的处理性能
   * - 提供重建过程的监控
   *
   * @param fromVersion 起始版本号，默认为0
   * @param toVersion 结束版本号，默认为最新版本
   * @returns Promise<RebuildResult>
   * @throws {Error} 当重建失败时抛出
   *
   * @example
   * ```typescript
   * const result = await userProjector.rebuild(0, 1000);
   * console.log(`重建完成，处理了${result.processedEvents}个事件`);
   * ```
   */
  rebuild(fromVersion?: number, toVersion?: number): Promise<RebuildResult>;

  /**
   * 获取投射器状态
   *
   * @description 获取投射器的当前状态和统计信息
   *
   * @returns Promise<ProjectorStatus>
   *
   * @example
   * ```typescript
   * const status = await userProjector.getStatus();
   * console.log(`最后处理版本: ${status.lastProcessedVersion}`);
   * ```
   */
  getStatus(): Promise<ProjectorStatus>;

  /**
   * 重置投射器
   *
   * @description 重置投射器状态，清除所有处理记录
   *
   * @returns Promise<void>
   * @throws {Error} 当重置失败时抛出
   *
   * @example
   * ```typescript
   * await userProjector.reset();
   * ```
   */
  reset(): Promise<void>;
}

/**
 * 事件投射结果
 *
 * @description 记录事件投射处理的结果信息
 */
export interface EventProjectionResult {
  /** 处理的事件总数 */
  totalCount: number;
  /** 成功处理的事件数量 */
  processedCount: number;
  /** 处理失败的事件数量 */
  failedCount: number;
  /** 处理失败的事件详情 */
  failedEvents: FailedEvent[];
  /** 处理开始时间 */
  startTime: Date;
  /** 处理结束时间 */
  endTime: Date;
  /** 处理耗时（毫秒） */
  duration: number;
}

/**
 * 失败的事件信息
 *
 * @description 记录处理失败的事件的详细信息
 */
export interface FailedEvent {
  /** 事件ID */
  eventId: string;
  /** 事件类型 */
  eventType: string;
  /** 聚合根ID */
  aggregateId: string;
  /** 事件版本号 */
  version: number;
  /** 失败原因 */
  error: string;
  /** 失败时间 */
  failedAt: Date;
}

/**
 * 重建结果
 *
 * @description 记录读模型重建的结果信息
 */
export interface RebuildResult {
  /** 处理的事件总数 */
  processedEvents: number;
  /** 重建的读模型数量 */
  rebuiltModels: number;
  /** 重建开始时间 */
  startTime: Date;
  /** 重建结束时间 */
  endTime: Date;
  /** 重建耗时（毫秒） */
  duration: number;
  /** 是否有错误 */
  hasErrors: boolean;
  /** 错误详情 */
  errors: string[];
}

/**
 * 投射器状态
 *
 * @description 投射器的当前状态和统计信息
 */
export interface ProjectorStatus {
  /** 投射器名称 */
  name: string;
  /** 最后处理的事件版本号 */
  lastProcessedVersion: number;
  /** 处理的事件总数 */
  totalProcessedEvents: number;
  /** 最后处理时间 */
  lastProcessedAt: Date;
  /** 投射器状态 */
  status: 'running' | 'stopped' | 'error';
  /** 错误信息 */
  error?: string;
  /** 性能统计 */
  performance: {
    /** 平均处理时间（毫秒） */
    averageProcessingTime: number;
    /** 处理速度（事件/秒） */
    processingRate: number;
    /** 错误率 */
    errorRate: number;
  };
}
