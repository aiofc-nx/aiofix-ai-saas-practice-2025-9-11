import { BaseDomainEvent } from '../../domain/events/base.domain-event';
import { EntityId } from '../../domain/value-objects/entity-id';

/**
 * 事件存储接口
 *
 * 事件存储是事件驱动架构的核心组件，负责持久化领域事件。
 * 支持事件的保存、查询、重放等功能，为事件溯源提供基础。
 *
 * @description 事件存储的接口定义，提供事件持久化的标准接口
 */
export interface IEventStore {
  /**
   * 保存事件
   *
   * @description 将领域事件保存到事件存储
   * @param aggregateId 聚合根ID
   * @param events 要保存的事件数组
   * @param expectedVersion 期望的版本号
   * @returns Promise<void>
   */
  saveEvents(
    aggregateId: EntityId,
    events: BaseDomainEvent[],
    expectedVersion: number
  ): Promise<void>;

  /**
   * 获取事件流
   *
   * @description 获取指定聚合根的所有事件
   * @param aggregateId 聚合根ID
   * @returns Promise<BaseDomainEvent[]> 事件数组
   */
  getEvents(aggregateId: EntityId): Promise<BaseDomainEvent[]>;

  /**
   * 获取事件流（指定版本范围）
   *
   * @description 获取指定聚合根在指定版本范围内的事件
   * @param aggregateId 聚合根ID
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号
   * @returns Promise<BaseDomainEvent[]> 事件数组
   */
  getEventsFromVersion(
    aggregateId: EntityId,
    fromVersion: number,
    toVersion?: number
  ): Promise<BaseDomainEvent[]>;

  /**
   * 获取最新版本号
   *
   * @description 获取指定聚合根的最新版本号
   * @param aggregateId 聚合根ID
   * @returns Promise<number> 最新版本号
   */
  getLatestVersion(aggregateId: EntityId): Promise<number>;

  /**
   * 检查聚合根是否存在
   *
   * @description 检查指定聚合根是否存在于事件存储中
   * @param aggregateId 聚合根ID
   * @returns Promise<boolean> 是否存在
   */
  exists(aggregateId: EntityId): Promise<boolean>;
}

/**
 * 内存事件存储实现
 *
 * 基于内存的事件存储实现，用于测试和开发环境。
 * 提供完整的事件存储功能，但不提供持久化。
 *
 * @description 内存事件存储的具体实现，提供事件的内存存储功能
 *
 * @example
 * ```typescript
 * const eventStore = new InMemoryEventStore();
 *
 * // 保存事件
 * await eventStore.saveEvents(aggregateId, events, 0);
 *
 * // 获取事件
 * const events = await eventStore.getEvents(aggregateId);
 * ```
 */
export class InMemoryEventStore implements IEventStore {
  private readonly events = new Map<string, BaseDomainEvent[]>();
  private readonly versions = new Map<string, number>();

  /**
   * 保存事件
   *
   * @description 将领域事件保存到内存存储
   * @param aggregateId 聚合根ID
   * @param events 要保存的事件数组
   * @param expectedVersion 期望的版本号
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * const aggregateId = EntityId.generate();
   * const events = [new UserCreatedEvent(userData)];
   * await eventStore.saveEvents(aggregateId, events, 0);
   * ```
   */
  public async saveEvents(
    aggregateId: EntityId,
    events: BaseDomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    const aggregateIdStr = aggregateId.toString();
    const currentVersion = this.versions.get(aggregateIdStr) ?? -1;

    // 检查版本冲突
    if (currentVersion !== expectedVersion) {
      throw new Error(
        `Version conflict for aggregate ${aggregateIdStr}. Expected: ${expectedVersion}, Current: ${currentVersion}`
      );
    }

    // 保存事件
    const existingEvents = this.events.get(aggregateIdStr) || [];
    this.events.set(aggregateIdStr, [...existingEvents, ...events]);

    // 更新版本号
    this.versions.set(aggregateIdStr, currentVersion + events.length);
  }

  /**
   * 获取事件流
   *
   * @description 获取指定聚合根的所有事件
   * @param aggregateId 聚合根ID
   * @returns Promise<BaseDomainEvent[]> 事件数组
   *
   * @example
   * ```typescript
   * const events = await eventStore.getEvents(aggregateId);
   * console.log(`获取到 ${events.length} 个事件`);
   * ```
   */
  public async getEvents(aggregateId: EntityId): Promise<BaseDomainEvent[]> {
    const aggregateIdStr = aggregateId.toString();
    return this.events.get(aggregateIdStr) || [];
  }

  /**
   * 获取事件流（指定版本范围）
   *
   * @description 获取指定聚合根在指定版本范围内的事件
   * @param aggregateId 聚合根ID
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号
   * @returns Promise<BaseDomainEvent[]> 事件数组
   *
   * @example
   * ```typescript
   * // 获取版本1到5的事件
   * const events = await eventStore.getEventsFromVersion(aggregateId, 1, 5);
   *
   * // 获取版本2之后的所有事件
   * const events = await eventStore.getEventsFromVersion(aggregateId, 2);
   * ```
   */
  public async getEventsFromVersion(
    aggregateId: EntityId,
    fromVersion: number,
    toVersion?: number
  ): Promise<BaseDomainEvent[]> {
    const allEvents = await this.getEvents(aggregateId);

    if (allEvents.length === 0) {
      return [];
    }

    const startIndex = Math.max(0, fromVersion);
    const endIndex =
      toVersion !== undefined
        ? Math.min(allEvents.length - 1, toVersion)
        : allEvents.length - 1;

    if (startIndex > endIndex) {
      return [];
    }

    return allEvents.slice(startIndex, endIndex + 1);
  }

  /**
   * 获取最新版本号
   *
   * @description 获取指定聚合根的最新版本号
   * @param aggregateId 聚合根ID
   * @returns Promise<number> 最新版本号
   *
   * @example
   * ```typescript
   * const latestVersion = await eventStore.getLatestVersion(aggregateId);
   * console.log(`最新版本: ${latestVersion}`);
   * ```
   */
  public async getLatestVersion(aggregateId: EntityId): Promise<number> {
    const aggregateIdStr = aggregateId.toString();
    return this.versions.get(aggregateIdStr) ?? -1;
  }

  /**
   * 检查聚合根是否存在
   *
   * @description 检查指定聚合根是否存在于事件存储中
   * @param aggregateId 聚合根ID
   * @returns Promise<boolean> 是否存在
   *
   * @example
   * ```typescript
   * const exists = await eventStore.exists(aggregateId);
   * if (exists) {
   *   console.log('聚合根存在');
   * }
   * ```
   */
  public async exists(aggregateId: EntityId): Promise<boolean> {
    const aggregateIdStr = aggregateId.toString();
    return (
      this.events.has(aggregateIdStr) &&
      this.events.get(aggregateIdStr)!.length > 0
    );
  }

  /**
   * 清除所有事件
   *
   * @description 清除内存中的所有事件（仅用于测试）
   *
   * @example
   * ```typescript
   * eventStore.clear(); // 仅用于测试
   * ```
   */
  public clear(): void {
    this.events.clear();
    this.versions.clear();
  }

  /**
   * 获取所有聚合根ID
   *
   * @description 获取所有存在于事件存储中的聚合根ID（仅用于测试）
   * @returns 聚合根ID数组
   *
   * @example
   * ```typescript
   * const aggregateIds = eventStore.getAllAggregateIds();
   * console.log(`共有 ${aggregateIds.length} 个聚合根`);
   * ```
   */
  public getAllAggregateIds(): EntityId[] {
    return Array.from(this.events.keys()).map((id) => EntityId.fromString(id));
  }

  /**
   * 获取事件统计信息
   *
   * @description 获取事件存储的统计信息（仅用于测试）
   * @returns 统计信息
   *
   * @example
   * ```typescript
   * const stats = eventStore.getStats();
   * console.log('事件存储统计:', stats);
   * ```
   */
  public getStats(): {
    totalAggregates: number;
    totalEvents: number;
    averageEventsPerAggregate: number;
  } {
    const totalAggregates = this.events.size;
    const totalEvents = Array.from(this.events.values()).reduce(
      (sum, events) => sum + events.length,
      0
    );

    return {
      totalAggregates,
      totalEvents,
      averageEventsPerAggregate:
        totalAggregates > 0 ? totalEvents / totalAggregates : 0,
    };
  }
}
