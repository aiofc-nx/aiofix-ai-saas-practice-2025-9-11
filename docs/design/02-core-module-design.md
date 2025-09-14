# Core模块设计方案

## 概述

Core模块是Aiofix-AI-SaaS平台的核心基础架构库，为所有业务领域模块提供统一的架构基础、共享组件和通用功能。通过Core模块，确保整个平台的技术架构一致性，提高开发效率，降低维护成本。

Core模块内置了完整的CQRS功能，并扩展了多租户、多组织、AI能力集成等企业级功能，为业务领域模块提供标准化的开发基础。通过内置CQRS，我们可以完全控制其行为并与平台的其他功能深度集成。

开发CQRS时，我们需要参考：
@nestjs/cqrs官方源码`forks/cqrs`

## 设计目标

### 核心目标

- **架构统一**：为所有业务领域提供统一的架构基础
- **组件复用**：提供可复用的通用组件和工具
- **开发效率**：简化业务模块的开发复杂度
- **维护性**：集中管理通用功能，便于维护和升级
- **扩展性**：支持新业务领域的快速集成

### 技术目标

- **类型安全**：基于TypeScript的强类型支持
- **依赖注入**：基于NestJS的依赖注入框架
- **事件驱动**：内置的标准化事件处理机制
- **CQRS支持**：内置完整的CQRS功能，支持多租户和AI集成
- **多租户**：内置多租户架构支持
- **AI集成**：标准化的AI服务抽象和集成
- **企业级**：支持多组织、多部门、权限管理等企业级功能

## 模块结构

基于 Clean Architecture 的正确分层结构：

```text
packages/core/src/
├── domain/                   # Domain Layer (企业业务规则层)
│   ├── entities/             # 领域实体基类
│   │   ├── base.entity.ts                    # 基础实体类
│   │   ├── tenant-aware.entity.ts            # 租户感知实体类
│   │   ├── organization-aware.entity.ts      # 组织感知实体类
│   │   └── department-aware.entity.ts        # 部门感知实体类
│   ├── aggregates/           # 聚合根基类
│   │   ├── base.aggregate-root.ts            # 基础聚合根类
│   │   ├── tenant-aware.aggregate-root.ts    # 租户感知聚合根类
│   │   ├── organization-aware.aggregate-root.ts # 组织感知聚合根类
│   │   └── department-aware.aggregate-root.ts   # 部门感知聚合根类
│   ├── value-objects/        # 值对象基类
│   │   ├── entity-id.ts                      # 实体ID值对象
│   │   ├── tenant-id.ts                      # 租户ID值对象
│   │   ├── organization-id.ts                # 组织ID值对象
│   │   └── user-id.ts                        # 用户ID值对象
│   ├── events/               # 领域事件基类
│   ├── repositories/         # 仓库接口 (抽象)
│   ├── services/             # 领域服务接口 (抽象)
│   ├── specifications/       # 规约模式接口 (抽象)
│   └── factories/            # 工厂接口 (抽象)
├── application/              # Application Layer (应用业务规则层)
│   ├── commands/             # 命令和命令处理器接口
│   ├── queries/              # 查询和查询处理器接口
│   ├── events/               # 事件和事件处理器接口
│   ├── services/             # 应用服务接口
│   ├── handlers/             # 处理器基类
│   └── use-cases/            # 用例实现
├── infrastructure/           # Infrastructure Layer (基础设施层)
│   ├── repositories/         # 仓库实现 (连接领域和持久化)
│   ├── services/             # 应用服务实现
│   ├── commands/             # 命令处理器实现
│   ├── queries/              # 查询处理器实现
│   ├── events/               # 事件处理器实现
│   │   ├── bus/              # 事件总线实现
│   │   └── projectors/       # 事件投射器 (Event Projectors)
│   ├── persistence/          # 数据库驱动、ORM等
│   │   ├── entities/         # 数据库实体 (Database Entities)
│   │   ├── mappers/          # 领域实体到数据库实体映射器
│   │   └── migrations/       # 数据库迁移脚本
│   ├── messaging/            # 消息队列驱动
│   ├── external/             # 外部服务驱动
│   ├── cqrs/                 # CQRS框架实现 (CommandBus, QueryBus等)
│   ├── projections/          # 读模型投射 (Read Model Projections)
│   └── factories/            # 工厂实现
├── interfaces/               # Interface Layer (接口层)
│   ├── rest/                 # REST API控制器
│   ├── graphql/              # GraphQL解析器
│   ├── grpc/                 # gRPC服务
│   └── messaging/            # 消息接口实现
├── shared/                   # 共享组件
│   ├── types/                # 通用类型
│   │   ├── common.ts                         # 通用类型定义
│   │   └── value-object.ts                   # 值对象基类
│   ├── utils/                # 工具函数
│   │   ├── tenant.utils.ts                   # 租户上下文工具
│   │   ├── event.utils.ts                    # 事件工具
│   │   └── tenant-data-filter.ts             # 租户数据过滤器
│   ├── decorators/           # 装饰器
│   │   ├── command-handler.decorator.ts      # 命令处理器装饰器
│   │   ├── query-handler.decorator.ts        # 查询处理器装饰器
│   │   ├── event-handler.decorator.ts        # 事件处理器装饰器
│   │   └── tenant.decorators.ts              # 租户相关装饰器
│   ├── validators/           # 验证器
│   ├── constants/            # 常量定义
│   ├── exceptions/           # 异常类
│   ├── context/              # 异步上下文
│   ├── publishers/           # 发布者模式
│   ├── sagas/                # Saga支持
│   ├── operators/            # 增强RxJS操作符
│   └── middleware/           # 中间件支持
└── core.module.ts            # Core模块定义
```

## 实体与聚合根设计原则

### ID标识规范

#### UUID v4标准

- **统一标识**：所有领域实体和聚合根都使用UUID v4作为唯一标识
- **格式标准**：遵循RFC 4122标准，格式为 `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- **自动生成**：实体和聚合根在构造时自动生成UUID v4
- **全局唯一**：确保跨系统、跨租户的唯一性

#### ID使用规则

```typescript
// 实体自动生成EntityId
const tenantId = TenantId.generate();
const createdBy = UserId.generate();
const userProfile = new UserProfile(tenantId, name, email, createdBy);
console.log(userProfile.id.toString()); // 自动生成的UUID v4

// 聚合根自动生成EntityId
const user = new User(EntityId.generate(), tenantId, name, email, createdBy);
console.log(user.id.toString()); // 自动生成的UUID v4

// 从字符串创建EntityId
const specificId = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');
const userWithSpecificId = new User(specificId, tenantId, name, email, createdBy);

// 验证EntityId格式
const isValid = EntityId.fromString('invalid-id'); // 抛出异常

// 转换为短格式
const shortId = user.id.toShortString(); // 去掉连字符的32位字符串
```

### 实体 vs 聚合根的区别

#### 领域实体 (Domain Entities)

- **用途**：封装业务属性、行为及状态
- **特点**：按照充血模型设计，包含业务逻辑
- **生命周期**：由应用层管理，保持领域纯净性
- **事件**：根据需要发布领域事件，具有审计追踪和软删除能力
- **适用场景**：配置数据、用户资料、简单的业务对象

#### 聚合根 (Aggregate Roots)

- **用途**：用于复杂的业务逻辑和事件驱动
- **特点**：通过事件存储重建，支持事件溯源
- **生命周期**：由仓储管理，通过事件重建状态
- **事件**：发布领域事件，支持事件驱动架构
- **适用场景**：核心业务对象、需要审计的操作、复杂的业务流程

### 使用场景对比

| 场景 | 使用实体 | 使用聚合根 |
|------|----------|------------|
| 用户基本信息 | ✅ UserProfile | ❌ |
| 用户权限管理 | ❌ | ✅ User |
| 系统配置 | ✅ SystemConfig | ❌ |
| 订单处理 | ❌ | ✅ Order |
| 日志记录 | ✅ AuditLog | ❌ |
| 业务流程 | ❌ | ✅ Workflow |

## 核心组件设计

### 1. 领域基础组件

#### 基础领域实体 (Base Domain Entities)

```typescript
// 基础领域实体
abstract class BaseEntity {
  @PrimaryKey()
  id: EntityId;

  @Property()
  createdAt: Date;

  @Property()
  updatedAt: Date;

  @Property()
  version: number;

  // 审计追踪字段
  @Property()
  createdBy: UserId;

  @Property()
  updatedBy: UserId;

  // 软删除字段
  @Property()
  isDeleted: boolean = false;

  @Property()
  deletedAt: Date | null = null;

  @Property()
  deletedBy: UserId | null = null;

  @Property()
  deleteReason: string | null = null;

  constructor() {
    this.id = EntityId.generate();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;
    this.createdBy = UserId.generate(); // 临时值，实际使用时需要传入
    this.updatedBy = this.createdBy;
  }

  protected updateVersion(updatedBy: UserId): void {
    this.version += 1;
    this.updatedAt = new Date();
    this.updatedBy = updatedBy;
  }

  // 软删除方法
  softDelete(deletedBy: UserId, reason?: string): void {
    if (this.isDeleted) {
      throw new Error('实体已被删除');
    }
    
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.deleteReason = reason;
    this.updateVersion(deletedBy);
  }

  // 恢复方法
  restore(restoredBy: UserId): void {
    if (!this.isDeleted) {
      throw new Error('实体未被删除');
    }
    
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    this.deleteReason = null;
    this.updateVersion(restoredBy);
  }

  // 检查是否活跃
  isActive(): boolean {
    return !this.isDeleted;
  }
}

// 租户感知实体
abstract class TenantAwareEntity extends BaseEntity {
  @Property()
  tenantId: TenantId;

  constructor(tenantId: TenantId, createdBy: UserId) {
    super();
    this.tenantId = tenantId;
    this.createdBy = createdBy;
    this.updatedBy = createdBy;
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

// 组织感知实体
abstract class OrganizationAwareEntity extends TenantAwareEntity {
  @Property()
  organizationId: OrganizationId;

  constructor(tenantId: TenantId, organizationId: OrganizationId, createdBy: UserId) {
    super(tenantId, createdBy);
    this.organizationId = organizationId;
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

  // 组织感知的恢复
  restore(restoredBy: UserId): void {
    this.validateOrganizationAccess(this.organizationId);
    super.restore(restoredBy);
  }
}

// 部门感知实体
abstract class DepartmentAwareEntity extends TenantAwareEntity {
  @Property()
  departmentId: EntityId; // 部门ID也使用EntityId

  constructor(tenantId: TenantId, departmentId: EntityId, createdBy: UserId) {
    super(tenantId, createdBy);
    this.departmentId = departmentId;
  }

  protected validateDepartmentAccess(departmentId: EntityId): void {
    if (!this.departmentId.equals(departmentId)) {
      throw new ForbiddenError('Access denied: different department');
    }
  }

  // 部门感知的软删除
  softDelete(deletedBy: UserId, reason?: string): void {
    this.validateDepartmentAccess(this.departmentId);
    super.softDelete(deletedBy, reason);
  }

  // 部门感知的恢复
  restore(restoredBy: UserId): void {
    this.validateDepartmentAccess(this.departmentId);
    super.restore(restoredBy);
  }
}
```

#### 基础聚合根 (Base Aggregate Roots)

```typescript
// 基础聚合根
abstract class BaseAggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];
  private version: number = 1;

  constructor(public readonly id: EntityId = EntityId.generate()) {}

  getVersion(): number {
    return this.version;
  }

  protected addEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
    this.version += 1;
  }

  loadFromHistory(events: DomainEvent[]): void {
    events.forEach(event => {
      this.applyEvent(event, true);
      this.version = event.version;
    });
  }

  protected applyEvent(event: DomainEvent, isFromHistory: boolean = false): void {
    // 子类实现具体的事件应用逻辑
  }
}

// 租户感知聚合根
abstract class TenantAwareAggregateRoot extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    public readonly tenantId: TenantId
  ) {
    super(id);
  }

  protected validateTenantContext(tenantId: TenantId): void {
    if (!this.tenantId.equals(tenantId)) {
      throw new ForbiddenError('Access denied: different tenant');
    }
  }
}

// 组织感知聚合根
abstract class OrganizationAwareAggregateRoot extends TenantAwareAggregateRoot {
  constructor(
    id: EntityId,
    tenantId: TenantId,
    public readonly organizationId: OrganizationId
  ) {
    super(id, tenantId);
  }

  protected validateOrganizationContext(organizationId: OrganizationId): void {
    if (!this.organizationId.equals(organizationId)) {
      throw new ForbiddenError('Access denied: different organization');
    }
  }
}

// 部门感知聚合根
abstract class DepartmentAwareAggregateRoot extends TenantAwareAggregateRoot {
  constructor(
    id: EntityId,
    tenantId: TenantId,
    public readonly departmentId: EntityId
  ) {
    super(id, tenantId);
  }

  protected validateDepartmentContext(departmentId: EntityId): void {
    if (!this.departmentId.equals(departmentId)) {
      throw new ForbiddenError('Access denied: different department');
    }
  }
}
```

#### 基础值对象 (Base Value Objects)

```typescript
// 实体ID值对象 - 封装UUID v4业务规则
class EntityId extends ValueObject {
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

  // 生成新的EntityId
  static generate(): EntityId {
    return new EntityId(UUIDUtils.generate());
  }

  // 从字符串创建EntityId
  static fromString(value: string): EntityId {
    return new EntityId(value);
  }

  // 转换为字符串
  toString(): string {
    return this.value;
  }

  // 转换为短格式（去掉连字符）
  toShortString(): string {
    return this.value.replace(/-/g, '');
  }
}

// 租户ID值对象
class TenantId extends ValueObject {
  constructor(public readonly value: string) {
    super();
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.length === 0) {
      throw new InvalidTenantIdError('Tenant ID cannot be empty');
    }
    
    if (!this.isValidUUID(this.value)) {
      throw new InvalidTenantIdError('Tenant ID must be a valid UUID v4');
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static generate(): TenantId {
    return new TenantId(UUIDUtils.generate());
  }

  static fromString(value: string): TenantId {
    return new TenantId(value);
  }

  toString(): string {
    return this.value;
  }
}

// 组织ID值对象
class OrganizationId extends ValueObject {
  constructor(public readonly value: string) {
    super();
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.length === 0) {
      throw new InvalidOrganizationIdError('Organization ID cannot be empty');
    }
    
    if (!this.isValidUUID(this.value)) {
      throw new InvalidOrganizationIdError('Organization ID must be a valid UUID v4');
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static generate(): OrganizationId {
    return new OrganizationId(UUIDUtils.generate());
  }

  static fromString(value: string): OrganizationId {
    return new OrganizationId(value);
  }

  toString(): string {
    return this.value;
  }
}

// 用户ID值对象
class UserId extends ValueObject {
  constructor(public readonly value: string) {
    super();
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.length === 0) {
      throw new InvalidUserIdError('User ID cannot be empty');
    }
    
    if (!this.isValidUUID(this.value)) {
      throw new InvalidUserIdError('User ID must be a valid UUID v4');
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static generate(): UserId {
    return new UserId(UUIDUtils.generate());
  }

  static fromString(value: string): UserId {
    return new UserId(value);
  }

  toString(): string {
    return this.value;
  }
}
```

#### 基础事件 (Base Events)

```typescript
// 领域事件基类
abstract class DomainEvent implements IEvent {
  constructor(
    public readonly aggregateId: EntityId,
    public readonly tenantId: TenantId,
    public readonly occurredOn: Date = new Date(),
    public readonly version: number = 1
  ) {}
}

// 租户事件基类
abstract class TenantEvent extends DomainEvent {
  constructor(
    aggregateId: EntityId,
    public readonly tenantId: TenantId,
    occurredOn?: Date,
    version?: number
  ) {
    super(aggregateId, tenantId, occurredOn, version);
  }
}

// 组织事件基类
abstract class OrganizationEvent extends TenantEvent {
  constructor(
    aggregateId: EntityId,
    tenantId: TenantId,
    public readonly organizationId: OrganizationId,
    occurredOn?: Date,
    version?: number
  ) {
    super(aggregateId, tenantId, occurredOn, version);
  }
}

// 部门事件基类
abstract class DepartmentEvent extends TenantEvent {
  constructor(
    aggregateId: EntityId,
    tenantId: TenantId,
    public readonly departmentId: EntityId,
    occurredOn?: Date,
    version?: number
  ) {
    super(aggregateId, tenantId, occurredOn, version);
  }
}
```

### 2. 应用基础组件

#### 命令基础 (Command Base)

```typescript
// 命令基类
abstract class Command<T = any> implements ICommand {
  constructor(
    public readonly tenantId: TenantId,
    public readonly userId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

// 租户命令基类
abstract class TenantCommand<T = any> extends Command<T> {
  constructor(
    public readonly tenantId: TenantId,
    userId: UserId,
    timestamp?: Date
  ) {
    super(tenantId, userId, timestamp);
  }
}

// 组织命令基类
abstract class OrganizationCommand<T = any> extends TenantCommand<T> {
  constructor(
    tenantId: TenantId,
    userId: UserId,
    public readonly organizationId: OrganizationId,
    timestamp?: Date
  ) {
    super(tenantId, userId, timestamp);
  }
}

// 部门命令基类
abstract class DepartmentCommand<T = any> extends TenantCommand<T> {
  constructor(
    tenantId: TenantId,
    userId: UserId,
    public readonly departmentId: EntityId,
    timestamp?: Date
  ) {
    super(tenantId, userId, timestamp);
  }
}
```

#### 查询基础 (Query Base)

```typescript
// 查询基类
abstract class Query<T = any> implements IQuery {
  constructor(
    public readonly tenantId: TenantId,
    public readonly userId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

// 分页查询基类
abstract class PaginatedQuery<T = any> extends Query<T> {
  constructor(
    tenantId: TenantId,
    userId: UserId,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    timestamp?: Date
  ) {
    super(tenantId, userId, timestamp);
  }
}

// 租户查询基类
abstract class TenantQuery<T = any> extends Query<T> {
  constructor(
    public readonly tenantId: TenantId,
    userId: UserId,
    timestamp?: Date
  ) {
    super(tenantId, userId, timestamp);
  }
}

// 组织查询基类
abstract class OrganizationQuery<T = any> extends TenantQuery<T> {
  constructor(
    tenantId: TenantId,
    userId: UserId,
    public readonly organizationId: OrganizationId,
    timestamp?: Date
  ) {
    super(tenantId, userId, timestamp);
  }
}
```

#### 处理器基础 (Handler Base)

```typescript
// 命令处理器基类
abstract class CommandHandler<TCommand extends Command, TResult> implements ICommandHandler<TCommand> {
  abstract execute(command: TCommand): Promise<TResult>;
}

// 查询处理器基类
abstract class QueryHandler<TQuery extends Query, TResult> implements IQueryHandler<TQuery> {
  abstract execute(query: TQuery): Promise<TResult>;
}

// 事件处理器基类
abstract class EventHandler<TEvent extends DomainEvent> implements IEventHandler<TEvent> {
  abstract handle(event: TEvent): Promise<void>;
}

// 租户命令处理器基类
abstract class TenantCommandHandler<TCommand extends TenantCommand, TResult> extends CommandHandler<TCommand, TResult> {
  protected validateTenantAccess(command: TCommand): void {
    // 租户访问验证逻辑
  }
}

// 组织命令处理器基类
abstract class OrganizationCommandHandler<TCommand extends OrganizationCommand, TResult> extends TenantCommandHandler<TCommand, TResult> {
  protected validateOrganizationAccess(command: TCommand): void {
    // 组织访问验证逻辑
  }
}
```

### 3. 接口适配器组件

#### 仓库实现 (Repository Implementations)

```typescript
// 实体仓储基类
abstract class BaseEntityRepository<TEntity extends BaseEntity> {
  constructor(protected readonly em: EntityManager) {}

  abstract findById(id: EntityId): Promise<TEntity | null>;
  abstract save(entity: TEntity): Promise<void>;
  abstract delete(id: EntityId): Promise<void>;
}

// 租户实体仓储基类
abstract class TenantEntityRepository<TEntity extends TenantAwareEntity> 
  extends BaseEntityRepository<TEntity> {
  
  async findByTenant(tenantId: TenantId): Promise<TEntity[]> {
    return this.em.find(this.getEntityClass(), { tenantId: tenantId.toString() });
  }

  async findByTenantAndId(id: EntityId, tenantId: TenantId): Promise<TEntity | null> {
    return this.em.findOne(this.getEntityClass(), { 
      id: id.toString(), 
      tenantId: tenantId.toString() 
    });
  }
}

// 聚合根仓储基类
abstract class BaseAggregateRepository<TAggregate extends BaseAggregateRoot> {
  constructor(
    protected readonly em: EntityManager,
    protected readonly eventStore: IEventStore
  ) {}

  async findById(id: EntityId): Promise<TAggregate | null> {
    const events = await this.eventStore.getEvents(id.toString());
    if (events.length === 0) {
      return null;
    }
    
    const aggregate = this.createAggregate(id);
    aggregate.loadFromHistory(events);
    return aggregate;
  }

  async save(aggregate: TAggregate): Promise<void> {
    const uncommittedEvents = aggregate.getUncommittedEvents();
    if (uncommittedEvents.length > 0) {
      await this.eventStore.saveEvents(aggregate.id.toString(), uncommittedEvents);
      aggregate.markEventsAsCommitted();
    }
  }

  protected abstract createAggregate(id: EntityId): TAggregate;
}

// 租户聚合根仓储基类
abstract class TenantAggregateRepository<TAggregate extends TenantAwareAggregateRoot> 
  extends BaseAggregateRepository<TAggregate> {
  
  async findByTenant(tenantId: TenantId): Promise<TAggregate[]> {
    const events = await this.eventStore.getEventsByTenant(tenantId.toString());
    const aggregates = new Map<string, TAggregate>();
    
    events.forEach(event => {
      if (!aggregates.has(event.aggregateId.toString())) {
        aggregates.set(event.aggregateId.toString(), this.createAggregate(event.aggregateId));
      }
      aggregates.get(event.aggregateId.toString())!.loadFromHistory([event]);
    });
    
    return Array.from(aggregates.values());
  }
}

// 组织聚合根仓储基类
abstract class OrganizationAggregateRepository<TAggregate extends OrganizationAwareAggregateRoot> 
  extends TenantAggregateRepository<TAggregate> {
  
  async findByOrganization(organizationId: OrganizationId, tenantId: TenantId): Promise<TAggregate[]> {
    const events = await this.eventStore.getEventsByOrganization(organizationId.toString(), tenantId.toString());
    const aggregates = new Map<string, TAggregate>();
    
    events.forEach(event => {
      if (!aggregates.has(event.aggregateId.toString())) {
        aggregates.set(event.aggregateId.toString(), this.createAggregate(event.aggregateId));
      }
      aggregates.get(event.aggregateId.toString())!.loadFromHistory([event]);
    });
    
    return Array.from(aggregates.values());
  }
}
```

### 4. 框架和驱动组件

#### 事件存储实现 (Event Store Implementation)

```typescript
// 事件存储接口
interface IEventStore {
  saveEvents(aggregateId: string, events: DomainEvent[]): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
  getEventsFromVersion(aggregateId: string, version: number): Promise<DomainEvent[]>;
  getEventsByTenant(tenantId: string): Promise<DomainEvent[]>;
  getEventsByOrganization(organizationId: string, tenantId: string): Promise<DomainEvent[]>;
}

// 事件总线接口
interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string, 
    handler: EventHandler<T>
  ): void;
  publishAll(events: DomainEvent[]): Promise<void>;
}

// 租户事件存储接口
interface ITenantEventStore extends IEventStore {
  getEventsByTenant(tenantId: string): Promise<DomainEvent[]>;
  getEventsByOrganization(organizationId: string, tenantId: string): Promise<DomainEvent[]>;
  getEventsByDepartment(departmentId: string, tenantId: string): Promise<DomainEvent[]>;
}
```

### 5. 接口层组件

#### REST API控制器

```typescript
// REST控制器基类
abstract class BaseController {
  constructor(
    protected readonly commandBus: CommandBus,
    protected readonly queryBus: QueryBus
  ) {}

  protected async executeCommand<T>(command: Command): Promise<T> {
    return this.commandBus.execute(command);
  }

  protected async executeQuery<T>(query: Query): Promise<T> {
    return this.queryBus.execute(query);
  }
}

// 租户控制器基类
abstract class TenantController extends BaseController {
  protected extractTenantId(req: Request): TenantId {
    return req.tenantContext.tenantId;
  }

  protected extractUserId(req: Request): UserId {
    return req.tenantContext.userId;
  }

  protected extractOrganizationId(req: Request): OrganizationId | undefined {
    return req.tenantContext.organizationId;
  }

  protected extractDepartmentId(req: Request): EntityId | undefined {
    return req.tenantContext.departmentId;
  }
}

// 组织控制器基类
abstract class OrganizationController extends TenantController {
  protected validateOrganizationAccess(req: Request): void {
    const organizationId = this.extractOrganizationId(req);
    if (!organizationId) {
      throw new ForbiddenError('Organization context required');
    }
  }
}
```

#### GraphQL基础

```typescript
// GraphQL解析器基类
abstract class BaseResolver {
  constructor(
    protected readonly commandBus: CommandBus,
    protected readonly queryBus: QueryBus
  ) {}
}

// 租户解析器基类
abstract class TenantResolver extends BaseResolver {
  protected extractTenantId(context: GraphQLContext): TenantId {
    return TenantId.fromString(context.tenantId);
  }

  protected extractUserId(context: GraphQLContext): UserId {
    return UserId.fromString(context.userId);
  }

  protected extractOrganizationId(context: GraphQLContext): OrganizationId | undefined {
    return context.organizationId ? OrganizationId.fromString(context.organizationId) : undefined;
  }
}

// 组织解析器基类
abstract class OrganizationResolver extends TenantResolver {
  protected validateOrganizationAccess(context: GraphQLContext): void {
    const organizationId = this.extractOrganizationId(context);
    if (!organizationId) {
      throw new ForbiddenError('Organization context required');
    }
  }
}
```

### 6. 共享组件

#### 通用类型 (Common Types)

```typescript
// 结果类型
export type ResultType<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  constructor(public readonly data: T) {}
  isSuccess(): this is Success<T> { return true; }
  isFailure(): this is Failure<never> { return false; }
}

export class Failure<E> {
  constructor(public readonly error: E) {}
  isSuccess(): this is Success<never> { return false; }
  isFailure(): this is Failure<E> { return true; }
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 时间戳类型
export type Timestamp = Date;
```

#### 值对象基类 (Value Object Base)

```typescript
// 值对象基类
export abstract class ValueObject {
  public equals(other: ValueObject): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this === other) {
      return true;
    }
    if (this.constructor !== other.constructor) {
      return false;
    }
    return this.equalsInternal(other);
  }

  protected abstract equalsInternal(other: ValueObject): boolean;

  public toString(): string {
    return this.getValue().toString();
  }

  public toJSON(): any {
    return this.getValue();
  }

  protected abstract getValue(): any;
}
```

#### 工具类 (Utilities)

```typescript
// 租户上下文工具类
export class TenantContextUtils {
  // 从请求中提取租户上下文
  static extractFromRequest(req: RequestWithTenantContext): TenantContext;
  
  // 检查用户权限
  static hasPermission(context: TenantContext, permission: string): boolean;
  static hasAnyPermission(context: TenantContext, permissions: string[]): boolean;
  static hasAllPermissions(context: TenantContext, permissions: string[]): boolean;
  
  // 检查租户功能
  static hasFeature(context: TenantContext, feature: string): boolean;
  static hasAnyFeature(context: TenantContext, features: string[]): boolean;
  static hasAllFeatures(context: TenantContext, features: string[]): boolean;
  
  // 验证租户上下文
  static validateContext(context: TenantContext): boolean;
  
  // 创建和合并上下文
  static createContext(tenantId: TenantId, userId: UserId, options?: any): TenantContext;
  static mergeContexts(contexts: TenantContext[]): TenantContext;
  static cloneContext(context: TenantContext): TenantContext;
}

// 事件工具类
export class EventUtils {
  // 创建领域事件
  static createEvent<T extends DomainEvent>(eventClass: new (...args: any[]) => T, params: any): T;
  
  // 验证事件
  static validateEvent(event: DomainEvent): boolean;
  static validateEvents(events: DomainEvent[]): boolean;
  
  // 事件分组
  static groupEventsByAggregateId(events: DomainEvent[]): Map<string, DomainEvent[]>;
  static groupEventsByTenantId(events: DomainEvent[]): Map<string, DomainEvent[]>;
  static groupEventsByType(events: DomainEvent[]): Map<string, DomainEvent[]>;
  
  // 事件过滤和排序
  static filterEvents(events: DomainEvent[], predicate: (event: DomainEvent) => boolean): DomainEvent[];
  static sortEventsByTime(events: DomainEvent[], ascending?: boolean): DomainEvent[];
  
  // 事件统计
  static getEventStats(events: DomainEvent[]): EventStats;
  
  // 事件序列化
  static serializeEvent(event: DomainEvent): string;
  static deserializeEvent<T extends DomainEvent>(json: string, eventClass: new (...args: any[]) => T): T;
  static serializeEvents(events: DomainEvent[]): string[];
  static deserializeEvents<T extends DomainEvent>(jsonArray: string[], eventClass: new (...args: any[]) => T): T[];
}

// 租户数据过滤器
export class TenantDataFilter {
  // 添加过滤器
  static addTenantFilter(query: any, tenantId: TenantId): any;
  static addOrganizationFilter(query: any, organizationId: OrganizationId): any;
  static addDepartmentFilter(query: any, departmentId: EntityId): any;
  static addMultiLevelFilter(query: any, filters: any): any;
  
  // 验证访问权限
  static validateTenantAccess(entity: TenantAwareEntity, tenantId: TenantId): void;
  static validateOrganizationAccess(entity: OrganizationAwareEntity, organizationId: OrganizationId): void;
  static validateDepartmentAccess(entity: DepartmentAwareEntity, departmentId: EntityId): void;
  static validateMultiLevelAccess(entity: any, context: any): void;
  
  // 过滤数据
  static filterByTenant<T extends TenantAwareEntity>(entities: T[], tenantId: TenantId): T[];
  static filterByOrganization<T extends OrganizationAwareEntity>(entities: T[], organizationId: OrganizationId): T[];
  static filterByDepartment<T extends DepartmentAwareEntity>(entities: T[], departmentId: EntityId): T[];
  static filterByMultiLevel<T extends TenantAwareEntity>(entities: T[], context: any): T[];
  
  // 查询构建和验证
  static createTenantQueryBuilder(tenantId: TenantId): QueryBuilder;
  static validateQueryPermissions(query: any, requiredContext: any): void;
}
```

#### 异步上下文 (Async Context)

```typescript
// 异步上下文接口
export interface IAsyncContext<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  toObject(): Record<string, T>;
  clone(): IAsyncContext<T>;
}

// 异步上下文实现
export class AsyncContext<T = any> implements IAsyncContext<T> {
  private data = new Map<string, T>();
  
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  toObject(): Record<string, T>;
  clone(): IAsyncContext<T>;
}

// 上下文提供者
export class ContextProvider {
  static getCurrentContext(): IAsyncContext | undefined;
  static setCurrentContext(context: IAsyncContext): void;
  static clearCurrentContext(): void;
  static runWithContext<T>(context: IAsyncContext, fn: () => T): T;
  static runWithNewContext<T>(fn: () => T): T;
}

// 上下文工厂
export class ContextFactory {
  static createTenantContext(tenantId: TenantId, userId: UserId): IAsyncContext;
  static createRequestContext(requestId: string, userAgent?: string): IAsyncContext;
  static createCorrelationContext(correlationId: string): IAsyncContext;
  static createExecutionContext(taskId: string, priority?: number): IAsyncContext;
}
```

#### 发布者模式 (Publisher Pattern)

```typescript
// 发布者接口
export interface ICommandPublisher {
  publish<T>(command: ICommand): Observable<T>;
  publishAll<T>(commands: ICommand[]): Observable<T[]>;
}

export interface IQueryPublisher {
  publish<T>(query: IQuery): Observable<T>;
  publishAll<T>(queries: IQuery[]): Observable<T[]>;
}

export interface IEventPublisher {
  publish(event: IEvent): Observable<void>;
  publishAll(events: IEvent[]): Observable<void>;
}

// 基础发布者
export abstract class BasePublisher<TMessage, TResult = any> {
  protected config: IPublisherConfig;
  protected logger: Logger;
  
  constructor(config: IPublisherConfig, logger: Logger);
  abstract publish(message: TMessage): Observable<TResult>;
  abstract publishAll(messages: TMessage[]): Observable<TResult[]>;
}

// 命令发布者
export class CommandPublisher extends BasePublisher<ICommand, any> implements ICommandPublisher {
  publish<T>(command: ICommand): Observable<T>;
  publishAll<T>(commands: ICommand[]): Observable<T[]>;
}

// 查询发布者
export class QueryPublisher extends BasePublisher<IQuery, any> implements IQueryPublisher {
  publish<T>(query: IQuery): Observable<T>;
  publishAll<T>(queries: IQuery[]): Observable<T[]>;
}

// 事件发布者
export class EventPublisher extends BasePublisher<IEvent, void> implements IEventPublisher {
  publish(event: IEvent): Observable<void>;
  publishAll(events: IEvent[]): Observable<void>;
}

// 发布者工厂
export class PublisherFactory {
  static createCommandPublisher(config: IPublisherConfig): ICommandPublisher;
  static createQueryPublisher(config: IPublisherConfig): IQueryPublisher;
  static createEventPublisher(config: IPublisherConfig): IEventPublisher;
}
```

#### Saga支持 (Saga Support)

```typescript
// Saga接口
export interface ISaga<TState = any> {
  readonly sagaId: string;
  readonly name: string;
  readonly config: ISagaConfig;
  execute(event: IEvent, context: ISagaExecutionContext): Observable<ISagaStep[]>;
  compensate(state: TState, context: ISagaExecutionContext): Observable<void>;
}

// Saga事件总线
export interface ISagaEventBus {
  publish(event: IEvent): Observable<void>;
  subscribe(eventType: string, saga: ISaga): void;
  unsubscribe(eventType: string, saga: ISaga): void;
}

// Saga执行器
export interface ISagaExecutor {
  execute(saga: ISaga, event: IEvent, context: ISagaExecutionContext): Observable<ISagaStep[]>;
  compensate(saga: ISaga, state: any, context: ISagaExecutionContext): Observable<void>;
}

// Saga管理器
export interface ISagaManager {
  registerSaga(saga: ISaga): void;
  unregisterSaga(sagaId: string): void;
  getSaga(sagaId: string): ISaga | undefined;
  getAllSagas(): ISaga[];
  executeSaga(sagaId: string, event: IEvent, context: ISagaExecutionContext): Observable<ISagaStep[]>;
}

// Saga装饰器
export function Saga(config: ISagaConfig): ClassDecorator;
```

#### 增强RxJS操作符 (Enhanced RxJS Operators)

```typescript
// 操作符配置
export interface IOperatorConfig {
  enableCaching?: boolean;
  enableMetrics?: boolean;
  enableErrorHandling?: boolean;
  enablePerformanceMonitoring?: boolean;
  cacheTimeout?: number;
  metricsInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// 增强的ofType操作符
export class EnhancedOfTypeOperator<T> implements IEnhancedOperator<T, T> {
  constructor(private eventTypes: string[], private config: IOperatorConfig);
  
  call(source: Observable<T>, subscriber: Subscriber<T>): TeardownLogic;
  getConfig(): IOperatorConfig;
  getMetrics(): IOperatorMetrics;
  clearMetrics(): void;
  enableCaching(): void;
  disableCaching(): void;
  clearCache(): void;
}

// 操作符工厂
export class OperatorFactory {
  static createEnhancedOfType<T>(eventTypes: string[], config?: IOperatorConfig): IEnhancedOperator<T, T>;
  static createCachedOperator<T, R>(operator: OperatorFunction<T, R>, config?: IOperatorConfig): IEnhancedOperator<T, R>;
  static createMetricsOperator<T, R>(operator: OperatorFunction<T, R>, config?: IOperatorConfig): IEnhancedOperator<T, R>;
}
```

#### 中间件支持 (Middleware Support)

```typescript
// 中间件接口
export interface IMiddleware<TRequest = any, TResponse = any> {
  readonly name: string;
  readonly priority: number;
  readonly config: IMiddlewareConfig;
  readonly logger: Logger;
  execute(request: IMiddlewareRequest<TRequest>, next: () => Observable<IMiddlewareResponse<TResponse>>): Observable<IMiddlewareResponse<TResponse>>;
  getStats(): IMiddlewareStats;
  clearStats(): void;
}

// 基础中间件
export abstract class BaseMiddleware<TRequest = any, TResponse = any> implements IMiddleware<TRequest, TResponse> {
  public readonly name: string;
  public readonly priority: number;
  public readonly config: IMiddlewareConfig;
  public readonly logger: Logger;
  
  constructor(name: string, config: IMiddlewareConfig, priority: number);
  abstract processRequest(request: IMiddlewareRequest<TRequest>, next: () => Observable<IMiddlewareResponse<TResponse>>): Observable<IMiddlewareResponse<TResponse>>;
  execute(request: IMiddlewareRequest<TRequest>, next: () => Observable<IMiddlewareResponse<TResponse>>): Observable<IMiddlewareResponse<TResponse>>;
}

// 日志中间件
export class LoggingMiddleware extends BaseMiddleware<any, any> {
  constructor(config?: LoggingMiddlewareConfig, priority?: number);
  processRequest(request: IMiddlewareRequest<any>, next: () => Observable<IMiddlewareResponse<any>>): Observable<IMiddlewareResponse<any>>;
}

// 指标中间件
export class MetricsMiddleware extends BaseMiddleware<any, any> {
  constructor(config?: MetricsMiddlewareConfig, priority?: number);
  processRequest(request: IMiddlewareRequest<any>, next: () => Observable<IMiddlewareResponse<any>>): Observable<IMiddlewareResponse<any>>;
  getMetrics(): MetricsData;
}

// 中间件链
export class MiddlewareChain<TRequest = any, TResponse = any> implements IMiddlewareChain<TRequest, TResponse> {
  private middlewares: IMiddleware<TRequest, TResponse>[] = [];
  
  addMiddleware(middleware: IMiddleware<TRequest, TResponse>): void;
  removeMiddleware(name: string): void;
  execute(request: IMiddlewareRequest<TRequest>): Observable<IMiddlewareResponse<TResponse>>;
  getStats(): IMiddlewareChainStats;
  clearStats(): void;
}

// 中间件管理器
export class MiddlewareManager implements IMiddlewareManager {
  private middlewareChains = new Map<string, IMiddlewareChain>();
  
  createChain(name: string, config?: any): IMiddlewareChain;
  getChain(name: string): IMiddlewareChain | undefined;
  removeChain(name: string): boolean;
  getAllChains(): IMiddlewareChain[];
  registerMiddleware(chainName: string, middleware: IMiddleware): void;
  unregisterMiddleware(chainName: string, middlewareName: string): void;
  executeChain(chainName: string, request: any): Observable<any>;
}

// 中间件装饰器
export function Middleware(options?: MiddlewareDecoratorOptions): ClassDecorator;
export function MiddlewareChain(names: string[], config?: any): ClassDecorator;
export function MiddlewareFactory(name: string, priority?: number, config?: IMiddlewareConfig): MethodDecorator;
```

## 多租户支持

### 租户上下文管理

```typescript
// 租户上下文接口
interface TenantContext {
  tenantId: TenantId;
  userId: UserId;
  organizationId?: OrganizationId;
  departmentId?: EntityId;
  permissions: string[];
  features: string[];
}

// 租户上下文工具类
export class TenantContextUtils {
  // 从请求中提取租户上下文
  static extractFromRequest(req: RequestWithTenantContext): TenantContext {
    const tenantId = (req.headers as any)['x-tenant-id'] as string;
    const userId = (req.headers as any)['x-user-id'] as string;
    const organizationId = (req.headers as any)['x-organization-id'] as string;
    const departmentId = (req.headers as any)['x-department-id'] as string;
    const permissions = (req.headers as any)['x-permissions'] as string;
    const features = (req.headers as any)['x-features'] as string;

    return {
      tenantId: TenantId.fromString(tenantId),
      userId: UserId.fromString(userId),
      organizationId: organizationId ? OrganizationId.fromString(organizationId) : undefined,
      departmentId: departmentId ? EntityId.fromString(departmentId) : undefined,
      permissions: permissions ? permissions.split(',').map(p => p.trim()) : [],
      features: features ? features.split(',').map(f => f.trim()) : [],
    };
  }

  // 检查用户权限
  static hasPermission(context: TenantContext, permission: string): boolean {
    return context.permissions.includes(permission);
  }

  // 检查租户功能
  static hasFeature(context: TenantContext, feature: string): boolean {
    return context.features.includes(feature);
  }
}
```

### 数据隔离

```typescript
// 租户数据过滤器
export class TenantDataFilter {
  // 添加租户过滤器
  static addTenantFilter(query: any, tenantId: TenantId): any {
    return { ...query, tenantId: tenantId.toString() };
  }

  // 添加组织过滤器
  static addOrganizationFilter(query: any, organizationId: OrganizationId): any {
    return { ...query, organizationId: organizationId.toString() };
  }

  // 添加部门过滤器
  static addDepartmentFilter(query: any, departmentId: EntityId): any {
    return { ...query, departmentId: departmentId.toString() };
  }

  // 验证租户访问权限
  static validateTenantAccess(entity: TenantAwareEntity, tenantId: TenantId): void {
    if (!entity.belongsToTenant(tenantId)) {
      throw new Error('Access denied: different tenant');
    }
  }

  // 验证组织访问权限
  static validateOrganizationAccess(entity: OrganizationAwareEntity, organizationId: OrganizationId): void {
    if (!entity.belongsToOrganization(organizationId)) {
      throw new Error('Access denied: different organization');
    }
  }

  // 验证部门访问权限
  static validateDepartmentAccess(entity: DepartmentAwareEntity, departmentId: EntityId): void {
    if (!entity.belongsToDepartment(departmentId)) {
      throw new Error('Access denied: different department');
    }
  }
}
```

### 租户感知实体和聚合根

```typescript
// 租户感知实体
export abstract class TenantAwareEntity extends BaseEntity {
  private readonly _tenantId: TenantId;
  private readonly _createdBy: UserId;
  private _updatedBy: UserId;

  constructor(
    id: EntityId,
    tenantId: TenantId,
    createdBy: UserId,
    createdAt?: Timestamp,
    updatedAt?: Timestamp,
    updatedBy?: UserId
  ) {
    super(id, createdAt, updatedAt);
    this._tenantId = tenantId;
    this._createdBy = createdBy;
    this._updatedBy = updatedBy || createdBy;
  }

  public getTenantId(): TenantId { return this._tenantId; }
  public belongsToTenant(tenantId: TenantId): boolean {
    return this._tenantId.equals(tenantId);
  }
}

// 组织感知实体
export abstract class OrganizationAwareEntity extends TenantAwareEntity {
  private readonly _organizationId: OrganizationId;

  constructor(
    id: EntityId,
    tenantId: TenantId,
    organizationId: OrganizationId,
    createdBy: UserId,
    createdAt?: Timestamp,
    updatedAt?: Timestamp,
    updatedBy?: UserId
  ) {
    super(id, tenantId, createdBy, createdAt, updatedAt, updatedBy);
    this._organizationId = organizationId;
  }

  public getOrganizationId(): OrganizationId { return this._organizationId; }
  public belongsToOrganization(organizationId: OrganizationId): boolean {
    return this._organizationId.equals(organizationId);
  }
}

// 部门感知实体
export abstract class DepartmentAwareEntity extends TenantAwareEntity {
  private readonly _departmentId: EntityId;

  constructor(
    id: EntityId,
    tenantId: TenantId,
    departmentId: EntityId,
    createdBy: UserId,
    createdAt?: Timestamp,
    updatedAt?: Timestamp,
    updatedBy?: UserId
  ) {
    super(id, tenantId, createdBy, createdAt, updatedAt, updatedBy);
    this._departmentId = departmentId;
  }

  public getDepartmentId(): EntityId { return this._departmentId; }
  public belongsToDepartment(departmentId: EntityId): boolean {
    return this._departmentId.equals(departmentId);
  }
}
```

### 租户相关装饰器

```typescript
// 租户验证装饰器
export function RequireTenant(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const req = args.find(arg => arg && typeof arg === 'object' && 'tenantContext' in arg) as RequestWithTenantContext;
    
    if (!req?.tenantContext?.tenantId) {
      throw new UnauthorizedError('Tenant context required');
    }
    
    return originalMethod.apply(this, args);
  };
}

// 权限验证装饰器
export function RequirePermission(permission: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const req = args.find(arg => arg && typeof arg === 'object' && 'tenantContext' in arg) as RequestWithTenantContext;
      
      const userPermissions = req.tenantContext.permissions || [];
      if (!userPermissions.includes(permission)) {
        throw new ForbiddenError(`Permission '${permission}' required`);
      }
      
      return originalMethod.apply(this, args);
    };
  };
}

// 组织验证装饰器
export function RequireOrganization(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const req = args.find(arg => arg && typeof arg === 'object' && 'tenantContext' in arg) as RequestWithTenantContext;
    
    if (!req.tenantContext.organizationId) {
      throw new ForbiddenError('Organization context required');
    }
    
    return originalMethod.apply(this, args);
  };
}

// 部门验证装饰器
export function RequireDepartment(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const req = args.find(arg => arg && typeof arg === 'object' && 'tenantContext' in arg) as RequestWithTenantContext;
    
    if (!req.tenantContext.departmentId) {
      throw new ForbiddenError('Department context required');
    }
    
    return originalMethod.apply(this, args);
  };
}
```

## 内置CQRS + Event Sourcing功能

### 内置CQRS的优势

#### 完全控制

- **自定义行为**：可以根据业务需求自定义CQRS的行为
- **深度集成**：与多租户、多组织、AI能力深度集成
- **性能优化**：针对特定场景进行性能优化

#### 避免外部依赖

- **版本控制**：不依赖外部CQRS库的版本更新
- **功能扩展**：可以随时添加新功能而不受外部库限制
- **安全控制**：完全控制代码质量和安全性

#### 企业级功能

- **多租户支持**：内置多租户上下文验证
- **多组织支持**：内置多组织数据隔离
- **权限管理**：内置权限验证机制
- **审计日志**：内置操作审计功能

### 内置CQRS架构

CQRS 框架组件位于 **Frameworks & Drivers** 层，提供技术实现：

### 命令总线 (CommandBus)

```typescript
// 内置命令总线
@Injectable()
export class CommandBus {
  private handlers = new Map<string, CommandHandler<any, any>>();
  private readonly logger = new Logger(CommandBus.name);

  async execute<T>(command: Command): Promise<T> {
    // 租户上下文验证
    this.validateTenantContext(command);
    
    const commandId = this.getCommandId(command);
    const handler = this.handlers.get(commandId);
    
    if (!handler) {
      throw new CommandHandlerNotFoundException(`No handler found for ${command.constructor.name}`);
    }
    
    return handler.execute(command);
  }

  register<T extends Command>(commandType: string, handler: CommandHandler<T, any>): void {
    this.handlers.set(commandType, handler);
  }

  private validateTenantContext(command: Command): void {
    if (!command.tenantId) {
      throw new UnauthorizedError('Tenant context required for command execution');
    }
  }

  private getCommandId(command: Command): string {
    return command.constructor.name;
  }
}

// 内置查询总线
@Injectable()
export class QueryBus {
  private handlers = new Map<string, QueryHandler<any, any>>();
  private readonly logger = new Logger(QueryBus.name);

  async execute<T>(query: Query): Promise<T> {
    // 租户上下文验证
    this.validateTenantContext(query);
    
    const queryId = this.getQueryId(query);
    const handler = this.handlers.get(queryId);
    
    if (!handler) {
      throw new QueryHandlerNotFoundException(`No handler found for ${query.constructor.name}`);
    }
    
    return handler.execute(query);
  }

  register<T extends Query>(queryType: string, handler: QueryHandler<T, any>): void {
    this.handlers.set(queryType, handler);
  }

  private validateTenantContext(query: Query): void {
    if (!query.tenantId) {
      throw new UnauthorizedError('Tenant context required for query execution');
    }
  }

  private getQueryId(query: Query): string {
    return query.constructor.name;
  }
}
```

### 事件总线

```typescript
// 内置事件总线
@Injectable()
export class EventBus {
  private handlers = new Map<string, EventHandler<any>[]>();
  private readonly logger = new Logger(EventBus.name);

  async publish(event: DomainEvent): Promise<void> {
    // 租户上下文验证
    this.validateTenantContext(event);
    
    const eventType = this.getEventType(event);
    const eventHandlers = this.handlers.get(eventType) || [];
    
    await Promise.all(eventHandlers.map(handler => handler.handle(event)));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  private validateTenantContext(event: DomainEvent): void {
    if (!event.tenantId) {
      throw new UnauthorizedError('Tenant context required for event publishing');
    }
  }

  private getEventType(event: DomainEvent): string {
    return event.constructor.name;
  }
}
```

### 事件存储 (EventStore)

```typescript
// 内置事件存储
@Injectable()
export class EventStore implements ITenantEventStore {
  private events = new Map<string, DomainEvent[]>();
  private readonly logger = new Logger(EventStore.name);

  async saveEvents(aggregateId: string, events: DomainEvent[]): Promise<void> {
    // 验证所有事件都有租户上下文
    events.forEach(event => {
      if (!event.tenantId) {
        throw new UnauthorizedError('Tenant context required for event storage');
      }
    });

    const existingEvents = this.events.get(aggregateId) || [];
    this.events.set(aggregateId, [...existingEvents, ...events]);
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    return this.events.get(aggregateId) || [];
  }

  async getEventsFromVersion(aggregateId: string, version: number): Promise<DomainEvent[]> {
    const events = await this.getEvents(aggregateId);
    return events.filter(event => event.version >= version);
  }

  async getEventsByTenant(tenantId: string): Promise<DomainEvent[]> {
    const allEvents: DomainEvent[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(event => event.tenantId === tenantId));
    }
    return allEvents;
  }

  async getEventsByOrganization(organizationId: string, tenantId: string): Promise<DomainEvent[]> {
    const allEvents: DomainEvent[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(event => 
        event.tenantId === tenantId && 
        event instanceof OrganizationEvent && 
        event.organizationId === organizationId
      ));
    }
    return allEvents;
  }

  async getEventsByDepartment(departmentId: string, tenantId: string): Promise<DomainEvent[]> {
    const allEvents: DomainEvent[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(event => 
        event.tenantId === tenantId && 
        event instanceof DepartmentEvent && 
        event.departmentId === departmentId
      ));
    }
    return allEvents;
  }
}
```

## AI能力集成

### AI服务抽象

```typescript
// AI服务接口
interface IAIService {
  processText(input: string, context: AIContext): Promise<AIResult>;
  generateResponse(prompt: string, context: AIContext): Promise<string>;
  analyzeData(data: any, context: AIContext): Promise<AnalysisResult>;
}

// AI上下文
interface AIContext {
  tenantId: TenantId;
  organizationId?: OrganizationId;
  departmentId?: EntityId;
  userId: UserId;
  model: string;
  parameters: Record<string, any>;
}

// AI结果
interface AIResult {
  content: string;
  confidence: number;
  metadata: Record<string, any>;
  usage: AIUsage;
}
```

### AI服务基类

```typescript
abstract class BaseAIService implements IAIService {
  constructor(
    protected readonly aiProvider: AIProvider,
    protected readonly configService: ConfigService
  ) {}

  async processText(input: string, context: AIContext): Promise<AIResult> {
    const config = await this.getAIConfig(context);
    return this.aiProvider.processText(input, config);
  }

  protected async getAIConfig(context: AIContext): Promise<AIConfig> {
    return this.configService.getAIConfig(context.tenantId.toString(), context.organizationId?.toString());
  }
}
```

## 使用指南

### 1. 安装和配置

```typescript
// 在业务模块中导入Core模块
import { CoreModule } from '@aiofix/core';

@Module({
  imports: [
    CoreModule.forRoot({
      // Core模块配置选项
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
  // ...
})
export class UserManagementModule {}
```

### 2. 继承基础类

```typescript
// 继承租户感知实体（用于简单的CRUD操作）
@Entity()
export class UserProfile extends TenantAwareEntity {
  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  avatar: string;

  constructor(tenantId: TenantId, name: string, email: string, createdBy: UserId) {
    super(tenantId, createdBy);
    this.name = name;
    this.email = email;
    this.avatar = '';
  }

  // 业务方法
  updateProfile(name: string, email: string, updatedBy: UserId): void {
    this.name = name;
    this.email = email;
    this.updateVersion(updatedBy);
  }

  updateAvatar(avatar: string, updatedBy: UserId): void {
    this.avatar = avatar;
    this.updateVersion(updatedBy);
  }

  // 软删除用户资料
  deleteProfile(deletedBy: UserId, reason?: string): void {
    this.softDelete(deletedBy, reason);
  }

  // 恢复用户资料
  restoreProfile(restoredBy: UserId): void {
    this.restore(restoredBy);
  }
}

// 继承租户感知聚合根（用于复杂的业务逻辑和事件处理）
export class User extends TenantAwareAggregateRoot {
  private name: string;
  private email: string;
  private status: UserStatus;
  private roles: string[];
  private createdBy: UserId;
  private updatedBy: UserId;

  constructor(id: EntityId, tenantId: TenantId, name: string, email: string, createdBy: UserId) {
    super(id, tenantId);
    this.name = name;
    this.email = email;
    this.status = UserStatus.ACTIVE;
    this.roles = [];
    this.createdBy = createdBy;
    this.updatedBy = createdBy;
    
    // 发布用户创建事件（包含审计信息）
    this.addEvent(new UserCreatedEvent(id, tenantId, name, email, createdBy));
  }

  // 业务方法
  updateName(newName: string, updatedBy: UserId): void {
    if (this.name === newName) return;
    
    const oldName = this.name;
    this.name = newName;
    this.updatedBy = updatedBy;
    
    // 发布用户名称更新事件（包含审计信息）
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
    this.updatedBy = assignedBy;
    
    // 发布角色分配事件（包含审计信息）
    this.addEvent(new UserRoleAssignedEvent(
      this.id, 
      this.tenantId, 
      role, 
      assignedBy
    ));
  }

  deactivate(deactivatedBy: UserId, reason?: string): void {
    if (this.status === UserStatus.INACTIVE) return;
    
    this.status = UserStatus.INACTIVE;
    this.updatedBy = deactivatedBy;
    
    // 发布用户停用事件（包含审计信息）
    this.addEvent(new UserDeactivatedEvent(
      this.id, 
      this.tenantId, 
      deactivatedBy, 
      reason
    ));
  }

  // 软删除用户（聚合根级别的软删除）
  softDelete(deletedBy: UserId, reason?: string): void {
    if (this.status === UserStatus.DELETED) return;
    
    this.status = UserStatus.DELETED;
    this.updatedBy = deletedBy;
    
    // 发布用户软删除事件
    this.addEvent(new UserSoftDeletedEvent(
      this.id, 
      this.tenantId, 
      deletedBy, 
      reason
    ));
  }

  // 事件应用方法
  protected applyEvent(event: DomainEvent, isFromHistory: boolean = false): void {
    if (event instanceof UserCreatedEvent) {
      this.name = event.name;
      this.email = event.email;
      this.createdBy = event.createdBy;
      this.updatedBy = event.createdBy;
    } else if (event instanceof UserNameUpdatedEvent) {
      this.name = event.newName;
      this.updatedBy = event.updatedBy;
    } else if (event instanceof UserRoleAssignedEvent) {
      this.roles.push(event.role);
      this.updatedBy = event.assignedBy;
    } else if (event instanceof UserDeactivatedEvent) {
      this.status = UserStatus.INACTIVE;
      this.updatedBy = event.deactivatedBy;
    } else if (event instanceof UserSoftDeletedEvent) {
      this.status = UserStatus.DELETED;
      this.updatedBy = event.deletedBy;
    }
  }
}

// 继承命令处理器
@CommandHandler(CreateUserCommand)
export class CreateUserHandler extends TenantCommandHandler<CreateUserCommand, User> {
  async execute(command: CreateUserCommand): Promise<User> {
    // 聚合根会自动生成EntityId作为ID
    const user = new User(
      EntityId.generate(), // 生成新的EntityId
      TenantId.fromString(command.tenantId),
      command.name,
      command.email,
      UserId.fromString(command.userId) // 创建者
    );
    
    // 保存聚合根（会保存事件）
    await this.userRepository.save(user);
    return user;
  }
}

// 更新用户命令处理器
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler extends TenantCommandHandler<UpdateUserCommand, User> {
  async execute(command: UpdateUserCommand): Promise<User> {
    const userId = EntityId.fromString(command.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User ${command.userId} not found`);
    }
    
    // 更新用户信息（包含审计信息）
    user.updateName(command.name, UserId.fromString(command.userId));
    
    // 保存聚合根（会保存事件）
    await this.userRepository.save(user);
    return user;
  }
}

// 软删除用户命令处理器
@CommandHandler(SoftDeleteUserCommand)
export class SoftDeleteUserHandler extends TenantCommandHandler<SoftDeleteUserCommand, void> {
  async execute(command: SoftDeleteUserCommand): Promise<void> {
    const userId = EntityId.fromString(command.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User ${command.userId} not found`);
    }
    
    // 软删除用户（包含审计信息）
    user.softDelete(UserId.fromString(command.userId), command.reason);
    
    // 保存聚合根（会保存事件）
    await this.userRepository.save(user);
  }
}
```

### 3. 使用共享组件

```typescript
// 使用租户上下文
@Controller('users')
export class UserController extends TenantController {
  @Post()
  @RequireTenant
  @RequirePermission('user.create')
  async createUser(@Body() dto: CreateUserDto, @Req() req: Request) {
    const command = new CreateUserCommand(
      this.extractTenantId(req).toString(),
      this.extractUserId(req).toString(),
      dto
    );
    return this.executeCommand(command);
  }

  @Get()
  @RequireTenant
  @RequirePermission('user.read')
  async getUsers(@Req() req: Request) {
    const query = new GetUsersQuery(
      this.extractTenantId(req).toString(),
      this.extractUserId(req).toString()
    );
    return this.executeQuery(query);
  }
}

// 使用事件处理器
@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler extends EventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // 处理用户创建事件
    console.log(`User ${event.aggregateId.toString()} created in tenant ${event.tenantId.toString()}`);
  }
}
```

## 扩展性设计

### 插件机制

```typescript
// 插件接口
interface IPlugin {
  name: string;
  version: string;
  install(container: Container): void;
  uninstall(): void;
}

// 插件管理器
class PluginManager {
  private plugins = new Map<string, IPlugin>();

  install(plugin: IPlugin): void {
    plugin.install(this.container);
    this.plugins.set(plugin.name, plugin);
  }
}
```

### 配置管理

```typescript
// 配置接口
interface IConfig {
  get<T>(key: string): T;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
}

// 配置服务
@Injectable()
export class ConfigService implements IConfig {
  get<T>(key: string): T {
    // 实现配置获取逻辑
  }
}
```

## 数据传输对象 (DTO) 设计

### DTO 设计原则

DTO（数据传输对象）属于接口层，用于在不同层之间传输数据，特别是在API接口和业务逻辑之间。

#### DTO 职责

- **数据验证**：验证输入数据的格式和约束
- **数据转换**：在不同层之间转换数据格式
- **API契约**：定义API的输入输出格式
- **序列化**：支持JSON序列化和反序列化

#### DTO 设计规则

```typescript
// 请求DTO示例
export class CreateUserRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsUUID()
  tenantId: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

// 响应DTO示例
export class UserResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsUUID()
  tenantId: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}
```

#### DTO 与领域对象的关系

- **DTO**：用于数据传输和验证，属于接口层
- **领域对象**：包含业务逻辑，属于领域层
- **转换**：通过Mapper在DTO和领域对象之间转换

```typescript
// DTO到领域对象的转换
export class UserMapper {
  static toDomain(dto: CreateUserRequestDto, createdBy: UserId): User {
    return new User(
      EntityId.generate(),
      TenantId.fromString(dto.tenantId),
      dto.name,
      dto.email,
      createdBy
    );
  }

  static toDto(domain: User): UserResponseDto {
    return {
      id: domain.getId().toString(),
      name: domain.getName(),
      email: domain.getEmail(),
      tenantId: domain.getTenantId().toString(),
      createdAt: domain.getCreatedAt().toISOString(),
      updatedAt: domain.getUpdatedAt().toISOString(),
    };
  }
}
```

## 总结

Core模块为Aiofix-AI-SaaS平台提供了基于 Clean Architecture 的统一技术架构基础，内置完整的CQRS功能和高级企业级特性：

### 🏗️ Clean Architecture 分层架构

1. **Domain Layer (企业业务规则层)**：
   - ✅ 基础实体和聚合根基类 (`BaseEntity`, `BaseAggregateRoot`)
   - ✅ 多租户感知实体和聚合根 (`TenantAwareEntity`, `OrganizationAwareEntity`, `DepartmentAwareEntity`)
   - ✅ 值对象基类 (`EntityId`, `TenantId`, `OrganizationId`, `UserId`)
   - ✅ 领域事件基类 (`DomainEvent`, `TenantEvent`, `OrganizationEvent`, `DepartmentEvent`)
   - ✅ 仓库接口和规约模式接口

2. **Application Layer (应用业务规则层)**：
   - ✅ 命令、查询、事件处理器接口和基类
   - ✅ 应用服务接口
   - ✅ 用例实现框架

3. **Infrastructure Layer (基础设施层)**：
   - ✅ 仓库实现和持久化组件
   - ✅ 内置CQRS框架实现 (CommandBus, QueryBus, EventBus, EventStore)
   - ✅ 事件投射器和读模型投射
   - ✅ 数据库实体映射器和迁移脚本

4. **Interfaces Layer (接口层)**：
   - ✅ REST、GraphQL、gRPC接口基础
   - ✅ 消息接口实现

5. **Shared Layer (共享层)**：
   - ✅ 通用类型和值对象基类
   - ✅ 多租户工具类和装饰器
   - ✅ 异步上下文管理
   - ✅ 发布者模式支持
   - ✅ Saga模式支持
   - ✅ 增强RxJS操作符
   - ✅ 中间件支持

### 🔧 已实现的核心功能

1. **✅ 内置CQRS + Event Sourcing**：
   - 完整的命令总线、查询总线、事件总线、事件存储实现
   - 支持多租户上下文验证
   - 事件投射器和读模型支持

2. **✅ 多租户架构支持**：
   - 租户感知实体和聚合根
   - 组织感知实体和聚合根
   - 部门感知实体和聚合根
   - 租户上下文工具类和数据过滤器
   - 租户相关装饰器 (`@RequireTenant`, `@RequirePermission`, `@RequireOrganization`, `@RequireDepartment`)

3. **✅ 高级企业级功能**：
   - 异步上下文管理 (`AsyncContext`, `ContextProvider`, `ContextFactory`)
   - 发布者模式 (`CommandPublisher`, `QueryPublisher`, `EventPublisher`)
   - Saga模式支持 (`ISaga`, `SagaManager`, `@Saga`)
   - 增强RxJS操作符 (`EnhancedOfTypeOperator`, `OperatorFactory`)
   - 中间件支持 (`BaseMiddleware`, `MiddlewareChain`, `MiddlewareManager`)

4. **✅ 持久化支持**：
   - 数据库实体映射器
   - 数据库迁移脚本
   - 事件存储实现

5. **✅ 工具类和装饰器**：
   - CQRS装饰器 (`@CommandHandler`, `@QueryHandler`, `@EventHandler`)
   - 租户验证装饰器
   - 异常处理机制

### 🚀 核心价值

- **✅ Clean Architecture 合规**：严格遵循 Clean Architecture 分层原则，依赖方向正确
- **✅ 完全控制**：内置CQRS功能完全自主控制，与多租户深度集成
- **✅ 企业级特性**：支持多租户、多组织、多部门、权限管理等企业级功能
- **✅ 高级模式支持**：内置Saga、发布者、中间件、异步上下文等高级模式
- **✅ 架构统一**：所有业务领域模块基于相同的架构基础
- **✅ 职责分离**：实体和聚合根分开设计，符合DDD原则
- **✅ 代码复用**：通用功能集中管理，避免重复开发
- **✅ 快速开发**：业务模块可以快速构建，专注于业务逻辑
- **✅ 易于维护**：通用功能的升级和修复影响所有模块
- **✅ 类型安全**：基于TypeScript的强类型支持
- **✅ 标准化**：统一的命名规范、接口设计和实现模式

### 📊 实现状态

| 功能模块 | 状态 | 完成度 |
|---------|------|--------|
| 领域层基础组件 | ✅ 已完成 | 100% |
| 多租户感知实体/聚合根 | ✅ 已完成 | 100% |
| 值对象和ID管理 | ✅ 已完成 | 100% |
| 内置CQRS框架 | ✅ 已完成 | 100% |
| 事件存储和投射器 | ✅ 已完成 | 100% |
| 持久化组件 | ✅ 已完成 | 100% |
| 租户工具和装饰器 | ✅ 已完成 | 100% |
| 异步上下文管理 | ✅ 已完成 | 100% |
| 发布者模式 | ✅ 已完成 | 100% |
| Saga模式支持 | ✅ 已完成 | 100% |
| 增强RxJS操作符 | ✅ 已完成 | 100% |
| 中间件支持 | ✅ 已完成 | 100% |
| AI集成组件 | ⏳ 待实现 | 0% |

通过Core模块，所有业务领域模块都可以快速构建，确保 Clean Architecture 架构一致性和代码复用性，同时享受内置CQRS功能和高级企业级特性的强大能力。
