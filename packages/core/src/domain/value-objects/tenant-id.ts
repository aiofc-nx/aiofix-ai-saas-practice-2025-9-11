import { ValueObject } from '../../shared/types/value-object';

/**
 * UUID v4正则表达式
 * 用于验证UUID格式的正确性
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 租户标识符值对象
 *
 * 租户标识符是多租户架构中的核心概念，用于唯一标识租户。
 * 租户是SAAS平台中的独立客户单位，拥有独立的数据空间和配置环境。
 *
 * @description 提供租户标识符的封装和验证，确保租户ID的唯一性和有效性
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * 租户标识符值对象
 *
 * @description 封装租户的唯一标识符，使用UUID v4格式
 * 提供类型安全的租户ID操作和验证功能
 *
 * @example
 * ```typescript
 * // 创建新的租户ID
 * const tenantId = TenantId.generate();
 *
 * // 从字符串创建租户ID
 * const tenantId2 = TenantId.fromString('123e4567-e89b-12d3-a456-426614174000');
 *
 * // 比较两个租户ID
 * const isEqual = tenantId.equals(tenantId2);
 *
 * // 获取租户ID字符串值
 * const idString = tenantId.toString();
 * ```
 */
export class TenantId extends ValueObject<string> {
  private readonly _value: string;

  /**
   * 构造函数
   *
   * @description 创建租户标识符实例
   * @param value UUID字符串值
   * @throws {Error} 当提供的值不是有效的UUID v4格式时
   *
   * @example
   * ```typescript
   * const tenantId = new TenantId('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  private constructor(value: string) {
    super();
    this.validate(value);
    this._value = value;
  }

  /**
   * 生成新的租户标识符
   *
   * @description 生成一个全新的UUID v4格式的租户标识符
   * @returns 新生成的租户标识符实例
   *
   * @example
   * ```typescript
   * const newTenantId = TenantId.generate();
   * console.log(newTenantId.toString()); // 输出新的UUID字符串
   * ```
   */
  public static generate(): TenantId {
    // 使用crypto.randomUUID()生成UUID v4
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return new TenantId(crypto.randomUUID());
    }

    // 降级方案：使用Math.random()生成UUID v4
    return new TenantId(this.generateUUIDv4());
  }

  /**
   * 从字符串创建租户标识符
   *
   * @description 从现有的UUID字符串创建租户标识符实例
   * @param value UUID字符串
   * @returns 租户标识符实例
   * @throws {Error} 当提供的值不是有效的UUID v4格式时
   *
   * @example
   * ```typescript
   * const tenantId = TenantId.fromString('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  public static fromString(value: string): TenantId {
    return new TenantId(value);
  }

  /**
   * 验证UUID格式
   *
   * @description 验证提供的字符串是否为有效的UUID v4格式
   * @param value 要验证的字符串
   * @returns 是否为有效的UUID v4格式
   *
   * @example
   * ```typescript
   * const isValid = TenantId.isValid('123e4567-e89b-12d3-a456-426614174000');
   * console.log(isValid); // true
   * ```
   */
  public static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    return UUID_V4_REGEX.test(value);
  }

  /**
   * 获取租户标识符的值
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
      throw new Error('TenantId value must be a non-empty string');
    }

    if (!this.isValidUUIDv4(value)) {
      throw new Error(
        `Invalid TenantId format: ${value}. Must be a valid UUID v4.`
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
