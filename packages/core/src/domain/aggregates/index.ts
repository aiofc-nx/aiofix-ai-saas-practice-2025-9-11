/**
 * 聚合根导出文件
 *
 * @description 导出所有聚合根类，提供统一的导入接口
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

export { BaseAggregateRoot } from './base.aggregate-root';
export type { DomainEvent } from './base.aggregate-root';
export { TenantAwareAggregateRoot } from './tenant-aware.aggregate-root';
