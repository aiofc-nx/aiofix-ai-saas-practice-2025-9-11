/**
 * @fileoverview 配置加载器测试
 * @description 测试配置加载器的核心功能，包括配置合并、获取、重置等操作
 * @author AI开发团队
 * @since 1.0.0
 */

/// <reference types="jest" />

import { defineConfig, getConfig, resetConfig } from './config-loader';
import { IamConfig } from './config.service';

describe('ConfigLoader', () => {
  beforeEach(() => {
    // 每个测试前重置配置
    resetConfig();
  });

  describe('getConfig', () => {
    it('应该返回默认配置', () => {
      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.app).toBeDefined();
      expect(config.database).toBeDefined();
      expect(config.redis).toBeDefined();
      expect(config.jwt).toBeDefined();
      expect(config.email).toBeDefined();
      expect(config.logging).toBeDefined();
    });

    it('应该返回只读配置对象', () => {
      const config = getConfig();

      expect(() => {
        (config as any).app = {};
      }).toThrow();
    });

    it('应该返回配置的深拷贝', () => {
      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).not.toBe(config2);
      expect(config1.app).not.toBe(config2.app);
    });
  });

  describe('defineConfig', () => {
    it('应该成功合并有效配置', async () => {
      const customConfig: Partial<IamConfig> = {
        app: {
          app_name: 'Test App',
          custom_setting: 'test_value',
        },
      };

      await defineConfig(customConfig);

      const config = getConfig();
      expect(config.app?.app_name).toBe('Test App');
      expect(config.app?.custom_setting).toBe('test_value');
    });

    it('应该深度合并嵌套配置', async () => {
      const customConfig: Partial<IamConfig> = {
        database: {
          postgresql: {
            host: 'custom-host',
            port: 5433,
          },
        },
      };

      await defineConfig(customConfig);

      const config = getConfig();
      expect((config.database?.postgresql as any)?.host).toBe('custom-host');
      expect((config.database?.postgresql as any)?.port).toBe(5433);
      // 其他默认配置应该保持不变
      expect((config.database?.postgresql as any)?.username).toBeDefined();
    });

    it('应该覆盖数组配置', async () => {
      const customConfig: Partial<IamConfig> = {
        redis: {
          cluster: {
            nodes: ['node1:6379', 'node2:6379'],
          },
        },
      };

      await defineConfig(customConfig);

      const config = getConfig();
      expect((config.redis?.cluster as any)?.nodes).toEqual([
        'node1:6379',
        'node2:6379',
      ]);
    });

    it('应该抛出错误当配置无效时', async () => {
      await expect(defineConfig(null as any)).rejects.toThrow(
        'Invalid configuration provided. Expected a non-empty object.',
      );

      await expect(defineConfig(undefined as any)).rejects.toThrow(
        'Invalid configuration provided. Expected a non-empty object.',
      );

      await expect(defineConfig('invalid' as any)).rejects.toThrow(
        'Invalid configuration provided. Expected a non-empty object.',
      );
    });

    it('应该支持多次配置合并', async () => {
      const config1: Partial<IamConfig> = {
        app: {
          app_name: 'First App',
        },
      };

      const config2: Partial<IamConfig> = {
        app: {
          app_version: '2.0.0',
        },
      };

      await defineConfig(config1);
      await defineConfig(config2);

      const config = getConfig();
      expect(config.app?.app_name).toBe('First App');
      expect(config.app?.app_version).toBe('2.0.0');
    });
  });

  describe('resetConfig', () => {
    it('应该重置配置到默认值', async () => {
      // 先设置自定义配置
      const customConfig: Partial<IamConfig> = {
        app: {
          app_name: 'Custom App',
        },
      };

      await defineConfig(customConfig);
      expect(getConfig().app?.app_name).toBe('Custom App');

      // 重置配置
      resetConfig();

      // 验证配置已重置
      const config = getConfig();
      expect(config.app?.app_name).toBe('Aiofix IAM');
    });

    it('应该清空所有自定义配置', async () => {
      // 设置多个自定义配置
      await defineConfig({
        app: { custom1: 'value1' },
        database: { custom2: 'value2' },
      });

      resetConfig();

      const config = getConfig();
      expect(config.app?.custom1).toBeUndefined();
      expect(config.database?.custom2).toBeUndefined();
    });
  });

  describe('配置合并逻辑', () => {
    it('应该正确处理复杂嵌套对象', async () => {
      const customConfig: Partial<IamConfig> = {
        jwt: {
          secret: {
            accessToken: 'custom-access-secret',
          },
          accessToken: {
            expiresIn: 7200,
          },
        },
      };

      await defineConfig(customConfig);

      const config = getConfig();
      expect((config.jwt?.secret as any)?.accessToken).toBe(
        'custom-access-secret',
      );
      expect((config.jwt?.accessToken as any)?.expiresIn).toBe(7200);
      // 其他JWT配置应该保持默认值
      expect((config.jwt?.secret as any)?.refreshToken).toBeDefined();
      expect((config.jwt?.refreshToken as any)?.expiresIn).toBeDefined();
    });

    it('应该正确处理空值和undefined', async () => {
      const customConfig: Partial<IamConfig> = {
        app: {
          nullValue: null,
          undefinedValue: undefined,
          emptyString: '',
          zeroValue: 0,
        },
      };

      await defineConfig(customConfig);

      const config = getConfig();
      expect(config.app?.nullValue).toBeNull();
      expect(config.app?.undefinedValue).toBeUndefined();
      expect(config.app?.emptyString).toBe('');
      expect(config.app?.zeroValue).toBe(0);
    });
  });
});
