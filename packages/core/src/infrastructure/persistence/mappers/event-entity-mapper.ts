import { BaseDomainEvent } from '../../../domain/events/base.domain-event';
import { EventDatabaseEntity } from '../entities/event-database-entity';

/**
 * 事件实体映射器
 *
 * 事件实体映射器提供领域事件和事件数据库实体之间的映射功能。
 * 处理事件的序列化、反序列化和元数据管理。
 *
 * @description 领域事件和事件数据库实体之间的映射器
 * 提供事件的持久化存储和查询功能
 *
 * ## 业务规则
 *
 * ### 事件映射规则
 * - 事件ID使用数据库自增ID
 * - 聚合根ID保持字符串格式
 * - 事件版本号保持整数格式
 * - 事件数据以JSON格式存储
 *
 * ### 元数据映射规则
 * - 事件元数据以JSON格式存储
 * - 租户ID、组织ID、部门ID可选
 * - 事件发生时间保持时间戳格式
 * - 事件处理状态跟踪
 *
 * ### 序列化规则
 * - 事件数据完整序列化
 * - 保持事件类型的完整性
 * - 处理复杂对象结构
 * - 支持版本兼容性
 *
 * ## 业务逻辑流程
 *
 * 1. **事件验证**：验证领域事件的有效性
 * 2. **数据映射**：映射事件的基本信息
 * 3. **元数据映射**：映射事件的元数据信息
 * 4. **序列化**：序列化事件数据
 * 5. **存储准备**：准备数据库存储格式
 *
 * @example
 * ```typescript
 * const eventMapper = new EventEntityMapper();
 *
 * // 将领域事件转换为数据库实体
 * const domainEvent = new UserCreatedEvent(aggregateId, tenantId, userId, name, email);
 * const databaseEvent = eventMapper.toDatabase(domainEvent);
 *
 * // 将数据库实体转换为领域事件
 * const domainEvent = eventMapper.toDomain(databaseEvent);
 * ```
 *
 * @since 1.0.0
 */
export class EventEntityMapper {
  /**
   * 将领域事件转换为事件数据库实体
   *
   * @description 将领域事件转换为对应的事件数据库实体
   * 处理事件数据的序列化和元数据映射
   *
   * @param domainEvent 领域事件
   * @returns 事件数据库实体
   * @throws {Error} 当转换失败时抛出
   *
   * @example
   * ```typescript
   * const domainEvent = new UserCreatedEvent(aggregateId, tenantId, userId, name, email);
   * const databaseEvent = eventMapper.toDatabase(domainEvent);
   * ```
   */
  public toDatabase(domainEvent: BaseDomainEvent): EventDatabaseEntity {
    if (!domainEvent) {
      throw new Error('Domain event cannot be null or undefined');
    }

    try {
      const databaseEvent = new EventDatabaseEntity();

      // 映射基本信息
      databaseEvent.aggregateId = domainEvent.getAggregateId().toString();
      databaseEvent.aggregateType = domainEvent.constructor.name.replace(
        'Event',
        ''
      );
      databaseEvent.version = 1; // 默认版本号，实际应该从聚合根获取
      databaseEvent.eventType = domainEvent.constructor.name;
      databaseEvent.occurredAt = domainEvent.getOccurredOn();

      // 序列化事件数据
      databaseEvent.eventData = this.serializeEventData(domainEvent);

      // 映射元数据
      databaseEvent.eventMetadata = this.mapEventMetadata(domainEvent);

      // 映射租户信息
      this.mapTenantInfo(domainEvent, databaseEvent);

      // 设置处理状态
      databaseEvent.processingStatus = 'pending';
      databaseEvent.retryCount = 0;
      databaseEvent.maxRetries = 3;

      return databaseEvent;
    } catch (error) {
      throw new Error(
        `Failed to convert domain event to database entity: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * 将事件数据库实体转换为领域事件
   *
   * @description 将事件数据库实体转换为对应的领域事件
   * 处理事件数据的反序列化和类型重建
   *
   * @param databaseEvent 事件数据库实体
   * @returns 领域事件
   * @throws {Error} 当转换失败时抛出
   *
   * @example
   * ```typescript
   * const databaseEvent = await eventRepository.findById(eventId);
   * const domainEvent = eventMapper.toDomain(databaseEvent);
   * ```
   */
  public toDomain(databaseEvent: EventDatabaseEntity): BaseDomainEvent {
    if (!databaseEvent) {
      throw new Error('Database event cannot be null or undefined');
    }

    try {
      // 验证必要字段
      this.validateDatabaseEvent(databaseEvent);

      // 创建领域事件实例
      const domainEvent = this.createDomainEvent(databaseEvent);

      return domainEvent;
    } catch (error) {
      throw new Error(
        `Failed to convert database event to domain event: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * 批量将领域事件转换为事件数据库实体
   *
   * @description 批量转换领域事件列表为事件数据库实体列表
   * 提供高效的批量转换功能
   *
   * @param domainEvents 领域事件列表
   * @returns 事件数据库实体列表
   * @throws {Error} 当转换失败时抛出
   *
   * @example
   * ```typescript
   * const domainEvents = [event1, event2, event3];
   * const databaseEvents = eventMapper.toDatabaseBatch(domainEvents);
   * ```
   */
  public toDatabaseBatch(
    domainEvents: BaseDomainEvent[]
  ): EventDatabaseEntity[] {
    if (!domainEvents || domainEvents.length === 0) {
      return [];
    }

    try {
      return domainEvents.map((event) => this.toDatabase(event));
    } catch (error) {
      throw new Error(
        `Failed to convert domain events batch: ${(error as Error).message}`
      );
    }
  }

  /**
   * 批量将事件数据库实体转换为领域事件
   *
   * @description 批量转换事件数据库实体列表为领域事件列表
   * 提供高效的批量转换功能
   *
   * @param databaseEvents 事件数据库实体列表
   * @returns 领域事件列表
   * @throws {Error} 当转换失败时抛出
   *
   * @example
   * ```typescript
   * const databaseEvents = await eventRepository.findAll();
   * const domainEvents = eventMapper.toDomainBatch(databaseEvents);
   * ```
   */
  public toDomainBatch(
    databaseEvents: EventDatabaseEntity[]
  ): BaseDomainEvent[] {
    if (!databaseEvents || databaseEvents.length === 0) {
      return [];
    }

    try {
      return databaseEvents.map((event) => this.toDomain(event));
    } catch (error) {
      throw new Error(
        `Failed to convert database events batch: ${(error as Error).message}`
      );
    }
  }

  /**
   * 序列化事件数据
   *
   * @description 将领域事件的数据序列化为JSON格式
   * 用于存储到数据库中
   *
   * @param domainEvent 领域事件
   * @returns 序列化后的事件数据
   * @protected
   */
  protected serializeEventData(domainEvent: BaseDomainEvent): any {
    try {
      // 获取事件的所有属性
      const eventData = { ...domainEvent };

      // 移除不需要序列化的属性
      delete (eventData as any)['aggregateId'];
      delete (eventData as any)['eventId'];
      delete (eventData as any)['occurredOn'];

      return JSON.parse(JSON.stringify(eventData));
    } catch (error) {
      throw new Error(
        `Failed to serialize event data: ${(error as Error).message}`
      );
    }
  }

  /**
   * 映射事件元数据
   *
   * @description 映射领域事件的元数据信息
   * 包括事件来源、处理信息等
   *
   * @param domainEvent 领域事件
   * @returns 事件元数据
   * @protected
   */
  protected mapEventMetadata(domainEvent: BaseDomainEvent): any {
    return {
      aggregateType: domainEvent.constructor.name.replace('Event', ''),
      eventType: domainEvent.constructor.name,
      version: 1, // 默认版本号
      occurredAt: domainEvent.getOccurredOn().toISOString(),
      source: 'domain',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 映射租户信息
   *
   * @description 映射事件的租户相关信息
   * 包括租户ID、组织ID、部门ID等
   *
   * @param domainEvent 领域事件
   * @param databaseEvent 事件数据库实体
   * @protected
   */
  protected mapTenantInfo(
    domainEvent: BaseDomainEvent,
    databaseEvent: EventDatabaseEntity
  ): void {
    // 映射租户ID（如果事件支持）
    if (
      'getTenantId' in domainEvent &&
      typeof domainEvent.getTenantId === 'function'
    ) {
      databaseEvent.tenantId = domainEvent.getTenantId().toString();
    }

    // 映射组织ID（如果事件支持）
    if (
      'getOrganizationId' in domainEvent &&
      typeof domainEvent.getOrganizationId === 'function'
    ) {
      databaseEvent.organizationId = domainEvent.getOrganizationId().toString();
    }

    // 映射部门ID（如果事件支持）
    if (
      'getDepartmentId' in domainEvent &&
      typeof domainEvent.getDepartmentId === 'function'
    ) {
      databaseEvent.departmentId = domainEvent.getDepartmentId().toString();
    }
  }

  /**
   * 验证事件数据库实体
   *
   * @description 验证事件数据库实体的必要字段是否有效
   *
   * @param databaseEvent 事件数据库实体
   * @protected
   * @throws {Error} 当字段无效时抛出
   */
  protected validateDatabaseEvent(databaseEvent: EventDatabaseEntity): void {
    if (!databaseEvent.aggregateId) {
      throw new Error('Database event aggregate ID is required');
    }

    if (!databaseEvent.eventType) {
      throw new Error('Database event type is required');
    }

    if (
      typeof databaseEvent.version !== 'number' ||
      databaseEvent.version < 0
    ) {
      throw new Error('Database event version must be a non-negative number');
    }

    if (!databaseEvent.eventData) {
      throw new Error('Database event data is required');
    }

    if (!databaseEvent.occurredAt) {
      throw new Error('Database event occurred date is required');
    }
  }

  /**
   * 创建领域事件实例
   *
   * @description 根据事件数据库实体创建领域事件实例
   * 这是一个抽象方法，需要根据具体的事件类型实现
   *
   * @param databaseEvent 事件数据库实体
   * @returns 领域事件实例
   * @protected
   * @abstract
   */
  protected createDomainEvent(
    databaseEvent: EventDatabaseEntity
  ): BaseDomainEvent {
    // 这里需要根据具体的事件类型实现
    // 由于事件的类型是动态的，这个实现会比较复杂
    // 可以考虑使用工厂模式或者注册机制来处理
    throw new Error(
      'createDomainEvent method must be implemented by concrete event mapper'
    );
  }
}
