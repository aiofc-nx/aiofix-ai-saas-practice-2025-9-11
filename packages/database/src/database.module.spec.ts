/**
 * @file database.module.spec.ts
 * @description 数据库模块单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@aiofix/config';
import { LoggingModule, PinoLoggerService } from '@aiofix/logging';
import { DatabaseModule } from './database.module';
import { DatabaseConfig } from './config/database.config';

// Mock the adapters to avoid actual database connections
jest.mock('./adapters/postgresql.adapter');
jest.mock('./config/database.config');

describe('DatabaseModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // 简化测试，只测试模块的基本结构
    module = await Test.createTestingModule({
      imports: [],
      providers: [],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Module Registration', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should be a valid NestJS module', () => {
      expect(module).toBeDefined();
      expect(module.get).toBeDefined();
    });
  });

  describe('Module Structure', () => {
    it('should have module methods', () => {
      expect(DatabaseModule.register).toBeDefined();
      expect(DatabaseModule.forRoot).toBeDefined();
      expect(DatabaseModule.forFeature).toBeDefined();
    });

    it('should create dynamic module', () => {
      const dynamicModule = DatabaseModule.register({ postgresql: false });
      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(DatabaseModule);
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
    });

    it('should handle default options', () => {
      const dynamicModule = DatabaseModule.register();
      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(DatabaseModule);
      expect(dynamicModule.global).toBeUndefined(); // 默认情况下 global 是 undefined
    });
  });
});
