/**
 * CQRS基础设施导出
 *
 * 导出所有CQRS相关的核心组件，提供统一的导入接口。
 * 这些组件是CQRS模式的核心基础设施实现。
 *
 * @since 1.0.0
 */

// CQRS核心组件 - 重新导出具体实现
export { CommandBus } from '../commands/command-bus';
export { QueryBus } from '../queries/query-bus';
export { EventBus } from '../events/event-bus';
export { InMemoryEventStore } from '../events/event-store';
export type { IEventStore } from '../events/event-store';

// 重新导出应用层接口，保持向后兼容
export * from '../../application/commands';
export * from '../../application/queries';
export * from '../../application/events';
