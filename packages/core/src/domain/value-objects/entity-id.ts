import { ValueObject } from '../../shared/types/value-object';

/**
 * 实体标识符值对象
 *
 * 实体标识符是领域驱动设计中的核心概念，用于唯一标识实体对象。
 * 使用UUID v4格式确保全局唯一性和安全性。
 *
 * @description 提供实体标识符的封装和验证，确保ID的唯一性和有效性
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * UUID v4正则表达式
 * 用于验证UUID格式的正确性
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 实体标识符值对象
 *
 * @description 封装实体的唯一标识符，使用UUID v4格式
 * 提供类型安全的ID操作和验证功能
 *
 * @example
 * ```typescript
 * // 创建新的实体ID
 * const entityId = EntityId.generate();
 *
 * // 从字符串创建实体ID
 * const entityId2 = EntityId.fromString('123e4567-e89b-12d3-a456-426614174000');
 *
 * // 比较两个实体ID
 * const isEqual = entityId.equals(entityId2);
 *
 * // 获取ID字符串值
 * const idString = entityId.toString();
 * ```
 */
export class EntityId extends ValueObject<string> {
  private readonly _value: string;

  /**
   * 构造函数
   *
   * @description 创建实体标识符实例
   * @param value UUID字符串值
   * @throws {Error} 当提供的值不是有效的UUID v4格式时
   *
   * @example
   * ```typescript
   * const entityId = new EntityId('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  private constructor(value: string) {
    super();
    this.validate(value);
    this._value = value;
  }

  /**
   * 生成新的实体标识符
   *
   * @description 生成一个全新的UUID v4格式的实体标识符
   * @returns 新生成的实体标识符实例
   *
   * @example
   * ```typescript
   * const newId = EntityId.generate();
   * console.log(newId.toString()); // 输出新的UUID字符串
   * ```
   */
  public static generate(): EntityId {
    // 使用crypto.randomUUID()生成UUID v4
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return new EntityId(crypto.randomUUID());
    }

    // 降级方案：使用Math.random()生成UUID v4
    return new EntityId(this.generateUUIDv4());
  }

  /**
   * 从字符串创建实体标识符
   *
   * @description 从现有的UUID字符串创建实体标识符实例
   * @param value UUID字符串
   * @returns 实体标识符实例
   * @throws {Error} 当提供的值不是有效的UUID v4格式时
   *
   * @example
   * ```typescript
   * const entityId = EntityId.fromString('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  public static fromString(value: string): EntityId {
    return new EntityId(value);
  }

  /**
   * 获取实体标识符的值
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
      throw new Error('EntityId value must be a non-empty string');
    }

    if (!UUID_V4_REGEX.test(value)) {
      throw new Error(
        `Invalid EntityId format: ${value}. Must be a valid UUID v4.`
      );
    }
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
