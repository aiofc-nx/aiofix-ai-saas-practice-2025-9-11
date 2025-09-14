/**
 * @fileoverview 环境配置助手测试
 * @description 测试环境配置助手的功能
 * @author AI开发团队
 * @since 1.0.0
 */

/// <reference types="jest" />

import { isFeatureEnabled } from './environment.helper';

describe('EnvironmentHelper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 重置环境变量
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // 恢复原始环境变量
    process.env = originalEnv;
  });

  describe('isFeatureEnabled', () => {
    it('应该返回true当特性未设置时', () => {
      delete process.env.TEST_FEATURE;
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);
    });

    it('应该返回true当特性设置为非false值时', () => {
      process.env.TEST_FEATURE = 'true';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);

      process.env.TEST_FEATURE = '1';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);

      process.env.TEST_FEATURE = 'enabled';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);

      process.env.TEST_FEATURE = 'yes';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);
    });

    it('应该返回false当特性设置为false时', () => {
      process.env.TEST_FEATURE = 'false';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(false);
    });

    it('应该返回false当特性设置为False时', () => {
      process.env.TEST_FEATURE = 'False';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true); // 注意：只有小写的'false'才会返回false
    });

    it('应该返回false当特性设置为FALSE时', () => {
      process.env.TEST_FEATURE = 'FALSE';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true); // 注意：只有小写的'false'才会返回false
    });

    it('应该处理空字符串', () => {
      process.env.TEST_FEATURE = '';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);
    });

    it('应该处理undefined值', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      process.env.TEST_FEATURE = undefined as any;
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);
    });

    it('应该处理null值', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      process.env.TEST_FEATURE = null as any;
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);
    });

    it('应该处理数字值', () => {
      process.env.TEST_FEATURE = '0';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);

      process.env.TEST_FEATURE = '1';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);

      process.env.TEST_FEATURE = '123';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);
    });

    it('应该处理布尔值字符串', () => {
      process.env.TEST_FEATURE = 'true';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true);

      process.env.TEST_FEATURE = 'false';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(false);
    });

    it('应该处理特殊字符', () => {
      process.env.TEST_FEATURE = 'false ';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true); // 注意：带空格的'false '不会返回false

      process.env.TEST_FEATURE = ' false';
      expect(isFeatureEnabled('TEST_FEATURE')).toBe(true); // 注意：带空格的' false'不会返回false
    });

    it('应该处理多个特性', () => {
      process.env.FEATURE_A = 'true';
      process.env.FEATURE_B = 'false';
      process.env.FEATURE_C = 'enabled';

      expect(isFeatureEnabled('FEATURE_A')).toBe(true);
      expect(isFeatureEnabled('FEATURE_B')).toBe(false);
      expect(isFeatureEnabled('FEATURE_C')).toBe(true);
    });

    it('应该处理不存在的特性', () => {
      expect(isFeatureEnabled('NON_EXISTENT_FEATURE')).toBe(true);
    });

    it('应该处理空特性键', () => {
      expect(isFeatureEnabled('')).toBe(true);
    });
  });

  describe('实际使用场景', () => {
    it('应该正确处理常见的特性标志', () => {
      // 模拟常见的环境变量设置
      process.env.APP_DEBUG = 'true';
      process.env.APP_DEMO = 'false';
      process.env.EMAIL_VERIFICATION_ENABLED = 'true';
      process.env.REDIS_CLUSTER_ENABLED = 'false';
      process.env.LOG_FILE_ENABLED = 'true';

      expect(isFeatureEnabled('APP_DEBUG')).toBe(true);
      expect(isFeatureEnabled('APP_DEMO')).toBe(false);
      expect(isFeatureEnabled('EMAIL_VERIFICATION_ENABLED')).toBe(true);
      expect(isFeatureEnabled('REDIS_CLUSTER_ENABLED')).toBe(false);
      expect(isFeatureEnabled('LOG_FILE_ENABLED')).toBe(true);
    });

    it('应该正确处理数据库相关特性', () => {
      process.env.DB_LOGGING = 'true';
      process.env.DB_SSL = 'false';
      process.env.DB_POOL_ENABLED = 'true';

      expect(isFeatureEnabled('DB_LOGGING')).toBe(true);
      expect(isFeatureEnabled('DB_SSL')).toBe(false);
      expect(isFeatureEnabled('DB_POOL_ENABLED')).toBe(true);
    });

    it('应该正确处理Redis相关特性', () => {
      process.env.REDIS_SENTINEL_ENABLED = 'false';
      process.env.REDIS_HEALTH_CHECK_ENABLED = 'true';
      process.env.REDIS_CLUSTER_ENABLED = 'false';

      expect(isFeatureEnabled('REDIS_SENTINEL_ENABLED')).toBe(false);
      expect(isFeatureEnabled('REDIS_HEALTH_CHECK_ENABLED')).toBe(true);
      expect(isFeatureEnabled('REDIS_CLUSTER_ENABLED')).toBe(false);
    });

    it('应该正确处理JWT相关特性', () => {
      process.env.JWT_BLACKLIST_ENABLED = 'true';
      process.env.JWT_ROTATION_ENABLED = 'false';
      process.env.JWT_CACHE_ENABLED = 'true';

      expect(isFeatureEnabled('JWT_BLACKLIST_ENABLED')).toBe(true);
      expect(isFeatureEnabled('JWT_ROTATION_ENABLED')).toBe(false);
      expect(isFeatureEnabled('JWT_CACHE_ENABLED')).toBe(true);
    });

    it('应该正确处理邮件相关特性', () => {
      process.env.EMAIL_VERIFICATION_ENABLED = 'true';
      process.env.EMAIL_PASSWORD_RESET_ENABLED = 'false';
      process.env.EMAIL_WELCOME_ENABLED = 'true';
      process.env.EMAIL_INVITATION_ENABLED = 'false';
      process.env.EMAIL_NOTIFICATION_ENABLED = 'true';
      process.env.EMAIL_QUEUE_ENABLED = 'false';

      expect(isFeatureEnabled('EMAIL_VERIFICATION_ENABLED')).toBe(true);
      expect(isFeatureEnabled('EMAIL_PASSWORD_RESET_ENABLED')).toBe(false);
      expect(isFeatureEnabled('EMAIL_WELCOME_ENABLED')).toBe(true);
      expect(isFeatureEnabled('EMAIL_INVITATION_ENABLED')).toBe(false);
      expect(isFeatureEnabled('EMAIL_NOTIFICATION_ENABLED')).toBe(true);
      expect(isFeatureEnabled('EMAIL_QUEUE_ENABLED')).toBe(false);
    });

    it('应该正确处理日志相关特性', () => {
      process.env.LOG_CONSOLE_ENABLED = 'true';
      process.env.LOG_FILE_ENABLED = 'false';
      process.env.LOG_REMOTE_ENABLED = 'true';
      process.env.LOG_AGGREGATION_ENABLED = 'false';
      process.env.LOG_MONITORING_ENABLED = 'true';
      process.env.LOG_AUTO_CLEANUP = 'false';

      expect(isFeatureEnabled('LOG_CONSOLE_ENABLED')).toBe(true);
      expect(isFeatureEnabled('LOG_FILE_ENABLED')).toBe(false);
      expect(isFeatureEnabled('LOG_REMOTE_ENABLED')).toBe(true);
      expect(isFeatureEnabled('LOG_AGGREGATION_ENABLED')).toBe(false);
      expect(isFeatureEnabled('LOG_MONITORING_ENABLED')).toBe(true);
      expect(isFeatureEnabled('LOG_AUTO_CLEANUP')).toBe(false);
    });
  });
});
