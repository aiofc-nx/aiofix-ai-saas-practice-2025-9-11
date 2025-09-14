import { BaseException } from './base.exception';

/**
 * CQRS异常信息
 *
 * 包含未处理异常的详细信息，用于异常处理和监控。
 *
 * @description 未处理异常的详细信息包装器
 */
export class UnhandledExceptionInfo {
  /**
   * 构造函数
   *
   * @param exception 异常对象
   * @param cause 异常原因（命令、查询或事件）
   * @param context 异常上下文信息
   */
  constructor(
    public readonly exception: Error,
    public readonly cause: 'command' | 'query' | 'event',
    public readonly context?: {
      commandType?: string;
      queryType?: string;
      eventType?: string;
      handlerType?: string;
      timestamp?: Date;
      userId?: string;
      tenantId?: string;
      requestId?: string;
    }
  ) {
    this.context = {
      timestamp: new Date(),
      ...context,
    };
  }

  /**
   * 获取异常的字符串表示
   *
   * @returns 异常的字符串表示
   */
  toString(): string {
    return `UnhandledExceptionInfo(${this.cause}): ${this.exception.message}`;
  }

  /**
   * 获取异常的JSON表示
   *
   * @returns 异常的JSON表示
   */
  toJSON(): any {
    return {
      exception: {
        name: this.exception.name,
        message: this.exception.message,
        stack: this.exception.stack,
      },
      cause: this.cause,
      context: this.context,
    };
  }
}

/**
 * 无效的Saga异常
 *
 * 当Saga处理过程中发生无效操作时抛出。
 *
 * @description Saga处理过程中的无效操作异常
 */
export class InvalidSagaException extends BaseException {
  /**
   * 构造函数
   *
   * @param message 错误消息
   * @param sagaType Saga类型
   * @param context 异常上下文
   */
  constructor(
    message: string,
    sagaType?: string,
    context?: {
      sagaId?: string;
      step?: string;
      userId?: string;
      tenantId?: string;
    }
  ) {
    super(`InvalidSagaException: ${message}`, 'INVALID_SAGA_OPERATION', {
      sagaType,
      ...context,
    });
  }
}

/**
 * 命令处理异常
 *
 * 当命令处理过程中发生错误时抛出。
 *
 * @description 命令处理过程中的异常
 */
export class CommandProcessingException extends BaseException {
  /**
   * 构造函数
   *
   * @param message 错误消息
   * @param commandType 命令类型
   * @param context 异常上下文
   */
  constructor(
    message: string,
    commandType?: string,
    context?: {
      commandId?: string;
      handlerType?: string;
      userId?: string;
      tenantId?: string;
    }
  ) {
    super(
      `CommandProcessingException: ${message}`,
      'COMMAND_PROCESSING_ERROR',
      {
        commandType,
        ...context,
      }
    );
  }
}

/**
 * 查询处理异常
 *
 * 当查询处理过程中发生错误时抛出。
 *
 * @description 查询处理过程中的异常
 */
export class QueryProcessingException extends BaseException {
  /**
   * 构造函数
   *
   * @param message 错误消息
   * @param queryType 查询类型
   * @param context 异常上下文
   */
  constructor(
    message: string,
    queryType?: string,
    context?: {
      queryId?: string;
      handlerType?: string;
      userId?: string;
      tenantId?: string;
    }
  ) {
    super(`QueryProcessingException: ${message}`, 'QUERY_PROCESSING_ERROR', {
      queryType,
      ...context,
    });
  }
}

/**
 * 事件处理异常
 *
 * 当事件处理过程中发生错误时抛出。
 *
 * @description 事件处理过程中的异常
 */
export class EventProcessingException extends BaseException {
  /**
   * 构造函数
   *
   * @param message 错误消息
   * @param eventType 事件类型
   * @param context 异常上下文
   */
  constructor(
    message: string,
    eventType?: string,
    context?: {
      eventId?: string;
      handlerType?: string;
      userId?: string;
      tenantId?: string;
    }
  ) {
    super(`EventProcessingException: ${message}`, 'EVENT_PROCESSING_ERROR', {
      eventType,
      ...context,
    });
  }
}

/**
 * 处理器未找到异常
 *
 * 当找不到对应的命令、查询或事件处理器时抛出。
 *
 * @description 处理器未找到的异常
 */
export class HandlerNotFoundException extends BaseException {
  /**
   * 构造函数
   *
   * @param handlerType 处理器类型
   * @param targetType 目标类型（命令、查询或事件）
   * @param context 异常上下文
   */
  constructor(
    handlerType: string,
    targetType: 'command' | 'query' | 'event',
    context?: {
      targetName?: string;
      userId?: string;
      tenantId?: string;
    }
  ) {
    super(
      `HandlerNotFoundException: No ${handlerType} found for ${targetType}`,
      'HANDLER_NOT_FOUND',
      {
        handlerType,
        targetType,
        ...context,
      }
    );
  }
}

/**
 * 重复处理器异常
 *
 * 当尝试注册已存在的处理器时抛出。
 *
 * @description 重复注册处理器的异常
 */
export class DuplicateHandlerException extends BaseException {
  /**
   * 构造函数
   *
   * @param handlerType 处理器类型
   * @param targetType 目标类型
   * @param context 异常上下文
   */
  constructor(
    handlerType: string,
    targetType: string,
    context?: {
      existingHandler?: string;
      newHandler?: string;
      userId?: string;
      tenantId?: string;
    }
  ) {
    super(
      `DuplicateHandlerException: ${handlerType} for ${targetType} is already registered`,
      'DUPLICATE_HANDLER',
      {
        handlerType,
        targetType,
        ...context,
      }
    );
  }
}

/**
 * 版本冲突异常
 *
 * 当聚合根版本冲突时抛出。
 *
 * @description 聚合根版本冲突异常
 */
export class VersionConflictException extends BaseException {
  /**
   * 构造函数
   *
   * @param expectedVersion 期望版本
   * @param actualVersion 实际版本
   * @param context 异常上下文
   */
  constructor(
    expectedVersion: number,
    actualVersion: number,
    context?: {
      aggregateId?: string;
      aggregateType?: string;
      userId?: string;
      tenantId?: string;
    }
  ) {
    super(
      `VersionConflictException: Expected version ${expectedVersion}, but got ${actualVersion}`,
      'VERSION_CONFLICT',
      {
        expectedVersion,
        actualVersion,
        ...context,
      }
    );
  }
}

/**
 * 事件存储异常
 *
 * 当事件存储操作失败时抛出。
 *
 * @description 事件存储操作异常
 */
export class EventStoreException extends BaseException {
  /**
   * 构造函数
   *
   * @param message 错误消息
   * @param operation 操作类型
   * @param context 异常上下文
   */
  constructor(
    message: string,
    operation: 'save' | 'load' | 'delete' | 'query',
    context?: {
      aggregateId?: string;
      eventCount?: number;
      userId?: string;
      tenantId?: string;
    }
  ) {
    super(`EventStoreException: ${message}`, 'EVENT_STORE_ERROR', {
      operation,
      ...context,
    });
  }
}
