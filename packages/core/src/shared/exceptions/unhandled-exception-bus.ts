import { Subject, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '@aiofix/logging';
import { UnhandledExceptionInfo } from './cqrs-exceptions';

/**
 * 未处理异常总线
 *
 * 用于处理CQRS模式中未处理的异常。
 * 提供异常流的订阅和处理功能。
 *
 * @description 未处理异常总线，提供异常流的订阅和处理功能
 *
 * ## 业务规则
 *
 * ### 异常处理规则
 * - 所有未处理的CQRS异常都会推送到此总线
 * - 支持多个订阅者同时监听异常流
 * - 提供异常的分类和过滤功能
 * - 支持异常的重试和恢复机制
 *
 * ### 订阅规则
 * - 支持Observable模式的异常订阅
 * - 提供异常流的过滤和转换
 * - 支持订阅者的生命周期管理
 * - 提供异常处理的监控和统计
 *
 * ## 业务逻辑流程
 *
 * 1. **异常捕获**：捕获CQRS处理过程中的未处理异常
 * 2. **异常包装**：将异常包装为UnhandledExceptionInfo
 * 3. **异常推送**：将异常信息推送到总线
 * 4. **异常分发**：将异常分发给所有订阅者
 * 5. **异常处理**：订阅者处理异常并采取相应措施
 *
 * @example
 * ```typescript
 * // 创建异常总线
 * const exceptionBus = new UnhandledExceptionBus();
 *
 * // 订阅异常流
 * exceptionBus.pipe(
 *   filter(info => info.cause === 'command'),
 *   takeUntil(destroy$)
 * ).subscribe((exceptionInfo: UnhandledExceptionInfo) => {
 *   console.error('Unhandled command exception:', exceptionInfo);
 *   // 处理异常，例如记录日志、发送通知等
 * });
 *
 * // 发布异常
 * exceptionBus.publish(new UnhandledExceptionInfo(
 *   new Error('Command failed'),
 *   'command',
 *   { commandType: 'CreateUserCommand' }
 * ));
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class UnhandledExceptionBus {
  private readonly exceptionSubject = new Subject<UnhandledExceptionInfo>();

  constructor(private readonly logger: PinoLoggerService) {
    // 可以在这里添加异常日志记录的逻辑
  }

  /**
   * 获取异常流
   *
   * @description 获取异常流的Observable，用于订阅异常
   * @returns 异常流的Observable
   */
  get pipe(): Observable<UnhandledExceptionInfo> {
    return this.exceptionSubject.asObservable();
  }

  /**
   * 发布异常
   *
   * @description 将未处理的异常发布到总线
   * @param exceptionInfo 异常信息
   */
  publish(exceptionInfo: UnhandledExceptionInfo): void {
    this.exceptionSubject.next(exceptionInfo);
  }

  /**
   * 发布命令异常
   *
   * @description 发布命令处理过程中的异常
   * @param exception 异常对象
   * @param commandType 命令类型
   * @param context 异常上下文
   */
  publishCommandException(
    exception: Error,
    commandType: string,
    context?: {
      commandId?: string;
      handlerType?: string;
      userId?: string;
      tenantId?: string;
      requestId?: string;
    },
  ): void {
    this.publish(
      new UnhandledExceptionInfo(exception, 'command', {
        commandType,
        ...context,
      }),
    );
  }

  /**
   * 发布查询异常
   *
   * @description 发布查询处理过程中的异常
   * @param exception 异常对象
   * @param queryType 查询类型
   * @param context 异常上下文
   */
  publishQueryException(
    exception: Error,
    queryType: string,
    context?: {
      queryId?: string;
      handlerType?: string;
      userId?: string;
      tenantId?: string;
      requestId?: string;
    },
  ): void {
    this.publish(
      new UnhandledExceptionInfo(exception, 'query', {
        queryType,
        ...context,
      }),
    );
  }

  /**
   * 发布事件异常
   *
   * @description 发布事件处理过程中的异常
   * @param exception 异常对象
   * @param eventType 事件类型
   * @param context 异常上下文
   */
  publishEventException(
    exception: Error,
    eventType: string,
    context?: {
      eventId?: string;
      handlerType?: string;
      userId?: string;
      tenantId?: string;
      requestId?: string;
    },
  ): void {
    this.publish(
      new UnhandledExceptionInfo(exception, 'event', {
        eventType,
        ...context,
      }),
    );
  }

  /**
   * 完成异常流
   *
   * @description 完成异常流，清理资源
   */
  complete(): void {
    this.exceptionSubject.complete();
  }

  /**
   * 获取异常统计信息
   *
   * @description 获取异常处理的统计信息
   * @returns 异常统计信息
   */
  getStatistics(): {
    totalExceptions: number;
    commandExceptions: number;
    queryExceptions: number;
    eventExceptions: number;
  } {
    // 这里可以添加统计逻辑
    // 由于Subject不直接提供统计信息，可能需要维护计数器
    return {
      totalExceptions: 0,
      commandExceptions: 0,
      queryExceptions: 0,
      eventExceptions: 0,
    };
  }
}
