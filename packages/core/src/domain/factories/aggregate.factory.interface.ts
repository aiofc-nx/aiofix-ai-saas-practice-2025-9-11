import { BaseAggregateRoot } from '../aggregates/base.aggregate-root';
import { DomainEvent } from '../aggregates/base.aggregate-root';

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
 * class UserAggregateFactory implements IAggregateFactory<UserAggregate> {
 *   async create(data: CreateUserData): Promise<UserAggregate> {
 *     // 验证数据
 *     await this.validate(data);
 *
 *     // 创建聚合根
 *     const user = new UserAggregate(
 *       EntityId.generate(),
 *       data.tenantId,
 *       data.name,
 *       data.email
 *     );
 *
 *     // 发布创建事件
 *     user.addDomainEvent(new UserCreatedEvent(user.getId(), data));
 *
 *     return user;
 *   }
 *
 *   async createFromEvents(events: DomainEvent[]): Promise<UserAggregate> {
 *     const user = new UserAggregate();
 *     events.forEach(event => user.applyEvent(event));
 *     return user;
 *   }
 * }
 * ```
 */
export interface IAggregateFactory<TAggregate extends BaseAggregateRoot> {
  /**
   * 创建聚合根实例
   *
   * @description 根据提供的参数创建聚合根实例
   * @param data 创建聚合根所需的数据
   * @returns Promise<TAggregate> 创建的聚合根实例
   *
   * @example
   * ```typescript
   * const userData = {
   *   tenantId: TenantId.generate(),
   *   name: '张三',
   *   email: 'zhangsan@example.com'
   * };
   *
   * const user = await userAggregateFactory.create(userData);
   * ```
   */
  create(data: any): Promise<TAggregate>;

  /**
   * 从事件流重建聚合根
   *
   * @description 根据事件流重建聚合根的状态
   * @param events 事件流
   * @returns Promise<TAggregate> 重建的聚合根实例
   *
   * @example
   * ```typescript
   * const events = await eventStore.getEvents(aggregateId);
   * const user = await userAggregateFactory.createFromEvents(events);
   * ```
   */
  createFromEvents(events: DomainEvent[]): Promise<TAggregate>;

  /**
   * 验证创建数据
   *
   * @description 验证创建聚合根所需数据的有效性
   * @param data 待验证的数据
   * @returns Promise<{isValid: boolean, errors: string[]}> 验证结果
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
