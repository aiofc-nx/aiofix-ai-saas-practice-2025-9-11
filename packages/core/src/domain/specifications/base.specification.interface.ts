import { BaseEntity } from '../entities/base.entity';

/**
 * 基础规约接口
 *
 * 规约模式是领域驱动设计中的重要模式，用于封装业务规则和查询条件。
 * 规约提供了灵活、可组合的业务规则表达方式，支持复杂的业务逻辑。
 *
 * @description 定义规约的标准接口，所有规约都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 业务规则封装规则
 * - 规约封装复杂的业务规则和逻辑
 * - 规约必须表达清晰的业务意图
 * - 规约必须支持业务规则的组合
 * - 规约必须支持业务规则的测试
 *
 * ### 查询条件规则
 * - 规约提供灵活的查询条件表达
 * - 规约支持复杂的查询逻辑组合
 * - 规约必须支持查询条件的优化
 * - 规约必须支持查询条件的缓存
 *
 * ### 可组合性规则
 * - 规约支持AND、OR、NOT等逻辑组合
 * - 规约支持嵌套和递归组合
 * - 规约组合必须保持逻辑一致性
 * - 规约组合必须支持性能优化
 *
 * ### 可测试性规则
 * - 规约必须支持单元测试
 * - 规约必须支持集成测试
 * - 规约必须支持性能测试
 * - 规约必须支持边界条件测试
 *
 * ## 业务逻辑流程
 *
 * 1. **规则定义**：定义具体的业务规则
 * 2. **条件组合**：组合多个业务规则
 * 3. **逻辑验证**：验证业务规则的正确性
 * 4. **条件应用**：将规约应用到实体或查询
 * 5. **结果评估**：评估规约的匹配结果
 * 6. **性能优化**：优化规约的执行性能
 * 7. **缓存管理**：管理规约的缓存策略
 * 8. **结果返回**：返回规约的匹配结果
 *
 * @template TEntity 实体类型
 *
 * @example
 * ```typescript
 * class ActiveUserSpecification implements IBaseSpecification<User> {
 *   isSatisfiedBy(user: User): boolean {
 *     return user.getStatus() === 'ACTIVE' && user.isEmailVerified();
 *   }
 *
 *   toSQL(): string {
 *     return 'status = "ACTIVE" AND email_verified = true';
 *   }
 * }
 *
 * // 使用规约
 * const activeUserSpec = new ActiveUserSpecification();
 * const isActive = activeUserSpec.isSatisfiedBy(user);
 *
 * // 组合规约
 * const premiumActiveUserSpec = activeUserSpec.and(new PremiumUserSpecification());
 * ```
 *
 * @since 1.0.0
 */
export interface IBaseSpecification<TEntity extends BaseEntity> {
  /**
   * 检查实体是否满足规约
   *
   * @description 检查指定的实体是否满足规约条件
   *
   * ## 业务规则
   *
   * ### 匹配规则
   * - 规约必须准确判断实体是否满足条件
   * - 规约必须处理实体的各种状态
   * - 规约必须支持复杂的业务逻辑
   * - 规约必须保证判断结果的一致性
   *
   * ### 性能规则
   * - 规约判断必须高效执行
   * - 规约必须支持缓存机制
   * - 规约必须避免重复计算
   * - 规约必须支持批量判断
   *
   * ### 异常处理规则
   * - 规约必须处理实体的异常状态
   * - 规约必须处理数据缺失的情况
   * - 规约必须提供详细的错误信息
   * - 规约必须支持异常的重试机制
   *
   * @param entity - 要检查的实体
   * @returns 如果实体满足规约则返回true，否则返回false
   *
   * @throws {Error} 当检查失败时抛出
   *
   * @example
   * ```typescript
   * const activeUserSpec = new ActiveUserSpecification();
   * const isActive = activeUserSpec.isSatisfiedBy(user);
   * if (isActive) {
   *   console.log('用户是活跃用户');
   * }
   * ```
   */
  isSatisfiedBy(entity: TEntity): boolean;

  /**
   * 将规约转换为SQL查询条件
   *
   * @description 将规约转换为SQL查询条件，用于数据库查询优化
   *
   * ## 业务规则
   *
   * ### SQL生成规则
   * - 规约必须生成正确的SQL查询条件
   * - 规约必须支持参数化查询
   * - 规约必须避免SQL注入攻击
   * - 规约必须支持不同数据库的语法
   *
   * ### 性能优化规则
   * - 规约必须生成高效的SQL查询
   * - 规约必须支持索引优化
   * - 规约必须避免全表扫描
   * - 规约必须支持查询计划优化
   *
   * ### 安全性规则
   * - 规约必须防止SQL注入攻击
   * - 规约必须验证输入参数
   * - 规约必须使用参数化查询
   * - 规约必须支持权限控制
   *
   * @returns SQL查询条件字符串
   *
   * @throws {Error} 当SQL生成失败时抛出
   *
   * @example
   * ```typescript
   * const activeUserSpec = new ActiveUserSpecification();
   * const sql = activeUserSpec.toSQL();
   * // 返回: "status = 'ACTIVE' AND email_verified = true"
   *
   * const query = `SELECT * FROM users WHERE ${sql}`;
   * ```
   */
  toSQL(): string;

  /**
   * 将规约转换为查询参数
   *
   * @description 将规约转换为查询参数，用于参数化查询
   *
   * ## 业务规则
   *
   * ### 参数生成规则
   * - 规约必须生成正确的查询参数
   * - 规约必须支持参数的类型转换
   * - 规约必须支持参数的验证
   * - 规约必须支持参数的默认值
   *
   * ### 参数安全规则
   * - 规约必须验证参数的有效性
   * - 规约必须防止参数注入攻击
   * - 规约必须支持参数的转义
   * - 规约必须支持参数的加密
   *
   * @returns 查询参数对象
   *
   * @throws {Error} 当参数生成失败时抛出
   *
   * @example
   * ```typescript
   * const activeUserSpec = new ActiveUserSpecification();
   * const params = activeUserSpec.toParameters();
   * // 返回: { status: 'ACTIVE', email_verified: true }
   *
   * const query = 'SELECT * FROM users WHERE status = ? AND email_verified = ?';
   * const result = await db.query(query, [params.status, params.email_verified]);
   * ```
   */
  toParameters(): Record<string, any>;

  /**
   * 规约的AND组合
   *
   * @description 将当前规约与另一个规约进行AND逻辑组合
   *
   * ## 业务规则
   *
   * ### 逻辑组合规则
   * - 规约组合必须保持逻辑一致性
   * - 规约组合必须支持嵌套组合
   * - 规约组合必须支持递归组合
   * - 规约组合必须支持性能优化
   *
   * ### 性能优化规则
   * - 规约组合必须支持查询优化
   * - 规约组合必须支持索引优化
   * - 规约组合必须支持缓存优化
   * - 规约组合必须支持批量优化
   *
   * @param other - 要组合的另一个规约
   * @returns 组合后的规约
   *
   * @throws {Error} 当组合失败时抛出
   *
   * @example
   * ```typescript
   * const activeUserSpec = new ActiveUserSpecification();
   * const premiumUserSpec = new PremiumUserSpecification();
   * const combinedSpec = activeUserSpec.and(premiumUserSpec);
   * ```
   */
  and(other: IBaseSpecification<TEntity>): IBaseSpecification<TEntity>;

  /**
   * 规约的OR组合
   *
   * @description 将当前规约与另一个规约进行OR逻辑组合
   *
   * ## 业务规则
   *
   * ### 逻辑组合规则
   * - 规约组合必须保持逻辑一致性
   * - 规约组合必须支持嵌套组合
   * - 规约组合必须支持递归组合
   * - 规约组合必须支持性能优化
   *
   * ### 性能优化规则
   * - 规约组合必须支持查询优化
   * - 规约组合必须支持索引优化
   * - 规约组合必须支持缓存优化
   * - 规约组合必须支持批量优化
   *
   * @param other - 要组合的另一个规约
   * @returns 组合后的规约
   *
   * @throws {Error} 当组合失败时抛出
   *
   * @example
   * ```typescript
   * const activeUserSpec = new ActiveUserSpecification();
   * const inactiveUserSpec = new InactiveUserSpecification();
   * const combinedSpec = activeUserSpec.or(inactiveUserSpec);
   * ```
   */
  or(other: IBaseSpecification<TEntity>): IBaseSpecification<TEntity>;

  /**
   * 规约的NOT逻辑
   *
   * @description 将当前规约进行NOT逻辑取反
   *
   * ## 业务规则
   *
   * ### 逻辑取反规则
   * - 规约取反必须保持逻辑一致性
   * - 规约取反必须支持嵌套取反
   * - 规约取反必须支持递归取反
   * - 规约取反必须支持性能优化
   *
   * ### 性能优化规则
   * - 规约取反必须支持查询优化
   * - 规约取反必须支持索引优化
   * - 规约取反必须支持缓存优化
   * - 规约取反必须支持批量优化
   *
   * @returns 取反后的规约
   *
   * @throws {Error} 当取反失败时抛出
   *
   * @example
   * ```typescript
   * const activeUserSpec = new ActiveUserSpecification();
   * const notActiveUserSpec = activeUserSpec.not();
   * ```
   */
  not(): IBaseSpecification<TEntity>;

  /**
   * 获取规约的描述
   *
   * @description 获取规约的人类可读描述
   * @returns 规约的描述字符串
   *
   * @example
   * ```typescript
   * const activeUserSpec = new ActiveUserSpecification();
   * const description = activeUserSpec.getDescription();
   * console.log('规约描述:', description);
   * ```
   */
  getDescription(): string;
}
