# Aiofix-AI-SaaS 平台文件组织与测试代码规范

## 概述

本文档为Aiofix-AI-SaaS平台制定统一的文件组织和测试代码规范，确保项目结构清晰、代码组织合理、测试覆盖完整，支持团队协作和项目维护。

## 设计原则

### 核心原则

1. **清晰性**：文件组织清晰，目录结构易于理解
2. **一致性**：统一的文件命名和目录结构规范
3. **可维护性**：便于代码维护和扩展
4. **可测试性**：完整的测试覆盖和测试组织
5. **模块化**：按功能模块组织代码
6. **分层架构**：遵循Clean Architecture分层原则

### 技术原则

- **DDD驱动**：按领域驱动设计组织代码
- **Clean Architecture**：遵循清洁架构分层原则
- **测试驱动**：完整的测试覆盖和测试组织
- **模块化**：按功能模块组织代码

## 目录结构

1. [文件组织规范](#文件组织规范)
2. [测试代码规范](#测试代码规范)

---

## 文件组织规范

### 目录结构规范

#### 领域模块目录结构

```text
libs/user-management/
├── domain/                          # 领域层
│   ├── entities/                    # 领域实体
│   │   ├── user-profile.entity.ts
│   │   ├── user-profile.entity.spec.ts
│   │   ├── user-settings.entity.ts
│   │   └── user-settings.entity.spec.ts
│   ├── aggregates/                  # 聚合根
│   │   ├── user.aggregate.ts
│   │   └── user.aggregate.spec.ts
│   ├── value-objects/               # 值对象
│   │   ├── user-id.value-object.ts
│   │   ├── user-id.value-object.spec.ts
│   │   ├── user-status.value-object.ts
│   │   └── user-status.value-object.spec.ts
│   ├── events/                      # 领域事件
│   │   ├── user-created.event.ts
│   │   ├── user-created.event.spec.ts
│   │   ├── user-updated.event.ts
│   │   └── user-updated.event.spec.ts
│   ├── services/                    # 领域服务
│   │   ├── user-domain.service.ts
│   │   └── user-domain.service.spec.ts
│   ├── specifications/              # 规约
│   │   ├── active-user.specification.ts
│   │   ├── active-user.specification.spec.ts
│   │   ├── admin-user.specification.ts
│   │   └── admin-user.specification.spec.ts
│   └── interfaces/                  # 领域接口
│       ├── user-repository.interface.ts
│       └── user-service.interface.ts
├── application/                     # 应用层
│   ├── commands/                    # 命令
│   │   ├── create-user.command.ts
│   │   ├── update-user.command.ts
│   │   └── delete-user.command.ts
│   ├── queries/                     # 查询
│   │   ├── get-user.query.ts
│   │   ├── get-users.query.ts
│   │   └── search-users.query.ts
│   ├── handlers/                    # 处理器
│   │   ├── commands/
│   │   │   ├── create-user.handler.ts
│   │   │   ├── create-user.handler.spec.ts
│   │   │   ├── update-user.handler.ts
│   │   │   ├── update-user.handler.spec.ts
│   │   │   ├── delete-user.handler.ts
│   │   │   └── delete-user.handler.spec.ts
│   │   ├── queries/
│   │   │   ├── get-user.handler.ts
│   │   │   ├── get-user.handler.spec.ts
│   │   │   ├── get-users.handler.ts
│   │   │   ├── get-users.handler.spec.ts
│   │   │   ├── search-users.handler.ts
│   │   │   └── search-users.handler.spec.ts
│   │   └── events/
│   │       ├── user-created.handler.ts
│   │       ├── user-created.handler.spec.ts
│   │       ├── user-updated.handler.ts
│   │       ├── user-updated.handler.spec.ts
│   │       ├── user-deleted.handler.ts
│   │       └── user-deleted.handler.spec.ts
│   ├── services/                    # 应用服务
│   │   ├── user.service.ts
│   │   └── user.service.spec.ts
│   └── dto/                         # 数据传输对象
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       ├── user-response.dto.ts
│       └── user-search.dto.ts
├── infrastructure/                  # 基础设施层
│   ├── persistence/                 # 持久化
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   └── user.repository.spec.ts
│   │   └── entities/
│   │       └── user.orm-entity.ts
│   ├── messaging/                   # 消息
│   │   └── event-publishers/
│   │       ├── user-event.publisher.ts
│   │       └── user-event.publisher.spec.ts
│   └── external/                    # 外部服务
│       └── ai/
│           ├── user-ai.service.ts
│           └── user-ai.service.spec.ts
├── interfaces/                      # 接口层
│   ├── rest/                        # REST API
│   │   ├── controllers/
│   │   │   ├── user.controller.ts
│   │   │   └── user.controller.spec.ts
│   │   └── guards/
│   │       ├── user-permission.guard.ts
│   │       └── user-permission.guard.spec.ts
│   ├── graphql/                     # GraphQL
│   │   ├── resolvers/
│   │   │   ├── user.resolver.ts
│   │   │   └── user.resolver.spec.ts
│   │   └── schemas/
│   │       └── user.schema.ts
│   └── grpc/                        # gRPC
│       ├── services/
│       │   ├── user.service.ts
│       │   └── user.service.spec.ts
│       └── proto/
│           └── user.proto
├── shared/                          # 共享组件
│   ├── types/
│   │   ├── user.types.ts
│   │   └── user.types.spec.ts
│   ├── utils/
│   │   ├── user.utils.ts
│   │   └── user.utils.spec.ts
│   ├── decorators/
│   │   ├── user-permission.decorator.ts
│   │   └── user-permission.decorator.spec.ts
│   └── constants/
│       └── user.constants.ts
├── tests/                           # 集成测试和端到端测试
│   ├── integration/                 # 集成测试
│   │   ├── api/
│   │   │   ├── user.controller.integration.spec.ts
│   │   │   └── user.resolver.integration.spec.ts
│   │   ├── database/
│   │   │   └── user.repository.integration.spec.ts
│   │   └── messaging/
│   │       └── user-event.publisher.integration.spec.ts
│   ├── e2e/                         # 端到端测试
│   │   ├── user-management.e2e-spec.ts
│   │   └── fixtures/
│   │       ├── user.fixtures.ts
│   │       └── tenant.fixtures.ts
│   └── helpers/                     # 测试辅助工具
│       ├── test-database.helper.ts
│       ├── test-fixtures.helper.ts
│       └── test-mocks.helper.ts
├── user-management.module.ts        # 模块定义
└── index.ts                         # 导出文件
```

### 文件命名规范

#### 实体和聚合根

```typescript
// ✅ 正确：实体文件命名
user-profile.entity.ts          // 用户资料实体
user-settings.entity.ts         // 用户设置实体
user.aggregate.ts              // 用户聚合根

// ❌ 错误：不规范的命名
UserProfile.entity.ts          // 使用PascalCase
userProfile.entity.ts          // 使用camelCase
user_profile.entity.ts         // 使用snake_case
```

#### 命令和查询

```typescript
// ✅ 正确：命令和查询文件命名
create-user.command.ts         // 创建用户命令
update-user.command.ts         // 更新用户命令
get-user.query.ts             // 获取用户查询
search-users.query.ts         // 搜索用户查询

// ❌ 错误：不规范的命名
CreateUserCommand.ts          // 使用PascalCase
createUserCommand.ts          // 使用camelCase
create_user_command.ts        // 使用snake_case
```

#### 事件

```typescript
// ✅ 正确：事件文件命名
user-created.event.ts         // 用户创建事件
user-updated.event.ts         // 用户更新事件
user-deleted.event.ts         // 用户删除事件

// ❌ 错误：不规范的命名
UserCreatedEvent.ts           // 使用PascalCase
userCreatedEvent.ts           // 使用camelCase
user_created_event.ts         // 使用snake_case
```

#### 处理器

```typescript
// ✅ 正确：处理器文件命名
create-user.handler.ts        // 创建用户处理器
get-user.handler.ts          // 获取用户处理器
user-created.handler.ts      // 用户创建事件处理器

// ❌ 错误：不规范的命名
CreateUserHandler.ts         // 使用PascalCase
createUserHandler.ts         // 使用camelCase
create_user_handler.ts       // 使用snake_case
```

### 导出文件规范

#### 模块导出

```typescript
// ✅ 正确：index.ts导出文件
// 领域层导出
export * from './domain/entities/user-profile.entity';
export * from './domain/entities/user-settings.entity';
export * from './domain/aggregates/user.aggregate';
export * from './domain/value-objects/user-id.value-object';
export * from './domain/value-objects/user-status.value-object';
export * from './domain/events/user-created.event';
export * from './domain/events/user-updated.event';
export * from './domain/services/user-domain.service';
export * from './domain/interfaces/user-repository.interface';

// 应用层导出
export * from './application/commands/create-user.command';
export * from './application/commands/update-user.command';
export * from './application/queries/get-user.query';
export * from './application/queries/get-users.query';
export * from './application/handlers/commands/create-user.handler';
export * from './application/handlers/queries/get-user.handler';
export * from './application/services/user.service';
export * from './application/dto/create-user.dto';
export * from './application/dto/user-response.dto';

// 基础设施层导出
export * from './infrastructure/persistence/repositories/user.repository';

// 接口层导出
export * from './interfaces/rest/controllers/user.controller';
export * from './interfaces/rest/guards/user-permission.guard';

// 共享组件导出
export * from './shared/types/user.types';
export * from './shared/utils/user.utils';
export * from './shared/decorators/user-permission.decorator';
export * from './shared/constants/user.constants';

// 模块导出
export * from './user-management.module';
```

---

## 测试代码规范

### 测试文件组织

#### 测试文件组织原则

1. **单元测试**：与被测试文件放在同级目录下，使用`.spec.ts`后缀
2. **集成测试**：放在`tests/integration/`目录下，使用`.integration.spec.ts`后缀
3. **端到端测试**：放在`tests/e2e/`目录下，使用`.e2e-spec.ts`后缀
4. **测试辅助工具**：放在`tests/helpers/`目录下，提供测试夹具和工具函数

#### 测试目录结构

```text
libs/user-management/
├── domain/                          # 领域层
│   ├── entities/                    # 领域实体
│   │   ├── user-profile.entity.ts
│   │   ├── user-profile.entity.spec.ts
│   │   ├── user-settings.entity.ts
│   │   └── user-settings.entity.spec.ts
│   ├── aggregates/                  # 聚合根
│   │   ├── user.aggregate.ts
│   │   └── user.aggregate.spec.ts
│   ├── value-objects/               # 值对象
│   │   ├── user-id.value-object.ts
│   │   ├── user-id.value-object.spec.ts
│   │   ├── user-status.value-object.ts
│   │   └── user-status.value-object.spec.ts
│   ├── events/                      # 领域事件
│   │   ├── user-created.event.ts
│   │   ├── user-created.event.spec.ts
│   │   ├── user-updated.event.ts
│   │   └── user-updated.event.spec.ts
│   ├── services/                    # 领域服务
│   │   ├── user-domain.service.ts
│   │   └── user-domain.service.spec.ts
│   └── interfaces/                  # 领域接口
│       ├── user-repository.interface.ts
│       └── user-service.interface.ts
├── application/                     # 应用层
│   ├── commands/                    # 命令
│   │   ├── create-user.command.ts
│   │   ├── update-user.command.ts
│   │   └── delete-user.command.ts
│   ├── queries/                     # 查询
│   │   ├── get-user.query.ts
│   │   ├── get-users.query.ts
│   │   └── search-users.query.ts
│   ├── handlers/                    # 处理器
│   │   ├── commands/
│   │   │   ├── create-user.handler.ts
│   │   │   ├── create-user.handler.spec.ts
│   │   │   ├── update-user.handler.ts
│   │   │   ├── update-user.handler.spec.ts
│   │   │   ├── delete-user.handler.ts
│   │   │   └── delete-user.handler.spec.ts
│   │   ├── queries/
│   │   │   ├── get-user.handler.ts
│   │   │   ├── get-user.handler.spec.ts
│   │   │   ├── get-users.handler.ts
│   │   │   ├── get-users.handler.spec.ts
│   │   │   ├── search-users.handler.ts
│   │   │   └── search-users.handler.spec.ts
│   │   └── events/
│   │       ├── user-created.handler.ts
│   │       ├── user-created.handler.spec.ts
│   │       ├── user-updated.handler.ts
│   │       ├── user-updated.handler.spec.ts
│   │       ├── user-deleted.handler.ts
│   │       └── user-deleted.handler.spec.ts
│   ├── services/                    # 应用服务
│   │   ├── user.service.ts
│   │   └── user.service.spec.ts
│   └── dto/                         # 数据传输对象
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       ├── user-response.dto.ts
│       └── user-search.dto.ts
├── infrastructure/                  # 基础设施层
│   ├── persistence/                 # 持久化
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   └── user.repository.spec.ts
│   │   └── entities/
│   │       └── user.orm-entity.ts
│   ├── messaging/                   # 消息
│   │   └── event-publishers/
│   │       ├── user-event.publisher.ts
│   │       └── user-event.publisher.spec.ts
│   └── external/                    # 外部服务
│       └── ai/
│           ├── user-ai.service.ts
│           └── user-ai.service.spec.ts
├── interfaces/                      # 接口层
│   ├── rest/                        # REST API
│   │   ├── controllers/
│   │   │   ├── user.controller.ts
│   │   │   └── user.controller.spec.ts
│   │   └── guards/
│   │       ├── user-permission.guard.ts
│   │       └── user-permission.guard.spec.ts
│   ├── graphql/                     # GraphQL
│   │   ├── resolvers/
│   │   │   ├── user.resolver.ts
│   │   │   └── user.resolver.spec.ts
│   │   └── schemas/
│   │       └── user.schema.ts
│   └── grpc/                        # gRPC
│       ├── services/
│       │   ├── user.service.ts
│       │   └── user.service.spec.ts
│       └── proto/
│           └── user.proto
├── shared/                          # 共享组件
│   ├── types/
│   │   ├── user.types.ts
│   │   └── user.types.spec.ts
│   ├── utils/
│   │   ├── user.utils.ts
│   │   └── user.utils.spec.ts
│   ├── decorators/
│   │   ├── user-permission.decorator.ts
│   │   └── user-permission.decorator.spec.ts
│   └── constants/
│       └── user.constants.ts
├── tests/                           # 集成测试和端到端测试
│   ├── integration/                 # 集成测试
│   │   ├── api/
│   │   │   ├── user.controller.integration.spec.ts
│   │   │   └── user.resolver.integration.spec.ts
│   │   ├── database/
│   │   │   └── user.repository.integration.spec.ts
│   │   └── messaging/
│   │       └── user-event.publisher.integration.spec.ts
│   ├── e2e/                         # 端到端测试
│   │   ├── user-management.e2e-spec.ts
│   │   └── fixtures/
│   │       ├── user.fixtures.ts
│   │       └── tenant.fixtures.ts
│   └── helpers/                     # 测试辅助工具
│       ├── test-database.helper.ts
│       ├── test-fixtures.helper.ts
│       └── test-mocks.helper.ts
├── user-management.module.ts        # 模块定义
└── index.ts                         # 导出文件
```

### 单元测试规范

#### 测试文件命名

```typescript
// ✅ 正确：测试文件命名（与被测试文件同级目录）
user-profile.entity.ts            // 被测试文件
user-profile.entity.spec.ts       // 对应的单元测试文件

user.aggregate.ts                 // 被测试文件
user.aggregate.spec.ts           // 对应的单元测试文件

create-user.handler.ts            // 被测试文件
create-user.handler.spec.ts       // 对应的单元测试文件

user.service.ts                   // 被测试文件
user.service.spec.ts              // 对应的单元测试文件

// ✅ 正确：集成测试和端到端测试命名
user.controller.integration.spec.ts    // 集成测试
user-management.e2e-spec.ts            // 端到端测试

// ❌ 错误：不规范的命名
UserProfile.entity.spec.ts        // 使用PascalCase
userProfile.entity.spec.ts        // 使用camelCase
user_profile.entity.spec.ts       // 使用snake_case
user-profile.test.ts              // 使用.test.ts后缀
user-profile.spec.js              // 使用.js扩展名
```

#### 测试类结构

```typescript
// ✅ 正确：测试类结构
describe('User聚合根', () => {
  let user: User;
  let tenantId: TenantId;
  let userId: UserId;

  beforeEach(() => {
    tenantId = TenantId.generate();
    userId = UserId.generate();
    user = new User(
      EntityId.generate(),
      tenantId,
      '张三',
      'zhangsan@example.com',
      userId
    );
  });

  describe('创建用户', () => {
    it('应该成功创建用户并发布UserCreatedEvent事件', () => {
      // Arrange
      const expectedName = '张三';
      const expectedEmail = 'zhangsan@example.com';

      // Act
      const events = user.getUncommittedEvents();

      // Assert
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
      expect(events[0].name).toBe(expectedName);
      expect(events[0].email).toBe(expectedEmail);
    });

    it('应该设置正确的初始状态', () => {
      // Assert
      expect(user.getStatus()).toBe(UserStatus.ACTIVE);
      expect(user.getRoles()).toEqual([]);
    });
  });

  describe('更新用户姓名', () => {
    it('应该成功更新姓名并发布UserNameUpdatedEvent事件', () => {
      // Arrange
      const newName = '李四';
      const updatedBy = UserId.generate();

      // Act
      user.updateName(newName, updatedBy);

      // Assert
      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(2); // 创建事件 + 更新事件

      const updateEvent = events[1] as UserNameUpdatedEvent;
      expect(updateEvent).toBeInstanceOf(UserNameUpdatedEvent);
      expect(updateEvent.oldName).toBe('张三');
      expect(updateEvent.newName).toBe(newName);
      expect(updateEvent.updatedBy).toBe(updatedBy);
    });

    it('当新姓名与当前姓名相同时不应该发布事件', () => {
      // Arrange
      const currentName = '张三';
      const updatedBy = UserId.generate();

      // Act
      user.updateName(currentName, updatedBy);

      // Assert
      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1); // 只有创建事件
    });

    it('当用户状态不是ACTIVE时应该抛出异常', () => {
      // Arrange
      const newName = '李四';
      const updatedBy = UserId.generate();
      user.deactivate(updatedBy);

      // Act & Assert
      expect(() => {
        user.updateName(newName, updatedBy);
      }).toThrow(UserNotActiveError);
    });
  });
});
```

### 测试数据管理

#### 测试夹具

```typescript
// ✅ 正确：测试夹具
export class UserTestFixtures {
  static createUser(overrides: Partial<UserData> = {}): User {
    const defaultData: UserData = {
      id: EntityId.generate(),
      tenantId: TenantId.generate(),
      name: '测试用户',
      email: 'test@example.com',
      createdBy: UserId.generate(),
      ...overrides,
    };

    return new User(
      defaultData.id,
      defaultData.tenantId,
      defaultData.name,
      defaultData.email,
      defaultData.createdBy
    );
  }

  static createCreateUserCommand(overrides: Partial<CreateUserCommandData> = {}): CreateUserCommand {
    const defaultData: CreateUserCommandData = {
      tenantId: TenantId.generate(),
      userId: UserId.generate(),
      name: '测试用户',
      email: 'test@example.com',
      ...overrides,
    };

    return new CreateUserCommand(
      defaultData.tenantId,
      defaultData.userId,
      defaultData.name,
      defaultData.email,
      defaultData.organizationId,
      defaultData.departmentId
    );
  }

  static createTenantContext(overrides: Partial<TenantContext> = {}): TenantContext {
    return {
      tenantId: TenantId.generate(),
      userId: UserId.generate(),
      permissions: ['user.read', 'user.create'],
      features: ['ai_enhancement'],
      aiQuota: {
        totalQuota: 1000,
        usedQuota: 100,
        remainingQuota: 900,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      subscription: {
        plan: 'premium',
        features: ['ai_enhancement', 'advanced_analytics'],
        limits: { users: 100, storage: 1000 },
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      ...overrides,
    };
  }
}

// 使用示例
describe('用户服务测试', () => {
  it('应该成功创建用户', async () => {
    // Arrange
    const user = UserTestFixtures.createUser({
      name: '张三',
      email: 'zhangsan@example.com',
    });

    const command = UserTestFixtures.createCreateUserCommand({
      name: '张三',
      email: 'zhangsan@example.com',
    });

    // Act & Assert
    // 测试逻辑
  });
});
```

### 集成测试规范

#### 集成测试结构

```typescript
// ✅ 正确：集成测试结构
describe('UserController集成测试', () => {
  let app: INestApplication;
  let userRepository: IUserRepository;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CoreModule.forRoot({
          cqrs: { enableEventSourcing: true },
          multiTenancy: { enableMultiTenancy: true },
        }),
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<IUserRepository>('IUserRepository');
    commandBus = moduleFixture.get<CommandBus>(CommandBus);
    queryBus = moduleFixture.get<QueryBus>(QueryBus);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await userRepository.clear();
  });

  describe('POST /users', () => {
    it('应该成功创建用户', async () => {
      // Arrange
      const createUserDto = {
        name: '张三',
        email: 'zhangsan@example.com',
      };
      const tenantContext = UserTestFixtures.createTenantContext();

      // Act
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('x-tenant-id', tenantContext.tenantId.toString())
        .set('x-user-id', tenantContext.userId.toString())
        .send(createUserDto)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        name: createUserDto.name,
        email: createUserDto.email,
        status: UserStatus.ACTIVE,
      });

      // 验证数据库中的数据
      const savedUser = await userRepository.findByEmail(
        createUserDto.email,
        tenantContext.tenantId
      );
      expect(savedUser).toBeDefined();
      expect(savedUser?.getName()).toBe(createUserDto.name);
    });

    it('当邮箱已存在时应该返回错误', async () => {
      // Arrange
      const existingUser = UserTestFixtures.createUser({
        email: 'existing@example.com',
      });
      await userRepository.save(existingUser);

      const createUserDto = {
        name: '新用户',
        email: 'existing@example.com',
      };
      const tenantContext = UserTestFixtures.createTenantContext();

      // Act & Assert
      await request(app.getHttpServer())
        .post('/users')
        .set('x-tenant-id', tenantContext.tenantId.toString())
        .set('x-user-id', tenantContext.userId.toString())
        .send(createUserDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('邮箱已存在');
        });
    });
  });
});
```

### 端到端测试规范

#### 端到端测试结构

```typescript
// ✅ 正确：端到端测试结构
describe('用户管理端到端测试', () => {
  let app: INestApplication;
  let testDatabase: TestDatabase;

  beforeAll(async () => {
    // 设置测试数据库
    testDatabase = new TestDatabase();
    await testDatabase.setup();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CoreModule.forRoot({
          cqrs: { enableEventSourcing: true },
          multiTenancy: { enableMultiTenancy: true },
        }),
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await testDatabase.teardown();
  });

  beforeEach(async () => {
    await testDatabase.clear();
  });

  describe('用户完整生命周期', () => {
    it('应该完成用户创建、更新、删除的完整流程', async () => {
      // 1. 创建用户
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set('x-tenant-id', 'test-tenant')
        .set('x-user-id', 'test-user')
        .send({
          name: '张三',
          email: 'zhangsan@example.com',
        })
        .expect(201);

      const userId = createResponse.body.id;

      // 2. 获取用户
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('x-tenant-id', 'test-tenant')
        .set('x-user-id', 'test-user')
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('张三');
          expect(res.body.email).toBe('zhangsan@example.com');
        });

      // 3. 更新用户
      await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .set('x-tenant-id', 'test-tenant')
        .set('x-user-id', 'test-user')
        .send({
          name: '李四',
        })
        .expect(200);

      // 4. 验证更新
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('x-tenant-id', 'test-tenant')
        .set('x-user-id', 'test-user')
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('李四');
        });

      // 5. 删除用户
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('x-tenant-id', 'test-tenant')
        .set('x-user-id', 'test-user')
        .expect(200);

      // 6. 验证删除
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('x-tenant-id', 'test-tenant')
        .set('x-user-id', 'test-user')
        .expect(404);
    });
  });
});
```

### 测试辅助工具

#### 测试数据库助手

```typescript
// ✅ 正确：测试数据库助手
export class TestDatabase {
  private connection: Connection;

  async setup(): Promise<void> {
    // 设置测试数据库连接
    this.connection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      entities: [UserORMEntity],
      synchronize: true,
    });
  }

  async teardown(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
    }
  }

  async clear(): Promise<void> {
    // 清理所有测试数据
    await this.connection.synchronize(true);
  }

  getConnection(): Connection {
    return this.connection;
  }
}
```

#### 测试模拟助手

```typescript
// ✅ 正确：测试模拟助手
export class TestMocks {
  static createMockUserRepository(): jest.Mocked<IUserRepository> {
    return {
      findById: jest.fn(),
      findByTenant: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
      countByTenant: jest.fn(),
    };
  }

  static createMockEventBus(): jest.Mocked<IEventBus> {
    return {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
  }

  static createMockAIService(): jest.Mocked<IAIService> {
    return {
      processText: jest.fn(),
      generateResponse: jest.fn(),
      analyzeData: jest.fn(),
      processBusinessLogic: jest.fn(),
      generateWorkflow: jest.fn(),
      optimizeProcess: jest.fn(),
    };
  }
}
```

---

## 总结

本文档为Aiofix-AI-SaaS平台制定了完整的文件组织和测试代码规范，涵盖：

### 📁 **文件组织规范**

1. **目录结构**：清晰的领域模块组织
2. **文件命名**：统一的kebab-case命名规范
3. **导出管理**：规范的模块导出结构

### 🧪 **测试代码规范**

1. **测试组织**：单元测试与被测试文件同级，集成测试和端到端测试独立组织
2. **测试结构**：清晰的测试类和方法组织
3. **测试数据**：统一的测试夹具管理
4. **测试隔离**：单元测试、集成测试、端到端测试分层组织

### 🚀 **核心价值**

- **一致性**：统一的文件组织和测试规范
- **可读性**：清晰的文件结构和测试组织
- **可维护性**：规范的文件组织和测试结构
- **可测试性**：完整的测试覆盖和测试组织
- **模块化**：按功能模块组织代码和测试

通过遵循这些规范，团队可以构建高质量、可维护、可扩展的AI原生企业级应用，确保代码质量和开发效率。

---

## 相关文档

- [代码规范](./03-01-code-standards.md)
- [注释规范](./03-02-comment-standards.md)
