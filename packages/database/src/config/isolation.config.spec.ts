/**
 * @file isolation.config.spec.ts
 * @description 隔离配置服务单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IsolationConfigService, IsolationStrategy } from './isolation.config';

describe('IsolationConfigService', () => {
  let service: IsolationConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    service = new IsolationConfigService(mockConfigService as any);
    configService = mockConfigService as any;
  });

  describe('getStrategy', () => {
    it('should return TABLE_LEVEL as default strategy', () => {
      // 模拟环境变量未设置
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const strategy = service.getStrategy();
      expect(strategy).toBe(IsolationStrategy.TABLE_LEVEL);
    });

    it('should return DATABASE_LEVEL when configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue('database_level');

      const strategy = service.getStrategy();
      expect(strategy).toBe(IsolationStrategy.DATABASE_LEVEL);
    });

    it('should return SCHEMA_LEVEL when configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue('schema_level');

      const strategy = service.getStrategy();
      expect(strategy).toBe(IsolationStrategy.SCHEMA_LEVEL);
    });

    it('should return TABLE_LEVEL when configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue('table_level');

      const strategy = service.getStrategy();
      expect(strategy).toBe(IsolationStrategy.TABLE_LEVEL);
    });

    it('should throw error for invalid strategy', () => {
      jest.spyOn(configService, 'get').mockReturnValue('INVALID_STRATEGY');

      expect(() => service.getStrategy()).toThrow(
        'Invalid isolation strategy: INVALID_STRATEGY',
      );
    });
  });

  describe('getConnectionConfig', () => {
    beforeEach(() => {
      // 设置默认环境变量
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const defaults: Record<string, string> = {
          PLATFORM_DB_NAME: 'aiofix_platform',
          EVENTS_DB_NAME: 'aiofix_events',
          AI_VECTORS_DB_NAME: 'aiofix_ai_vectors',
          TENANT_DB_PREFIX: 'tenant_',
          TENANT_SCHEMA_PREFIX: 'tenant_',
          SHARED_SCHEMA_NAME: 'shared',
        };
        return defaults[key];
      });
    });

    it('should return platform database config for TABLE_LEVEL strategy', () => {
      jest
        .spyOn(service, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);

      const config = service.getConnectionConfig('tenant-123');

      expect(config).toEqual({
        database: 'aiofix_platform',
        tenantId: 'tenant-123',
      });
    });

    it('should return tenant database config for DATABASE_LEVEL strategy', () => {
      jest.spyOn(service, 'isDatabaseLevel').mockReturnValue(true);
      jest
        .spyOn(service, 'getTenantDatabaseName')
        .mockReturnValue('tenant_tenant-123');

      const config = service.getConnectionConfig('tenant-123');

      expect(config).toEqual({
        database: 'tenant_tenant-123',
        tenantId: 'tenant-123',
      });
    });

    it('should return schema config for SCHEMA_LEVEL strategy', () => {
      jest.spyOn(service, 'isSchemaLevel').mockReturnValue(true);
      jest
        .spyOn(service, 'getPlatformDatabaseName')
        .mockReturnValue('aiofix_platform');
      jest
        .spyOn(service, 'getTenantSchemaName')
        .mockReturnValue('tenant_tenant-123');

      const config = service.getConnectionConfig('tenant-123');

      expect(config).toEqual({
        database: 'aiofix_platform',
        schema: 'tenant_tenant-123',
        tenantId: 'tenant-123',
      });
    });

    it('should return platform config when no tenantId provided', () => {
      jest
        .spyOn(service, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);

      const config = service.getConnectionConfig();

      expect(config).toEqual({
        database: 'aiofix_platform',
      });
    });
  });

  describe('shouldEnableRLS', () => {
    it('should return true by default', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const result = service.shouldEnableRLS();
      expect(result).toBe(true);
    });

    it('should return true when strategy is TABLE_LEVEL', () => {
      jest.spyOn(configService, 'get').mockReturnValue('table_level');

      const result = service.shouldEnableRLS();
      expect(result).toBe(true);
    });

    it('should return false when strategy is DATABASE_LEVEL', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'DATA_ISOLATION_STRATEGY') return 'database_level';
        if (key === 'ENABLE_RLS') return 'false';
        return undefined;
      });

      const result = service.shouldEnableRLS();
      expect(result).toBe(false);
    });
  });

  describe('getDatabaseNames', () => {
    beforeEach(() => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const defaults: Record<string, string> = {
          PLATFORM_DB_NAME: 'aiofix_platform',
          EVENTS_DB_NAME: 'aiofix_events',
          AI_VECTORS_DB_NAME: 'aiofix_ai_vectors',
        };
        return defaults[key];
      });
    });

    it('should return correct database names', () => {
      expect(service.getPlatformDatabaseName()).toBe('aiofix_platform');
      expect(service.getEventsDatabaseName()).toBe('aiofix_events');
      expect(service.getAiVectorsDatabaseName()).toBe('aiofix_ai_vectors');
    });
  });

  describe('getTenantIdField', () => {
    it('should return default tenant field name', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const fieldName = service.getTenantIdField();
      expect(fieldName).toBe('tenant_id');
    });

    it('should return configured tenant field name', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'DATA_ISOLATION_STRATEGY') return 'table_level';
        if (key === 'TENANT_ID_FIELD') return 'custom_tenant_id';
        return undefined;
      });

      const fieldName = service.getTenantIdField();
      expect(fieldName).toBe('custom_tenant_id');
    });
  });

  describe('shouldAutoAddTenantCondition', () => {
    it('should return true by default', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const result = service.shouldAutoAddTenantCondition();
      expect(result).toBe(true);
    });

    it('should return configured value', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'DATA_ISOLATION_STRATEGY') return 'table_level';
        if (key === 'AUTO_ADD_TENANT_CONDITION') return 'false';
        return undefined;
      });

      const result = service.shouldAutoAddTenantCondition();
      expect(result).toBe(false);
    });
  });
});
