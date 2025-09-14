import { BaseEntity } from '../base.entity';
import { EntityId } from '../../value-objects/entity-id';

/**
 * 测试用的实体实现
 */
class TestEntity extends BaseEntity {
  constructor(
    id: EntityId,
    public name: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
  }

  updateName(newName: string): void {
    this.name = newName;
    this.updateTimestamp();
  }
}

describe('BaseEntity', () => {
  let entity: TestEntity;
  let entityId: EntityId;
  let createdAt: Date;
  let updatedAt: Date;

  beforeEach(() => {
    entityId = EntityId.generate();
    createdAt = new Date('2024-01-01T00:00:00.000Z');
    updatedAt = new Date('2024-01-01T01:00:00.000Z');
    entity = new TestEntity(entityId, '测试实体', createdAt, updatedAt);
  });

  describe('构造函数', () => {
    it('应该创建实体实例', () => {
      expect(entity).toBeInstanceOf(BaseEntity);
      expect(entity).toBeInstanceOf(TestEntity);
      expect(entity.getId()).toEqual(entityId);
      expect(entity.getCreatedAt()).toEqual(createdAt);
      expect(entity.getUpdatedAt()).toEqual(updatedAt);
    });

    it('应该使用默认时间戳', () => {
      const now = new Date();
      const defaultEntity = new TestEntity(entityId, '测试实体');

      expect(defaultEntity.getCreatedAt().getTime()).toBeCloseTo(
        now.getTime(),
        -2
      );
      expect(defaultEntity.getUpdatedAt().getTime()).toBeCloseTo(
        now.getTime(),
        -2
      );
    });
  });

  describe('getId', () => {
    it('应该返回实体标识符', () => {
      expect(entity.getId()).toEqual(entityId);
    });
  });

  describe('getCreatedAt', () => {
    it('应该返回创建时间', () => {
      expect(entity.getCreatedAt()).toEqual(createdAt);
    });
  });

  describe('getUpdatedAt', () => {
    it('应该返回更新时间', () => {
      expect(entity.getUpdatedAt()).toEqual(updatedAt);
    });
  });

  describe('updateTimestamp', () => {
    it('应该更新实体的时间戳', () => {
      const beforeUpdate = entity.getUpdatedAt();

      // 等待一小段时间确保时间戳不同
      setTimeout(() => {
        entity.updateName('新名称');
        const afterUpdate = entity.getUpdatedAt();

        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });
  });

  describe('equals', () => {
    it('应该返回true当两个实体的ID相等时', () => {
      const entity2 = new TestEntity(entityId, '不同的名称');

      expect(entity.equals(entity2)).toBe(true);
    });

    it('应该返回false当两个实体的ID不相等时', () => {
      const entity2 = new TestEntity(EntityId.generate(), '相同的名称');

      expect(entity.equals(entity2)).toBe(false);
    });

    it('应该返回false当与null比较时', () => {
      expect(entity.equals(null as any)).toBe(false);
    });

    it('应该返回false当与undefined比较时', () => {
      expect(entity.equals(undefined as any)).toBe(false);
    });

    it('应该返回true当与自身比较时', () => {
      expect(entity.equals(entity)).toBe(true);
    });

    it('应该返回false当与不同类型的实体比较时', () => {
      class DifferentEntity extends BaseEntity {
        constructor(id: EntityId) {
          super(id);
        }
      }

      const differentEntity = new DifferentEntity(entityId);
      expect(entity.equals(differentEntity)).toBe(false);
    });
  });

  describe('toString', () => {
    it('应该返回实体的字符串表示', () => {
      const str = entity.toString();
      expect(str).toContain('TestEntity');
      expect(str).toContain(entityId.toString());
    });
  });

  describe('toJSON', () => {
    it('应该返回实体的JSON表示', () => {
      const json = entity.toJSON();

      expect(json).toEqual({
        id: entityId.toString(),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
    });
  });
});
