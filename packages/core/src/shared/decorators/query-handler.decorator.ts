import 'reflect-metadata';

/**
 * 查询处理器装饰器
 *
 * 标记一个类为查询处理器，用于自动注册到查询总线。
 * 这是CQRS模式的核心装饰器，简化查询处理器的注册和管理。
 *
 * @description 查询处理器装饰器，自动注册查询处理器到查询总线
 *
 * ## 业务规则
 *
 * ### 装饰器规则
 * - 只能用于实现了IQueryHandler接口的类
 * - 自动从类的泛型参数推断查询类型
 * - 支持依赖注入和自动注册
 * - 提供类型安全的查询处理
 *
 * ### 注册规则
 * - 装饰器会在模块初始化时自动注册处理器
 * - 一个查询类型只能有一个处理器
 * - 支持处理器的动态注册和注销
 * - 提供处理器的生命周期管理
 *
 * ### 缓存规则
 * - 支持查询结果的自动缓存
 * - 可配置缓存策略和过期时间
 * - 支持缓存失效和清除
 * - 提供缓存性能监控
 *
 * ## 业务逻辑流程
 *
 * 1. **类标记**：使用@QueryHandler装饰器标记处理类
 * 2. **类型推断**：从泛型参数自动推断查询类型
 * 3. **自动注册**：在模块初始化时自动注册到查询总线
 * 4. **依赖注入**：支持处理器的依赖注入
 * 5. **查询处理**：自动路由查询到对应的处理器
 * 6. **结果缓存**：支持查询结果的自动缓存
 *
 * @param query 查询类型构造函数
 * @param options 装饰器选项
 * @returns 类装饰器
 *
 * @example
 * ```typescript
 * @QueryHandler(GetUserByIdQuery, {
 *   cache: true,
 *   cacheTtl: 300000, // 5分钟缓存
 *   priority: 1
 * })
 * export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery, User> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly cacheService: ICacheService
 *   ) {}
 *
 *   async handle(query: GetUserByIdQuery): Promise<ResultType<User>> {
 *     // 处理查询用户命令
 *     const user = await this.userRepository.findById(query.userId);
 *
 *     if (!user) {
 *       return Result.failure(new Error('User not found'));
 *     }
 *
 *     return Result.success(user);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function QueryHandler<TQuery>(
  query: new (...args: any[]) => TQuery,
  options?: {
    cache?: boolean;
    cacheTtl?: number;
    priority?: number;
    async?: boolean;
  }
): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    // 设置元数据，标记这是一个查询处理器
    Reflect.defineMetadata('query-handler', query, target);

    // 设置处理器的查询类型
    Reflect.defineMetadata('query-type', query.name, target);

    // 设置处理器的优先级（默认为0）
    const priority = options?.priority || 0;
    Reflect.defineMetadata('priority', priority, target);

    // 设置处理器的异步标志（默认为true）
    const async = options?.async ?? true;
    Reflect.defineMetadata('async', async, target);

    // 设置缓存选项
    const cache = options?.cache ?? false;
    Reflect.defineMetadata('cache', cache, target);

    const cacheTtl = options?.cacheTtl || 300000; // 默认5分钟
    Reflect.defineMetadata('cache-ttl', cacheTtl, target);

    return target;
  };
}

/**
 * 获取查询处理器的元数据
 *
 * @description 获取查询处理器的元数据信息
 * @param target 目标类
 * @returns 查询处理器元数据
 */
export function getQueryHandlerMetadata(target: Function): {
  queryType: new (...args: any[]) => any;
  queryTypeName: string;
  priority: number;
  async: boolean;
  cache: boolean;
  cacheTtl: number;
} | null {
  const queryType = Reflect.getMetadata('query-handler', target);
  if (!queryType) {
    return null;
  }

  return {
    queryType,
    queryTypeName: Reflect.getMetadata('query-type', target),
    priority: Reflect.getMetadata('priority', target) || 0,
    async: Reflect.getMetadata('async', target) ?? true,
    cache: Reflect.getMetadata('cache', target) ?? false,
    cacheTtl: Reflect.getMetadata('cache-ttl', target) || 300000,
  };
}

/**
 * 检查类是否为查询处理器
 *
 * @description 检查指定的类是否被标记为查询处理器
 * @param target 目标类
 * @returns 是否为查询处理器
 */
export function isQueryHandler(target: Function): boolean {
  return Reflect.hasMetadata('query-handler', target);
}
