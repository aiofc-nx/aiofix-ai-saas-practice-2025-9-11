import { BaseException } from '../base.exception';

/**
 * 测试用的异常类
 */
class TestException extends BaseException {
  constructor(message: string, context?: Record<string, any>) {
    super('TEST_ERROR', message, context);
  }
}

describe('BaseException', () => {
  describe('构造函数', () => {
    it('应该创建异常实例', () => {
      const exception = new TestException('测试错误');

      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(BaseException);
      expect(exception.code).toBe('TEST_ERROR');
      expect(exception.message).toBe('测试错误');
      expect(exception.context).toEqual({});
      expect(exception.timestamp).toBeInstanceOf(Date);
    });

    it('应该设置上下文信息', () => {
      const context = { userId: '123', action: 'test' };
      const exception = new TestException('测试错误', context);

      expect(exception.context).toEqual(context);
    });

    it('应该设置原始异常', () => {
      const originalError = new Error('原始错误');
      const exception = new TestException('测试错误', {}, originalError);

      expect(exception.stack).toBeDefined();
      expect(exception.stack).toContain('原始错误');
    });
  });

  describe('toJSON', () => {
    it('应该返回异常的JSON表示', () => {
      const context = { userId: '123' };
      const exception = new TestException('测试错误', context);

      const json = exception.toJSON();

      expect(json.name).toBe('TestException');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.message).toBe('测试错误');
      expect(json.context).toEqual(context);
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });
  });

  describe('getSummary', () => {
    it('应该返回异常摘要', () => {
      const exception = new TestException('测试错误');

      const summary = exception.getSummary();

      expect(summary).toBe('TestException[TEST_ERROR]: 测试错误');
    });
  });

  describe('继承行为', () => {
    it('应该保持异常类型', () => {
      const exception = new TestException('测试错误');

      expect(exception.name).toBe('TestException');
      expect(exception.constructor.name).toBe('TestException');
    });
  });
});
