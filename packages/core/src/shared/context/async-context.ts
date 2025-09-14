import { randomUUID } from 'crypto';

/**
 * 异步上下文
 *
 * 用于在异步操作中传递上下文信息，确保请求级别的数据隔离和传递。
 * 支持依赖注入、请求追踪、用户身份验证等场景。
 *
 * @description 异步上下文管理器，提供请求级别的数据隔离和传递功能
 *
 * ## 业务规则
 *
 * ### 上下文生命周期规则
 * - 每个上下文都有唯一的标识符
 * - 上下文可以附加到对象上，实现数据传递
 * - 上下文支持嵌套和继承关系
 * - 上下文在请求结束时自动清理
 *
 * ### 数据隔离规则
 * - 不同上下文之间的数据完全隔离
 * - 上下文数据只在当前异步操作中可见
 * - 支持跨异步边界的上下文传递
 * - 提供类型安全的数据访问
 *
 * ### 依赖注入规则
 * - 支持基于上下文的依赖注入
 * - 每个上下文都有独立的依赖容器
 * - 支持请求级别的服务实例管理
 * - 提供服务的生命周期管理
 *
 * ## 业务逻辑流程
 *
 * 1. **上下文创建**：创建新的异步上下文实例
 * 2. **数据附加**：将上下文附加到对象上
 * 3. **上下文传递**：在异步操作中传递上下文
 * 4. **数据访问**：通过上下文访问请求级别数据
 * 5. **上下文清理**：在请求结束时清理上下文
 *
 * @example
 * ```typescript
 * // 创建异步上下文
 * const context = new AsyncContext();
 *
 * // 附加上下文到对象
 * context.attachTo(command);
 *
 * // 获取对象的上下文
 * const attachedContext = AsyncContext.of(command);
 *
 * // 检查是否已附加上下文
 * const isAttached = AsyncContext.isAttached(command);
 *
 * // 设置上下文数据
 * context.set('userId', 'user-123');
 * context.set('tenantId', 'tenant-456');
 *
 * // 获取上下文数据
 * const userId = context.get('userId');
 * ```
 *
 * @since 1.0.0
 */
export class AsyncContext {
  private readonly _id: string;
  private readonly _data: Map<string, any> = new Map();
  private readonly _createdAt: Date;
  private _parent?: AsyncContext;

  /**
   * 构造函数
   *
   * @param id 上下文标识符，如果不提供则自动生成
   * @param parent 父级上下文，用于实现上下文继承
   */
  constructor(id?: string, parent?: AsyncContext) {
    this._id = id || randomUUID();
    this._createdAt = new Date();
    this._parent = parent;
  }

  /**
   * 获取上下文标识符
   *
   * @description 获取上下文的唯一标识符
   * @returns 上下文标识符
   */
  get id(): string {
    return this._id;
  }

  /**
   * 获取创建时间
   *
   * @description 获取上下文的创建时间
   * @returns 创建时间
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * 获取父级上下文
   *
   * @description 获取父级上下文，用于实现上下文继承
   * @returns 父级上下文，如果没有则返回undefined
   */
  get parent(): AsyncContext | undefined {
    return this._parent;
  }

  /**
   * 设置上下文数据
   *
   * @description 在当前上下文中设置键值对数据
   * @param key 数据键
   * @param value 数据值
   */
  set<T>(key: string, value: T): void {
    this._data.set(key, value);
  }

  /**
   * 获取上下文数据
   *
   * @description 从当前上下文获取数据，如果不存在则从父级上下文查找
   * @param key 数据键
   * @returns 数据值，如果不存在则返回undefined
   */
  get<T>(key: string): T | undefined {
    const value = this._data.get(key);
    if (value !== undefined) {
      return value;
    }

    // 从父级上下文查找
    if (this._parent) {
      return this._parent.get<T>(key);
    }

    return undefined;
  }

  /**
   * 检查是否包含指定键
   *
   * @description 检查当前上下文是否包含指定键的数据
   * @param key 数据键
   * @returns 如果包含则返回true，否则返回false
   */
  has(key: string): boolean {
    return this._data.has(key) || (this._parent?.has(key) ?? false);
  }

  /**
   * 删除上下文数据
   *
   * @description 从当前上下文删除指定键的数据
   * @param key 数据键
   * @returns 如果删除成功则返回true，否则返回false
   */
  delete(key: string): boolean {
    return this._data.delete(key);
  }

  /**
   * 清空上下文数据
   *
   * @description 清空当前上下文的所有数据
   */
  clear(): void {
    this._data.clear();
  }

  /**
   * 获取所有数据键
   *
   * @description 获取当前上下文的所有数据键
   * @returns 数据键数组
   */
  keys(): string[] {
    const currentKeys = Array.from(this._data.keys());
    const parentKeys = this._parent?.keys() || [];
    return [...new Set([...currentKeys, ...parentKeys])];
  }

  /**
   * 获取所有数据
   *
   * @description 获取当前上下文的所有数据，包括父级上下文的数据
   * @returns 数据对象
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};

    // 先获取父级上下文的数据
    if (this._parent) {
      Object.assign(result, this._parent.getAll());
    }

    // 再获取当前上下文的数据（会覆盖父级的数据）
    for (const [key, value] of this._data) {
      result[key] = value;
    }

    return result;
  }

  /**
   * 附加上下文到对象
   *
   * @description 将当前上下文附加到指定对象上，用于后续的上下文获取
   * @param target 目标对象
   */
  attachTo(target: any): void {
    if (!target) {
      return;
    }

    // 使用Symbol作为属性键，避免与对象的其他属性冲突
    const contextSymbol = Symbol.for('AsyncContext');
    target[contextSymbol] = this;
  }

  /**
   * 从对象获取上下文
   *
   * @description 从指定对象获取附加的异步上下文
   * @param target 目标对象
   * @returns 异步上下文，如果没有则返回undefined
   */
  static of(target: any): AsyncContext | undefined {
    if (!target) {
      return undefined;
    }

    const contextSymbol = Symbol.for('AsyncContext');
    return target[contextSymbol];
  }

  /**
   * 检查对象是否已附加上下文
   *
   * @description 检查指定对象是否已经附加了异步上下文
   * @param target 目标对象
   * @returns 如果已附加则返回true，否则返回false
   */
  static isAttached(target: any): boolean {
    return this.of(target) !== undefined;
  }

  /**
   * 创建子上下文
   *
   * @description 创建当前上下文的子上下文，实现上下文继承
   * @param id 子上下文标识符，如果不提供则自动生成
   * @returns 子上下文实例
   */
  createChild(id?: string): AsyncContext {
    return new AsyncContext(id, this);
  }

  /**
   * 合并上下文数据
   *
   * @description 将另一个上下文的数据合并到当前上下文
   * @param other 要合并的上下文
   * @param overwrite 是否覆盖已存在的键，默认为true
   */
  merge(other: AsyncContext, overwrite: boolean = true): void {
    const otherData = other.getAll();

    for (const [key, value] of Object.entries(otherData)) {
      if (overwrite || !this.has(key)) {
        this.set(key, value);
      }
    }
  }

  /**
   * 克隆上下文
   *
   * @description 创建当前上下文的克隆，包括所有数据
   * @returns 克隆的上下文实例
   */
  clone(): AsyncContext {
    const cloned = new AsyncContext(undefined, this._parent);

    // 复制当前上下文的数据
    for (const [key, value] of this._data) {
      cloned.set(key, value);
    }

    return cloned;
  }

  /**
   * 获取上下文的字符串表示
   *
   * @description 获取上下文的字符串表示，用于调试和日志
   * @returns 上下文的字符串表示
   */
  toString(): string {
    return `AsyncContext(id=${this._id}, dataCount=${
      this._data.size
    }, parent=${!!this._parent})`;
  }

  /**
   * 获取上下文的JSON表示
   *
   * @description 获取上下文的JSON表示，用于序列化
   * @returns 上下文的JSON表示
   */
  toJSON(): any {
    return {
      id: this._id,
      createdAt: this._createdAt.toISOString(),
      data: this.getAll(),
      parentId: this._parent?.id,
    };
  }
}
