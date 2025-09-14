import { BaseAggregateRoot } from '../aggregates/base.aggregate-root';
import { DomainEvent } from '../aggregates/base.aggregate-root';
import { EntityId } from '../value-objects/entity-id';

/**
 * 聚合根工厂接口
 * 
 * 聚合根工厂是事件驱动架构中的重要组件，负责创建复杂的聚合根实例。
 * 支持通过事件流重建聚合根状态，确保聚合根创建的一致性和正确性。
 * 
 * @description 定义聚合根工厂的标准接口，所有聚合根工厂都必须实现此接口
 * 
 * ## 业务规则
 * 
 * ### 聚合根创建规则
 * - 工厂负责创建复杂的聚合根实例
 * - 工厂必须确保聚合根创建的一致性
 * - 工厂必须验证创建参数的有效性
 * - 工厂必须处理聚合根创建的异常情况
 * 
 * ### 事件处理规则
 * - 工厂可以发布聚合根创建事件
 * - 工厂必须确保事件的正确性
 * - 工厂必须支持事件的版本控制
 * - 工厂必须处理事件发布的异常情况
 * 
 * ### 状态管理规则
 * - 工厂必须管理聚合根的初始状态
 * - 工厂必须确保状态的业务完整性
 * - 工厂必须支持状态的版本控制
 * - 工厂必须处理状态管理的异常情况
 * 
 * ### 依赖注入规则
 * - 工厂可以依赖其他服务或仓储
 * - 工厂必须管理依赖的生命周期
 * - 工厂必须处理依赖的异常情况
 * - 工厂必须支持依赖的测试和模拟
 * 
 * ## 业务逻辑流程
 * 
 * 1. **参数验证**：验证创建参数的有效性
 * 2. **业务规则检查**：检查业务规则和约束
 * 3. **依赖解析**：解析必要的依赖和服务
 * 4. **聚合根创建**：创建聚合根实例
 * 5. **事件发布**：发布聚合根创建事件
 * 6. **状态初始化**：初始化聚合根的状态
 * 7. **版本设置**：设置聚合根的版本号
 * 8. **返回聚合根**：返回创建的聚合根实例
 * 
 * @template TAggregate 聚合根类型
 * 
 * @example
 * ```typescript
 * class UserAggregateFactory implements IAggregateFactory<User> {
 *   constructor(
 *     private userRepository: IUserRepository,
 *     private eventStore: IEventStore,
 *     private permissionService: IPermissionService
 *   ) {}
 * 
 *   async create(data: CreateUserData): Promise<User> {
 *     // 验证参数和业务规则
 *     await this.validateCreateData(data);
 * 
 *     // 创建用户聚合根
 *     const user = new User(
 *       EntityId.generate(),
 *       data.tenantId,
 *       data.name,
 *       data.email,
 *       data.createdBy
 *     );
 * 
 *     return user;
 *   }
 * 
 *   async recreateFromEvents(events: DomainEvent[]): Promise<User> {
 *     // 通过事件流重建用户聚合根
 *     const user = new User(/* 初始参数 */);
 *     events.forEach(event => user.applyEvent(event));
 *     return user;
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 */
export interface IAggregateFactory<TAggregate extends BaseAggregateRoot> {
  /**
   * 创建聚合根实例
   * 
   * @description 根据提供的数据创建聚合根实例
   * 
   * ## 业务规则
   * 
   * ### 参数验证规则
   * - 验证创建参数的有效性和完整性
   * - 检查必需参数的缺失情况
   * - 验证参数格式和约束条件
   * - 参数验证失败时抛出相应异常
   * 
   * ### 业务规则检查规则
   * - 检查业务规则和约束条件
   * - 验证业务逻辑的前置条件
   * - 检查业务状态和权限
   * - 业务规则检查失败时抛出相应异常
   * 
   * ### 聚合根创建规则
   * - 创建符合业务规则的聚合根实例
   * - 确保聚合根实例的完整性和正确性
   * - 初始化聚合根的属性和状态
   * - 执行必要的业务逻辑
   * 
   * ### 事件发布规则
   * - 发布聚合根创建相关的领域事件
   * - 确保事件的正确性和完整性
   * - 支持事件的版本控制
   * - 事件发布失败时处理异常情况
   * 
   * @param data - 创建聚合根的数据
   * @returns 创建的聚合根实例
   * 
   * @throws {ValidationError} 当参数验证失败时抛出
   * @throws {BusinessRuleError} 当业务规则检查失败时抛出
   * @throws {Error} 当创建失败时抛出
   * 
   * @example
   * ```typescript
   * const userData = {
   *   tenantId: TenantId.generate(),
   *   name: '张三',
   *   email: 'zhangsan@example.com',
   *   createdBy: UserId.generate()
   * };
   * 
   * const user = await userAggregateFactory.create(userData);
   * console.log('用户聚合根创建成功:', user.getId());
   * ```
   */
  create(data: any): Promise<TAggregate>;

  /**
   * 从事件流重建聚合根
   * 
   * @description 通过事件流重建聚合根状态
   * 
   * ## 业务规则
   * 
   * ### 事件验证规则
   * - 验证事件的有效性和完整性
   * - 检查事件的顺序性和一致性
   * - 验证事件的业务规则
   * - 事件验证失败时抛出相应异常
   * 
   * ### 状态重建规则
   * - 通过事件流重建聚合根的完整状态
   * - 确保重建状态的一致性和正确性
   * - 重建聚合根的业务状态
   * - 重建失败时抛出相应异常
   * 
   * ### 版本管理规则
   * - 支持从任意版本开始重建
   * - 支持增量重建和全量重建
   * - 管理聚合根的版本号
   * - 版本管理失败时抛出相应异常
   * 
   * ### 事件应用规则
   * - 按顺序应用事件到聚合根
   * - 确保事件应用的正确性
   * - 处理事件应用的异常情况
   * - 支持事件的回滚和重试
   * 
   * @param events - 事件数组
   * @param options - 重建选项，包括起始版本、目标版本等
   * @returns 重建的聚合根实例
   * 
   * @throws {ValidationError} 当事件验证失败时抛出
   * @throws {StateReconstructionError} 当状态重建失败时抛出
   * @throws {Error} 当重建失败时抛出
   * 
   * @example
   * ```typescript
   * const events = [
   *   new UserCreatedEvent(userId, tenantId, name, email),
   *   new UserNameUpdatedEvent(userId, '新姓名'),
   *   new UserEmailUpdatedEvent(userId, 'new@example.com')
   * ];
   * 
   * const user = await userAggregateFactory.recreateFromEvents(events);
   * console.log('用户聚合根重建成功:', user.getName());
   * ```
   */
  recreateFromEvents(
    events: DomainEvent[],
    options?: {
      fromVersion?: number;
      toVersion?: number;
      validateEvents?: boolean;
    }
  ): Promise<TAggregate>;

  /**
   * 从存储重建聚合根
   * 
   * @description 从事件存储中重建聚合根状态
   * 
   * ## 业务规则
   * 
   * ### 存储访问规则
   * - 从事件存储中检索事件
   * - 支持分页检索避免大数据量
   * - 支持按版本范围检索
   * - 存储访问失败时抛出相应异常
   * 
   * ### 事件检索规则
   * - 按时间顺序检索所有事件
   * - 支持增量检索和全量检索
   * - 支持事件的过滤和排序
   * - 事件检索失败时抛出相应异常
   * 
   * ### 状态重建规则
   * - 通过事件流重建聚合根状态
   * - 确保重建状态的一致性和正确性
   * - 支持从任意版本开始重建
   * - 重建失败时抛出相应异常
   * 
   * ### 性能优化规则
   * - 支持快照加速重建过程
   * - 支持事件的批量检索
   * - 支持重建过程的缓存
   * - 支持重建的性能监控
   * 
   * @param aggregateId - 聚合根的唯一标识符
   * @param options - 重建选项，包括版本范围、分页等
   * @returns 重建的聚合根实例或null（如果不存在）
   * 
   * @throws {Error} 当重建失败时抛出
   * 
   * @example
   * ```typescript
   * // 重建最新版本的聚合根
   * const user = await userAggregateFactory.recreateFromStorage(userId);
   * 
   * // 重建指定版本的聚合根
   * const userAtVersion = await userAggregateFactory.recreateFromStorage(userId, {
   *   toVersion: 5
   * });
   * ```
   */
  recreateFromStorage(
    aggregateId: EntityId,
    options?: {
      fromVersion?: number;
      toVersion?: number;
      page?: number;
      limit?: number;
      useSnapshot?: boolean;
    }
  ): Promise<TAggregate | null>;

  /**
   * 验证创建数据
   * 
   * @description 验证创建聚合根的数据是否有效
   * 
   * ## 业务规则
   * 
   * ### 数据验证规则
   * - 验证数据的格式和类型
   * - 检查数据的约束条件
   * - 验证数据的业务规则
   * - 提供详细的验证错误信息
   * 
   * ### 业务规则验证规则
   * - 检查业务规则和约束条件
   * - 验证业务逻辑的前置条件
   * - 检查业务状态和权限
   * - 业务规则验证失败时返回错误信息
   * 
   * ### 依赖验证规则
   * - 验证依赖服务的可用性
   * - 检查依赖数据的完整性
   * - 验证依赖的权限和状态
   * - 依赖验证失败时返回错误信息
   * 
   * @param data - 要验证的数据
   * @returns 验证结果，包含验证是否成功和错误信息
   * 
   * @example
   * ```typescript
   * const userData = {
   *   tenantId: TenantId.generate(),
   *   name: '张三',
   *   email: 'invalid-email'
   * };
   * 
   * const validationResult = await userAggregateFactory.validate(userData);
   * if (!validationResult.isValid) {
   *   console.error('验证失败:', validationResult.errors);
   * }
   * ```
   */
  validate(data: any): Promise<{
    isValid: boolean;
    errors: string[];
  }>;

  /**
   * 获取聚合根类型信息
   * 
   * @description 获取聚合根的类型信息
   * @returns 聚合根类型的构造函数
   * 
   * @example
   * ```typescript
   * const aggregateType = userAggregateFactory.getAggregateType();
   * console.log('聚合根类型:', aggregateType.name);
   * ```
   */
  getAggregateType(): new (...args: any[]) => TAggregate;
}
