import 'reflect-metadata';

/**
 * 事件处理器装饰器
 *
 * 标记一个类为事件处理器，用于自动注册到事件总线。
 * 这是CQRS模式的核心装饰器，简化事件处理器的注册和管理。
 *
 * @description 事件处理器装饰器，自动注册事件处理器到事件总线
 *
 * ## 业务规则
 *
 * ### 装饰器规则
 * - 只能用于实现了IEventHandler接口的类
 * - 自动从类的泛型参数推断事件类型
 * - 支持依赖注入和自动注册
 * - 提供类型安全的事件处理
 *
 * ### 注册规则
 * - 装饰器会在模块初始化时自动注册处理器
 * - 一个事件类型可以有多个处理器
 * - 支持处理器的动态注册和注销
 * - 提供处理器的生命周期管理
 *
 * ### 处理规则
 * - 支持异步事件处理
 * - 支持事件处理的优先级控制
 * - 支持事件处理的错误处理和重试
 * - 提供事件处理的性能监控
 *
 * ## 业务逻辑流程
 *
 * 1. **类标记**：使用@EventHandler装饰器标记处理类
 * 2. **类型推断**：从泛型参数自动推断事件类型
 * 3. **自动注册**：在模块初始化时自动注册到事件总线
 * 4. **依赖注入**：支持处理器的依赖注入
 * 5. **事件处理**：自动路由事件到对应的处理器
 * 6. **并发处理**：支持多个处理器的并发执行
 *
 * @param event 事件类型构造函数
 * @param options 装饰器选项
 * @returns 类装饰器
 *
 * @example
 * ```typescript
 * @EventHandler(UserCreatedEvent, {
 *   priority: 1,
 *   async: true,
 *   retry: true
 * })
 * export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
 *   constructor(
 *     private readonly emailService: IEmailService,
 *     private readonly notificationService: INotificationService
 *   ) {}
 *
 *   async handle(event: UserCreatedEvent): Promise<void> {
 *     // 发送欢迎邮件
 *     await this.emailService.sendWelcomeEmail(event.userId, event.userData.email);
 *
 *     // 发送通知
 *     await this.notificationService.notifyUserCreated(event.userId);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function EventHandler<TEvent>(
  event: new (...args: any[]) => TEvent,
  options?: {
    priority?: number;
    async?: boolean;
    retry?: boolean;
    maxRetries?: number;
    timeout?: number;
  }
): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    // 设置元数据，标记这是一个事件处理器
    Reflect.defineMetadata('event-handler', event, target);

    // 设置处理器的事件类型
    Reflect.defineMetadata('event-type', event.name, target);

    // 设置处理器的优先级（默认为0）
    const priority = options?.priority || 0;
    Reflect.defineMetadata('priority', priority, target);

    // 设置处理器的异步标志（默认为true）
    const async = options?.async ?? true;
    Reflect.defineMetadata('async', async, target);

    // 设置重试选项
    const retry = options?.retry ?? false;
    Reflect.defineMetadata('retry', retry, target);

    const maxRetries = options?.maxRetries || 3;
    Reflect.defineMetadata('max-retries', maxRetries, target);

    // 设置超时时间（毫秒）
    const timeout = options?.timeout || 30000; // 默认30秒
    Reflect.defineMetadata('timeout', timeout, target);

    return target;
  };
}

/**
 * 获取事件处理器的元数据
 *
 * @description 获取事件处理器的元数据信息
 * @param target 目标类
 * @returns 事件处理器元数据
 */
export function getEventHandlerMetadata(target: Function): {
  eventType: new (...args: any[]) => any;
  eventTypeName: string;
  priority: number;
  async: boolean;
  retry: boolean;
  maxRetries: number;
  timeout: number;
} | null {
  const eventType = Reflect.getMetadata('event-handler', target);
  if (!eventType) {
    return null;
  }

  return {
    eventType,
    eventTypeName: Reflect.getMetadata('event-type', target),
    priority: Reflect.getMetadata('priority', target) || 0,
    async: Reflect.getMetadata('async', target) ?? true,
    retry: Reflect.getMetadata('retry', target) ?? false,
    maxRetries: Reflect.getMetadata('max-retries', target) || 3,
    timeout: Reflect.getMetadata('timeout', target) || 30000,
  };
}

/**
 * 检查类是否为事件处理器
 *
 * @description 检查指定的类是否被标记为事件处理器
 * @param target 目标类
 * @returns 是否为事件处理器
 */
export function isEventHandler(target: Function): boolean {
  return Reflect.hasMetadata('event-handler', target);
}
