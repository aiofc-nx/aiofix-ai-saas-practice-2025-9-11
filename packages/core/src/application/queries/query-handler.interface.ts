import { BaseQuery } from './base.query';
import { Result } from '../../shared/types/common';

/**
 * 查询处理器接口
 *
 * 查询处理器是CQRS模式中的核心组件，负责处理特定类型的查询。
 * 每个查询处理器专门处理一种查询类型，确保职责单一和代码清晰。
 *
 * @description 定义查询处理器的标准接口，所有查询处理器都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 处理器注册规则
 * - 每个查询类型只能有一个处理器
 * - 处理器必须在查询总线中注册
 * - 处理器注册时验证查询类型匹配
 * - 支持处理器的动态注册和注销
 *
 * ### 查询执行规则
 * - 处理器必须验证查询的有效性
 * - 处理器必须验证用户的数据访问权限
 * - 处理器必须保证查询结果的准确性
 * - 处理器执行失败时返回适当的错误信息
 *
 * ### 权限控制规则
 * - 处理器必须验证用户对数据的访问权限
 * - 支持多租户数据隔离
 * - 支持组织级别和部门级别的权限控制
 * - 权限验证失败返回AccessDeniedError
 *
 * ### 数据安全规则
 * - 查询结果必须符合用户权限范围
 * - 敏感数据访问需要额外验证
 * - 支持数据脱敏和加密
 * - 查询操作记录审计日志
 *
 * ### 性能优化规则
 * - 处理器必须优化查询性能
 * - 支持查询结果缓存
 * - 支持分页查询避免大数据量
 * - 支持查询条件的索引优化
 *
 * ### 异常处理规则
 * - 处理器必须捕获并处理所有异常
 * - 业务异常必须转换为Result类型返回
 * - 系统异常必须记录详细日志
 * - 异常处理不能泄露敏感信息
 *
 * ## 业务逻辑流程
 *
 * 1. **查询接收**：接收来自查询总线的查询
 * 2. **权限验证**：验证用户对查询数据的访问权限
 * 3. **条件验证**：验证查询条件的有效性
 * 4. **数据检索**：执行数据检索逻辑
 * 5. **结果过滤**：根据用户权限过滤查询结果
 * 6. **数据脱敏**：对敏感数据进行脱敏处理
 * 7. **结果返回**：返回查询执行结果
 * 8. **审计记录**：记录查询操作的审计日志
 *
 * @template TQuery 查询类型
 * @template TResult 查询结果类型
 *
 * @example
 * ```typescript
 * class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery, User> {
 *   constructor(
 *     private userRepository: IUserRepository,
 *     private permissionService: IPermissionService,
 *     private auditService: IAuditService
 *   ) {}
 *
 *   async handle(query: GetUserByIdQuery): Promise<Result<User>> {
 *     try {
 *       // 验证权限
 *       const hasAccess = await this.permissionService.checkDataAccess(
 *         query.getInitiatedBy(),
 *         'user.read',
 *         query.userId
 *       );
 *       if (!hasAccess) {
 *         return Result.failure(new AccessDeniedError());
 *       }
 *
 *       // 执行查询
 *       const user = await this.userRepository.findById(query.userId);
 *       if (!user) {
 *       return Result.failure(new UserNotFoundError(query.userId));
 *       }
 *
 *       // 记录审计日志
 *       await this.auditService.logQuery(query);
 *
 *       return Result.success(user);
 *     } catch (error) {
 *       return Result.failure(error);
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface IQueryHandler<TQuery extends BaseQuery, TResult = any> {
  /**
   * 处理查询
   *
   * @description 执行查询处理逻辑，包括权限验证、数据检索、结果过滤等
   *
   * ## 业务规则
   *
   * ### 权限验证规则
   * - 验证用户对查询数据的访问权限
   * - 检查用户对相关资源的读取权限
   * - 支持角色权限和资源权限验证
   * - 权限验证失败返回AccessDeniedError
   *
   * ### 数据访问规则
   * - 支持多租户数据隔离
   * - 支持组织级别和部门级别的数据访问控制
   * - 确保查询结果符合用户权限范围
   * - 支持数据的软删除过滤
   *
   * ### 查询优化规则
   * - 优化查询性能避免全表扫描
   * - 支持查询条件的索引优化
   * - 支持分页查询控制结果集大小
   * - 支持查询结果的缓存机制
   *
   * ### 数据安全规则
   * - 敏感数据访问需要额外验证
   * - 支持数据脱敏和加密处理
   * - 查询操作记录详细审计日志
   * - 防止敏感信息泄露
   *
   * ### 异常处理规则
   * - 捕获并处理所有异常
   * - 业务异常转换为Result类型
   * - 系统异常记录详细日志
   * - 不泄露敏感系统信息
   *
   * @param query - 要处理的查询
   * @returns 查询处理结果，成功时包含查询结果，失败时包含错误信息
   *
   * @throws {Error} 当处理器内部发生未预期错误时抛出
   *
   * @example
   * ```typescript
   * // 处理获取用户查询
   * const result = await queryHandler.handle(getUserByIdQuery);
   *
   * if (result.isSuccess()) {
   *   const user = result.getValue();
   *   console.log('查询成功:', user.getName());
   * } else {
   *   const error = result.getError();
   *   console.error('查询失败:', error.message);
   * }
   * ```
   */
  handle(query: TQuery): Promise<Result<TResult>>;

  /**
   * 获取支持的查询类型
   *
   * @description 返回此处理器支持的查询类型
   * @returns 查询类型的构造函数
   *
   * @example
   * ```typescript
   * const queryType = handler.getQueryType();
   * console.log(queryType.name); // 输出: "GetUserByIdQuery"
   * ```
   */
  getQueryType(): new (...args: any[]) => TQuery;
}
