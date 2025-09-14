# Aiofix-AI-SaaS 平台代码规范

## 概述

本文档为Aiofix-AI-SaaS平台制定统一的代码规范，确保代码质量、可维护性和团队协作效率，同时支持AI原生企业级应用的开发需求。

## 设计原则

### 核心原则

1. **一致性**：所有代码遵循统一的命名、结构和风格规范
2. **可读性**：代码结构清晰易懂，便于团队协作
3. **可维护性**：代码结构清晰，便于扩展和修改
4. **类型安全**：充分利用TypeScript的类型系统
5. **AI原生**：代码设计支持AI能力的深度集成
6. **企业级**：支持多租户、多组织、多部门的企业级特性

### 技术原则

- **DDD驱动**：遵循领域驱动设计原则
- **Clean Architecture**：遵循四层清洁架构分层原则（Domain、Application、Infrastructure、Interface）
- **CQRS模式**：命令查询分离，事件驱动
- **依赖倒置**：通过接口和抽象类实现依赖倒置
- **单一职责**：每个类和方法职责单一明确

## 目录结构

1. [通用代码规范](#通用代码规范)
2. [TypeScript规范](#typescript规范)
3. [NestJS规范](#nestjs规范)
4. [DDD代码规范](#ddd代码规范)
5. [CQRS代码规范](#cqrs代码规范)
6. [多租户代码规范](#多租户代码规范)
7. [AI集成代码规范](#ai集成代码规范)

---

## 通用代码规范

### 命名规范

#### 文件命名

```typescript
// ✅ 正确：使用kebab-case
user-profile.entity.ts
create-user.command.ts
user-created.event.ts
user-repository.interface.ts

// ❌ 错误：使用camelCase或PascalCase
userProfile.entity.ts
CreateUser.command.ts
UserCreated.event.ts
```

#### 类命名

```typescript
// ✅ 正确：使用PascalCase
export class UserProfile extends TenantAwareEntity {}
export class CreateUserCommand extends TenantCommand {}
export class UserCreatedEvent extends TenantEvent {}
export class UserRepository extends TenantEntityRepository<User> {}

// ❌ 错误：使用camelCase
export class userProfile extends TenantAwareEntity {}
export class createUserCommand extends TenantCommand {}
```

#### 接口命名

```typescript
// ✅ 正确：使用I前缀 + PascalCase
export interface IUserRepository {}
export interface IAIService {}
export interface ITenantContext {}

// ❌ 错误：不使用I前缀
export interface UserRepository {}
export interface AIService {}
```

#### 方法命名

```typescript
// ✅ 正确：使用camelCase，动词开头
export class UserService {
  async createUser(command: CreateUserCommand): Promise<User> {}
  async updateUserProfile(id: EntityId, data: UpdateUserProfileDto): Promise<void> {}
  async softDeleteUser(id: EntityId, deletedBy: UserId): Promise<void> {}
  async restoreUser(id: EntityId, restoredBy: UserId): Promise<void> {}
  
  // 查询方法使用get/find前缀
  async getUserById(id: EntityId): Promise<User | null> {}
  async findUsersByTenant(tenantId: TenantId): Promise<User[]> {}
  async getActiveUsers(): Promise<User[]> {}
}

// ❌ 错误：使用名词或不清楚的动词
export class UserService {
  async user(command: CreateUserCommand): Promise<User> {}
  async userProfile(id: EntityId, data: UpdateUserProfileDto): Promise<void> {}
  async delete(id: EntityId): Promise<void> {} // 不清楚是软删除还是硬删除
}
```

#### 变量命名

```typescript
// ✅ 正确：使用camelCase，语义清晰
const userId = EntityId.generate();
const tenantId = TenantId.fromString('tenant-123');
const userProfile = await this.userRepository.findById(userId);
const isActive = user.status === UserStatus.ACTIVE;
const hasPermission = await this.permissionService.checkPermission(userId, 'user.create');

// ❌ 错误：使用缩写或不清晰的命名
const uid = EntityId.generate();
const tid = TenantId.fromString('tenant-123');
const up = await this.userRepository.findById(uid);
const flag = user.status === UserStatus.ACTIVE;
```

#### 常量命名

```typescript
// ✅ 正确：使用UPPER_SNAKE_CASE
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_RETRY_ATTEMPTS = 3;
export const AI_MODEL_TIMEOUT = 30000;
export const TENANT_QUOTA_LIMIT = 1000;

// ❌ 错误：使用camelCase
export const defaultPageSize = 10;
export const maxRetryAttempts = 3;
```

### 代码结构规范

#### 导入顺序

```typescript
// ✅ 正确：按以下顺序组织导入
// 1. Node.js内置模块
import { EventEmitter } from 'events';

// 2. 第三方库
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

// 3. 项目内部模块（按路径深度排序）
import { EntityId, TenantId, UserId } from '@aiofix-ai-saas-practice/core';
import { User } from '../domain/entities/user.entity';
import { CreateUserCommand } from '../application/commands/create-user.command';
import { UserRepository } from '../infrastructure/repositories/user.repository';

// 4. 相对路径导入
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
```

#### 类成员顺序

```typescript
// ✅ 正确：按以下顺序组织类成员
export class UserService {
  // 1. 静态属性
  private static readonly DEFAULT_PAGE_SIZE = 10;
  
  // 2. 实例属性
  private readonly logger = new Logger(UserService.name);
  
  // 3. 构造函数
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly aiService: IAIService
  ) {}
  
  // 4. 公共方法
  async createUser(command: CreateUserCommand): Promise<User> {
    // 实现
  }
  
  // 5. 私有方法
  private async validateUserData(data: CreateUserDto): Promise<void> {
    // 实现
  }
  
  // 6. 受保护方法
  protected async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    // 实现
  }
}
```

#### 方法参数顺序

```typescript
// ✅ 正确：参数按重要性排序
export class UserService {
  // 1. 标识符参数（ID、Key等）
  // 2. 业务数据参数
  // 3. 配置参数
  // 4. 可选参数
  async updateUser(
    userId: EntityId,           // 标识符
    tenantId: TenantId,         // 租户上下文
    updateData: UpdateUserDto,  // 业务数据
    updatedBy: UserId,          // 操作者
    options?: UpdateOptions     // 可选配置
  ): Promise<User> {
    // 实现
  }
}
```

### 错误处理规范

#### 异常类型

```typescript
// ✅ 正确：使用具体的异常类型
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidTenantAccessError extends Error {
  constructor(tenantId: string) {
    super(`Access denied for tenant ${tenantId}`);
    this.name = 'InvalidTenantAccessError';
  }
}

export class AIQuotaExceededError extends Error {
  constructor(tenantId: string, quota: number) {
    super(`AI quota exceeded for tenant ${tenantId}. Limit: ${quota}`);
    this.name = 'AIQuotaExceededError';
  }
}
```

#### 异常处理

```typescript
// ✅ 正确：适当的异常处理
export class UserService {
  async getUserById(id: EntityId, tenantId: TenantId): Promise<User> {
    try {
      const user = await this.userRepository.findByTenantAndId(id, tenantId);
      if (!user) {
        throw new UserNotFoundError(id.toString());
      }
      return user;
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw error; // 重新抛出业务异常
      }
      this.logger.error(`Failed to get user ${id.toString()}`, error);
      throw new InternalServerError('Failed to retrieve user');
    }
  }
}
```

---

## TypeScript规范

### 类型定义规范

#### 基础类型

```typescript
// ✅ 正确：使用明确的类型定义
interface CreateUserDto {
  readonly name: string;
  readonly email: string;
  readonly tenantId: string;
  readonly organizationId?: string;
  readonly departmentId?: string;
}

// ✅ 正确：使用联合类型
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

// ✅ 正确：使用枚举
enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest'
}

// ❌ 错误：使用any类型
interface CreateUserDto {
  name: any;
  email: any;
  data: any;
}
```

#### 泛型使用

```typescript
// ✅ 正确：使用有意义的泛型参数名
interface IRepository<TEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
  delete(id: TId): Promise<void>;
}

// ✅ 正确：约束泛型类型
interface ICommandHandler<TCommand extends Command, TResult> {
  execute(command: TCommand): Promise<TResult>;
}

// ❌ 错误：使用无意义的泛型参数名
interface IRepository<T, U> {
  findById(id: U): Promise<T | null>;
}
```

#### 类型守卫

```typescript
// ✅ 正确：使用类型守卫
function isUser(entity: BaseEntity): entity is User {
  return entity instanceof User;
}

function isTenantAware(entity: BaseEntity): entity is TenantAwareEntity {
  return 'tenantId' in entity;
}

// 使用类型守卫
if (isUser(entity)) {
  // TypeScript知道entity是User类型
  entity.updateProfile(name, email);
}
```

### 接口设计规范

#### 接口定义

```typescript
// ✅ 正确：接口职责单一，命名清晰
interface IUserRepository {
  findById(id: EntityId): Promise<User | null>;
  findByTenant(tenantId: TenantId): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: EntityId): Promise<void>;
}

interface IUserService {
  createUser(command: CreateUserCommand): Promise<User>;
  updateUser(command: UpdateUserCommand): Promise<User>;
  deleteUser(command: DeleteUserCommand): Promise<void>;
}

// ❌ 错误：接口职责过多
interface IUserManager {
  // 包含了仓储、服务、事件处理等多种职责
  findById(id: EntityId): Promise<User | null>;
  createUser(command: CreateUserCommand): Promise<User>;
  publishEvent(event: DomainEvent): Promise<void>;
  validatePermission(userId: EntityId, permission: string): Promise<boolean>;
}
```

#### 可选属性

```typescript
// ✅ 正确：明确标记可选属性
interface UpdateUserDto {
  readonly name?: string;
  readonly email?: string;
  readonly avatar?: string;
  readonly status?: UserStatus;
  readonly organizationId?: OrganizationId;
  readonly departmentId?: EntityId;
}

// ✅ 正确：使用Partial工具类型
type CreateUserDto = Partial<UpdateUserDto> & {
  readonly name: string; // 必需属性
  readonly email: string; // 必需属性
};
```

---

## NestJS规范

### 装饰器使用规范

#### 依赖注入

```typescript
// ✅ 正确：使用@Injectable装饰器
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: Logger
  ) {}
}

// ✅ 正确：使用@Inject装饰器注入接口
@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('IEventBus') private readonly eventBus: IEventBus
  ) {}
}
```

#### 控制器规范

```typescript
// ✅ 正确：控制器结构清晰
@Controller('users')
@UseGuards(TenantGuard, PermissionGuard)
export class UserController extends TenantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly userService: UserService
  ) {
    super(commandBus, queryBus);
  }

  @Post()
  @RequirePermission('user.create')
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  async createUser(
    @Body() dto: CreateUserDto,
    @Req() req: Request
  ): Promise<UserResponseDto> {
    const command = new CreateUserCommand(
      this.extractTenantId(req),
      this.extractUserId(req),
      dto
    );
    
    const user = await this.executeCommand(command);
    return UserResponseDto.fromEntity(user);
  }

  @Get(':id')
  @RequirePermission('user.read')
  @ApiOperation({ summary: '获取用户信息' })
  async getUser(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<UserResponseDto> {
    const query = new GetUserQuery(
      this.extractTenantId(req),
      this.extractUserId(req),
      EntityId.fromString(id)
    );
    
    const user = await this.executeQuery(query);
    return UserResponseDto.fromEntity(user);
  }
}
```

#### 模块组织

```typescript
// ✅ 正确：模块结构清晰，遵循Clean Architecture四层结构
@Module({
  imports: [
    CoreModule.forRoot({
      cqrs: {
        enableEventSourcing: true,
        enableMultiTenancy: true,
      },
    }),
    UserModule,
  ],
  controllers: [UserController], // Interface Layer
  providers: [
    // Application Layer
    UserService,
    CreateUserUseCase,
    UpdateUserUseCase,
    
    // Infrastructure Layer
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'ICommandBus',
      useClass: CommandBus,
    },
    {
      provide: 'IQueryBus',
      useClass: QueryBus,
    },
    {
      provide: 'IEventBus',
      useClass: EventBus,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
```

---

## DDD代码规范

### 实体设计规范

#### 基础实体

```typescript
// ✅ 正确：实体设计遵循DDD原则
@Entity()
export class UserProfile extends TenantAwareEntity {
  @Property()
  private name: string;

  @Property()
  private email: string;

  @Property()
  private avatar: string;

  @Property()
  private status: UserStatus;

  constructor(
    tenantId: TenantId,
    name: string,
    email: string,
    createdBy: UserId
  ) {
    super(tenantId, createdBy);
    this.name = name;
    this.email = email;
    this.avatar = '';
    this.status = UserStatus.ACTIVE;
  }

  // 业务方法
  updateProfile(name: string, email: string, updatedBy: UserId): void {
    this.validateActive();
    this.name = name;
    this.email = email;
    this.updateVersion(updatedBy);
  }

  updateAvatar(avatar: string, updatedBy: UserId): void {
    this.validateActive();
    this.avatar = avatar;
    this.updateVersion(updatedBy);
  }

  activate(activatedBy: UserId): void {
    if (this.status === UserStatus.ACTIVE) {
      throw new UserAlreadyActiveError(this.id.toString());
    }
    this.status = UserStatus.ACTIVE;
    this.updateVersion(activatedBy);
  }

  deactivate(deactivatedBy: UserId, reason?: string): void {
    this.validateActive();
    this.status = UserStatus.INACTIVE;
    this.updateVersion(deactivatedBy);
  }

  // 私有方法
  private validateActive(): void {
    if (this.status !== UserStatus.ACTIVE) {
      throw new UserNotActiveError(this.id.toString());
    }
  }

  // 访问器
  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  getStatus(): UserStatus {
    return this.status;
  }
}
```

#### 聚合根设计

```typescript
// ✅ 正确：聚合根设计
export class User extends TenantAwareAggregateRoot {
  private name: string;
  private email: string;
  private status: UserStatus;
  private roles: string[];
  private profile: UserProfile;

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
    this.status = UserStatus.ACTIVE;
    this.roles = [];
    
    // 发布领域事件
    this.addEvent(new UserCreatedEvent(
      id,
      tenantId,
      name,
      email,
      createdBy
    ));
  }

  // 业务方法
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

  assignRole(role: string, assignedBy: UserId): void {
    if (this.roles.includes(role)) return;
    
    this.roles.push(role);
    
    this.addEvent(new UserRoleAssignedEvent(
      this.id,
      this.tenantId,
      role,
      assignedBy
    ));
  }

  // 事件应用
  protected applyEvent(event: DomainEvent, isFromHistory: boolean = false): void {
    if (event instanceof UserCreatedEvent) {
      this.name = event.name;
      this.email = event.email;
      this.status = UserStatus.ACTIVE;
    } else if (event instanceof UserNameUpdatedEvent) {
      this.name = event.newName;
    } else if (event instanceof UserRoleAssignedEvent) {
      this.roles.push(event.role);
    }
  }
}
```

### 值对象设计规范

```typescript
// ✅ 正确：值对象设计
export class EntityId extends ValueObject {
  constructor(public readonly value: string) {
    super();
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.length === 0) {
      throw new InvalidEntityIdError('Entity ID cannot be empty');
    }
    
    if (!this.isValidUUID(this.value)) {
      throw new InvalidEntityIdError('Entity ID must be a valid UUID v4');
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static generate(): EntityId {
    return new EntityId(UUIDUtils.generate());
  }

  static fromString(value: string): EntityId {
    return new EntityId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: EntityId): boolean {
    return this.value === other.value;
  }
}
```

---

## CQRS代码规范

### 命令设计规范

#### 命令定义

```typescript
// ✅ 正确：命令设计
export class CreateUserCommand extends TenantCommand<CreateUserDto> {
  constructor(
    tenantId: TenantId,
    userId: UserId,
    public readonly name: string,
    public readonly email: string,
    public readonly organizationId?: OrganizationId,
    public readonly departmentId?: EntityId,
    timestamp?: Date
  ) {
    super(tenantId, userId, timestamp);
  }
}

export class UpdateUserCommand extends TenantCommand<UpdateUserDto> {
  constructor(
    tenantId: TenantId,
    userId: UserId,
    public readonly targetUserId: EntityId,
    public readonly updateData: UpdateUserDto,
    timestamp?: Date
  ) {
    super(tenantId, userId, timestamp);
  }
}
```

#### 命令处理器

```typescript
// ✅ 正确：命令处理器设计
@CommandHandler(CreateUserCommand)
export class CreateUserHandler extends TenantCommandHandler<CreateUserCommand, User> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly aiService: IAIService
  ) {
    super();
  }

  async execute(command: CreateUserCommand): Promise<User> {
    // 1. 验证租户访问权限
    this.validateTenantAccess(command);

    // 2. 验证业务规则
    await this.validateBusinessRules(command);

    // 3. 创建聚合根
    const user = new User(
      EntityId.generate(),
      command.tenantId,
      command.name,
      command.email,
      command.userId
    );

    // 4. 保存聚合根
    await this.userRepository.save(user);

    // 5. 发布事件
    await this.eventBus.publishAll(user.getUncommittedEvents());

    return user;
  }

  private async validateBusinessRules(command: CreateUserCommand): Promise<void> {
    // 验证邮箱唯一性
    const existingUser = await this.userRepository.findByEmail(command.email, command.tenantId);
    if (existingUser) {
      throw new UserEmailAlreadyExistsError(command.email);
    }
  }
}
```

### 查询设计规范

#### 查询定义

```typescript
// ✅ 正确：查询设计
export class GetUserQuery extends TenantQuery<User> {
  constructor(
    tenantId: TenantId,
    userId: UserId,
    public readonly targetUserId: EntityId,
    timestamp?: Date
  ) {
    super(tenantId, userId, timestamp);
  }
}

export class GetUsersQuery extends PaginatedQuery<User[]> {
  constructor(
    tenantId: TenantId,
    userId: UserId,
    public readonly organizationId?: OrganizationId,
    public readonly departmentId?: EntityId,
    public readonly status?: UserStatus,
    page: number = 1,
    limit: number = 10,
    timestamp?: Date
  ) {
    super(tenantId, userId, page, limit, timestamp);
  }
}
```

#### 查询处理器

```typescript
// ✅ 正确：查询处理器设计
@QueryHandler(GetUserQuery)
export class GetUserHandler extends TenantQueryHandler<GetUserQuery, User> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly permissionService: IPermissionService
  ) {
    super();
  }

  async execute(query: GetUserQuery): Promise<User> {
    // 1. 验证租户访问权限
    this.validateTenantAccess(query);

    // 2. 验证数据访问权限
    await this.validateDataAccess(query);

    // 3. 执行查询
    const user = await this.userRepository.findByTenantAndId(
      query.targetUserId,
      query.tenantId
    );

    if (!user) {
      throw new UserNotFoundError(query.targetUserId.toString());
    }

    return user;
  }

  private async validateDataAccess(query: GetUserQuery): Promise<void> {
    const hasPermission = await this.permissionService.checkPermission(
      query.userId,
      'user.read',
      query.tenantId
    );

    if (!hasPermission) {
      throw new ForbiddenError('Insufficient permissions to read user data');
    }
  }
}
```

### 事件设计规范

#### 事件定义

```typescript
// ✅ 正确：事件设计
export class UserCreatedEvent extends TenantEvent {
  constructor(
    aggregateId: EntityId,
    tenantId: TenantId,
    public readonly name: string,
    public readonly email: string,
    public readonly createdBy: UserId,
    occurredOn?: Date,
    version?: number
  ) {
    super(aggregateId, tenantId, occurredOn, version);
  }
}

export class UserNameUpdatedEvent extends TenantEvent {
  constructor(
    aggregateId: EntityId,
    tenantId: TenantId,
    public readonly oldName: string,
    public readonly newName: string,
    public readonly updatedBy: UserId,
    occurredOn?: Date,
    version?: number
  ) {
    super(aggregateId, tenantId, occurredOn, version);
  }
}
```

#### 事件处理器

```typescript
// ✅ 正确：事件处理器设计
@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler extends EventHandler<UserCreatedEvent> {
  constructor(
    private readonly notificationService: INotificationService,
    private readonly auditService: IAuditService,
    private readonly aiService: IAIService
  ) {
    super();
  }

  async handle(event: UserCreatedEvent): Promise<void> {
    // 1. 记录审计日志
    await this.auditService.logUserAction({
      userId: event.createdBy,
      tenantId: event.tenantId,
      action: 'USER_CREATED',
      targetUserId: event.aggregateId,
      details: {
        name: event.name,
        email: event.email
      },
      timestamp: event.occurredOn
    });

    // 2. 发送通知
    await this.notificationService.sendUserCreatedNotification({
      tenantId: event.tenantId,
      userId: event.aggregateId,
      userName: event.name,
      userEmail: event.email,
      createdBy: event.createdBy
    });

    // 3. AI增强处理
    await this.enhanceWithAI(event);
  }

  private async enhanceWithAI(event: UserCreatedEvent): Promise<void> {
    try {
      const aiContext: AIContext = {
        tenantId: event.tenantId,
        userId: event.createdBy,
        model: 'gpt-4',
        parameters: {}
      };

      // AI分析用户创建模式
      const analysis = await this.aiService.analyzeUserCreationPattern({
        name: event.name,
        email: event.email,
        tenantId: event.tenantId.toString()
      }, aiContext);

      // 发布AI分析完成事件
      await this.eventBus.publish(new UserCreationPatternAnalyzedEvent(
        event.aggregateId,
        event.tenantId,
        analysis,
        event.createdBy
      ));
    } catch (error) {
      this.logger.warn(`AI enhancement failed for user creation event`, error);
    }
  }
}
```

---

## 多租户代码规范

### 租户上下文管理

#### 租户上下文定义

```typescript
// ✅ 正确：租户上下文设计
export interface TenantContext {
  readonly tenantId: TenantId;
  readonly userId: UserId;
  readonly organizationId?: OrganizationId;
  readonly departmentId?: EntityId;
  readonly permissions: string[];
  readonly features: string[];
  readonly aiQuota: AIQuota;
  readonly subscription: SubscriptionInfo;
}

export interface AIQuota {
  readonly totalQuota: number;
  readonly usedQuota: number;
  readonly remainingQuota: number;
  readonly resetDate: Date;
}

export interface SubscriptionInfo {
  readonly plan: string;
  readonly features: string[];
  readonly limits: Record<string, number>;
  readonly expiresAt: Date;
}
```

#### 租户中间件

```typescript
// ✅ 正确：租户中间件设计
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantService: ITenantService,
    private readonly permissionService: IPermissionService,
    private readonly subscriptionService: ISubscriptionService,
    private readonly aiQuotaService: IAIQuotaService
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. 提取租户标识
      const tenantId = this.extractTenantId(req);
      const userId = this.extractUserId(req);

      // 2. 验证租户状态
      const tenant = await this.tenantService.getTenant(tenantId);
      if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
        throw new TenantNotFoundError(tenantId.toString());
      }

      // 3. 获取用户权限
      const permissions = await this.permissionService.getUserPermissions(
        userId,
        tenantId
      );

      // 4. 获取订阅信息
      const subscription = await this.subscriptionService.getSubscription(tenantId);

      // 5. 获取AI配额信息
      const aiQuota = await this.aiQuotaService.getQuota(tenantId);

      // 6. 构建租户上下文
      req.tenantContext = {
        tenantId,
        userId,
        organizationId: this.extractOrganizationId(req),
        departmentId: this.extractDepartmentId(req),
        permissions,
        features: subscription.features,
        aiQuota,
        subscription
      };

      next();
    } catch (error) {
      this.logger.error('Failed to setup tenant context', error);
      throw new UnauthorizedError('Invalid tenant context');
    }
  }

  private extractTenantId(req: Request): TenantId {
    // 从子域名提取
    const subdomain = req.hostname.split('.')[0];
    if (subdomain && subdomain !== 'www') {
      return TenantId.fromString(subdomain);
    }

    // 从请求头提取
    const tenantIdHeader = req.headers['x-tenant-id'] as string;
    if (tenantIdHeader) {
      return TenantId.fromString(tenantIdHeader);
    }

    throw new UnauthorizedError('Tenant ID not found');
  }

  private extractUserId(req: Request): UserId {
    const userIdHeader = req.headers['x-user-id'] as string;
    if (!userIdHeader) {
      throw new UnauthorizedError('User ID not found');
    }
    return UserId.fromString(userIdHeader);
  }
}
```

### 租户感知实体

#### 租户实体基类

```typescript
// ✅ 正确：租户感知实体设计
export abstract class TenantAwareEntity extends BaseEntity {
  @Property()
  protected tenantId: TenantId;

  constructor(tenantId: TenantId, createdBy: UserId) {
    super();
    this.tenantId = tenantId;
    this.createdBy = createdBy;
    this.updatedBy = createdBy;
  }

  getTenantId(): TenantId {
    return this.tenantId;
  }

  protected validateTenantAccess(tenantId: TenantId): void {
    if (!this.tenantId.equals(tenantId)) {
      throw new ForbiddenError('Access denied: different tenant');
    }
  }

  // 租户感知的软删除
  softDelete(deletedBy: UserId, reason?: string): void {
    this.validateTenantAccess(this.tenantId);
    super.softDelete(deletedBy, reason);
  }

  // 租户感知的恢复
  restore(restoredBy: UserId): void {
    this.validateTenantAccess(this.tenantId);
    super.restore(restoredBy);
  }
}
```

#### 租户仓储基类

```typescript
// ✅ 正确：租户仓储设计
export abstract class TenantEntityRepository<TEntity extends TenantAwareEntity> 
  extends BaseEntityRepository<TEntity> {
  
  constructor(protected readonly em: EntityManager) {
    super(em);
  }

  async findByTenant(tenantId: TenantId): Promise<TEntity[]> {
    return this.em.find(this.getEntityClass(), { 
      tenantId: tenantId.toString(),
      isDeleted: false 
    });
  }

  async findByTenantAndId(id: EntityId, tenantId: TenantId): Promise<TEntity | null> {
    return this.em.findOne(this.getEntityClass(), { 
      id: id.toString(), 
      tenantId: tenantId.toString(),
      isDeleted: false
    });
  }

  async countByTenant(tenantId: TenantId): Promise<number> {
    return this.em.count(this.getEntityClass(), { 
      tenantId: tenantId.toString(),
      isDeleted: false 
    });
  }

  async findByTenantWithPagination(
    tenantId: TenantId,
    filters: any,
    page: number,
    limit: number
  ): Promise<[TEntity[], number]> {
    const query: any = {
      tenantId: tenantId.toString(),
      isDeleted: false,
      ...filters
    };

    return this.em.findAndCount(this.getEntityClass(), query, {
      limit,
      offset: (page - 1) * limit,
      orderBy: { createdAt: 'DESC' }
    });
  }

  protected abstract getEntityClass(): EntityClass<TEntity>;
}
```

### 多组织代码规范

#### 组织感知实体

```typescript
// ✅ 正确：组织感知实体设计
export abstract class OrganizationAwareEntity extends TenantAwareEntity {
  @Property()
  protected organizationId: OrganizationId;

  constructor(
    tenantId: TenantId, 
    organizationId: OrganizationId, 
    createdBy: UserId
  ) {
    super(tenantId, createdBy);
    this.organizationId = organizationId;
  }

  getOrganizationId(): OrganizationId {
    return this.organizationId;
  }

  protected validateOrganizationAccess(organizationId: OrganizationId): void {
    if (!this.organizationId.equals(organizationId)) {
      throw new ForbiddenError('Access denied: different organization');
    }
  }

  // 组织感知的软删除
  softDelete(deletedBy: UserId, reason?: string): void {
    this.validateOrganizationAccess(this.organizationId);
    super.softDelete(deletedBy, reason);
  }
}
```

#### 组织权限验证

```typescript
// ✅ 正确：组织权限验证装饰器
export function RequireOrganization(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const req = args[0] as Request;
    const tenantContext = req.tenantContext as TenantContext;
    
    if (!tenantContext.organizationId) {
      throw new ForbiddenError('Organization context required');
    }

    // 验证用户是否属于该组织
    const hasAccess = await this.organizationService.checkUserAccess(
      tenantContext.userId,
      tenantContext.organizationId,
      tenantContext.tenantId
    );

    if (!hasAccess) {
      throw new ForbiddenError('Access denied: user not member of organization');
    }

    return originalMethod.apply(this, args);
  };
}

// 使用示例
@Controller('projects')
export class ProjectController extends TenantController {
  @Post()
  @RequireOrganization
  @RequirePermission('project.create')
  async createProject(@Body() dto: CreateProjectDto, @Req() req: Request) {
    // 实现
  }
}
```

---

## AI集成代码规范

### AI服务抽象

#### AI服务接口

```typescript
// ✅ 正确：AI服务接口设计
export interface IAIService {
  processText(input: string, context: AIContext): Promise<AIResult>;
  generateResponse(prompt: string, context: AIContext): Promise<string>;
  analyzeData(data: any, context: AIContext): Promise<AnalysisResult>;
  processBusinessLogic(businessData: any, context: AIContext): Promise<BusinessInsight>;
  generateWorkflow(requirements: any, context: AIContext): Promise<WorkflowDefinition>;
  optimizeProcess(processData: any, context: AIContext): Promise<OptimizationResult>;
}

export interface AIContext {
  readonly tenantId: TenantId;
  readonly organizationId?: OrganizationId;
  readonly departmentId?: EntityId;
  readonly userId: UserId;
  readonly model: string;
  readonly parameters: Record<string, any>;
  readonly quota?: AIQuota;
}

export interface AIResult {
  readonly content: string;
  readonly confidence: number;
  readonly metadata: Record<string, any>;
  readonly usage: AIUsage;
  readonly model: string;
  readonly timestamp: Date;
}

export interface AIUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
  readonly cost: number;
}
```

#### AI服务实现

```typescript
// ✅ 正确：AI服务实现
@Injectable()
export class OpenAIService implements IAIService {
  private readonly logger = new Logger(OpenAIService.name);

  constructor(
    private readonly configService: IConfigService,
    private readonly quotaService: IAIQuotaService,
    private readonly auditService: IAuditService
  ) {}

  async processText(input: string, context: AIContext): Promise<AIResult> {
    // 1. 验证配额
    await this.validateQuota(context);

    // 2. 获取配置
    const config = await this.getAIConfig(context);

    // 3. 调用AI服务
    const startTime = Date.now();
    try {
      const response = await this.callOpenAI(input, config);
      const endTime = Date.now();

      // 4. 记录使用情况
      await this.recordUsage(context, response.usage);

      // 5. 审计日志
      await this.auditService.logAIAction({
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'TEXT_PROCESSING',
        model: context.model,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cost: response.usage.cost,
        duration: endTime - startTime
      });

      return {
        content: response.content,
        confidence: response.confidence,
        metadata: response.metadata,
        usage: response.usage,
        model: context.model,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`AI processing failed for tenant ${context.tenantId.toString()}`, error);
      throw new AIServiceError('AI processing failed', error);
    }
  }

  private async validateQuota(context: AIContext): Promise<void> {
    if (!context.quota) return;

    if (context.quota.remainingQuota <= 0) {
      throw new AIQuotaExceededError(
        context.tenantId.toString(),
        context.quota.totalQuota
      );
    }
  }

  private async getAIConfig(context: AIContext): Promise<AIConfig> {
    // 获取租户级配置
    let config = await this.configService.getTenantAIConfig(context.tenantId);

    // 组织级配置覆盖
    if (context.organizationId) {
      const orgConfig = await this.configService.getOrganizationAIConfig(
        context.organizationId
      );
      config = { ...config, ...orgConfig };
    }

    // 部门级配置覆盖
    if (context.departmentId) {
      const deptConfig = await this.configService.getDepartmentAIConfig(
        context.departmentId
      );
      config = { ...config, ...deptConfig };
    }

    return config;
  }

  private async callOpenAI(input: string, config: AIConfig): Promise<OpenAIResponse> {
    // OpenAI API调用实现
    // ...
  }

  private async recordUsage(context: AIContext, usage: AIUsage): Promise<void> {
    await this.quotaService.recordUsage(context.tenantId, usage);
  }
}
```

### AI装饰器

#### AI增强装饰器

```typescript
// ✅ 正确：AI增强装饰器
export function AIEnhanced(options: AIEnhancementOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const req = args[0] as Request;
      const tenantContext = req.tenantContext as TenantContext;

      // 执行原始方法
      const result = await originalMethod.apply(this, args);

      // AI增强处理
      if (options.enhancement && tenantContext.features.includes('ai_enhancement')) {
        try {
          const aiContext: AIContext = {
            tenantId: tenantContext.tenantId,
            organizationId: tenantContext.organizationId,
            departmentId: tenantContext.departmentId,
            userId: tenantContext.userId,
            model: options.model || 'gpt-4',
            parameters: options.parameters || {},
            quota: tenantContext.aiQuota
          };

          const aiResult = await this.aiService[options.enhancement](
            result,
            aiContext
          );

          // 将AI结果附加到响应中
          if (options.attachToResponse) {
            result.aiEnhancement = aiResult;
          }
        } catch (error) {
          this.logger.warn(`AI enhancement failed for ${propertyKey}`, error);
          // AI失败不影响主流程
        }
      }

      return result;
    };
  };
}

// 使用示例
@Controller('users')
export class UserController extends TenantController {
  @Get(':id')
  @AIEnhanced({
    enhancement: 'analyzeData',
    model: 'gpt-4',
    attachToResponse: true,
    parameters: { analysisType: 'user_profile' }
  })
  async getUser(@Param('id') id: string, @Req() req: Request) {
    // 实现
  }
}
```

---

## 总结

本文档为Aiofix-AI-SaaS平台制定了完整的代码规范，涵盖：

### 🎯 **核心规范**

1. **通用代码规范**：命名规范、代码结构、错误处理
2. **TypeScript规范**：类型定义、接口设计、泛型使用
3. **NestJS规范**：装饰器使用、控制器设计、模块组织
4. **DDD代码规范**：实体设计、聚合根设计、值对象设计
5. **CQRS代码规范**：命令设计、查询设计、事件设计
6. **多租户代码规范**：租户上下文、数据隔离、权限验证
7. **AI集成代码规范**：AI服务抽象、装饰器设计、配置管理

### 🚀 **核心价值**

- **一致性**：统一的代码风格和命名规范
- **可读性**：清晰的代码结构和组织
- **可维护性**：规范的代码结构和组织
- **AI原生**：支持AI能力的深度集成
- **企业级**：支持多租户、多组织、多部门的企业级特性

通过遵循这些规范，团队可以构建高质量、可维护、可扩展的AI原生企业级应用，确保代码质量和开发效率。

---

## 相关文档

- [注释规范](./03-02-comment-standards.md)
- [文件组织与测试代码规范](./03-03-file-organization-and-testing-standards.md)
