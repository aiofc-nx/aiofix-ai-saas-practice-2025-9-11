import { DomainEvent } from '../../domain/aggregates/base.aggregate-root';
// 这些导入暂时未使用，但保留以备将来扩展使用
// import { EntityId } from '../../domain/value-objects/entity-id';
// import { TenantId } from '../../domain/value-objects/tenant-id';
// import { OrganizationId } from '../../domain/value-objects/organization-id';
// import { UserId } from '../../domain/value-objects/user-id';

/**
 * 事件工具类
 *
 * 提供领域事件的创建、验证和管理功能。
 * 支持各种类型的事件创建和验证，确保事件的一致性和有效性。
 *
 * @description 事件工具类，提供事件相关的工具方法
 *
 * ## 业务规则
 *
 * ### 事件创建规则
 * - 事件必须具有唯一的标识符
 * - 事件必须包含聚合根ID
 * - 事件必须包含发生时间
 * - 事件必须包含事件类型
 * - 事件必须符合领域事件接口
 *
 * ### 事件验证规则
 * - 验证事件的基本属性
 * - 验证事件的业务规则
 * - 验证事件的时间戳
 * - 验证事件的版本号
 * - 验证事件的租户上下文
 *
 * ## 业务逻辑流程
 *
 * 1. **事件创建**：根据事件类型创建事件实例
 * 2. **属性验证**：验证事件的基本属性
 * 3. **业务验证**：验证事件的业务规则
 * 4. **时间戳设置**：设置事件的发生时间
 * 5. **版本管理**：管理事件的版本号
 *
 * @example
 * ```typescript
 * // 创建领域事件
 * const event = EventUtils.createEvent(UserCreatedEvent, {
 *   aggregateId: EntityId.generate(),
 *   tenantId: TenantId.generate(),
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 *
 * // 验证事件
 * const isValid = EventUtils.validateEvent(event);
 * if (isValid) {
 *   // 事件有效
 * }
 * ```
 *
 * @since 1.0.0
 */
export class EventUtils {
  /**
   * 创建领域事件
   *
   * @description 根据事件类型和参数创建领域事件实例
   * @param eventClass 事件类构造函数
   * @param params 事件参数
   * @returns 创建的事件实例
   * @throws {Error} 当参数无效时抛出异常
   *
   * @example
   * ```typescript
   * const event = EventUtils.createEvent(UserCreatedEvent, {
   *   aggregateId: EntityId.generate(),
   *   tenantId: TenantId.generate(),
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  static createEvent<T extends DomainEvent>(
    eventClass: new (...args: any[]) => T,
    params: any
  ): T {
    try {
      return new eventClass(params);
    } catch (error) {
      throw new Error(
        `Failed to create event ${eventClass.name}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 验证领域事件
   *
   * @description 验证领域事件的基本属性和业务规则
   * @param event 要验证的事件
   * @returns 如果事件有效则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isValid = EventUtils.validateEvent(event);
   * if (!isValid) {
   *   // 事件无效
   * }
   * ```
   */
  static validateEvent(event: DomainEvent): boolean {
    try {
      // 验证事件ID
      if (!event.eventId || !event.eventId.toString()) {
        return false;
      }

      // 验证聚合根ID
      if (!event.aggregateId || !event.aggregateId.toString()) {
        return false;
      }

      // 验证发生时间
      if (!event.occurredOn || !(event.occurredOn instanceof Date)) {
        return false;
      }

      // 验证事件类型
      if (!event.eventType || typeof event.eventType !== 'string') {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证事件列表
   *
   * @description 验证事件列表中的所有事件
   * @param events 要验证的事件列表
   * @returns 如果所有事件都有效则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isValid = EventUtils.validateEvents([event1, event2, event3]);
   * if (!isValid) {
   *   // 存在无效事件
   * }
   * ```
   */
  static validateEvents(events: DomainEvent[]): boolean {
    if (!Array.isArray(events)) {
      return false;
    }

    return events.every((event) => this.validateEvent(event));
  }

  /**
   * 按聚合根ID分组事件
   *
   * @description 将事件列表按聚合根ID分组
   * @param events 要分组的事件列表
   * @returns 按聚合根ID分组的事件映射
   *
   * @example
   * ```typescript
   * const groupedEvents = EventUtils.groupEventsByAggregateId(events);
   * console.log(groupedEvents.get('aggregate-1')); // 输出聚合根1的所有事件
   * ```
   */
  static groupEventsByAggregateId(
    events: DomainEvent[]
  ): Map<string, DomainEvent[]> {
    const grouped = new Map<string, DomainEvent[]>();

    events.forEach((event) => {
      const aggregateId = event.aggregateId.toString();
      if (!grouped.has(aggregateId)) {
        grouped.set(aggregateId, []);
      }
      grouped.get(aggregateId)!.push(event);
    });

    return grouped;
  }

  /**
   * 按租户ID分组事件
   *
   * @description 将事件列表按租户ID分组
   * @param events 要分组的事件列表
   * @returns 按租户ID分组的事件映射
   *
   * @example
   * ```typescript
   * const groupedEvents = EventUtils.groupEventsByTenantId(events);
   * console.log(groupedEvents.get('tenant-1')); // 输出租户1的所有事件
   * ```
   */
  static groupEventsByTenantId(
    events: DomainEvent[]
  ): Map<string, DomainEvent[]> {
    const grouped = new Map<string, DomainEvent[]>();

    events.forEach((event) => {
      // 假设事件有租户ID属性
      const tenantId = (event as any).tenantId?.toString();
      if (tenantId) {
        if (!grouped.has(tenantId)) {
          grouped.set(tenantId, []);
        }
        grouped.get(tenantId)!.push(event);
      }
    });

    return grouped;
  }

  /**
   * 按事件类型分组事件
   *
   * @description 将事件列表按事件类型分组
   * @param events 要分组的事件列表
   * @returns 按事件类型分组的事件映射
   *
   * @example
   * ```typescript
   * const groupedEvents = EventUtils.groupEventsByType(events);
   * console.log(groupedEvents.get('UserCreatedEvent')); // 输出所有用户创建事件
   * ```
   */
  static groupEventsByType(events: DomainEvent[]): Map<string, DomainEvent[]> {
    const grouped = new Map<string, DomainEvent[]>();

    events.forEach((event) => {
      const eventType = event.eventType;
      if (!grouped.has(eventType)) {
        grouped.set(eventType, []);
      }
      grouped.get(eventType)!.push(event);
    });

    return grouped;
  }

  /**
   * 过滤事件
   *
   * @description 根据条件过滤事件列表
   * @param events 要过滤的事件列表
   * @param predicate 过滤条件函数
   * @returns 过滤后的事件列表
   *
   * @example
   * ```typescript
   * // 过滤用户相关事件
   * const userEvents = EventUtils.filterEvents(events, event =>
   *   event.eventType.startsWith('User')
   * );
   *
   * // 过滤特定租户的事件
   * const tenantEvents = EventUtils.filterEvents(events, event =>
   *   (event as any).tenantId?.equals(tenantId)
   * );
   * ```
   */
  static filterEvents(
    events: DomainEvent[],
    predicate: (event: DomainEvent) => boolean
  ): DomainEvent[] {
    return events.filter(predicate);
  }

  /**
   * 排序事件
   *
   * @description 根据发生时间排序事件列表
   * @param events 要排序的事件列表
   * @param ascending 是否升序排列，默认为true
   * @returns 排序后的事件列表
   *
   * @example
   * ```typescript
   * // 按时间升序排序
   * const sortedEvents = EventUtils.sortEventsByTime(events);
   *
   * // 按时间降序排序
   * const reverseSortedEvents = EventUtils.sortEventsByTime(events, false);
   * ```
   */
  static sortEventsByTime(
    events: DomainEvent[],
    ascending: boolean = true
  ): DomainEvent[] {
    return [...events].sort((a, b) => {
      const timeA = a.occurredOn.getTime();
      const timeB = b.occurredOn.getTime();
      return ascending ? timeA - timeB : timeB - timeA;
    });
  }

  /**
   * 获取事件统计信息
   *
   * @description 获取事件列表的统计信息
   * @param events 要统计的事件列表
   * @returns 事件统计信息
   *
   * @example
   * ```typescript
   * const stats = EventUtils.getEventStats(events);
   * console.log(`总事件数: ${stats.totalEvents}`);
   * console.log(`事件类型数: ${stats.eventTypeCount}`);
   * console.log(`聚合根数: ${stats.aggregateCount}`);
   * ```
   */
  static getEventStats(events: DomainEvent[]): {
    totalEvents: number;
    eventTypeCount: number;
    aggregateCount: number;
    eventTypes: string[];
    aggregateIds: string[];
    timeRange: {
      earliest: Date | null;
      latest: Date | null;
    };
  } {
    if (events.length === 0) {
      return {
        totalEvents: 0,
        eventTypeCount: 0,
        aggregateCount: 0,
        eventTypes: [],
        aggregateIds: [],
        timeRange: {
          earliest: null,
          latest: null,
        },
      };
    }

    const eventTypes = new Set<string>();
    const aggregateIds = new Set<string>();
    let earliestTime: Date | null = null;
    let latestTime: Date | null = null;

    events.forEach((event) => {
      eventTypes.add(event.eventType);
      aggregateIds.add(event.aggregateId.toString());

      const eventTime = event.occurredOn;
      if (!earliestTime || eventTime < earliestTime) {
        earliestTime = eventTime;
      }
      if (!latestTime || eventTime > latestTime) {
        latestTime = eventTime;
      }
    });

    return {
      totalEvents: events.length,
      eventTypeCount: eventTypes.size,
      aggregateCount: aggregateIds.size,
      eventTypes: Array.from(eventTypes),
      aggregateIds: Array.from(aggregateIds),
      timeRange: {
        earliest: earliestTime,
        latest: latestTime,
      },
    };
  }

  /**
   * 序列化事件
   *
   * @description 将事件序列化为JSON字符串
   * @param event 要序列化的事件
   * @returns 序列化后的事件JSON字符串
   *
   * @example
   * ```typescript
   * const serialized = EventUtils.serializeEvent(event);
   * console.log(serialized); // 输出事件的JSON字符串
   * ```
   */
  static serializeEvent(event: DomainEvent): string {
    try {
      return JSON.stringify(event, null, 2);
    } catch (error) {
      throw new Error(`Failed to serialize event: ${(error as Error).message}`);
    }
  }

  /**
   * 反序列化事件
   *
   * @description 从JSON字符串反序列化事件
   * @param json 事件的JSON字符串
   * @param eventClass 事件类构造函数
   * @returns 反序列化后的事件实例
   *
   * @example
   * ```typescript
   * const event = EventUtils.deserializeEvent(json, UserCreatedEvent);
   * ```
   */
  static deserializeEvent<T extends DomainEvent>(
    json: string,
    eventClass: new (...args: any[]) => T
  ): T {
    try {
      const data = JSON.parse(json);
      return new eventClass(data);
    } catch (error) {
      throw new Error(
        `Failed to deserialize event: ${(error as Error).message}`
      );
    }
  }

  /**
   * 批量序列化事件
   *
   * @description 批量序列化事件列表
   * @param events 要序列化的事件列表
   * @returns 序列化后的事件JSON字符串数组
   *
   * @example
   * ```typescript
   * const serializedEvents = EventUtils.serializeEvents(events);
   * serializedEvents.forEach(serialized => console.log(serialized));
   * ```
   */
  static serializeEvents(events: DomainEvent[]): string[] {
    return events.map((event) => this.serializeEvent(event));
  }

  /**
   * 批量反序列化事件
   *
   * @description 批量反序列化事件列表
   * @param jsonArray 事件的JSON字符串数组
   * @param eventClass 事件类构造函数
   * @returns 反序列化后的事件实例数组
   *
   * @example
   * ```typescript
   * const events = EventUtils.deserializeEvents(jsonArray, UserCreatedEvent);
   * ```
   */
  static deserializeEvents<T extends DomainEvent>(
    jsonArray: string[],
    eventClass: new (...args: any[]) => T
  ): T[] {
    return jsonArray.map((json) => this.deserializeEvent(json, eventClass));
  }
}
