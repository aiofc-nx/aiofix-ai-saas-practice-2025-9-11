/**
 * @fileoverview 租户感知的仓储基类
 * @description 根据隔离策略配置自动处理租户数据隔离
 */

import {
  IsolationConfigService,
  IsolationStrategy,
} from '../config/isolation.config';
import { DatabaseAdapterFactory } from '../adapters/database-adapter.factory';
import { IDatabaseAdapter } from '../interfaces/database.interface';

/**
 * @class TenantAwareRepository
 * @description 租户感知的仓储基类
 * @template T 实体类型
 */
export abstract class TenantAwareRepository<T> {
  protected adapter: IDatabaseAdapter;

  constructor(
    protected readonly adapterFactory: DatabaseAdapterFactory,
    protected readonly isolationConfig: IsolationConfigService,
    protected readonly tenantId?: string,
  ) {
    this.adapter = this.adapterFactory.createAdapter(tenantId);
  }

  /**
   * @method findAll
   * @description 查找所有记录
   * @param {object} [options] 查询选项
   * @returns {Promise<T[]>} 记录列表
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
  }): Promise<T[]> {
    let query = `SELECT * FROM ${this.getTableName()}`;

    // 根据隔离策略添加条件
    query = this.addIsolationConditions(query);

    // 添加排序
    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    // 添加分页
    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        query += ` OFFSET ${options.offset}`;
      }
    }

    const result = await this.adapter.query(query);
    return result.rows;
  }

  /**
   * @method findById
   * @description 根据ID查找记录
   * @param {string} id 记录ID
   * @returns {Promise<T | null>} 记录或null
   */
  async findById(id: string): Promise<T | null> {
    let query = `SELECT * FROM ${this.getTableName()} WHERE id = $1`;

    // 根据隔离策略添加条件
    query = this.addIsolationConditions(query);

    const result = await this.adapter.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * @method findByTenantId
   * @description 根据租户ID查找记录
   * @param {string} tenantId 租户ID
   * @param {object} [options] 查询选项
   * @returns {Promise<T[]>} 记录列表
   */
  async findByTenantId(
    tenantId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<T[]> {
    let query = `SELECT * FROM ${this.getTableName()}`;

    // 添加租户条件
    if (this.isolationConfig.isTableLevel()) {
      const tenantIdField = this.isolationConfig.getTenantIdField();
      query += ` WHERE ${tenantIdField} = $1`;
    } else if (
      this.isolationConfig.isDatabaseLevel() ||
      this.isolationConfig.isSchemaLevel()
    ) {
      // 对于数据库级和Schema级隔离，需要创建新的适配器
      const tenantAdapter = this.adapterFactory.createAdapter(tenantId);
      query = `SELECT * FROM ${this.getTableName()}`;

      if (options?.limit) {
        query += ` LIMIT ${options.limit}`;
        if (options?.offset) {
          query += ` OFFSET ${options.offset}`;
        }
      }

      const result = await tenantAdapter.query(query);
      return result.rows;
    }

    // 添加分页
    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        query += ` OFFSET ${options.offset}`;
      }
    }

    const result = await this.adapter.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * @method create
   * @description 创建新记录
   * @param {Partial<T>} data 记录数据
   * @returns {Promise<T>} 创建的记录
   */
  async create(data: Partial<T>): Promise<T> {
    const tenantId = this.tenantId || this.isolationConfig.getDefaultTenantId();

    // 为表级隔离添加tenant_id
    if (this.isolationConfig.isTableLevel()) {
      const tenantIdField = this.isolationConfig.getTenantIdField();
      (data as any)[tenantIdField] = tenantId;
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.getTableName()} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.adapter.query(query, values);
    return result.rows[0];
  }

  /**
   * @method update
   * @description 更新记录
   * @param {string} id 记录ID
   * @param {Partial<T>} data 更新数据
   * @returns {Promise<T | null>} 更新后的记录
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');

    let query = `
      UPDATE ${this.getTableName()}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
    `;

    // 根据隔离策略添加条件
    query = this.addIsolationConditions(query);

    const result = await this.adapter.query(query, [id, ...values]);
    return result.rows[0] || null;
  }

  /**
   * @method delete
   * @description 删除记录
   * @param {string} id 记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id: string): Promise<boolean> {
    let query = `DELETE FROM ${this.getTableName()} WHERE id = $1`;

    // 根据隔离策略添加条件
    query = this.addIsolationConditions(query);

    const result = await this.adapter.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * @method count
   * @description 统计记录数量
   * @param {object} [conditions] 查询条件
   * @returns {Promise<number>} 记录数量
   */
  async count(conditions?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.getTableName()}`;
    const values: any[] = [];
    let paramIndex = 1;

    // 添加查询条件
    if (conditions) {
      const whereConditions = Object.entries(conditions).map(([key, value]) => {
        query += ` WHERE ${key} = $${paramIndex}`;
        values.push(value);
        paramIndex++;
        return `${key} = $${paramIndex}`;
      });

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    // 根据隔离策略添加条件
    query = this.addIsolationConditions(query);

    const result = await this.adapter.query(query, values);
    return parseInt(result.rows[0]?.count) || 0;
  }

  /**
   * @method exists
   * @description 检查记录是否存在
   * @param {string} id 记录ID
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
  }

  /**
   * @method addIsolationConditions
   * @description 根据隔离策略添加隔离条件
   * @param {string} query 原始查询
   * @returns {string} 修改后的查询
   * @protected
   */
  protected addIsolationConditions(query: string): string {
    if (!this.tenantId) {
      return query;
    }

    const strategy = this.isolationConfig.getStrategy();

    switch (strategy) {
      case IsolationStrategy.TABLE_LEVEL:
        if (this.isolationConfig.shouldAutoAddTenantCondition()) {
          const tenantIdField = this.isolationConfig.getTenantIdField();
          if (!query.toLowerCase().includes('where')) {
            return `${query} WHERE ${tenantIdField} = '${this.tenantId}'`;
          } else {
            return `${query} AND ${tenantIdField} = '${this.tenantId}'`;
          }
        }
        break;

      case IsolationStrategy.SCHEMA_LEVEL:
        // Schema级隔离通过适配器处理，这里不需要修改查询
        break;

      case IsolationStrategy.DATABASE_LEVEL:
        // 数据库级隔离通过适配器处理，这里不需要修改查询
        break;
    }

    return query;
  }

  /**
   * @method getTableName
   * @description 获取表名（子类必须实现）
   * @returns {string} 表名
   * @abstract
   */
  protected abstract getTableName(): string;

  /**
   * @method setTenantId
   * @description 设置租户ID
   * @param {string} tenantId 租户ID
   */
  setTenantId(tenantId: string): void {
    (this as any).tenantId = tenantId;
    this.adapter = this.adapterFactory.createAdapter(tenantId);
  }

  /**
   * @method getTenantId
   * @description 获取当前租户ID
   * @returns {string | undefined} 租户ID
   */
  getTenantId(): string | undefined {
    return this.tenantId;
  }

  /**
   * @method createTenantSpecificRepository
   * @description 创建特定租户的仓储实例
   * @param {string} tenantId 租户ID
   * @returns {TenantAwareRepository<T>} 新的仓储实例
   */
  createTenantSpecificRepository(tenantId: string): TenantAwareRepository<T> {
    const RepositoryClass = this.constructor as new (
      adapterFactory: DatabaseAdapterFactory,
      isolationConfig: IsolationConfigService,
      tenantId?: string,
    ) => TenantAwareRepository<T>;

    return new RepositoryClass(
      this.adapterFactory,
      this.isolationConfig,
      tenantId,
    );
  }
}
