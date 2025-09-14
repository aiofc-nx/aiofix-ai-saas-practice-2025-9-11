/**
 * Core模块定义文件
 *
 * @description 定义Core模块的依赖注入配置和模块导出
 * 按照Clean Architecture分层组织模块依赖关系
 *
 * ## 模块结构
 *
 * ### Domain Layer (企业业务规则层)
 * - 领域实体、聚合根、值对象
 * - 领域事件、仓库接口、工厂接口
 * - 规约模式接口、领域服务接口
 *
 * ### Application Layer (应用业务规则层)
 * - 命令和查询接口
 * - 应用服务接口
 * - 用例实现
 *
 * ### Infrastructure Layer (基础设施层)
 * - 仓库实现、工厂实现
 * - 命令处理器、查询处理器、事件处理器
 * - 数据库驱动、消息驱动、外部服务驱动
 * - CQRS框架实现、事件总线、事件投射器
 * - 读模型投射
 *
 * ### Interface Layer (接口层)
 * - REST API控制器
 * - GraphQL解析器
 * - gRPC服务
 * - 消息接口实现
 * - DTO实现
 *
 * ## 依赖注入配置
 *
 * - 所有接口在Domain和Application层定义
 * - 所有实现在Infrastructure层提供
 * - Interface层通过依赖注入使用Application层服务
 * - 严格遵循依赖倒置原则
 *
 * @example
 * ```typescript
 * import { CoreModule } from '@aiofix/core';
 *
 * @Module({
 *   imports: [CoreModule],
 *   // ... 其他配置
 * })
 * export class AppModule {}
 * ```
 *
 * @since 1.0.0
 */

import { Module } from '@nestjs/common';

/**
 * Core模块
 *
 * @description Core模块是Aiofix-AI-SaaS平台的核心模块
 * 提供完整的DDD + CQRS + Event Sourcing架构支持
 *
 * ## 功能特性
 *
 * - **多租户支持**: 完整的租户隔离和管理
 * - **CQRS架构**: 命令查询职责分离
 * - **事件溯源**: 基于事件的数据存储和重建
 * - **领域驱动**: 完整的DDD建模支持
 * - **Clean Architecture**: 严格的分层架构
 * - **AI集成**: 统一的AI能力抽象
 *
 * ## 使用方式
 *
 * 1. **导入模块**: 在应用模块中导入CoreModule
 * 2. **依赖注入**: 使用接口进行依赖注入
 * 3. **配置服务**: 通过模块配置各种服务
 * 4. **扩展功能**: 继承基础类实现业务逻辑
 *
 * @example
 * ```typescript
 * // 在应用中使用
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly commandBus: ICommandBus,
 *     private readonly queryBus: IQueryBus
 *   ) {}
 *
 *   async createUser(command: CreateUserCommand): Promise<void> {
 *     await this.commandBus.execute(command);
 *   }
 *
 *   async getUser(query: GetUserQuery): Promise<User> {
 *     return this.queryBus.execute(query);
 *   }
 * }
 * ```
 */
@Module({})
export class CoreModule {}
