import 'reflect-metadata';

/**
 * 命令处理器装饰器
 *
 * 标记一个类为命令处理器，用于自动注册到命令总线。
 * 这是CQRS模式的核心装饰器，简化命令处理器的注册和管理。
 *
 * @description 命令处理器装饰器，自动注册命令处理器到命令总线
 *
 * ## 业务规则
 *
 * ### 装饰器规则
 * - 只能用于实现了ICommandHandler接口的类
 * - 自动从类的泛型参数推断命令类型
 * - 支持依赖注入和自动注册
 * - 提供类型安全的命令处理
 *
 * ### 注册规则
 * - 装饰器会在模块初始化时自动注册处理器
 * - 一个命令类型只能有一个处理器
 * - 支持处理器的动态注册和注销
 * - 提供处理器的生命周期管理
 *
 * ## 业务逻辑流程
 *
 * 1. **类标记**：使用@CommandHandler装饰器标记处理类
 * 2. **类型推断**：从泛型参数自动推断命令类型
 * 3. **自动注册**：在模块初始化时自动注册到命令总线
 * 4. **依赖注入**：支持处理器的依赖注入
 * 5. **命令处理**：自动路由命令到对应的处理器
 *
 * @param command 命令类型构造函数
 * @returns 类装饰器
 *
 * @example
 * ```typescript
 * @CommandHandler(CreateUserCommand)
 * export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand, User> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly eventBus: IEventBus
 *   ) {}
 *
 *   async handle(command: CreateUserCommand): Promise<ResultType<User>> {
 *     // 处理创建用户命令
 *     const user = await this.userRepository.create(command.userData);
 *
 *     // 发布用户创建事件
 *     await this.eventBus.publish(new UserCreatedEvent(user.getId(), user));
 *
 *     return Result.success(user);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function CommandHandler<TCommand>(
  command: new (...args: any[]) => TCommand
): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    // 设置元数据，标记这是一个命令处理器
    Reflect.defineMetadata('command-handler', command, target);

    // 设置处理器的命令类型
    Reflect.defineMetadata('command-type', command.name, target);

    // 设置处理器的优先级（默认为0）
    const priority = Reflect.getMetadata('priority', target) || 0;
    Reflect.defineMetadata('priority', priority, target);

    // 设置处理器的异步标志（默认为true）
    const async = Reflect.getMetadata('async', target) ?? true;
    Reflect.defineMetadata('async', async, target);

    return target;
  };
}

/**
 * 获取命令处理器的元数据
 *
 * @description 获取命令处理器的元数据信息
 * @param target 目标类
 * @returns 命令处理器元数据
 */
export function getCommandHandlerMetadata(target: Function): {
  commandType: new (...args: any[]) => any;
  commandTypeName: string;
  priority: number;
  async: boolean;
} | null {
  const commandType = Reflect.getMetadata('command-handler', target);
  if (!commandType) {
    return null;
  }

  return {
    commandType,
    commandTypeName: Reflect.getMetadata('command-type', target),
    priority: Reflect.getMetadata('priority', target) || 0,
    async: Reflect.getMetadata('async', target) ?? true,
  };
}

/**
 * 检查类是否为命令处理器
 *
 * @description 检查指定的类是否被标记为命令处理器
 * @param target 目标类
 * @returns 是否为命令处理器
 */
export function isCommandHandler(target: Function): boolean {
  return Reflect.hasMetadata('command-handler', target);
}
