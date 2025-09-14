import { Injectable } from '@nestjs/common';
import type { AsyncContext } from '../context';
import { BasePublisher } from './base-publisher';
import type { ICommandPublisher, IPublisherConfig } from './publisher.types';

/**
 * 命令发布者
 *
 * 专门用于发布命令的发布者实现。
 * 继承自BasePublisher，提供命令发布的特化功能。
 *
 * @description 命令发布者，专门处理命令的发布和流管理
 *
 * ## 业务规则
 *
 * ### 命令发布规则
 * - 所有命令都必须通过发布者发布
 * - 支持命令的批量发布
 * - 提供命令发布的统计和监控
 * - 支持命令发布的中间件处理
 *
 * ### 命令验证规则
 * - 发布前验证命令的有效性
 * - 支持命令的序列化和反序列化
 * - 提供命令的元数据管理
 * - 支持命令的版本控制
 *
 * ## 业务逻辑流程
 *
 * 1. **命令接收**：接收要发布的命令
 * 2. **命令验证**：验证命令的有效性和完整性
 * 3. **中间件处理**：通过中间件链处理命令
 * 4. **命令发布**：将命令发布到流
 * 5. **统计更新**：更新发布统计信息
 *
 * @example
 * ```typescript
 * // 创建命令发布者
 * const publisher = new CommandPublisher({
 *   enableLogging: true,
 *   enableMetrics: true
 * });
 *
 * // 发布命令
 * const command = new CreateUserCommand('user-123', 'John Doe');
 * publisher.publish(command);
 *
 * // 批量发布命令
 * const commands = [
 *   new CreateUserCommand('user-1', 'Alice'),
 *   new CreateUserCommand('user-2', 'Bob')
 * ];
 * publisher.publishAll(commands);
 *
 * // 订阅命令流
 * publisher.getStream().subscribe(command => {
 *   console.log('Command published:', command);
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class CommandPublisher<TCommand = any>
  extends BasePublisher<TCommand>
  implements ICommandPublisher<TCommand>
{
  /**
   * 构造函数
   *
   * @param config 发布者配置
   */
  constructor(config: IPublisherConfig = {}) {
    super({
      enableLogging: true,
      enableMetrics: true,
      enableRetry: false,
      maxRetries: 3,
      retryDelay: 1000,
      enableBatching: true,
      batchSize: 50,
      batchDelay: 100,
      ...config,
    });
  }

  /**
   * 发布命令
   *
   * @description 发布单个命令到流
   * @param command 要发布的命令
   * @param context 异步上下文
   */
  override publish(command: TCommand, context?: AsyncContext): void {
    // 验证命令
    this.validateCommand(command);

    // 记录命令发布日志
    if (this._config.enableLogging) {
      this.logger.debug(`Publishing command: ${this.getCommandName(command)}`);
    }

    // 调用父类发布方法
    super.publish(command, context);

    // 记录命令发布成功
    if (this._config.enableLogging) {
      this.logger.debug(
        `Successfully published command: ${this.getCommandName(command)}`
      );
    }
  }

  /**
   * 批量发布命令
   *
   * @description 批量发布多个命令到流
   * @param commands 要发布的命令数组
   * @param context 异步上下文
   */
  override publishAll(commands: TCommand[], context?: AsyncContext): void {
    if (!commands || commands.length === 0) {
      return;
    }

    // 验证所有命令
    commands.forEach((command) => this.validateCommand(command));

    // 记录批量发布日志
    if (this._config.enableLogging) {
      this.logger.debug(`Publishing batch of ${commands.length} commands`);
    }

    // 调用父类批量发布方法
    super.publishAll(commands, context);

    // 记录批量发布成功
    if (this._config.enableLogging) {
      this.logger.debug(
        `Successfully published batch of ${commands.length} commands`
      );
    }
  }

  /**
   * 验证命令
   *
   * @description 验证命令的有效性和完整性
   * @param command 要验证的命令
   * @throws 如果命令无效则抛出异常
   */
  protected validateCommand(command: TCommand): void {
    if (!command) {
      throw new Error('Command cannot be null or undefined');
    }

    // 检查命令是否有必要的属性
    if (typeof command === 'object' && command !== null) {
      const commandObj = command as any;

      // 检查命令类型
      if (!commandObj.constructor || !commandObj.constructor.name) {
        throw new Error('Command must have a constructor name');
      }

      // 检查命令是否有ID（如果存在）
      if (commandObj.id !== undefined && !commandObj.id) {
        throw new Error('Command ID cannot be empty');
      }

      // 检查命令是否有时间戳（如果存在）
      if (
        commandObj.timestamp !== undefined &&
        !(commandObj.timestamp instanceof Date)
      ) {
        throw new Error('Command timestamp must be a Date object');
      }
    }
  }

  /**
   * 获取命令名称
   *
   * @description 获取命令的类名或类型名
   * @param command 命令对象
   * @returns 命令名称
   */
  protected getCommandName(command: TCommand): string {
    if (typeof command === 'object' && command !== null) {
      const commandObj = command as any;
      return commandObj.constructor?.name || 'UnknownCommand';
    }

    return typeof command;
  }

  /**
   * 获取命令ID
   *
   * @description 获取命令的唯一标识符
   * @param command 命令对象
   * @returns 命令ID，如果不存在则返回undefined
   */
  getCommandId(command: TCommand): string | undefined {
    if (typeof command === 'object' && command !== null) {
      const commandObj = command as any;
      return commandObj.id || commandObj.commandId || commandObj.uuid;
    }

    return undefined;
  }

  /**
   * 获取命令元数据
   *
   * @description 获取命令的元数据信息
   * @param command 命令对象
   * @returns 命令元数据
   */
  getCommandMetadata(command: TCommand): Record<string, any> {
    if (typeof command === 'object' && command !== null) {
      const commandObj = command as any;
      return {
        id: this.getCommandId(command),
        type: this.getCommandName(command),
        timestamp: commandObj.timestamp || new Date(),
        version: commandObj.version || '1.0.0',
        userId: commandObj.userId,
        tenantId: commandObj.tenantId,
        organizationId: commandObj.organizationId,
        departmentId: commandObj.departmentId,
        ...commandObj.metadata,
      };
    }

    return {
      type: this.getCommandName(command),
      timestamp: new Date(),
      version: '1.0.0',
    };
  }

  /**
   * 序列化命令
   *
   * @description 将命令序列化为JSON字符串
   * @param command 要序列化的命令
   * @returns JSON字符串
   */
  serializeCommand(command: TCommand): string {
    try {
      return JSON.stringify(command, null, 2);
    } catch (error) {
      this.logger.error('Failed to serialize command:', error);
      throw new Error(
        `Failed to serialize command: ${(error as Error).message}`
      );
    }
  }

  /**
   * 反序列化命令
   *
   * @description 从JSON字符串反序列化命令
   * @param jsonString JSON字符串
   * @param commandClass 命令类构造函数
   * @returns 命令对象
   */
  deserializeCommand<T extends TCommand>(
    jsonString: string,
    commandClass: new (...args: any[]) => T
  ): T {
    try {
      const data = JSON.parse(jsonString);
      return Object.assign(new commandClass() as any, data);
    } catch (error) {
      this.logger.error('Failed to deserialize command:', error);
      throw new Error(
        `Failed to deserialize command: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取命令统计信息
   *
   * @description 获取命令发布的统计信息
   * @returns 命令统计信息
   */
  getCommandStats(): {
    totalCommands: number;
    successfulCommands: number;
    failedCommands: number;
    batchCommands: number;
    averageLatency: number;
    lastPublishedAt?: Date;
    errorStats: Record<string, number>;
  } {
    const stats = this.getStats();
    return {
      totalCommands: stats.totalPublished,
      successfulCommands: stats.successfulPublished,
      failedCommands: stats.failedPublished,
      batchCommands: stats.batchPublished,
      averageLatency: stats.averageLatency,
      lastPublishedAt: stats.lastPublishedAt,
      errorStats: stats.errorStats,
    };
  }
}
