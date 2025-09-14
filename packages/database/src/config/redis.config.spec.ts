/**
 * @file redis.config.spec.ts
 * @description Redis配置服务单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisConfig } from './redis.config';

describe('RedisConfig', () => {
  let service: RedisConfig;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
    };

    service = new RedisConfig(mockConfigService as any, mockLogger as any);
    configService = mockConfigService as any;
  });

  describe('getCacheConfig', () => {
    it('should return default cache configuration', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const config = service.getCacheConfig();

      expect(config).toEqual({
        host: 'localhost',
        port: 6379,
        password: '',
        db: 0,
        pool: {
          min: 2,
          max: 10,
          idleTimeoutMillis: 30000,
        },
        cache: {
          ttl: 3600,
          maxItems: 1000,
          checkPeriod: 600,
        },
        tenant: {
          keyPrefix: 'tenant:',
          namespaceSeparator: ':',
          defaultTenant: 'platform',
        },
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        cluster: {
          enabled: false,
          nodes: [],
        },
      });
    });

    it('should return configured cache configuration', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          REDIS_HOST: 'redis-host',
          REDIS_PORT: '6380',
          REDIS_PASSWORD: 'redis_password',
          REDIS_DB: '1',
          REDIS_CACHE_PREFIX: 'custom:cache:',
          REDIS_CACHE_TTL: '7200',
          REDIS_MAX_RETRIES: '5',
          REDIS_RETRY_DELAY: '200',
          REDIS_CONNECT_TIMEOUT: '15000',
          REDIS_COMMAND_TIMEOUT: '8000',
        };
        return configs[key];
      });

      const config = service.getCacheConfig();

      expect(config).toEqual({
        host: 'redis-host',
        port: 6380,
        password: 'redis_password',
        db: 1,
        pool: {
          min: 2,
          max: 10,
          idleTimeoutMillis: 30000,
        },
        cache: {
          ttl: 3600,
          maxItems: 1000,
          checkPeriod: 600,
        },
        tenant: {
          keyPrefix: 'tenant:',
          namespaceSeparator: ':',
          defaultTenant: 'platform',
        },
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        cluster: {
          enabled: false,
          nodes: [],
        },
      });
    });
  });

  describe('getQueueConfig', () => {
    it('should return default message queue configuration', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const config = service.getQueueConfig();

      expect(config).toEqual({
        redis: {
          host: 'localhost',
          port: 6379,
          password: '',
          db: 1,
        },
        queue: {
          concurrency: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
        queues: {
          'domain-events': {
            concurrency: 10,
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
          },
          notifications: {
            concurrency: 20,
            attempts: 3,
            backoff: { type: 'fixed', delay: 1000 },
          },
          emails: {
            concurrency: 5,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
          'push-notifications': {
            concurrency: 15,
            attempts: 3,
            backoff: { type: 'fixed', delay: 2000 },
          },
          sms: {
            concurrency: 10,
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
          },
        },
        tenant: {
          keyPrefix: 'queue:tenant:',
          namespaceSeparator: ':',
        },
      });
    });

    it('should return configured message queue configuration', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          REDIS_HOST: 'redis-host',
          REDIS_PORT: '6380',
          REDIS_PASSWORD: 'redis_password',
          REDIS_QUEUE_DB: '2',
          REDIS_QUEUE_PREFIX: 'custom:queue:',
          REDIS_MAX_RETRIES: '5',
          REDIS_RETRY_DELAY: '200',
        };
        return configs[key];
      });

      const config = service.getQueueConfig();

      expect(config).toEqual({
        redis: {
          host: 'localhost',
          port: 6379,
          password: '',
          db: 1,
        },
        queue: {
          concurrency: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
        queues: {
          'domain-events': {
            concurrency: 10,
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
          },
          notifications: {
            concurrency: 20,
            attempts: 3,
            backoff: { type: 'fixed', delay: 1000 },
          },
          emails: {
            concurrency: 5,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
          'push-notifications': {
            concurrency: 15,
            attempts: 3,
            backoff: { type: 'fixed', delay: 2000 },
          },
          sms: {
            concurrency: 10,
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
          },
        },
        tenant: {
          keyPrefix: 'queue:tenant:',
          namespaceSeparator: ':',
        },
      });
    });
  });

  describe('validateConfig', () => {
    it('should validate correct Redis config', () => {
      // Mock configService to return valid values
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
          REDIS_PASSWORD: 'password',
          REDIS_DB: '0',
          BULL_REDIS_HOST: 'localhost',
          BULL_REDIS_PORT: '6379',
          BULL_REDIS_PASSWORD: 'password',
          BULL_REDIS_DB: '1',
        };
        return configs[key];
      });

      const isValid = service.validateConfig();
      expect(isValid).toBe(true);
    });

    it('should reject config with missing required fields', () => {
      // Mock configService to return invalid values (negative port)
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          REDIS_HOST: 'localhost',
          REDIS_PORT: '-1', // 负端口号
          REDIS_PASSWORD: 'password',
          REDIS_DB: '0',
          BULL_REDIS_HOST: 'localhost',
          BULL_REDIS_PORT: '6379',
          BULL_REDIS_PASSWORD: 'password',
          BULL_REDIS_DB: '1',
        };
        return configs[key];
      });

      const isValid = service.validateConfig();
      expect(isValid).toBe(false);
    });

    it('should reject config with invalid port', () => {
      // Mock configService to return invalid port
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          REDIS_HOST: 'localhost',
          REDIS_PORT: 'invalid', // 无效端口，parseInt会返回NaN
          REDIS_PASSWORD: 'password',
          REDIS_DB: '0',
          BULL_REDIS_HOST: 'localhost',
          BULL_REDIS_PORT: '6379',
          BULL_REDIS_PASSWORD: 'password',
          BULL_REDIS_DB: '1',
        };
        return configs[key];
      });

      const isValid = service.validateConfig();
      expect(isValid).toBe(false);
    });

    it('should reject config with invalid db number', () => {
      // Mock configService to return invalid queue port
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
          REDIS_PASSWORD: 'password',
          REDIS_DB: '0',
          BULL_REDIS_HOST: 'localhost',
          BULL_REDIS_PORT: 'invalid', // 无效队列端口
          BULL_REDIS_PASSWORD: 'password',
          BULL_REDIS_DB: '1',
        };
        return configs[key];
      });

      const isValid = service.validateConfig();
      expect(isValid).toBe(false);
    });
  });
});
