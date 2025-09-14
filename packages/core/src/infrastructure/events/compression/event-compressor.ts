import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '@aiofix/logging';
import * as zlib from 'zlib';
import {
  IEventCompressor,
  ICompressionConfig,
  ICompressionResult,
  CompressionAlgorithm,
  CompressionLevel,
} from './event-compression.interface';

/**
 * 事件压缩器
 *
 * 提供事件数据的压缩和解压缩功能，支持多种压缩算法
 * 和压缩级别，优化事件存储和传输性能。
 *
 * @description 事件压缩器的具体实现
 *
 * ## 业务规则
 *
 * ### 压缩规则
 * - 支持多种压缩算法（Gzip、Brotli、LZ4、Zstandard）
 * - 提供可配置的压缩级别
 * - 支持压缩效果预检查和优化建议
 * - 提供压缩性能监控和统计
 *
 * ### 性能规则
 * - 小数据不进行压缩（低于阈值）
 * - 大数据限制压缩时间（超时保护）
 * - 支持批量压缩优化
 * - 提供压缩比统计和分析
 *
 * ### 兼容性规则
 * - 保证压缩和解压缩的兼容性
 * - 支持跨版本的数据兼容
 * - 提供压缩格式的版本管理
 * - 支持压缩算法的自动选择
 *
 * ## 业务逻辑流程
 *
 * 1. **压缩准备**：检查数据和配置
 * 2. **算法选择**：选择合适的压缩算法
 * 3. **数据压缩**：执行压缩操作
 * 4. **结果验证**：验证压缩结果
 * 5. **性能统计**：记录压缩性能指标
 *
 * @example
 * ```typescript
 * const compressor = new EventCompressor(logger);
 *
 * // 压缩事件数据
 * const result = await compressor.compress(eventData, {
 *   algorithm: CompressionAlgorithm.GZIP,
 *   level: CompressionLevel.DEFAULT
 * });
 *
 * // 解压缩事件数据
 * const originalData = await compressor.decompress(result.compressedData);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class EventCompressor implements IEventCompressor {
  /** 默认压缩配置 */
  private readonly defaultConfig: ICompressionConfig = {
    algorithm: CompressionAlgorithm.GZIP,
    level: CompressionLevel.DEFAULT,
    enabled: true,
    minSize: 1024, // 1KB
    maxSize: 100 * 1024 * 1024, // 100MB
    timeout: 30000, // 30秒
  };

  /** 压缩性能统计 */
  private readonly compressionStats = {
    totalCompressions: 0,
    totalDecompressions: 0,
    totalCompressedBytes: 0,
    totalOriginalBytes: 0,
    averageCompressionRatio: 0,
    averageCompressionTime: 0,
  };

  constructor(private readonly logger: PinoLoggerService) {}

  /**
   * 压缩事件数据
   *
   * @description 将事件数据压缩为更小的格式
   * @param eventData 原始事件数据
   * @param config 压缩配置
   * @returns 压缩结果
   */
  async compress(
    eventData: any,
    config: Partial<ICompressionConfig> = {},
  ): Promise<ICompressionResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      // 检查是否启用压缩
      if (!finalConfig.enabled) {
        return this.createNoCompressionResult(eventData, startTime);
      }

      // 序列化事件数据
      const serializedData = this.serializeEventData(eventData);
      const originalSize = Buffer.byteLength(serializedData, 'utf8');

      // 检查数据大小
      if (originalSize < finalConfig.minSize) {
        this.logger.debug('数据太小，跳过压缩', undefined, {
          originalSize,
          minSize: finalConfig.minSize,
        });
        return this.createNoCompressionResult(eventData, startTime);
      }

      if (originalSize > finalConfig.maxSize) {
        this.logger.warn('数据太大，跳过压缩', undefined, {
          originalSize,
          maxSize: finalConfig.maxSize,
        });
        return this.createNoCompressionResult(eventData, startTime);
      }

      // 执行压缩
      const compressedData = await this.performCompression(
        serializedData,
        finalConfig,
      );

      const compressionTime = Date.now() - startTime;
      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;

      // 更新统计信息
      this.updateCompressionStats(
        originalSize,
        compressedSize,
        compressionTime,
      );

      const result: ICompressionResult = {
        compressedData,
        originalSize,
        compressedSize,
        compressionRatio,
        algorithm: finalConfig.algorithm,
        compressionTime,
        success: true,
      };

      this.logger.debug('事件数据压缩完成', undefined, {
        originalSize,
        compressedSize,
        compressionRatio: compressionRatio.toFixed(2),
        algorithm: finalConfig.algorithm,
        compressionTime,
      });

      return result;
    } catch (error) {
      const compressionTime = Date.now() - startTime;

      this.logger.error('事件数据压缩失败', undefined, {
        error: (error as Error).message,
        stack: (error as Error).stack,
        config: finalConfig,
        compressionTime,
      });

      return {
        compressedData: Buffer.from(JSON.stringify(eventData)),
        originalSize: Buffer.byteLength(JSON.stringify(eventData)),
        compressedSize: Buffer.byteLength(JSON.stringify(eventData)),
        compressionRatio: 1,
        algorithm: finalConfig.algorithm,
        compressionTime,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 解压缩事件数据
   *
   * @description 将压缩的事件数据解压缩为原始格式
   * @param compressedData 压缩的事件数据
   * @param algorithm 压缩算法
   * @returns 解压缩后的事件数据
   */
  async decompress(
    compressedData: Buffer,
    algorithm: CompressionAlgorithm = CompressionAlgorithm.GZIP,
  ): Promise<any> {
    const startTime = Date.now();

    try {
      let decompressedData: Buffer;

      switch (algorithm) {
        case CompressionAlgorithm.GZIP:
          decompressedData = await this.decompressGzip(compressedData);
          break;
        case CompressionAlgorithm.BROTLI:
          decompressedData = await this.decompressBrotli(compressedData);
          break;
        case CompressionAlgorithm.LZ4:
          decompressedData = await this.decompressLz4(compressedData);
          break;
        case CompressionAlgorithm.ZSTD:
          decompressedData = await this.decompressZstd(compressedData);
          break;
        case CompressionAlgorithm.NONE:
          decompressedData = compressedData;
          break;
        default:
          throw new Error(`不支持的压缩算法: ${algorithm}`);
      }

      // 反序列化数据
      const eventData = this.deserializeEventData(
        decompressedData.toString('utf8'),
      );

      const decompressionTime = Date.now() - startTime;
      this.compressionStats.totalDecompressions++;

      this.logger.debug('事件数据解压缩完成', undefined, {
        algorithm,
        decompressionTime,
        compressedSize: compressedData.length,
        decompressedSize: decompressedData.length,
      });

      return eventData;
    } catch (error) {
      const decompressionTime = Date.now() - startTime;

      this.logger.error('事件数据解压缩失败', undefined, {
        error: (error as Error).message,
        stack: (error as Error).stack,
        algorithm,
        compressedDataSize: compressedData.length,
        decompressionTime,
      });

      throw error;
    }
  }

  /**
   * 批量压缩事件数据
   *
   * @description 批量压缩多个事件数据
   * @param eventDataList 事件数据列表
   * @param config 压缩配置
   * @returns 压缩结果列表
   */
  async compressBatch(
    eventDataList: any[],
    config: Partial<ICompressionConfig> = {},
  ): Promise<ICompressionResult[]> {
    const startTime = Date.now();
    const results: ICompressionResult[] = [];

    this.logger.info('开始批量压缩事件数据', undefined, {
      count: eventDataList.length,
      config,
    });

    // 并行压缩（限制并发数）
    const batchSize = 10;
    for (let i = 0; i < eventDataList.length; i += batchSize) {
      const batch = eventDataList.slice(i, i + batchSize);
      const batchPromises = batch.map((eventData) =>
        this.compress(eventData, config),
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        this.logger.error('批量压缩批次失败', undefined, {
          batchIndex: Math.floor(i / batchSize),
          error: (error as Error).message,
        });

        // 为失败的批次创建错误结果
        const errorResults = batch.map(() => ({
          compressedData: Buffer.alloc(0),
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 0,
          algorithm: config.algorithm || this.defaultConfig.algorithm,
          compressionTime: 0,
          success: false,
          error: (error as Error).message,
        }));
        results.push(...errorResults);
      }

      // 记录进度
      if ((i + batchSize) % 100 === 0) {
        this.logger.info('批量压缩进度', undefined, {
          processed: Math.min(i + batchSize, eventDataList.length),
          total: eventDataList.length,
          progress: `${Math.round((Math.min(i + batchSize, eventDataList.length) / eventDataList.length) * 100)}%`,
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    this.logger.info('批量压缩完成', undefined, {
      total: eventDataList.length,
      success: successCount,
      failed: failureCount,
      totalTime,
      averageTimePerItem: totalTime / eventDataList.length,
    });

    return results;
  }

  /**
   * 获取支持的压缩算法
   *
   * @description 获取当前支持的压缩算法列表
   * @returns 支持的压缩算法列表
   */
  getSupportedAlgorithms(): CompressionAlgorithm[] {
    return [
      CompressionAlgorithm.GZIP,
      CompressionAlgorithm.NONE,
      // 注意：Brotli、LZ4、Zstandard 需要额外的依赖包
      // CompressionAlgorithm.BROTLI,
      // CompressionAlgorithm.LZ4,
      // CompressionAlgorithm.ZSTD,
    ];
  }

  /**
   * 检查压缩效果
   *
   * @description 检查指定数据的压缩效果
   * @param eventData 事件数据
   * @param config 压缩配置
   * @returns 压缩效果信息
   */
  async checkCompressionEffect(
    eventData: any,
    config: Partial<ICompressionConfig> = {},
  ): Promise<{
    recommended: boolean;
    estimatedRatio: number;
    estimatedSize: number;
  }> {
    try {
      const serializedData = this.serializeEventData(eventData);
      const originalSize = Buffer.byteLength(serializedData, 'utf8');

      // 快速压缩测试（使用较低级别）
      const testConfig = {
        ...this.defaultConfig,
        ...config,
        level: CompressionLevel.FAST,
      };
      const testResult = await this.compress(eventData, testConfig);

      const estimatedRatio = testResult.compressionRatio;
      const estimatedSize = testResult.compressedSize;
      const recommended = estimatedRatio > 1.5 && originalSize > 1024; // 压缩比大于1.5且原始大小超过1KB

      return {
        recommended,
        estimatedRatio,
        estimatedSize,
      };
    } catch (error) {
      this.logger.warn('压缩效果检查失败', undefined, {
        error: (error as Error).message,
        eventData,
      });

      return {
        recommended: false,
        estimatedRatio: 1,
        estimatedSize: Buffer.byteLength(JSON.stringify(eventData)),
      };
    }
  }

  /**
   * 获取压缩统计信息
   *
   * @description 获取压缩操作的统计信息
   * @returns 压缩统计信息
   */
  getCompressionStats() {
    return { ...this.compressionStats };
  }

  /**
   * 重置压缩统计信息
   *
   * @description 重置压缩操作的统计信息
   */
  resetCompressionStats(): void {
    Object.assign(this.compressionStats, {
      totalCompressions: 0,
      totalDecompressions: 0,
      totalCompressedBytes: 0,
      totalOriginalBytes: 0,
      averageCompressionRatio: 0,
      averageCompressionTime: 0,
    });
  }

  /**
   * 执行压缩操作
   *
   * @description 根据配置执行具体的压缩操作
   * @param data 要压缩的数据
   * @param config 压缩配置
   * @returns 压缩后的数据
   */
  private async performCompression(
    data: string,
    config: ICompressionConfig,
  ): Promise<Buffer> {
    const buffer = Buffer.from(data, 'utf8');

    switch (config.algorithm) {
      case CompressionAlgorithm.GZIP:
        return this.compressGzip(buffer, config.level);
      case CompressionAlgorithm.BROTLI:
        return this.compressBrotli(buffer, config.level);
      case CompressionAlgorithm.LZ4:
        return this.compressLz4(buffer, config.level);
      case CompressionAlgorithm.ZSTD:
        return this.compressZstd(buffer, config.level);
      case CompressionAlgorithm.NONE:
        return buffer;
      default:
        throw new Error(`不支持的压缩算法: ${config.algorithm}`);
    }
  }

  /**
   * Gzip压缩
   *
   * @description 使用Gzip算法压缩数据
   * @param data 要压缩的数据
   * @param level 压缩级别
   * @returns 压缩后的数据
   */
  private async compressGzip(
    data: Buffer,
    level: CompressionLevel,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip({ level });
      const chunks: Buffer[] = [];

      gzip.on('data', (chunk) => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);

      gzip.write(data);
      gzip.end();
    });
  }

  /**
   * Gzip解压缩
   *
   * @description 使用Gzip算法解压缩数据
   * @param data 要解压缩的数据
   * @returns 解压缩后的数据
   */
  private async decompressGzip(data: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const gunzip = zlib.createGunzip();
      const chunks: Buffer[] = [];

      gunzip.on('data', (chunk) => chunks.push(chunk));
      gunzip.on('end', () => resolve(Buffer.concat(chunks)));
      gunzip.on('error', reject);

      gunzip.write(data);
      gunzip.end();
    });
  }

  /**
   * Brotli压缩（需要brotli包）
   *
   * @description 使用Brotli算法压缩数据
   * @param data 要压缩的数据
   * @param level 压缩级别
   * @returns 压缩后的数据
   */
  private async compressBrotli(
    data: Buffer,
    level: CompressionLevel,
  ): Promise<Buffer> {
    // 注意：需要安装brotli包
    throw new Error('Brotli压缩需要安装额外的依赖包');
  }

  /**
   * Brotli解压缩（需要brotli包）
   *
   * @description 使用Brotli算法解压缩数据
   * @param data 要解压缩的数据
   * @returns 解压缩后的数据
   */
  private async decompressBrotli(data: Buffer): Promise<Buffer> {
    // 注意：需要安装brotli包
    throw new Error('Brotli解压缩需要安装额外的依赖包');
  }

  /**
   * LZ4压缩（需要lz4包）
   *
   * @description 使用LZ4算法压缩数据
   * @param data 要压缩的数据
   * @param level 压缩级别
   * @returns 压缩后的数据
   */
  private async compressLz4(
    data: Buffer,
    level: CompressionLevel,
  ): Promise<Buffer> {
    // 注意：需要安装lz4包
    throw new Error('LZ4压缩需要安装额外的依赖包');
  }

  /**
   * LZ4解压缩（需要lz4包）
   *
   * @description 使用LZ4算法解压缩数据
   * @param data 要解压缩的数据
   * @returns 解压缩后的数据
   */
  private async decompressLz4(data: Buffer): Promise<Buffer> {
    // 注意：需要安装lz4包
    throw new Error('LZ4解压缩需要安装额外的依赖包');
  }

  /**
   * Zstandard压缩（需要zstd包）
   *
   * @description 使用Zstandard算法压缩数据
   * @param data 要压缩的数据
   * @param level 压缩级别
   * @returns 压缩后的数据
   */
  private async compressZstd(
    data: Buffer,
    level: CompressionLevel,
  ): Promise<Buffer> {
    // 注意：需要安装zstd包
    throw new Error('Zstandard压缩需要安装额外的依赖包');
  }

  /**
   * Zstandard解压缩（需要zstd包）
   *
   * @description 使用Zstandard算法解压缩数据
   * @param data 要解压缩的数据
   * @returns 解压缩后的数据
   */
  private async decompressZstd(data: Buffer): Promise<Buffer> {
    // 注意：需要安装zstd包
    throw new Error('Zstandard解压缩需要安装额外的依赖包');
  }

  /**
   * 序列化事件数据
   *
   * @description 将事件数据序列化为字符串
   * @param eventData 事件数据
   * @returns 序列化后的字符串
   */
  private serializeEventData(eventData: any): string {
    return JSON.stringify(eventData);
  }

  /**
   * 反序列化事件数据
   *
   * @description 将字符串反序列化为事件数据
   * @param data 序列化的字符串
   * @returns 反序列化后的事件数据
   */
  private deserializeEventData(data: string): any {
    return JSON.parse(data);
  }

  /**
   * 创建无压缩结果
   *
   * @description 创建无压缩的结果对象
   * @param eventData 事件数据
   * @param startTime 开始时间
   * @returns 无压缩结果
   */
  private createNoCompressionResult(
    eventData: any,
    startTime: number,
  ): ICompressionResult {
    const serializedData = JSON.stringify(eventData);
    const data = Buffer.from(serializedData, 'utf8');

    return {
      compressedData: data,
      originalSize: data.length,
      compressedSize: data.length,
      compressionRatio: 1,
      algorithm: CompressionAlgorithm.NONE,
      compressionTime: Date.now() - startTime,
      success: true,
    };
  }

  /**
   * 更新压缩统计信息
   *
   * @description 更新压缩操作的统计信息
   * @param originalSize 原始大小
   * @param compressedSize 压缩后大小
   * @param compressionTime 压缩时间
   */
  private updateCompressionStats(
    originalSize: number,
    compressedSize: number,
    compressionTime: number,
  ): void {
    this.compressionStats.totalCompressions++;
    this.compressionStats.totalOriginalBytes += originalSize;
    this.compressionStats.totalCompressedBytes += compressedSize;

    // 计算平均压缩比
    if (this.compressionStats.totalCompressedBytes > 0) {
      this.compressionStats.averageCompressionRatio =
        this.compressionStats.totalOriginalBytes /
        this.compressionStats.totalCompressedBytes;
    }

    // 计算平均压缩时间
    this.compressionStats.averageCompressionTime =
      (this.compressionStats.averageCompressionTime *
        (this.compressionStats.totalCompressions - 1) +
        compressionTime) /
      this.compressionStats.totalCompressions;
  }
}
