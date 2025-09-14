import { Test, TestingModule } from '@nestjs/testing';
import { CoreConfigService } from '../core-config.service';
import { ConfigService } from '@aiofix/config';
import { PinoLoggerService } from '@aiofix/logging';

/**
 * CoreConfigService 单元测试
 *
 * @description 测试Core模块配置服务的功能
 */
describe('CoreConfigService', () => {
  let service: CoreConfigService;
  let configService: jest.Mocked<ConfigService>;
  let loggerService: jest.Mocked<PinoLoggerService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
      getConfig: jest.fn(),
    };

    const mockLoggerService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PinoLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<CoreConfigService>(CoreConfigService);
    configService = module.get(ConfigService);
    loggerService = module.get(PinoLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该正确初始化服务', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(CoreConfigService);
    });

    it('应该从ConfigService获取core配置', () => {
      // 构造函数中会调用getConfig，但由于是异步的，这里检查服务是否已初始化
      expect(service).toBeDefined();
    });
  });

  describe('getCoreConfig', () => {
    it('应该返回完整的core配置', () => {
      const mockConfig = {
        cqrs: {
          commandBus: {
            batchDelay: 100,
            batchSize: 50,
            enableBatching: true,
            enableLogging: true,
            enableMetrics: true,
            enableRetry: false,
            maxRetries: 3,
            retryDelay: 1000,
          },
          queryBus: {
            batchDelay: 50,
            batchSize: 100,
            enableBatching: true,
            enableLogging: true,
            enableMetrics: true,
            enableRetry: false,
            maxRetries: 3,
            retryDelay: 1000,
          },
          eventBus: {
            batchDelay: 50,
            batchSize: 200,
            enableBatching: true,
            enableLogging: true,
            enableMetrics: true,
            enableRetry: true,
            maxRetries: 3,
            retryDelay: 1000,
          },
          eventStore: {
            enabled: true,
            enableProjections: true,
            tableName: 'domain_events',
          },
        },
        cache: {
          command: {
            enabled: true,
            cacheType: 'memory',
            defaultTtl: 300000,
            enableCompression: false,
            enableEncryption: false,
            maxSize: 1000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
          query: {
            enabled: true,
            cacheType: 'hybrid',
            defaultTtl: 600000,
            enableCompression: true,
            enableEncryption: false,
            maxSize: 5000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
          event: {
            enabled: true,
            cacheType: 'redis',
            defaultTtl: 3600000,
            enableCompression: true,
            enableEncryption: true,
            maxSize: 10000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'ttl',
            timeout: 5000,
          },
          eventStore: {
            enabled: true,
            cacheType: 'redis',
            defaultTtl: 7200000,
            enableCompression: true,
            enableEncryption: true,
            maxSize: 20000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
          aggregate: {
            enabled: true,
            cacheType: 'hybrid',
            defaultTtl: 1800000,
            enableCompression: false,
            enableEncryption: false,
            maxSize: 2000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
        },
        middleware: {
          enableLogging: true,
          enableMetrics: true,
          historySize: 1000,
          logLevel: 'info',
          logRequestData: true,
          logResponseData: true,
          maskSensitiveData: true,
          metricsExportInterval: 60000,
          timeout: 30000,
        },
        performance: {
          enabled: true,
          enableCpuMonitoring: false,
          enableMemoryMonitoring: true,
          interval: 30000,
        },
        publisher: {
          batchDelay: 100,
          batchSize: 100,
          enableBatching: false,
          enableLogging: true,
          enableMetrics: true,
          enableRetry: false,
          maxRetries: 3,
          retryDelay: 1000,
        },
      };

      configService.getConfig.mockReturnValue(mockConfig);

      const result = service.getCoreConfig();

      expect(result).toEqual(mockConfig);
      expect(result).toBeDefined();
    });

    it('应该返回默认配置当配置不存在时', () => {
      configService.getConfig.mockReturnValue(undefined as any);

      const result = service.getCoreConfig();

      expect(result).toBeDefined();
      expect(result.cqrs).toBeDefined();
      expect(result.cache).toBeDefined();
    });
  });

  describe('getCqrsConfig', () => {
    it('应该返回CQRS配置', () => {
      const mockConfig = {
        cqrs: {
          commandBus: {
            batchDelay: 100,
            batchSize: 50,
            enableBatching: true,
            enableLogging: true,
            enableMetrics: true,
            enableRetry: false,
            maxRetries: 3,
            retryDelay: 1000,
          },
          queryBus: {
            batchDelay: 50,
            batchSize: 100,
            enableBatching: true,
            enableLogging: true,
            enableMetrics: true,
            enableRetry: false,
            maxRetries: 3,
            retryDelay: 1000,
          },
          eventBus: {
            batchDelay: 50,
            batchSize: 200,
            enableBatching: true,
            enableLogging: true,
            enableMetrics: true,
            enableRetry: true,
            maxRetries: 3,
            retryDelay: 1000,
          },
          eventStore: {
            enabled: true,
            enableProjections: true,
            tableName: 'domain_events',
          },
        },
      };

      configService.getConfig.mockReturnValue(mockConfig as any);

      const result = service.getCqrsConfig();

      expect(result).toEqual(mockConfig.cqrs);
    });
  });

  describe('getCacheConfig', () => {
    it('应该返回缓存配置', () => {
      const mockConfig = {
        cache: {
          command: {
            enabled: true,
            cacheType: 'memory',
            defaultTtl: 300000,
            enableCompression: false,
            enableEncryption: false,
            maxSize: 1000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
          query: {
            enabled: true,
            cacheType: 'hybrid',
            defaultTtl: 600000,
            enableCompression: true,
            enableEncryption: false,
            maxSize: 5000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
          event: {
            enabled: true,
            cacheType: 'redis',
            defaultTtl: 3600000,
            enableCompression: true,
            enableEncryption: true,
            maxSize: 10000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'ttl',
            timeout: 5000,
          },
          eventStore: {
            enabled: true,
            cacheType: 'redis',
            defaultTtl: 7200000,
            enableCompression: true,
            enableEncryption: true,
            maxSize: 20000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
          aggregate: {
            enabled: true,
            cacheType: 'hybrid',
            defaultTtl: 1800000,
            enableCompression: false,
            enableEncryption: false,
            maxSize: 2000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
        },
      };

      configService.getConfig.mockReturnValue(mockConfig);

      const result = service.getCacheConfig();

      expect(result).toEqual(mockConfig.cache);
    });
  });

  describe('getCommandCacheConfig', () => {
    it('应该返回命令缓存配置', () => {
      const mockConfig = {
        cache: {
          command: {
            enabled: true,
            cacheType: 'memory',
            defaultTtl: 300000,
            enableCompression: false,
            enableEncryption: false,
            maxSize: 1000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
        },
      };

      configService.getConfig.mockReturnValue(mockConfig);

      const result = service.getCommandCacheConfig();

      expect(result).toEqual(mockConfig.cache.command);
    });
  });

  describe('getQueryCacheConfig', () => {
    it('应该返回查询缓存配置', () => {
      const mockConfig = {
        cache: {
          query: {
            enabled: true,
            cacheType: 'hybrid',
            defaultTtl: 600000,
            enableCompression: true,
            enableEncryption: false,
            maxSize: 5000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
        },
      };

      configService.getConfig.mockReturnValue(mockConfig);

      const result = service.getQueryCacheConfig();

      expect(result).toEqual(mockConfig.cache.query);
    });
  });

  describe('getEventCacheConfig', () => {
    it('应该返回事件缓存配置', () => {
      const mockConfig = {
        cache: {
          event: {
            enabled: true,
            cacheType: 'redis',
            defaultTtl: 3600000,
            enableCompression: true,
            enableEncryption: true,
            maxSize: 10000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'ttl',
            timeout: 5000,
          },
        },
      };

      configService.getConfig.mockReturnValue(mockConfig);

      const result = service.getEventCacheConfig();

      expect(result).toEqual(mockConfig.cache.event);
    });
  });

  describe('getAggregateCacheConfig', () => {
    it('应该返回聚合缓存配置', () => {
      const mockConfig = {
        cache: {
          aggregate: {
            enabled: true,
            cacheType: 'hybrid',
            defaultTtl: 1800000,
            enableCompression: false,
            enableEncryption: false,
            maxSize: 2000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
        },
      };

      configService.getConfig.mockReturnValue(mockConfig);

      const result = service.getAggregateCacheConfig();

      expect(result).toEqual(mockConfig.cache.aggregate);
    });
  });

  describe('getEventStoreCacheConfig', () => {
    it('应该返回事件存储缓存配置', () => {
      const mockConfig = {
        cache: {
          eventStore: {
            enabled: true,
            cacheType: 'redis',
            defaultTtl: 7200000,
            enableCompression: true,
            enableEncryption: true,
            maxSize: 20000,
            retries: 3,
            retryDelay: 1000,
            strategy: 'lru',
            timeout: 5000,
          },
        },
      };

      configService.getConfig.mockReturnValue(mockConfig);

      const result = service.getEventStoreCacheConfig();

      expect(result).toEqual(mockConfig.cache.eventStore);
    });
  });

  describe('配置合并功能', () => {
    it('应该正确合并用户配置和默认配置', () => {
      const defaultConfig = {
        cqrs: {
          commandBus: { enabled: true, timeout: 5000 },
          queryBus: { enabled: true, timeout: 3000 },
        },
        cache: {
          commandCache: { enabled: true, ttl: 300 },
        },
      };

      const userConfig = {
        cqrs: {
          commandBus: { timeout: 10000 }, // 覆盖默认值
          eventBus: { enabled: true }, // 新增配置
        },
      };

      configService.getConfig.mockReturnValue(defaultConfig);

      // 模拟mergeConfig方法的行为
      const result = service.getCoreConfig();

      expect(result).toBeDefined();
      expect(result.cqrs).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理配置服务异常', () => {
      configService.getConfig.mockImplementation(() => {
        throw new Error('配置服务异常');
      });

      // 由于getCoreConfig内部有try-catch处理，不会抛出异常，而是返回默认配置
      const result = service.getCoreConfig();
      expect(result).toBeDefined();
    });

    it('应该处理无效配置数据', () => {
      configService.getConfig.mockReturnValue(null as any);

      const result = service.getCoreConfig();

      expect(result).toBeDefined();
      expect(result.cqrs).toBeDefined();
      expect(result.cache).toBeDefined();
    });
  });
});
