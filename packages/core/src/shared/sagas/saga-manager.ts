import { Injectable, Logger } from '@nestjs/common';
import type { AsyncContext } from '../context';
import { SagaExecutor } from './saga-executor';
import type {
  ISaga,
  ISagaConfig,
  ISagaExecutionContext,
  ISagaManager,
} from './saga.types';

/**
 * Saga管理器
 *
 * 负责管理Saga的注册、执行和生命周期。
 * 提供Saga的统一管理接口和状态监控。
 *
 * @description Saga管理器，提供Saga的统一管理功能
 *
 * ## 业务规则
 *
 * ### Saga注册规则
 * - 每个Saga必须有唯一的标识符
 * - 支持Saga的配置管理
 * - 提供Saga的依赖注入支持
 * - 支持Saga的自动发现和注册
 *
 * ### Saga执行规则
 * - 支持Saga的并发执行
 * - 提供Saga的状态监控
 * - 支持Saga的生命周期管理
 * - 提供Saga的错误处理和恢复
 *
 * ## 业务逻辑流程
 *
 * 1. **Saga注册**：注册Saga实例和配置
 * 2. **Saga启动**：启动Saga执行
 * 3. **状态监控**：监控Saga的执行状态
 * 4. **生命周期管理**：管理Saga的启动、暂停、恢复、取消
 * 5. **错误处理**：处理Saga执行过程中的错误
 *
 * @example
 * ```typescript
 * // 创建Saga管理器
 * const manager = new SagaManager();
 *
 * // 注册Saga
 * const saga: ISaga = (eventBus) => {
 *   return eventBus.ofType(UserCreatedEvent).pipe(
 *     map(event => new SendWelcomeEmailCommand(event.userId))
 *   );
 * };
 *
 * manager.registerSaga(saga, {
 *   name: 'UserWelcomeSaga',
 *   enableLogging: true
 * });
 *
 * // 启动Saga
 * const execution = await manager.startSaga('UserWelcomeSaga', {
 *   userId: 'user-123'
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class SagaManager implements ISagaManager {
  private readonly logger = new Logger(SagaManager.name);
  private readonly _sagas = new Map<
    string,
    { saga: ISaga; config: ISagaConfig }
  >();
  private readonly _executor: SagaExecutor;

  /**
   * 构造函数
   *
   * @param executor Saga执行器
   */
  constructor(executor?: SagaExecutor) {
    this._executor = executor || new SagaExecutor();
  }

  /**
   * 注册Saga
   *
   * @description 注册Saga实例和配置
   * @param saga Saga实例
   * @param config Saga配置
   */
  registerSaga(saga: ISaga, config: ISagaConfig = {}): void {
    const sagaId = config.name || `saga_${Date.now()}`;

    if (this._sagas.has(sagaId)) {
      this.logger.warn(`Saga already registered: ${sagaId}`);
      return;
    }

    this._sagas.set(sagaId, { saga, config });

    if (config.enableLogging) {
      this.logger.debug(`Registered saga: ${sagaId}`);
    }
  }

  /**
   * 启动Saga
   *
   * @description 启动指定ID的Saga执行
   * @param sagaId Saga ID
   * @param initialData 初始数据
   * @param context 异步上下文
   * @returns 执行上下文
   */
  async startSaga(
    sagaId: string,
    initialData?: Record<string, any>,
    context?: AsyncContext
  ): Promise<ISagaExecutionContext> {
    const sagaInfo = this._sagas.get(sagaId);
    if (!sagaInfo) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    const { saga, config } = sagaInfo;

    // 合并初始数据到配置中
    const executionConfig: ISagaConfig = {
      ...config,
      name: sagaId,
    };

    // 如果提供了初始数据，将其添加到上下文中
    if (initialData && context) {
      for (const [key, value] of Object.entries(initialData)) {
        context.set(key, value);
      }
    }

    return this._executor.executeSaga(saga, executionConfig, context);
  }

  /**
   * 暂停Saga
   *
   * @description 暂停指定执行ID的Saga
   * @param executionId 执行ID
   */
  async pauseSaga(executionId: string): Promise<void> {
    return this._executor.pauseSaga(executionId);
  }

  /**
   * 恢复Saga
   *
   * @description 恢复指定执行ID的Saga
   * @param executionId 执行ID
   */
  async resumeSaga(executionId: string): Promise<void> {
    return this._executor.resumeSaga(executionId);
  }

  /**
   * 取消Saga
   *
   * @description 取消指定执行ID的Saga
   * @param executionId 执行ID
   */
  async cancelSaga(executionId: string): Promise<void> {
    return this._executor.cancelSaga(executionId);
  }

  /**
   * 获取Saga执行状态
   *
   * @description 获取指定执行ID的Saga执行状态
   * @param executionId 执行ID
   * @returns 执行上下文，如果不存在则返回undefined
   */
  getSagaExecution(executionId: string): ISagaExecutionContext | undefined {
    return this._executor.getSagaExecution(executionId);
  }

  /**
   * 获取所有活跃的Saga执行
   *
   * @description 获取所有正在运行的Saga执行
   * @returns 执行上下文数组
   */
  getAllActiveExecutions(): ISagaExecutionContext[] {
    return this._executor.getAllActiveExecutions();
  }

  /**
   * 获取所有Saga执行
   *
   * @description 获取所有Saga执行记录
   * @returns 执行上下文数组
   */
  getAllExecutions(): ISagaExecutionContext[] {
    return this._executor.getAllExecutions();
  }

  /**
   * 获取注册的Saga信息
   *
   * @description 获取指定ID的注册Saga信息
   * @param sagaId Saga ID
   * @returns Saga信息，如果不存在则返回undefined
   */
  getRegisteredSaga(
    sagaId: string
  ): { saga: ISaga; config: ISagaConfig } | undefined {
    return this._sagas.get(sagaId);
  }

  /**
   * 获取所有注册的Saga
   *
   * @description 获取所有已注册的Saga信息
   * @returns Saga信息映射
   */
  getAllRegisteredSagas(): Map<string, { saga: ISaga; config: ISagaConfig }> {
    return new Map(this._sagas);
  }

  /**
   * 注销Saga
   *
   * @description 注销指定ID的Saga
   * @param sagaId Saga ID
   * @returns 如果注销成功则返回true，否则返回false
   */
  unregisterSaga(sagaId: string): boolean {
    const existed = this._sagas.has(sagaId);
    if (existed) {
      this._sagas.delete(sagaId);
      this.logger.debug(`Unregistered saga: ${sagaId}`);
    }
    return existed;
  }

  /**
   * 清除所有Saga
   *
   * @description 清除所有已注册的Saga
   */
  clearAllSagas(): void {
    this._sagas.clear();
    this.logger.debug('Cleared all registered sagas');
  }

  /**
   * 获取Saga统计信息
   *
   * @description 获取Saga的统计信息
   * @returns 统计信息
   */
  getSagaStats(): {
    totalRegistered: number;
    totalExecutions: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    cancelledExecutions: number;
  } {
    const allExecutions = this._executor.getAllExecutions();
    const activeExecutions = this._executor.getAllActiveExecutions();

    return {
      totalRegistered: this._sagas.size,
      totalExecutions: allExecutions.length,
      activeExecutions: activeExecutions.length,
      completedExecutions: allExecutions.filter((e) => e.state === 'COMPLETED')
        .length,
      failedExecutions: allExecutions.filter((e) => e.state === 'FAILED')
        .length,
      cancelledExecutions: allExecutions.filter((e) => e.state === 'CANCELLED')
        .length,
    };
  }

  /**
   * 清除完成的Saga执行
   *
   * @description 清除已完成、失败或取消的Saga执行记录
   */
  clearCompletedExecutions(): void {
    this._executor.clearCompletedExecutions();
  }
}
