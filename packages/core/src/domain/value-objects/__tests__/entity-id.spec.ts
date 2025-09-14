import { EntityId } from '../entity-id';

describe('EntityId', () => {
  describe('generate', () => {
    it('应该生成有效的UUID v4格式的EntityId', () => {
      const entityId = EntityId.generate();

      expect(entityId).toBeInstanceOf(EntityId);
      expect(typeof entityId.toString()).toBe('string');
      expect(entityId.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('应该生成不同的EntityId', () => {
      const entityId1 = EntityId.generate();
      const entityId2 = EntityId.generate();

      expect(entityId1.equals(entityId2)).toBe(false);
    });
  });

  describe('fromString', () => {
    it('应该从有效的UUID字符串创建EntityId', () => {
      const uuidString = '123e4567-e89b-12d3-4567-426614174000';
      const entityId = EntityId.fromString(uuidString);

      expect(entityId).toBeInstanceOf(EntityId);
      expect(entityId.toString()).toBe(uuidString);
    });

    it('应该抛出错误当传入无效的UUID格式时', () => {
      const invalidUuid = 'invalid-uuid';

      expect(() => {
        EntityId.fromString(invalidUuid);
      }).toThrow('Invalid EntityId format');
    });

    it('应该抛出错误当传入空字符串时', () => {
      expect(() => {
        EntityId.fromString('');
      }).toThrow('EntityId value must be a non-empty string');
    });

    it('应该抛出错误当传入非字符串类型时', () => {
      expect(() => {
        EntityId.fromString(null as any);
      }).toThrow('EntityId value must be a non-empty string');
    });
  });

  describe('equals', () => {
    it('应该返回true当两个EntityId的值相等时', () => {
      const uuidString = '123e4567-e89b-12d3-4567-426614174000';
      const entityId1 = EntityId.fromString(uuidString);
      const entityId2 = EntityId.fromString(uuidString);

      expect(entityId1.equals(entityId2)).toBe(true);
    });

    it('应该返回false当两个EntityId的值不相等时', () => {
      const entityId1 = EntityId.fromString(
        '123e4567-e89b-12d3-4567-426614174000'
      );
      const entityId2 = EntityId.fromString(
        '123e4567-e89b-12d3-4567-426614174001'
      );

      expect(entityId1.equals(entityId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('应该返回UUID字符串', () => {
      const uuidString = '123e4567-e89b-12d3-4567-426614174000';
      const entityId = EntityId.fromString(uuidString);

      expect(entityId.toString()).toBe(uuidString);
    });
  });

  describe('toJSON', () => {
    it('应该返回UUID字符串', () => {
      const uuidString = '123e4567-e89b-12d3-4567-426614174000';
      const entityId = EntityId.fromString(uuidString);

      expect(entityId.toJSON()).toBe(uuidString);
    });
  });
});
