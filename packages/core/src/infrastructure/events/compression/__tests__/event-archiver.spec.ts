import { Test, TestingModule } from '@nestjs/testing';
import { EventArchiver } from '../event-archiver';
import { EventCompressor } from '../event-compressor';
import { PinoLoggerService } from '@aiofix/logging';
import { ArchiveStrategy } from '../event-compression.interface';

/**
 * EventArchiver 单元测试
 *
 * @description 测试事件归档组件的功能
 */
describe('EventArchiver', () => {
  let service: EventArchiver;
  let compressor: jest.Mocked<EventCompressor>;
  let loggerService: jest.Mocked<PinoLoggerService>;

  beforeEach(async () => {
    const mockCompressor = {
      compressBatch: jest.fn(),
      getSupportedAlgorithms: jest.fn(),
    };

    const mockLoggerService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventArchiver,
        {
          provide: EventCompressor,
          useValue: mockCompressor,
        },
        {
          provide: PinoLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<EventArchiver>(EventArchiver);
    compressor = module.get(EventCompressor);
    loggerService = module.get(PinoLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该正确初始化服务', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(EventArchiver);
    });
  });

  describe('archiveEvents', () => {
    const testEvents = [
      {
        id: 'test-event-1',
        type: 'TestEvent',
        data: { message: 'Test message 1', timestamp: Date.now() },
        metadata: { version: '1.0.0', tenantId: 'tenant-1' },
      },
      {
        id: 'test-event-2',
        type: 'TestEvent',
        data: { message: 'Test message 2', timestamp: Date.now() },
        metadata: { version: '1.0.0', tenantId: 'tenant-1' },
      },
    ];

    beforeEach(() => {
      compressor.compressBatch.mockResolvedValue([
        {
          compressedData: Buffer.from('compressed-data-1'),
          originalSize: 100,
          compressedSize: 50,
          compressionRatio: 2,
          algorithm: 'gzip' as any,
          compressionTime: 10,
          success: true,
        },
        {
          compressedData: Buffer.from('compressed-data-2'),
          originalSize: 120,
          compressedSize: 60,
          compressionRatio: 2,
          algorithm: 'gzip' as any,
          compressionTime: 12,
          success: true,
        },
      ]);
    });

    it('应该使用时间策略归档事件', async () => {
      const result = await service.archiveEvents(testEvents, {
        strategy: ArchiveStrategy.BY_TIME,
        retention: {
          hotDataRetention: 7,
          warmDataRetention: 30,
          coldDataRetention: 365,
        },
        compression: {
          algorithm: 'gzip' as any,
          level: 6,
          enabled: true,
          minSize: 1024,
          maxSize: 10485760,
          timeout: 30000,
        },
      });

      expect(result).toBeDefined();
      expect(result.archiveId).toBeDefined();
      expect(result.eventCount).toBe(testEvents.length);
      expect(result.archivedSize).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.startTime).toBeInstanceOf(Date);
    });

    it('应该使用大小策略归档事件', async () => {
      const result = await service.archiveEvents(testEvents, {
        strategy: ArchiveStrategy.BY_SIZE,
        triggerConditions: { sizeThreshold: 1 }, // 1MB
        compression: {
          algorithm: 'gzip' as any,
          level: 6,
          enabled: true,
          minSize: 1024,
          maxSize: 10485760,
          timeout: 30000,
        },
      });

      expect(result).toBeDefined();
      expect(result.archiveId).toBeDefined();
      expect(result.eventCount).toBe(testEvents.length);
      expect(result.archivedSize).toBeGreaterThan(0);
    });

    it('应该使用事件类型策略归档事件', async () => {
      const result = await service.archiveEvents(testEvents, {
        strategy: ArchiveStrategy.BY_EVENT_TYPE,
        triggerConditions: { eventCountThreshold: 1 },
        compression: {
          algorithm: 'gzip' as any,
          level: 6,
          enabled: true,
          minSize: 1024,
          maxSize: 10485760,
          timeout: 30000,
        },
      });

      expect(result).toBeDefined();
      expect(result.archiveId).toBeDefined();
      expect(result.eventCount).toBe(testEvents.length);
    });

    it('应该使用租户策略归档事件', async () => {
      const result = await service.archiveEvents(testEvents, {
        strategy: ArchiveStrategy.BY_TENANT,
        triggerConditions: { eventCountThreshold: 1 },
        compression: {
          algorithm: 'gzip' as any,
          level: 6,
          enabled: true,
          minSize: 1024,
          maxSize: 10485760,
          timeout: 30000,
        },
      });

      expect(result).toBeDefined();
      expect(result.archiveId).toBeDefined();
      expect(result.eventCount).toBe(testEvents.length);
    });

    it('应该处理空事件列表', async () => {
      const result = await service.archiveEvents([], {
        strategy: ArchiveStrategy.BY_TIME,
        retention: {
          hotDataRetention: 7,
          warmDataRetention: 30,
          coldDataRetention: 365,
        },
      });

      expect(result).toBeDefined();
      expect(result.archiveId).toBeDefined();
      expect(result.eventCount).toBe(0);
    });

    it('应该处理归档失败的情况', async () => {
      compressor.compressBatch.mockRejectedValue(new Error('压缩失败'));

      await expect(
        service.archiveEvents(testEvents, {
          strategy: ArchiveStrategy.BY_TIME,
          retention: {
            hotDataRetention: 7,
            warmDataRetention: 30,
            coldDataRetention: 365,
          },
        }),
      ).rejects.toThrow('压缩失败');
    });

    it('应该记录归档统计信息', async () => {
      await service.archiveEvents(testEvents, {
        strategy: ArchiveStrategy.BY_TIME,
        retention: {
          hotDataRetention: 7,
          warmDataRetention: 30,
          coldDataRetention: 365,
        },
        compression: {
          algorithm: 'gzip' as any,
          level: 6,
          enabled: true,
          minSize: 1024,
          maxSize: 10485760,
          timeout: 30000,
        },
      });

      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('开始归档事件数据'),
        undefined,
        expect.objectContaining({
          archiveId: expect.any(String),
          eventCount: testEvents.length,
          strategy: ArchiveStrategy.BY_TIME,
        }),
      );
    });
  });

  describe('listArchives', () => {
    it('应该列出所有归档', async () => {
      const archives = await service.listArchives();

      expect(archives).toBeDefined();
      expect(Array.isArray(archives)).toBe(true);
    });

    it('应该按日期范围过滤归档列表', async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const archives = await service.listArchives({
        startDate: oneDayAgo,
        endDate: now,
      });

      expect(archives).toBeDefined();
      expect(Array.isArray(archives)).toBe(true);
    });

    it('应该按租户过滤归档列表', async () => {
      const archives = await service.listArchives({
        tenantId: 'tenant-1',
      });

      expect(archives).toBeDefined();
      expect(Array.isArray(archives)).toBe(true);
    });

    it('应该按事件类型过滤归档列表', async () => {
      const archives = await service.listArchives({
        eventType: 'TestEvent',
      });

      expect(archives).toBeDefined();
      expect(Array.isArray(archives)).toBe(true);
    });
  });

  describe('deleteArchives', () => {
    it('应该能够删除归档', async () => {
      const result = await service.deleteArchive('archive-id-1');

      expect(result).toBeDefined();
      expect(typeof result).toBe('boolean');
    });

    it('应该处理删除不存在的归档', async () => {
      const result = await service.deleteArchive('non-existent-archive-id');

      expect(result).toBeDefined();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('cleanupExpiredArchives', () => {
    it('应该清理过期的归档', async () => {
      const result = await service.cleanupExpiredArchives({
        strategy: ArchiveStrategy.BY_TIME,
        enabled: true,
        triggerConditions: { timeInterval: 30 },
        compression: {
          algorithm: 'gzip' as any,
          level: 6,
          enabled: true,
          minSize: 1024,
          maxSize: 10485760,
          timeout: 30000,
        },
        storageLocation: '/tmp',
        retention: {
          hotDataRetention: 7,
          warmDataRetention: 30,
          coldDataRetention: 365,
        },
      });

      expect(result).toBeDefined();
      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
      expect(result.freedSpace).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.deletedArchives)).toBe(true);
    });

    it('应该记录清理统计信息', async () => {
      await service.cleanupExpiredArchives({
        strategy: ArchiveStrategy.BY_TIME,
        enabled: true,
        triggerConditions: { timeInterval: 30 },
        compression: {
          algorithm: 'gzip' as any,
          level: 6,
          enabled: true,
          minSize: 1024,
          maxSize: 10485760,
          timeout: 30000,
        },
        storageLocation: '/tmp',
        retention: {
          hotDataRetention: 7,
          warmDataRetention: 30,
          coldDataRetention: 365,
        },
      });

      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('过期归档清理完成'),
        undefined,
        expect.objectContaining({
          deletedCount: expect.any(Number),
          freedSpace: expect.any(Number),
        }),
      );
    });
  });

  describe('getArchiveInfo', () => {
    it('应该返回归档信息', async () => {
      const info = await service.getArchiveInfo('test-archive-id');

      expect(info).toBeDefined();
      expect(typeof info).toBe('object');
    });

    it('应该处理不存在的归档', async () => {
      const info = await service.getArchiveInfo('non-existent-archive-id');

      expect(info).toBeDefined();
      expect(typeof info).toBe('object');
    });
  });

  describe('错误处理', () => {
    it('应该处理文件系统错误', async () => {
      const testEvents = [
        {
          id: 'fs-error-test',
          type: 'FSErrorTestEvent',
          data: { message: 'FS error test' },
          metadata: { version: '1.0.0' },
        },
      ];

      // 模拟文件系统错误
      compressor.compressBatch.mockRejectedValue(new Error('文件系统错误'));

      await expect(
        service.archiveEvents(testEvents, {
          strategy: ArchiveStrategy.BY_TIME,
          retention: {
            hotDataRetention: 7,
            warmDataRetention: 30,
            coldDataRetention: 365,
          },
        }),
      ).rejects.toThrow('文件系统错误');
    });

    it('应该处理无效配置', async () => {
      const testEvents = [
        {
          id: 'invalid-config-test',
          type: 'InvalidConfigTestEvent',
          data: { message: 'Invalid config test' },
          metadata: { version: '1.0.0' },
        },
      ];

      await expect(
        service.archiveEvents(testEvents, {
          strategy: 'invalid-strategy' as any,
          retention: {
            hotDataRetention: 7,
            warmDataRetention: 30,
            coldDataRetention: 365,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量事件的归档', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-test-${i}`,
        type: 'PerformanceTestEvent',
        data: { message: `Event ${i}`, timestamp: Date.now() + i },
        metadata: { version: '1.0.0', index: i },
      }));

      // Mock压缩结果
      const mockCompressionResults = events.map((_, i) => ({
        compressedData: Buffer.from(`compressed-data-${i}`),
        originalSize: 100 + i,
        compressedSize: 50 + i,
        compressionRatio: 2,
        algorithm: 'gzip' as any,
        compressionTime: 10,
        success: true,
      }));

      compressor.compressBatch.mockResolvedValue(mockCompressionResults);

      const startTime = Date.now();
      const result = await service.archiveEvents(events, {
        strategy: ArchiveStrategy.BY_TIME,
        retention: {
          hotDataRetention: 7,
          warmDataRetention: 30,
          coldDataRetention: 365,
        },
        compression: {
          algorithm: 'gzip' as any,
          level: 6,
          enabled: true,
          minSize: 1024,
          maxSize: 10485760,
          timeout: 30000,
        },
      });
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.eventCount).toBe(events.length);
      expect(endTime - startTime).toBeLessThan(5000); // 应该在5秒内完成
    });
  });
});
