/**
 * 事件基础设施导出文件
 *
 * @description 导出所有事件相关的基础设施组件，包括事件总线、事件存储、
 * 版本管理、压缩归档和重放优化等企业级功能。
 *
 * @since 1.0.0
 */

// 核心事件组件
export { EventBus } from './event-bus';
export { InMemoryEventStore } from './event-store';
export type { IEventStore } from './event-store';

// 事件投射器
export * from './projectors';

// 事件版本管理
export * from './versioning';

// 事件压缩和归档
export * from './compression';

// 事件重放优化
export * from './replay';
