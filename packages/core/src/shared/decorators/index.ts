/**
 * CQRS装饰器导出
 *
 * 导出所有CQRS相关的装饰器，提供统一的导入接口。
 * 这些装饰器是CQRS模式的核心组件，用于自动注册处理器。
 *
 * @since 1.0.0
 */

// CQRS装饰器
export * from './command-handler.decorator';
export * from './query-handler.decorator';
export * from './event-handler.decorator';

// 租户装饰器
export * from './tenant.decorators';
