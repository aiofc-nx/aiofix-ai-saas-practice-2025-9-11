/**
 * 异常类导出文件
 *
 * @description 导出所有异常类，提供统一的导入接口
 * @author Core Team
 * @version 1.0.0
 * @since 1.0.0
 */

export { BaseException } from './base.exception';

// CQRS异常
export * from './cqrs-exceptions';
export * from './unhandled-exception-bus';
