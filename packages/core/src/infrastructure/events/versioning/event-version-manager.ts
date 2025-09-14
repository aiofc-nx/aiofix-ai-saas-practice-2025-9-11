import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '@aiofix/logging';
import {
  IEventVersionManager,
  IEventVersion,
  ICompatibilityResult,
  CompatibilityType,
  RiskLevel,
} from './event-version.interface';

/**
 * 事件版本管理器
 *
 * 负责管理事件版本信息，提供版本兼容性检查、
 * 版本注册和查询等功能。
 *
 * @description 事件版本管理器的具体实现
 *
 * ## 业务规则
 *
 * ### 版本管理规则
 * - 每个事件类型可以有多个版本
 * - 版本号遵循语义化版本控制（SemVer）
 * - 支持版本的生命周期管理
 * - 提供版本兼容性检查
 *
 * ### 兼容性规则
 * - 主版本号变更表示不兼容的API变更
 * - 次版本号变更表示向后兼容的功能新增
 * - 修订号变更表示向后兼容的问题修复
 * - 支持自定义兼容性规则
 *
 * ### 迁移规则
 * - 不兼容版本之间需要迁移脚本
 * - 支持自动和手动迁移
 * - 提供迁移验证机制
 * - 记录迁移历史
 *
 * ## 业务逻辑流程
 *
 * 1. **版本注册**：注册事件版本信息
 * 2. **兼容性检查**：检查版本间兼容性
 * 3. **版本查询**：查询版本信息
 * 4. **迁移处理**：处理版本迁移
 * 5. **废弃管理**：管理废弃版本
 *
 * @example
 * ```typescript
 * const versionManager = new EventVersionManager(logger);
 *
 * // 注册版本
 * versionManager.registerVersion('UserCreated', {
 *   version: '1.0.0',
 *   createdAt: new Date(),
 *   backwardCompatible: true,
 *   forwardCompatible: true,
 *   description: '初始版本'
 * });
 *
 * // 检查兼容性
 * const result = versionManager.checkCompatibility(
 *   'UserCreated',
 *   '1.0.0',
 *   '1.1.0'
 * );
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class EventVersionManager implements IEventVersionManager {
  /** 版本存储映射 */
  private readonly versionMap = new Map<string, Map<string, IEventVersion>>();

  constructor(private readonly logger: PinoLoggerService) {}

  /**
   * 注册事件版本
   *
   * @description 注册新的事件版本信息
   * @param eventType 事件类型
   * @param version 版本信息
   */
  registerVersion(eventType: string, version: IEventVersion): void {
    if (!this.versionMap.has(eventType)) {
      this.versionMap.set(eventType, new Map());
    }

    const eventVersions = this.versionMap.get(eventType)!;
    eventVersions.set(version.version, version);

    this.logger.info('事件版本已注册', undefined, {
      eventType,
      version: version.version,
      description: version.description,
    });
  }

  /**
   * 获取事件版本信息
   *
   * @description 获取指定事件类型的版本信息
   * @param eventType 事件类型
   * @param version 版本号，默认为最新版本
   * @returns 版本信息
   */
  getVersion(eventType: string, version?: string): IEventVersion | null {
    const eventVersions = this.versionMap.get(eventType);
    if (!eventVersions) {
      return null;
    }

    if (version) {
      return eventVersions.get(version) || null;
    }

    // 返回最新版本
    const versions = Array.from(eventVersions.values());
    if (versions.length === 0) {
      return null;
    }

    return versions.sort((a, b) =>
      this.compareVersions(b.version, a.version),
    )[0];
  }

  /**
   * 获取所有版本
   *
   * @description 获取指定事件类型的所有版本信息
   * @param eventType 事件类型
   * @returns 版本信息列表
   */
  getAllVersions(eventType: string): IEventVersion[] {
    const eventVersions = this.versionMap.get(eventType);
    if (!eventVersions) {
      return [];
    }

    return Array.from(eventVersions.values()).sort((a, b) =>
      this.compareVersions(b.version, a.version),
    );
  }

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
  ): ICompatibilityResult {
    const fromVersionInfo = this.getVersion(eventType, fromVersion);
    const toVersionInfo = this.getVersion(eventType, toVersion);

    if (!fromVersionInfo || !toVersionInfo) {
      return {
        compatible: false,
        compatibilityType: CompatibilityType.INCOMPATIBLE,
        description: '版本信息不存在',
        riskLevel: RiskLevel.HIGH,
      };
    }

    // 相同版本
    if (fromVersion === toVersion) {
      return {
        compatible: true,
        compatibilityType: CompatibilityType.FULLY_COMPATIBLE,
        description: '相同版本，完全兼容',
        riskLevel: RiskLevel.LOW,
      };
    }

    // 检查是否废弃
    if (fromVersionInfo.deprecatedAt || toVersionInfo.deprecatedAt) {
      return {
        compatible: false,
        compatibilityType: CompatibilityType.INCOMPATIBLE,
        description: '版本已废弃',
        riskLevel: RiskLevel.HIGH,
        migrationSuggestion: '请升级到支持的版本',
      };
    }

    // 语义化版本兼容性检查
    const compatibilityResult = this.checkSemanticCompatibility(
      fromVersion,
      toVersion,
      fromVersionInfo,
      toVersionInfo,
    );

    this.logger.debug('版本兼容性检查完成', undefined, {
      eventType,
      fromVersion,
      toVersion,
      result: compatibilityResult,
    });

    return compatibilityResult;
  }

  /**
   * 获取兼容版本
   *
   * @description 获取与指定版本兼容的所有版本
   * @param eventType 事件类型
   * @param version 版本号
   * @returns 兼容版本列表
   */
  getCompatibleVersions(eventType: string, version: string): string[] {
    const allVersions = this.getAllVersions(eventType);
    const compatibleVersions: string[] = [];

    for (const versionInfo of allVersions) {
      const result = this.checkCompatibility(
        eventType,
        version,
        versionInfo.version,
      );

      if (result.compatible) {
        compatibleVersions.push(versionInfo.version);
      }
    }

    return compatibleVersions.sort((a, b) => this.compareVersions(b, a));
  }

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
    deprecatedAt: Date = new Date(),
  ): void {
    const versionInfo = this.getVersion(eventType, version);
    if (!versionInfo) {
      this.logger.warn('尝试废弃不存在的版本', undefined, {
        eventType,
        version,
      });
      return;
    }

    versionInfo.deprecatedAt = deprecatedAt;

    this.logger.info('版本已标记为废弃', undefined, {
      eventType,
      version,
      deprecatedAt: deprecatedAt.toISOString(),
    });
  }

  /**
   * 检查语义化版本兼容性
   *
   * @description 基于语义化版本控制检查兼容性
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @param fromVersionInfo 源版本信息
   * @param toVersionInfo 目标版本信息
   * @returns 兼容性检查结果
   */
  private checkSemanticCompatibility(
    fromVersion: string,
    toVersion: string,
    fromVersionInfo: IEventVersion,
    toVersionInfo: IEventVersion,
  ): ICompatibilityResult {
    const fromParts = this.parseVersion(fromVersion);
    const toParts = this.parseVersion(toVersion);

    if (!fromParts || !toParts) {
      return {
        compatible: false,
        compatibilityType: CompatibilityType.INCOMPATIBLE,
        description: '版本格式不正确',
        riskLevel: RiskLevel.MEDIUM,
      };
    }

    // 主版本号变更 - 不兼容
    if (fromParts.major !== toParts.major) {
      return {
        compatible: false,
        compatibilityType: CompatibilityType.INCOMPATIBLE,
        description: '主版本号变更，不兼容',
        riskLevel: RiskLevel.HIGH,
        migrationSuggestion: '需要迁移脚本或手动处理',
      };
    }

    // 次版本号变更 - 向后兼容
    if (fromParts.minor !== toParts.minor) {
      const isBackwardCompatible =
        toParts.minor > fromParts.minor && toVersionInfo.backwardCompatible;

      return {
        compatible: isBackwardCompatible,
        compatibilityType: isBackwardCompatible
          ? CompatibilityType.BACKWARD_COMPATIBLE
          : CompatibilityType.REQUIRES_MIGRATION,
        description: isBackwardCompatible
          ? '次版本号变更，向后兼容'
          : '次版本号变更，需要迁移',
        riskLevel: isBackwardCompatible ? RiskLevel.LOW : RiskLevel.MEDIUM,
        migrationSuggestion: isBackwardCompatible
          ? undefined
          : '检查新字段和变更',
      };
    }

    // 修订号变更 - 向后兼容
    if (fromParts.patch !== toParts.patch) {
      return {
        compatible: true,
        compatibilityType: CompatibilityType.FULLY_COMPATIBLE,
        description: '修订号变更，完全兼容',
        riskLevel: RiskLevel.LOW,
      };
    }

    // 预发布版本检查
    if (fromParts.prerelease || toParts.prerelease) {
      return {
        compatible: false,
        compatibilityType: CompatibilityType.INCOMPATIBLE,
        description: '预发布版本不兼容',
        riskLevel: RiskLevel.MEDIUM,
        migrationSuggestion: '避免在生产环境使用预发布版本',
      };
    }

    return {
      compatible: true,
      compatibilityType: CompatibilityType.FULLY_COMPATIBLE,
      description: '版本完全兼容',
      riskLevel: RiskLevel.LOW,
    };
  }

  /**
   * 解析版本号
   *
   * @description 解析语义化版本号
   * @param version 版本号字符串
   * @returns 版本号组件
   */
  private parseVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
  } | null {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?$/);
    if (!match) {
      return null;
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
    };
  }

  /**
   * 比较版本号
   *
   * @description 比较两个版本号的大小
   * @param version1 版本1
   * @param version2 版本2
   * @returns 比较结果：-1(version1 < version2), 0(相等), 1(version1 > version2)
   */
  private compareVersions(version1: string, version2: string): number {
    const parts1 = this.parseVersion(version1);
    const parts2 = this.parseVersion(version2);

    if (!parts1 || !parts2) {
      return version1.localeCompare(version2);
    }

    if (parts1.major !== parts2.major) {
      return parts1.major - parts2.major;
    }

    if (parts1.minor !== parts2.minor) {
      return parts1.minor - parts2.minor;
    }

    if (parts1.patch !== parts2.patch) {
      return parts1.patch - parts2.patch;
    }

    // 处理预发布版本
    if (parts1.prerelease && parts2.prerelease) {
      return parts1.prerelease.localeCompare(parts2.prerelease);
    }

    if (parts1.prerelease && !parts2.prerelease) {
      return -1; // 预发布版本小于正式版本
    }

    if (!parts1.prerelease && parts2.prerelease) {
      return 1; // 正式版本大于预发布版本
    }

    return 0;
  }
}
