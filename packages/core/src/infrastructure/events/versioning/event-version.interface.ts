/**
 * 事件版本接口
 *
 * 定义事件版本管理的核心接口，支持事件版本兼容性检查、
 * 版本升级和降级等功能。
 *
 * @description 事件版本管理的接口定义
 */

/**
 * 事件版本信息
 *
 * @description 描述事件版本的基本信息
 */
export interface IEventVersion {
  /** 版本号 */
  version: string;
  /** 版本创建时间 */
  createdAt: Date;
  /** 版本描述 */
  description?: string;
  /** 是否向后兼容 */
  backwardCompatible: boolean;
  /** 是否向前兼容 */
  forwardCompatible: boolean;
  /** 废弃时间 */
  deprecatedAt?: Date;
  /** 迁移脚本路径 */
  migrationScript?: string;
}

/**
 * 事件版本管理器接口
 *
 * @description 管理事件版本的核心接口
 */
export interface IEventVersionManager {
  /**
   * 注册事件版本
   *
   * @description 注册新的事件版本信息
   * @param eventType 事件类型
   * @param version 版本信息
   */
  registerVersion(eventType: string, version: IEventVersion): void;

  /**
   * 获取事件版本信息
   *
   * @description 获取指定事件类型的版本信息
   * @param eventType 事件类型
   * @param version 版本号，默认为最新版本
   * @returns 版本信息
   */
  getVersion(eventType: string, version?: string): IEventVersion | null;

  /**
   * 获取所有版本
   *
   * @description 获取指定事件类型的所有版本信息
   * @param eventType 事件类型
   * @returns 版本信息列表
   */
  getAllVersions(eventType: string): IEventVersion[];

  /**
   * 检查版本兼容性
   *
   * @description 检查两个版本之间的兼容性
   * @param eventType 事件类型
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @returns 兼容性检查结果
   */
  checkCompatibility(
    eventType: string,
    fromVersion: string,
    toVersion: string,
  ): ICompatibilityResult;

  /**
   * 获取兼容版本
   *
   * @description 获取与指定版本兼容的所有版本
   * @param eventType 事件类型
   * @param version 版本号
   * @returns 兼容版本列表
   */
  getCompatibleVersions(eventType: string, version: string): string[];

  /**
   * 标记版本为废弃
   *
   * @description 标记指定版本为废弃状态
   * @param eventType 事件类型
   * @param version 版本号
   * @param deprecatedAt 废弃时间
   */
  deprecateVersion(
    eventType: string,
    version: string,
    deprecatedAt?: Date,
  ): void;
}

/**
 * 兼容性检查结果
 *
 * @description 版本兼容性检查的结果
 */
export interface ICompatibilityResult {
  /** 是否兼容 */
  compatible: boolean;
  /** 兼容性类型 */
  compatibilityType: CompatibilityType;
  /** 兼容性描述 */
  description: string;
  /** 迁移建议 */
  migrationSuggestion?: string;
  /** 风险等级 */
  riskLevel: RiskLevel;
}

/**
 * 兼容性类型枚举
 */
export enum CompatibilityType {
  /** 完全兼容 */
  FULLY_COMPATIBLE = 'fully_compatible',
  /** 向后兼容 */
  BACKWARD_COMPATIBLE = 'backward_compatible',
  /** 向前兼容 */
  FORWARD_COMPATIBLE = 'forward_compatible',
  /** 不兼容 */
  INCOMPATIBLE = 'incompatible',
  /** 需要迁移 */
  REQUIRES_MIGRATION = 'requires_migration',
}

/**
 * 风险等级枚举
 */
export enum RiskLevel {
  /** 低风险 */
  LOW = 'low',
  /** 中等风险 */
  MEDIUM = 'medium',
  /** 高风险 */
  HIGH = 'high',
  /** 极高风险 */
  CRITICAL = 'critical',
}

/**
 * 事件版本迁移器接口
 *
 * @description 处理事件版本迁移的接口
 */
export interface IEventVersionMigrator {
  /**
   * 迁移事件数据
   *
   * @description 将事件数据从旧版本迁移到新版本
   * @param eventData 原始事件数据
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @returns 迁移后的事件数据
   */
  migrateEventData(
    eventData: any,
    fromVersion: string,
    toVersion: string,
  ): Promise<any>;

  /**
   * 验证迁移结果
   *
   * @description 验证迁移后的事件数据是否正确
   * @param migratedData 迁移后的事件数据
   * @param toVersion 目标版本
   * @returns 验证结果
   */
  validateMigration(migratedData: any, toVersion: string): Promise<boolean>;
}
