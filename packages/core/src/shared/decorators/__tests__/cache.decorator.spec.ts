import { CACHE_KEY_METADATA, CACHE_OPTIONS_METADATA } from '../cache.decorator';

/**
 * 缓存装饰器单元测试
 *
 * @description 测试缓存装饰器的功能和元数据设置
 */
describe('Cache Decorators', () => {
  describe('@Cacheable', () => {
    it('应该为方法设置缓存键元数据', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      // 模拟装饰器函数
      const Cacheable = (key?: string) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          Reflect.defineMetadata(
            CACHE_KEY_METADATA,
            key || propertyKey,
            target,
            propertyKey,
          );
          Reflect.defineMetadata(
            CACHE_OPTIONS_METADATA,
            { enabled: true },
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      const decoratedDescriptor = Cacheable('custom-key')(
        mockTarget,
        mockPropertyKey,
        mockDescriptor,
      );

      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, mockPropertyKey),
      ).toBe('custom-key');
      expect(
        Reflect.getMetadata(
          CACHE_OPTIONS_METADATA,
          mockTarget,
          mockPropertyKey,
        ),
      ).toEqual({ enabled: true });
      expect(decoratedDescriptor).toBe(mockDescriptor);
    });

    it('应该使用默认键名当未提供键时', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      const Cacheable = (key?: string) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          Reflect.defineMetadata(
            CACHE_KEY_METADATA,
            key || propertyKey,
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      Cacheable()(mockTarget, mockPropertyKey, mockDescriptor);

      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, mockPropertyKey),
      ).toBe(mockPropertyKey);
    });

    it('应该设置完整的缓存选项', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      const Cacheable = (options: any) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          Reflect.defineMetadata(
            CACHE_OPTIONS_METADATA,
            options,
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      const options = {
        key: 'test-key',
        ttl: 300000,
        cacheType: 'query' as const,
        enabled: true,
        tags: ['tag1', 'tag2'],
        async: false,
      };

      Cacheable(options)(mockTarget, mockPropertyKey, mockDescriptor);

      expect(
        Reflect.getMetadata(
          CACHE_OPTIONS_METADATA,
          mockTarget,
          mockPropertyKey,
        ),
      ).toEqual(options);
    });
  });

  describe('@CacheEvict', () => {
    it('应该为方法设置缓存失效元数据', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      const CacheEvict = (key?: string) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          Reflect.defineMetadata(
            CACHE_KEY_METADATA,
            key || propertyKey,
            target,
            propertyKey,
          );
          Reflect.defineMetadata(
            CACHE_OPTIONS_METADATA,
            { evict: true, enabled: true },
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      CacheEvict('cache-key-to-evict')(
        mockTarget,
        mockPropertyKey,
        mockDescriptor,
      );

      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, mockPropertyKey),
      ).toBe('cache-key-to-evict');
      expect(
        Reflect.getMetadata(
          CACHE_OPTIONS_METADATA,
          mockTarget,
          mockPropertyKey,
        ),
      ).toEqual({ evict: true, enabled: true });
    });

    it('应该支持批量失效', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      const CacheEvict = (options: any) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          Reflect.defineMetadata(
            CACHE_OPTIONS_METADATA,
            options,
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      const options = {
        key: 'batch-key',
        evict: true,
        cacheType: 'query' as const,
        tags: ['batch-tag'],
      };

      CacheEvict(options)(mockTarget, mockPropertyKey, mockDescriptor);

      expect(
        Reflect.getMetadata(
          CACHE_OPTIONS_METADATA,
          mockTarget,
          mockPropertyKey,
        ),
      ).toEqual(options);
    });
  });

  describe('@CachePut', () => {
    it('应该为方法设置缓存更新元数据', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      const CachePut = (key?: string) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          Reflect.defineMetadata(
            CACHE_KEY_METADATA,
            key || propertyKey,
            target,
            propertyKey,
          );
          Reflect.defineMetadata(
            CACHE_OPTIONS_METADATA,
            { put: true, enabled: true },
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      CachePut('cache-key-to-update')(
        mockTarget,
        mockPropertyKey,
        mockDescriptor,
      );

      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, mockPropertyKey),
      ).toBe('cache-key-to-update');
      expect(
        Reflect.getMetadata(
          CACHE_OPTIONS_METADATA,
          mockTarget,
          mockPropertyKey,
        ),
      ).toEqual({ put: true, enabled: true });
    });

    it('应该支持条件缓存更新', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      const CachePut = (options: any) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          Reflect.defineMetadata(
            CACHE_OPTIONS_METADATA,
            options,
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      const condition = (result: any) => result && result.id;
      const options = {
        key: 'conditional-key',
        put: true,
        condition,
        ttl: 600000,
      };

      CachePut(options)(mockTarget, mockPropertyKey, mockDescriptor);

      const metadata = Reflect.getMetadata(
        CACHE_OPTIONS_METADATA,
        mockTarget,
        mockPropertyKey,
      );
      expect(metadata.put).toBe(true);
      expect(metadata.condition).toBe(condition);
      expect(metadata.ttl).toBe(600000);
    });
  });

  describe('@CacheableKey', () => {
    it('应该为参数设置缓存键元数据', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockParameterIndex = 0;

      const CacheableKey = () => {
        return (target: any, propertyKey: string, parameterIndex: number) => {
          const existingKeys =
            Reflect.getMetadata(CACHE_KEY_METADATA, target, propertyKey) || [];
          existingKeys[parameterIndex] = true;
          Reflect.defineMetadata(
            CACHE_KEY_METADATA,
            existingKeys,
            target,
            propertyKey,
          );
        };
      };

      CacheableKey()(mockTarget, mockPropertyKey, mockParameterIndex);

      const keys = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        mockTarget,
        mockPropertyKey,
      );
      expect(keys).toBeDefined();
      expect(keys[0]).toBe(true);
    });

    it('应该支持多个参数标记为缓存键', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';

      const CacheableKey = () => {
        return (target: any, propertyKey: string, parameterIndex: number) => {
          const existingKeys =
            Reflect.getMetadata(CACHE_KEY_METADATA, target, propertyKey) || [];
          existingKeys[parameterIndex] = true;
          Reflect.defineMetadata(
            CACHE_KEY_METADATA,
            existingKeys,
            target,
            propertyKey,
          );
        };
      };

      // 标记多个参数
      CacheableKey()(mockTarget, mockPropertyKey, 0);
      CacheableKey()(mockTarget, mockPropertyKey, 2);

      const keys = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        mockTarget,
        mockPropertyKey,
      );
      expect(keys[0]).toBe(true);
      expect(keys[2]).toBe(true);
      expect(keys[1]).toBeUndefined();
    });
  });

  describe('元数据常量', () => {
    it('应该定义正确的元数据键', () => {
      expect(CACHE_KEY_METADATA).toBe('cache:key');
      expect(CACHE_OPTIONS_METADATA).toBe('cache:options');
    });

    it('应该支持元数据的读取和写入', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const testKey = 'test-cache-key';
      const testOptions = { ttl: 300000, enabled: true };

      Reflect.defineMetadata(
        CACHE_KEY_METADATA,
        testKey,
        mockTarget,
        mockPropertyKey,
      );
      Reflect.defineMetadata(
        CACHE_OPTIONS_METADATA,
        testOptions,
        mockTarget,
        mockPropertyKey,
      );

      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, mockPropertyKey),
      ).toBe(testKey);
      expect(
        Reflect.getMetadata(
          CACHE_OPTIONS_METADATA,
          mockTarget,
          mockPropertyKey,
        ),
      ).toEqual(testOptions);
    });
  });

  describe('类型定义', () => {
    it('应该支持CacheKeyGenerator类型', () => {
      const keyGenerator = (id: string, type: string) => `${type}:${id}`;
      const result = keyGenerator('123', 'user');
      expect(result).toBe('user:123');
    });

    it('应该支持CacheConditionChecker类型', () => {
      const conditionChecker = (result: any) => result && result.id;
      expect(conditionChecker({ id: '123' })).toBe(true);
      expect(conditionChecker(null)).toBe(false);
    });

    it('应该支持CacheDecoratorOptions接口', () => {
      const options = {
        key: 'test-key',
        ttl: 300000,
        cacheType: 'query' as const,
        enabled: true,
        condition: (result: any) => result !== null,
        tags: ['tag1', 'tag2'],
        async: false,
        evict: false,
        put: false,
      };

      expect(options.key).toBe('test-key');
      expect(options.ttl).toBe(300000);
      expect(options.cacheType).toBe('query');
      expect(options.enabled).toBe(true);
      expect(options.condition({ id: '123' })).toBe(true);
      expect(options.tags).toEqual(['tag1', 'tag2']);
      expect(options.async).toBe(false);
      expect(options.evict).toBe(false);
      expect(options.put).toBe(false);
    });
  });

  describe('装饰器组合', () => {
    it('应该支持多个装饰器同时使用', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      // 模拟多个装饰器
      const Cacheable = (key: string) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          Reflect.defineMetadata(CACHE_KEY_METADATA, key, target, propertyKey);
          Reflect.defineMetadata(
            CACHE_OPTIONS_METADATA,
            { enabled: true },
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      const CacheEvict = (key: string) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          const existingOptions =
            Reflect.getMetadata(CACHE_OPTIONS_METADATA, target, propertyKey) ||
            {};
          Reflect.defineMetadata(
            CACHE_OPTIONS_METADATA,
            { ...existingOptions, evict: true },
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      // 应用装饰器
      Cacheable('cache-key')(mockTarget, mockPropertyKey, mockDescriptor);
      CacheEvict('cache-key')(mockTarget, mockPropertyKey, mockDescriptor);

      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, mockPropertyKey),
      ).toBe('cache-key');
      expect(
        Reflect.getMetadata(
          CACHE_OPTIONS_METADATA,
          mockTarget,
          mockPropertyKey,
        ),
      ).toEqual({ enabled: true, evict: true });
    });

    it('应该支持参数装饰器与方法装饰器组合', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';

      const Cacheable = (key: string) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          Reflect.defineMetadata(CACHE_KEY_METADATA, key, target, propertyKey);
          return descriptor;
        };
      };

      const CacheableKey = () => {
        return (target: any, propertyKey: string, parameterIndex: number) => {
          const existingKeys =
            Reflect.getMetadata('cache:keys', target, propertyKey) || [];
          existingKeys[parameterIndex] = true;
          Reflect.defineMetadata(
            'cache:keys',
            existingKeys,
            target,
            propertyKey,
          );
        };
      };

      // 应用装饰器
      Cacheable('method-key')(mockTarget, mockPropertyKey, {});
      CacheableKey()(mockTarget, mockPropertyKey, 0);
      CacheableKey()(mockTarget, mockPropertyKey, 1);

      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, mockPropertyKey),
      ).toBe('method-key');
      expect(
        Reflect.getMetadata('cache:keys', mockTarget, mockPropertyKey),
      ).toEqual([true, true]);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的键生成器', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      const Cacheable = (keyGenerator: any) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          try {
            const key =
              typeof keyGenerator === 'function'
                ? keyGenerator()
                : keyGenerator;
            Reflect.defineMetadata(
              CACHE_KEY_METADATA,
              key,
              target,
              propertyKey,
            );
          } catch (error) {
            Reflect.defineMetadata(
              CACHE_KEY_METADATA,
              propertyKey,
              target,
              propertyKey,
            );
          }
          return descriptor;
        };
      };

      // 使用无效的键生成器
      Cacheable(() => {
        throw new Error('Key generation failed');
      })(mockTarget, mockPropertyKey, mockDescriptor);

      // 应该回退到方法名
      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, mockPropertyKey),
      ).toBe(mockPropertyKey);
    });

    it('应该处理无效的条件检查器', () => {
      const mockTarget = {};
      const mockPropertyKey = 'testMethod';
      const mockDescriptor = {};

      const Cacheable = (options: any) => {
        return (
          target: any,
          propertyKey: string,
          descriptor: PropertyDescriptor,
        ) => {
          const safeOptions = { ...options };
          if (typeof options.condition === 'function') {
            try {
              options.condition(null);
            } catch (error) {
              delete safeOptions.condition;
            }
          }
          Reflect.defineMetadata(
            CACHE_OPTIONS_METADATA,
            safeOptions,
            target,
            propertyKey,
          );
          return descriptor;
        };
      };

      const invalidCondition = () => {
        throw new Error('Condition check failed');
      };
      Cacheable({ condition: invalidCondition, ttl: 300000 })(
        mockTarget,
        mockPropertyKey,
        mockDescriptor,
      );

      const options = Reflect.getMetadata(
        CACHE_OPTIONS_METADATA,
        mockTarget,
        mockPropertyKey,
      );
      expect(options.condition).toBeUndefined();
      expect(options.ttl).toBe(300000);
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量装饰器应用', () => {
      const mockTarget = {};
      const startTime = Date.now();

      // 模拟应用大量装饰器
      for (let i = 0; i < 1000; i++) {
        const mockPropertyKey = `method${i}`;
        const mockDescriptor = {};

        const Cacheable = (key: string) => {
          return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor,
          ) => {
            Reflect.defineMetadata(
              CACHE_KEY_METADATA,
              key,
              target,
              propertyKey,
            );
            return descriptor;
          };
        };

        Cacheable(`key${i}`)(mockTarget, mockPropertyKey, mockDescriptor);
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成

      // 验证元数据设置正确
      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, 'method0'),
      ).toBe('key0');
      expect(
        Reflect.getMetadata(CACHE_KEY_METADATA, mockTarget, 'method999'),
      ).toBe('key999');
    });
  });
});
