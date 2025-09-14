# Core模块设计方案

## 概述

Core模块是Aiofix-AI-SaaS平台的核心基础架构库，为所有业务领域模块提供统一的架构基础、共享组件和通用功能。通过Core模块，确保整个平台的技术架构一致性，提高开发效率，降低维护成本。

Core模块内置了完整的CQRS功能，并扩展了多租户、多组织、AI能力集成等企业级功能，为业务领域模块提供标准化的开发基础。通过内置CQRS，我们可以完全控制其行为并与平台的其他功能深度集成。

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

```text
libs/core/
├── domain/                   # 领域基础
│   ├── entities/             # 基础领域实体
│   ├── aggregates/           # 基础聚合根
│   ├── value-objects/        # 基础值对象
│   ├── events/               # 基础事件
│   ├── services/             # 基础领域服务
│   └── specifications/       # 基础规约
├── application/              # 应用基础
│   ├── commands/             # 命令基础
│   ├── queries/              # 查询基础
│   ├── handlers/             # 处理器基础
│   ├── services/             # 应用服务基础
│   └── dto/                  # 基础DTO
├── infrastructure/           # 基础设施
│   ├── persistence/          # 持久化基础
│   ├── messaging/            # 消息基础
│   ├── events/               # 事件基础设施
│   ├── external/             # 外部服务基础
│   └── cqrs/                 # 内置CQRS功能
├── interfaces/               # 接口基础
│   ├── rest/                 # REST API基础
│   ├── graphql/              # GraphQL基础
│   ├── grpc/                 # gRPC基础
│   └── messaging/            # 消息接口基础
├── shared/                   # 共享组件
│   ├── types/                # 通用类型
│   ├── utils/                # 工具函数
│   ├── decorators/           # 装饰器
│   ├── validators/           # 验证器
│   └── constants/            # 常量定义
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

### 3. 基础设施组件

#### 持久化基础 (Persistence Base)

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

#### 事件基础设施 (Event Infrastructure)

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

### 4. 接口基础组件

#### REST API基础

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

### 5. 共享组件

#### 通用类型 (Common Types)

```typescript
// 结果类型
type Result<T, E = Error> = Success<T> | Failure<E>;

class Success<T> {
  constructor(public readonly data: T) {}
  isSuccess(): this is Success<T> { return true; }
  isFailure(): this is Failure<never> { return false; }
}

class Failure<E> {
  constructor(public readonly error: E) {}
  isSuccess(): this is Success<never> { return false; }
  isFailure(): this is Failure<E> { return true; }
}

// 分页结果
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

#### 工具函数 (Utilities)

```typescript
// UUID工具类
class UUIDUtils {
  /**
   * 生成UUID v4
   * @returns 标准格式的UUID v4字符串
   */
  static generate(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 验证UUID格式
   * @param uuid 待验证的UUID字符串
   * @returns 是否为有效的UUID格式
   */
  static isValid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * 生成短UUID（去掉连字符）
   * @returns 32位十六进制字符串
   */
  static generateShort(): string {
    return this.generate().replace(/-/g, '');
  }
}

// 租户上下文工具
class TenantContextUtils {
  static extractFromRequest(req: Request): TenantContext {
    return {
      tenantId: TenantId.fromString(req.headers['x-tenant-id'] as string),
      userId: UserId.fromString(req.headers['x-user-id'] as string),
      organizationId: req.headers['x-organization-id'] ? 
        OrganizationId.fromString(req.headers['x-organization-id'] as string) : undefined,
      departmentId: req.headers['x-department-id'] ? 
        EntityId.fromString(req.headers['x-department-id'] as string) : undefined,
      permissions: req.headers['x-permissions'] ? 
        (req.headers['x-permissions'] as string).split(',') : [],
      features: req.headers['x-features'] ? 
        (req.headers['x-features'] as string).split(',') : []
    };
  }
}

// 事件工具
class EventUtils {
  static createEvent<T extends DomainEvent>(
    eventClass: new (...args: any[]) => T,
    ...args: any[]
  ): T {
    return new eventClass(...args);
  }
}
```

#### 装饰器 (Decorators)

```typescript
// 租户验证装饰器
function RequireTenant(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const req = args[0] as Request;
    if (!req.tenantContext?.tenantId) {
      throw new UnauthorizedError('Tenant context required');
    }
    return originalMethod.apply(this, args);
  };
}

// 权限验证装饰器
function RequirePermission(permission: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const req = args[0] as Request;
      if (!req.userContext?.permissions?.includes(permission)) {
        throw new ForbiddenError(`Permission '${permission}' required`);
      }
      return originalMethod.apply(this, args);
    };
  };
}

// 组织验证装饰器
function RequireOrganization(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const req = args[0] as Request;
    if (!req.tenantContext?.organizationId) {
      throw new ForbiddenError('Organization context required');
    }
    return originalMethod.apply(this, args);
  };
}

// 部门验证装饰器
function RequireDepartment(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const req = args[0] as Request;
    if (!req.tenantContext?.departmentId) {
      throw new ForbiddenError('Department context required');
    }
    return originalMethod.apply(this, args);
  };
}
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

// 租户上下文中间件
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);
    const tenant = await this.tenantService.getTenant(tenantId);
    
    req.tenantContext = {
      tenantId: TenantId.fromString(tenant.id),
      userId: UserId.fromString(this.extractUserId(req)),
      permissions: tenant.permissions,
      features: tenant.features
    };
    
    next();
  }
}
```

### 数据隔离

```typescript
// 租户数据过滤器
class TenantDataFilter {
  static addTenantFilter(query: any, tenantId: TenantId): any {
    return { ...query, tenantId: tenantId.toString() };
  }

  static validateTenantAccess(entity: TenantAwareEntity, tenantId: TenantId): void {
    if (!entity.tenantId.equals(tenantId)) {
      throw new ForbiddenError('Access denied: different tenant');
    }
  }
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

### 命令总线

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

### 事件存储

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
import { CoreModule } from '@aiofix-ai-saas-practice/core';

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

## 总结

Core模块为Aiofix-AI-SaaS平台提供了统一的技术架构基础，内置完整的CQRS功能，包括：

### 🏗️ 架构基础

1. **领域基础**：分离的实体和聚合根基类、值对象、事件基类
2. **应用基础**：标准化的命令、查询、处理器基类
3. **基础设施**：内置的持久化、消息、事件基础设施
4. **接口基础**：REST、GraphQL、gRPC接口基类

### 🔧 核心功能

1. **内置CQRS**：完整的命令总线、查询总线、事件总线、事件存储
2. **多租户支持**：完整的租户上下文和数据隔离
3. **多组织支持**：组织级别的数据隔离和权限管理
4. **AI集成**：标准化的AI服务抽象和集成
5. **企业级功能**：多部门、权限管理等企业级功能

### 🚀 核心价值

- **完全控制**：内置CQRS功能，完全控制其行为
- **深度集成**：与多租户、多组织、AI能力深度集成
- **架构统一**：所有业务领域模块基于相同的架构
- **职责分离**：实体和聚合根分开设计，各司其职
- **代码复用**：通用功能集中管理，避免重复开发
- **快速开发**：业务模块可以快速构建，专注于业务逻辑
- **易于维护**：通用功能的升级和修复影响所有模块
- **类型安全**：基于TypeScript的强类型支持
- **标准化**：统一的命名规范、接口设计和实现模式

通过Core模块，所有业务领域模块都可以快速构建，确保架构一致性和代码复用性，同时享受内置CQRS功能的强大能力。
