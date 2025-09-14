import { BaseAggregateRoot, DomainEvent } from '../base.aggregate-root';
import { EntityId } from '../../value-objects/entity-id';

/**
 * 测试用的领域事件实现
 */
class TestDomainEvent implements DomainEvent {
  constructor(
    public readonly eventId: EntityId,
    public readonly aggregateId: EntityId,
    public readonly occurredOn: Date,
    public readonly eventType: string,
    public readonly data: any
  ) {}
}

/**
 * 测试用的聚合根实现
 */
class TestAggregateRoot extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    public name: string,
    createdAt?: Date,
    updatedAt?: Date,
    version: number = 0
  ) {
    super(id, createdAt, updatedAt, version);
  }

  updateName(newName: string): void {
    this.name = newName;
    this.updateTimestamp();
    this.addDomainEvent(
      new TestDomainEvent(
        EntityId.generate(),
        this.getId(),
        new Date(),
        'NameUpdated',
        { oldName: this.name, newName }
      )
    );
  }

  addTestEvent(): void {
    this.addDomainEvent(
      new TestDomainEvent(
        EntityId.generate(),
        this.getId(),
        new Date(),
        'TestEvent',
        { message: 'test' }
      )
    );
  }
}

describe('BaseAggregateRoot', () => {
  let aggregate: TestAggregateRoot;
  let aggregateId: EntityId;
  let createdAt: Date;
  let updatedAt: Date;

  beforeEach(() => {
    aggregateId = EntityId.generate();
    createdAt = new Date('2024-01-01T00:00:00.000Z');
    updatedAt = new Date('2024-01-01T01:00:00.000Z');
    aggregate = new TestAggregateRoot(
      aggregateId,
      '测试聚合根',
      createdAt,
      updatedAt,
      1
    );
  });

  describe('构造函数', () => {
    it('应该创建聚合根实例', () => {
      expect(aggregate).toBeInstanceOf(BaseAggregateRoot);
      expect(aggregate).toBeInstanceOf(TestAggregateRoot);
      expect(aggregate.getId()).toEqual(aggregateId);
      expect(aggregate.getCreatedAt()).toEqual(createdAt);
      expect(aggregate.getUpdatedAt()).toEqual(updatedAt);
      expect(aggregate.getVersion()).toBe(1);
    });

    it('应该使用默认版本号', () => {
      const defaultAggregate = new TestAggregateRoot(aggregateId, '测试');
      expect(defaultAggregate.getVersion()).toBe(0);
    });
  });

  describe('getVersion', () => {
    it('应该返回版本号', () => {
      expect(aggregate.getVersion()).toBe(1);
    });
  });

  describe('setVersion', () => {
    it('应该设置版本号', () => {
      aggregate.setVersion(5);
      expect(aggregate.getVersion()).toBe(5);
    });
  });

  describe('incrementVersion', () => {
    it('应该增加版本号', () => {
      const initialVersion = aggregate.getVersion();
      aggregate.incrementVersion();
      expect(aggregate.getVersion()).toBe(initialVersion + 1);
    });
  });

  describe('addDomainEvent', () => {
    it('应该添加领域事件', () => {
      const event = new TestDomainEvent(
        EntityId.generate(),
        aggregateId,
        new Date(),
        'TestEvent',
        { message: 'test' }
      );

      aggregate.addDomainEvent(event);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBe(event);
    });

    it('应该添加多个领域事件', () => {
      aggregate.addTestEvent();
      aggregate.addTestEvent();

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(2);
    });
  });

  describe('getUncommittedEvents', () => {
    it('应该返回未提交的领域事件', () => {
      aggregate.addTestEvent();

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('TestEvent');
    });

    it('应该返回事件副本', () => {
      aggregate.addTestEvent();

      const events1 = aggregate.getUncommittedEvents();
      const events2 = aggregate.getUncommittedEvents();

      expect(events1).not.toBe(events2);
      expect(events1).toEqual(events2);
    });
  });

  describe('markEventsAsCommitted', () => {
    it('应该清空未提交的事件', () => {
      aggregate.addTestEvent();
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);

      aggregate.markEventsAsCommitted();
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('hasUncommittedEvents', () => {
    it('应该返回false当没有未提交事件时', () => {
      expect(aggregate.hasUncommittedEvents()).toBe(false);
    });

    it('应该返回true当有未提交事件时', () => {
      aggregate.addTestEvent();
      expect(aggregate.hasUncommittedEvents()).toBe(true);
    });
  });

  describe('getUncommittedEventCount', () => {
    it('应该返回未提交事件数量', () => {
      expect(aggregate.getUncommittedEventCount()).toBe(0);

      aggregate.addTestEvent();
      expect(aggregate.getUncommittedEventCount()).toBe(1);

      aggregate.addTestEvent();
      expect(aggregate.getUncommittedEventCount()).toBe(2);
    });
  });

  describe('updateTimestamp', () => {
    it('应该更新时间戳并增加版本号', () => {
      const initialVersion = aggregate.getVersion();
      const beforeUpdate = aggregate.getUpdatedAt();

      // 等待一小段时间确保时间戳不同
      setTimeout(() => {
        aggregate.updateName('新名称');
        const afterUpdate = aggregate.getUpdatedAt();

        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
        expect(aggregate.getVersion()).toBe(initialVersion + 1);
      }, 10);
    });
  });

  describe('toJSON', () => {
    it('应该返回聚合根的JSON表示', () => {
      const json = aggregate.toJSON();

      expect(json).toEqual({
        id: aggregateId.toString(),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        version: 1,
        uncommittedEventCount: 0,
      });
    });

    it('应该包含未提交事件数量', () => {
      aggregate.addTestEvent();

      const json = aggregate.toJSON();
      expect(json.uncommittedEventCount).toBe(1);
    });
  });
});
