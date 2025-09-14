import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 基础迁移类
 *
 * 基础迁移类提供数据库迁移的通用功能和模板。
 * 所有数据库迁移都应该继承此类，确保迁移的一致性和可维护性。
 *
 * @description 所有数据库迁移的基类
 * 提供迁移的通用功能和最佳实践
 *
 * ## 业务规则
 *
 * ### 迁移命名规则
 * - 迁移文件名格式：YYYYMMDDHHMMSS-MigrationName.ts
 * - 迁移类名格式：MigrationName + 时间戳
 * - 迁移描述应该清晰明确
 * - 迁移应该包含回滚逻辑
 *
 * ### 迁移执行规则
 * - 迁移应该具有幂等性
 * - 迁移应该支持事务回滚
 * - 迁移应该包含错误处理
 * - 迁移应该记录执行日志
 *
 * ### 数据安全规则
 * - 迁移前应该备份重要数据
 * - 迁移应该支持数据验证
 * - 迁移应该包含回滚策略
 * - 迁移应该记录数据变更
 *
 * ## 业务逻辑流程
 *
 * 1. **迁移准备**：验证迁移环境和依赖
 * 2. **数据备份**：备份需要迁移的数据
 * 3. **结构变更**：执行数据库结构变更
 * 4. **数据迁移**：迁移和转换数据
 * 5. **验证检查**：验证迁移结果的正确性
 * 6. **清理工作**：清理临时数据和资源
 *
 * @example
 * ```typescript
 * export class CreateUsersTable1704067200000 implements MigrationInterface {
 *   public async up(queryRunner: QueryRunner): Promise<void> {
 *     await queryRunner.query(`
 *       CREATE TABLE users (
 *         id VARCHAR(36) PRIMARY KEY,
 *         name VARCHAR(255) NOT NULL,
 *         email VARCHAR(255) UNIQUE NOT NULL,
 *         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 *       )
 *     `);
 *   }
 *
 *   public async down(queryRunner: QueryRunner): Promise<void> {
 *     await queryRunner.query(`DROP TABLE users`);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseMigration implements MigrationInterface {
  /**
   * 迁移名称
   *
   * @description 迁移的唯一名称，用于标识迁移
   */
  public abstract readonly name: string;

  /**
   * 迁移描述
   *
   * @description 迁移的详细描述，说明迁移的目的和内容
   */
  public abstract readonly description: string;

  /**
   * 迁移版本
   *
   * @description 迁移的版本号，用于迁移的顺序控制
   */
  public abstract readonly version: string;

  /**
   * 执行迁移
   *
   * @description 执行数据库迁移操作
   * 包括创建表、修改结构、迁移数据等
   *
   * @param queryRunner 查询运行器
   * @throws {Error} 当迁移失败时抛出
   *
   * @example
   * ```typescript
   * public async up(queryRunner: QueryRunner): Promise<void> {
   *   await this.createTable(queryRunner);
   *   await this.createIndexes(queryRunner);
   *   await this.migrateData(queryRunner);
   * }
   * ```
   */
  public abstract up(queryRunner: QueryRunner): Promise<void>;

  /**
   * 回滚迁移
   *
   * @description 回滚数据库迁移操作
   * 恢复到迁移前的状态
   *
   * @param queryRunner 查询运行器
   * @throws {Error} 当回滚失败时抛出
   *
   * @example
   * ```typescript
   * public async down(queryRunner: QueryRunner): Promise<void> {
   *   await this.dropIndexes(queryRunner);
   *   await this.dropTable(queryRunner);
   * }
   * ```
   */
  public abstract down(queryRunner: QueryRunner): Promise<void>;

  /**
   * 执行SQL查询
   *
   * @description 执行SQL查询的安全包装方法
   * 提供错误处理和日志记录
   *
   * @param queryRunner 查询运行器
   * @param sql SQL查询语句
   * @param parameters 查询参数
   * @returns 查询结果
   * @protected
   * @throws {Error} 当查询失败时抛出
   */
  protected async executeQuery(
    queryRunner: QueryRunner,
    sql: string,
    parameters?: any[]
  ): Promise<any> {
    try {
      console.log(`Executing migration query: ${sql}`);
      const result = await queryRunner.query(sql, parameters);
      console.log(`Migration query executed successfully`);
      return result;
    } catch (error) {
      console.error(`Migration query failed: ${sql}`, error);
      throw new Error(`Migration query failed: ${(error as Error).message}`);
    }
  }

  /**
   * 创建表
   *
   * @description 创建数据库表的安全包装方法
   * 提供表创建的错误处理和日志记录
   *
   * @param queryRunner 查询运行器
   * @param tableName 表名
   * @param columns 列定义
   * @protected
   * @throws {Error} 当表创建失败时抛出
   */
  protected async createTable(
    queryRunner: QueryRunner,
    tableName: string,
    columns: string
  ): Promise<void> {
    const sql = `CREATE TABLE ${tableName} (${columns})`;
    await this.executeQuery(queryRunner, sql);
  }

  /**
   * 删除表
   *
   * @description 删除数据库表的安全包装方法
   * 提供表删除的错误处理和日志记录
   *
   * @param queryRunner 查询运行器
   * @param tableName 表名
   * @protected
   * @throws {Error} 当表删除失败时抛出
   */
  protected async dropTable(
    queryRunner: QueryRunner,
    tableName: string
  ): Promise<void> {
    const sql = `DROP TABLE IF EXISTS ${tableName}`;
    await this.executeQuery(queryRunner, sql);
  }

  /**
   * 创建索引
   *
   * @description 创建数据库索引的安全包装方法
   * 提供索引创建的错误处理和日志记录
   *
   * @param queryRunner 查询运行器
   * @param indexName 索引名
   * @param tableName 表名
   * @param columns 列名
   * @param unique 是否唯一索引
   * @protected
   * @throws {Error} 当索引创建失败时抛出
   */
  protected async createIndex(
    queryRunner: QueryRunner,
    indexName: string,
    tableName: string,
    columns: string,
    unique: boolean = false
  ): Promise<void> {
    const uniqueKeyword = unique ? 'UNIQUE ' : '';
    const sql = `CREATE ${uniqueKeyword}INDEX ${indexName} ON ${tableName} (${columns})`;
    await this.executeQuery(queryRunner, sql);
  }

  /**
   * 删除索引
   *
   * @description 删除数据库索引的安全包装方法
   * 提供索引删除的错误处理和日志记录
   *
   * @param queryRunner 查询运行器
   * @param indexName 索引名
   * @param tableName 表名
   * @protected
   * @throws {Error} 当索引删除失败时抛出
   */
  protected async dropIndex(
    queryRunner: QueryRunner,
    indexName: string,
    tableName: string
  ): Promise<void> {
    const sql = `DROP INDEX IF EXISTS ${indexName}`;
    await this.executeQuery(queryRunner, sql);
  }

  /**
   * 添加列
   *
   * @description 添加表列的安全包装方法
   * 提供列添加的错误处理和日志记录
   *
   * @param queryRunner 查询运行器
   * @param tableName 表名
   * @param columnName 列名
   * @param columnDefinition 列定义
   * @protected
   * @throws {Error} 当列添加失败时抛出
   */
  protected async addColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    columnDefinition: string
  ): Promise<void> {
    const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`;
    await this.executeQuery(queryRunner, sql);
  }

  /**
   * 删除列
   *
   * @description 删除表列的安全包装方法
   * 提供列删除的错误处理和日志记录
   *
   * @param queryRunner 查询运行器
   * @param tableName 表名
   * @param columnName 列名
   * @protected
   * @throws {Error} 当列删除失败时抛出
   */
  protected async dropColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string
  ): Promise<void> {
    const sql = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
    await this.executeQuery(queryRunner, sql);
  }

  /**
   * 验证迁移结果
   *
   * @description 验证迁移执行结果的正确性
   * 包括数据完整性、结构正确性等
   *
   * @param queryRunner 查询运行器
   * @protected
   * @throws {Error} 当验证失败时抛出
   */
  protected async validateMigration(queryRunner: QueryRunner): Promise<void> {
    // 子类可以重写此方法来实现具体的验证逻辑
    console.log(`Migration validation completed for: ${this.name}`);
  }
}
