/**
 * 基础设施层仓储模块
 *
 * 提供仓储的具体实现，包括基础仓储、租户感知仓储等。
 * 所有仓储实现都继承自领域层的仓储接口，提供具体的数据访问实现。
 *
 * @description 基础设施层仓储模块的导出文件
 * @since 1.0.0
 */

// 基础仓储实现
export { BaseRepository } from './base.repository';

// 租户感知仓储实现
export { TenantAwareRepository } from './tenant-aware.repository';
