import { Injectable } from '@nestjs/common';
import { AsyncContext } from './async-context';
import { IContextFactory, RequestContext, ContextData } from './context.types';

/**
 * 上下文工厂
 *
 * 负责创建和管理异步上下文的工厂类。
 * 提供标准化的上下文创建方法和配置选项。
 *
 * @description 异步上下文工厂，提供标准化的上下文创建和管理功能
 *
 * ## 业务规则
 *
 * ### 上下文创建规则
 * - 每个请求都应该有唯一的上下文标识符
 * - 上下文创建时应该包含基本的请求信息
 * - 支持上下文的继承和嵌套关系
 * - 提供默认的上下文数据初始化
 *
 * ### 数据初始化规则
 * - 自动设置请求ID和时间戳
 * - 支持从请求头中提取用户信息
 * - 提供租户和组织信息的默认值
 * - 支持自定义上下文数据扩展
 *
 * ## 业务逻辑流程
 *
 * 1. **请求接收**：接收HTTP请求或命令/查询
 * 2. **上下文创建**：创建新的异步上下文实例
 * 3. **数据初始化**：设置基本的请求信息和用户信息
 * 4. **上下文附加**：将上下文附加到请求对象上
 * 5. **上下文传递**：在后续处理中传递上下文
 *
 * @example
 * ```typescript
 * // 创建上下文工厂
 * const factory = new ContextFactory();
 *
 * // 创建请求上下文
 * const context = factory.createRequestContext({
 *   userId: 'user-123',
 *   tenantId: 'tenant-456',
 *   requestId: 'req-789'
 * });
 *
 * // 创建子上下文
 * const childContext = factory.createChildContext(context, {
 *   operationType: 'command'
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ContextFactory implements IContextFactory {
  /**
   * 创建请求上下文
   *
   * @description 创建新的请求级别异步上下文
   * @param data 请求上下文数据
   * @returns 异步上下文实例
   */
  createRequestContext(data?: RequestContext): AsyncContext {
    const context = new AsyncContext();

    // 设置默认的请求信息
    const defaultData: RequestContext = {
      requestId: this.generateRequestId(),
      timestamp: new Date(),
      source: 'api',
      version: '1.0.0',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      ...data,
    };

    // 设置上下文数据
    for (const [key, value] of Object.entries(defaultData)) {
      if (value !== undefined) {
        context.set(key, value);
      }
    }

    return context;
  }

  /**
   * 创建子上下文
   *
   * @description 基于父级上下文创建子上下文
   * @param parent 父级上下文
   * @param data 子上下文数据
   * @returns 异步上下文实例
   */
  createChildContext(parent: AsyncContext, data?: ContextData): AsyncContext {
    const childContext = parent.createChild();

    // 设置子上下文数据
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          childContext.set(key, value);
        }
      }
    }

    return childContext;
  }

  /**
   * 从请求对象创建上下文
   *
   * @description 从HTTP请求对象中提取信息创建上下文
   * @param request HTTP请求对象
   * @param data 额外的上下文数据
   * @returns 异步上下文实例
   */
  createFromRequest(request: any, data?: ContextData): AsyncContext {
    const requestData: RequestContext = {
      requestId: this.generateRequestId(),
      userId: this.extractUserId(request),
      tenantId: this.extractTenantId(request),
      organizationId: this.extractOrganizationId(request),
      departmentId: this.extractDepartmentId(request),
      sessionId: this.extractSessionId(request),
      clientIp: this.extractClientIp(request),
      userAgent: this.extractUserAgent(request),
      timestamp: new Date(),
      source: 'http',
      version: this.extractVersion(request),
      language: this.extractLanguage(request),
      timezone: this.extractTimezone(request),
      ...data,
    };

    return this.createRequestContext(requestData);
  }

  /**
   * 从命令创建上下文
   *
   * @description 从命令对象中提取信息创建上下文
   * @param command 命令对象
   * @param data 额外的上下文数据
   * @returns 异步上下文实例
   */
  createFromCommand(command: any, data?: ContextData): AsyncContext {
    const commandData: RequestContext = {
      requestId: this.generateRequestId(),
      userId: command.userId || command.metadata?.userId,
      tenantId: command.tenantId || command.metadata?.tenantId,
      organizationId:
        command.organizationId || command.metadata?.organizationId,
      departmentId: command.departmentId || command.metadata?.departmentId,
      timestamp: new Date(),
      source: 'command',
      version: command.version || '1.0.0',
      ...data,
    };

    return this.createRequestContext(commandData);
  }

  /**
   * 从查询创建上下文
   *
   * @description 从查询对象中提取信息创建上下文
   * @param query 查询对象
   * @param data 额外的上下文数据
   * @returns 异步上下文实例
   */
  createFromQuery(query: any, data?: ContextData): AsyncContext {
    const queryData: RequestContext = {
      requestId: this.generateRequestId(),
      userId: query.userId || query.metadata?.userId,
      tenantId: query.tenantId || query.metadata?.tenantId,
      organizationId: query.organizationId || query.metadata?.organizationId,
      departmentId: query.departmentId || query.metadata?.departmentId,
      timestamp: new Date(),
      source: 'query',
      version: query.version || '1.0.0',
      ...data,
    };

    return this.createRequestContext(queryData);
  }

  /**
   * 从事件创建上下文
   *
   * @description 从事件对象中提取信息创建上下文
   * @param event 事件对象
   * @param data 额外的上下文数据
   * @returns 异步上下文实例
   */
  createFromEvent(event: any, data?: ContextData): AsyncContext {
    const eventData: RequestContext = {
      requestId: this.generateRequestId(),
      userId: event.userId || event.metadata?.userId,
      tenantId: event.tenantId || event.metadata?.tenantId,
      organizationId: event.organizationId || event.metadata?.organizationId,
      departmentId: event.departmentId || event.metadata?.departmentId,
      timestamp: new Date(),
      source: 'event',
      version: event.version || '1.0.0',
      ...data,
    };

    return this.createRequestContext(eventData);
  }

  /**
   * 生成请求ID
   *
   * @description 生成唯一的请求标识符
   * @returns 请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从请求中提取用户ID
   *
   * @description 从HTTP请求中提取用户ID
   * @param request HTTP请求对象
   * @returns 用户ID
   */
  private extractUserId(request: any): string | undefined {
    return (
      request.user?.id ||
      request.headers?.['x-user-id'] ||
      request.query?.userId ||
      request.params?.userId
    );
  }

  /**
   * 从请求中提取租户ID
   *
   * @description 从HTTP请求中提取租户ID
   * @param request HTTP请求对象
   * @returns 租户ID
   */
  private extractTenantId(request: any): string | undefined {
    return (
      request.user?.tenantId ||
      request.headers?.['x-tenant-id'] ||
      request.query?.tenantId ||
      request.params?.tenantId
    );
  }

  /**
   * 从请求中提取组织ID
   *
   * @description 从HTTP请求中提取组织ID
   * @param request HTTP请求对象
   * @returns 组织ID
   */
  private extractOrganizationId(request: any): string | undefined {
    return (
      request.user?.organizationId ||
      request.headers?.['x-organization-id'] ||
      request.query?.organizationId ||
      request.params?.organizationId
    );
  }

  /**
   * 从请求中提取部门ID
   *
   * @description 从HTTP请求中提取部门ID
   * @param request HTTP请求对象
   * @returns 部门ID
   */
  private extractDepartmentId(request: any): string | undefined {
    return (
      request.user?.departmentId ||
      request.headers?.['x-department-id'] ||
      request.query?.departmentId ||
      request.params?.departmentId
    );
  }

  /**
   * 从请求中提取会话ID
   *
   * @description 从HTTP请求中提取会话ID
   * @param request HTTP请求对象
   * @returns 会话ID
   */
  private extractSessionId(request: any): string | undefined {
    return (
      request.sessionID ||
      request.headers?.['x-session-id'] ||
      request.cookies?.sessionId
    );
  }

  /**
   * 从请求中提取客户端IP
   *
   * @description 从HTTP请求中提取客户端IP地址
   * @param request HTTP请求对象
   * @returns 客户端IP
   */
  private extractClientIp(request: any): string | undefined {
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.headers?.['x-forwarded-for'] ||
      request.headers?.['x-real-ip']
    );
  }

  /**
   * 从请求中提取用户代理
   *
   * @description 从HTTP请求中提取用户代理字符串
   * @param request HTTP请求对象
   * @returns 用户代理字符串
   */
  private extractUserAgent(request: any): string | undefined {
    return request.headers?.['user-agent'];
  }

  /**
   * 从请求中提取版本
   *
   * @description 从HTTP请求中提取API版本
   * @param request HTTP请求对象
   * @returns API版本
   */
  private extractVersion(request: any): string | undefined {
    return (
      request.headers?.['x-api-version'] || request.query?.version || '1.0.0'
    );
  }

  /**
   * 从请求中提取语言
   *
   * @description 从HTTP请求中提取语言设置
   * @param request HTTP请求对象
   * @returns 语言设置
   */
  private extractLanguage(request: any): string | undefined {
    return (
      request.headers?.['accept-language'] || request.query?.language || 'zh-CN'
    );
  }

  /**
   * 从请求中提取时区
   *
   * @description 从HTTP请求中提取时区设置
   * @param request HTTP请求对象
   * @returns 时区设置
   */
  private extractTimezone(request: any): string | undefined {
    return (
      request.headers?.['x-timezone'] ||
      request.query?.timezone ||
      'Asia/Shanghai'
    );
  }
}
