// Jest测试环境设置
require('reflect-metadata');

// 设置测试超时时间
jest.setTimeout(10000);

// 全局测试工具函数
global.testUtils = {
  // 生成测试用的UUID
  generateTestId: () => 'test-id-' + Math.random().toString(36).substr(2, 9),

  // 生成测试用的租户ID
  generateTestTenantId: () =>
    'test-tenant-' + Math.random().toString(36).substr(2, 9),

  // 生成测试用的用户ID
  generateTestUserId: () =>
    'test-user-' + Math.random().toString(36).substr(2, 9),

  // 生成测试用的组织ID
  generateTestOrganizationId: () =>
    'test-org-' + Math.random().toString(36).substr(2, 9),
};

// 模拟控制台方法，避免测试输出干扰
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
