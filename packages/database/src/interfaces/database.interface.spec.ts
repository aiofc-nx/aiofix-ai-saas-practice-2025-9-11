/// <reference types="jest" />
/* eslint-env jest */
import { describe, it, expect, jest } from '@jest/globals';
/**
 * @file database.interface.spec.ts
 * @description 数据库接口单元测试
 *
 * 测试数据库接口的类型定义、结构验证和接口一致性。
 */

import {
  DatabaseConnection,
  DatabaseConfig,
  DatabaseHealth,
  DatabaseStats,
  QueryOptions,
  TransactionOptions,
  IDatabaseAdapter,
  IDatabaseManager,
  IDatabaseFactory,
} from './database.interface';

describe('Database Interfaces', () => {
  describe('DatabaseConnection', () => {
    it('应该定义正确的连接状态类型', () => {
      const validStatuses: DatabaseConnection['status'][] = [
        'connected',
        'disconnected',
        'connecting',
        'error',
      ];

      validStatuses.forEach(status => {
        expect(typeof status).toBe('string');
      });
    });

    it('应该包含所有必需的属性', () => {
      const connection: DatabaseConnection = {
        id: 'test-connection-id',
        status: 'connected',
        config: {
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          username: 'test',
          password: 'test',
          database: 'test',
        },
        instance: {} as any,
        lastActivity: new Date(),
      };

      expect(connection.id).toBeDefined();
      expect(connection.status).toBeDefined();
      expect(connection.config).toBeDefined();
      expect(connection.instance).toBeDefined();
      expect(connection.lastActivity).toBeDefined();
    });

    it('应该支持可选的错误属性', () => {
      const connectionWithError: DatabaseConnection = {
        id: 'test-connection-id',
        status: 'error',
        config: {
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          username: 'test',
          password: 'test',
          database: 'test',
        },
        instance: {} as any,
        lastActivity: new Date(),
        error: 'Connection failed',
      };

      expect(connectionWithError.error).toBe('Connection failed');
    });
  });

  describe('DatabaseConfig', () => {
    it('应该支持所有数据库类型', () => {
      const validTypes: DatabaseConfig['type'][] = [
        'postgresql',
        'mysql',
        'mongodb',
      ];

      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('应该包含所有必需的配置属性', () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        username: 'test',
        password: 'test',
        database: 'test',
      };

      expect(config.type).toBeDefined();
      expect(config.host).toBeDefined();
      expect(config.port).toBeDefined();
      expect(config.username).toBeDefined();
      expect(config.password).toBeDefined();
      expect(config.database).toBeDefined();
    });

    it('应该支持可选的配置属性', () => {
      const configWithOptions: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        username: 'test',
        password: 'test',
        database: 'test',
        schema: 'public',
        ssl: { rejectUnauthorized: false },
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 60000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200,
        },
        options: {
          application_name: 'test-app',
        },
      };

      expect(configWithOptions.schema).toBe('public');
      expect(configWithOptions.ssl).toBeDefined();
      expect(configWithOptions.pool).toBeDefined();
      expect(configWithOptions.options).toBeDefined();
    });
  });

  describe('DatabaseHealth', () => {
    it('应该包含所有健康检查属性', () => {
      const health: DatabaseHealth = {
        healthy: true,
        connected: true,
        responseTime: 15,
        lastCheck: new Date(),
        poolStatus: {
          total: 10,
          idle: 8,
          active: 2,
          waiting: 0,
        },
      };

      expect(health.healthy).toBeDefined();
      expect(health.connected).toBeDefined();
      expect(health.responseTime).toBeDefined();
      expect(health.lastCheck).toBeDefined();
      expect(health.poolStatus).toBeDefined();
    });

    it('应该支持可选的错误属性', () => {
      const healthWithError: DatabaseHealth = {
        healthy: false,
        connected: false,
        responseTime: 0,
        lastCheck: new Date(),
        error: 'Connection timeout',
      };

      expect(healthWithError.error).toBe('Connection timeout');
    });
  });

  describe('DatabaseStats', () => {
    it('应该包含所有统计属性', () => {
      const stats: DatabaseStats = {
        totalQueries: 1000,
        successfulQueries: 950,
        failedQueries: 50,
        averageResponseTime: 45,
        maxResponseTime: 200,
        minResponseTime: 5,
        activeConnections: 25,
        idleConnections: 75,
        lastReset: new Date(),
      };

      expect(stats.totalQueries).toBeDefined();
      expect(stats.successfulQueries).toBeDefined();
      expect(stats.failedQueries).toBeDefined();
      expect(stats.averageResponseTime).toBeDefined();
      expect(stats.maxResponseTime).toBeDefined();
      expect(stats.minResponseTime).toBeDefined();
      expect(stats.activeConnections).toBeDefined();
      expect(stats.idleConnections).toBeDefined();
      expect(stats.lastReset).toBeDefined();
    });
  });

  describe('QueryOptions', () => {
    it('应该支持所有查询选项', () => {
      const options: QueryOptions = {
        timeout: 30000,
        transaction: true,
        params: ['param1', 'param2'],
        tag: 'test-query',
        logQuery: true,
      };

      expect(options.timeout).toBeDefined();
      expect(options.transaction).toBeDefined();
      expect(options.params).toBeDefined();
      expect(options.tag).toBeDefined();
      expect(options.logQuery).toBeDefined();
    });
  });

  describe('TransactionOptions', () => {
    it('应该支持所有事务选项', () => {
      const options: TransactionOptions = {
        isolationLevel: 'read committed',
        timeout: 60000,
        readOnly: false,
        tag: 'test-transaction',
      };

      expect(options.isolationLevel).toBeDefined();
      expect(options.timeout).toBeDefined();
      expect(options.readOnly).toBeDefined();
      expect(options.tag).toBeDefined();
    });
  });

  describe('IDatabaseAdapter', () => {
    it('应该定义所有必需的适配器方法', () => {
      // 这是一个类型检查测试，确保接口定义了所有必需的方法
      const adapter: IDatabaseAdapter = {
        name: 'test-adapter',
        type: 'postgresql',
        eventEmitter: {} as any,
        config: {} as any,
        isConnected: true,
        connect: jest.fn() as any,
        disconnect: jest.fn() as any,
        query: jest.fn() as any,
        execute: jest.fn() as any,
        transaction: jest.fn() as any,
        getHealth: jest.fn() as any,
        getStats: jest.fn() as any,
        getConnection: jest.fn() as any,
        ping: jest.fn() as any,
        resetStats: jest.fn() as any,
      };

      expect(adapter.name).toBeDefined();
      expect(adapter.type).toBeDefined();
      expect(adapter.isConnected).toBeDefined();
      expect(typeof adapter.connect).toBe('function');
      expect(typeof adapter.disconnect).toBe('function');
      expect(typeof adapter.query).toBe('function');
      expect(typeof adapter.execute).toBe('function');
      expect(typeof adapter.transaction).toBe('function');
      expect(typeof adapter.getHealth).toBe('function');
      expect(typeof adapter.getStats).toBe('function');
      expect(typeof adapter.getConnection).toBe('function');
      expect(typeof adapter.ping).toBe('function');
      expect(typeof adapter.resetStats).toBe('function');
    });
  });

  describe('IDatabaseManager', () => {
    it('应该定义所有必需的管理器方法', () => {
      // 这是一个类型检查测试，确保接口定义了所有必需的方法
      const manager: IDatabaseManager = {
        name: 'test-manager',
        adapterCount: 0,
        isInitialized: false,
        addAdapter: jest.fn() as any,
        removeAdapter: jest.fn() as any,
        getAdapter: jest.fn() as any,
        getDefaultAdapter: jest.fn() as any,
        connectAll: jest.fn() as any,
        disconnectAll: jest.fn() as any,
        getHealth: jest.fn() as any,
        getStats: jest.fn() as any,
      };

      expect(manager.name).toBeDefined();
      expect(manager.adapterCount).toBeDefined();
      expect(manager.isInitialized).toBeDefined();
      expect(typeof manager.addAdapter).toBe('function');
      expect(typeof manager.removeAdapter).toBe('function');
      expect(typeof manager.getAdapter).toBe('function');
      expect(typeof manager.getDefaultAdapter).toBe('function');
      expect(typeof manager.connectAll).toBe('function');
      expect(typeof manager.disconnectAll).toBe('function');
      expect(typeof manager.getHealth).toBe('function');
      expect(typeof manager.getStats).toBe('function');
    });
  });

  describe('IDatabaseFactory', () => {
    it('应该定义所有必需的工厂方法', () => {
      // 这是一个类型检查测试，确保接口定义了所有必需的方法
      const factory: IDatabaseFactory = {
        createAdapter: jest.fn() as any,
        createManager: jest.fn() as any,
        validateConfig: jest.fn() as any,
      };

      expect(typeof factory.createAdapter).toBe('function');
      expect(typeof factory.createManager).toBe('function');
      expect(typeof factory.validateConfig).toBe('function');
    });
  });
});
