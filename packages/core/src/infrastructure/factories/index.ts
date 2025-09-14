/**
 * 基础设施层工厂模块
 *
 * 提供工厂的具体实现，包括基础工厂、聚合工厂等。
 * 所有工厂实现都继承自领域层的工厂接口，提供具体的对象创建实现。
 *
 * @description 基础设施层工厂模块的导出文件
 * @since 1.0.0
 */

// 基础工厂实现
export { BaseFactory } from './base.factory';

// 聚合工厂实现
export { AggregateFactory } from './aggregate.factory';
