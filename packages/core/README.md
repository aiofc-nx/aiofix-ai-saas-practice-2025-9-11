# Core模块

## 概述

Core模块是Aiofix-AI-SaaS平台的核心基础架构库，为所有业务领域模块提供统一的架构基础、共享组件和通用功能。通过Core模块，确保整个平台的技术架构一致性，提高开发效率，降低维护成本。

## 特性

- **架构统一**: 为所有业务领域提供统一的架构基础
- **组件复用**: 提供可复用的通用组件和工具
- **开发效率**: 简化业务模块的开发复杂度
- **维护性**: 集中管理通用功能，便于维护和升级
- **扩展性**: 支持新业务领域的快速集成
- **类型安全**: 基于TypeScript的强类型支持
- **依赖注入**: 基于NestJS的依赖注入框架
- **事件驱动**: 内置的标准化事件处理机制
- **CQRS支持**: 内置完整的CQRS功能，支持多租户和AI集成
- **多租户**: 内置多租户架构支持
- **AI集成**: 标准化的AI服务抽象和集成
- **企业级**: 支持多组织、多部门、权限管理等企业级功能

## 安装

```bash
npm install @aiofix/core
# 或
yarn add @aiofix/core
# 或
pnpm add @aiofix/core
```

## 快速开始

### 基础使用

```typescript
import { CoreModule } from '@aiofix/core';

@Module({
  imports: [
    CoreModule.forRoot({
      cqrs: {
        enableEventSourcing: true,
        enableMultiTenancy: true,
        enableMultiOrganization: true,
      },
      ai: {
        enableAIIntegration: true,
        defaultModel: 'gpt-4',
      },
    }),
  ],
})
export class AppModule {}
```

### 创建实体

```typescript
import { TenantAwareEntity, EntityId, TenantId, UserId } from '@aiofix/core';

export class UserProfile extends TenantAwareEntity {
  constructor(
    tenantId: TenantId,
    name: string,
    email: string,
    createdBy: UserId
  ) {
    super(tenantId, createdBy);
    this.name = name;
    this.email = email;
  }

  updateProfile(name: string, email: string, updatedBy: UserId): void {
    this.name = name;
    this.email = email;
    this.updateVersion(updatedBy);
  }
}
```

### 创建聚合根

```typescript
import { TenantAwareAggregateRoot, EntityId, TenantId, UserId } from '@aiofix/core';

export class User extends TenantAwareAggregateRoot {
  constructor(
    id: EntityId,
    tenantId: TenantId,
    name: string,
    email: string,
    createdBy: UserId
  ) {
    super(id, tenantId);
    this.name = name;
    this.email = email;
    
    // 发布领域事件
    this.addEvent(new UserCreatedEvent(id, tenantId, name, email, createdBy));
  }

  updateName(newName: string, updatedBy: UserId): void {
    if (this.name === newName) return;
    
    const oldName = this.name;
    this.name = newName;
    
    this.addEvent(new UserNameUpdatedEvent(
      this.id,
      this.tenantId,
      oldName,
      newName,
      updatedBy
    ));
  }
}
```

### 创建命令处理器

```typescript
import { TenantCommandHandler, CreateUserCommand, User } from '@aiofix/core';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler extends TenantCommandHandler<CreateUserCommand, User> {
  async execute(command: CreateUserCommand): Promise<User> {
    const user = new User(
      EntityId.generate(),
      command.tenantId,
      command.name,
      command.email,
      command.userId
    );
    
    await this.userRepository.save(user);
    return user;
  }
}
```

## 项目结构

```
packages/core/
├── src/
│   ├── domain/                   # 领域基础
│   │   ├── entities/             # 基础领域实体
│   │   ├── aggregates/           # 基础聚合根
│   │   ├── value-objects/        # 基础值对象
│   │   ├── events/               # 基础事件
│   │   ├── services/             # 基础领域服务
│   │   └── specifications/       # 基础规约
│   ├── application/              # 应用基础
│   │   ├── commands/             # 命令基础
│   │   ├── queries/              # 查询基础
│   │   ├── handlers/             # 处理器基础
│   │   ├── services/             # 应用服务基础
│   │   └── dto/                  # 基础DTO
│   ├── infrastructure/           # 基础设施
│   │   ├── persistence/          # 持久化基础
│   │   ├── messaging/            # 消息基础
│   │   ├── events/               # 事件基础设施
│   │   ├── external/             # 外部服务基础
│   │   └── cqrs/                 # 内置CQRS功能
│   ├── interfaces/               # 接口基础
│   │   ├── rest/                 # REST API基础
│   │   ├── graphql/              # GraphQL基础
│   │   ├── grpc/                 # gRPC基础
│   │   └── messaging/            # 消息接口基础
│   ├── shared/                   # 共享组件
│   │   ├── types/                # 通用类型
│   │   ├── utils/                # 工具函数
│   │   ├── decorators/           # 装饰器
│   │   ├── validators/           # 验证器
│   │   └── constants/            # 常量定义
│   └── core.module.ts            # Core模块定义
├── test/                         # 测试文件
├── examples/                     # 示例代码
├── docs/                         # 文档
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
└── jest.config.js
```

## 开发

### 安装依赖

```bash
pnpm install
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 生成测试覆盖率报告
pnpm test:coverage
```

### 代码检查

```bash
# 运行ESLint检查
pnpm lint

# 自动修复ESLint问题
pnpm lint:fix

# 类型检查
pnpm typecheck
```

### 构建

```bash
# 构建项目
pnpm build

# 监听模式构建
pnpm build --watch

# 开发模式构建
pnpm build --dev
```

## 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 相关文档

- [Core模块设计方案](../../docs/design/02-core-module-design.md)
- [Core模块开发计划](../../docs/design/04-core-module-development-plan.md)
- [Core模块任务清单](../../docs/design/05-core-module-task-checklist.md)
