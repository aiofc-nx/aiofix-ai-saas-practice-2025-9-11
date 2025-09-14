import { InMemoryEventStore } from '../event-store';
import { BaseDomainEvent } from '../../../domain/events/base.domain-event';
import { EntityId } from '../../../domain/value-objects/entity-id';

/**
 * 测试用的领域事件
 */
class TestEvent extends BaseDomainEvent {
  constructor(public readonly data: string) {
    super();
  }
}

describe('InMemoryEventStore', () => {
  let eventStore: InMemoryEventStore;
  let aggregateId: EntityId;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    aggregateId = EntityId.generate();
  });

  afterEach(() => {
    eventStore.clear();
  });

  describe('saveEvents', () => {
    it('应该保存事件到存储', async () => {
      const events = [new TestEvent('event1'), new TestEvent('event2')];

      await eventStore.saveEvents(aggregateId, events, -1);

      const savedEvents = await eventStore.getEvents(aggregateId);
      expect(savedEvents).toHaveLength(2);
      expect(savedEvents[0]).toBe(events[0]);
      expect(savedEvents[1]).toBe(events[1]);
    });

    it('应该更新版本号', async () => {
      const events = [new TestEvent('event1')];

      await eventStore.saveEvents(aggregateId, events, -1);

      const version = await eventStore.getLatestVersion(aggregateId);
      expect(version).toBe(0);
    });

    it('应该检查版本冲突', async () => {
      const events1 = [new TestEvent('event1')];
      const events2 = [new TestEvent('event2')];

      await eventStore.saveEvents(aggregateId, events1, -1);

      await expect(
        eventStore.saveEvents(aggregateId, events2, -1)
      ).rejects.toThrow('Version conflict');
    });

    it('应该允许正确的版本号', async () => {
      const events1 = [new TestEvent('event1')];
      const events2 = [new TestEvent('event2')];

      await eventStore.saveEvents(aggregateId, events1, -1);
      await eventStore.saveEvents(aggregateId, events2, 0);

      const savedEvents = await eventStore.getEvents(aggregateId);
      expect(savedEvents).toHaveLength(2);
    });

    it('应该追加新事件到现有事件流', async () => {
      const events1 = [new TestEvent('event1')];
      const events2 = [new TestEvent('event2'), new TestEvent('event3')];

      await eventStore.saveEvents(aggregateId, events1, -1);
      await eventStore.saveEvents(aggregateId, events2, 0);

      const savedEvents = await eventStore.getEvents(aggregateId);
      expect(savedEvents).toHaveLength(3);
      expect(savedEvents[0].data).toBe('event1');
      expect(savedEvents[1].data).toBe('event2');
      expect(savedEvents[2].data).toBe('event3');
    });
  });

  describe('getEvents', () => {
    it('应该返回空数组当聚合根不存在时', async () => {
      const events = await eventStore.getEvents(aggregateId);
      expect(events).toEqual([]);
    });

    it('应该返回所有事件', async () => {
      const events = [
        new TestEvent('event1'),
        new TestEvent('event2'),
        new TestEvent('event3'),
      ];

      await eventStore.saveEvents(aggregateId, events, -1);

      const savedEvents = await eventStore.getEvents(aggregateId);
      expect(savedEvents).toHaveLength(3);
      expect(savedEvents).toEqual(events);
    });
  });

  describe('getEventsFromVersion', () => {
    it('应该返回指定版本范围的事件', async () => {
      const events = [
        new TestEvent('event1'),
        new TestEvent('event2'),
        new TestEvent('event3'),
        new TestEvent('event4'),
        new TestEvent('event5'),
      ];

      await eventStore.saveEvents(aggregateId, events, -1);

      const eventsFromVersion = await eventStore.getEventsFromVersion(
        aggregateId,
        1,
        3
      );
      expect(eventsFromVersion).toHaveLength(3);
      expect(eventsFromVersion[0].data).toBe('event2');
      expect(eventsFromVersion[1].data).toBe('event3');
      expect(eventsFromVersion[2].data).toBe('event4');
    });

    it('应该返回从指定版本开始的所有事件', async () => {
      const events = [
        new TestEvent('event1'),
        new TestEvent('event2'),
        new TestEvent('event3'),
      ];

      await eventStore.saveEvents(aggregateId, events, -1);

      const eventsFromVersion = await eventStore.getEventsFromVersion(
        aggregateId,
        1
      );
      expect(eventsFromVersion).toHaveLength(2);
      expect(eventsFromVersion[0].data).toBe('event2');
      expect(eventsFromVersion[1].data).toBe('event3');
    });

    it('应该返回空数组当起始版本超出范围时', async () => {
      const events = [new TestEvent('event1')];

      await eventStore.saveEvents(aggregateId, events, -1);

      const eventsFromVersion = await eventStore.getEventsFromVersion(
        aggregateId,
        5
      );
      expect(eventsFromVersion).toEqual([]);
    });

    it('应该返回空数组当聚合根不存在时', async () => {
      const eventsFromVersion = await eventStore.getEventsFromVersion(
        aggregateId,
        0
      );
      expect(eventsFromVersion).toEqual([]);
    });
  });

  describe('getLatestVersion', () => {
    it('应该返回-1当聚合根不存在时', async () => {
      const version = await eventStore.getLatestVersion(aggregateId);
      expect(version).toBe(-1);
    });

    it('应该返回正确的版本号', async () => {
      const events1 = [new TestEvent('event1')];
      const events2 = [new TestEvent('event2')];

      await eventStore.saveEvents(aggregateId, events1, -1);
      expect(await eventStore.getLatestVersion(aggregateId)).toBe(0);

      await eventStore.saveEvents(aggregateId, events2, 0);
      expect(await eventStore.getLatestVersion(aggregateId)).toBe(1);
    });
  });

  describe('exists', () => {
    it('应该返回false当聚合根不存在时', async () => {
      const exists = await eventStore.exists(aggregateId);
      expect(exists).toBe(false);
    });

    it('应该返回true当聚合根存在时', async () => {
      const events = [new TestEvent('event1')];

      await eventStore.saveEvents(aggregateId, events, -1);

      const exists = await eventStore.exists(aggregateId);
      expect(exists).toBe(true);
    });
  });

  describe('工具方法', () => {
    it('应该清除所有事件', async () => {
      const events = [new TestEvent('event1')];
      await eventStore.saveEvents(aggregateId, events, -1);

      expect(await eventStore.exists(aggregateId)).toBe(true);

      eventStore.clear();

      expect(await eventStore.exists(aggregateId)).toBe(false);
    });

    it('应该获取所有聚合根ID', async () => {
      const aggregateId1 = EntityId.generate();
      const aggregateId2 = EntityId.generate();

      await eventStore.saveEvents(aggregateId1, [new TestEvent('event1')], -1);
      await eventStore.saveEvents(aggregateId2, [new TestEvent('event2')], -1);

      const aggregateIds = eventStore.getAllAggregateIds();
      expect(aggregateIds).toHaveLength(2);
      expect(aggregateIds.some((id) => id.equals(aggregateId1))).toBe(true);
      expect(aggregateIds.some((id) => id.equals(aggregateId2))).toBe(true);
    });

    it('应该获取统计信息', async () => {
      const aggregateId1 = EntityId.generate();
      const aggregateId2 = EntityId.generate();

      await eventStore.saveEvents(aggregateId1, [new TestEvent('event1')], -1);
      await eventStore.saveEvents(
        aggregateId2,
        [new TestEvent('event2'), new TestEvent('event3')],
        -1
      );

      const stats = eventStore.getStats();
      expect(stats.totalAggregates).toBe(2);
      expect(stats.totalEvents).toBe(3);
      expect(stats.averageEventsPerAggregate).toBe(1.5);
    });
  });
});
