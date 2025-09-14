/**
 * 基础读模型接口
 *
 * 读模型是Event Sourcing架构中的查询优化组件，用于提供高效的查询性能。
 * 读模型通过事件投射器从领域事件构建，为应用程序提供优化的数据视图。
 *
 * @description 所有读模型的基接口
 * 定义读模型的通用规范和最佳实践
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
 * ### 多租户规则
 * - 读模型应该支持多租户数据隔离
 * - 提供租户级别的查询优化
 * - 支持跨租户的数据聚合
 * - 维护租户数据的安全性
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
 * interface UserReadModel extends BaseReadModel<UserReadModelData> {
 *   // 用户读模型实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface BaseReadModel<TModel> {
  /**
   * 获取读模型数据
   *
   * @description 根据查询条件获取读模型数据
   *
   * ## 业务规则
   *
   * ### 查询规则
   * - 支持多种查询条件
   * - 提供分页和排序功能
   * - 支持聚合查询
   * - 处理查询结果缓存
   *
   * ### 性能规则
   * - 查询应该高效
   * - 支持查询结果缓存
   * - 优化复杂查询性能
   * - 提供查询性能监控
   *
   * @param query 查询条件
   * @returns Promise<ReadModelQueryResult<TModel>>
   * @throws {Error} 当查询失败时抛出
   *
   * @example
   * ```typescript
   * const result = await userReadModel.query({
   *   filters: { status: 'active' },
   *   pagination: { page: 1, limit: 10 },
   *   sorting: { field: 'createdAt', order: 'desc' }
   * });
   * ```
   */
  query(query: ReadModelQuery): Promise<ReadModelQueryResult<TModel>>;

  /**
   * 根据ID获取读模型数据
   *
   * @description 根据唯一标识符获取单个读模型数据
   *
   * @param id 唯一标识符
   * @returns Promise<TModel | null>
   * @throws {Error} 当查询失败时抛出
   *
   * @example
   * ```typescript
   * const user = await userReadModel.findById('user-123');
   * ```
   */
  findById(id: string): Promise<TModel | null>;

  /**
   * 更新读模型数据
   *
   * @description 更新读模型数据，支持增量更新
   *
   * ## 业务规则
   *
   * ### 更新规则
   * - 更新应该是原子的
   * - 支持增量更新
   * - 处理并发更新冲突
   * - 维护数据一致性
   *
   * ### 性能规则
   * - 更新应该高效
   * - 支持批量更新
   * - 优化索引维护
   * - 提供更新性能监控
   *
   * @param id 唯一标识符
   * @param data 更新的数据
   * @returns Promise<void>
   * @throws {Error} 当更新失败时抛出
   *
   * @example
   * ```typescript
   * await userReadModel.update('user-123', { name: 'New Name' });
   * ```
   */
  update(id: string, data: Partial<TModel>): Promise<void>;

  /**
   * 批量更新读模型数据
   *
   * @description 批量更新多个读模型数据，提供高效的批量更新功能
   *
   * @param updates 批量更新数据
   * @returns Promise<BatchUpdateResult>
   * @throws {Error} 当批量更新失败时抛出
   *
   * @example
   * ```typescript
   * const result = await userReadModel.batchUpdate([
   *   { id: 'user-1', data: { name: 'User 1' } },
   *   { id: 'user-2', data: { name: 'User 2' } }
   * ]);
   * ```
   */
  batchUpdate(updates: ReadModelUpdate[]): Promise<BatchUpdateResult>;

  /**
   * 删除读模型数据
   *
   * @description 删除读模型数据
   *
   * @param id 唯一标识符
   * @returns Promise<void>
   * @throws {Error} 当删除失败时抛出
   *
   * @example
   * ```typescript
   * await userReadModel.delete('user-123');
   * ```
   */
  delete(id: string): Promise<void>;

  /**
   * 批量删除读模型数据
   *
   * @description 批量删除多个读模型数据
   *
   * @param ids 唯一标识符列表
   * @returns Promise<BatchDeleteResult>
   * @throws {Error} 当批量删除失败时抛出
   *
   * @example
   * ```typescript
   * const result = await userReadModel.batchDelete(['user-1', 'user-2']);
   * ```
   */
  batchDelete(ids: string[]): Promise<BatchDeleteResult>;

  /**
   * 重建读模型
   *
   * @description 从事件历史重建读模型，支持完整的读模型重建
   *
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号
   * @returns Promise<RebuildResult>
   * @throws {Error} 当重建失败时抛出
   *
   * @example
   * ```typescript
   * const result = await userReadModel.rebuild(0, 1000);
   * ```
   */
  rebuild(fromVersion?: number, toVersion?: number): Promise<RebuildResult>;

  /**
   * 获取读模型统计信息
   *
   * @description 获取读模型的统计信息和性能指标
   *
   * @returns Promise<ReadModelStatistics>
   *
   * @example
   * ```typescript
   * const stats = await userReadModel.getStatistics();
   * console.log(`总记录数: ${stats.totalRecords}`);
   * ```
   */
  getStatistics(): Promise<ReadModelStatistics>;
}

/**
 * 读模型查询条件
 *
 * @description 定义读模型查询的条件和选项
 */
export interface ReadModelQuery {
  /** 过滤条件 */
  filters?: Record<string, any>;
  /** 分页选项 */
  pagination?: {
    page: number;
    limit: number;
  };
  /** 排序选项 */
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
  /** 聚合选项 */
  aggregation?: {
    groupBy: string[];
    aggregations: Record<string, 'count' | 'sum' | 'avg' | 'min' | 'max'>;
  };
  /** 租户ID（多租户支持） */
  tenantId?: string;
  /** 组织ID（多租户支持） */
  organizationId?: string;
  /** 部门ID（多租户支持） */
  departmentId?: string;
}

/**
 * 读模型查询结果
 *
 * @description 读模型查询的结果数据
 */
export interface ReadModelQueryResult<TModel> {
  /** 查询结果数据 */
  data: TModel[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页记录数 */
  limit: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrevious: boolean;
  /** 查询耗时（毫秒） */
  queryTime: number;
  /** 聚合结果（如果适用） */
  aggregations?: Record<string, any>;
}

/**
 * 读模型更新数据
 *
 * @description 读模型更新的数据定义
 */
export interface ReadModelUpdate {
  /** 唯一标识符 */
  id: string;
  /** 更新的数据 */
  data: Partial<any>;
  /** 更新时间 */
  updatedAt?: Date;
}

/**
 * 批量更新结果
 *
 * @description 批量更新的结果信息
 */
export interface BatchUpdateResult {
  /** 更新的记录数 */
  updatedCount: number;
  /** 失败的记录数 */
  failedCount: number;
  /** 失败的记录详情 */
  failedUpdates: Array<{
    id: string;
    error: string;
  }>;
  /** 更新耗时（毫秒） */
  duration: number;
}

/**
 * 批量删除结果
 *
 * @description 批量删除的结果信息
 */
export interface BatchDeleteResult {
  /** 删除的记录数 */
  deletedCount: number;
  /** 失败的记录数 */
  failedCount: number;
  /** 失败的记录详情 */
  failedDeletes: Array<{
    id: string;
    error: string;
  }>;
  /** 删除耗时（毫秒） */
  duration: number;
}

/**
 * 重建结果
 *
 * @description 读模型重建的结果信息
 */
export interface RebuildResult {
  /** 处理的事件数 */
  processedEvents: number;
  /** 重建的记录数 */
  rebuiltRecords: number;
  /** 重建开始时间 */
  startTime: Date;
  /** 重建结束时间 */
  endTime: Date;
  /** 重建耗时（毫秒） */
  duration: number;
  /** 是否有错误 */
  hasErrors: boolean;
  /** 错误详情 */
  errors: string[];
}

/**
 * 读模型统计信息
 *
 * @description 读模型的统计信息和性能指标
 */
export interface ReadModelStatistics {
  /** 总记录数 */
  totalRecords: number;
  /** 最后更新时间 */
  lastUpdated: Date;
  /** 平均查询时间（毫秒） */
  averageQueryTime: number;
  /** 平均更新时间（毫秒） */
  averageUpdateTime: number;
  /** 查询总数 */
  totalQueries: number;
  /** 更新总数 */
  totalUpdates: number;
  /** 错误率 */
  errorRate: number;
  /** 性能指标 */
  performance: {
    /** 查询QPS */
    queryQPS: number;
    /** 更新QPS */
    updateQPS: number;
    /** 缓存命中率 */
    cacheHitRate: number;
  };
}
