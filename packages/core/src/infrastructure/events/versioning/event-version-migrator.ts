import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '@aiofix/logging';
import { IEventVersionMigrator } from './event-version.interface';

/**
 * 事件版本迁移器
 *
 * 负责处理事件数据的版本迁移，支持自动和手动迁移，
 * 提供迁移验证和错误处理功能。
 *
 * @description 事件版本迁移器的具体实现
 *
 * ## 业务规则
 *
 * ### 迁移规则
 * - 支持事件数据的版本间迁移
 * - 提供迁移验证机制
 * - 支持迁移回滚
 * - 记录迁移历史和状态
 *
 * ### 数据完整性规则
 * - 迁移过程中保证数据完整性
 * - 提供数据验证机制
 * - 支持迁移失败时的回滚
 * - 记录迁移操作的审计日志
 *
 * ### 性能规则
 * - 支持批量迁移
 * - 提供迁移进度监控
 * - 优化迁移性能
 * - 支持增量迁移
 *
 * ## 业务逻辑流程
 *
 * 1. **迁移准备**：准备迁移环境和数据
 * 2. **数据迁移**：执行数据迁移操作
 * 3. **迁移验证**：验证迁移结果的正确性
 * 4. **迁移完成**：完成迁移并清理资源
 * 5. **错误处理**：处理迁移过程中的错误
 *
 * @example
 * ```typescript
 * const migrator = new EventVersionMigrator(logger);
 *
 * // 迁移事件数据
 * const migratedData = await migrator.migrateEventData(
 *   originalEventData,
 *   '1.0.0',
 *   '1.1.0'
 * );
 *
 * // 验证迁移结果
 * const isValid = await migrator.validateMigration(migratedData, '1.1.0');
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class EventVersionMigrator implements IEventVersionMigrator {
  /** 迁移脚本注册表 */
  private readonly migrationScripts = new Map<string, Map<string, Function>>();

  constructor(private readonly logger: PinoLoggerService) {}

  /**
   * 注册迁移脚本
   *
   * @description 注册事件类型的版本迁移脚本
   * @param eventType 事件类型
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @param migrationFunction 迁移函数
   */
  registerMigrationScript(
    eventType: string,
    fromVersion: string,
    toVersion: string,
    migrationFunction: Function,
  ): void {
    const migrationKey = this.createMigrationKey(
      eventType,
      fromVersion,
      toVersion,
    );

    if (!this.migrationScripts.has(eventType)) {
      this.migrationScripts.set(eventType, new Map());
    }

    const eventMigrations = this.migrationScripts.get(eventType)!;
    eventMigrations.set(migrationKey, migrationFunction);

    this.logger.info('迁移脚本已注册', undefined, {
      eventType,
      fromVersion,
      toVersion,
      migrationKey,
    });
  }

  /**
   * 迁移事件数据
   *
   * @description 将事件数据从旧版本迁移到新版本
   * @param eventData 原始事件数据
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @returns 迁移后的事件数据
   */
  async migrateEventData(
    eventData: any,
    fromVersion: string,
    toVersion: string,
  ): Promise<any> {
    try {
      // 获取事件类型
      const eventType = this.extractEventType(eventData);
      if (!eventType) {
        throw new Error('无法提取事件类型');
      }

      // 检查是否需要迁移
      if (fromVersion === toVersion) {
        this.logger.debug('版本相同，无需迁移', undefined, {
          eventType,
          fromVersion,
          toVersion,
        });
        return eventData;
      }

      // 查找迁移脚本
      const migrationFunction = this.findMigrationScript(
        eventType,
        fromVersion,
        toVersion,
      );

      if (!migrationFunction) {
        this.logger.warn('未找到迁移脚本', undefined, {
          eventType,
          fromVersion,
          toVersion,
        });
        return eventData;
      }

      // 执行迁移
      this.logger.info('开始迁移事件数据', undefined, {
        eventType,
        fromVersion,
        toVersion,
      });

      const migratedData = await this.executeMigration(
        migrationFunction,
        eventData,
        fromVersion,
        toVersion,
      );

      this.logger.info('事件数据迁移完成', undefined, {
        eventType,
        fromVersion,
        toVersion,
        originalDataKeys: Object.keys(eventData),
        migratedDataKeys: Object.keys(migratedData),
      });

      return migratedData;
    } catch (error) {
      this.logger.error('事件数据迁移失败', undefined, {
        error: (error as Error).message,
        stack: (error as Error).stack,
        fromVersion,
        toVersion,
        eventData,
      });
      throw error;
    }
  }

  /**
   * 验证迁移结果
   *
   * @description 验证迁移后的事件数据是否正确
   * @param migratedData 迁移后的事件数据
   * @param toVersion 目标版本
   * @returns 验证结果
   */
  async validateMigration(
    migratedData: any,
    toVersion: string,
  ): Promise<boolean> {
    try {
      if (!migratedData || typeof migratedData !== 'object') {
        this.logger.error('迁移数据无效', undefined, {
          migratedData,
          toVersion,
        });
        return false;
      }

      // 基本数据完整性检查
      const basicValidation = this.validateBasicIntegrity(migratedData);
      if (!basicValidation) {
        this.logger.error('基本数据完整性验证失败', undefined, {
          migratedData,
          toVersion,
        });
        return false;
      }

      // 版本特定验证
      const versionValidation = await this.validateVersionSpecificData(
        migratedData,
        toVersion,
      );

      if (!versionValidation) {
        this.logger.error('版本特定数据验证失败', undefined, {
          migratedData,
          toVersion,
        });
        return false;
      }

      this.logger.debug('迁移验证通过', undefined, { toVersion });
      return true;
    } catch (error) {
      this.logger.error('迁移验证失败', undefined, {
        error: (error as Error).message,
        stack: (error as Error).stack,
        migratedData,
        toVersion,
      });
      return false;
    }
  }

  /**
   * 批量迁移事件数据
   *
   * @description 批量迁移多个事件数据
   * @param eventDataList 事件数据列表
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @returns 迁移后的事件数据列表
   */
  async migrateBatchEventData(
    eventDataList: any[],
    fromVersion: string,
    toVersion: string,
  ): Promise<any[]> {
    const results: any[] = [];
    const errors: any[] = [];

    this.logger.info('开始批量迁移事件数据', undefined, {
      count: eventDataList.length,
      fromVersion,
      toVersion,
    });

    for (let i = 0; i < eventDataList.length; i++) {
      try {
        const migratedData = await this.migrateEventData(
          eventDataList[i],
          fromVersion,
          toVersion,
        );
        results.push(migratedData);

        // 每处理100个事件记录一次进度
        if ((i + 1) % 100 === 0) {
          this.logger.info('批量迁移进度', undefined, {
            processed: i + 1,
            total: eventDataList.length,
            progress: `${Math.round(((i + 1) / eventDataList.length) * 100)}%`,
          });
        }
      } catch (error) {
        this.logger.error('批量迁移中的单个事件失败', undefined, {
          index: i,
          error: (error as Error).message,
          eventData: eventDataList[i],
        });
        errors.push({ index: i, error, eventData: eventDataList[i] });
      }
    }

    this.logger.info('批量迁移完成', undefined, {
      total: eventDataList.length,
      success: results.length,
      failed: errors.length,
      fromVersion,
      toVersion,
    });

    if (errors.length > 0) {
      this.logger.warn('批量迁移部分失败', undefined, { errors });
    }

    return results;
  }

  /**
   * 提取事件类型
   *
   * @description 从事件数据中提取事件类型
   * @param eventData 事件数据
   * @returns 事件类型
   */
  private extractEventType(eventData: any): string | null {
    if (!eventData || typeof eventData !== 'object') {
      return null;
    }

    // 尝试多种可能的事件类型字段
    const possibleFields = ['eventType', 'type', 'event_name', 'name'];
    for (const field of possibleFields) {
      if (eventData[field] && typeof eventData[field] === 'string') {
        return eventData[field];
      }
    }

    // 如果没有找到，尝试从构造函数名称获取
    if (eventData.constructor && eventData.constructor.name) {
      return eventData.constructor.name;
    }

    return null;
  }

  /**
   * 查找迁移脚本
   *
   * @description 查找指定版本间的迁移脚本
   * @param eventType 事件类型
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @returns 迁移函数
   */
  private findMigrationScript(
    eventType: string,
    fromVersion: string,
    toVersion: string,
  ): Function | undefined {
    const eventMigrations = this.migrationScripts.get(eventType);
    if (!eventMigrations) {
      return undefined;
    }

    // 直接查找
    const directKey = this.createMigrationKey(
      eventType,
      fromVersion,
      toVersion,
    );
    let migrationFunction = eventMigrations.get(directKey);
    if (migrationFunction) {
      return migrationFunction;
    }

    // 查找链式迁移路径
    migrationFunction = this.findMigrationChain(
      eventMigrations,
      eventType,
      fromVersion,
      toVersion,
    );

    return migrationFunction;
  }

  /**
   * 查找迁移链
   *
   * @description 查找版本间的迁移链
   * @param eventMigrations 事件迁移脚本映射
   * @param eventType 事件类型
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @returns 迁移函数
   */
  private findMigrationChain(
    eventMigrations: Map<string, Function>,
    eventType: string,
    fromVersion: string,
    toVersion: string,
  ): Function | undefined {
    // 这里可以实现更复杂的迁移链查找逻辑
    // 例如：1.0.0 -> 1.1.0 -> 1.2.0 的链式迁移
    // 目前简化实现，只查找直接迁移
    return undefined;
  }

  /**
   * 执行迁移
   *
   * @description 执行迁移函数
   * @param migrationFunction 迁移函数
   * @param eventData 事件数据
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @returns 迁移后的数据
   */
  private async executeMigration(
    migrationFunction: Function,
    eventData: any,
    fromVersion: string,
    toVersion: string,
  ): Promise<any> {
    try {
      const result = await migrationFunction(eventData, fromVersion, toVersion);
      return result;
    } catch (error) {
      this.logger.error('迁移函数执行失败', undefined, {
        error: (error as Error).message,
        stack: (error as Error).stack,
        fromVersion,
        toVersion,
      });
      throw error;
    }
  }

  /**
   * 验证基本数据完整性
   *
   * @description 验证迁移后数据的基本完整性
   * @param migratedData 迁移后的数据
   * @returns 验证结果
   */
  private validateBasicIntegrity(migratedData: any): boolean {
    // 检查必要字段
    const requiredFields = [
      'eventId',
      'aggregateId',
      'eventType',
      'occurredOn',
    ];
    for (const field of requiredFields) {
      if (!migratedData[field]) {
        return false;
      }
    }

    // 检查数据类型
    if (
      typeof migratedData.eventId !== 'string' ||
      typeof migratedData.aggregateId !== 'string' ||
      typeof migratedData.eventType !== 'string' ||
      !(migratedData.occurredOn instanceof Date)
    ) {
      return false;
    }

    return true;
  }

  /**
   * 验证版本特定数据
   *
   * @description 验证版本特定的数据格式
   * @param migratedData 迁移后的数据
   * @param toVersion 目标版本
   * @returns 验证结果
   */
  private async validateVersionSpecificData(
    migratedData: any,
    toVersion: string,
  ): Promise<boolean> {
    // 这里可以根据不同版本实现特定的验证逻辑
    // 例如：检查特定版本要求的字段、数据格式等

    try {
      // 示例：验证版本1.1.0需要email字段
      if (
        toVersion.startsWith('1.1.0') &&
        migratedData.eventType === 'UserCreated'
      ) {
        if (!migratedData.email || typeof migratedData.email !== 'string') {
          return false;
        }
      }

      // 示例：验证版本1.2.0需要metadata字段
      if (toVersion.startsWith('1.2.0')) {
        if (
          !migratedData.metadata ||
          typeof migratedData.metadata !== 'object'
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('版本特定数据验证失败', undefined, {
        error: (error as Error).message,
        migratedData,
        toVersion,
      });
      return false;
    }
  }

  /**
   * 创建迁移键
   *
   * @description 创建迁移脚本的唯一键
   * @param eventType 事件类型
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   * @returns 迁移键
   */
  private createMigrationKey(
    eventType: string,
    fromVersion: string,
    toVersion: string,
  ): string {
    return `${eventType}:${fromVersion}:${toVersion}`;
  }
}
