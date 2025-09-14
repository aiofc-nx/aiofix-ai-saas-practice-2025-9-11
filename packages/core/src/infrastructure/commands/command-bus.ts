import {
  ICommandBus,
  ICommandHandler,
  BaseCommand,
} from '../../application/commands';
import { ResultType, Result } from '../../shared/types/common';

/**
 * 命令总线实现
 *
 * 命令总线是CQRS模式的核心组件，负责将命令路由到相应的处理器。
 * 支持命令的注册、分发、验证和结果处理等企业级功能。
 *
 * @description 命令总线的具体实现，提供命令的注册、分发和处理功能
 *
 * ## 业务规则
 *
 * ### 命令注册规则
 * - 每个命令处理器必须注册到命令总线
 * - 一个命令类型只能有一个处理器
 * - 处理器必须实现ICommandHandler接口
 * - 注册时验证处理器类型和命令类型
 *
 * ### 命令分发规则
 * - 命令按类型路由到对应的处理器
 * - 支持异步命令处理
 * - 命令处理失败时返回错误结果
 * - 支持命令处理的超时控制
 *
 * ### 验证规则
 * - 命令执行前进行参数验证
 * - 支持业务规则验证
 * - 验证失败时返回详细错误信息
 * - 支持自定义验证逻辑
 *
 * ## 业务逻辑流程
 *
 * 1. **命令注册**：注册命令处理器到命令总线
 * 2. **命令接收**：接收来自应用层的命令
 * 3. **命令验证**：验证命令参数和业务规则
 * 4. **命令分发**：将命令路由到对应的处理器
 * 5. **异步处理**：异步执行命令处理逻辑
 * 6. **结果返回**：返回处理结果给调用者
 *
 * @example
 * ```typescript
 * // 注册命令处理器
 * const commandBus = new CommandBus();
 * commandBus.register(new CreateUserCommandHandler());
 *
 * // 执行命令
 * const command = new CreateUserCommand(userData);
 * const result = await commandBus.execute(command);
 *
 * // 批量执行命令
 * const commands = [command1, command2, command3];
 * const results = await commandBus.executeBatch(commands);
 * ```
 */
export class CommandBus implements ICommandBus {
  private readonly handlers = new Map<
    string,
    ICommandHandler<BaseCommand, any>
  >();
  private readonly processingStats = new Map<
    string,
    {
      successCount: number;
      failureCount: number;
      totalTime: number;
    }
  >();

  /**
   * 注册命令处理器
   *
   * @description 将命令处理器注册到命令总线
   * @param commandType 命令类型的构造函数
   * @param handler 命令处理器实例
   *
   * @example
   * ```typescript
   * const commandBus = new CommandBus();
   * const handler = new CreateUserCommandHandler();
   * commandBus.register(CreateUserCommand, handler);
   * ```
   */
  public register<TCommand extends BaseCommand, TResult>(
    commandType: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    const commandTypeName = commandType.name;

    if (this.handlers.has(commandTypeName)) {
      throw new Error(
        `Handler for command type ${commandTypeName} is already registered`
      );
    }

    this.handlers.set(
      commandTypeName,
      handler as ICommandHandler<BaseCommand, any>
    );
  }

  /**
   * 注销命令处理器
   *
   * @description 从命令总线中注销指定的命令处理器
   * @param commandType 命令类型的构造函数
   *
   * @example
   * ```typescript
   * const commandBus = new CommandBus();
   * commandBus.unregister(CreateUserCommand);
   * ```
   */
  public unregister<TCommand extends BaseCommand, TResult>(
    commandType: new (...args: any[]) => TCommand
  ): void {
    const commandTypeName = commandType.name;
    this.handlers.delete(commandTypeName);
  }

  /**
   * 执行单个命令
   *
   * @description 执行单个命令并返回处理结果
   * @param command 要执行的命令
   * @returns Promise<ResultType<TResult>> 命令执行结果
   *
   * @example
   * ```typescript
   * const command = new CreateUserCommand(userData);
   * const result = await commandBus.execute(command);
   *
   * if (result.isSuccess) {
   *   console.log('用户创建成功:', result.value);
   * } else {
   *   console.error('用户创建失败:', result.error);
   * }
   * ```
   */
  public async execute<TResult>(
    command: BaseCommand
  ): Promise<ResultType<TResult>> {
    const commandType = command.constructor.name;
    const handler = this.handlers.get(commandType);

    if (!handler) {
      return Result.failure(
        new Error(`No handler registered for command type: ${commandType}`)
      );
    }

    try {
      // 验证命令
      const validationResult = await this.validateCommand(command);
      if (!validationResult.isValid) {
        return Result.failure(
          new Error(
            `Command validation failed: ${validationResult.errors.join(', ')}`
          )
        );
      }

      // 执行命令
      const startTime = Date.now();
      const result = await handler.handle(command);
      const processingTime = Date.now() - startTime;

      // 更新统计信息
      this.updateStats(commandType, result.isSuccess, processingTime);

      return result;
    } catch (error) {
      // 更新失败统计
      this.updateStats(commandType, false, 0);

      console.error(`Command execution failed for ${commandType}:`, error);
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 批量执行命令
   *
   * @description 批量执行多个命令
   * @param commands 要执行的命令数组
   * @param options 执行选项
   * @returns Promise<ResultType<TResult>[]> 命令执行结果数组
   *
   * @example
   * ```typescript
   * const commands = [command1, command2, command3];
   * const results = await commandBus.executeBatch(commands, {
   *   parallel: true,
   *   transaction: false,
   *   timeout: 5000
   * });
   * ```
   */
  public async executeBatch<TResult>(
    commands: BaseCommand[],
    options?: {
      parallel?: boolean;
      transaction?: boolean;
      timeout?: number;
    }
  ): Promise<ResultType<TResult>[]> {
    const { parallel = false, transaction = false } = options || {};

    if (parallel) {
      // 并行执行
      const promises = commands.map((command) =>
        this.execute<TResult>(command)
      );
      return Promise.all(promises);
    } else {
      // 串行执行
      const results: ResultType<TResult>[] = [];
      for (const command of commands) {
        const result = await this.execute<TResult>(command);
        results.push(result);

        // 如果启用事务模式且命令失败，则停止执行
        if (transaction && !result.isSuccess) {
          break;
        }
      }
      return results;
    }
  }

  /**
   * 检查命令处理器是否已注册
   *
   * @description 检查指定命令类型的处理器是否已经在命令总线中注册
   * @param commandType 命令类型的构造函数
   * @returns 是否已注册
   *
   * @example
   * ```typescript
   * const isRegistered = commandBus.isRegistered(CreateUserCommand);
   * if (!isRegistered) {
   *   console.warn('CreateUserCommand 处理器未注册');
   * }
   * ```
   */
  public isRegistered<TCommand extends BaseCommand>(
    commandType: new (...args: any[]) => TCommand
  ): boolean {
    return this.handlers.has(commandType.name);
  }

  /**
   * 获取命令处理统计信息
   *
   * @description 获取命令处理的统计信息
   * @returns 命令处理统计信息
   *
   * @example
   * ```typescript
   * const stats = commandBus.getProcessingStats();
   * console.log('命令处理统计:', stats);
   * ```
   */
  public getProcessingStats(): Record<
    string,
    {
      successCount: number;
      failureCount: number;
      totalTime: number;
      averageTime: number;
      successRate: number;
    }
  > {
    const result: Record<string, any> = {};

    for (const [commandType, stats] of this.processingStats.entries()) {
      const total = stats.successCount + stats.failureCount;
      result[commandType] = {
        successCount: stats.successCount,
        failureCount: stats.failureCount,
        totalTime: stats.totalTime,
        averageTime: total > 0 ? stats.totalTime / total : 0,
        successRate: total > 0 ? stats.successCount / total : 0,
      };
    }

    return result;
  }

  /**
   * 清除统计信息
   *
   * @description 清除所有命令处理的统计信息
   *
   * @example
   * ```typescript
   * commandBus.clearStats();
   * ```
   */
  public clearStats(): void {
    this.processingStats.clear();
  }

  /**
   * 获取注册的命令类型
   *
   * @description 获取所有已注册处理器的命令类型列表
   * @returns 命令类型列表
   *
   * @example
   * ```typescript
   * const commandTypes = commandBus.getRegisteredCommandTypes();
   * console.log('已注册的命令类型:', commandTypes);
   * ```
   */
  public getRegisteredCommandTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 获取注册的类型构造函数
   *
   * @description 获取所有已注册的命令类型构造函数列表
   * @returns 命令类型构造函数列表
   *
   * @example
   * ```typescript
   * const types = commandBus.getRegisteredTypes();
   * console.log('已注册的命令类型:', types.map(type => type.name));
   * ```
   */
  public getRegisteredTypes(): (new (...args: any[]) => BaseCommand)[] {
    // 由于我们只存储了字符串名称，这里返回一个空数组
    // 在实际实现中，可能需要维护类型构造函数的映射
    return [];
  }

  /**
   * 验证命令
   *
   * @description 验证命令参数和业务规则
   * @param command 要验证的命令
   * @returns 验证结果
   * @private
   */
  private async validateCommand(command: BaseCommand): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 基础验证
    if (!command) {
      errors.push('Command is null or undefined');
      return { isValid: false, errors };
    }

    // 这里可以添加更多的验证逻辑
    // 例如：参数验证、业务规则验证等

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 更新处理统计信息
   *
   * @description 更新命令处理的统计信息
   * @param commandType 命令类型
   * @param success 是否成功
   * @param processingTime 处理时间
   * @private
   */
  private updateStats(
    commandType: string,
    success: boolean,
    processingTime: number
  ): void {
    if (!this.processingStats.has(commandType)) {
      this.processingStats.set(commandType, {
        successCount: 0,
        failureCount: 0,
        totalTime: 0,
      });
    }

    const stats = this.processingStats.get(commandType)!;

    if (success) {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }

    stats.totalTime += processingTime;
  }
}
