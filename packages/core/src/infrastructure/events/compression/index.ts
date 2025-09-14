/**
 * 事件压缩和归档模块
 *
 * 提供事件数据的压缩存储和归档功能，支持多种压缩算法
 * 和归档策略，优化事件存储性能和长期数据管理。
 */

// 接口导出
export * from './event-compression.interface';

// 实现类导出
export * from './event-compressor';
export * from './event-archiver';
