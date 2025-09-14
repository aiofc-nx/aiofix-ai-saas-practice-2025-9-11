import { ValueObject } from '../value-object';

/**
 * 测试用的值对象实现
 */
class TestValueObject extends ValueObject<string> {
  constructor(private readonly value: string) {
    super();
  }

  protected getValue(): string {
    return this.value;
  }
}

describe('ValueObject', () => {
  describe('equals', () => {
    it('应该返回true当两个值对象的值相等时', () => {
      const value1 = new TestValueObject('test');
      const value2 = new TestValueObject('test');

      expect(value1.equals(value2)).toBe(true);
    });

    it('应该返回false当两个值对象的值不相等时', () => {
      const value1 = new TestValueObject('test1');
      const value2 = new TestValueObject('test2');

      expect(value1.equals(value2)).toBe(false);
    });

    it('应该返回false当与null比较时', () => {
      const value = new TestValueObject('test');

      expect(value.equals(null as any)).toBe(false);
    });

    it('应该返回false当与undefined比较时', () => {
      const value = new TestValueObject('test');

      expect(value.equals(undefined as any)).toBe(false);
    });

    it('应该返回true当与自身比较时', () => {
      const value = new TestValueObject('test');

      expect(value.equals(value)).toBe(true);
    });
  });

  describe('toString', () => {
    it('应该返回值的字符串表示', () => {
      const value = new TestValueObject('test');

      expect(value.toString()).toBe('test');
    });
  });

  describe('toJSON', () => {
    it('应该返回值的JSON表示', () => {
      const value = new TestValueObject('test');

      expect(value.toJSON()).toBe('test');
    });
  });
});
