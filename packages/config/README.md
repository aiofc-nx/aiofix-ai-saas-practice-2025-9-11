# @aiofix/config

Aiofix-AI-SaaS平台的配置管理库，提供类型安全、模块化的配置管理功能。

## 特性

- 🔧 **类型安全**: 完整的TypeScript类型定义和泛型支持
- 📦 **模块化**: 支持多个配置模块（app、database、redis、jwt等）
- 🔒 **只读保护**: 使用`Object.freeze()`确保配置不可变
- 🌍 **环境变量**: 完整的环境变量管理和验证
- 🔄 **配置合并**: 深度合并默认配置和自定义配置
- 🏢 **企业级**: 支持多数据库、缓存、认证等企业级配置
- 📊 **日志集成**: 与logging模块深度集成

## 安装

```bash
pnpm add @aiofix/config
```

## 快速开始

### 基础使用

```typescript
import { ConfigModule } from '@aiofix/config';

@Module({
  imports: [ConfigModule]
})
export class AppModule {}
```

### 在服务中使用

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@aiofix/config';

@Injectable()
export class DatabaseService {
  constructor(private readonly configService: ConfigService) {}

  async connect() {
    const dbConfig = this.configService.databaseConfig;
    const host = this.configService.get('DB_HOST');
    
    // 使用配置连接数据库
    console.log(`Connecting to ${host}:${dbConfig.port}`);
  }
}
```

## 配置模块

### 应用配置 (app)

```typescript
// 获取应用配置
const appConfig = this.configService.appConfig;

// 配置项包括：
// - name: 应用名称
// - version: 应用版本
// - environment: 运行环境
// - port: 服务端口
// - host: 服务主机
```

### 数据库配置 (database)

```typescript
// 获取数据库配置
const dbConfig = this.configService.databaseConfig;

// PostgreSQL配置
const pgConfig = dbConfig.postgresql;

// MongoDB配置
const mongoConfig = dbConfig.mongodb;

// MikroORM配置
const mikroOrmConfig = this.configService.dbMikroOrmConnectionOptions;

// Knex配置
const knexConfig = this.configService.dbKnexConnectionOptions;
```

### Redis配置 (redis)

```typescript
// 获取Redis配置
const redisConfig = this.configService.redisConfig;

// 配置项包括：
// - host: Redis主机
// - port: Redis端口
// - password: 连接密码
// - db: 数据库编号
// - connectionPool: 连接池配置
// - cache: 缓存配置
// - distributedLock: 分布式锁配置
```

### JWT配置 (jwt)

```typescript
// 获取JWT配置
const jwtConfig = this.configService.jwtConfig;

// 配置项包括：
// - secret: JWT密钥
// - accessToken: 访问令牌配置
// - refreshToken: 刷新令牌配置
// - multiTenant: 多租户配置
// - security: 安全配置
```

### 邮件配置 (email)

```typescript
// 获取邮件配置
const emailConfig = this.configService.emailConfig;

// 配置项包括：
// - smtp: SMTP服务器配置
// - sending: 发送配置
// - templates: 邮件模板配置
// - types: 邮件类型配置
// - validation: 验证配置
// - queue: 队列配置
```

### 日志配置 (logging)

```typescript
// 获取日志配置
const loggingConfig = this.configService.loggingConfig;

// 配置项包括：
// - level: 日志级别
// - format: 日志格式
// - output: 输出配置
// - filtering: 过滤配置
// - monitoring: 监控配置
// - retention: 保留配置
```

## API参考

### ConfigService

#### 配置获取方法

```typescript
// 获取完整配置
const fullConfig = this.configService.getConfig();

// 获取特定配置模块
const appConfig = this.configService.getConfigValue('app');

// 使用getter方法
const dbConfig = this.configService.databaseConfig;
const redisConfig = this.configService.redisConfig;
```

#### 环境变量访问

```typescript
// 获取环境变量（类型安全）
const dbHost = this.configService.get('DB_HOST');
const dbPort = this.configService.get('DB_PORT');

// 检查环境
const isProduction = this.configService.isProd();
```

### 配置加载器 (config-loader)

```typescript
import { getConfig, defineConfig, resetConfig } from '@aiofix/config';

// 获取当前配置
const currentConfig = getConfig();

// 定义新配置（深度合并）
await defineConfig({
  app: {
    name: 'My Custom App',
    version: '2.0.0'
  },
  database: {
    postgresql: {
      host: 'localhost',
      port: 5432
    }
  }
});

// 重置配置到默认值
resetConfig();
```

## 环境变量配置

支持通过环境变量覆盖配置：

```bash
# 应用配置
APP_NAME=MyApp
APP_VERSION=1.0.0
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=aiofix

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT配置
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json
```

## 配置合并机制

### 深度合并

配置系统支持深度合并，允许部分覆盖配置：

```typescript
// 默认配置
const defaultConfig = {
  database: {
    postgresql: {
      host: 'localhost',
      port: 5432,
      pool: {
        min: 2,
        max: 10
      }
    }
  }
};

// 用户配置（只覆盖部分）
const userConfig = {
  database: {
    postgresql: {
      host: 'remote-host' // 只覆盖host
    }
  }
};

// 合并结果
const mergedConfig = {
  database: {
    postgresql: {
      host: 'remote-host',     // 用户配置覆盖
      port: 5432,              // 保留默认值
      pool: {                  // 保留默认值
        min: 2,
        max: 10
      }
    }
  }
};
```

### 配置优先级

1. 环境变量（最高优先级）
2. 用户自定义配置
3. 默认配置（最低优先级）

## 类型安全

### 泛型支持

```typescript
// 类型安全的配置访问
const appConfig = this.configService.getConfigValue('app');
const dbConfig = this.configService.getConfigValue('database');

// 环境变量类型安全
const dbHost: string = this.configService.get('DB_HOST');
```

### 只读保护

```typescript
// 所有配置都是只读的
const config = this.configService.getConfig();
// config.app.name = 'new name'; // ❌ 编译错误

// 使用类型断言（不推荐）
const mutableConfig = config as any;
mutableConfig.app.name = 'new name'; // ⚠️ 运行时可能出错
```

## 最佳实践

### 1. 配置验证

```typescript
@Injectable()
export class DatabaseService {
  constructor(private readonly configService: ConfigService) {
    this.validateDatabaseConfig();
  }

  private validateDatabaseConfig() {
    const dbConfig = this.configService.databaseConfig;
    
    if (!dbConfig.postgresql?.host) {
      throw new Error('Database host is required');
    }
    
    if (!dbConfig.postgresql?.port) {
      throw new Error('Database port is required');
    }
  }
}
```

### 2. 环境特定配置

```typescript
@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getApiUrl() {
    if (this.configService.isProd()) {
      return 'https://api.production.com';
    }
    
    return 'http://localhost:3000';
  }
}
```

### 3. 配置缓存

```typescript
@Injectable()
export class CacheService {
  private readonly cacheConfig: any;

  constructor(private readonly configService: ConfigService) {
    // 在构造函数中缓存配置，避免重复获取
    this.cacheConfig = this.configService.redisConfig;
  }

  async getCacheConfig() {
    return this.cacheConfig;
  }
}
```

### 4. 错误处理

```typescript
@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  async sendEmail(to: string, subject: string, body: string) {
    try {
      const emailConfig = this.configService.emailConfig;
      // 使用配置发送邮件
    } catch (error) {
      // 配置错误处理
      console.error('Email configuration error:', error.message);
      throw new Error('Failed to send email due to configuration error');
    }
  }
}
```

## 测试支持

### 配置模拟

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@aiofix/config';

describe('AppService', () => {
  let service: AppService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            appConfig: { name: 'Test App', version: '1.0.0' },
            isProd: () => false,
            get: (key: string) => 'test-value'
          }
        }
      ]
    }).compile();

    service = module.get<AppService>(AppService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should use test configuration', () => {
    const appConfig = configService.appConfig;
    expect(appConfig.name).toBe('Test App');
  });
});
```

## 许可证

MIT License
