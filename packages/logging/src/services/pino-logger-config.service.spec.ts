import { Test, TestingModule } from '@nestjs/testing';
import {
  PinoLoggerConfigService,
  LogLevel,
} from './pino-logger-config.service';
import { LogConfig, LogFormat } from '../interfaces/logging.interface';

describe('PinoLoggerConfigService', () => {
  let service: PinoLoggerConfigService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // 保存原始环境变量
    originalEnv = { ...process.env };

    // 清理可能影响测试的环境变量
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FORMAT;
    delete process.env.LOG_FILE_PATH;
    delete process.env.LOG_REMOTE_URL;
    delete process.env.LOG_REMOTE_TOKEN;
    delete process.env.NODE_ENV;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PinoLoggerConfigService],
    }).compile();

    service = module.get<PinoLoggerConfigService>(PinoLoggerConfigService);
  });

  afterEach(() => {
    // 恢复原始环境变量
    process.env = originalEnv;
  });

  describe('初始化', () => {
    it('应该使用默认配置初始化', () => {
      const config = service.getConfig();

      expect(config.level).toBe('info');
      // 在测试环境中，NODE_ENV通常是'test'，所以isDevelopment()返回true，默认格式是TEXT
      expect(config.format).toBe(LogFormat.TEXT);
      expect(config.colorize).toBe(true); // 测试环境被认为是开发环境
      expect(config.timestamp).toBe(true);
      expect(config.requestId).toBe(true);
      expect(config.tenantId).toBe(true);
      expect(config.userId).toBe(true);
      expect(config.performance).toBe(true);
      expect(config.stackTrace).toBe(true);
    });

    it('应该使用自定义配置初始化', async () => {
      const customConfig: Partial<LogConfig> = {
        level: 'debug',
        format: LogFormat.TEXT,
        colorize: true,
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: PinoLoggerConfigService,
            useFactory: () => new PinoLoggerConfigService(customConfig),
          },
        ],
      }).compile();

      const customService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );
      const config = customService.getConfig();

      expect(config.level).toBe('debug');
      expect(config.format).toBe(LogFormat.TEXT);
      expect(config.colorize).toBe(true);
    });

    it('应该从环境变量读取配置', async () => {
      process.env.LOG_LEVEL = 'warn';
      process.env.LOG_FORMAT = 'text';
      process.env.NODE_ENV = 'development';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const envService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );
      const config = envService.getConfig();

      expect(config.level).toBe('warn');
      expect(config.format).toBe('text');
      expect(config.colorize).toBe(true); // development环境应该启用colorize
    });
  });

  describe('配置管理', () => {
    it('应该获取当前配置', () => {
      const config = service.getConfig();

      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
      expect(config.level).toBeDefined();
      expect(config.format).toBeDefined();
    });

    it('应该更新配置', () => {
      const newConfig: Partial<LogConfig> = {
        level: 'debug',
        format: LogFormat.TEXT,
        colorize: true,
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();

      expect(config.level).toBe('debug');
      expect(config.format).toBe(LogFormat.TEXT);
      expect(config.colorize).toBe(true);
    });

    it('应该部分更新配置', () => {
      const originalConfig = service.getConfig();

      service.updateConfig({ level: 'error' });
      const config = service.getConfig();

      expect(config.level).toBe('error');
      expect(config.format).toBe(originalConfig.format);
      expect(config.colorize).toBe(originalConfig.colorize);
    });

    it('应该重置为默认配置', () => {
      // 先修改配置
      service.updateConfig({ level: 'debug', colorize: false });

      // 重置为默认配置
      service.resetToDefaults();
      const config = service.getConfig();

      expect(config.level).toBe('info');
      expect(config.colorize).toBe(true); // 测试环境被认为是开发环境
    });
  });

  describe('日志级别管理', () => {
    it('应该获取当前日志级别', () => {
      const level = service.getLevel();
      expect(level).toBe('info');
    });

    it('应该设置日志级别', () => {
      service.setLevel('debug');
      expect(service.getLevel()).toBe('debug');
    });

    it('应该支持所有有效的日志级别', () => {
      const validLevels: LogLevel[] = [
        'fatal',
        'error',
        'warn',
        'info',
        'debug',
        'trace',
      ];

      validLevels.forEach(level => {
        service.setLevel(level);
        expect(service.getLevel()).toBe(level);
      });
    });
  });

  describe('日志格式管理', () => {
    it('应该获取当前日志格式', () => {
      const format = service.getFormat();
      expect(format).toBe(LogFormat.TEXT); // 测试环境默认格式是TEXT
    });

    it('应该设置日志格式', () => {
      service.setFormat(LogFormat.TEXT);
      expect(service.getFormat()).toBe(LogFormat.TEXT);
    });

    it('应该支持所有有效的日志格式', () => {
      const validFormats: LogFormat[] = [LogFormat.JSON, LogFormat.TEXT];

      validFormats.forEach(format => {
        service.setFormat(format);
        expect(service.getFormat()).toBe(format);
      });
    });
  });

  describe('环境检测', () => {
    it('应该正确检测生产环境', async () => {
      process.env.NODE_ENV = 'production';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const prodService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );

      expect(prodService.isProduction()).toBe(true);
      expect(prodService.isDevelopment()).toBe(false);
    });

    it('应该正确检测开发环境', async () => {
      process.env.NODE_ENV = 'development';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const devService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );

      expect(devService.isProduction()).toBe(false);
      expect(devService.isDevelopment()).toBe(true);
    });

    it('应该正确检测测试环境', async () => {
      process.env.NODE_ENV = 'test';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const testService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );

      expect(testService.isProduction()).toBe(false);
      expect(testService.isDevelopment()).toBe(true);
    });
  });

  describe('美化格式判断', () => {
    it('开发环境应该使用美化格式', async () => {
      process.env.NODE_ENV = 'development';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const devService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );
      devService.setFormat(LogFormat.TEXT);

      expect(devService.shouldUsePrettyFormat()).toBe(true);
    });

    it('生产环境不应该使用美化格式', async () => {
      process.env.NODE_ENV = 'production';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const prodService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );
      prodService.setFormat(LogFormat.TEXT);

      expect(prodService.shouldUsePrettyFormat()).toBe(false);
    });

    it('JSON格式不应该使用美化格式', async () => {
      process.env.NODE_ENV = 'development';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const devService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );
      devService.setFormat(LogFormat.JSON);

      expect(devService.shouldUsePrettyFormat()).toBe(false);
    });
  });

  describe('配置验证', () => {
    it('应该验证有效的日志级别', () => {
      const validLevels: LogLevel[] = [
        'fatal',
        'error',
        'warn',
        'info',
        'debug',
        'trace',
      ];

      validLevels.forEach(level => {
        expect(() => {
          service.updateConfig({ level });
        }).not.toThrow();
      });
    });

    it('应该验证有效的日志格式', () => {
      const validFormats: LogFormat[] = [LogFormat.JSON, LogFormat.TEXT];

      validFormats.forEach(format => {
        expect(() => {
          service.updateConfig({ format });
        }).not.toThrow();
      });
    });

    it('应该验证文件轮转配置', () => {
      const validRotationConfig = {
        rotation: {
          maxSize: '10m',
          maxFiles: 5,
          interval: '1d',
        },
      };

      expect(() => {
        service.updateConfig(validRotationConfig);
      }).not.toThrow();
    });

    it('应该验证远程日志配置', () => {
      const validRemoteConfig = {
        remote: {
          url: 'https://logs.example.com',
          token: 'secret-token',
          timeout: 5000,
          retries: 3,
        },
      };

      expect(() => {
        service.updateConfig(validRemoteConfig);
      }).not.toThrow();
    });
  });

  describe('配置验证错误', () => {
    it('应该拒绝无效的日志级别', () => {
      expect(() => {
        service.updateConfig({ level: 'invalid' as LogLevel });
      }).toThrow('Invalid log level');
    });

    it('应该拒绝无效的日志格式', () => {
      expect(() => {
        service.updateConfig({ format: 'invalid' as LogFormat });
      }).toThrow('Invalid log format');
    });

    it('应该拒绝无效的文件大小格式', () => {
      expect(() => {
        service.updateConfig({
          rotation: {
            maxSize: 'invalid-size',
            maxFiles: 5,
            interval: '1d',
          },
        });
      }).toThrow('Invalid maxSize format');
    });

    it('应该拒绝缺少URL的远程日志配置', () => {
      expect(() => {
        service.updateConfig({
          remote: {
            url: '',
            token: 'secret-token',
            timeout: 5000,
            retries: 3,
          },
        });
      }).toThrow('Remote logging URL is required');
    });

    it('应该拒绝负数的超时时间', () => {
      expect(() => {
        service.updateConfig({
          remote: {
            url: 'https://logs.example.com',
            token: 'secret-token',
            timeout: -1,
            retries: 3,
          },
        });
      }).toThrow('Remote logging timeout must be positive');
    });

    it('应该拒绝负数的重试次数', () => {
      expect(() => {
        service.updateConfig({
          remote: {
            url: 'https://logs.example.com',
            token: 'secret-token',
            timeout: 5000,
            retries: -1,
          },
        });
      }).toThrow('Remote logging retries must be non-negative');
    });
  });

  describe('环境变量配置', () => {
    it('应该从环境变量读取日志级别', async () => {
      process.env.LOG_LEVEL = 'error';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const envService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );

      expect(envService.getLevel()).toBe('error');
    });

    it('应该从环境变量读取日志格式', async () => {
      process.env.LOG_FORMAT = 'text';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const envService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );

      expect(envService.getFormat()).toBe('text');
    });

    it('应该从环境变量读取日志文件路径', async () => {
      process.env.LOG_FILE_PATH = '/var/log/app.log';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const envService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );
      const config = envService.getConfig();

      expect(config.filePath).toBe('/var/log/app.log');
    });

    it('应该从环境变量读取远程日志配置', async () => {
      process.env.LOG_REMOTE_URL = 'https://logs.example.com';
      process.env.LOG_REMOTE_TOKEN = 'secret-token';

      const module: TestingModule = await Test.createTestingModule({
        providers: [PinoLoggerConfigService],
      }).compile();

      const envService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );
      const config = envService.getConfig();

      expect(config.remote).toBeDefined();
      expect(config.remote?.url).toBe('https://logs.example.com');
      expect(config.remote?.token).toBe('secret-token');
      expect(config.remote?.timeout).toBe(5000);
      expect(config.remote?.retries).toBe(3);
    });
  });

  describe('配置合并', () => {
    it('应该正确合并默认配置和自定义配置', async () => {
      const customConfig: Partial<LogConfig> = {
        level: 'debug',
        colorize: true,
        timestamp: false,
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: PinoLoggerConfigService,
            useFactory: () => new PinoLoggerConfigService(customConfig),
          },
        ],
      }).compile();

      const customService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );
      const config = customService.getConfig();

      // 自定义配置应该覆盖默认配置
      expect(config.level).toBe('debug');
      expect(config.colorize).toBe(true);
      expect(config.timestamp).toBe(false);

      // 未指定的配置应该保持默认值
      expect(config.requestId).toBe(true);
      expect(config.tenantId).toBe(true);
      expect(config.userId).toBe(true);
    });

    it('应该正确处理环境变量和自定义配置的优先级', async () => {
      process.env.LOG_LEVEL = 'warn';
      process.env.LOG_FORMAT = 'text';

      const customConfig: Partial<LogConfig> = {
        level: 'debug',
        colorize: true,
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: PinoLoggerConfigService,
            useFactory: () => new PinoLoggerConfigService(customConfig),
          },
        ],
      }).compile();

      const customService = module.get<PinoLoggerConfigService>(
        PinoLoggerConfigService,
      );
      const config = customService.getConfig();

      // 环境变量应该覆盖默认配置，但自定义配置应该覆盖环境变量
      expect(config.level).toBe('debug'); // 自定义配置优先级最高
      expect(config.format).toBe('text'); // 环境变量
      expect(config.colorize).toBe(true); // 自定义配置
    });
  });
});
