/**
 * 通用类型定义
 *
 * 提供Core模块中使用的通用类型定义，包括结果类型、分页类型、
 * 时间戳类型等基础类型，确保类型安全和代码一致性。
 *
 * @description 通用类型定义，提供Core模块的基础类型支持
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * 结果类型
 *
 * @description 表示操作结果的通用类型，支持成功和失败两种情况
 * @template T 成功时的数据类型
 * @template E 失败时的错误类型，默认为Error
 *
 * @example
 * ```typescript
 * // 成功结果
 * const successResult: Result<string> = Result.success('操作成功');
 *
 * // 失败结果
 * const failureResult: Result<string> = Result.failure(new Error('操作失败'));
 *
 * // 检查结果
 * if (result.isSuccess()) {
 *   console.log(result.getValue()); // 获取成功值
 * } else {
 *   console.error(result.getError()); // 获取错误信息
 * }
 * ```
 */
export type Result<T, E = Error> = SuccessResult<T> | FailureResult<E>;

/**
 * 成功结果类型
 *
 * @description 表示操作成功的结果类型
 * @template T 成功时的数据类型
 */
export interface SuccessResult<T> {
  readonly isSuccess: true;
  readonly isFailure: false;
  readonly value: T;
  readonly error: never;
}

/**
 * 失败结果类型
 *
 * @description 表示操作失败的结果类型
 * @template E 失败时的错误类型
 */
export interface FailureResult<E> {
  readonly isSuccess: false;
  readonly isFailure: true;
  readonly value: never;
  readonly error: E;
}

/**
 * 结果工具类
 *
 * @description 提供创建和处理Result类型的静态方法
 */
export class Result {
  /**
   * 创建成功结果
   *
   * @description 创建一个表示操作成功的结果对象
   * @param value 成功时的数据值
   * @returns 成功结果对象
   *
   * @example
   * ```typescript
   * const result = Result.success('操作成功');
   * console.log(result.isSuccess); // true
   * console.log(result.value); // '操作成功'
   * ```
   */
  public static success<T>(value: T): SuccessResult<T> {
    return {
      isSuccess: true,
      isFailure: false,
      value,
      error: undefined as never,
    };
  }

  /**
   * 创建失败结果
   *
   * @description 创建一个表示操作失败的结果对象
   * @param error 失败时的错误对象
   * @returns 失败结果对象
   *
   * @example
   * ```typescript
   * const result = Result.failure(new Error('操作失败'));
   * console.log(result.isFailure); // true
   * console.log(result.error.message); // '操作失败'
   * ```
   */
  public static failure<E>(error: E): FailureResult<E> {
    return {
      isSuccess: false,
      isFailure: true,
      value: undefined as never,
      error,
    };
  }
}

/**
 * 分页参数接口
 *
 * @description 定义分页查询的参数结构
 *
 * @example
 * ```typescript
 * const paginationParams: PaginationParams = {
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * };
 * ```
 */
export interface PaginationParams {
  /** 页码，从1开始 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页结果接口
 *
 * @description 定义分页查询的结果结构
 * @template T 数据项的类型
 *
 * @example
 * ```typescript
 * const paginatedResult: PaginatedResult<User> = {
 *   data: [user1, user2, user3],
 *   pagination: {
 *     page: 1,
 *     limit: 20,
 *     total: 100,
 *     totalPages: 5,
 *     hasNext: true,
 *     hasPrev: false
 *   }
 * };
 * ```
 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  data: T[];
  /** 分页信息 */
  pagination: PaginationInfo;
}

/**
 * 分页信息接口
 *
 * @description 定义分页的详细信息结构
 *
 * @example
 * ```typescript
 * const paginationInfo: PaginationInfo = {
 *   page: 1,
 *   limit: 20,
 *   total: 100,
 *   totalPages: 5,
 *   hasNext: true,
 *   hasPrev: false
 * };
 * ```
 */
export interface PaginationInfo {
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 时间戳类型
 *
 * @description 表示时间戳的类型，使用Date对象
 *
 * @example
 * ```typescript
 * const timestamp: Timestamp = new Date();
 * console.log(timestamp.toISOString()); // 输出ISO格式的时间字符串
 * ```
 */
export type Timestamp = Date;

/**
 * 可选类型
 *
 * @description 表示可能为null或undefined的类型
 * @template T 基础类型
 *
 * @example
 * ```typescript
 * let optionalString: Optional<string> = 'hello';
 * optionalString = null;
 * optionalString = undefined;
 * ```
 */
export type Optional<T> = T | null | undefined;

/**
 * 非空类型
 *
 * @description 表示非null且非undefined的类型
 * @template T 基础类型
 *
 * @example
 * ```typescript
 * const nonNullString: NonNullable<string> = 'hello'; // 不能为null或undefined
 * ```
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 深度可选类型
 *
 * @description 将对象的所有属性都设为可选
 * @template T 对象类型
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * type PartialUser = DeepPartial<User>;
 * // 等同于: { id?: string; name?: string; email?: string; }
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度只读类型
 *
 * @description 将对象的所有属性都设为只读
 * @template T 对象类型
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * type ReadonlyUser = DeepReadonly<User>;
 * // 等同于: { readonly id: string; readonly name: string; readonly email: string; }
 * ```
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
