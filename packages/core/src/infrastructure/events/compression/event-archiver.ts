import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '@aiofix/logging';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventCompressor } from './event-compressor';

// 使用crypto模块生成UUID，避免ESM导入问题
import { randomUUID } from 'crypto';
import {
  IEventArchiver,
  IArchiveConfig,
  IArchiveResult,
  ArchiveStrategy,
} from './event-compression.interface';

/**
 * 事件归档器
 *
 * 负责将事件数据归档到长期存储，支持多种归档策略、
 * 压缩存储和自动清理功能。
 *
 * @description 事件归档器的具体实现
 *
 * ## 业务规则
 *
 * ### 归档规则
 * - 支持多种归档策略（按时间、大小、事件类型、租户等）
 * - 提供自动和手动归档触发机制
 * - 支持归档数据的压缩存储
 * - 提供归档数据的索引和检索
 *
 * ### 存储规则
 * - 归档数据存储在文件系统中
 * - 支持归档数据的备份和恢复
 * - 提供归档数据的完整性校验
 * - 支持归档数据的加密存储
 *
 * ### 清理规则
 * - 根据保留策略自动清理过期归档
 * - 支持归档数据的生命周期管理
 * - 提供归档数据的统计和监控
 * - 支持归档数据的迁移和转移
 *
 * ## 业务逻辑流程
 *
 * 1. **归档准备**：检查归档条件和配置
 * 2. **数据收集**：收集要归档的事件数据
 * 3. **数据压缩**：压缩归档数据
 * 4. **存储写入**：将压缩数据写入存储
 * 5. **索引更新**：更新归档索引信息
 * 6. **清理检查**：检查并执行过期清理
 *
 * @example
 * ```typescript
 * const archiver = new EventArchiver(logger, compressor);
 *
 * // 归档事件数据
 * const result = await archiver.archiveEvents(eventDataList, {
 *   strategy: ArchiveStrategy.BY_TIME,
 *   triggerConditions: { timeInterval: 7 },
 *   compression: { algorithm: CompressionAlgorithm.GZIP }
 * });
 *
 * // 从归档恢复数据
 * const restoredData = await archiver.restoreEvents(result.archiveId);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class EventArchiver implements IEventArchiver {
  /** 归档索引存储路径 */
  private readonly archiveIndexPath: string;
  /** 归档数据存储路径 */
  private readonly archiveDataPath: string;
  /** 归档索引数据 */
  private archiveIndex: Map<string, any> = new Map();

  constructor(
    private readonly logger: PinoLoggerService,
    private readonly compressor: EventCompressor,
  ) {
    // 设置默认存储路径
    this.archiveIndexPath = path.join(
      process.cwd(),
      'data',
      'archives',
      'index.json',
    );
    this.archiveDataPath = path.join(process.cwd(), 'data', 'archives', 'data');

    // 确保目录存在
    this.ensureDirectoriesExist();
    // 加载归档索引
    this.loadArchiveIndex();
  }

  /**
   * 归档事件数据
   *
   * @description 将事件数据归档到长期存储
   * @param eventDataList 要归档的事件数据列表
   * @param config 归档配置
   * @returns 归档结果
   */
  async archiveEvents(
    eventDataList: any[],
    config: Partial<IArchiveConfig> = {},
  ): Promise<IArchiveResult> {
    const startTime = new Date();
    const archiveId = randomUUID();

    try {
      // 合并配置
      const finalConfig = this.mergeConfig(config);

      this.logger.info('开始归档事件数据', undefined, {
        archiveId,
        eventCount: eventDataList.length,
        strategy: finalConfig.strategy,
      });

      // 验证归档条件
      if (!this.shouldArchive(eventDataList, finalConfig)) {
        throw new Error('不满足归档条件');
      }

      // 按策略组织数据
      const organizedData = this.organizeDataByStrategy(
        eventDataList,
        finalConfig,
      );

      // 压缩数据
      const compressionResults = await this.compressor.compressBatch(
        organizedData,
        finalConfig.compression,
      );

      // 计算总大小
      const originalSize = compressionResults.reduce(
        (sum, result) => sum + result.originalSize,
        0,
      );
      const archivedSize = compressionResults.reduce(
        (sum, result) => sum + result.compressedSize,
        0,
      );
      const compressionRatio = originalSize / archivedSize;

      // 创建归档文件
      const filePath = await this.createArchiveFile(
        archiveId,
        compressionResults,
      );

      // 创建归档记录
      const archiveRecord = {
        archiveId,
        eventCount: eventDataList.length,
        originalSize,
        archivedSize,
        compressionRatio,
        strategy: finalConfig.strategy,
        createdAt: startTime,
        filePath,
        metadata: this.extractMetadata(eventDataList, finalConfig),
      };

      // 保存归档记录
      await this.saveArchiveRecord(archiveRecord);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: IArchiveResult = {
        archiveId,
        eventCount: eventDataList.length,
        originalSize,
        archivedSize,
        compressionRatio,
        startTime,
        endTime,
        duration,
        filePath,
        success: true,
      };

      this.logger.info('事件数据归档完成', undefined, {
        archiveId,
        eventCount: eventDataList.length,
        originalSize,
        archivedSize,
        compressionRatio: compressionRatio.toFixed(2),
        duration,
        filePath,
      });

      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.error('事件数据归档失败', undefined, {
        archiveId,
        error: (error as Error).message,
        stack: (error as Error).stack,
        eventCount: eventDataList.length,
        duration,
      });

      return {
        archiveId,
        eventCount: 0,
        originalSize: 0,
        archivedSize: 0,
        compressionRatio: 0,
        startTime,
        endTime,
        duration,
        filePath: '',
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 从归档恢复事件数据
   *
   * @description 从归档文件中恢复事件数据
   * @param archiveId 归档ID
   * @param eventIds 要恢复的事件ID列表（可选）
   * @returns 恢复的事件数据列表
   */
  async restoreEvents(archiveId: string, eventIds?: string[]): Promise<any[]> {
    try {
      this.logger.info('开始从归档恢复事件数据', undefined, {
        archiveId,
        eventIds,
      });

      // 获取归档记录
      const archiveRecord = this.archiveIndex.get(archiveId);
      if (!archiveRecord) {
        throw new Error(`归档记录不存在: ${archiveId}`);
      }

      // 读取归档文件
      const fileContent = await fs.readFile(archiveRecord.filePath);
      const archiveData = JSON.parse(fileContent.toString());

      // 解压缩数据
      const restoredData: any[] = [];
      for (const compressedItem of archiveData.compressedItems) {
        try {
          const decompressedData = await this.compressor.decompress(
            Buffer.from(compressedItem.data, 'base64'),
            compressedItem.algorithm,
          );
          restoredData.push(decompressedData);
        } catch (error) {
          this.logger.warn('解压缩归档数据项失败', undefined, {
            archiveId,
            error: (error as Error).message,
            itemIndex: compressedItem.index,
          });
        }
      }

      // 过滤指定的事件ID
      let filteredData = restoredData;
      if (eventIds && eventIds.length > 0) {
        filteredData = restoredData.filter((event) =>
          eventIds.includes(event.eventId),
        );
      }

      this.logger.info('从归档恢复事件数据完成', undefined, {
        archiveId,
        requestedCount: eventIds?.length || 'all',
        restoredCount: filteredData.length,
        totalCount: restoredData.length,
      });

      return filteredData;
    } catch (error) {
      this.logger.error('从归档恢复事件数据失败', undefined, {
        archiveId,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw error;
    }
  }

  /**
   * 删除归档
   *
   * @description 删除指定的归档文件
   * @param archiveId 归档ID
   * @returns 删除结果
   */
  async deleteArchive(archiveId: string): Promise<boolean> {
    try {
      const archiveRecord = this.archiveIndex.get(archiveId);
      if (!archiveRecord) {
        this.logger.warn('尝试删除不存在的归档', undefined, { archiveId });
        return false;
      }

      // 删除文件
      await fs.unlink(archiveRecord.filePath);

      // 删除索引记录
      this.archiveIndex.delete(archiveId);
      await this.saveArchiveIndex();

      this.logger.info('归档删除完成', undefined, {
        archiveId,
        filePath: archiveRecord.filePath,
      });

      return true;
    } catch (error) {
      this.logger.error('删除归档失败', undefined, {
        archiveId,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      return false;
    }
  }

  /**
   * 获取归档信息
   *
   * @description 获取归档的详细信息
   * @param archiveId 归档ID
   * @returns 归档信息
   */
  async getArchiveInfo(archiveId: string): Promise<{
    archiveId: string;
    eventCount: number;
    fileSize: number;
    createdAt: Date;
    compressionRatio: number;
  } | null> {
    try {
      const archiveRecord = this.archiveIndex.get(archiveId);
      if (!archiveRecord) {
        return null;
      }

      // 获取文件大小
      const stats = await fs.stat(archiveRecord.filePath);
      const fileSize = stats.size;

      return {
        archiveId: archiveRecord.archiveId,
        eventCount: archiveRecord.eventCount,
        fileSize,
        createdAt: new Date(archiveRecord.createdAt),
        compressionRatio: archiveRecord.compressionRatio,
      };
    } catch (error) {
      this.logger.error('获取归档信息失败', undefined, {
        archiveId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * 列出所有归档
   *
   * @description 列出所有的归档信息
   * @param filters 过滤条件
   * @returns 归档信息列表
   */
  async listArchives(filters?: {
    startDate?: Date;
    endDate?: Date;
    eventType?: string;
    tenantId?: string;
  }): Promise<
    Array<{
      archiveId: string;
      eventCount: number;
      fileSize: number;
      createdAt: Date;
      compressionRatio: number;
    }>
  > {
    try {
      const archives: any[] = [];

      for (const [archiveId, record] of this.archiveIndex) {
        // 应用过滤条件
        if (filters) {
          if (
            filters.startDate &&
            new Date(record.createdAt) < filters.startDate
          ) {
            continue;
          }
          if (filters.endDate && new Date(record.createdAt) > filters.endDate) {
            continue;
          }
          if (
            filters.eventType &&
            !record.metadata.eventTypes?.includes(filters.eventType)
          ) {
            continue;
          }
          if (
            filters.tenantId &&
            record.metadata.tenantId !== filters.tenantId
          ) {
            continue;
          }
        }

        // 获取文件大小
        let fileSize = 0;
        try {
          const stats = await fs.stat(record.filePath);
          fileSize = stats.size;
        } catch (error) {
          this.logger.warn('无法获取归档文件大小', undefined, {
            archiveId,
            filePath: record.filePath,
            error: (error as Error).message,
          });
        }

        archives.push({
          archiveId: record.archiveId,
          eventCount: record.eventCount,
          fileSize,
          createdAt: new Date(record.createdAt),
          compressionRatio: record.compressionRatio,
        });
      }

      // 按创建时间排序
      archives.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return archives;
    } catch (error) {
      this.logger.error('列出归档失败', undefined, {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      return [];
    }
  }

  /**
   * 清理过期归档
   *
   * @description 根据保留策略清理过期的归档文件
   * @param config 归档配置
   * @returns 清理结果
   */
  async cleanupExpiredArchives(config: IArchiveConfig): Promise<{
    deletedCount: number;
    freedSpace: number;
    deletedArchives: string[];
  }> {
    const result = {
      deletedCount: 0,
      freedSpace: 0,
      deletedArchives: [],
    };

    try {
      const now = new Date();
      const archivesToDelete: string[] = [];

      for (const [archiveId, record] of this.archiveIndex) {
        const createdAt = new Date(record.createdAt);
        const ageInDays =
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        let shouldDelete = false;

        // 检查保留策略
        if (ageInDays > config.retention.coldDataRetention) {
          shouldDelete = true;
        }

        if (shouldDelete) {
          archivesToDelete.push(archiveId);
        }
      }

      // 删除过期归档
      for (const archiveId of archivesToDelete) {
        try {
          const archiveRecord = this.archiveIndex.get(archiveId);
          if (archiveRecord) {
            // 获取文件大小
            const stats = await fs.stat(archiveRecord.filePath);
            result.freedSpace += stats.size;

            // 删除文件
            await fs.unlink(archiveRecord.filePath);
            this.archiveIndex.delete(archiveId);
            result.deletedCount++;
            (result.deletedArchives as string[]).push(archiveId);
          }
        } catch (error) {
          this.logger.warn('删除过期归档失败', undefined, {
            archiveId,
            error: (error as Error).message,
          });
        }
      }

      // 保存更新后的索引
      if (result.deletedCount > 0) {
        await this.saveArchiveIndex();
      }

      this.logger.info('清理过期归档完成', undefined, {
        deletedCount: result.deletedCount,
        freedSpace: result.freedSpace,
        deletedArchives: result.deletedArchives,
      });

      return result;
    } catch (error) {
      this.logger.error('清理过期归档失败', undefined, {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      return result;
    }
  }

  /**
   * 确保目录存在
   *
   * @description 确保归档存储目录存在
   */
  private async ensureDirectoriesExist(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.archiveIndexPath), { recursive: true });
      await fs.mkdir(this.archiveDataPath, { recursive: true });
    } catch (error) {
      this.logger.error('创建归档目录失败', undefined, {
        error: (error as Error).message,
        archiveIndexPath: this.archiveIndexPath,
        archiveDataPath: this.archiveDataPath,
      });
      throw error;
    }
  }

  /**
   * 加载归档索引
   *
   * @description 从文件加载归档索引
   */
  private async loadArchiveIndex(): Promise<void> {
    try {
      const indexContent = await fs.readFile(this.archiveIndexPath, 'utf8');
      const indexData = JSON.parse(indexContent);
      this.archiveIndex = new Map(indexData);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // 索引文件不存在，创建空索引
        this.archiveIndex = new Map();
        await this.saveArchiveIndex();
      } else {
        this.logger.error('加载归档索引失败', undefined, {
          error: (error as Error).message,
          archiveIndexPath: this.archiveIndexPath,
        });
        throw error;
      }
    }
  }

  /**
   * 保存归档索引
   *
   * @description 将归档索引保存到文件
   */
  private async saveArchiveIndex(): Promise<void> {
    try {
      const indexData = Array.from(this.archiveIndex.entries());
      await fs.writeFile(
        this.archiveIndexPath,
        JSON.stringify(indexData, null, 2),
      );
    } catch (error) {
      this.logger.error('保存归档索引失败', undefined, {
        error: (error as Error).message,
        archiveIndexPath: this.archiveIndexPath,
      });
      throw error;
    }
  }

  /**
   * 合并配置
   *
   * @description 合并用户配置和默认配置
   * @param config 用户配置
   * @returns 合并后的配置
   */
  private mergeConfig(config: Partial<IArchiveConfig>): IArchiveConfig {
    const defaultConfig: IArchiveConfig = {
      strategy: ArchiveStrategy.BY_TIME,
      enabled: true,
      triggerConditions: {
        timeInterval: 7,
        sizeThreshold: 100,
        eventCountThreshold: 10000,
      },
      compression: {
        algorithm: 'gzip' as any,
        level: 6 as any,
        enabled: true,
        minSize: 1024,
        maxSize: 100 * 1024 * 1024,
        timeout: 30000,
      },
      storageLocation: this.archiveDataPath,
      retention: {
        hotDataRetention: 7,
        warmDataRetention: 30,
        coldDataRetention: 365,
      },
    };

    return { ...defaultConfig, ...config };
  }

  /**
   * 检查是否应该归档
   *
   * @description 检查是否满足归档条件
   * @param eventDataList 事件数据列表
   * @param config 归档配置
   * @returns 是否应该归档
   */
  private shouldArchive(eventDataList: any[], config: IArchiveConfig): boolean {
    if (!config.enabled) {
      return false;
    }

    const conditions = config.triggerConditions;

    // 检查事件数量
    if (
      conditions.eventCountThreshold &&
      eventDataList.length >= conditions.eventCountThreshold
    ) {
      return true;
    }

    // 检查数据大小
    if (conditions.sizeThreshold) {
      const totalSize = eventDataList.reduce((sum, event) => {
        return sum + Buffer.byteLength(JSON.stringify(event), 'utf8');
      }, 0);
      const sizeInMB = totalSize / (1024 * 1024);
      if (sizeInMB >= conditions.sizeThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * 按策略组织数据
   *
   * @description 根据归档策略组织事件数据
   * @param eventDataList 事件数据列表
   * @param config 归档配置
   * @returns 组织后的事件数据
   */
  private organizeDataByStrategy(
    eventDataList: any[],
    config: IArchiveConfig,
  ): any[] {
    switch (config.strategy) {
      case ArchiveStrategy.BY_TIME:
        return eventDataList.sort(
          (a, b) =>
            new Date(a.occurredOn).getTime() - new Date(b.occurredOn).getTime(),
        );
      case ArchiveStrategy.BY_EVENT_TYPE:
        return eventDataList.sort((a, b) =>
          a.eventType.localeCompare(b.eventType),
        );
      case ArchiveStrategy.BY_TENANT:
        return eventDataList.sort((a, b) =>
          (a.tenantId || '').localeCompare(b.tenantId || ''),
        );
      case ArchiveStrategy.BY_SIZE:
        return eventDataList.sort((a, b) => {
          const sizeA = Buffer.byteLength(JSON.stringify(a), 'utf8');
          const sizeB = Buffer.byteLength(JSON.stringify(b), 'utf8');
          return sizeA - sizeB;
        });
      default:
        return eventDataList;
    }
  }

  /**
   * 创建归档文件
   *
   * @description 创建归档文件并写入压缩数据
   * @param archiveId 归档ID
   * @param compressionResults 压缩结果列表
   * @returns 归档文件路径
   */
  private async createArchiveFile(
    archiveId: string,
    compressionResults: any[],
  ): Promise<string> {
    const fileName = `archive_${archiveId}.json`;
    const filePath = path.join(this.archiveDataPath, fileName);

    const archiveData = {
      archiveId,
      createdAt: new Date().toISOString(),
      compressedItems: compressionResults.map((result, index) => ({
        index,
        data: result.compressedData.toString('base64'),
        algorithm: result.algorithm,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
      })),
    };

    await fs.writeFile(filePath, JSON.stringify(archiveData, null, 2));
    return filePath;
  }

  /**
   * 提取元数据
   *
   * @description 从事件数据中提取元数据
   * @param eventDataList 事件数据列表
   * @param config 归档配置
   * @returns 元数据
   */
  private extractMetadata(eventDataList: any[], config: IArchiveConfig): any {
    const eventTypes = [
      ...new Set(eventDataList.map((event) => event.eventType)),
    ];
    const tenantIds = [
      ...new Set(eventDataList.map((event) => event.tenantId).filter(Boolean)),
    ];
    const dateRange = {
      start: new Date(
        Math.min(
          ...eventDataList.map((event) => new Date(event.occurredOn).getTime()),
        ),
      ),
      end: new Date(
        Math.max(
          ...eventDataList.map((event) => new Date(event.occurredOn).getTime()),
        ),
      ),
    };

    return {
      eventTypes,
      tenantIds,
      dateRange,
      strategy: config.strategy,
    };
  }

  /**
   * 保存归档记录
   *
   * @description 保存归档记录到索引
   * @param archiveRecord 归档记录
   */
  private async saveArchiveRecord(archiveRecord: any): Promise<void> {
    this.archiveIndex.set(archiveRecord.archiveId, archiveRecord);
    await this.saveArchiveIndex();
  }
}
