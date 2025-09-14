/**
 * @file database.config.spec.ts
 * @description 数据库配置服务单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@aiofix/config';
import { PinoLoggerService } from '@aiofix/logging';
import { DatabaseConfig } from './database.config';

describe('DatabaseConfig', () => {
  let service: DatabaseConfig;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      databaseConfig: {
        postgresql: {
          host: 'localhost',
          port: 5432,
          database: 'aiofix_platform',
          username: 'aiofix_user',
          password: 'aiofix_password',
          schema: 'public',
          ssl: false,
        },
        mongodb: {
          uri: 'mongodb://aiofix_admin:aiofix_password@localhost:27017/aiofix_events?authSource=admin',
          database: 'aiofix_events',
          options: {},
        },
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200,
        },
        sync: {
          synchronize: false,
        },
        logging: {
          enabled: false,
        },
      },
    };

    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
    };

    service = new DatabaseConfig(mockConfigService as any, mockLogger as any);
    configService = mockConfigService as any;
  });

  describe('getPostgreSQLConfig', () => {
    it('should return default PostgreSQL configuration', () => {
      const config = service.getPostgresConfig();

      expect(config).toEqual({
        host: 'localhost',
        port: 5432,
        username: 'aiofix_user',
        password: 'aiofix_password',
        database: 'aiofix_platform',
        schema: 'public',
        ssl: false,
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200,
        },
        tenantDatabases: {
          'tenant-1': 'aiofix_tenant_1',
          'tenant-2': 'aiofix_tenant_2',
          'tenant-3': 'aiofix_tenant_3',
        },
        synchronize: false,
        logging: false,
        cache: {
          duration: 30000,
        },
      });
    });

    it('should return configured PostgreSQL configuration', () => {
      // 更新配置
      configService.databaseConfig = {
        postgresql: {
          host: 'custom-host',
          port: 5433,
          username: 'custom_user',
          password: 'custom_password',
          database: 'custom_database',
          schema: 'public',
          ssl: true,
        },
        mongodb: configService.databaseConfig.mongodb,
        pool: {
          min: 5,
          max: 20,
          acquireTimeoutMillis: 60000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200,
        },
        sync: {
          synchronize: true,
        },
        logging: {
          enabled: true,
        },
      };

      const config = service.getPostgresConfig();

      expect(config).toEqual({
        host: 'custom-host',
        port: 5433,
        username: 'custom_user',
        password: 'custom_password',
        database: 'custom_database',
        schema: 'public',
        ssl: true,
        pool: {
          min: 5,
          max: 20,
          acquireTimeoutMillis: 60000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200,
        },
        tenantDatabases: {
          'tenant-1': 'aiofix_tenant_1',
          'tenant-2': 'aiofix_tenant_2',
          'tenant-3': 'aiofix_tenant_3',
        },
        synchronize: true,
        logging: true,
        cache: {
          duration: 30000,
        },
      });
    });

    it('should handle SSL configuration as object', () => {
      // 更新配置以包含 SSL 对象
      configService.databaseConfig.postgresql.ssl = { rejectUnauthorized: false };

      const config = service.getPostgresConfig();

      expect(config.ssl).toEqual({ rejectUnauthorized: false });
    });
  });

  describe('getMongoDBConfig', () => {
    it('should return default MongoDB configuration', () => {
      const config = service.getMongoDBConfig();

      expect(config).toEqual({
        uri: 'mongodb://aiofix_admin:aiofix_password@localhost:27017/aiofix_events?authSource=admin',
        databases: {
          events: 'aiofix_events',
          notifications: 'aiofix_notifications',
        },
        options: {
          maxPoolSize: 10,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          bufferMaxEntries: 0,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
        eventStore: {
          collection: 'domain_events',
          snapshotCollection: 'aggregate_snapshots',
          maxEventsPerSnapshot: 100,
        },
        notifications: {
          collection: 'notifications',
          indexes: [
            { keys: { id: 1 }, options: { unique: true } },
            { keys: { type: 1, status: 1 } },
            { keys: { tenantId: 1, userId: 1 } },
            { keys: { createdAt: 1 } },
          ],
        },
      });
    });

    it('should return configured MongoDB configuration', () => {
      // 更新配置
      configService.databaseConfig.mongodb = {
        uri: 'mongodb://mongo_user:mongo_password@mongo-host:27018/mongo_database?authSource=admin',
        database: 'mongo_database',
        options: {},
      };

      const config = service.getMongoDBConfig();

      expect(config).toEqual({
        uri: 'mongodb://mongo_user:mongo_password@mongo-host:27018/mongo_database?authSource=admin',
        databases: {
          events: 'mongo_database',
          notifications: 'aiofix_notifications',
        },
        options: {
          maxPoolSize: 10,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          bufferMaxEntries: 0,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
        eventStore: {
          collection: 'domain_events',
          snapshotCollection: 'aggregate_snapshots',
          maxEventsPerSnapshot: 100,
        },
        notifications: {
          collection: 'notifications',
          indexes: [
            { keys: { id: 1 }, options: { unique: true } },
            { keys: { type: 1, status: 1 } },
            { keys: { tenantId: 1, userId: 1 } },
            { keys: { createdAt: 1 } },
          ],
        },
      });
    });
  });

  describe('getTenantPostgresConfig', () => {
    it('should return tenant-specific PostgreSQL config', () => {
      const config = service.getTenantPostgresConfig('tenant-1');

      expect(config).toHaveProperty('database');
      expect(config.database).toBe('aiofix_tenant_1');
    });

    it('should return default tenant config for unknown tenant', () => {
      const config = service.getTenantPostgresConfig('unknown-tenant');

      expect(config).toHaveProperty('database');
      expect(config.database).toBe('aiofix_tenant_unknown-tenant');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const isValid = service.validateConfig();
      expect(isValid).toBe(true);
    });

    it('should reject invalid PostgreSQL config', () => {
      // 设置无效的配置
      configService.databaseConfig.postgresql.host = '';
      
      const isValid = service.validateConfig();
      expect(isValid).toBe(false);
    });

    it('should reject invalid MongoDB config', () => {
      // 设置无效的 MongoDB 配置
      configService.databaseConfig.mongodb.uri = '';
      
      const isValid = service.validateConfig();
      expect(isValid).toBe(false);
    });
  });
});
