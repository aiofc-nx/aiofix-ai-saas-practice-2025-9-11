/**
 * @file database.module.ts
 * @description 数据库适配器模块
 *
 * 该模块整合了所有数据库相关的服务，包括：
 * - PostgreSQL适配器
 * - 数据库配置管理
 *
 * 遵循DDD和Clean Architecture原则，提供统一的数据库管理功能。
 */

import { DynamicModule, Module } from '@nestjs/common';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@aiofix/config';
import { LoggingModule, PinoLoggerService } from '@aiofix/logging';

// 导入配置
import { DatabaseConfig } from './config/database.config';

// 导入适配器
import { PostgreSQLAdapter } from './adapters/postgresql.adapter';

/**
 * @interface DatabaseModuleOptions
 * @description 数据库模块配置选项
 */
export interface DatabaseModuleOptions {
  /** 是否全局模块 */
  global?: boolean;
  /** 是否启用PostgreSQL */
  postgresql?: boolean;
}

/**
 * @class DatabaseModule
 * @description 数据库适配器模块
 *
 * 提供统一的数据库管理功能，包括：
 * - PostgreSQL数据库支持
 * - 连接池管理
 * - 事件通知
 */
@Module({})
export class DatabaseModule {
  static register(options: DatabaseModuleOptions = {}): DynamicModule {
    const { global = false, postgresql = true } = options;

    const moduleConfig: DynamicModule = {
      module: DatabaseModule,
      imports: [ConfigModule, EventEmitterModule.forRoot(), LoggingModule],
      providers: [
        // 配置提供者
        {
          provide: 'DATABASE_CONFIG',
          useFactory: (
            configService: ConfigService,
            logger: PinoLoggerService,
          ) => {
            return new DatabaseConfig(configService, logger);
          },
          inject: [ConfigService, PinoLoggerService],
        },

        // 数据库名称提供者
        {
          provide: 'DATABASE_NAME',
          useValue: 'postgresql',
        },

        // PostgreSQL适配器
        ...(postgresql
          ? [
              {
                provide: 'POSTGRESQL_ADAPTER',
                useFactory: (
                  config: DatabaseConfig,
                  eventEmitter: EventEmitter2,
                  logger: PinoLoggerService,
                ) => {
                  const postgresConfig = {
                    ...config.getPostgresConfig(),
                    type: 'postgresql' as const,
                  };
                  return new PostgreSQLAdapter(
                    postgresConfig,
                    'postgresql',
                    eventEmitter,
                    logger,
                  );
                },
                inject: ['DATABASE_CONFIG', EventEmitter2, PinoLoggerService],
              },
            ]
          : []),

        // 数据库适配器接口
        {
          provide: 'IDatabaseAdapter',
          useExisting: 'POSTGRESQL_ADAPTER',
        },
      ],
      exports: [
        // 导出接口
        'IDatabaseAdapter',

        // 导出配置
        'DATABASE_CONFIG',

        // 导出具体实现
        ...(postgresql ? ['POSTGRESQL_ADAPTER'] : []),
      ],
    };

    if (global) {
      moduleConfig.global = true;
    }

    return moduleConfig;
  }

  static forRoot(options: DatabaseModuleOptions = {}): DynamicModule {
    return this.register({
      ...options,
      global: true,
    });
  }

  static forFeature(options: DatabaseModuleOptions = {}): DynamicModule {
    return this.register({
      ...options,
      global: false,
    });
  }
}
