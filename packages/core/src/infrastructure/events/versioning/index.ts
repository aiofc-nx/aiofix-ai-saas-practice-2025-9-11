/**
 * 事件版本管理模块
 *
 * 提供事件版本管理、兼容性检查和数据迁移功能。
 * 支持语义化版本控制和自动迁移机制。
 */

// 接口导出
export * from './event-version.interface';

// 实现类导出
export * from './event-version-manager';
export * from './event-version-migrator';
