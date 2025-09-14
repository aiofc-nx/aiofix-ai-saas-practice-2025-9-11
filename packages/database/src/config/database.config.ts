import { Injectable } from '@nestjs/common';
import { ConfigService } from '@aiofix/config';
import { PinoLoggerService } from '@aiofix/logging';

/**
 * @class DatabaseConfig
 * @description
 * 数据库配置类，负责管理PostgreSQL和MongoDB的配置信息。
 *
 * 配置管理职责：
 * 1. 提供PostgreSQL数据库连接配置
 * 2. 提供MongoDB数据库连接配置
 * 3. 管理数据库连接池配置
 * 4. 支持多租户数据库配置
 *
 * 多租户支持：
 * 1. 支持租户级数据库隔离
 * 2. 动态数据库连接管理
 * 3. 租户数据库路由
 * 4. 数据库连接池优化
 *
 * @param {ConfigService} configService 配置服务
 * @param {PinoLoggerService} logger 日志服务
 *
 * @example
 * ```typescript
 * const dbConfig = new DatabaseConfig(configService, logger);
 * const postgresConfig = dbConfig.getPostgresConfig();
 * const mongodbConfig = dbConfig.getMongoDBConfig();
 * ```
 * @since 1.0.0
 */
@Injectable()
export class DatabaseConfig {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLoggerService,
  ) {}

  /**
   * @method getPostgresConfig
   * @description 获取PostgreSQL数据库配置
   * @returns {object} PostgreSQL配置对象
   *
   * 配置包含：
   * 1. 数据库连接信息
   * 2. 连接池配置
   * 3. 多租户数据库支持
   * 4. 性能优化配置
   */
  getPostgresConfig() {
    const databaseConfig = this.configService.databaseConfig as any;
    
    return {
      // 主数据库配置
      host: databaseConfig.postgresql?.host ?? 'localhost',
      port: databaseConfig.postgresql?.port ?? 5432,
      database: databaseConfig.postgresql?.database ?? 'aiofix_platform',
      username: databaseConfig.postgresql?.username ?? 'aiofix_user',
      password: databaseConfig.postgresql?.password ?? 'aiofix_password',
      schema: databaseConfig.postgresql?.schema ?? 'public',

      // 连接池配置
      pool: {
        min: databaseConfig.pool?.min ?? 2,
        max: databaseConfig.pool?.max ?? 10,
        acquireTimeoutMillis: databaseConfig.pool?.acquireTimeoutMillis ?? 30000,
        createTimeoutMillis: databaseConfig.pool?.createTimeoutMillis ?? 30000,
        destroyTimeoutMillis: databaseConfig.pool?.destroyTimeoutMillis ?? 5000,
        idleTimeoutMillis: databaseConfig.pool?.idleTimeoutMillis ?? 30000,
        reapIntervalMillis: databaseConfig.pool?.reapIntervalMillis ?? 1000,
        createRetryIntervalMillis: databaseConfig.pool?.createRetryIntervalMillis ?? 200,
      },

      // 多租户数据库配置
      tenantDatabases: {
        'tenant-1': 'aiofix_tenant_1',
        'tenant-2': 'aiofix_tenant_2',
        'tenant-3': 'aiofix_tenant_3',
      },

      // 性能配置
      synchronize: databaseConfig.sync?.synchronize ?? false,
      logging: databaseConfig.logging?.enabled ?? false,
      cache: {
        duration: 30000, // 30秒缓存
      },

      // SSL配置
      ssl: databaseConfig.postgresql?.ssl ?? false,
    };
  }

  /**
   * @method getMongoDBConfig
   * @description 获取MongoDB数据库配置
   * @returns {object} MongoDB配置对象
   *
   * 配置包含：
   * 1. 事件存储数据库配置
   * 2. 通知模块数据库配置
   * 3. 连接池和性能配置
   * 4. 索引和验证配置
   */
  getMongoDBConfig() {
    const databaseConfig = this.configService.databaseConfig as any;
    
    return {
      // 主连接URI
      uri: databaseConfig.mongodb?.uri ?? 'mongodb://aiofix_admin:aiofix_password@localhost:27017/aiofix_events?authSource=admin',

      // 数据库配置
      databases: {
        events: databaseConfig.mongodb?.database ?? 'aiofix_events',
        notifications: 'aiofix_notifications',
      },

      // 连接配置
      options: {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ...databaseConfig.mongodb?.options,
      },

      // 事件存储配置
      eventStore: {
        collection: 'domain_events',
        snapshotCollection: 'aggregate_snapshots',
        maxEventsPerSnapshot: 100,
      },

      // 通知存储配置
      notifications: {
        collection: 'notifications',
        indexes: [
          { keys: { id: 1 }, options: { unique: true } },
          { keys: { type: 1, status: 1 } },
          { keys: { tenantId: 1, userId: 1 } },
          { keys: { createdAt: 1 } },
        ],
      },
    };
  }

  /**
   * @method getTenantDatabaseName
   * @description 获取租户数据库名称
   * @param {string} tenantId 租户ID
   * @returns {string} 租户数据库名称
   */
  getTenantDatabaseName(tenantId: string): string {
    const tenantDatabases = this.getPostgresConfig().tenantDatabases as Record<
      string,
      string
    >;
    return tenantDatabases[tenantId] || `aiofix_tenant_${tenantId}`;
  }

  /**
   * @method getTenantPostgresConfig
   * @description 获取租户PostgreSQL配置
   * @param {string} tenantId 租户ID
   * @returns {object} 租户PostgreSQL配置
   */
  getTenantPostgresConfig(tenantId: string) {
    const baseConfig = this.getPostgresConfig();
    return {
      ...baseConfig,
      database: this.getTenantDatabaseName(tenantId),
    };
  }

  /**
   * @method validateConfig
   * @description 验证数据库配置
   * @returns {boolean} 配置是否有效
   */
  validateConfig(): boolean {
    try {
      const postgresConfig = this.getPostgresConfig();
      const mongodbConfig = this.getMongoDBConfig();

      // 验证PostgreSQL配置
      if (
        !postgresConfig.host ||
        !postgresConfig.database ||
        !postgresConfig.username
      ) {
        this.logger.error('PostgreSQL配置不完整', undefined, {
          host: postgresConfig.host,
          database: postgresConfig.database,
          username: postgresConfig.username,
        });
        return false;
      }

      // 验证MongoDB配置
      if (!mongodbConfig.uri) {
        this.logger.error('MongoDB配置不完整', undefined, {
          uri: mongodbConfig.uri,
        });
        return false;
      }

      this.logger.info('数据库配置验证通过', undefined, {
        postgresql: {
          host: postgresConfig.host,
          port: postgresConfig.port,
          database: postgresConfig.database,
        },
        mongodb: {
          uri: mongodbConfig.uri,
          database: mongodbConfig.databases.events,
        },
      });
      return true;
    } catch (error) {
      this.logger.error('数据库配置验证失败', undefined, {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
