/// <reference types="jest" />

// 声明 Jest 全局变量
declare global {
  const describe: any;
  const it: any;
  const expect: any;
  const beforeEach: any;
  const afterEach: any;
  const beforeAll: any;
  const afterAll: any;
}

import { QueryBus } from '../query-bus';
import { IQueryHandler, BaseQuery } from '../../../application/queries';
import { ResultType, Result } from '../../../shared/types/common';
import { EntityId } from '../../../domain/value-objects/entity-id';

/**
 * 测试用的查询
 */
class TestQuery extends BaseQuery {
  constructor(public readonly id: string, queryId?: EntityId) {
    super(queryId || EntityId.generate());
  }
}

/**
 * 测试用的查询处理器
 */
class TestQueryHandler implements IQueryHandler<TestQuery, string> {
  public handledQueries: TestQuery[] = [];
  public shouldThrowError = false;
  public shouldReturnFailure = false;
  public processingTime = 0;

  async handle(query: TestQuery): Promise<ResultType<string>> {
    if (this.shouldThrowError) {
      throw new Error('Handler error');
    }

    if (this.shouldReturnFailure) {
      return Result.failure(new Error('Query failed'));
    }

    // 模拟处理时间
    if (this.processingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.processingTime));
    }

    this.handledQueries.push(query);
    return Result.success(`Query result: ${query.id}`);
  }

  getQueryType(): new (...args: any[]) => TestQuery {
    return TestQuery;
  }
}

describe('QueryBus', () => {
  let queryBus: QueryBus;

  beforeEach(() => {
    queryBus = new QueryBus();
  });

  describe('register', () => {
    it('应该注册查询处理器', () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      expect(queryBus.isRegistered('TestQuery')).toBe(true);
    });

    it('应该防止重复注册', () => {
      const handler1 = new TestQueryHandler();
      const handler2 = new TestQueryHandler();

      queryBus.register(handler1);

      expect(() => queryBus.register(handler2)).toThrow(
        'Handler for query type TestQuery is already registered'
      );
    });
  });

  describe('unregister', () => {
    it('应该注销查询处理器', () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      expect(queryBus.isRegistered('TestQuery')).toBe(true);

      queryBus.unregister(handler);

      expect(queryBus.isRegistered('TestQuery')).toBe(false);
    });
  });

  describe('execute', () => {
    it('应该执行查询并返回成功结果', async () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const query = new TestQuery('test-id');
      const result = await queryBus.execute(query);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('Query result: test-id');
      expect(handler.handledQueries).toHaveLength(1);
      expect(handler.handledQueries[0]).toBe(query);
    });

    it('应该处理查询执行失败', async () => {
      const handler = new TestQueryHandler();
      handler.shouldReturnFailure = true;
      queryBus.register(handler);

      const query = new TestQuery('test-id');
      const result = await queryBus.execute(query);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Query failed');
    });

    it('应该处理处理器异常', async () => {
      const handler = new TestQueryHandler();
      handler.shouldThrowError = true;
      queryBus.register(handler);

      const query = new TestQuery('test-id');
      const result = await queryBus.execute(query);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Handler error');
    });

    it('应该在没有处理器时返回错误', async () => {
      const query = new TestQuery('test-id');
      const result = await queryBus.execute(query);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe(
        'No handler registered for query type: TestQuery'
      );
    });

    it('应该支持缓存功能', async () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const query = new TestQuery('test-id');

      // 第一次执行
      const result1 = await queryBus.execute(query, { cache: true });
      expect(result1.isSuccess).toBe(true);
      expect(handler.handledQueries).toHaveLength(1);

      // 第二次执行应该从缓存获取
      const result2 = await queryBus.execute(query, { cache: true });
      expect(result2.isSuccess).toBe(true);
      expect(result2.value).toBe(result1.value);
      expect(handler.handledQueries).toHaveLength(1); // 处理器没有被调用
    });

    it('应该处理查询超时', async () => {
      const handler = new TestQueryHandler();
      handler.processingTime = 1000; // 1秒处理时间
      queryBus.register(handler);

      const query = new TestQuery('test-id');
      const result = await queryBus.execute(query, { timeout: 100 }); // 100ms超时

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('Query execution timeout');
    });
  });

  describe('executeBatch', () => {
    it('应该并行执行查询', async () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const queries = [
        new TestQuery('id1'),
        new TestQuery('id2'),
        new TestQuery('id3'),
      ];

      const results = await queryBus.executeBatch(queries, { parallel: true });

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.isSuccess).toBe(true);
      });
      expect(handler.handledQueries).toHaveLength(3);
    });

    it('应该串行执行查询', async () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const queries = [
        new TestQuery('id1'),
        new TestQuery('id2'),
        new TestQuery('id3'),
      ];

      const results = await queryBus.executeBatch(queries, { parallel: false });

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.isSuccess).toBe(true);
      });
      expect(handler.handledQueries).toHaveLength(3);
    });

    it('应该支持批量查询缓存', async () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const queries = [
        new TestQuery('id1'),
        new TestQuery('id2'),
        new TestQuery('id3'),
      ];

      // 第一次执行
      const results1 = await queryBus.executeBatch(queries, { cache: true });
      expect(results1).toHaveLength(3);
      expect(handler.handledQueries).toHaveLength(3);

      // 第二次执行应该从缓存获取
      const results2 = await queryBus.executeBatch(queries, { cache: true });
      expect(results2).toHaveLength(3);
      expect(handler.handledQueries).toHaveLength(3); // 处理器没有被再次调用
    });
  });

  describe('缓存管理', () => {
    it('应该清除缓存', async () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const query = new TestQuery('test-id');

      // 第一次执行并缓存
      await queryBus.execute(query, { cache: true });
      expect(handler.handledQueries).toHaveLength(1);

      // 清除缓存
      queryBus.clearCache();

      // 第二次执行应该重新调用处理器
      await queryBus.execute(query, { cache: true });
      expect(handler.handledQueries).toHaveLength(2);
    });
  });

  describe('统计信息', () => {
    it('应该跟踪处理统计信息', async () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const query = new TestQuery('test-id');
      await queryBus.execute(query);

      const stats = queryBus.getProcessingStats();
      expect(stats['TestQuery']).toBeDefined();
      expect(stats['TestQuery'].successCount).toBe(1);
      expect(stats['TestQuery'].failureCount).toBe(0);
      expect(stats['TestQuery'].cacheHitCount).toBe(0);
    });

    it('应该跟踪缓存命中统计', async () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const query = new TestQuery('test-id');

      // 第一次执行
      await queryBus.execute(query, { cache: true });

      // 第二次执行（缓存命中）
      await queryBus.execute(query, { cache: true });

      const stats = queryBus.getProcessingStats();
      expect(stats['TestQuery'].successCount).toBe(1);
      expect(stats['TestQuery'].cacheHitCount).toBe(1);
      expect(stats['TestQuery'].cacheHitRate).toBe(0.5);
    });

    it('应该清除统计信息', async () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const query = new TestQuery('test-id');
      await queryBus.execute(query);

      queryBus.clearStats();

      const stats = queryBus.getProcessingStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });

  describe('工具方法', () => {
    it('应该获取注册的查询类型', () => {
      const handler = new TestQueryHandler();
      queryBus.register(handler);

      const queryTypes = queryBus.getRegisteredQueryTypes();
      expect(queryTypes).toContain('TestQuery');
    });
  });
});
