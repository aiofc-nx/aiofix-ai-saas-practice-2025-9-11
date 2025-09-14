/**
 * @file database-adapter.factory.spec.ts
 * @description 数据库适配器工厂单元测试
 */

import { DatabaseAdapterFactory } from './database-adapter.factory';
import {
  IsolationConfigService,
  IsolationStrategy,
} from '../config/isolation.config';
import { PostgreSQLAdapter } from './postgresql.adapter';

// Mock PostgreSQLAdapter
jest.mock('./postgresql.adapter');
const MockedPostgreSQLAdapter = PostgreSQLAdapter as jest.MockedClass<
  typeof PostgreSQLAdapter
>;

describe('DatabaseAdapterFactory', () => {
  let factory: DatabaseAdapterFactory;
  let isolationConfig: IsolationConfigService;

  beforeEach(async () => {
    // 创建mock ConfigService
    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    // 直接实例化服务以避免循环依赖
    isolationConfig = new IsolationConfigService(mockConfigService as any);
    factory = new DatabaseAdapterFactory(isolationConfig);

    // 重置 mock
    MockedPostgreSQLAdapter.mockClear();
  });

  describe('createAdapter', () => {
    it('should create database level adapter', () => {
      const mockAdapter = {
        setTenantContext: jest.fn(),
      } as any;
      MockedPostgreSQLAdapter.mockImplementation(() => mockAdapter);

      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.DATABASE_LEVEL);
      jest.spyOn(isolationConfig, 'getConnectionConfig').mockReturnValue({
        database: 'tenant_db',
        tenantId: 'tenant-123',
      });

      const adapter = factory.createAdapter('tenant-123');

      expect(MockedPostgreSQLAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'tenant_db',
          username: 'aiofix_user',
          password: 'aiofix_password',
        }),
        null,
        null,
        null,
      );
      expect(adapter).toBe(mockAdapter);
    });

    it('should create schema level adapter', () => {
      const mockAdapter = {
        setDefaultSchema: jest.fn(),
        setTenantContext: jest.fn(),
      } as any;
      MockedPostgreSQLAdapter.mockImplementation(() => mockAdapter);

      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.SCHEMA_LEVEL);
      jest.spyOn(isolationConfig, 'getConnectionConfig').mockReturnValue({
        database: 'platform_db',
        schema: 'tenant_schema',
        tenantId: 'tenant-123',
      });

      const adapter = factory.createAdapter('tenant-123');

      expect(MockedPostgreSQLAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'postgresql',
          database: 'platform_db',
        }),
        null,
        null,
        null,
      );
      expect(mockAdapter.setDefaultSchema).toHaveBeenCalledWith(
        'tenant_schema',
      );
      expect(mockAdapter.setTenantContext).toHaveBeenCalledWith('tenant-123');
    });

    it('should create table level adapter', () => {
      const mockAdapter = {
        setTenantContext: jest.fn(),
        enableRowLevelSecurity: jest.fn(),
      } as any;
      MockedPostgreSQLAdapter.mockImplementation(() => mockAdapter);

      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest.spyOn(isolationConfig, 'getConnectionConfig').mockReturnValue({
        database: 'platform_db',
        tenantId: 'tenant-123',
      });
      jest.spyOn(isolationConfig, 'shouldEnableRLS').mockReturnValue(true);

      const adapter = factory.createAdapter('tenant-123');

      expect(MockedPostgreSQLAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'postgresql',
          database: 'platform_db',
        }),
        null,
        null,
        null,
      );
      expect(mockAdapter.setTenantContext).toHaveBeenCalledWith('tenant-123');
      expect(mockAdapter.enableRowLevelSecurity).toHaveBeenCalled();
    });

    it('should not enable RLS when configured to disable', () => {
      const mockAdapter = {
        setTenantContext: jest.fn(),
        enableRowLevelSecurity: jest.fn(),
      } as any;
      MockedPostgreSQLAdapter.mockImplementation(() => mockAdapter);

      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest.spyOn(isolationConfig, 'getConnectionConfig').mockReturnValue({
        database: 'platform_db',
        tenantId: 'tenant-123',
      });
      jest.spyOn(isolationConfig, 'shouldEnableRLS').mockReturnValue(false);

      factory.createAdapter('tenant-123');

      expect(mockAdapter.setTenantContext).toHaveBeenCalledWith('tenant-123');
      expect(mockAdapter.enableRowLevelSecurity).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported strategy', () => {
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue('UNSUPPORTED' as any);

      expect(() => factory.createAdapter('tenant-123')).toThrow(
        'Unsupported isolation strategy: UNSUPPORTED',
      );
    });
  });

  describe('createPlatformAdapter', () => {
    it('should create platform adapter', () => {
      const mockAdapter = {} as any;
      MockedPostgreSQLAdapter.mockImplementation(() => mockAdapter);

      jest
        .spyOn(isolationConfig, 'getPlatformDatabaseName')
        .mockReturnValue('platform_db');

      const adapter = factory.createPlatformAdapter();

      expect(MockedPostgreSQLAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'platform_db',
          username: 'aiofix_user',
          password: 'aiofix_password',
        }),
        null,
        null,
        null,
      );
      expect(adapter).toBe(mockAdapter);
    });
  });

  describe('createEventsAdapter', () => {
    it('should create events adapter', () => {
      const mockAdapter = {} as any;
      MockedPostgreSQLAdapter.mockImplementation(() => mockAdapter);

      jest
        .spyOn(isolationConfig, 'getEventsDatabaseName')
        .mockReturnValue('events_db');

      const adapter = factory.createEventsAdapter();

      expect(MockedPostgreSQLAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'events_db',
          username: 'aiofix_user',
          password: 'aiofix_password',
        }),
        null,
        null,
        null,
      );
      expect(adapter).toBe(mockAdapter);
    });
  });

  describe('createAiVectorsAdapter', () => {
    it('should create AI vectors adapter with default config', () => {
      const mockAdapter = {} as any;
      MockedPostgreSQLAdapter.mockImplementation(() => mockAdapter);

      jest
        .spyOn(isolationConfig, 'getAiVectorsDatabaseName')
        .mockReturnValue('ai_vectors_db');

      const adapter = factory.createAiVectorsAdapter();

      expect(MockedPostgreSQLAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'ai_vectors_db',
          username: 'aiofix_user',
          password: 'aiofix_password',
        }),
        null,
        null,
        null,
      );
      expect(adapter).toBe(mockAdapter);
    });

    it('should create AI vectors adapter with custom config', () => {
      const mockAdapter = {} as any;
      MockedPostgreSQLAdapter.mockImplementation(() => mockAdapter);

      jest
        .spyOn(isolationConfig, 'getAiVectorsDatabaseName')
        .mockReturnValue('ai_vectors_db');

      // 设置自定义AI向量数据库环境变量
      process.env.AI_VECTORS_HOST = 'ai-host';
      process.env.AI_VECTORS_PORT = '5433';
      process.env.AI_VECTORS_USER = 'ai_user';
      process.env.AI_VECTORS_PASSWORD = 'ai_password';

      const adapter = factory.createAiVectorsAdapter();

      expect(MockedPostgreSQLAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'postgresql',
          host: 'ai-host',
          port: 5433,
          database: 'ai_vectors_db',
          username: 'ai_user',
          password: 'ai_password',
        }),
        null,
        null,
        null,
      );

      // 清理环境变量
      delete process.env.AI_VECTORS_HOST;
      delete process.env.AI_VECTORS_PORT;
      delete process.env.AI_VECTORS_USER;
      delete process.env.AI_VECTORS_PASSWORD;
    });
  });
});
