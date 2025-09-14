/**
 * 基础设施层导出文件
 *
 * @description 导出所有基础设施层组件，提供统一的导入接口
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

// 事件总线
export { EventBus } from './events/event-bus';

// 命令总线
export { CommandBus } from './commands/command-bus';

// 查询总线
export { QueryBus } from './queries/query-bus';

// 事件存储
export { InMemoryEventStore } from './events/event-store';
export type { IEventStore } from './events/event-store';

// 仓储实现
export * from './repositories';

// 工厂实现
export * from './factories';
