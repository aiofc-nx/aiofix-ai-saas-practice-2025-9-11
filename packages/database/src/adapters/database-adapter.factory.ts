/**
 * @fileoverview 数据库适配器工厂
 * @description 根据隔离策略配置动态创建数据库适配器
 */

import {
  IsolationConfigService,
  IsolationStrategy,
} from '../config/isolation.config';
import { PostgreSQLAdapter } from './postgresql.adapter';
import { IDatabaseAdapter } from '../interfaces/database.interface';

/**
 * @class DatabaseAdapterFactory
 * @description 数据库适配器工厂类
 */
export class DatabaseAdapterFactory {
  constructor(private readonly isolationConfig: IsolationConfigService) {}

  /**
   * @method createAdapter
   * @description 根据隔离策略创建数据库适配器
   * @param {string} [tenantId] 租户ID，可选
   * @returns {IDatabaseAdapter} 数据库适配器实例
   */
  createAdapter(tenantId?: string): IDatabaseAdapter {
    const strategy = this.isolationConfig.getStrategy();
    const connectionConfig = this.isolationConfig.getConnectionConfig(tenantId);

    switch (strategy) {
      case IsolationStrategy.DATABASE_LEVEL:
        return this.createDatabaseLevelAdapter(connectionConfig);

      case IsolationStrategy.SCHEMA_LEVEL:
        return this.createSchemaLevelAdapter(connectionConfig);

      case IsolationStrategy.TABLE_LEVEL:
        return this.createTableLevelAdapter(connectionConfig);

      default:
        throw new Error(`Unsupported isolation strategy: ${String(strategy)}`);
    }
  }

  /**
   * @method createDatabaseLevelAdapter
   * @description 创建数据库级隔离适配器
   * @param {object} connectionConfig 连接配置
   * @returns {IDatabaseAdapter} 数据库适配器
   * @private
   */
  private createDatabaseLevelAdapter(connectionConfig: {
    database: string;
    tenantId?: string;
  }): IDatabaseAdapter {
    const adapter = new PostgreSQLAdapter(
      {
        type: 'postgresql',
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
        database: connectionConfig.database,
        username: process.env.POSTGRES_USER ?? 'aiofix_user',
        password: process.env.POSTGRES_PASSWORD ?? 'aiofix_password',
      },
      null as any,
      null as any,
      null as any,
    );

    // 为数据库级隔离添加租户上下文
    if (connectionConfig.tenantId) {
      adapter.setTenantContext(connectionConfig.tenantId);
    }

    return adapter;
  }

  /**
   * @method createSchemaLevelAdapter
   * @description 创建Schema级隔离适配器
   * @param {object} connectionConfig 连接配置
   * @returns {IDatabaseAdapter} 数据库适配器
   * @private
   */
  private createSchemaLevelAdapter(connectionConfig: {
    database: string;
    schema?: string;
    tenantId?: string;
  }): IDatabaseAdapter {
    const adapter = new PostgreSQLAdapter(
      {
        type: 'postgresql',
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
        database: connectionConfig.database,
        username: process.env.POSTGRES_USER ?? 'aiofix_user',
        password: process.env.POSTGRES_PASSWORD ?? 'aiofix_password',
      },
      null as any,
      null as any,
      null as any,
    );

    // 为Schema级隔离设置默认Schema
    if (connectionConfig.schema) {
      adapter.setDefaultSchema(connectionConfig.schema);
    }

    // 设置租户上下文
    if (connectionConfig.tenantId) {
      adapter.setTenantContext(connectionConfig.tenantId);
    }

    return adapter;
  }

  /**
   * @method createTableLevelAdapter
   * @description 创建表级隔离适配器
   * @param {object} connectionConfig 连接配置
   * @returns {IDatabaseAdapter} 数据库适配器
   * @private
   */
  private createTableLevelAdapter(connectionConfig: {
    database: string;
    tenantId?: string;
  }): IDatabaseAdapter {
    const adapter = new PostgreSQLAdapter(
      {
        type: 'postgresql',
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
        database: connectionConfig.database,
        username: process.env.POSTGRES_USER ?? 'aiofix_user',
        password: process.env.POSTGRES_PASSWORD ?? 'aiofix_password',
      },
      null as any,
      null as any,
      null as any,
    );

    // 为表级隔离设置租户上下文和RLS
    if (connectionConfig.tenantId) {
      adapter.setTenantContext(connectionConfig.tenantId);

      if (this.isolationConfig.shouldEnableRLS()) {
        adapter.enableRowLevelSecurity();
      }
    }

    return adapter;
  }

  /**
   * @method createPlatformAdapter
   * @description 创建平台级适配器（用于跨租户操作）
   * @returns {IDatabaseAdapter} 数据库适配器
   */
  createPlatformAdapter(): IDatabaseAdapter {
    return new PostgreSQLAdapter(
      {
        type: 'postgresql',
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
        database: this.isolationConfig.getPlatformDatabaseName(),
        username: process.env.POSTGRES_USER ?? 'aiofix_user',
        password: process.env.POSTGRES_PASSWORD ?? 'aiofix_password',
      },
      null as any,
      null as any,
      null as any,
    );
  }

  /**
   * @method createEventsAdapter
   * @description 创建事件存储适配器
   * @returns {IDatabaseAdapter} 数据库适配器
   */
  createEventsAdapter(): IDatabaseAdapter {
    return new PostgreSQLAdapter(
      {
        type: 'postgresql',
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
        database: this.isolationConfig.getEventsDatabaseName(),
        username: process.env.POSTGRES_USER ?? 'aiofix_user',
        password: process.env.POSTGRES_PASSWORD ?? 'aiofix_password',
      },
      null as any,
      null as any,
      null as any,
    );
  }

  /**
   * @method createAiVectorsAdapter
   * @description 创建AI向量存储适配器
   * @returns {IDatabaseAdapter} 数据库适配器
   */
  createAiVectorsAdapter(): IDatabaseAdapter {
    return new PostgreSQLAdapter(
      {
        type: 'postgresql',
        host:
          process.env.AI_VECTORS_HOST ??
          process.env.POSTGRES_HOST ??
          'localhost',
        port: parseInt(
          process.env.AI_VECTORS_PORT ?? process.env.POSTGRES_PORT ?? '5432',
        ),
        database: this.isolationConfig.getAiVectorsDatabaseName(),
        username:
          process.env.AI_VECTORS_USER ??
          process.env.POSTGRES_USER ??
          'aiofix_user',
        password:
          process.env.AI_VECTORS_PASSWORD ??
          process.env.POSTGRES_PASSWORD ??
          'aiofix_password',
      },
      null as any,
      null as any,
      null as any,
    );
  }
}
