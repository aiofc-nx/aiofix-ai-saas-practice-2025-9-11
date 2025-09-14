/**
 * Aiofix日志模块
 *
 * 提供统一的日志记录功能，包括：
 * - 多级别日志记录（debug, info, warn, error）
 * - 日志格式化
 * - 日志轮转
 * - 结构化日志
 * - NestJS集成
 *
 * @fileoverview 日志模块入口
 * @author AI开发团队
 * @since 1.0.0
 */

// 日志服务导出
export * from './services/pino-logger.service';
export { PinoLoggerConfigService } from './services/pino-logger-config.service';
export * from './interfaces/logging.interface';

// 日志模块导出
export * from './logging.module';

// 工厂和中间件导出
export * from './factories/pino-logger.factory';
export * from './middleware/pino-logging.middleware';
export * from './interceptors/pino-logging.interceptor';

// 版本信息
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@aiofix/logging';
