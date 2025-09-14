/**
 * @fileoverview 默认配置测试
 * @description 测试默认配置的正确性和完整性
 * @author AI开发团队
 * @since 1.0.0
 */

/// <reference types="jest" />

import { defaultConfiguration } from './default-config';

describe('DefaultConfiguration', () => {
  describe('应用基础配置', () => {
    it('应该包含所有必需的应用配置项', () => {
      expect(defaultConfiguration.app).toBeDefined();
      expect(defaultConfiguration.app?.app_name).toBe('Aiofix IAM');
      expect(defaultConfiguration.app?.app_version).toBe('1.0.0');
      expect(defaultConfiguration.app?.app_description).toContain(
        '多租户SaaS平台',
      );
      expect(defaultConfiguration.app?.environment).toBe(
        process.env.NODE_ENV || 'development',
      );
      expect(defaultConfiguration.app?.debug).toBe(false);
      expect(defaultConfiguration.app?.demo).toBe(false);
      expect(defaultConfiguration.app?.client_base_url).toBe(
        'http://localhost:3000',
      );
      expect(defaultConfiguration.app?.api_base_url).toBe(
        'http://localhost:3000/api/v1',
      );
      expect(defaultConfiguration.app?.docs_url).toBe(
        'http://localhost:3000/api/v1/docs',
      );
    });

    it('应该支持环境变量覆盖', () => {
      const originalEnv = process.env.APP_NAME;
      process.env.APP_NAME = 'Test App';

      // 重新导入以获取更新后的配置
      jest.resetModules();

      const {
        defaultConfiguration: updatedConfig,
      } = require('./default-config');

      expect(updatedConfig.app?.app_name).toBe('Test App');

      // 恢复环境变量
      process.env.APP_NAME = originalEnv;
    });
  });

  describe('数据库配置', () => {
    it('应该包含PostgreSQL配置', () => {
      const postgresql = defaultConfiguration.database?.postgresql;
      expect(postgresql).toBeDefined();
      expect((postgresql as any)?.host).toBe('localhost');
      expect((postgresql as any)?.port).toBe(5432);
      expect((postgresql as any)?.username).toBe('postgres');
      expect((postgresql as any)?.password).toBe('password');
      expect((postgresql as any)?.database).toBe('aiofix_iam');
      expect((postgresql as any)?.schema).toBe('public');
      expect((postgresql as any)?.ssl).toBe(false);
      expect((postgresql as any)?.sslMode).toBe('prefer');
    });

    it('应该包含MongoDB配置', () => {
      const mongodb = defaultConfiguration.database?.mongodb;
      expect(mongodb).toBeDefined();
      expect((mongodb as any)?.uri).toBe(
        'mongodb://localhost:27017/aiofix_iam_events',
      );
      expect((mongodb as any)?.database).toBe('aiofix_iam_events');
      expect((mongodb as any)?.options).toBeDefined();
      expect((mongodb as any)?.options?.useNewUrlParser).toBe(true);
      expect((mongodb as any)?.options?.useUnifiedTopology).toBe(true);
    });

    it('应该包含连接池配置', () => {
      const pool = defaultConfiguration.database?.pool;
      expect(pool).toBeDefined();
      expect((pool as any)?.min).toBe(2);
      expect((pool as any)?.max).toBe(20);
      expect((pool as any)?.acquireTimeoutMillis).toBe(60000);
      expect((pool as any)?.createTimeoutMillis).toBe(30000);
      expect((pool as any)?.destroyTimeoutMillis).toBe(5000);
      expect((pool as any)?.idleTimeoutMillis).toBe(30000);
      expect((pool as any)?.reapIntervalMillis).toBe(1000);
      expect((pool as any)?.createRetryIntervalMillis).toBe(200);
    });

    it('应该包含MikroORM配置', () => {
      const mikroOrm = defaultConfiguration.database?.mikroOrm;
      expect(mikroOrm).toBeDefined();
      expect((mikroOrm as any)?.debug).toBe(false);
      expect((mikroOrm as any)?.logger).toBeUndefined();
      expect((mikroOrm as any)?.migrations).toBeDefined();
      expect((mikroOrm as any)?.migrations?.path).toBe(
        'src/migrations/*.migration{.ts,.js}',
      );
      expect((mikroOrm as any)?.migrations?.tableName).toBe(
        'mikro_orm_migrations',
      );
      expect((mikroOrm as any)?.entities).toEqual(['src/**/*.entity{.ts,.js}']);
    });

    it('应该包含日志配置', () => {
      const logging = defaultConfiguration.database?.logging;
      expect(logging).toBeDefined();
      expect((logging as any)?.enabled).toBe(false);
      expect((logging as any)?.level).toBe('error');
      expect((logging as any)?.slowQueryThreshold).toBe(1000);
    });
  });

  describe('Redis配置', () => {
    it('应该包含连接配置', () => {
      const connection = defaultConfiguration.redis?.connection;
      expect(connection).toBeDefined();
      expect((connection as any)?.host).toBe('localhost');
      expect((connection as any)?.port).toBe(6379);
      expect((connection as any)?.password).toBeUndefined();
      expect((connection as any)?.db).toBe(0);
      expect((connection as any)?.keyPrefix).toBe('aiofix:iam:');
    });

    it('应该包含连接池配置', () => {
      const pool = defaultConfiguration.redis?.pool;
      expect(pool).toBeDefined();
      expect((pool as any)?.min).toBe(2);
      expect((pool as any)?.max).toBe(10);
      expect((pool as any)?.acquireTimeoutMillis).toBe(30000);
      expect((pool as any)?.createTimeoutMillis).toBe(30000);
      expect((pool as any)?.destroyTimeoutMillis).toBe(5000);
      expect((pool as any)?.idleTimeoutMillis).toBe(30000);
      expect((pool as any)?.reapIntervalMillis).toBe(1000);
      expect((pool as any)?.createRetryIntervalMillis).toBe(200);
    });

    it('应该包含缓存配置', () => {
      const cache = defaultConfiguration.redis?.cache;
      expect(cache).toBeDefined();
      expect((cache as any)?.defaultTtl).toBe(3600);
      expect((cache as any)?.sessionTtl).toBe(86400);
      expect((cache as any)?.permissionTtl).toBe(1800);
      expect((cache as any)?.tenantConfigTtl).toBe(3600);
      expect((cache as any)?.maxMemory).toBe('2gb');
      expect((cache as any)?.maxMemoryPolicy).toBe('allkeys-lru');
    });

    it('应该包含分布式锁配置', () => {
      const lock = defaultConfiguration.redis?.lock;
      expect(lock).toBeDefined();
      expect((lock as any)?.defaultTimeout).toBe(30000);
      expect((lock as any)?.retryDelay).toBe(100);
      expect((lock as any)?.retryCount).toBe(10);
    });

    it('应该包含集群配置', () => {
      const cluster = defaultConfiguration.redis?.cluster;
      expect(cluster).toBeDefined();
      expect((cluster as any)?.enabled).toBe(false);
      expect((cluster as any)?.nodes).toEqual([]);
      expect((cluster as any)?.maxRedirections).toBe(16);
    });

    it('应该包含哨兵配置', () => {
      const sentinel = defaultConfiguration.redis?.sentinel;
      expect(sentinel).toBeDefined();
      expect((sentinel as any)?.enabled).toBe(false);
      expect((sentinel as any)?.masterName).toBe('mymaster');
      expect((sentinel as any)?.sentinels).toEqual([]);
      expect((sentinel as any)?.password).toBeUndefined();
    });

    it('应该包含健康检查配置', () => {
      const health = defaultConfiguration.redis?.health;
      expect(health).toBeDefined();
      expect((health as any)?.enabled).toBe(true);
      expect((health as any)?.interval).toBe(30000);
      expect((health as any)?.timeout).toBe(5000);
    });
  });

  describe('JWT配置', () => {
    it('应该包含密钥配置', () => {
      const secret = defaultConfiguration.jwt?.secret;
      expect(secret).toBeDefined();
      expect((secret as any)?.accessToken).toContain('access-token-key');
      expect((secret as any)?.refreshToken).toContain('refresh-token-key');
      expect((secret as any)?.resetPassword).toContain('reset-password-key');
      expect((secret as any)?.emailVerification).toContain(
        'email-verification-key',
      );
    });

    it('应该包含访问令牌配置', () => {
      const accessToken = defaultConfiguration.jwt?.accessToken;
      expect(accessToken).toBeDefined();
      expect((accessToken as any)?.expiresIn).toBe(3600);
      expect((accessToken as any)?.algorithm).toBe('HS256');
      expect((accessToken as any)?.issuer).toBe('aiofix-iam');
      expect((accessToken as any)?.audience).toBe('aiofix-users');
    });

    it('应该包含刷新令牌配置', () => {
      const refreshToken = defaultConfiguration.jwt?.refreshToken;
      expect(refreshToken).toBeDefined();
      expect((refreshToken as any)?.expiresIn).toBe(2592000);
      expect((refreshToken as any)?.algorithm).toBe('HS256');
      expect((refreshToken as any)?.issuer).toBe('aiofix-iam');
      expect((refreshToken as any)?.audience).toBe('aiofix-users');
    });

    it('应该包含多租户配置', () => {
      const multiTenant = defaultConfiguration.jwt?.multiTenant;
      expect(multiTenant).toBeDefined();
      expect((multiTenant as any)?.enabled).toBe(true);
      expect((multiTenant as any)?.tenantIdField).toBe('tenantId');
      expect((multiTenant as any)?.organizationIdField).toBe('organizationId');
      expect((multiTenant as any)?.departmentIdField).toBe('departmentId');
    });

    it('应该包含安全配置', () => {
      const security = defaultConfiguration.jwt?.security;
      expect(security).toBeDefined();
      expect((security as any)?.blacklistEnabled).toBe(true);
      expect((security as any)?.blacklistTtl).toBe(86400);
      expect((security as any)?.rotationEnabled).toBe(true);
      expect((security as any)?.rotationThreshold).toBe(300);
    });

    it('应该包含缓存配置', () => {
      const cache = defaultConfiguration.jwt?.cache;
      expect(cache).toBeDefined();
      expect((cache as any)?.enabled).toBe(true);
      expect((cache as any)?.ttl).toBe(300);
      expect((cache as any)?.prefix).toBe('jwt:');
    });
  });

  describe('邮件配置', () => {
    it('应该包含SMTP配置', () => {
      const smtp = defaultConfiguration.email?.smtp;
      expect(smtp).toBeDefined();
      expect((smtp as any)?.host).toBe('localhost');
      expect((smtp as any)?.port).toBe(587);
      expect((smtp as any)?.secure).toBe(false);
      expect((smtp as any)?.auth).toBeDefined();
      expect((smtp as any)?.auth?.user).toBe('');
      expect((smtp as any)?.auth?.pass).toBe('');
      expect((smtp as any)?.tls).toBeDefined();
      expect((smtp as any)?.tls?.rejectUnauthorized).toBe(true);
    });

    it('应该包含发送配置', () => {
      const sending = defaultConfiguration.email?.sending;
      expect(sending).toBeDefined();
      expect((sending as any)?.fromEmail).toBe('noreply@aiofix.com');
      expect((sending as any)?.fromName).toBe('Aiofix IAM');
      expect((sending as any)?.replyTo).toBe('support@aiofix.com');
      expect((sending as any)?.batchInterval).toBe(1000);
      expect((sending as any)?.batchSize).toBe(10);
      expect((sending as any)?.retryCount).toBe(3);
      expect((sending as any)?.retryDelay).toBe(5000);
    });

    it('应该包含模板配置', () => {
      const templates = defaultConfiguration.email?.templates;
      expect(templates).toBeDefined();
      expect((templates as any)?.directory).toBe('src/templates/email');
      expect((templates as any)?.defaultLanguage).toBe('zh-CN');
      expect((templates as any)?.supportedLanguages).toEqual([
        'zh-CN',
        'en-US',
      ]);
    });

    it('应该包含邮件类型配置', () => {
      const types = defaultConfiguration.email?.types;
      expect(types).toBeDefined();
      expect((types as any)?.emailVerification).toBeDefined();
      expect((types as any)?.passwordReset).toBeDefined();
      expect((types as any)?.welcome).toBeDefined();
      expect((types as any)?.invitation).toBeDefined();
      expect((types as any)?.notification).toBeDefined();
    });

    it('应该包含验证配置', () => {
      const verification = defaultConfiguration.email?.verification;
      expect(verification).toBeDefined();
      expect((verification as any)?.enabled).toBe(true);
      expect((verification as any)?.linkExpiresIn).toBe(86400);
      expect((verification as any)?.codeExpiresIn).toBe(1800);
      expect((verification as any)?.codeLength).toBe(6);
    });

    it('应该包含队列配置', () => {
      const queue = defaultConfiguration.email?.queue;
      expect(queue).toBeDefined();
      expect((queue as any)?.enabled).toBe(true);
      expect((queue as any)?.name).toBe('email');
      expect((queue as any)?.priority).toBe(10);
      expect((queue as any)?.delay).toBe(0);
    });
  });

  describe('日志配置', () => {
    it('应该包含日志级别配置', () => {
      const level = defaultConfiguration.logging?.level;
      expect(level).toBeDefined();
      expect((level as any)?.default).toBe(process.env.LOG_LEVEL || 'info');
      expect((level as any)?.app).toBe('info');
      expect((level as any)?.database).toBe('warn');
      expect((level as any)?.http).toBe('info');
      expect((level as any)?.security).toBe('warn');
      expect((level as any)?.performance).toBe('info');
    });

    it('应该包含格式配置', () => {
      const format = defaultConfiguration.logging?.format;
      expect(format).toBeDefined();
      expect((format as any)?.type).toBe('json');
      expect((format as any)?.timestamp).toBe(true);
      expect((format as any)?.colorize).toBe(false);
      expect((format as any)?.requestId).toBe(true);
      expect((format as any)?.tenantId).toBe(true);
      expect((format as any)?.userId).toBe(true);
      expect((format as any)?.performance).toBe(true);
      expect((format as any)?.stackTrace).toBe(true);
    });

    it('应该包含输出配置', () => {
      const output = defaultConfiguration.logging?.output;
      expect(output).toBeDefined();
      expect((output as any)?.console).toBeDefined();
      expect((output as any)?.console?.enabled).toBe(true);
      expect((output as any)?.console?.level).toBe('info');
      expect((output as any)?.file).toBeDefined();
      expect((output as any)?.file?.enabled).toBe(false);
      expect((output as any)?.file?.level).toBe('info');
      expect((output as any)?.file?.path).toBe('logs/app.log');
      expect((output as any)?.file?.maxSize).toBe('10m');
      expect((output as any)?.file?.maxFiles).toBe(5);
      expect((output as any)?.file?.interval).toBe('1d');
    });

    it('应该包含过滤配置', () => {
      const filter = defaultConfiguration.logging?.filter;
      expect(filter).toBeDefined();
      expect((filter as any)?.sensitiveFields).toContain('password');
      expect((filter as any)?.sensitiveFields).toContain('token');
      expect((filter as any)?.sensitiveFields).toContain('secret');
      expect((filter as any)?.sensitiveFields).toContain('apiKey');
      expect((filter as any)?.sensitiveFields).toContain('authorization');
      expect((filter as any)?.ignorePaths).toContain('/health');
      expect((filter as any)?.ignorePaths).toContain('/metrics');
      expect((filter as any)?.ignorePaths).toContain('/favicon.ico');
    });

    it('应该包含监控配置', () => {
      const monitoring = defaultConfiguration.logging?.monitoring;
      expect(monitoring).toBeDefined();
      expect((monitoring as any)?.enabled).toBe(true);
      expect((monitoring as any)?.interval).toBe(30000);
      expect((monitoring as any)?.errorRateThreshold).toBe(0.1);
      expect((monitoring as any)?.responseTimeThreshold).toBe(1000);
    });

    it('应该包含保留配置', () => {
      const retention = defaultConfiguration.logging?.retention;
      expect(retention).toBeDefined();
      expect((retention as any)?.days).toBe(30);
      expect((retention as any)?.autoCleanup).toBe(true);
      expect((retention as any)?.cleanupInterval).toBe(24);
    });
  });

  describe('配置完整性', () => {
    it('应该包含所有必需的配置模块', () => {
      expect(defaultConfiguration.app).toBeDefined();
      expect(defaultConfiguration.database).toBeDefined();
      expect(defaultConfiguration.redis).toBeDefined();
      expect(defaultConfiguration.jwt).toBeDefined();
      expect(defaultConfiguration.email).toBeDefined();
      expect(defaultConfiguration.logging).toBeDefined();
      expect(defaultConfiguration.setting).toBeDefined();
      expect(defaultConfiguration.keycloak).toBeDefined();
    });

    it('应该包含有效的默认值', () => {
      // 检查关键配置项不为空
      expect(defaultConfiguration.app?.app_name).toBeTruthy();
      expect(defaultConfiguration.database?.type).toBeTruthy();
      expect(
        (defaultConfiguration.redis?.connection as any)?.host,
      ).toBeTruthy();
      expect(
        (defaultConfiguration.jwt?.secret as any)?.accessToken,
      ).toBeTruthy();
      expect(
        (defaultConfiguration.email?.sending as any)?.fromEmail,
      ).toBeTruthy();
      expect(
        (defaultConfiguration.logging?.level as any)?.default,
      ).toBeTruthy();
    });

    it('应该符合安全最佳实践', () => {
      // 检查默认密钥不是生产环境密钥
      expect((defaultConfiguration.jwt?.secret as any)?.accessToken).toContain(
        'your-super-secret',
      );
      expect((defaultConfiguration.jwt?.secret as any)?.refreshToken).toContain(
        'your-super-secret',
      );

      // 检查SSL配置
      expect((defaultConfiguration.database?.postgresql as any)?.ssl).toBe(
        false,
      );
      expect((defaultConfiguration.email?.smtp as any)?.secure).toBe(false);
    });
  });
});
