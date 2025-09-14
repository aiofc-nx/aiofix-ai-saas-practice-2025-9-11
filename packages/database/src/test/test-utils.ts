/**
 * @file test-utils.ts
 * @description 数据库模块测试工具
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IDatabaseAdapter,
  DatabaseConfig,
} from '../interfaces/database.interface';

/**
 * @interface MockDatabaseAdapter
 * @description 模拟数据库适配器接口
 */
export interface MockDatabaseAdapter extends Partial<IDatabaseAdapter> {
  query: jest.MockedFunction<IDatabaseAdapter['query']>;
  execute: jest.MockedFunction<IDatabaseAdapter['execute']>;
  transaction: jest.MockedFunction<IDatabaseAdapter['transaction']>;
  connect: jest.MockedFunction<IDatabaseAdapter['connect']>;
  disconnect: jest.MockedFunction<IDatabaseAdapter['disconnect']>;
  getHealth: jest.MockedFunction<IDatabaseAdapter['getHealth']>;
  getStats: jest.MockedFunction<IDatabaseAdapter['getStats']>;
  resetStats: jest.MockedFunction<IDatabaseAdapter['resetStats']>;
  getConnection: jest.MockedFunction<IDatabaseAdapter['getConnection']>;
  ping: jest.MockedFunction<IDatabaseAdapter['ping']>;
  setTenantContext: jest.MockedFunction<IDatabaseAdapter['setTenantContext']>;
  getTenantContext: jest.MockedFunction<IDatabaseAdapter['getTenantContext']>;
  setDefaultSchema: jest.MockedFunction<IDatabaseAdapter['setDefaultSchema']>;
  getDefaultSchema: jest.MockedFunction<IDatabaseAdapter['getDefaultSchema']>;
  enableRowLevelSecurity: jest.MockedFunction<
    IDatabaseAdapter['enableRowLevelSecurity']
  >;
  disableRowLevelSecurity: jest.MockedFunction<
    IDatabaseAdapter['disableRowLevelSecurity']
  >;
  isRowLevelSecurityEnabled: jest.MockedFunction<
    IDatabaseAdapter['isRowLevelSecurityEnabled']
  >;
}

/**
 * @function createMockDatabaseAdapter
 * @description 创建模拟数据库适配器
 * @returns {MockDatabaseAdapter} 模拟数据库适配器
 */
export function createMockDatabaseAdapter(): MockDatabaseAdapter {
  return {
    name: 'mock-adapter',
    type: 'postgresql',
    isConnected: true,
    config: {} as DatabaseConfig,
    eventEmitter: {} as EventEmitter2,
    query: jest.fn(),
    execute: jest.fn(),
    transaction: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    getHealth: jest.fn(),
    getStats: jest.fn(),
    resetStats: jest.fn(),
    getConnection: jest.fn(),
    ping: jest.fn(),
    setTenantContext: jest.fn(),
    getTenantContext: jest.fn(),
    setDefaultSchema: jest.fn(),
    getDefaultSchema: jest.fn(),
    enableRowLevelSecurity: jest.fn(),
    disableRowLevelSecurity: jest.fn(),
    isRowLevelSecurityEnabled: jest.fn(),
  };
}

/**
 * @function createMockConfigService
 * @description 创建模拟配置服务
 * @param {Record<string, any>} configs 配置映射
 * @returns {jest.Mocked<ConfigService>} 模拟配置服务
 */
export function createMockConfigService(
  configs: Record<string, any> = {},
): jest.Mocked<ConfigService> {
  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  } as any;

  // 设置默认配置
  const defaultConfigs = {
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_USER: 'aiofix_user',
    POSTGRES_PASSWORD: 'aiofix_password',
    POSTGRES_DB: 'aiofix_platform',
    MONGODB_HOST: 'localhost',
    MONGODB_PORT: '27017',
    MONGODB_USER: 'aiofix_user',
    MONGODB_PASSWORD: 'aiofix_password',
    MONGODB_DB: 'aiofix_events',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: 'aiofix_password',
    DATA_ISOLATION_STRATEGY: 'TABLE_LEVEL',
    PLATFORM_DB_NAME: 'aiofix_platform',
    EVENTS_DB_NAME: 'aiofix_events',
    AI_VECTORS_DB_NAME: 'aiofix_ai_vectors',
    TENANT_DB_PREFIX: 'tenant_',
    TENANT_SCHEMA_PREFIX: 'tenant_',
    SHARED_SCHEMA_NAME: 'shared',
    ENABLE_RLS: 'true',
    TENANT_ID_FIELD: 'tenant_id',
    AUTO_ADD_TENANT_CONDITION: 'true',
    ...configs,
  };

  mockConfigService.get.mockImplementation(
    (key: string) => defaultConfigs[key],
  );

  return mockConfigService;
}

/**
 * @function createTestModule
 * @description 创建测试模块
 * @param {any[]} providers 提供者列表
 * @param {any[]} imports 导入模块列表
 * @returns {Promise<TestingModule>} 测试模块
 */
export async function createTestModule(
  providers: any[] = [],
  imports: any[] = [],
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      ...imports,
    ],
    providers,
  }).compile();
}

/**
 * @function createMockQueryResult
 * @description 创建模拟查询结果
 * @param {any[]} rows 行数据
 * @param {number} rowCount 行数
 * @returns {any} 模拟查询结果
 */
export function createMockQueryResult(
  rows: any[] = [],
  rowCount: number = rows.length,
): any {
  return {
    rows,
    rowCount,
    command: 'SELECT',
    oid: 0,
    fields: [],
  };
}

/**
 * @function createMockEntity
 * @description 创建模拟实体
 * @param {Partial<T>} overrides 覆盖属性
 * @returns {T} 模拟实体
 */
export function createMockEntity<T>(overrides: Partial<T> = {}): T {
  const baseEntity = {
    id: 'test-id',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };

  return baseEntity as T;
}

/**
 * @function createMockTenantContext
 * @description 创建模拟租户上下文
 * @param {string} tenantId 租户ID
 * @returns {any} 模拟租户上下文
 */
export function createMockTenantContext(tenantId: string = 'test-tenant'): any {
  return {
    tenantId,
    userId: 'test-user',
    organizationId: 'test-org',
    departmentId: 'test-dept',
    permissions: ['read', 'write'],
    roles: ['user'],
  };
}

/**
 * @function setupMockEnvironment
 * @description 设置模拟环境变量
 * @param {Record<string, string>} envVars 环境变量
 */
export function setupMockEnvironment(
  envVars: Record<string, string> = {},
): void {
  const defaultEnvVars = {
    NODE_ENV: 'test',
    DATA_ISOLATION_STRATEGY: 'TABLE_LEVEL',
    PLATFORM_DB_NAME: 'aiofix_platform',
    EVENTS_DB_NAME: 'aiofix_events',
    AI_VECTORS_DB_NAME: 'aiofix_ai_vectors',
    ...envVars,
  };

  Object.entries(defaultEnvVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

/**
 * @function cleanupMockEnvironment
 * @description 清理模拟环境变量
 * @param {string[]} keys 要清理的键列表
 */
export function cleanupMockEnvironment(keys: string[] = []): void {
  const defaultKeys = [
    'NODE_ENV',
    'DATA_ISOLATION_STRATEGY',
    'PLATFORM_DB_NAME',
    'EVENTS_DB_NAME',
    'AI_VECTORS_DB_NAME',
    'TENANT_DB_PREFIX',
    'TENANT_SCHEMA_PREFIX',
    'SHARED_SCHEMA_NAME',
    'ENABLE_RLS',
    'TENANT_ID_FIELD',
    'AUTO_ADD_TENANT_CONDITION',
    ...keys,
  ];

  defaultKeys.forEach(key => {
    delete process.env[key];
  });
}

/**
 * @function expectQueryToHaveBeenCalledWith
 * @description 验证查询是否以特定参数被调用
 * @param {jest.MockedFunction} mockQuery 模拟查询函数
 * @param {string} expectedSql 期望的SQL
 * @param {any[]} expectedParams 期望的参数
 */
export function expectQueryToHaveBeenCalledWith(
  mockQuery: jest.MockedFunction<any>,
  expectedSql: string,
  expectedParams: any[] = [],
): void {
  expect(mockQuery).toHaveBeenCalledWith(
    expectedSql,
    expectedParams,
    undefined,
  );
}

/**
 * @function expectExecuteToHaveBeenCalledWith
 * @description 验证执行是否以特定参数被调用
 * @param {jest.MockedFunction} mockExecute 模拟执行函数
 * @param {string} expectedSql 期望的SQL
 * @param {any[]} expectedParams 期望的参数
 */
export function expectExecuteToHaveBeenCalledWith(
  mockExecute: jest.MockedFunction<any>,
  expectedSql: string,
  expectedParams: any[] = [],
): void {
  expect(mockExecute).toHaveBeenCalledWith(
    expectedSql,
    expectedParams,
    undefined,
  );
}
