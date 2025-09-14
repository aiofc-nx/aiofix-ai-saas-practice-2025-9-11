import { Test, TestingModule } from '@nestjs/testing';
import { EventCompressor } from '../event-compressor';
import { PinoLoggerService } from '@aiofix/logging';
import {
  CompressionAlgorithm,
  CompressionLevel,
} from '../event-compression.interface';

/**
 * EventCompressor 单元测试
 *
 * @description 测试事件压缩组件的功能
 */
describe('EventCompressor', () => {
  let service: EventCompressor;
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
        EventCompressor,
        {
          provide: PinoLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<EventCompressor>(EventCompressor);
    loggerService = module.get(PinoLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该正确初始化服务', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(EventCompressor);
    });
  });

  describe('compress', () => {
    const testData = {
      id: 'test-id',
      type: 'TestEvent',
      data: { message: 'Hello World', timestamp: Date.now() },
      metadata: { version: '1.0.0', source: 'test' },
    };

    it('应该使用gzip算法压缩数据', async () => {
      const result = await service.compress(testData, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      expect(result).toBeDefined();
      expect(result.algorithm).toBe(CompressionAlgorithm.GZIP);
      expect(result.compressedData).toBeDefined();
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeLessThanOrEqual(1);
    });

    it('应该使用无压缩算法', async () => {
      const result = await service.compress(testData, {
        algorithm: CompressionAlgorithm.NONE,
        level: CompressionLevel.DEFAULT,
      });

      expect(result).toBeDefined();
      expect(result.algorithm).toBe(CompressionAlgorithm.NONE);
      expect(result.compressedData).toBeDefined();
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
      expect(result.compressionRatio).toBe(1);
    });

    it('应该处理空数据', async () => {
      const emptyData = {};
      const result = await service.compress(emptyData, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      expect(result).toBeDefined();
      expect(result.algorithm).toBe(CompressionAlgorithm.GZIP);
      expect(result.compressedData).toBeDefined();
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
    });

    it('应该处理大数据', async () => {
      const largeData = {
        id: 'large-test-id',
        type: 'LargeEvent',
        data: {
          message: 'A'.repeat(1000), // 1KB字符串
          array: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            value: `item-${i}`,
          })),
        },
        metadata: { version: '1.0.0', source: 'test' },
      };

      const result = await service.compress(largeData, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      expect(result).toBeDefined();
      expect(result.originalSize).toBeGreaterThan(1000);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeLessThanOrEqual(1);
    });

    it('应该记录压缩统计信息', async () => {
      await service.compress(testData, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      expect(loggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining('事件数据压缩完成'),
        undefined,
        expect.objectContaining({
          algorithm: CompressionAlgorithm.GZIP,
          originalSize: expect.any(Number),
          compressedSize: expect.any(Number),
          compressionRatio: expect.any(Number),
        }),
      );
    });
  });

  describe('decompress', () => {
    it('应该正确解压缩gzip数据', async () => {
      const originalData = {
        id: 'test-id',
        type: 'TestEvent',
        data: { message: 'Hello World', timestamp: Date.now() },
      };

      // 先压缩
      const compressed = await service.compress(originalData, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      // 再解压缩
      const decompressed = await service.decompress(
        compressed.compressedData,
        CompressionAlgorithm.GZIP,
      );

      expect(decompressed).toEqual(originalData);
    });

    it('应该正确解压缩无压缩数据', async () => {
      const originalData = {
        id: 'test-id',
        type: 'TestEvent',
        data: { message: 'Hello World', timestamp: Date.now() },
      };

      const compressed = await service.compress(originalData, {
        algorithm: CompressionAlgorithm.NONE,
        level: CompressionLevel.DEFAULT,
      });

      const decompressed = await service.decompress(
        compressed.compressedData,
        CompressionAlgorithm.NONE,
      );

      expect(decompressed).toEqual(originalData);
    });

    it('应该处理解压缩失败的情况', async () => {
      const invalidData = Buffer.from('invalid-compressed-data');

      await expect(
        service.decompress(invalidData, CompressionAlgorithm.GZIP),
      ).rejects.toThrow();
    });

    it('应该记录解压缩统计信息', async () => {
      const originalData = { test: 'data' };
      const compressed = await service.compress(originalData, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      await service.decompress(
        compressed.compressedData,
        CompressionAlgorithm.GZIP,
      );

      expect(loggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining('事件数据解压缩完成'),
        undefined,
        expect.objectContaining({
          algorithm: CompressionAlgorithm.GZIP,
          compressedSize: expect.any(Number),
          decompressedSize: expect.any(Number),
        }),
      );
    });
  });

  describe('getSupportedAlgorithms', () => {
    it('应该返回支持的压缩算法列表', () => {
      const algorithms = service.getSupportedAlgorithms();

      expect(algorithms).toBeDefined();
      expect(Array.isArray(algorithms)).toBe(true);
      expect(algorithms.length).toBeGreaterThan(0);
      expect(algorithms).toContain(CompressionAlgorithm.GZIP);
      expect(algorithms).toContain(CompressionAlgorithm.NONE);
    });
  });

  describe('checkCompressionEffect', () => {
    it('应该检查压缩效果', async () => {
      const testData = {
        id: 'test-id',
        type: 'TestEvent',
        data: { message: 'Hello World' },
      };

      const effect = await service.checkCompressionEffect(testData, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      expect(effect).toBeDefined();
      expect(effect.recommended).toBeDefined();
      expect(effect.estimatedRatio).toBeGreaterThan(0);
      expect(effect.estimatedSize).toBeGreaterThan(0);
    });

    it('应该处理压缩效果检查失败', async () => {
      const invalidData = null as any;

      const effect = await service.checkCompressionEffect(invalidData, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      expect(effect).toBeDefined();
      expect(effect.recommended).toBe(false);
      expect(effect.estimatedRatio).toBe(1);
      expect(effect.estimatedSize).toBeGreaterThan(0);
    });
  });

  describe('compressBatch', () => {
    it('应该支持批量压缩多个事件', async () => {
      const events = [
        { id: '1', type: 'Event1', data: { message: 'Event 1' } },
        { id: '2', type: 'Event2', data: { message: 'Event 2' } },
        { id: '3', type: 'Event3', data: { message: 'Event 3' } },
      ];

      const results = await service.compressBatch(events, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      expect(results).toBeDefined();
      expect(results.length).toBe(events.length);
      expect(results[0].algorithm).toBe(CompressionAlgorithm.GZIP);
      expect(results[0].originalSize).toBeGreaterThan(0);
      expect(results[0].compressedSize).toBeGreaterThan(0);
    });

    it('应该处理批量压缩中的错误', async () => {
      const events = [
        { id: '1', type: 'Event1', data: { message: 'Event 1' } },
        null as any, // 无效数据
        { id: '3', type: 'Event3', data: { message: 'Event 3' } },
      ];

      const results = await service.compressBatch(events, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      expect(results).toBeDefined();
      expect(results.length).toBe(events.length);
      // 应该有一些失败的结果
      const failedResults = results.filter((r) => !r.success);
      expect(failedResults.length).toBeGreaterThan(0);
    });
  });

  describe('批量解压缩', () => {
    it('应该支持批量解压缩多个事件', async () => {
      const events = [
        { id: '1', type: 'Event1', data: { message: 'Event 1' } },
        { id: '2', type: 'Event2', data: { message: 'Event 2' } },
      ];

      // 先批量压缩
      const compressed = await service.compressBatch(events, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });

      // 逐个解压缩
      const decompressed: any[] = [];
      for (const result of compressed) {
        if (result.success) {
          const decompressedItem = await service.decompress(
            result.compressedData,
            CompressionAlgorithm.GZIP,
          );
          decompressed.push(decompressedItem as any);
        }
      }

      expect(decompressed).toBeDefined();
      expect(decompressed.length).toBeGreaterThan(0);
      expect(decompressed[0]).toEqual(events[0]);
    });

    it('应该处理批量解压缩中的错误', async () => {
      const invalidData = Buffer.from('invalid-data');

      await expect(
        service.decompress(invalidData, CompressionAlgorithm.GZIP),
      ).rejects.toThrow();
    });
  });

  describe('性能测试', () => {
    it('应该高效处理压缩操作', async () => {
      const largeData = {
        message: 'A'.repeat(1000),
        array: Array.from({ length: 100 }, (_, i) => ({ id: i })),
      };

      const startTime = Date.now();
      await service.compress(largeData, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该高效处理批量压缩', async () => {
      const events = Array.from({ length: 50 }, (_, i) => ({
        id: `perf-test-${i}`,
        type: 'PerformanceTestEvent',
        data: { message: `Event ${i}`, timestamp: Date.now() + i },
      }));

      const startTime = Date.now();
      const results = await service.compressBatch(events, {
        algorithm: CompressionAlgorithm.GZIP,
        level: CompressionLevel.DEFAULT,
      });
      const endTime = Date.now();

      expect(results).toBeDefined();
      expect(results.length).toBe(events.length);
      expect(endTime - startTime).toBeLessThan(5000); // 应该在5秒内完成
    });
  });
});
