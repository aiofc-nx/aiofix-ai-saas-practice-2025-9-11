import { BaseAggregateRoot } from '../../domain/aggregates/base.aggregate-root';
import { EntityId } from '../../domain/value-objects/entity-id';
import { IAggregateFactory } from '../../domain/factories';
import { ResultType, Result } from '../../shared/types/common';

/**
 * 聚合工厂实现
 *
 * 聚合工厂提供了聚合根创建的通用实现，包含聚合根的创建、
 * 事件处理、业务规则检查等功能。所有具体聚合工厂都应该继承此类。
 *
 * @description 聚合工厂的抽象实现，提供聚合根创建的通用功能
 *
 * ## 业务规则
 *
 * ### 聚合创建规则
 * - 聚合工厂负责创建复杂的聚合根对象
 * - 聚合工厂必须确保聚合根的完整性
 * - 聚合工厂必须验证创建参数的有效性
 * - 聚合工厂必须处理聚合创建的异常情况
 *
 * ### 事件处理规则
 * - 聚合创建时必须处理相关领域事件
 * - 聚合工厂必须确保事件的正确发布
 * - 聚合工厂必须支持事件的回滚机制
 * - 聚合工厂必须处理事件处理的异常情况
 *
 * ### 业务逻辑规则
 * - 聚合工厂可以包含复杂的业务逻辑
 * - 聚合工厂必须遵循业务规则和约束
 * - 聚合工厂必须确保聚合的业务完整性
 * - 聚合工厂必须支持聚合的定制化创建
 *
 * ### 事务管理规则
 * - 聚合创建必须在事务中进行
 * - 支持嵌套事务和事务传播
 * - 事务失败时必须完全回滚
 * - 支持事务的补偿机制
 *
 * ## 业务逻辑流程
 *
 * 1. **参数验证**：验证创建参数的有效性
 * 2. **业务规则检查**：检查业务规则和约束
 * 3. **聚合创建**：创建聚合根实例
 * 4. **事件生成**：生成相关的领域事件
 * 5. **业务逻辑执行**：执行相关的业务逻辑
 * 6. **聚合初始化**：初始化聚合的属性和状态
 * 7. **事件发布**：发布聚合的领域事件
 * 8. **验证完成**：验证聚合的完整性和正确性
 * 9. **返回聚合**：返回创建的聚合根
 *
 * @template TAggregate 聚合根类型
 *
 * @example
 * ```typescript
 * // 具体聚合工厂实现
 * class OrderAggregateFactory extends AggregateFactory<Order> {
 *   public async createOrder(data: CreateOrderData): Promise<ResultType<Order>> {
 *     // 验证参数
 *     const validationResult = await this.validateCreateOrderData(data);
 *     if (!validationResult.isValid) {
 *       return Result.failure(new Error(validationResult.errors.join(', ')));
 *     }
 *
 *     // 创建订单聚合
 *     const order = new Order(
 *       EntityId.generate(),
 *       data.customerId,
 *       data.tenantId
 *     );
 *
 *     // 添加订单项
 *     for (const item of data.items) {
 *       order.addItem(item.productId, item.quantity, item.price);
 *     }
 *
 *     // 计算订单总额
 *     order.calculateTotal();
 *
 *     // 执行业务逻辑
 *     await this.executeOrderCreationBusinessLogic(order, data);
 *
 *     return Result.success(order);
 *   }
 *
 *   protected async validateCreateOrderData(data: CreateOrderData): Promise<{
 *     isValid: boolean;
 *     errors: string[];
 *   }> {
 *     const errors: string[] = [];
 *
 *     if (!data.customerId) {
 *       errors.push('客户ID不能为空');
 *     }
 *
 *     if (!data.items || data.items.length === 0) {
 *       errors.push('订单项不能为空');
 *     }
 *
 *     return {
 *       isValid: errors.length === 0,
 *       errors
 *     };
 *   }
 *
 *   protected async executeOrderCreationBusinessLogic(order: Order, data: CreateOrderData): Promise<void> {
 *     // 执行业务逻辑，如库存检查、价格计算等
 *     await this.checkInventoryAvailability(order);
 *     await this.applyDiscounts(order, data);
 *     order.recordOrderCreatedEvent();
 *   }
 * }
 *
 * // 使用聚合工厂
 * const orderFactory = new OrderAggregateFactory();
 * const result = await orderFactory.createOrder(orderData);
 * if (result.isSuccess) {
 *   const order = result.value;
 *   console.log('订单创建成功:', order);
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class AggregateFactory<
  TAggregate extends BaseAggregateRoot & { id: EntityId }
> implements IAggregateFactory<TAggregate>
{
  /**
   * 创建聚合根
   *
   * @description 创建新的聚合根实例，这是聚合工厂的核心方法
   * @param params 创建参数
   * @returns Promise<ResultType<TAggregate>> 创建结果
   *
   * @example
   * ```typescript
   * const result = await factory.create(params);
   * if (result.isSuccess) {
   *   const aggregate = result.value;
   *   console.log('聚合创建成功:', aggregate);
   * }
   * ```
   */
  public async create(data: any): Promise<TAggregate> {
    try {
      // 验证参数
      const validationResult = await this.validateParams(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // 生成聚合ID
      const aggregateId = this.generateAggregateId();

      // 创建聚合
      const aggregate = await this.createAggregate(aggregateId, data);

      // 执行业务逻辑
      await this.executeBusinessLogic(aggregate, data);

      // 处理聚合事件
      await this.handleAggregateEvents(aggregate);

      // 验证创建的聚合
      const aggregateValidationResult = await this.validateAggregate(aggregate);
      if (!aggregateValidationResult.isValid) {
        throw new Error(aggregateValidationResult.errors.join(', '));
      }

      return aggregate;
    } catch (error) {
      console.error('创建聚合失败', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * 批量创建聚合根
   *
   * @description 批量创建多个聚合根实例
   * @param paramsList 创建参数数组
   * @returns Promise<ResultType<TAggregate[]>> 创建结果数组
   *
   * @example
   * ```typescript
   * const results = await factory.createBatch([params1, params2, params3]);
   * if (results.isSuccess) {
   *   console.log('批量创建成功:', results.value.length);
   * }
   * ```
   */
  public async createBatch(
    paramsList: any[]
  ): Promise<ResultType<TAggregate[]>> {
    try {
      if (!paramsList || paramsList.length === 0) {
        return Result.success([]);
      }

      const aggregates: TAggregate[] = [];
      const errors: string[] = [];

      for (let i = 0; i < paramsList.length; i++) {
        const params = paramsList[i];
        try {
          const aggregate = await this.create(params);
          aggregates.push(aggregate);
        } catch (error) {
          errors.push(
            `第${i + 1}个聚合创建失败: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      if (errors.length > 0) {
        return Result.failure(new Error(errors.join('; ')));
      }

      return Result.success(aggregates);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 重建聚合根
   *
   * @description 从现有数据重建聚合根实例
   * @param data 聚合数据
   * @returns Promise<ResultType<TAggregate>> 重建结果
   *
   * @example
   * ```typescript
   * const result = await factory.recreate(aggregateData);
   * if (result.isSuccess) {
   *   const aggregate = result.value;
   *   console.log('聚合重建成功:', aggregate);
   * }
   * ```
   */
  public async recreate(data: any): Promise<ResultType<TAggregate>> {
    try {
      // 验证重建数据
      const validationResult = await this.validateRecreateData(data);
      if (!validationResult.isValid) {
        return Result.failure(new Error(validationResult.errors.join(', ')));
      }

      // 重建聚合
      const aggregate = await this.recreateAggregate(data);

      // 验证重建的聚合
      const aggregateValidationResult = await this.validateAggregate(aggregate);
      if (!aggregateValidationResult.isValid) {
        return Result.failure(
          new Error(aggregateValidationResult.errors.join(', '))
        );
      }

      return Result.success(aggregate);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 从事件创建聚合根
   *
   * @description 从领域事件重建聚合根实例
   * @param events 领域事件数组
   * @returns Promise<TAggregate> 重建的聚合根
   */
  public async createFromEvents(events: any[]): Promise<TAggregate> {
    try {
      if (!events || events.length === 0) {
        throw new Error('事件数组不能为空');
      }

      // 从事件重建聚合
      const aggregate = await this.recreateFromEvents(events);

      // 验证重建的聚合
      const validationResult = await this.validateAggregate(aggregate);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      return aggregate;
    } catch (error) {
      console.error('从事件创建聚合失败', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * 验证数据
   *
   * @description 验证创建或重建聚合的数据
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

  /**
   * 获取聚合类型
   *
   * @description 获取聚合根的类型构造函数
   * @returns 聚合根类型构造函数
   */
  public abstract getAggregateType(): new (...args: any[]) => TAggregate;

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
   * 生成聚合ID
   *
   * @description 生成新的聚合标识符
   * @returns 聚合ID
   * @protected
   */
  protected generateAggregateId(): EntityId {
    return EntityId.generate();
  }

  /**
   * 创建聚合根
   *
   * @description 创建聚合根实例的核心逻辑
   * @param aggregateId 聚合ID
   * @param params 创建参数
   * @returns Promise<TAggregate> 创建的聚合根
   * @protected
   * @abstract
   */
  protected abstract createAggregate(
    aggregateId: EntityId,
    params: any
  ): Promise<TAggregate>;

  /**
   * 执行业务逻辑
   *
   * @description 执行聚合创建后的业务逻辑
   * @param aggregate 创建的聚合
   * @param params 创建参数
   * @returns Promise<void>
   * @protected
   */
  protected async executeBusinessLogic(
    aggregate: TAggregate,
    params: any
  ): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 处理聚合事件
   *
   * @description 处理聚合创建过程中产生的事件
   * @param aggregate 创建的聚合
   * @returns Promise<void>
   * @protected
   */
  protected async handleAggregateEvents(aggregate: TAggregate): Promise<void> {
    // 默认实现为空，子类可以重写
    // 这里可以发布聚合的领域事件
  }

  /**
   * 验证聚合根
   *
   * @description 验证创建的聚合根的完整性和正确性
   * @param aggregate 要验证的聚合根
   * @returns Promise<{ isValid: boolean; errors: string[] }> 验证结果
   * @protected
   */
  protected async validateAggregate(aggregate: TAggregate): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 基础验证
    if (!aggregate) {
      errors.push('聚合根不能为空');
      return { isValid: false, errors };
    }

    if (!EntityId.isValid(aggregate.id.toString())) {
      errors.push('聚合根ID格式不正确');
    }

    // 验证聚合的业务不变量
    await this.validateAggregateInvariants(aggregate, errors);

    // 子类可以添加更多验证逻辑
    await this.validateAggregateSpecific(aggregate, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证重建数据
   *
   * @description 验证重建聚合的数据
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
      errors.push('聚合根ID格式不正确');
    }

    // 子类可以添加更多验证逻辑
    await this.validateRecreateDataSpecific(data, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 重建聚合根
   *
   * @description 从数据重建聚合根实例
   * @param data 聚合数据
   * @returns Promise<TAggregate> 重建的聚合根
   * @protected
   * @abstract
   */
  protected abstract recreateAggregate(data: any): Promise<TAggregate>;

  /**
   * 从事件重建聚合根
   *
   * @description 从领域事件重建聚合根实例
   * @param events 领域事件数组
   * @returns Promise<TAggregate> 重建的聚合根
   * @protected
   * @abstract
   */
  protected abstract recreateFromEvents(events: any[]): Promise<TAggregate>;

  /**
   * 验证聚合不变量
   *
   * @description 验证聚合的业务不变量
   * @param aggregate 要验证的聚合
   * @param errors 错误信息数组
   * @returns Promise<void>
   * @protected
   */
  protected async validateAggregateInvariants(
    aggregate: TAggregate,
    errors: string[]
  ): Promise<void> {
    // 默认实现为空，子类可以重写
    // 这里可以验证聚合的业务不变量
  }

  /**
   * 验证聚合特定逻辑
   *
   * @description 子类可以重写此方法添加特定的聚合验证逻辑
   * @param aggregate 要验证的聚合
   * @param errors 错误信息数组
   * @returns Promise<void>
   * @protected
   */
  protected async validateAggregateSpecific(
    aggregate: TAggregate,
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
