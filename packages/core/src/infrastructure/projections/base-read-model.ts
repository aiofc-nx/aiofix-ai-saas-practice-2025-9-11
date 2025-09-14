import {
  BaseReadModel,
  ReadModelQuery,
  ReadModelQueryResult,
  ReadModelUpdate,
  BatchUpdateResult,
  BatchDeleteResult,
  RebuildResult,
  ReadModelStatistics,
} from './base-read-model.interface';

/**
 * 基础读模型
 *
 * 基础读模型提供读模型操作的通用功能和模板。
 * 所有具体的读模型都应该继承此类，确保读模型的一致性和可维护性。
 *
 * @description 所有读模型的基类
 * 提供读模型操作的通用功能和最佳实践
 *
 * ## 业务规则
 *
 * ### 数据一致性规则
 * - 读模型应该与领域事件保持最终一致性
 * - 支持读模型的版本控制和更新
 * - 处理并发更新冲突
 * - 维护读模型的数据完整性
 *
 * ### 查询优化规则
 * - 读模型应该针对查询需求优化
 * - 支持高效的索引和查询
 * - 提供灵活的查询接口
 * - 支持复杂的查询条件
 *
 * ### 性能规则
 * - 读模型更新应该高效
 * - 支持批量更新操作
 * - 优化查询响应时间
 * - 提供查询性能监控
 *
 * ## 业务逻辑流程
 *
 * 1. **事件接收**：接收来自事件投射器的事件处理结果
 * 2. **数据更新**：根据事件更新读模型数据
 * 3. **索引维护**：维护读模型的索引结构
 * 4. **一致性检查**：检查读模型的数据一致性
 * 5. **查询优化**：优化查询性能和响应时间
 *
 * @template TModel 读模型类型
 *
 * @example
 * ```typescript
 * class UserReadModel extends BaseReadModelImpl<UserReadModelData> {
 *   protected async executeQuery(query: ReadModelQuery): Promise<ReadModelQueryResult<UserReadModelData>> {
 *     // 具体的查询实现
 *   }
 *
 *   protected async executeUpdate(id: string, data: Partial<UserReadModelData>): Promise<void> {
 *     // 具体的更新实现
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseReadModelImpl<TModel>
  implements BaseReadModel<TModel>
{
  protected readonly modelName: string;
  protected totalRecords: number = 0;
  protected lastUpdated: Date = new Date();
  protected queryTimes: number[] = [];
  protected updateTimes: number[] = [];
  protected totalQueries: number = 0;
  protected totalUpdates: number = 0;
  protected errorCount: number = 0;

  /**
   * 构造函数
   *
   * @param modelName 读模型名称
   */
  constructor(modelName: string) {
    this.modelName = modelName;
  }

  /**
   * 获取读模型数据
   *
   * @description 根据查询条件获取读模型数据
   * @param query 查询条件
   * @returns Promise<ReadModelQueryResult<TModel>>
   * @throws {Error} 当查询失败时抛出
   */
  public async query(
    query: ReadModelQuery
  ): Promise<ReadModelQueryResult<TModel>> {
    const startTime = Date.now();

    try {
      // 验证查询条件
      this.validateQuery(query);

      // 执行查询
      const result = await this.executeQuery(query);

      // 更新统计信息
      this.updateQueryStatistics(startTime, false);

      return result;
    } catch (error) {
      this.updateQueryStatistics(startTime, true);
      throw new Error(
        `Failed to query ${this.modelName}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 根据ID获取读模型数据
   *
   * @description 根据唯一标识符获取单个读模型数据
   * @param id 唯一标识符
   * @returns Promise<TModel | null>
   * @throws {Error} 当查询失败时抛出
   */
  public async findById(id: string): Promise<TModel | null> {
    if (!id) {
      throw new Error('ID cannot be null or undefined');
    }

    const startTime = Date.now();

    try {
      const result = await this.executeFindById(id);
      this.updateQueryStatistics(startTime, false);
      return result;
    } catch (error) {
      this.updateQueryStatistics(startTime, true);
      throw new Error(
        `Failed to find ${this.modelName} by ID: ${(error as Error).message}`
      );
    }
  }

  /**
   * 更新读模型数据
   *
   * @description 更新读模型数据，支持增量更新
   * @param id 唯一标识符
   * @param data 更新的数据
   * @returns Promise<void>
   * @throws {Error} 当更新失败时抛出
   */
  public async update(id: string, data: Partial<TModel>): Promise<void> {
    if (!id) {
      throw new Error('ID cannot be null or undefined');
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error('Update data cannot be empty');
    }

    const startTime = Date.now();

    try {
      await this.executeUpdate(id, data);
      this.updateUpdateStatistics(startTime, false);
      this.lastUpdated = new Date();
    } catch (error) {
      this.updateUpdateStatistics(startTime, true);
      throw new Error(
        `Failed to update ${this.modelName}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 批量更新读模型数据
   *
   * @description 批量更新多个读模型数据，提供高效的批量更新功能
   * @param updates 批量更新数据
   * @returns Promise<BatchUpdateResult>
   * @throws {Error} 当批量更新失败时抛出
   */
  public async batchUpdate(
    updates: ReadModelUpdate[]
  ): Promise<BatchUpdateResult> {
    if (!updates || updates.length === 0) {
      return this.createEmptyBatchUpdateResult();
    }

    const startTime = Date.now();
    const failedUpdates: Array<{ id: string; error: string }> = [];
    let updatedCount = 0;

    try {
      for (const update of updates) {
        try {
          await this.executeUpdate(update.id, update.data);
          updatedCount++;
        } catch (error) {
          failedUpdates.push({
            id: update.id,
            error: (error as Error).message,
          });
        }
      }

      const endTime = Date.now();
      this.lastUpdated = new Date();

      return {
        updatedCount,
        failedCount: failedUpdates.length,
        failedUpdates,
        duration: endTime - startTime,
      };
    } catch (error) {
      throw new Error(
        `Failed to batch update ${this.modelName}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 删除读模型数据
   *
   * @description 删除读模型数据
   * @param id 唯一标识符
   * @returns Promise<void>
   * @throws {Error} 当删除失败时抛出
   */
  public async delete(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID cannot be null or undefined');
    }

    const startTime = Date.now();

    try {
      await this.executeDelete(id);
      this.updateUpdateStatistics(startTime, false);
      this.lastUpdated = new Date();
    } catch (error) {
      this.updateUpdateStatistics(startTime, true);
      throw new Error(
        `Failed to delete ${this.modelName}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 批量删除读模型数据
   *
   * @description 批量删除多个读模型数据
   * @param ids 唯一标识符列表
   * @returns Promise<BatchDeleteResult>
   * @throws {Error} 当批量删除失败时抛出
   */
  public async batchDelete(ids: string[]): Promise<BatchDeleteResult> {
    if (!ids || ids.length === 0) {
      return this.createEmptyBatchDeleteResult();
    }

    const startTime = Date.now();
    const failedDeletes: Array<{ id: string; error: string }> = [];
    let deletedCount = 0;

    try {
      for (const id of ids) {
        try {
          await this.executeDelete(id);
          deletedCount++;
        } catch (error) {
          failedDeletes.push({
            id,
            error: (error as Error).message,
          });
        }
      }

      const endTime = Date.now();
      this.lastUpdated = new Date();

      return {
        deletedCount,
        failedCount: failedDeletes.length,
        failedDeletes,
        duration: endTime - startTime,
      };
    } catch (error) {
      throw new Error(
        `Failed to batch delete ${this.modelName}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 重建读模型
   *
   * @description 从事件历史重建读模型，支持完整的读模型重建
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号
   * @returns Promise<RebuildResult>
   * @throws {Error} 当重建失败时抛出
   */
  public async rebuild(
    fromVersion?: number,
    toVersion?: number
  ): Promise<RebuildResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processedEvents = 0;
    let rebuiltRecords = 0;

    try {
      // 清除现有数据
      await this.clearAllData();

      // 执行重建逻辑
      const result = await this.executeRebuild(fromVersion, toVersion);

      processedEvents = result.processedEvents;
      rebuiltRecords = result.rebuiltRecords;
      errors.push(...result.errors);

      const endTime = Date.now();

      return {
        processedEvents,
        rebuiltRecords,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: endTime - startTime,
        hasErrors: errors.length > 0,
        errors,
      };
    } catch (error) {
      throw new Error(
        `Failed to rebuild ${this.modelName}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取读模型统计信息
   *
   * @description 获取读模型的统计信息和性能指标
   * @returns Promise<ReadModelStatistics>
   */
  public async getStatistics(): Promise<ReadModelStatistics> {
    const averageQueryTime =
      this.queryTimes.length > 0
        ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length
        : 0;

    const averageUpdateTime =
      this.updateTimes.length > 0
        ? this.updateTimes.reduce((a, b) => a + b, 0) / this.updateTimes.length
        : 0;

    const errorRate =
      this.totalQueries + this.totalUpdates > 0
        ? (this.errorCount / (this.totalQueries + this.totalUpdates)) * 100
        : 0;

    const queryQPS =
      this.queryTimes.length > 0
        ? (this.totalQueries * 1000) /
          this.queryTimes.reduce((a, b) => a + b, 0)
        : 0;

    const updateQPS =
      this.updateTimes.length > 0
        ? (this.totalUpdates * 1000) /
          this.updateTimes.reduce((a, b) => a + b, 0)
        : 0;

    return {
      totalRecords: this.totalRecords,
      lastUpdated: this.lastUpdated,
      averageQueryTime,
      averageUpdateTime,
      totalQueries: this.totalQueries,
      totalUpdates: this.totalUpdates,
      errorRate,
      performance: {
        queryQPS,
        updateQPS,
        cacheHitRate: 0, // 子类可以重写此值
      },
    };
  }

  /**
   * 执行具体的查询逻辑
   *
   * @description 由子类实现具体的查询逻辑
   * @param query 查询条件
   * @returns Promise<ReadModelQueryResult<TModel>>
   * @protected
   * @abstract
   */
  protected abstract executeQuery(
    query: ReadModelQuery
  ): Promise<ReadModelQueryResult<TModel>>;

  /**
   * 执行根据ID查找的逻辑
   *
   * @description 由子类实现具体的ID查找逻辑
   * @param id 唯一标识符
   * @returns Promise<TModel | null>
   * @protected
   * @abstract
   */
  protected abstract executeFindById(id: string): Promise<TModel | null>;

  /**
   * 执行具体的更新逻辑
   *
   * @description 由子类实现具体的更新逻辑
   * @param id 唯一标识符
   * @param data 更新的数据
   * @returns Promise<void>
   * @protected
   * @abstract
   */
  protected abstract executeUpdate(
    id: string,
    data: Partial<TModel>
  ): Promise<void>;

  /**
   * 执行具体的删除逻辑
   *
   * @description 由子类实现具体的删除逻辑
   * @param id 唯一标识符
   * @returns Promise<void>
   * @protected
   * @abstract
   */
  protected abstract executeDelete(id: string): Promise<void>;

  /**
   * 执行具体的重建逻辑
   *
   * @description 由子类实现具体的重建逻辑
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号
   * @returns Promise<{ processedEvents: number; rebuiltRecords: number; errors: string[] }>
   * @protected
   * @abstract
   */
  protected abstract executeRebuild(
    fromVersion?: number,
    toVersion?: number
  ): Promise<{
    processedEvents: number;
    rebuiltRecords: number;
    errors: string[];
  }>;

  /**
   * 清除所有数据
   *
   * @description 清除读模型的所有数据
   * @protected
   * @abstract
   */
  protected abstract clearAllData(): Promise<void>;

  /**
   * 验证查询条件
   *
   * @description 验证查询条件的有效性
   * @param query 查询条件
   * @protected
   * @throws {Error} 当查询条件无效时抛出
   */
  protected validateQuery(query: ReadModelQuery): void {
    if (!query) {
      throw new Error('Query cannot be null or undefined');
    }

    if (query.pagination) {
      if (query.pagination.page < 1) {
        throw new Error('Page number must be greater than 0');
      }
      if (query.pagination.limit < 1 || query.pagination.limit > 1000) {
        throw new Error('Limit must be between 1 and 1000');
      }
    }

    if (query.sorting) {
      if (!query.sorting.field) {
        throw new Error('Sorting field is required');
      }
      if (!['asc', 'desc'].includes(query.sorting.order)) {
        throw new Error('Sorting order must be "asc" or "desc"');
      }
    }
  }

  /**
   * 更新查询统计信息
   *
   * @description 更新查询相关的统计信息
   * @param startTime 查询开始时间
   * @param hasError 是否有错误
   * @protected
   */
  protected updateQueryStatistics(startTime: number, hasError: boolean): void {
    const queryTime = Date.now() - startTime;
    this.queryTimes.push(queryTime);

    // 保持最近100次的查询时间记录
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }

    this.totalQueries++;

    if (hasError) {
      this.errorCount++;
    }
  }

  /**
   * 更新更新统计信息
   *
   * @description 更新更新相关的统计信息
   * @param startTime 更新开始时间
   * @param hasError 是否有错误
   * @protected
   */
  protected updateUpdateStatistics(startTime: number, hasError: boolean): void {
    const updateTime = Date.now() - startTime;
    this.updateTimes.push(updateTime);

    // 保持最近100次的更新时间记录
    if (this.updateTimes.length > 100) {
      this.updateTimes.shift();
    }

    this.totalUpdates++;

    if (hasError) {
      this.errorCount++;
    }
  }

  /**
   * 创建空的批量更新结果
   *
   * @description 创建空的批量更新结果对象
   * @returns BatchUpdateResult
   * @protected
   */
  protected createEmptyBatchUpdateResult(): BatchUpdateResult {
    return {
      updatedCount: 0,
      failedCount: 0,
      failedUpdates: [],
      duration: 0,
    };
  }

  /**
   * 创建空的批量删除结果
   *
   * @description 创建空的批量删除结果对象
   * @returns BatchDeleteResult
   * @protected
   */
  protected createEmptyBatchDeleteResult(): BatchDeleteResult {
    return {
      deletedCount: 0,
      failedCount: 0,
      failedDeletes: [],
      duration: 0,
    };
  }
}
