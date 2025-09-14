/**
 * @fileoverview 数据库隔离策略配置
 * @description 支持多种数据隔离模式的配置驱动实现
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@aiofix/config';

/**
 * @enum IsolationStrategy
 * @description 数据隔离策略枚举
 */
export enum IsolationStrategy {
  /** 数据库级隔离：每个租户使用独立数据库 */
  DATABASE_LEVEL = 'database_level',
  /** Schema级隔离：每个租户使用独立Schema */
  SCHEMA_LEVEL = 'schema_level',
  /** 表级隔离：使用tenant_id字段隔离（默认） */
  TABLE_LEVEL = 'table_level',
}

/**
 * @interface IsolationConfig
 * @description 数据隔离配置接口
 */
export interface IsolationConfig {
  /** 隔离策略 */
  strategy: IsolationStrategy;
  /** 默认租户ID */
  defaultTenantId: string;
  /** 数据库级隔离配置 */
  databaseLevel: {
    /** 租户数据库前缀 */
    tenantDbPrefix: string;
    /** 平台数据库名称 */
    platformDbName: string;
    /** 事件存储数据库名称 */
    eventsDbName: string;
    /** AI向量数据库名称 */
    aiVectorsDbName: string;
  };
  /** Schema级隔离配置 */
  schemaLevel: {
    /** 租户Schema前缀 */
    tenantSchemaPrefix: string;
    /** 共享Schema名称 */
    sharedSchemaName: string;
  };
  /** 表级隔离配置 */
  tableLevel: {
    /** 是否启用行级安全策略（RLS） */
    enableRLS: boolean;
    /** 租户ID字段名称 */
    tenantIdField: string;
    /** 是否自动添加tenant_id条件 */
    autoAddTenantCondition: boolean;
  };
}

/**
 * @class IsolationConfigService
 * @description 数据隔离配置服务
 */
@Injectable()
export class IsolationConfigService {
  private config: IsolationConfig | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * @method loadConfig
   * @description 从环境变量加载隔离配置
   * @returns {IsolationConfig} 隔离配置
   */
  private loadConfig(): IsolationConfig {
    const strategyValue =
      this.configService.get('DATA_ISOLATION_STRATEGY') || 'table_level';

    // 验证策略值
    if (
      !Object.values(IsolationStrategy).includes(
        strategyValue as IsolationStrategy,
      )
    ) {
      throw new Error(`Invalid isolation strategy: ${strategyValue}`);
    }

    const strategy = strategyValue as IsolationStrategy;

    return {
      strategy,
      defaultTenantId:
        this.configService.get('DEFAULT_TENANT_ID') ||
        '00000000-0000-0000-0000-000000000001',
      databaseLevel: {
        tenantDbPrefix:
          this.configService.get('TENANT_DB_PREFIX') || 'aiofix_tenant_',
        platformDbName:
          this.configService.get('PLATFORM_DB_NAME') || 'aiofix_platform',
        eventsDbName:
          this.configService.get('EVENTS_DB_NAME') || 'aiofix_events',
        aiVectorsDbName:
          this.configService.get('AI_VECTORS_DB_NAME') || 'aiofix_ai_vectors',
      },
      schemaLevel: {
        tenantSchemaPrefix:
          this.configService.get('TENANT_SCHEMA_PREFIX') || 'tenant_',
        sharedSchemaName:
          this.configService.get('SHARED_SCHEMA_NAME') || 'shared',
      },
      tableLevel: {
        enableRLS: this.configService.get('ENABLE_RLS') !== 'false',
        tenantIdField: this.configService.get('TENANT_ID_FIELD') || 'tenant_id',
        autoAddTenantCondition:
          this.configService.get('AUTO_ADD_TENANT_CONDITION') !== 'false',
      },
    };
  }

  /**
   * @method getConfig
   * @description 获取当前隔离配置
   * @returns {IsolationConfig} 隔离配置
   */
  getConfig(): IsolationConfig {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config;
  }

  /**
   * @method getStrategy
   * @description 获取当前隔离策略
   * @returns {IsolationStrategy} 隔离策略
   */
  getStrategy(): IsolationStrategy {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.strategy;
  }

  /**
   * @method isDatabaseLevel
   * @description 是否为数据库级隔离
   * @returns {boolean} 是否为数据库级隔离
   */
  isDatabaseLevel(): boolean {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.strategy === IsolationStrategy.DATABASE_LEVEL;
  }

  /**
   * @method isSchemaLevel
   * @description 是否为Schema级隔离
   * @returns {boolean} 是否为Schema级隔离
   */
  isSchemaLevel(): boolean {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.strategy === IsolationStrategy.SCHEMA_LEVEL;
  }

  /**
   * @method isTableLevel
   * @description 是否为表级隔离
   * @returns {boolean} 是否为表级隔离
   */
  isTableLevel(): boolean {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.strategy === IsolationStrategy.TABLE_LEVEL;
  }

  /**
   * @method getTenantDatabaseName
   * @description 获取租户数据库名称
   * @param {string} tenantId 租户ID
   * @returns {string} 数据库名称
   */
  getTenantDatabaseName(tenantId: string): string {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    if (this.isDatabaseLevel()) {
      return `${this.config.databaseLevel.tenantDbPrefix}${tenantId}`;
    }
    return this.config.databaseLevel.platformDbName;
  }

  /**
   * @method getTenantSchemaName
   * @description 获取租户Schema名称
   * @param {string} tenantId 租户ID
   * @returns {string} Schema名称
   */
  getTenantSchemaName(tenantId: string): string {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    if (this.isSchemaLevel()) {
      return `${this.config.schemaLevel.tenantSchemaPrefix}${tenantId}`;
    }
    return 'public';
  }

  /**
   * @method getPlatformDatabaseName
   * @description 获取平台数据库名称
   * @returns {string} 数据库名称
   */
  getPlatformDatabaseName(): string {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.databaseLevel.platformDbName;
  }

  /**
   * @method getEventsDatabaseName
   * @description 获取事件存储数据库名称
   * @returns {string} 数据库名称
   */
  getEventsDatabaseName(): string {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.databaseLevel.eventsDbName;
  }

  /**
   * @method getAiVectorsDatabaseName
   * @description 获取AI向量数据库名称
   * @returns {string} 数据库名称
   */
  getAiVectorsDatabaseName(): string {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.databaseLevel.aiVectorsDbName;
  }

  /**
   * @method getTenantIdField
   * @description 获取租户ID字段名称
   * @returns {string} 字段名称
   */
  getTenantIdField(): string {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.tableLevel.tenantIdField;
  }

  /**
   * @method shouldEnableRLS
   * @description 是否应该启用行级安全策略
   * @returns {boolean} 是否启用RLS
   */
  shouldEnableRLS(): boolean {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.tableLevel.enableRLS;
  }

  /**
   * @method shouldAutoAddTenantCondition
   * @description 是否应该自动添加租户条件
   * @returns {boolean} 是否自动添加条件
   */
  shouldAutoAddTenantCondition(): boolean {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.tableLevel.autoAddTenantCondition;
  }

  /**
   * @method getDefaultTenantId
   * @description 获取默认租户ID
   * @returns {string} 默认租户ID
   */
  getDefaultTenantId(): string {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config.defaultTenantId;
  }

  /**
   * @method validateConfig
   * @description 验证配置的有效性
   * @returns {boolean} 配置是否有效
   */
  validateConfig(): boolean {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    try {
      // 验证策略值
      if (!Object.values(IsolationStrategy).includes(this.config.strategy)) {
        throw new Error(`Invalid isolation strategy: ${this.config.strategy}`);
      }

      // 验证UUID格式的租户ID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(this.config.defaultTenantId)) {
        throw new Error(
          `Invalid default tenant ID format: ${this.config.defaultTenantId}`,
        );
      }

      // 验证数据库名称
      if (!this.config.databaseLevel.platformDbName) {
        throw new Error('Platform database name is required');
      }

      return true;
    } catch (error) {
      console.error('Isolation config validation failed:', error);
      return false;
    }
  }

  /**
   * @method getConnectionConfig
   * @description 获取数据库连接配置
   * @param {string} [tenantId] 租户ID，可选
   * @returns {object} 连接配置
   */
  getConnectionConfig(tenantId?: string): {
    database: string;
    schema?: string;
    tenantId?: string;
  } {
    const config: any = {};

    if (this.isDatabaseLevel() && tenantId) {
      config.database = this.getTenantDatabaseName(tenantId);
      config.tenantId = tenantId;
    } else if (this.isSchemaLevel() && tenantId) {
      config.database = this.getPlatformDatabaseName();
      config.schema = this.getTenantSchemaName(tenantId);
      config.tenantId = tenantId;
    } else {
      config.database = this.getPlatformDatabaseName();
      if (tenantId) {
        config.tenantId = tenantId;
      }
    }

    return config;
  }

  /**
   * @method getQueryModifier
   * @description 获取查询修改器
   * @param {string} [tenantId] 租户ID，可选
   * @returns {object} 查询修改器
   */
  getQueryModifier(tenantId?: string): {
    addTenantCondition: (query: string, tableName: string) => string;
    setTenantContext: () => string;
    getTablePrefix: () => string;
  } {
    return {
      addTenantCondition: (query: string, tableName: string) => {
        if (
          this.isTableLevel() &&
          tenantId &&
          this.shouldAutoAddTenantCondition()
        ) {
          const tenantIdField = this.getTenantIdField();
          if (!query.toLowerCase().includes('where')) {
            return `${query} WHERE ${tableName}.${tenantIdField} = '${tenantId}'`;
          } else {
            return `${query} AND ${tableName}.${tenantIdField} = '${tenantId}'`;
          }
        }
        return query;
      },
      setTenantContext: () => {
        if (this.isTableLevel() && tenantId && this.shouldEnableRLS()) {
          return `SET app.current_tenant_id = '${tenantId}'`;
        }
        return '';
      },
      getTablePrefix: () => {
        if (this.isSchemaLevel() && tenantId) {
          return `${this.getTenantSchemaName(tenantId)}.`;
        }
        return '';
      },
    };
  }
}
