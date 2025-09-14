import { Result } from '../common';

describe('Result', () => {
  describe('success', () => {
    it('应该创建成功结果', () => {
      const result = Result.success('test value');

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe('test value');
      expect(result.error).toBeUndefined();
    });

    it('应该支持不同类型的值', () => {
      const stringResult = Result.success('string');
      const numberResult = Result.success(123);
      const objectResult = Result.success({ key: 'value' });

      expect(stringResult.value).toBe('string');
      expect(numberResult.value).toBe(123);
      expect(objectResult.value).toEqual({ key: 'value' });
    });
  });

  describe('failure', () => {
    it('应该创建失败结果', () => {
      const error = new Error('test error');
      const result = Result.failure(error);

      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.value).toBeUndefined();
      expect(result.error).toBe(error);
    });

    it('应该支持不同类型的错误', () => {
      const errorResult = Result.failure(new Error('error'));
      const stringResult = Result.failure('string error');
      const numberResult = Result.failure(500);

      expect(errorResult.error).toBeInstanceOf(Error);
      expect(stringResult.error).toBe('string error');
      expect(numberResult.error).toBe(500);
    });
  });

  describe('类型安全', () => {
    it('应该正确推断成功结果的类型', () => {
      const result: Result<string> = Result.success('test');

      if (result.isSuccess) {
        // TypeScript应该知道这里result.value是string类型
        expect(typeof result.value).toBe('string');
        expect(result.value.length).toBe(4);
      }
    });

    it('应该正确推断失败结果的类型', () => {
      const result: Result<string> = Result.failure(new Error('test'));

      if (result.isFailure) {
        // TypeScript应该知道这里result.error是Error类型
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('test');
      }
    });
  });
});
