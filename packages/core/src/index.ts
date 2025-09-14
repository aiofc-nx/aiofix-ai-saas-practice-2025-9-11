/**
 * Core模块主入口文件
 *
 * @description 导出Core模块的所有公共API，提供统一的导入接口
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

// 值对象
export * from './domain/value-objects';

// 实体
export * from './domain/entities';

// 聚合根
export * from './domain/aggregates';

// 领域事件
export * from './domain/events';

// 应用层（CQRS）
export * from './application';

// 共享类型
export * from './shared/types';

// 异常类
export * from './shared/exceptions';
