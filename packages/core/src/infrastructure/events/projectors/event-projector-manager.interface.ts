import { BaseDomainEvent } from '../../../domain/events/base.domain-event';
import { BaseEventProjector } from './base-event-projector.interface';

/**
 * 事件投射器管理器接口
 *
 * 事件投射器管理器负责管理和协调多个事件投射器的运行。
 * 提供投射器的注册、启动、停止、监控等功能。
 *
 * @description 事件投射器管理器的接口定义
 * 提供投射器管理的通用规范和最佳实践
 *
 * ## 业务规则
 *
 * ### 投射器管理规则
 * - 支持多个投射器的注册和管理
 * - 提供投射器的生命周期管理
 * - 处理投射器之间的依赖关系
 * - 支持投射器的动态配置
 *
 * ### 事件分发规则
 * - 将事件分发给相应的投射器
 * - 支持事件的批量分发
 * - 处理事件分发的失败和重试
 * - 提供事件分发的监控
 *
 * ### 性能规则
 * - 事件分发应该高效
 * - 支持并行处理多个投射器
 * - 优化事件分发的性能
 * - 提供性能监控和统计
 *
 * ### 错误处理规则
 * - 处理投射器运行时的错误
 * - 支持投射器的错误恢复
 * - 提供错误监控和告警
 * - 记录详细的错误信息
 *
 * ## 业务逻辑流程
 *
 * 1. **投射器注册**：注册和管理多个事件投射器
 * 2. **事件接收**：接收来自事件总线的事件
 * 3. **事件分发**：将事件分发给相应的投射器
 * 4. **投射器执行**：并行执行多个投射器
 * 5. **结果收集**：收集投射器的执行结果
 * 6. **状态监控**：监控投射器的运行状态
 *
 * @example
 * ```typescript
 * interface EventProjectorManager {
 *   // 事件投射器管理实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface EventProjectorManager {
  /**
   * 注册事件投射器
   *
   * @description 注册一个事件投射器到管理器中
   *
   * ## 业务规则
   *
   * ### 注册规则
   * - 投射器名称必须唯一
   * - 支持投射器的依赖关系配置
   * - 验证投射器的有效性
   * - 支持投射器的配置选项
   *
   * @param projector 事件投射器实例
   * @param options 注册选项
   * @returns Promise<void>
   * @throws {Error} 当注册失败时抛出
   *
   * @example
   * ```typescript
   * await manager.registerProjector(userProjector, {
   *   dependencies: ['tenantProjector'],
   *   autoStart: true
   * });
   * ```
   */
  registerProjector<TEvent extends BaseDomainEvent, TReadModel>(
    projector: BaseEventProjector<TEvent, TReadModel>,
    options?: ProjectorRegistrationOptions
  ): Promise<void>;

  /**
   * 注销事件投射器
   *
   * @description 从管理器中注销一个事件投射器
   *
   * @param projectorName 投射器名称
   * @returns Promise<void>
   * @throws {Error} 当注销失败时抛出
   *
   * @example
   * ```typescript
   * await manager.unregisterProjector('userProjector');
   * ```
   */
  unregisterProjector(projectorName: string): Promise<void>;

  /**
   * 启动所有投射器
   *
   * @description 启动所有已注册的投射器
   *
   * ## 业务规则
   *
   * ### 启动规则
   * - 按照依赖关系顺序启动投射器
   * - 处理投射器启动失败的情况
   * - 提供启动过程的监控
   * - 支持投射器的健康检查
   *
   * @returns Promise<StartupResult>
   * @throws {Error} 当启动失败时抛出
   *
   * @example
   * ```typescript
   * const result = await manager.startAllProjectors();
   * console.log(`启动了${result.startedCount}个投射器`);
   * ```
   */
  startAllProjectors(): Promise<StartupResult>;

  /**
   * 停止所有投射器
   *
   * @description 停止所有正在运行的投射器
   *
   * ## 业务规则
   *
   * ### 停止规则
   * - 优雅地停止投射器
   * - 等待正在处理的事件完成
   * - 处理投射器停止失败的情况
   * - 清理投射器的资源
   *
   * @returns Promise<ShutdownResult>
   * @throws {Error} 当停止失败时抛出
   *
   * @example
   * ```typescript
   * const result = await manager.stopAllProjectors();
   * console.log(`停止了${result.stoppedCount}个投射器`);
   * ```
   */
  stopAllProjectors(): Promise<ShutdownResult>;

  /**
   * 分发事件给投射器
   *
   * @description 将事件分发给相应的投射器进行处理
   *
   * ## 业务规则
   *
   * ### 分发规则
   * - 根据事件类型分发给相应的投射器
   * - 支持并行处理多个投射器
   * - 处理投射器处理失败的情况
   * - 提供分发结果的监控
   *
   * @param event 要分发的领域事件
   * @returns Promise<EventDistributionResult>
   * @throws {Error} 当分发失败时抛出
   *
   * @example
   * ```typescript
   * const result = await manager.distributeEvent(userCreatedEvent);
   * console.log(`分发给${result.distributedCount}个投射器`);
   * ```
   */
  distributeEvent(event: BaseDomainEvent): Promise<EventDistributionResult>;

  /**
   * 批量分发事件给投射器
   *
   * @description 批量分发多个事件给相应的投射器进行处理
   *
   * @param events 要分发的事件列表
   * @returns Promise<BatchEventDistributionResult>
   * @throws {Error} 当批量分发失败时抛出
   *
   * @example
   * ```typescript
   * const result = await manager.distributeEventsBatch([event1, event2, event3]);
   * console.log(`分发了${result.totalEvents}个事件`);
   * ```
   */
  distributeEventsBatch(
    events: BaseDomainEvent[]
  ): Promise<BatchEventDistributionResult>;

  /**
   * 获取投射器状态
   *
   * @description 获取所有投射器的状态信息
   *
   * @returns Promise<ProjectorManagerStatus>
   *
   * @example
   * ```typescript
   * const status = await manager.getStatus();
   * console.log(`注册了${status.registeredCount}个投射器`);
   * ```
   */
  getStatus(): Promise<ProjectorManagerStatus>;

  /**
   * 获取投射器信息
   *
   * @description 获取指定投射器的详细信息
   *
   * @param projectorName 投射器名称
   * @returns Promise<ProjectorInfo | null>
   *
   * @example
   * ```typescript
   * const info = await manager.getProjectorInfo('userProjector');
   * if (info) {
   *   console.log(`投射器状态: ${info.status}`);
   * }
   * ```
   */
  getProjectorInfo(projectorName: string): Promise<ProjectorInfo | null>;

  /**
   * 重建所有投射器
   *
   * @description 重建所有投射器的读模型
   *
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号
   * @returns Promise<RebuildAllResult>
   * @throws {Error} 当重建失败时抛出
   *
   * @example
   * ```typescript
   * const result = await manager.rebuildAllProjectors(0, 1000);
   * console.log(`重建了${result.rebuiltCount}个投射器`);
   * ```
   */
  rebuildAllProjectors(
    fromVersion?: number,
    toVersion?: number
  ): Promise<RebuildAllResult>;
}

/**
 * 投射器注册选项
 *
 * @description 投射器注册时的配置选项
 */
export interface ProjectorRegistrationOptions {
  /** 依赖的投射器名称列表 */
  dependencies?: string[];
  /** 是否自动启动 */
  autoStart?: boolean;
  /** 投射器配置 */
  config?: Record<string, any>;
  /** 处理的事件类型列表 */
  eventTypes?: string[];
  /** 优先级（数字越小优先级越高） */
  priority?: number;
}

/**
 * 启动结果
 *
 * @description 投射器启动的结果信息
 */
export interface StartupResult {
  /** 启动的投射器数量 */
  startedCount: number;
  /** 启动失败的投射器数量 */
  failedCount: number;
  /** 启动失败的投射器详情 */
  failedProjectors: Array<{
    name: string;
    error: string;
  }>;
  /** 启动耗时（毫秒） */
  duration: number;
}

/**
 * 停止结果
 *
 * @description 投射器停止的结果信息
 */
export interface ShutdownResult {
  /** 停止的投射器数量 */
  stoppedCount: number;
  /** 停止失败的投射器数量 */
  failedCount: number;
  /** 停止失败的投射器详情 */
  failedProjectors: Array<{
    name: string;
    error: string;
  }>;
  /** 停止耗时（毫秒） */
  duration: number;
}

/**
 * 事件分发结果
 *
 * @description 事件分发的结果信息
 */
export interface EventDistributionResult {
  /** 分发的事件ID */
  eventId: string;
  /** 事件类型 */
  eventType: string;
  /** 分发的投射器数量 */
  distributedCount: number;
  /** 成功处理的投射器数量 */
  processedCount: number;
  /** 处理失败的投射器数量 */
  failedCount: number;
  /** 处理失败的投射器详情 */
  failedProjectors: Array<{
    name: string;
    error: string;
  }>;
  /** 分发耗时（毫秒） */
  duration: number;
}

/**
 * 批量事件分发结果
 *
 * @description 批量事件分发的结果信息
 */
export interface BatchEventDistributionResult {
  /** 分发的事件总数 */
  totalEvents: number;
  /** 成功分发的事件数量 */
  distributedCount: number;
  /** 分发失败的事件数量 */
  failedCount: number;
  /** 分发失败的事件详情 */
  failedEvents: Array<{
    eventId: string;
    eventType: string;
    error: string;
  }>;
  /** 分发耗时（毫秒） */
  duration: number;
}

/**
 * 投射器管理器状态
 *
 * @description 投射器管理器的状态信息
 */
export interface ProjectorManagerStatus {
  /** 注册的投射器数量 */
  registeredCount: number;
  /** 运行中的投射器数量 */
  runningCount: number;
  /** 停止的投射器数量 */
  stoppedCount: number;
  /** 错误的投射器数量 */
  errorCount: number;
  /** 管理器状态 */
  status: 'running' | 'stopped' | 'error';
  /** 最后更新时间 */
  lastUpdated: Date;
  /** 性能统计 */
  performance: {
    /** 平均分发时间（毫秒） */
    averageDistributionTime: number;
    /** 分发速度（事件/秒） */
    distributionRate: number;
    /** 错误率 */
    errorRate: number;
  };
}

/**
 * 投射器信息
 *
 * @description 单个投射器的详细信息
 */
export interface ProjectorInfo {
  /** 投射器名称 */
  name: string;
  /** 投射器状态 */
  status: 'running' | 'stopped' | 'error';
  /** 注册时间 */
  registeredAt: Date;
  /** 最后启动时间 */
  lastStartedAt?: Date;
  /** 最后停止时间 */
  lastStoppedAt?: Date;
  /** 处理的事件总数 */
  totalProcessedEvents: number;
  /** 最后处理时间 */
  lastProcessedAt?: Date;
  /** 错误信息 */
  error?: string;
  /** 依赖的投射器 */
  dependencies: string[];
  /** 处理的事件类型 */
  eventTypes: string[];
  /** 优先级 */
  priority: number;
}

/**
 * 重建所有结果
 *
 * @description 重建所有投射器的结果信息
 */
export interface RebuildAllResult {
  /** 重建的投射器数量 */
  rebuiltCount: number;
  /** 重建失败的投射器数量 */
  failedCount: number;
  /** 重建失败的投射器详情 */
  failedProjectors: Array<{
    name: string;
    error: string;
  }>;
  /** 处理的事件总数 */
  totalProcessedEvents: number;
  /** 重建耗时（毫秒） */
  duration: number;
}
