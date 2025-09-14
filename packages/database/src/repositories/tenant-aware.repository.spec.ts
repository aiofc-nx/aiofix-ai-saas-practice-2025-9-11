/**
 * @file tenant-aware.repository.spec.ts
 * @description 租户感知仓储单元测试
 */

import { TenantAwareRepository } from './tenant-aware.repository';
import {
  IsolationConfigService,
  IsolationStrategy,
} from '../config/isolation.config';
import { DatabaseAdapterFactory } from '../adapters/database-adapter.factory';
import { IDatabaseAdapter } from '../interfaces/database.interface';

// Mock database adapter
const mockDatabaseAdapter: jest.Mocked<IDatabaseAdapter> = {
  name: 'test-adapter',
  type: 'postgresql',
  isConnected: true,
  config: {} as any,
  eventEmitter: {} as any,
  connect: jest.fn(),
  disconnect: jest.fn(),
  query: jest.fn(),
  execute: jest.fn(),
  transaction: jest.fn(),
  getHealth: jest.fn(),
  getStats: jest.fn(),
  resetStats: jest.fn(),
  getConnection: jest.fn(),
  ping: jest.fn(),
  setTenantContext: jest.fn(),
  getTenantContext: jest.fn(),
  setDefaultSchema: jest.fn(),
  getDefaultSchema: jest.fn(),
  enableRowLevelSecurity: jest.fn(),
  disableRowLevelSecurity: jest.fn(),
  isRowLevelSecurityEnabled: jest.fn(),
};

// Mock database adapter factory
const mockAdapterFactory: jest.Mocked<DatabaseAdapterFactory> = {
  createAdapter: jest.fn().mockReturnValue(mockDatabaseAdapter),
  createPlatformAdapter: jest.fn().mockReturnValue(mockDatabaseAdapter),
  createEventsAdapter: jest.fn().mockReturnValue(mockDatabaseAdapter),
  createAiVectorsAdapter: jest.fn().mockReturnValue(mockDatabaseAdapter),
} as any;

// Test entity interface
interface TestEntity {
  id: string;
  name: string;
  tenant_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Concrete implementation for testing
class TestTenantAwareRepository extends TenantAwareRepository<TestEntity> {
  constructor(
    adapterFactory: DatabaseAdapterFactory,
    isolationConfig: IsolationConfigService,
  ) {
    super(adapterFactory, isolationConfig, 'tenant-123');
  }

  protected getTableName(): string {
    return 'test_entities';
  }

  protected mapRowToEntity(row: any): TestEntity {
    return {
      id: row.id,
      name: row.name,
      tenant_id: row.tenant_id,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(entity: TestEntity): any {
    return {
      id: entity.id,
      name: entity.name,
      tenant_id: entity.tenant_id,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}

describe('TenantAwareRepository', () => {
  let repository: TestTenantAwareRepository;
  let isolationConfig: IsolationConfigService;

  beforeEach(async () => {
    // 创建mock ConfigService
    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    // 直接实例化服务以避免循环依赖
    isolationConfig = new IsolationConfigService(mockConfigService as any);

    repository = new TestTenantAwareRepository(
      mockAdapterFactory,
      isolationConfig,
    );

    // 重置所有 mock
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should find all entities with tenant isolation', async () => {
      const mockRows = [
        {
          id: '1',
          name: 'Entity 1',
          tenant_id: 'tenant-123',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: '2',
          name: 'Entity 2',
          tenant_id: 'tenant-123',
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
        },
      ];

      mockDatabaseAdapter.query.mockResolvedValue({ rows: mockRows } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');
      jest
        .spyOn(isolationConfig, 'shouldAutoAddTenantCondition')
        .mockReturnValue(true);

      const result = await repository.findAll();

      expect(mockDatabaseAdapter.query).toHaveBeenCalledWith(
        "SELECT * FROM test_entities WHERE tenant_id = 'tenant-123'",
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].tenant_id).toBe('tenant-123');
    });

    it('should find all entities without tenant isolation for platform level', async () => {
      const mockRows = [
        {
          id: '1',
          name: 'Entity 1',
          tenant_id: 'tenant-123',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: '2',
          name: 'Entity 2',
          tenant_id: 'tenant-456',
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
        },
      ];

      mockDatabaseAdapter.query.mockResolvedValue({ rows: mockRows } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.DATABASE_LEVEL);

      const result = await repository.findAll();

      expect(mockDatabaseAdapter.query).toHaveBeenCalledWith(
        'SELECT * FROM test_entities',
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should find entity by ID with tenant isolation', async () => {
      const mockRow = {
        id: '1',
        name: 'Entity 1',
        tenant_id: 'tenant-123',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockDatabaseAdapter.query.mockResolvedValue({ rows: [mockRow] } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');
      jest
        .spyOn(isolationConfig, 'shouldAutoAddTenantCondition')
        .mockReturnValue(true);

      const result = await repository.findById('1');

      expect(mockDatabaseAdapter.query).toHaveBeenCalledWith(
        "SELECT * FROM test_entities WHERE id = $1 AND tenant_id = 'tenant-123'",
        ['1'],
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
    });

    it('should return null when entity not found', async () => {
      mockDatabaseAdapter.query.mockResolvedValue({ rows: [] } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');
      jest
        .spyOn(isolationConfig, 'shouldAutoAddTenantCondition')
        .mockReturnValue(true);

      const result = await repository.findById('1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create entity with tenant ID', async () => {
      const entity: TestEntity = {
        id: '1',
        name: 'New Entity',
        tenant_id: 'tenant-123',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockDatabaseAdapter.query.mockResolvedValue({ rows: [entity] } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');

      const result = await repository.create(entity);

      expect(mockDatabaseAdapter.query).toHaveBeenCalledWith(
        `
      INSERT INTO test_entities (id, name, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
        ['1', 'New Entity', 'tenant-123', entity.created_at, entity.updated_at],
      );
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update entity with tenant isolation', async () => {
      const entity: TestEntity = {
        id: '1',
        name: 'Updated Entity',
        tenant_id: 'tenant-123',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      mockDatabaseAdapter.query.mockResolvedValue({ rows: [entity] } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');
      jest
        .spyOn(isolationConfig, 'shouldAutoAddTenantCondition')
        .mockReturnValue(true);

      const result = await repository.update('1', entity);

      expect(mockDatabaseAdapter.query).toHaveBeenCalledWith(
        `
      UPDATE test_entities
      SET id = $2, name = $3, tenant_id = $4, created_at = $5, updated_at = $6, updated_at = NOW()
      WHERE id = $1
     AND tenant_id = 'tenant-123'`,
        [
          '1',
          '1',
          'Updated Entity',
          'tenant-123',
          entity.created_at,
          entity.updated_at,
        ],
      );
      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete entity with tenant isolation', async () => {
      mockDatabaseAdapter.query.mockResolvedValue({ rowCount: 1 } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');
      jest
        .spyOn(isolationConfig, 'shouldAutoAddTenantCondition')
        .mockReturnValue(true);

      const result = await repository.delete('1');

      expect(mockDatabaseAdapter.query).toHaveBeenCalledWith(
        "DELETE FROM test_entities WHERE id = $1 AND tenant_id = 'tenant-123'",
        ['1'],
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      mockDatabaseAdapter.query.mockResolvedValue({ rowCount: 0 } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');
      jest
        .spyOn(isolationConfig, 'shouldAutoAddTenantCondition')
        .mockReturnValue(true);

      const result = await repository.delete('1');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should count entities with tenant isolation', async () => {
      mockDatabaseAdapter.query.mockResolvedValue({
        rows: [{ count: '5' }],
      } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');
      jest
        .spyOn(isolationConfig, 'shouldAutoAddTenantCondition')
        .mockReturnValue(true);

      const result = await repository.count();

      expect(mockDatabaseAdapter.query).toHaveBeenCalledWith(
        "SELECT COUNT(*) as count FROM test_entities WHERE tenant_id = 'tenant-123'",
        [],
      );
      expect(result).toBe(5);
    });
  });

  describe('exists', () => {
    it('should return true when entity exists', async () => {
      mockDatabaseAdapter.query.mockResolvedValue({
        rows: [{ count: '1' }],
      } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');
      jest
        .spyOn(isolationConfig, 'shouldAutoAddTenantCondition')
        .mockReturnValue(true);

      const result = await repository.exists('1');

      expect(mockDatabaseAdapter.query).toHaveBeenCalledWith(
        "SELECT * FROM test_entities WHERE id = $1 AND tenant_id = 'tenant-123'",
        ['1'],
      );
      expect(result).toBe(true);
    });

    it('should return false when entity does not exist', async () => {
      mockDatabaseAdapter.query.mockResolvedValue({
        rows: [],
      } as any);
      jest
        .spyOn(isolationConfig, 'getStrategy')
        .mockReturnValue(IsolationStrategy.TABLE_LEVEL);
      jest
        .spyOn(isolationConfig, 'getTenantIdField')
        .mockReturnValue('tenant_id');
      jest
        .spyOn(isolationConfig, 'shouldAutoAddTenantCondition')
        .mockReturnValue(true);

      const result = await repository.exists('1');

      expect(result).toBe(false);
    });
  });

  describe('createTenantSpecificRepository', () => {
    it('should create tenant-specific repository', () => {
      const tenantRepo =
        repository.createTenantSpecificRepository('tenant-123');

      expect(tenantRepo).toBeDefined();
      expect(tenantRepo).toBeInstanceOf(TestTenantAwareRepository);
    });
  });
});
