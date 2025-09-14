import { BaseCommand } from './base.command';
import { ResultType } from '../../shared/types/common';

/**
 * 命令总线接口
 *
 * 命令总线是CQRS模式中的核心组件，负责将命令路由到相应的处理器。
 * 命令总线提供了命令的注册、分发和执行机制，确保命令的正确处理。
 *
 * @description 定义命令总线的标准接口，所有命令总线实现都必须实现此接口
 *
 * ## 业务规则
 *
 * ### 命令注册规则
 * - 每个命令类型只能注册一个处理器
 * - 处理器注册时必须验证命令类型匹配
 * - 支持处理器的动态注册和注销
 * - 重复注册相同命令类型会覆盖之前的处理器
 *
 * ### 命令分发规则
 * - 命令必须路由到正确的处理器
 * - 未注册的命令类型返回CommandHandlerNotFoundError
 * - 支持命令的异步执行和超时控制
 * - 支持命令的批量执行和并行执行
 *
 * ### 权限验证规则
 * - 命令执行前必须验证用户权限
 * - 支持命令级别的权限控制
 * - 权限验证失败返回PermissionDeniedError
 * - 支持权限的缓存和优化
 *
 * ### 事务管理规则
 * - 命令执行必须在事务中进行
 * - 支持命令的嵌套事务和事务传播
 * - 命令执行失败时回滚所有操作
 * - 支持命令的补偿机制
 *
 * ### 异常处理规则
 * - 捕获并处理所有命令执行异常
 * - 业务异常转换为Result类型返回
 * - 系统异常记录详细日志
 * - 支持异常的重试和恢复机制
 *
 * ### 监控和审计规则
 * - 记录所有命令的执行日志
 * - 支持命令执行的性能监控
 * - 支持命令执行的审计追踪
 * - 支持命令执行的指标收集
 *
 * ## 业务逻辑流程
 *
 * 1. **命令接收**：接收来自客户端的命令
 * 2. **权限验证**：验证用户对命令的执行权限
 * 3. **处理器查找**：根据命令类型查找相应的处理器
 * 4. **事务开始**：开始数据库事务
 * 5. **命令执行**：调用处理器执行命令
 * 6. **事件发布**：发布命令执行产生的领域事件
 * 7. **事务提交**：提交数据库事务
 * 8. **结果返回**：返回命令执行结果
 *
 * @example
 * ```typescript
 * class CommandBus implements ICommandBus {
 *   private handlers = new Map<string, ICommandHandler<any, any>>();
 *
 *   register<TCommand extends BaseCommand, TResult>(
 *     commandType: new (...args: any[]) => TCommand,
 *     handler: ICommandHandler<TCommand, TResult>
 *   ): void {
 *     this.handlers.set(commandType.name, handler);
 *   }
 *
 *   async execute<TCommand extends BaseCommand, TResult>(
 *     command: TCommand
 *   ): Promise<Result<TResult>> {
 *     const handler = this.handlers.get(command.constructor.name);
 *     if (!handler) {
 *       return Result.failure(new CommandHandlerNotFoundError(command.constructor.name));
 *     }
 *
 *     return await handler.handle(command);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface ICommandBus {
  /**
   * 注册命令处理器
   *
   * @description 将命令处理器注册到命令总线中，建立命令类型与处理器的映射关系
   *
   * ## 业务规则
   *
   * ### 注册验证规则
   * - 验证命令类型和处理器的匹配性
   * - 检查命令类型是否已经注册过
   * - 支持处理器的覆盖注册
   * - 注册失败时抛出相应异常
   *
   * ### 类型安全规则
   * - 确保命令类型和处理器的类型匹配
   * - 支持泛型类型的安全检查
   * - 防止类型不匹配的注册
   * - 提供编译时类型检查
   *
   * @template TCommand 命令类型
   * @template TResult 处理结果类型
   *
   * @param commandType - 命令类型的构造函数
   * @param handler - 命令处理器实例
   *
   * @throws {Error} 当注册失败时抛出
   *
   * @example
   * ```typescript
   * // 注册创建用户命令处理器
   * commandBus.register(CreateUserCommand, createUserCommandHandler);
   *
   * // 注册更新用户命令处理器
   * commandBus.register(UpdateUserCommand, updateUserCommandHandler);
   * ```
   */
  register<TCommand extends BaseCommand, TResult>(
    commandType: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>
  ): void;

  /**
   * 执行命令
   *
   * @description 执行指定的命令，包括权限验证、处理器查找、命令执行等
   *
   * ## 业务规则
   *
   * ### 权限验证规则
   * - 验证用户对命令的执行权限
   * - 检查用户对相关资源的操作权限
   * - 支持命令级别的权限控制
   * - 权限验证失败返回PermissionDeniedError
   *
   * ### 处理器查找规则
   * - 根据命令类型查找相应的处理器
   * - 未找到处理器返回CommandHandlerNotFoundError
   * - 支持处理器的动态查找和缓存
   * - 查找失败时记录详细日志
   *
   * ### 事务管理规则
   * - 命令执行必须在事务中进行
   * - 支持命令的嵌套事务和事务传播
   * - 命令执行失败时回滚所有操作
   * - 事务成功时提交所有变更
   *
   * ### 异常处理规则
   * - 捕获并处理所有命令执行异常
   * - 业务异常转换为Result类型返回
   * - 系统异常记录详细日志
   * - 支持异常的重试和恢复机制
   *
   * ### 监控和审计规则
   * - 记录命令执行的开始和结束时间
   * - 记录命令执行的用户和上下文
   * - 记录命令执行的成功和失败状态
   * - 支持命令执行的性能指标收集
   *
   * @template TCommand 命令类型
   * @template TResult 处理结果类型
   *
   * @param command - 要执行的命令
   * @returns 命令执行结果，成功时包含处理结果，失败时包含错误信息
   *
   * @example
   * ```typescript
   * // 执行创建用户命令
   * const command = new CreateUserCommand('张三', 'zhangsan@example.com', tenantId);
   * const result = await commandBus.execute(command);
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
  execute<TCommand extends BaseCommand, TResult>(
    command: TCommand
  ): Promise<ResultType<TResult>>;

  /**
   * 批量执行命令
   *
   * @description 批量执行多个命令，支持并行执行和事务管理
   *
   * ## 业务规则
   *
   * ### 批量执行规则
   * - 支持命令的并行执行和串行执行
   * - 支持批量执行的事务管理
   * - 支持批量执行的错误处理
   * - 支持批量执行的性能优化
   *
   * ### 事务管理规则
   * - 批量执行可以在单个事务中进行
   * - 支持批量执行的原子性保证
   * - 批量执行失败时回滚所有操作
   * - 支持批量执行的补偿机制
   *
   * ### 错误处理规则
   * - 单个命令失败不影响其他命令执行
   * - 支持批量执行的错误收集和报告
   * - 支持批量执行的部分成功处理
   * - 记录批量执行的详细日志
   *
   * @template TCommand 命令类型
   * @template TResult 处理结果类型
   *
   * @param commands - 要执行的命令数组
   * @param options - 批量执行选项，包括并行执行、事务管理等
   * @returns 批量执行结果，包含每个命令的执行结果
   *
   * @example
   * ```typescript
   * // 批量执行命令
   * const commands = [
   *   new CreateUserCommand('张三', 'zhangsan@example.com', tenantId),
   *   new CreateUserCommand('李四', 'lisi@example.com', tenantId)
   * ];
   *
   * const results = await commandBus.executeBatch(commands, {
   *   parallel: true,
   *   transaction: true
   * });
   *
   * results.forEach((result, index) => {
   *   if (result.isSuccess()) {
   *     console.log(`命令${index}执行成功`);
   *   } else {
   *     console.error(`命令${index}执行失败:`, result.getError());
   *   }
   * });
   * ```
   */
  executeBatch<TCommand extends BaseCommand, TResult>(
    commands: TCommand[],
    options?: {
      parallel?: boolean;
      transaction?: boolean;
      timeout?: number;
    }
  ): Promise<ResultType<TResult>[]>;

  /**
   * 检查命令处理器是否已注册
   *
   * @description 检查指定命令类型的处理器是否已经在命令总线中注册
   * @param commandType - 命令类型的构造函数
   * @returns 如果已注册则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const isRegistered = commandBus.isRegistered(CreateUserCommand);
   * if (!isRegistered) {
   *   commandBus.register(CreateUserCommand, createUserCommandHandler);
   * }
   * ```
   */
  isRegistered(commandType: new (...args: any[]) => BaseCommand): boolean;

  /**
   * 获取已注册的命令类型
   *
   * @description 返回所有已注册的命令类型
   * @returns 已注册的命令类型数组
   *
   * @example
   * ```typescript
   * const registeredTypes = commandBus.getRegisteredTypes();
   * console.log('已注册的命令类型:', registeredTypes.map(type => type.name));
   * ```
   */
  getRegisteredTypes(): (new (...args: any[]) => BaseCommand)[];
}

// 导入命令处理器接口
import { ICommandHandler } from './command-handler.interface';
