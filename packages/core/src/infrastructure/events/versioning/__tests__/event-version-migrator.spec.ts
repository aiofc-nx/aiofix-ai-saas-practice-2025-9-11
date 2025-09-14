import { Test, TestingModule } from '@nestjs/testing';
import { EventVersionMigrator } from '../event-version-migrator';
import { PinoLoggerService } from '@aiofix/logging';

/**
 * EventVersionMigrator 单元测试
 *
 * @description 测试事件版本迁移器的功能
 */
describe('EventVersionMigrator', () => {
  let service: EventVersionMigrator;
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
        EventVersionMigrator,
        {
          provide: PinoLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<EventVersionMigrator>(EventVersionMigrator);
    loggerService = module.get(PinoLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该正确初始化服务', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(EventVersionMigrator);
    });
  });

  describe('registerMigrationScript', () => {
    it('应该注册迁移脚本', () => {
      const migrationFunction = jest.fn((data: any) => ({
        ...data,
        newField: 'newValue',
      }));

      service.registerMigrationScript(
        'UserCreated',
        '1.0.0',
        '1.1.0',
        migrationFunction,
      );

      expect(loggerService.info).toHaveBeenCalledWith(
        '迁移脚本已注册',
        undefined,
        {
          eventType: 'UserCreated',
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrationKey: 'UserCreated:1.0.0:1.1.0',
        },
      );
    });

    it('应该支持注册多个迁移脚本', () => {
      const migration1 = jest.fn((data: any) => ({
        ...data,
        field1: 'value1',
      }));
      const migration2 = jest.fn((data: any) => ({
        ...data,
        field2: 'value2',
      }));

      service.registerMigrationScript(
        'UserCreated',
        '1.0.0',
        '1.1.0',
        migration1,
      );
      service.registerMigrationScript(
        'UserCreated',
        '1.1.0',
        '1.2.0',
        migration2,
      );

      expect(loggerService.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('migrateEventData', () => {
    beforeEach(() => {
      const migrationFunction = jest.fn((data: any) => ({
        ...data,
        email: data.email || 'default@example.com',
        version: '1.1.0',
      }));

      service.registerMigrationScript(
        'UserCreated',
        '1.0.0',
        '1.1.0',
        migrationFunction,
      );
    });

    it('应该迁移事件数据', async () => {
      const originalData = {
        eventType: 'UserCreated',
        eventId: 'test-id',
        aggregateId: 'user-123',
        occurredOn: new Date(),
        name: 'John Doe',
      };

      const result = await service.migrateEventData(
        originalData,
        '1.0.0',
        '1.1.0',
      );

      expect(result).toBeDefined();
      expect(result.email).toBe('default@example.com');
      expect(result.version).toBe('1.1.0');
      expect(result.name).toBe('John Doe');
    });

    it('应该处理相同版本的情况', async () => {
      const originalData = {
        eventType: 'UserCreated',
        name: 'John Doe',
      };

      const result = await service.migrateEventData(
        originalData,
        '1.0.0',
        '1.0.0',
      );

      expect(result).toEqual(originalData);
      expect(loggerService.debug).toHaveBeenCalledWith(
        '版本相同，无需迁移',
        undefined,
        {
          eventType: 'UserCreated',
          fromVersion: '1.0.0',
          toVersion: '1.0.0',
        },
      );
    });

    it('应该处理找不到迁移脚本的情况', async () => {
      const originalData = {
        eventType: 'UserCreated',
        name: 'John Doe',
      };

      const result = await service.migrateEventData(
        originalData,
        '1.0.0',
        '2.0.0',
      );

      expect(result).toEqual(originalData);
      expect(loggerService.warn).toHaveBeenCalledWith(
        '未找到迁移脚本',
        undefined,
        {
          eventType: 'UserCreated',
          fromVersion: '1.0.0',
          toVersion: '2.0.0',
        },
      );
    });

    it('应该处理无效的事件数据', async () => {
      await expect(
        service.migrateEventData(null, '1.0.0', '1.1.0'),
      ).rejects.toThrow('无法提取事件类型');
    });

    it('应该处理迁移函数异常', async () => {
      const errorMigration = jest.fn(() => {
        throw new Error('迁移失败');
      });

      service.registerMigrationScript(
        'UserCreated',
        '1.0.0',
        '1.1.0',
        errorMigration,
      );

      const originalData = {
        eventType: 'UserCreated',
        name: 'John Doe',
      };

      await expect(
        service.migrateEventData(originalData, '1.0.0', '1.1.0'),
      ).rejects.toThrow('迁移失败');

      expect(loggerService.error).toHaveBeenCalledWith(
        '事件数据迁移失败',
        undefined,
        expect.objectContaining({
          error: '迁移失败',
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
        }),
      );
    });
  });

  describe('validateMigration', () => {
    it('应该验证有效的迁移数据', async () => {
      const migratedData = {
        eventId: 'test-id',
        aggregateId: 'user-123',
        eventType: 'UserCreated',
        occurredOn: new Date(),
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = await service.validateMigration(migratedData, '1.1.0');

      expect(result).toBe(true);
      expect(loggerService.debug).toHaveBeenCalledWith(
        '迁移验证通过',
        undefined,
        { toVersion: '1.1.0' },
      );
    });

    it('应该拒绝无效的迁移数据', async () => {
      const invalidData = {
        name: 'John Doe',
        // 缺少必要字段
      };

      const result = await service.validateMigration(invalidData, '1.1.0');

      expect(result).toBe(false);
      expect(loggerService.error).toHaveBeenCalledWith(
        '基本数据完整性验证失败',
        undefined,
        {
          migratedData: invalidData,
          toVersion: '1.1.0',
        },
      );
    });

    it('应该处理null或undefined数据', async () => {
      const result1 = await service.validateMigration(null, '1.1.0');
      const result2 = await service.validateMigration(undefined, '1.1.0');

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('应该处理非对象数据', async () => {
      const result = await service.validateMigration('invalid', '1.1.0');

      expect(result).toBe(false);
      expect(loggerService.error).toHaveBeenCalledWith(
        '迁移数据无效',
        undefined,
        {
          migratedData: 'invalid',
          toVersion: '1.1.0',
        },
      );
    });

    it('应该验证版本特定数据', async () => {
      const migratedData = {
        eventId: 'test-id',
        aggregateId: 'user-123',
        eventType: 'UserCreated',
        occurredOn: new Date(),
        email: 'john@example.com', // 1.1.0版本需要email字段
      };

      const result = await service.validateMigration(migratedData, '1.1.0');

      expect(result).toBe(true);
    });

    it('应该拒绝缺少版本特定字段的数据', async () => {
      const migratedData = {
        eventId: 'test-id',
        aggregateId: 'user-123',
        eventType: 'UserCreated',
        occurredOn: new Date(),
        // 缺少email字段（1.1.0版本需要）
      };

      const result = await service.validateMigration(migratedData, '1.1.0');

      expect(result).toBe(false);
      expect(loggerService.error).toHaveBeenCalledWith(
        '版本特定数据验证失败',
        undefined,
        {
          migratedData,
          toVersion: '1.1.0',
        },
      );
    });
  });

  describe('migrateBatchEventData', () => {
    beforeEach(() => {
      const migrationFunction = jest.fn((data: any) => ({
        ...data,
        migrated: true,
        version: '1.1.0',
      }));

      service.registerMigrationScript(
        'UserCreated',
        '1.0.0',
        '1.1.0',
        migrationFunction,
      );
    });

    it('应该批量迁移事件数据', async () => {
      const eventDataList = [
        {
          eventType: 'UserCreated',
          eventId: 'id1',
          aggregateId: 'user-1',
          occurredOn: new Date(),
          name: 'John Doe',
        },
        {
          eventType: 'UserCreated',
          eventId: 'id2',
          aggregateId: 'user-2',
          occurredOn: new Date(),
          name: 'Jane Doe',
        },
      ];

      const result = await service.migrateBatchEventData(
        eventDataList,
        '1.0.0',
        '1.1.0',
      );

      expect(result).toHaveLength(2);
      expect(result[0].migrated).toBe(true);
      expect(result[1].migrated).toBe(true);
      expect(loggerService.info).toHaveBeenCalledWith(
        '开始批量迁移事件数据',
        undefined,
        {
          count: 2,
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
        },
      );
      expect(loggerService.info).toHaveBeenCalledWith(
        '批量迁移完成',
        undefined,
        {
          total: 2,
          success: 2,
          failed: 0,
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
        },
      );
    });

    it('应该处理批量迁移中的部分失败', async () => {
      const errorMigration = jest.fn((data: any) => {
        if (data.eventId === 'id2') {
          throw new Error('迁移失败');
        }
        return { ...data, migrated: true };
      });

      service.registerMigrationScript(
        'UserCreated',
        '1.0.0',
        '1.1.0',
        errorMigration,
      );

      const eventDataList = [
        {
          eventType: 'UserCreated',
          eventId: 'id1',
          aggregateId: 'user-1',
          occurredOn: new Date(),
          name: 'John Doe',
        },
        {
          eventType: 'UserCreated',
          eventId: 'id2',
          aggregateId: 'user-2',
          occurredOn: new Date(),
          name: 'Jane Doe',
        },
      ];

      const result = await service.migrateBatchEventData(
        eventDataList,
        '1.0.0',
        '1.1.0',
      );

      expect(result).toHaveLength(1);
      expect(result[0].eventId).toBe('id1');
      expect(loggerService.info).toHaveBeenCalledWith(
        '批量迁移完成',
        undefined,
        {
          total: 2,
          success: 1,
          failed: 1,
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
        },
      );
      expect(loggerService.warn).toHaveBeenCalledWith(
        '批量迁移部分失败',
        undefined,
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              index: 1,
              error: expect.any(Error),
            }),
          ]),
        }),
      );
    });

    it('应该记录批量迁移进度', async () => {
      const eventDataList = Array.from({ length: 150 }, (_, i) => ({
        eventType: 'UserCreated',
        eventId: `id${i}`,
        aggregateId: `user-${i}`,
        occurredOn: new Date(),
        name: `User ${i}`,
      }));

      const result = await service.migrateBatchEventData(
        eventDataList,
        '1.0.0',
        '1.1.0',
      );

      expect(result).toHaveLength(150);
      // 应该记录进度（每100个记录一次）
      expect(loggerService.info).toHaveBeenCalledWith(
        '批量迁移进度',
        undefined,
        {
          processed: 100,
          total: 150,
          progress: '67%',
        },
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理迁移验证异常', async () => {
      const migratedData = {
        eventId: 'test-id',
        aggregateId: 'user-123',
        eventType: 'UserCreated',
        occurredOn: new Date(),
      };

      // 模拟验证过程中的异常
      const originalValidate = service['validateVersionSpecificData'];
      service['validateVersionSpecificData'] = jest
        .fn()
        .mockRejectedValue(new Error('验证异常'));

      const result = await service.validateMigration(migratedData, '1.1.0');

      expect(result).toBe(false);
      expect(loggerService.error).toHaveBeenCalledWith(
        '迁移验证失败',
        undefined,
        expect.objectContaining({
          error: '验证异常',
          migratedData,
          toVersion: '1.1.0',
        }),
      );

      // 恢复原始方法
      service['validateVersionSpecificData'] = originalValidate;
    });
  });
});
