import { BaseEntity } from '../../domain/entities/base.entity';
import { EntityId } from '../../domain/value-objects/entity-id';
import { IBaseFactory } from '../../domain/factories';
import { ResultType, Result } from '../../shared/types/common';

/**
 * 基础工厂实现
 *
 * 基础工厂提供了工厂接口的通用实现，包含基础的实体创建、
 * 参数验证、业务规则检查等功能。所有具体工厂都应该继承此类。
 *
 * @description 基础工厂的抽象实现，提供工厂的通用功能
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
 * // 具体工厂实现
 * class UserFactory extends BaseFactory<User> {
 *   public async createUser(data: CreateUserData): Promise<ResultType<User>> {
 *     // 验证参数
 *     const validationResult = await this.validateCreateUserData(data);
 *     if (!validationResult.isValid) {
 *       return Result.failure(new Error(validationResult.errors.join(', ')));
 *     }
 *
 *     // 创建用户实体
 *     const user = new User(
 *       EntityId.generate(),
 *       data.name,
 *       data.email,
 *       data.tenantId
 *     );
 *
 *     // 执行业务逻辑
 *     await this.executeUserCreationBusinessLogic(user, data);
 *
 *     return Result.success(user);
 *   }
 *
 *   protected async validateCreateUserData(data: CreateUserData): Promise<{
 *     isValid: boolean;
 *     errors: string[];
 *   }> {
 *     const errors: string[] = [];
 *
 *     if (!data.name || data.name.trim().length === 0) {
 *       errors.push('用户名不能为空');
 *     }
 *
 *     if (!data.email || !this.isValidEmail(data.email)) {
 *       errors.push('邮箱格式不正确');
 *     }
 *
 *     return {
 *       isValid: errors.length === 0,
 *       errors
 *     };
 *   }
 *
 *   protected async executeUserCreationBusinessLogic(user: User, data: CreateUserData): Promise<void> {
 *     // 执行业务逻辑，如设置默认值、发送事件等
 *     user.setDefaultRole('USER');
 *     user.sendWelcomeEvent();
 *   }
 * }
 *
 * // 使用工厂
 * const userFactory = new UserFactory();
 * const result = await userFactory.createUser(userData);
 * if (result.isSuccess) {
 *   const user = result.value;
 *   console.log('用户创建成功:', user);
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseFactory<TEntity extends BaseEntity & { id: EntityId }>
  implements IBaseFactory<TEntity>
{
  /**
   * 创建实体
   *
   * @description 创建新的实体实例，这是工厂的核心方法
   * @param params 创建参数
   * @returns Promise<ResultType<TEntity>> 创建结果
   *
   * @example
   * ```typescript
   * const result = await factory.create(createParams);
   * if (result.isSuccess) {
   *   const entity = result.value;
   *   console.log('实体创建成功:', entity);
   * }
   * ```
   */
  public async create(data: any): Promise<TEntity> {
    try {
      // 验证参数
      const validationResult = await this.validateParams(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // 生成实体ID
      const entityId = this.generateEntityId();

      // 创建实体
      const entity = await this.createEntity(entityId, data);

      // 执行业务逻辑
      await this.executeBusinessLogic(entity, data);

      // 验证创建的实体
      const entityValidationResult = await this.validateEntity(entity);
      if (!entityValidationResult.isValid) {
        throw new Error(entityValidationResult.errors.join(', '));
      }

      return entity;
    } catch (error) {
      console.error('创建实体失败', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * 批量创建实体
   *
   * @description 批量创建多个实体实例
   * @param paramsList 创建参数数组
   * @returns Promise<ResultType<TEntity[]>> 创建结果数组
   *
   * @example
   * ```typescript
   * const results = await factory.createBatch([params1, params2, params3]);
   * if (results.isSuccess) {
   *   console.log('批量创建成功:', results.value.length);
   * }
   * ```
   */
  public async createBatch(paramsList: any[]): Promise<ResultType<TEntity[]>> {
    try {
      if (!paramsList || paramsList.length === 0) {
        return Result.success([]);
      }

      const entities: TEntity[] = [];
      const errors: string[] = [];

      for (let i = 0; i < paramsList.length; i++) {
        const params = paramsList[i];
        try {
          const entity = await this.create(params);
          entities.push(entity);
        } catch (error) {
          errors.push(
            `第${i + 1}个实体创建失败: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      if (errors.length > 0) {
        return Result.failure(new Error(errors.join('; ')));
      }

      return Result.success(entities);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 重建实体
   *
   * @description 从现有数据重建实体实例
   * @param data 实体数据
   * @returns Promise<ResultType<TEntity>> 重建结果
   *
   * @example
   * ```typescript
   * const result = await factory.recreate(entityData);
   * if (result.isSuccess) {
   *   const entity = result.value;
   *   console.log('实体重建成功:', entity);
   * }
   * ```
   */
  public async recreate(data: any): Promise<TEntity> {
    try {
      // 验证重建数据
      const validationResult = await this.validateRecreateData(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // 重建实体
      const entity = await this.recreateEntity(data);

      // 验证重建的实体
      const entityValidationResult = await this.validateEntity(entity);
      if (!entityValidationResult.isValid) {
        throw new Error(entityValidationResult.errors.join(', '));
      }

      return entity;
    } catch (error) {
      console.error('重建实体失败', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * 验证参数
   *
   * @description 验证创建参数的有效性
   * @param params 创建参数
   * @returns Promise<{ isValid: boolean; errors: string[] }> 验证结果
   * @protected
   * @abstract
   */
  protected abstract validateParams(params: any): Promise<{
    isValid: boolean;
    errors: string[];
  }>;

  /**
   * 生成实体ID
   *
   * @description 生成新的实体标识符
   * @returns 实体ID
   * @protected
   */
  /**
   * 验证数据
   *
   * @description 验证创建或重建实体的数据
   * @param data 要验证的数据
   * @returns 验证结果
   */
  public async validate(data: any): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    try {
      const validationResult = await this.validateParams(data);
      return validationResult;
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  protected generateEntityId(): EntityId {
    return EntityId.generate();
  }

  /**
   * 创建实体
   *
   * @description 创建实体实例的核心逻辑
   * @param entityId 实体ID
   * @param params 创建参数
   * @returns Promise<TEntity> 创建的实体
   * @protected
   * @abstract
   */
  protected abstract createEntity(
    entityId: EntityId,
    params: any
  ): Promise<TEntity>;

  /**
   * 执行业务逻辑
   *
   * @description 执行实体创建后的业务逻辑
   * @param entity 创建的实体
   * @param params 创建参数
   * @returns Promise<void>
   * @protected
   */
  protected async executeBusinessLogic(
    entity: TEntity,
    params: any
  ): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 验证实体
   *
   * @description 验证创建的实体的完整性和正确性
   * @param entity 要验证的实体
   * @returns Promise<{ isValid: boolean; errors: string[] }> 验证结果
   * @protected
   */
  protected async validateEntity(entity: TEntity): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 基础验证
    if (!entity) {
      errors.push('实体不能为空');
      return { isValid: false, errors };
    }

    if (!EntityId.isValid(entity.id.toString())) {
      errors.push('实体ID格式不正确');
    }

    // 子类可以添加更多验证逻辑
    await this.validateEntitySpecific(entity, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证重建数据
   *
   * @description 验证重建实体的数据
   * @param data 重建数据
   * @returns Promise<{ isValid: boolean; errors: string[] }> 验证结果
   * @protected
   */
  protected async validateRecreateData(data: any): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!data) {
      errors.push('重建数据不能为空');
      return { isValid: false, errors };
    }

    if (!data.id || !EntityId.isValid(data.id)) {
      errors.push('实体ID格式不正确');
    }

    // 子类可以添加更多验证逻辑
    await this.validateRecreateDataSpecific(data, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 重建实体
   *
   * @description 从数据重建实体实例
   * @param data 实体数据
   * @returns Promise<TEntity> 重建的实体
   * @protected
   * @abstract
   */
  protected abstract recreateEntity(data: any): Promise<TEntity>;

  /**
   * 验证实体特定逻辑
   *
   * @description 子类可以重写此方法添加特定的实体验证逻辑
   * @param entity 要验证的实体
   * @param errors 错误信息数组
   * @returns Promise<void>
   * @protected
   */
  protected async validateEntitySpecific(
    entity: TEntity,
    errors: string[]
  ): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 验证重建数据特定逻辑
   *
   * @description 子类可以重写此方法添加特定的重建数据验证逻辑
   * @param data 重建数据
   * @param errors 错误信息数组
   * @returns Promise<void>
   * @protected
   */
  protected async validateRecreateDataSpecific(
    data: any,
    errors: string[]
  ): Promise<void> {
    // 默认实现为空，子类可以重写
  }
}
