/**
 * 事件压缩接口
 *
 * 定义事件数据压缩和归档的核心接口，支持多种压缩算法
 * 和归档策略，优化事件存储和传输性能。
 *
 * @description 事件压缩和归档的接口定义
 */

/**
 * 压缩算法类型枚举
 */
export enum CompressionAlgorithm {
  /** Gzip压缩 */
  GZIP = 'gzip',
  /** Brotli压缩 */
  BROTLI = 'brotli',
  /** LZ4压缩 */
  LZ4 = 'lz4',
  /** Zstandard压缩 */
  ZSTD = 'zstd',
  /** 无压缩 */
  NONE = 'none',
}

/**
 * 压缩级别枚举
 */
export enum CompressionLevel {
  /** 最快压缩 */
  FASTEST = 1,
  /** 快速压缩 */
  FAST = 3,
  /** 默认压缩 */
  DEFAULT = 6,
  /** 高压缩比 */
  HIGH = 9,
  /** 最高压缩比 */
  MAXIMUM = 12,
}

/**
 * 压缩配置接口
 *
 * @description 定义压缩操作的配置选项
 */
export interface ICompressionConfig {
  /** 压缩算法 */
  algorithm: CompressionAlgorithm;
  /** 压缩级别 */
  level: CompressionLevel;
  /** 是否启用压缩 */
  enabled: boolean;
  /** 最小压缩阈值（字节） */
  minSize: number;
  /** 最大压缩阈值（字节） */
  maxSize: number;
  /** 压缩超时时间（毫秒） */
  timeout: number;
}

/**
 * 压缩结果接口
 *
 * @description 压缩操作的结果信息
 */
export interface ICompressionResult {
  /** 压缩后的数据 */
  compressedData: Buffer;
  /** 原始数据大小 */
  originalSize: number;
  /** 压缩后数据大小 */
  compressedSize: number;
  /** 压缩比 */
  compressionRatio: number;
  /** 使用的压缩算法 */
  algorithm: CompressionAlgorithm;
  /** 压缩耗时（毫秒） */
  compressionTime: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 事件压缩器接口
 *
 * @description 提供事件数据压缩和解压缩功能
 */
export interface IEventCompressor {
  /**
   * 压缩事件数据
   *
   * @description 将事件数据压缩为更小的格式
   * @param eventData 原始事件数据
   * @param config 压缩配置
   * @returns 压缩结果
   */
  compress(
    eventData: any,
    config?: Partial<ICompressionConfig>,
  ): Promise<ICompressionResult>;

  /**
   * 解压缩事件数据
   *
   * @description 将压缩的事件数据解压缩为原始格式
   * @param compressedData 压缩的事件数据
   * @param algorithm 压缩算法
   * @returns 解压缩后的事件数据
   */
  decompress(
    compressedData: Buffer,
    algorithm?: CompressionAlgorithm,
  ): Promise<any>;

  /**
   * 批量压缩事件数据
   *
   * @description 批量压缩多个事件数据
   * @param eventDataList 事件数据列表
   * @param config 压缩配置
   * @returns 压缩结果列表
   */
  compressBatch(
    eventDataList: any[],
    config?: Partial<ICompressionConfig>,
  ): Promise<ICompressionResult[]>;

  /**
   * 获取支持的压缩算法
   *
   * @description 获取当前支持的压缩算法列表
   * @returns 支持的压缩算法列表
   */
  getSupportedAlgorithms(): CompressionAlgorithm[];

  /**
   * 检查压缩效果
   *
   * @description 检查指定数据的压缩效果
   * @param eventData 事件数据
   * @param config 压缩配置
   * @returns 压缩效果信息
   */
  checkCompressionEffect(
    eventData: any,
    config?: Partial<ICompressionConfig>,
  ): Promise<{
    recommended: boolean;
    estimatedRatio: number;
    estimatedSize: number;
  }>;
}

/**
 * 归档策略类型枚举
 */
export enum ArchiveStrategy {
  /** 按时间归档 */
  BY_TIME = 'by_time',
  /** 按大小归档 */
  BY_SIZE = 'by_size',
  /** 按事件类型归档 */
  BY_EVENT_TYPE = 'by_event_type',
  /** 按租户归档 */
  BY_TENANT = 'by_tenant',
  /** 混合策略 */
  HYBRID = 'hybrid',
}

/**
 * 归档配置接口
 *
 * @description 定义事件归档的配置选项
 */
export interface IArchiveConfig {
  /** 归档策略 */
  strategy: ArchiveStrategy;
  /** 是否启用归档 */
  enabled: boolean;
  /** 归档触发条件 */
  triggerConditions: {
    /** 时间间隔（天） */
    timeInterval?: number;
    /** 数据大小阈值（MB） */
    sizeThreshold?: number;
    /** 事件数量阈值 */
    eventCountThreshold?: number;
  };
  /** 压缩配置 */
  compression: ICompressionConfig;
  /** 归档存储位置 */
  storageLocation: string;
  /** 保留策略 */
  retention: {
    /** 热数据保留时间（天） */
    hotDataRetention: number;
    /** 温数据保留时间（天） */
    warmDataRetention: number;
    /** 冷数据保留时间（天） */
    coldDataRetention: number;
  };
}

/**
 * 归档结果接口
 *
 * @description 归档操作的结果信息
 */
export interface IArchiveResult {
  /** 归档ID */
  archiveId: string;
  /** 归档的事件数量 */
  eventCount: number;
  /** 原始数据大小 */
  originalSize: number;
  /** 归档后数据大小 */
  archivedSize: number;
  /** 压缩比 */
  compressionRatio: number;
  /** 归档开始时间 */
  startTime: Date;
  /** 归档结束时间 */
  endTime: Date;
  /** 归档耗时（毫秒） */
  duration: number;
  /** 归档文件路径 */
  filePath: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 事件归档器接口
 *
 * @description 提供事件数据归档和恢复功能
 */
export interface IEventArchiver {
  /**
   * 归档事件数据
   *
   * @description 将事件数据归档到长期存储
   * @param eventDataList 要归档的事件数据列表
   * @param config 归档配置
   * @returns 归档结果
   */
  archiveEvents(
    eventDataList: any[],
    config?: Partial<IArchiveConfig>,
  ): Promise<IArchiveResult>;

  /**
   * 从归档恢复事件数据
   *
   * @description 从归档文件中恢复事件数据
   * @param archiveId 归档ID
   * @param eventIds 要恢复的事件ID列表（可选）
   * @returns 恢复的事件数据列表
   */
  restoreEvents(archiveId: string, eventIds?: string[]): Promise<any[]>;

  /**
   * 删除归档
   *
   * @description 删除指定的归档文件
   * @param archiveId 归档ID
   * @returns 删除结果
   */
  deleteArchive(archiveId: string): Promise<boolean>;

  /**
   * 获取归档信息
   *
   * @description 获取归档的详细信息
   * @param archiveId 归档ID
   * @returns 归档信息
   */
  getArchiveInfo(archiveId: string): Promise<{
    archiveId: string;
    eventCount: number;
    fileSize: number;
    createdAt: Date;
    compressionRatio: number;
  } | null>;

  /**
   * 列出所有归档
   *
   * @description 列出所有的归档信息
   * @param filters 过滤条件
   * @returns 归档信息列表
   */
  listArchives(filters?: {
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
  >;

  /**
   * 清理过期归档
   *
   * @description 根据保留策略清理过期的归档文件
   * @param config 归档配置
   * @returns 清理结果
   */
  cleanupExpiredArchives(config: IArchiveConfig): Promise<{
    deletedCount: number;
    freedSpace: number;
    deletedArchives: string[];
  }>;
}
