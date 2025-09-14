import { ValueObject } from '../../shared/types/value-object';

/**
 * 用户标识符值对象
 *
 * 用户标识符是用户管理中的核心概念，用于唯一标识用户。
 * 用户是SAAS平台的使用者，是系统中最基本的身份单位。
 *
 * @description 提供用户标识符的封装和验证，确保用户ID的唯一性和有效性
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * 用户标识符值对象
 *
 * @description 封装用户的唯一标识符，使用UUID v4格式
 * 提供类型安全的用户ID操作和验证功能
 *
 * @example
 * ```typescript
 * // 创建新的用户ID
 * const userId = UserId.generate();
 *
 * // 从字符串创建用户ID
 * const userId2 = UserId.fromString('123e4567-e89b-12d3-a456-426614174000');
 *
 * // 比较两个用户ID
 * const isEqual = userId.equals(userId2);
 *
 * // 获取用户ID字符串值
 * const idString = userId.toString();
 * ```
 */
export class UserId extends ValueObject<string> {
  private readonly _value: string;

  /**
   * 构造函数
   *
   * @description 创建用户标识符实例
   * @param value UUID字符串值
   * @throws {Error} 当提供的值不是有效的UUID v4格式时
   *
   * @example
   * ```typescript
   * const userId = new UserId('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  private constructor(value: string) {
    super();
    this.validate(value);
    this._value = value;
  }

  /**
   * 生成新的用户标识符
   *
   * @description 生成一个全新的UUID v4格式的用户标识符
   * @returns 新生成的用户标识符实例
   *
   * @example
   * ```typescript
   * const newUserId = UserId.generate();
   * console.log(newUserId.toString()); // 输出新的UUID字符串
   * ```
   */
  public static generate(): UserId {
    // 使用crypto.randomUUID()生成UUID v4
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return new UserId(crypto.randomUUID());
    }

    // 降级方案：使用Math.random()生成UUID v4
    return new UserId(this.generateUUIDv4());
  }

  /**
   * 从字符串创建用户标识符
   *
   * @description 从现有的UUID字符串创建用户标识符实例
   * @param value UUID字符串
   * @returns 用户标识符实例
   * @throws {Error} 当提供的值不是有效的UUID v4格式时
   *
   * @example
   * ```typescript
   * const userId = UserId.fromString('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  public static fromString(value: string): UserId {
    return new UserId(value);
  }

  /**
   * 获取用户标识符的值
   *
   * @description 返回值对象的实际UUID字符串值
   * @returns UUID字符串值
   */
  protected getValue(): string {
    return this._value;
  }

  /**
   * 验证UUID格式
   *
   * @description 验证提供的字符串是否为有效的UUID v4格式
   * @param value 要验证的字符串
   * @throws {Error} 当值不是有效的UUID v4格式时
   *
   * @private
   */
  private validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('UserId value must be a non-empty string');
    }

    if (!this.isValidUUIDv4(value)) {
      throw new Error(
        `Invalid UserId format: ${value}. Must be a valid UUID v4.`
      );
    }
  }

  /**
   * 验证UUID v4格式
   *
   * @description 检查字符串是否符合UUID v4格式规范
   * @param value 要验证的字符串
   * @returns 如果是有效的UUID v4格式则返回true，否则返回false
   *
   * @private
   */
  private isValidUUIDv4(value: string): boolean {
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(value);
  }

  /**
   * 生成UUID v4（降级方案）
   *
   * @description 当crypto.randomUUID()不可用时使用的降级方案
   * @returns 生成的UUID v4字符串
   *
   * @private
   */
  private static generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}
