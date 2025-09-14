import { Test, TestingModule } from '@nestjs/testing';
import { EventVersionManager } from '../event-version-manager';
import { PinoLoggerService } from '@aiofix/logging';
import {
  IEventVersion,
  CompatibilityType,
  RiskLevel,
} from '../event-version.interface';

/**
 * EventVersionManager 单元测试
 *
 * @description 测试事件版本管理器的功能
 */
describe('EventVersionManager', () => {
  let service: EventVersionManager;
  let loggerService: jest.Mocked<PinoLoggerService>;

  beforeEach(async () => {
    const mockLoggerService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventVersionManager,
        {
          provide: PinoLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<EventVersionManager>(EventVersionManager);
    loggerService = module.get(PinoLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该正确初始化服务', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(EventVersionManager);
    });
  });

  describe('registerVersion', () => {
    it('应该注册事件版本', () => {
      const eventVersion: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.0.0',
        schema: { name: 'string', email: 'string' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件',
        createdAt: new Date(),
      };

      service.registerVersion('UserCreated', eventVersion);

      expect(loggerService.info).toHaveBeenCalledWith(
        '事件版本已注册',
        undefined,
        {
          eventType: 'UserCreated',
          version: '1.0.0',
        },
      );
    });

    it('应该处理重复注册', () => {
      const eventVersion: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.0.0',
        schema: { name: 'string', email: 'string' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件',
        createdAt: new Date(),
      };

      service.registerVersion('UserCreated', eventVersion);
      service.registerVersion('UserCreated', eventVersion);

      expect(loggerService.warn).toHaveBeenCalledWith(
        '事件版本已存在，将被覆盖',
        undefined,
        {
          eventType: 'UserCreated',
          version: '1.0.0',
        },
      );
    });
  });

  describe('getVersion', () => {
    beforeEach(() => {
      const eventVersion: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.0.0',
        schema: { name: 'string', email: 'string' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件',
        createdAt: new Date(),
      };

      service.registerVersion('UserCreated', eventVersion);
    });

    it('应该获取指定版本', () => {
      const result = service.getVersion('UserCreated', '1.0.0');

      expect(result).toBeDefined();
      expect(result?.version).toBe('1.0.0');
      expect(result?.eventType).toBe('UserCreated');
    });

    it('应该获取最新版本当未指定版本时', () => {
      const latestVersion: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.1.0',
        schema: { name: 'string', email: 'string', age: 'number' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件 v1.1.0',
        createdAt: new Date(),
      };

      service.registerVersion('UserCreated', latestVersion);

      const result = service.getVersion('UserCreated');

      expect(result).toBeDefined();
      expect(result?.version).toBe('1.1.0');
    });

    it('应该返回null当版本不存在时', () => {
      const result = service.getVersion('NonExistentEvent', '1.0.0');

      expect(result).toBeNull();
    });
  });

  describe('getAllVersions', () => {
    beforeEach(() => {
      const version1: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.0.0',
        schema: { name: 'string', email: 'string' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件 v1.0.0',
        createdAt: new Date('2023-01-01'),
      };

      const version2: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.1.0',
        schema: { name: 'string', email: 'string', age: 'number' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件 v1.1.0',
        createdAt: new Date('2023-02-01'),
      };

      service.registerVersion('UserCreated', version1);
      service.registerVersion('UserCreated', version2);
    });

    it('应该返回所有版本', () => {
      const result = service.getAllVersions('UserCreated');

      expect(result).toHaveLength(2);
      expect(result.map((v) => v.version)).toContain('1.0.0');
      expect(result.map((v) => v.version)).toContain('1.1.0');
    });

    it('应该返回空数组当事件类型不存在时', () => {
      const result = service.getAllVersions('NonExistentEvent');

      expect(result).toEqual([]);
    });
  });

  describe('checkCompatibility', () => {
    beforeEach(() => {
      const version1: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.0.0',
        schema: { name: 'string', email: 'string' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件 v1.0.0',
        createdAt: new Date('2023-01-01'),
      };

      const version2: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.1.0',
        schema: { name: 'string', email: 'string', age: 'number' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件 v1.1.0',
        createdAt: new Date('2023-02-01'),
      };

      service.registerVersion('UserCreated', version1);
      service.registerVersion('UserCreated', version2);
    });

    it('应该检查版本兼容性', () => {
      const result = service.checkCompatibility(
        'UserCreated',
        '1.0.0',
        '1.1.0',
      );

      expect(result).toBeDefined();
      expect(result.compatible).toBe(true);
      expect(result.compatibilityType).toBe(CompatibilityType.BACKWARD);
      expect(result.riskLevel).toBe(RiskLevel.LOW);
    });

    it('应该处理相同版本', () => {
      const result = service.checkCompatibility(
        'UserCreated',
        '1.0.0',
        '1.0.0',
      );

      expect(result.compatible).toBe(true);
      expect(result.compatibilityType).toBe(CompatibilityType.IDENTICAL);
      expect(result.riskLevel).toBe(RiskLevel.NONE);
    });

    it('应该处理不兼容的版本', () => {
      const result = service.checkCompatibility(
        'UserCreated',
        '1.1.0',
        '1.0.0',
      );

      expect(result.compatible).toBe(false);
      expect(result.compatibilityType).toBe(CompatibilityType.NONE);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
    });

    it('应该处理不存在的版本', () => {
      const result = service.checkCompatibility(
        'UserCreated',
        '1.0.0',
        '2.0.0',
      );

      expect(result.compatible).toBe(false);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
    });
  });

  describe('getCompatibleVersions', () => {
    beforeEach(() => {
      const version1: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.0.0',
        schema: { name: 'string', email: 'string' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件 v1.0.0',
        createdAt: new Date('2023-01-01'),
      };

      const version2: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.1.0',
        schema: { name: 'string', email: 'string', age: 'number' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件 v1.1.0',
        createdAt: new Date('2023-02-01'),
      };

      service.registerVersion('UserCreated', version1);
      service.registerVersion('UserCreated', version2);
    });

    it('应该返回兼容的版本列表', () => {
      const result = service.getCompatibleVersions('UserCreated', '1.0.0');

      expect(result).toContain('1.1.0');
    });

    it('应该返回空数组当没有兼容版本时', () => {
      const result = service.getCompatibleVersions('UserCreated', '2.0.0');

      expect(result).toEqual([]);
    });
  });

  describe('deprecateVersion', () => {
    beforeEach(() => {
      const version: IEventVersion = {
        eventType: 'UserCreated',
        version: '1.0.0',
        schema: { name: 'string', email: 'string' },
        compatibility: { backward: true, forward: false },
        deprecated: false,
        description: '用户创建事件 v1.0.0',
        createdAt: new Date('2023-01-01'),
      };

      service.registerVersion('UserCreated', version);
    });

    it('应该废弃指定版本', () => {
      const deprecatedAt = new Date();
      service.deprecateVersion('UserCreated', '1.0.0', deprecatedAt);

      const version = service.getVersion('UserCreated', '1.0.0');
      expect(version?.deprecated).toBe(true);
      expect(version?.deprecatedAt).toEqual(deprecatedAt);
    });

    it('应该使用当前时间当未指定废弃时间时', () => {
      service.deprecateVersion('UserCreated', '1.0.0');

      const version = service.getVersion('UserCreated', '1.0.0');
      expect(version?.deprecated).toBe(true);
      expect(version?.deprecatedAt).toBeDefined();
    });

    it('应该处理不存在的版本', () => {
      expect(() => {
        service.deprecateVersion('UserCreated', '2.0.0');
      }).not.toThrow();
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的事件类型', () => {
      const result = service.getVersion('', '1.0.0');

      expect(result).toBeNull();
    });

    it('应该处理无效的版本号', () => {
      const result = service.getVersion('UserCreated', '');

      expect(result).toBeNull();
    });

    it('应该处理版本格式错误', () => {
      const result = service.checkCompatibility(
        'UserCreated',
        'invalid',
        '1.0.0',
      );

      expect(result.compatible).toBe(false);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
    });
  });
});
