import { BaseEntity } from '../entities/base.entity';

/**
 * 基础工厂接口
 *
 * 工厂是领域驱动设计中的重要概念，负责创建复杂的领域对象。
 * 工厂封装了对象创建的复杂逻辑，确保对象创建的一致性和正确性。
 *
 * @description 定义工厂的标准接口，所有工厂都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 对象创建规则
 * - 工厂负责创建复杂的领域对象
 * - 工厂必须确保对象创建的一致性
 * - 工厂必须验证创建参数的有效性
 * - 工厂必须处理对象创建的异常情况
 *
 * ### 业务逻辑规则
 * - 工厂可以包含复杂的业务逻辑
 * - 工厂必须遵循业务规则和约束
 * - 工厂必须确保对象的业务完整性
 * - 工厂必须支持对象的定制化创建
 *
 * ### 依赖注入规则
 * - 工厂可以依赖其他服务或仓储
 * - 工厂必须管理依赖的生命周期
 * - 工厂必须处理依赖的异常情况
 * - 工厂必须支持依赖的测试和模拟
 *
 * ### 验证规则
 * - 工厂必须验证创建参数的有效性
 * - 工厂必须检查业务规则的约束
 * - 工厂必须处理验证失败的情况
 * - 工厂必须提供详细的错误信息
 *
 * ## 业务逻辑流程
 *
 * 1. **参数验证**：验证创建参数的有效性
 * 2. **业务规则检查**：检查业务规则和约束
 * 3. **依赖解析**：解析必要的依赖和服务
 * 4. **对象创建**：创建领域对象实例
 * 5. **业务逻辑执行**：执行相关的业务逻辑
 * 6. **对象初始化**：初始化对象的属性和状态
 * 7. **验证完成**：验证对象的完整性和正确性
 * 8. **返回对象**：返回创建的领域对象
 *
 * @template TEntity 实体类型
 *
 * @example
 * ```typescript
 * class UserFactory implements IBaseFactory<User> {
 *   constructor(
 *     private userRepository: IUserRepository,
 *     private permissionService: IPermissionService
 *   ) {}
 *
 *   async create(data: CreateUserData): Promise<User> {
 *     // 验证参数
 *     this.validateCreateData(data);
 *
 *     // 检查业务规则
 *     await this.checkBusinessRules(data);
 *
 *     // 创建用户
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
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface IBaseFactory<TEntity extends BaseEntity> {
  /**
   * 创建实体实例
   *
   * @description 根据提供的数据创建实体实例
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
   * ### 对象创建规则
   * - 创建符合业务规则的实体实例
   * - 确保实体实例的完整性和正确性
   * - 初始化实体的属性和状态
   * - 执行必要的业务逻辑
   *
   * ### 依赖处理规则
   * - 解析和处理必要的依赖
   * - 管理依赖的生命周期
   * - 处理依赖的异常情况
   * - 支持依赖的测试和模拟
   *
   * @param data - 创建实体的数据
   * @returns 创建的实体实例
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
   * const user = await userFactory.create(userData);
   * console.log('用户创建成功:', user.getId());
   * ```
   */
  create(data: any): Promise<TEntity>;

  /**
   * 从现有数据重建实体
   *
   * @description 从现有数据重建实体实例，通常用于从存储中恢复实体
   *
   * ## 业务规则
   *
   * ### 数据验证规则
   * - 验证重建数据的有效性和完整性
   * - 检查数据格式和约束条件
   * - 验证数据的业务规则
   * - 数据验证失败时抛出相应异常
   *
   * ### 状态重建规则
   * - 重建实体的完整状态
   * - 恢复实体的属性和关系
   * - 重建实体的业务状态
   * - 确保重建状态的一致性
   *
   * ### 版本兼容性规则
   * - 支持不同版本的数据格式
   * - 处理数据格式的升级和降级
   * - 保证向后兼容性
   * - 版本兼容性失败时抛出相应异常
   *
   * @param data - 重建实体的数据
   * @returns 重建的实体实例
   *
   * @throws {ValidationError} 当数据验证失败时抛出
   * @throws {VersionCompatibilityError} 当版本不兼容时抛出
   * @throws {Error} 当重建失败时抛出
   *
   * @example
   * ```typescript
   * const userData = {
   *   id: '123e4567-e89b-12d3-4567-426614174000',
   *   tenantId: '456e7890-e89b-12d3-4567-426614174000',
   *   name: '张三',
   *   email: 'zhangsan@example.com',
   *   createdAt: '2024-01-01T00:00:00.000Z',
   *   updatedAt: '2024-01-01T00:00:00.000Z'
   * };
   *
   * const user = await userFactory.recreate(userData);
   * console.log('用户重建成功:', user.getId());
   * ```
   */
  recreate(data: any): Promise<TEntity>;

  /**
   * 验证创建数据
   *
   * @description 验证创建实体的数据是否有效
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
   * const validationResult = await userFactory.validate(userData);
   * if (!validationResult.isValid) {
   *   console.error('验证失败:', validationResult.errors);
   * }
   * ```
   */
  validate(data: any): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
}
