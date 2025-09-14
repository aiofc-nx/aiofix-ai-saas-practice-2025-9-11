import { BaseCommand } from './base.command';
import { ResultType } from '../../shared/types/common';

/**
 * 命令处理器接口
 *
 * 命令处理器是CQRS模式中的核心组件，负责处理特定类型的命令。
 * 每个命令处理器专门处理一种命令类型，确保职责单一和代码清晰。
 *
 * @description 定义命令处理器的标准接口，所有命令处理器都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 处理器注册规则
 * - 每个命令类型只能有一个处理器
 * - 处理器必须在命令总线中注册
 * - 处理器注册时验证命令类型匹配
 * - 支持处理器的动态注册和注销
 *
 * ### 命令执行规则
 * - 处理器必须验证命令的有效性
 * - 处理器必须验证用户的执行权限
 * - 处理器必须保证业务操作的原子性
 * - 处理器执行失败时回滚所有操作
 *
 * ### 异常处理规则
 * - 处理器必须捕获并处理所有异常
 * - 业务异常必须转换为Result类型返回
 * - 系统异常必须记录详细日志
 * - 异常处理不能泄露敏感信息
 *
 * ### 事务管理规则
 * - 处理器必须管理数据库事务
 * - 事务边界必须与业务操作边界一致
 * - 支持嵌套事务和事务传播
 * - 事务失败时必须完全回滚
 *
 * ### 事件发布规则
 * - 业务操作完成后必须发布领域事件
 * - 事件发布必须在事务提交前完成
 * - 事件发布失败必须回滚整个事务
 * - 支持事件的批量发布和异步发布
 *
 * ## 业务逻辑流程
 *
 * 1. **命令接收**：接收来自命令总线的命令
 * 2. **权限验证**：验证用户对命令的执行权限
 * 3. **业务验证**：验证命令的业务规则和约束
 * 4. **事务开始**：开始数据库事务
 * 5. **业务执行**：执行业务逻辑和状态变更
 * 6. **事件发布**：发布相关的领域事件
 * 7. **事务提交**：提交数据库事务
 * 8. **结果返回**：返回命令执行结果
 *
 * @template TCommand 命令类型
 * @template TResult 处理结果类型
 *
 * @example
 * ```typescript
 * class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand, User> {
 *   constructor(
 *     private userRepository: IUserRepository,
 *     private eventBus: IEventBus,
 *     private permissionService: IPermissionService
 *   ) {}
 *
 *   async handle(command: CreateUserCommand): Promise<Result<User>> {
 *     try {
 *       // 验证权限
 *       const hasPermission = await this.permissionService.checkPermission(
 *         command.getInitiatedBy(),
 *         'user.create'
 *       );
 *       if (!hasPermission) {
 *         return Result.failure(new PermissionDeniedError());
 *       }
 *
 *       // 执行业务逻辑
 *       const user = new User(
 *         EntityId.generate(),
 *         command.tenantId,
 *         command.name,
 *         command.email,
 *         command.getInitiatedBy()
 *       );
 *
 *       // 保存用户
 *       await this.userRepository.save(user);
 *
 *       // 发布事件
 *       await this.eventBus.publishAll(user.getUncommittedEvents());
 *       user.markEventsAsCommitted();
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
export interface ICommandHandler<TCommand extends BaseCommand, TResult = void> {
  /**
   * 处理命令
   *
   * @description 执行命令处理逻辑，包括权限验证、业务执行、事件发布等
   *
   * ## 业务规则
   *
   * ### 权限验证规则
   * - 验证用户对命令的执行权限
   * - 检查用户对相关资源的访问权限
   * - 支持角色权限和资源权限验证
   * - 权限验证失败返回PermissionDeniedError
   *
   * ### 业务验证规则
   * - 验证命令的业务规则和约束
   * - 检查业务状态和前置条件
   * - 验证数据的完整性和一致性
   * - 验证失败返回相应的业务异常
   *
   * ### 事务管理规则
   * - 确保业务操作的原子性
   * - 支持嵌套事务和事务传播
   * - 事务失败时完全回滚
   * - 事务成功时提交所有变更
   *
   * ### 事件发布规则
   * - 业务操作完成后发布领域事件
   * - 事件发布在事务提交前完成
   * - 事件发布失败回滚整个事务
   * - 支持事件的批量发布
   *
   * ### 异常处理规则
   * - 捕获并处理所有异常
   * - 业务异常转换为Result类型
   * - 系统异常记录详细日志
   * - 不泄露敏感系统信息
   *
   * @param command - 要处理的命令
   * @returns 命令处理结果，成功时包含处理结果，失败时包含错误信息
   *
   * @throws {Error} 当处理器内部发生未预期错误时抛出
   *
   * @example
   * ```typescript
   * // 处理创建用户命令
   * const result = await commandHandler.handle(createUserCommand);
   *
   * if (result.isSuccess()) {
   *   const user = result.getValue();
   *   console.log('用户创建成功:', user.getId());
   * } else {
   *   const error = result.getError();
   *   console.error('用户创建失败:', error.message);
   * }
   * ```
   */
  handle(command: TCommand): Promise<ResultType<TResult>>;

  /**
   * 获取支持的命令类型
   *
   * @description 返回此处理器支持的命令类型
   * @returns 命令类型的构造函数
   *
   * @example
   * ```typescript
   * const commandType = handler.getCommandType();
   * console.log(commandType.name); // 输出: "CreateUserCommand"
   * ```
   */
  getCommandType(): new (...args: any[]) => TCommand;
}
