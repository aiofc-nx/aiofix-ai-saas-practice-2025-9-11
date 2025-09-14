import { EntityId } from '../../domain/value-objects/entity-id';
import { Timestamp } from '../../shared/types/common';

/**
 * 基础命令类
 *
 * 命令是CQRS模式中的核心概念，用于表示用户或系统发起的业务操作。
 * 命令封装了执行业务操作所需的所有信息，并通过命令总线路由到相应的处理器。
 *
 * @description 所有命令的基类，提供命令的一致行为
 * 包括命令ID、时间戳、用户上下文等基础属性
 *
 * ## 业务规则
 *
 * ### 命令标识规则
 * - 每个命令必须具有唯一的命令ID
 * - 命令ID采用UUID格式，确保全局唯一性
 * - 命令ID用于命令的追踪和去重
 * - 命令ID在命令创建时生成，不可变更
 *
 * ### 时间戳规则
 * - 命令创建时间记录命令的发起时间
 * - 时间戳采用UTC时区，确保跨时区一致性
 * - 时间戳精度到毫秒级别
 * - 时间戳用于命令的排序和审计
 *
 * ### 用户上下文规则
 * - 命令必须包含发起用户的信息
 * - 用户ID用于权限验证和审计追踪
 * - 支持系统命令（系统用户发起）
 * - 用户上下文在命令执行时验证
 *
 * ### 命令验证规则
 * - 命令创建时必须验证所有必需字段
 * - 命令数据必须符合业务规则
 * - 验证失败的命令不能提交到命令总线
 * - 支持命令的预验证和延迟验证
 *
 * ### 命令执行规则
 * - 命令通过命令总线路由到处理器
 * - 命令处理器负责执行业务逻辑
 * - 命令执行结果通过Result类型返回
 * - 支持命令的异步执行和超时控制
 *
 * ## 业务逻辑流程
 *
 * 1. **命令创建**：通过构造函数创建命令实例
 * 2. **数据验证**：验证命令数据的完整性和有效性
 * 3. **命令提交**：将命令提交到命令总线
 * 4. **路由分发**：命令总线根据命令类型路由到处理器
 * 5. **业务执行**：命令处理器执行业务逻辑
 * 6. **结果返回**：返回命令执行结果
 * 7. **事件发布**：业务操作完成后发布领域事件
 *
 * @example
 * ```typescript
 * class CreateUserCommand extends BaseCommand {
 *   constructor(
 *     public readonly name: string,
 *     public readonly email: string,
 *     public readonly tenantId: TenantId,
 *     commandId?: EntityId,
 *     initiatedBy?: UserId,
 *     initiatedAt?: Timestamp
 *   ) {
 *     super(commandId, initiatedBy, initiatedAt);
 *   }
 *
 *   validate(): void {
 *     if (!this.name || this.name.trim().length === 0) {
 *       throw new Error('用户名不能为空');
 *     }
 *     if (!this.email || !this.isValidEmail(this.email)) {
 *       throw new Error('邮箱格式不正确');
 *     }
 *   }
 * }
 *
 * // 创建命令
 * const command = new CreateUserCommand(
 *   '张三',
 *   'zhangsan@example.com',
 *   tenantId,
 *   undefined,
 *   currentUserId
 * );
 *
 * // 提交命令
 * const result = await commandBus.execute(command);
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseCommand {
  public readonly commandId: EntityId;
  public readonly initiatedBy: EntityId;
  public readonly initiatedAt: Timestamp;

  /**
   * 构造函数
   *
   * @description 创建基础命令实例，初始化命令的核心属性
   *
   * ## 业务规则
   *
   * ### 标识符验证规则
   * - 命令ID不能为null或undefined
   * - 命令ID必须符合EntityId的格式要求
   * - 命令ID在创建后不可变更
   *
   * ### 用户上下文验证规则
   * - 发起用户ID不能为null或undefined
   * - 发起用户ID必须符合EntityId的格式要求
   * - 支持系统用户（系统命令）
   *
   * ### 时间戳规则
   * - 发起时间默认使用当前时间
   * - 时间戳采用UTC时区
   * - 时间戳精度到毫秒级别
   *
   * @param commandId - 命令的唯一标识符，默认为新生成的ID
   * @param initiatedBy - 发起命令的用户ID，默认为系统用户
   * @param initiatedAt - 命令发起时间，默认为当前时间
   *
   * @throws {Error} 当ID格式不正确时抛出
   *
   * @example
   * ```typescript
   * // 使用默认参数创建命令
   * const command = new ConcreteCommand(data);
   *
   * // 使用指定参数创建命令
   * const command = new ConcreteCommand(
   *   data,
   *   EntityId.generate(),
   *   userId,
   *   new Date()
   * );
   * ```
   */
  constructor(
    commandId?: EntityId,
    initiatedBy?: EntityId,
    initiatedAt?: Timestamp
  ) {
    this.commandId = commandId || EntityId.generate();
    this.initiatedBy = initiatedBy || EntityId.generate(); // 系统用户ID
    this.initiatedAt = initiatedAt || new Date();
  }

  /**
   * 获取命令标识符
   *
   * @description 返回命令的唯一标识符
   * @returns 命令标识符
   *
   * @example
   * ```typescript
   * const commandId = command.getCommandId();
   * console.log(commandId.toString()); // 输出命令UUID字符串
   * ```
   */
  public getCommandId(): EntityId {
    return this.commandId;
  }

  /**
   * 获取发起用户ID
   *
   * @description 返回发起命令的用户标识符
   * @returns 发起用户ID
   *
   * @example
   * ```typescript
   * const initiatedBy = command.getInitiatedBy();
   * console.log(initiatedBy.toString()); // 输出用户UUID字符串
   * ```
   */
  public getInitiatedBy(): EntityId {
    return this.initiatedBy;
  }

  /**
   * 获取命令发起时间
   *
   * @description 返回命令发起的时间戳
   * @returns 命令发起时间
   *
   * @example
   * ```typescript
   * const initiatedAt = command.getInitiatedAt();
   * console.log(initiatedAt.toISOString()); // 输出ISO格式时间字符串
   * ```
   */
  public getInitiatedAt(): Timestamp {
    return this.initiatedAt;
  }

  /**
   * 验证命令数据
   *
   * @description 验证命令数据的完整性和有效性
   * 子类应该重写此方法来实现具体的验证逻辑
   *
   * @throws {Error} 当命令数据无效时抛出
   *
   * @example
   * ```typescript
   * class CreateUserCommand extends BaseCommand {
   *   validate(): void {
   *     if (!this.name || this.name.trim().length === 0) {
   *       throw new Error('用户名不能为空');
   *     }
   *     // 其他验证逻辑...
   *   }
   * }
   * ```
   */
  public validate(): void {
    // 默认实现为空，子类可以重写
  }

  /**
   * 转换为字符串表示
   *
   * @description 提供命令的字符串表示，便于调试和日志记录
   * @returns 命令的字符串表示
   *
   * @example
   * ```typescript
   * const command = new CreateUserCommand('张三', 'zhangsan@example.com');
   * console.log(command.toString()); // 输出: "CreateUserCommand(id: ..., initiatedBy: ...)"
   * ```
   */
  public toString(): string {
    return `${
      this.constructor.name
    }(commandId: ${this.commandId.toString()}, initiatedBy: ${this.initiatedBy.toString()})`;
  }

  /**
   * 转换为JSON表示
   *
   * @description 提供命令的JSON序列化支持
   * @returns 命令的JSON表示
   *
   * @example
   * ```typescript
   * const command = new CreateUserCommand('张三', 'zhangsan@example.com');
   * const json = command.toJSON();
   * // 输出: { commandId: "...", initiatedBy: "...", initiatedAt: "...", ... }
   * ```
   */
  public toJSON(): Record<string, any> {
    return {
      commandId: this.commandId.toString(),
      initiatedBy: this.initiatedBy.toString(),
      initiatedAt: this.initiatedAt.toISOString(),
    };
  }

  /**
   * 比较两个命令是否相等
   *
   * @description 命令的相等性基于命令ID
   * @param other 要比较的另一个命令
   * @returns 如果两个命令的ID相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const command1 = new CreateUserCommand('张三', 'zhangsan@example.com');
   * const command2 = new CreateUserCommand('李四', 'lisi@example.com');
   * console.log(command1.equals(command2)); // false（不同的命令ID）
   * ```
   */
  public equals(other: BaseCommand): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return this.commandId.equals(other.commandId);
  }
}
