import { BaseDomainEvent } from '../../../domain/events/base.domain-event';
import { BaseEventProjector } from './base-event-projector.interface';
import {
  EventProjectorManager,
  ProjectorRegistrationOptions,
  StartupResult,
  ShutdownResult,
  EventDistributionResult,
  BatchEventDistributionResult,
  ProjectorManagerStatus,
  ProjectorInfo,
  RebuildAllResult,
} from './event-projector-manager.interface';

/**
 * 事件投射器管理器
 *
 * 事件投射器管理器负责管理和协调多个事件投射器的运行。
 * 提供投射器的注册、启动、停止、监控等功能。
 *
 * @description 事件投射器管理器的实现
 * 提供投射器管理的通用功能和最佳实践
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
 * const manager = new EventProjectorManagerImpl();
 *
 * // 注册投射器
 * await manager.registerProjector(userProjector, {
 *   dependencies: ['tenantProjector'],
 *   autoStart: true
 * });
 *
 * // 启动所有投射器
 * await manager.startAllProjectors();
 *
 * // 分发事件
 * await manager.distributeEvent(userCreatedEvent);
 * ```
 *
 * @since 1.0.0
 */
export class EventProjectorManagerImpl implements EventProjectorManager {
  private readonly projectors: Map<string, ProjectorInfo> = new Map();
  private readonly projectorInstances: Map<
    string,
    BaseEventProjector<any, any>
  > = new Map();
  private readonly eventTypeMapping: Map<string, string[]> = new Map();
  private readonly dependencies: Map<string, string[]> = new Map();
  private readonly distributionTimes: number[] = [];
  private managerStatus: 'running' | 'stopped' | 'error' = 'stopped';
  private lastUpdated: Date = new Date();

  /**
   * 注册事件投射器
   *
   * @description 注册一个事件投射器到管理器中
   * @param projector 事件投射器实例
   * @param options 注册选项
   * @returns Promise<void>
   * @throws {Error} 当注册失败时抛出
   */
  public async registerProjector<TEvent extends BaseDomainEvent, TReadModel>(
    projector: BaseEventProjector<TEvent, TReadModel>,
    options: ProjectorRegistrationOptions = {}
  ): Promise<void> {
    if (!projector) {
      throw new Error('Projector cannot be null or undefined');
    }

    const projectorName = projector.constructor.name;

    if (this.projectors.has(projectorName)) {
      throw new Error(`Projector ${projectorName} is already registered`);
    }

    try {
      // 验证依赖关系
      if (options.dependencies) {
        await this.validateDependencies(options.dependencies);
      }

      // 创建投射器信息
      const projectorInfo: ProjectorInfo = {
        name: projectorName,
        status: 'stopped',
        registeredAt: new Date(),
        totalProcessedEvents: 0,
        dependencies: options.dependencies || [],
        eventTypes: options.eventTypes || [],
        priority: options.priority || 0,
      };

      // 注册投射器
      this.projectors.set(projectorName, projectorInfo);
      this.projectorInstances.set(projectorName, projector);
      this.dependencies.set(projectorName, options.dependencies || []);

      // 建立事件类型映射
      if (options.eventTypes) {
        for (const eventType of options.eventTypes) {
          if (!this.eventTypeMapping.has(eventType)) {
            this.eventTypeMapping.set(eventType, []);
          }
          this.eventTypeMapping.get(eventType)!.push(projectorName);
        }
      }

      this.lastUpdated = new Date();

      console.log(`Projector ${projectorName} registered successfully`);

      // 自动启动（如果配置）
      if (options.autoStart) {
        await this.startProjector(projectorName);
      }
    } catch (error) {
      throw new Error(
        `Failed to register projector ${projectorName}: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * 注销事件投射器
   *
   * @description 从管理器中注销一个事件投射器
   * @param projectorName 投射器名称
   * @returns Promise<void>
   * @throws {Error} 当注销失败时抛出
   */
  public async unregisterProjector(projectorName: string): Promise<void> {
    if (!projectorName) {
      throw new Error('Projector name cannot be null or undefined');
    }

    if (!this.projectors.has(projectorName)) {
      throw new Error(`Projector ${projectorName} is not registered`);
    }

    try {
      // 停止投射器
      await this.stopProjector(projectorName);

      // 移除事件类型映射
      const projectorInfo = this.projectors.get(projectorName)!;
      for (const eventType of projectorInfo.eventTypes) {
        const projectors = this.eventTypeMapping.get(eventType);
        if (projectors) {
          const index = projectors.indexOf(projectorName);
          if (index > -1) {
            projectors.splice(index, 1);
          }
          if (projectors.length === 0) {
            this.eventTypeMapping.delete(eventType);
          }
        }
      }

      // 移除投射器
      this.projectors.delete(projectorName);
      this.projectorInstances.delete(projectorName);
      this.dependencies.delete(projectorName);

      this.lastUpdated = new Date();

      console.log(`Projector ${projectorName} unregistered successfully`);
    } catch (error) {
      throw new Error(
        `Failed to unregister projector ${projectorName}: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * 启动所有投射器
   *
   * @description 启动所有已注册的投射器
   * @returns Promise<StartupResult>
   * @throws {Error} 当启动失败时抛出
   */
  public async startAllProjectors(): Promise<StartupResult> {
    const startTime = Date.now();
    const failedProjectors: Array<{ name: string; error: string }> = [];
    let startedCount = 0;

    try {
      this.managerStatus = 'running';

      // 按依赖关系和优先级排序
      const sortedProjectors = this.getSortedProjectors();

      for (const projectorName of sortedProjectors) {
        try {
          await this.startProjector(projectorName);
          startedCount++;
        } catch (error) {
          failedProjectors.push({
            name: projectorName,
            error: (error as Error).message,
          });
        }
      }

      const endTime = Date.now();

      return {
        startedCount,
        failedCount: failedProjectors.length,
        failedProjectors,
        duration: endTime - startTime,
      };
    } catch (error) {
      this.managerStatus = 'error';
      throw new Error(
        `Failed to start all projectors: ${(error as Error).message}`
      );
    }
  }

  /**
   * 停止所有投射器
   *
   * @description 停止所有正在运行的投射器
   * @returns Promise<ShutdownResult>
   * @throws {Error} 当停止失败时抛出
   */
  public async stopAllProjectors(): Promise<ShutdownResult> {
    const startTime = Date.now();
    const failedProjectors: Array<{ name: string; error: string }> = [];
    let stoppedCount = 0;

    try {
      // 按依赖关系的逆序停止
      const sortedProjectors = this.getSortedProjectors().reverse();

      for (const projectorName of sortedProjectors) {
        try {
          await this.stopProjector(projectorName);
          stoppedCount++;
        } catch (error) {
          failedProjectors.push({
            name: projectorName,
            error: (error as Error).message,
          });
        }
      }

      this.managerStatus = 'stopped';

      const endTime = Date.now();

      return {
        stoppedCount,
        failedCount: failedProjectors.length,
        failedProjectors,
        duration: endTime - startTime,
      };
    } catch (error) {
      this.managerStatus = 'error';
      throw new Error(
        `Failed to stop all projectors: ${(error as Error).message}`
      );
    }
  }

  /**
   * 分发事件给投射器
   *
   * @description 将事件分发给相应的投射器进行处理
   * @param event 要分发的领域事件
   * @returns Promise<EventDistributionResult>
   * @throws {Error} 当分发失败时抛出
   */
  public async distributeEvent(
    event: BaseDomainEvent
  ): Promise<EventDistributionResult> {
    if (!event) {
      throw new Error('Event cannot be null or undefined');
    }

    const startTime = Date.now();
    const eventType = event.constructor.name;
    const eventId = event.getEventId().toString();

    try {
      // 获取处理该事件类型的投射器
      const projectorNames = this.eventTypeMapping.get(eventType) || [];
      const failedProjectors: Array<{ name: string; error: string }> = [];
      let processedCount = 0;

      // 并行处理所有相关的投射器
      const promises = projectorNames.map(async (projectorName) => {
        try {
          const projector = this.projectorInstances.get(projectorName);
          if (
            projector &&
            this.projectors.get(projectorName)?.status === 'running'
          ) {
            await (projector as BaseEventProjector<any, any>).handle(event);
            processedCount++;
          }
        } catch (error) {
          failedProjectors.push({
            name: projectorName,
            error: (error as Error).message,
          });
        }
      });

      await Promise.all(promises);

      const endTime = Date.now();
      this.updateDistributionStatistics(endTime - startTime);

      return {
        eventId,
        eventType,
        distributedCount: projectorNames.length,
        processedCount,
        failedCount: failedProjectors.length,
        failedProjectors,
        duration: endTime - startTime,
      };
    } catch (error) {
      throw new Error(
        `Failed to distribute event: ${(error as Error).message}`
      );
    }
  }

  /**
   * 批量分发事件给投射器
   *
   * @description 批量分发多个事件给相应的投射器进行处理
   * @param events 要分发的事件列表
   * @returns Promise<BatchEventDistributionResult>
   * @throws {Error} 当批量分发失败时抛出
   */
  public async distributeEventsBatch(
    events: BaseDomainEvent[]
  ): Promise<BatchEventDistributionResult> {
    if (!events || events.length === 0) {
      return {
        totalEvents: 0,
        distributedCount: 0,
        failedCount: 0,
        failedEvents: [],
        duration: 0,
      };
    }

    const startTime = Date.now();
    const failedEvents: Array<{
      eventId: string;
      eventType: string;
      error: string;
    }> = [];
    let distributedCount = 0;

    try {
      for (const event of events) {
        try {
          await this.distributeEvent(event);
          distributedCount++;
        } catch (error) {
          failedEvents.push({
            eventId: event.getEventId().toString(),
            eventType: event.constructor.name,
            error: (error as Error).message,
          });
        }
      }

      const endTime = Date.now();

      return {
        totalEvents: events.length,
        distributedCount,
        failedCount: failedEvents.length,
        failedEvents,
        duration: endTime - startTime,
      };
    } catch (error) {
      throw new Error(
        `Failed to distribute events batch: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取投射器管理器状态
   *
   * @description 获取所有投射器的状态信息
   * @returns Promise<ProjectorManagerStatus>
   */
  public async getStatus(): Promise<ProjectorManagerStatus> {
    const runningCount = Array.from(this.projectors.values()).filter(
      (p) => p.status === 'running'
    ).length;
    const stoppedCount = Array.from(this.projectors.values()).filter(
      (p) => p.status === 'stopped'
    ).length;
    const errorCount = Array.from(this.projectors.values()).filter(
      (p) => p.status === 'error'
    ).length;

    const averageDistributionTime =
      this.distributionTimes.length > 0
        ? this.distributionTimes.reduce((a, b) => a + b, 0) /
          this.distributionTimes.length
        : 0;

    return {
      registeredCount: this.projectors.size,
      runningCount,
      stoppedCount,
      errorCount,
      status: this.managerStatus,
      lastUpdated: this.lastUpdated,
      performance: {
        averageDistributionTime,
        distributionRate: 0, // 可以添加更复杂的计算
        errorRate: 0, // 可以添加更复杂的计算
      },
    };
  }

  /**
   * 获取投射器信息
   *
   * @description 获取指定投射器的详细信息
   * @param projectorName 投射器名称
   * @returns Promise<ProjectorInfo | null>
   */
  public async getProjectorInfo(
    projectorName: string
  ): Promise<ProjectorInfo | null> {
    return this.projectors.get(projectorName) || null;
  }

  /**
   * 重建所有投射器
   *
   * @description 重建所有投射器的读模型
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号
   * @returns Promise<RebuildAllResult>
   * @throws {Error} 当重建失败时抛出
   */
  public async rebuildAllProjectors(
    fromVersion?: number,
    toVersion?: number
  ): Promise<RebuildAllResult> {
    const startTime = Date.now();
    const failedProjectors: Array<{ name: string; error: string }> = [];
    let rebuiltCount = 0;
    let totalProcessedEvents = 0;

    try {
      const sortedProjectors = this.getSortedProjectors();

      for (const projectorName of sortedProjectors) {
        try {
          const projector = this.projectorInstances.get(projectorName);
          if (projector) {
            const result = await (
              projector as BaseEventProjector<any, any>
            ).rebuild(fromVersion, toVersion);
            totalProcessedEvents += result.processedEvents;
            rebuiltCount++;
          }
        } catch (error) {
          failedProjectors.push({
            name: projectorName,
            error: (error as Error).message,
          });
        }
      }

      const endTime = Date.now();

      return {
        rebuiltCount,
        failedCount: failedProjectors.length,
        failedProjectors,
        totalProcessedEvents,
        duration: endTime - startTime,
      };
    } catch (error) {
      throw new Error(
        `Failed to rebuild all projectors: ${(error as Error).message}`
      );
    }
  }

  /**
   * 启动单个投射器
   *
   * @description 启动指定的投射器
   * @param projectorName 投射器名称
   * @protected
   */
  private async startProjector(projectorName: string): Promise<void> {
    const projectorInfo = this.projectors.get(projectorName);
    if (!projectorInfo) {
      throw new Error(`Projector ${projectorName} not found`);
    }

    if (projectorInfo.status === 'running') {
      return; // 已经在运行
    }

    try {
      // 启动依赖的投射器
      const dependencies = this.dependencies.get(projectorName) || [];
      for (const dependency of dependencies) {
        await this.startProjector(dependency);
      }

      // 启动投射器
      projectorInfo.status = 'running';
      projectorInfo.lastStartedAt = new Date();

      console.log(`Projector ${projectorName} started successfully`);
    } catch (error) {
      projectorInfo.status = 'error';
      projectorInfo.error = (error as Error).message;
      throw error;
    }
  }

  /**
   * 停止单个投射器
   *
   * @description 停止指定的投射器
   * @param projectorName 投射器名称
   * @protected
   */
  private async stopProjector(projectorName: string): Promise<void> {
    const projectorInfo = this.projectors.get(projectorName);
    if (!projectorInfo) {
      throw new Error(`Projector ${projectorName} not found`);
    }

    if (projectorInfo.status === 'stopped') {
      return; // 已经停止
    }

    try {
      // 停止投射器
      projectorInfo.status = 'stopped';
      projectorInfo.lastStoppedAt = new Date();
      projectorInfo.error = undefined;

      console.log(`Projector ${projectorName} stopped successfully`);
    } catch (error) {
      projectorInfo.status = 'error';
      projectorInfo.error = (error as Error).message;
      throw error;
    }
  }

  /**
   * 验证依赖关系
   *
   * @description 验证投射器的依赖关系是否正确
   * @param dependencies 依赖的投射器名称列表
   * @protected
   */
  private async validateDependencies(dependencies: string[]): Promise<void> {
    for (const dependency of dependencies) {
      if (!this.projectors.has(dependency)) {
        throw new Error(`Dependency projector ${dependency} is not registered`);
      }
    }
  }

  /**
   * 获取排序后的投射器列表
   *
   * @description 根据依赖关系和优先级对投射器进行排序
   * @returns string[] 排序后的投射器名称列表
   * @protected
   */
  private getSortedProjectors(): string[] {
    const projectors = Array.from(this.projectors.keys());

    // 简单的拓扑排序
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (projectorName: string) => {
      if (visiting.has(projectorName)) {
        throw new Error(
          `Circular dependency detected involving ${projectorName}`
        );
      }
      if (visited.has(projectorName)) {
        return;
      }

      visiting.add(projectorName);

      const dependencies = this.dependencies.get(projectorName) || [];
      for (const dependency of dependencies) {
        visit(dependency);
      }

      visiting.delete(projectorName);
      visited.add(projectorName);
      sorted.push(projectorName);
    };

    for (const projectorName of projectors) {
      if (!visited.has(projectorName)) {
        visit(projectorName);
      }
    }

    // 按优先级排序
    return sorted.sort((a, b) => {
      const priorityA = this.projectors.get(a)?.priority || 0;
      const priorityB = this.projectors.get(b)?.priority || 0;
      return priorityA - priorityB;
    });
  }

  /**
   * 更新分发统计信息
   *
   * @description 更新事件分发的统计信息
   * @param duration 分发耗时
   * @protected
   */
  private updateDistributionStatistics(duration: number): void {
    this.distributionTimes.push(duration);

    // 保持最近100次的分发时间记录
    if (this.distributionTimes.length > 100) {
      this.distributionTimes.shift();
    }
  }
}
