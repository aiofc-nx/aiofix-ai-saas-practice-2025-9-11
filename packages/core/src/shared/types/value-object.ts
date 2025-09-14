/**
 * 值对象基类
 *
 * 值对象是领域驱动设计中的核心概念，表示没有身份标识的领域概念。
 * 值对象通过其属性值来定义相等性，而不是通过身份标识。
 *
 * @description 提供值对象的基础实现，包括相等性比较、不变性保证等核心功能
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * 值对象基类
 *
 * @description 所有值对象都应该继承此类，确保值对象的基本行为一致
 * @template T 值对象的类型参数，用于类型安全的相等性比较
 *
 * @example
 * ```typescript
 * class Email extends ValueObject<string> {
 *   constructor(private readonly value: string) {
 *     super();
 *     this.validate(value);
 *   }
 *
 *   private validate(value: string): void {
 *     if (!value || !value.includes('@')) {
 *       throw new Error('Invalid email format');
 *     }
 *   }
 *
 *   getValue(): string {
 *     return this.value;
 *   }
 * }
 * ```
 */
export abstract class ValueObject<T> {
  /**
   * 比较两个值对象是否相等
   *
   * @description 值对象的相等性基于其属性值，而不是对象引用
   * @param other 要比较的另一个值对象
   * @returns 如果两个值对象相等则返回true，否则返回false
   *
   * @example
   * ```typescript
   * const email1 = new Email('user@example.com');
   * const email2 = new Email('user@example.com');
   * console.log(email1.equals(email2)); // true
   * ```
   */
  public equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return this.getValue() === other.getValue();
  }

  /**
   * 获取值对象的实际值
   *
   * @description 子类必须实现此方法，返回值对象的实际值
   * @returns 值对象的实际值
   *
   * @throws {Error} 如果子类没有实现此方法
   */
  protected abstract getValue(): T;

  /**
   * 转换为字符串表示
   *
   * @description 提供值对象的字符串表示，便于调试和日志记录
   * @returns 值对象的字符串表示
   */
  public toString(): string {
    return String(this.getValue());
  }

  /**
   * 转换为JSON表示
   *
   * @description 提供值对象的JSON序列化支持
   * @returns 值对象的JSON表示
   */
  public toJSON(): T {
    return this.getValue();
  }
}
