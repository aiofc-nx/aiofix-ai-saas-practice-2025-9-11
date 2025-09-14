/**
 * 基础异常类
 *
 * 提供领域异常的基础实现，确保异常处理的一致性和可追溯性。
 * 所有领域异常都应该继承此类，提供统一的异常处理机制。
 *
 * @description 领域异常基类，提供异常的基础功能和统一的错误处理机制
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * 基础领域异常类
 *
 * @description 所有领域异常的基础类，提供统一的异常处理机制
 * 包括错误码、错误消息、上下文信息等基础功能
 *
 * @example
 * ```typescript
 * class UserNotFoundException extends BaseException {
 *   constructor(userId: string) {
 *     super(
 *       'USER_NOT_FOUND',
 *       `User with ID ${userId} not found`,
 *       { userId }
 *     );
 *   }
 * }
 * ```
 */
export abstract class BaseException extends Error {
  /**
   * 错误码
   *
   * @description 用于标识异常类型的唯一代码
   */
  public readonly code: string;

  /**
   * 异常上下文
   *
   * @description 包含异常相关的上下文信息，便于调试和日志记录
   */
  public readonly context: Record<string, any>;

  /**
   * 异常时间戳
   *
   * @description 异常发生的时间戳，用于追踪和调试
   */
  public readonly timestamp: Date;

  /**
   * 构造函数
   *
   * @description 创建基础异常实例
   * @param code 错误码，用于标识异常类型
   * @param message 错误消息，描述异常的具体情况
   * @param context 异常上下文，包含相关的上下文信息
   * @param cause 原始异常，用于异常链追踪
   *
   * @example
   * ```typescript
   * throw new BaseException(
   *   'INVALID_INPUT',
   *   'The provided input is invalid',
   *   { input: userInput, field: 'email' }
   * );
   * ```
   */
  constructor(
    code: string,
    message: string,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();

    // 设置错误堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // 如果有原始异常，将其堆栈信息添加到当前异常
    if (cause && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }

  /**
   * 转换为JSON格式
   *
   * @description 将异常信息序列化为JSON格式，便于日志记录和API响应
   * @returns 异常的JSON表示
   *
   * @example
   * ```typescript
   * const exception = new UserNotFoundException('user-123');
   * console.log(exception.toJSON());
   * // 输出: { code: 'USER_NOT_FOUND', message: '...', context: {...}, timestamp: '...' }
   * ```
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * 获取异常摘要
   *
   * @description 获取异常的简要信息，用于日志记录和监控
   * @returns 异常摘要信息
   *
   * @example
   * ```typescript
   * const exception = new UserNotFoundException('user-123');
   * console.log(exception.getSummary());
   * // 输出: "UserNotFoundException[USER_NOT_FOUND]: User with ID user-123 not found"
   * ```
   */
  public getSummary(): string {
    return `${this.name}[${this.code}]: ${this.message}`;
  }
}
