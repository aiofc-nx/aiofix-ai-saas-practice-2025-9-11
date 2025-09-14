# @aiofix/logging

Aiofix-AI-SaaS平台的日志记录库，基于Pino提供高性能的结构化日志功能。

## 特性

- 🚀 **高性能**: 基于Pino的高性能日志库
- 📊 **结构化**: 支持结构化JSON日志输出
- 🏢 **多租户**: 支持多租户上下文和用户上下文
- 🔒 **安全**: 自动脱敏敏感信息
- 📈 **监控**: 内置性能监控和统计功能
- 🎯 **灵活**: 支持多种配置选项和动态更新
- 🔧 **集成**: 与NestJS深度集成，支持中间件和拦截器

## 安装

```bash
pnpm add @aiofix/logging
```

## 快速开始

### 基础使用

```typescript
import { LoggingModule } from '@aiofix/logging';

@Module({
  imports: [
    LoggingModule.forRoot({
      config: {
        level: 'info',
        format: 'json',
        colorize: false
      }
    })
  ]
})
export class AppModule {}
```

### 在服务中使用

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '@aiofix/logging';

@Injectable()
export class UserService {
  constructor(private readonly logger: PinoLoggerService) {}

  async createUser(userData: any) {
    this.logger.info('Creating new user', LogContext.BUSINESS, {
      operation: 'createUser',
      userId: userData.id
    });

    try {
      // 业务逻辑
      const user = await this.userRepository.save(userData);
      
      this.logger.info('User created successfully', LogContext.BUSINESS, {
        operation: 'createUser',
        userId: user.id,
        duration: Date.now() - startTime
      });

      return user;
    } catch (error) {
      this.logger.error('Failed to create user', LogContext.BUSINESS, {
        operation: 'createUser',
        error: error.message
      }, error);
      
      throw error;
    }
  }
}
```

## 配置选项

### LoggingModuleOptions

```typescript
interface LoggingModuleOptions {
  /** 日志配置 */
  config?: Partial<LogConfig>;
  /** 是否注册为全局模块 */
  global?: boolean;
  /** 是否自动注册中间件 */
  middleware?: boolean;
  /** 是否自动注册拦截器 */
  interceptor?: boolean;
}
```

### LogConfig

```typescript
interface LogConfig {
  /** 日志级别 */
  level: LogLevel;
  /** 日志格式 */
  format: LogFormat;
  /** 是否启用彩色输出 */
  colorize: boolean;
  /** 是否启用时间戳 */
  timestamp: boolean;
  /** 是否启用请求ID */
  requestId: boolean;
  /** 是否启用租户ID */
  tenantId: boolean;
  /** 是否启用用户ID */
  userId: boolean;
  /** 是否启用性能监控 */
  performance: boolean;
  /** 是否启用错误堆栈 */
  stackTrace: boolean;
  /** 日志文件路径 */
  filePath?: string;
  /** 日志文件轮转配置 */
  rotation?: {
    maxSize: string;
    maxFiles: number;
    interval: string;
  };
  /** 远程日志配置 */
  remote?: {
    url: string;
    token?: string;
    timeout: number;
    retries: number;
  };
}
```

## 日志级别

支持以下日志级别：

- `trace`: 跟踪级别，最详细的日志
- `debug`: 调试级别，调试信息
- `info`: 信息级别，一般信息
- `warn`: 警告级别，警告信息
- `error`: 错误级别，错误信息
- `fatal`: 致命级别，致命错误

## 日志上下文

支持以下日志上下文：

- `HTTP_REQUEST`: HTTP请求
- `DATABASE`: 数据库操作
- `BUSINESS`: 业务逻辑
- `AUTH`: 认证授权
- `CONFIG`: 配置管理
- `CACHE`: 缓存操作
- `EVENT`: 事件处理
- `SYSTEM`: 系统操作
- `EXTERNAL`: 外部服务
- `PERFORMANCE`: 性能监控

## 使用示例

### 基础日志记录

```typescript
// 信息日志
this.logger.info('User logged in', LogContext.AUTH, {
  userId: user.id,
  ip: request.ip
});

// 错误日志
this.logger.error('Database connection failed', LogContext.DATABASE, {
  host: 'localhost',
  port: 5432
}, error);

// 性能日志
this.logger.performance('Database query', 150, LogContext.DATABASE, {
  query: 'SELECT * FROM users',
  rows: 100
});
```

### 业务日志

```typescript
// 业务日志
this.logger.business('Order created', {
  orderId: order.id,
  customerId: order.customerId,
  amount: order.total
});

// 安全日志
this.logger.security('Failed login attempt', {
  email: loginData.email,
  ip: request.ip,
  userAgent: request.headers['user-agent']
});
```

### 子日志器

```typescript
// 创建子日志器
const userLogger = this.logger.child(LogContext.BUSINESS, {
  userId: user.id,
  tenantId: tenant.id
});

userLogger.info('User profile updated', {
  fields: ['name', 'email']
});
```

## 中间件和拦截器

### 自动HTTP日志记录

启用中间件后，会自动记录所有HTTP请求和响应：

```typescript
@Module({
  imports: [
    LoggingModule.forRoot({
      middleware: true,  // 启用中间件
      interceptor: true  // 启用拦截器
    })
  ]
})
export class AppModule {}
```

### 手动使用中间件

```typescript
import { PinoLoggingMiddleware } from '@aiofix/logging';

@Module({
  providers: [PinoLoggingMiddleware]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PinoLoggingMiddleware)
      .forRoutes('*');
  }
}
```

### 手动使用拦截器

```typescript
import { PinoLoggingInterceptor } from '@aiofix/logging';

@Controller('users')
@UseInterceptors(PinoLoggingInterceptor)
export class UserController {
  // 控制器方法
}
```

## 环境变量配置

支持通过环境变量配置日志：

```bash
# 日志级别
LOG_LEVEL=info

# 日志格式
LOG_FORMAT=json

# 日志文件路径
LOG_FILE_PATH=./logs/app.log

# 远程日志配置
LOG_REMOTE_URL=https://logs.example.com/api/logs
LOG_REMOTE_TOKEN=your-token
LOG_REMOTE_TIMEOUT=5000
LOG_REMOTE_RETRIES=3
```

## 统计信息

获取日志统计信息：

```typescript
const stats = this.logger.getStats();
console.log('Total logs:', stats.totalLogs);
console.log('Logs by level:', stats.logsByLevel);
console.log('Average log size:', stats.averageLogSize);
```

## 最佳实践

### 1. 使用合适的日志级别

```typescript
// ✅ 好的做法
this.logger.debug('Processing user data', LogContext.BUSINESS, { userId });
this.logger.info('User created successfully', LogContext.BUSINESS, { userId });
this.logger.warn('Rate limit exceeded', LogContext.AUTH, { userId, ip });
this.logger.error('Database connection failed', LogContext.DATABASE, {}, error);

// ❌ 避免的做法
this.logger.info('Processing user data'); // 应该用debug
this.logger.error('User created successfully'); // 应该用info
```

### 2. 提供有意义的上下文

```typescript
// ✅ 好的做法
this.logger.info('User profile updated', LogContext.BUSINESS, {
  userId: user.id,
  tenantId: user.tenantId,
  fields: ['name', 'email'],
  updatedBy: currentUser.id
});

// ❌ 避免的做法
this.logger.info('Profile updated'); // 缺少上下文信息
```

### 3. 使用结构化元数据

```typescript
// ✅ 好的做法
this.logger.info('Order processed', LogContext.BUSINESS, {
  orderId: order.id,
  customerId: order.customerId,
  amount: order.total,
  currency: order.currency,
  paymentMethod: order.paymentMethod,
  duration: processingTime
});

// ❌ 避免的做法
this.logger.info(`Order ${order.id} processed for customer ${order.customerId}`); // 非结构化
```

### 4. 错误日志包含完整信息

```typescript
// ✅ 好的做法
this.logger.error('Failed to process payment', LogContext.BUSINESS, {
  orderId: order.id,
  customerId: order.customerId,
  paymentMethod: order.paymentMethod,
  amount: order.total,
  errorCode: error.code
}, error);

// ❌ 避免的做法
this.logger.error('Payment failed', LogContext.BUSINESS, {}, error); // 缺少业务上下文
```

## 许可证

MIT License
