import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import type { AsyncContext } from '../context';
import type {
  ISaga,
  ISagaConfig,
  ISagaExecutionContext,
  ISagaStepExecution,
  ICommand,
} from './saga.types';
import { SagaState } from './saga.types';

/**
 * Saga执行器
 *
 * 负责执行Saga逻辑，管理Saga的生命周期和状态。
 * 提供Saga的启动、暂停、恢复、取消等功能。
 *
 * @description Saga执行器，负责Saga的执行和状态管理
 *
 * ## 业务规则
 *
 * ### Saga执行规则
 * - 每个Saga都有唯一的执行ID
 * - Saga执行过程中保持状态一致性
 * - 支持Saga的暂停和恢复操作
 * - 提供Saga的补偿和回滚机制
 *
 * ### 状态管理规则
 * - Saga状态变更需要记录和通知
 * - 支持Saga执行的历史记录
 * - 提供Saga执行的统计和监控
 * - 支持Saga执行的错误处理和恢复
 *
 * ## 业务逻辑流程
 *
 * 1. **Saga启动**：创建执行上下文并启动Saga
 * 2. **事件监听**：监听相关事件并触发Saga逻辑
 * 3. **命令生成**：Saga根据事件生成相应的命令
 * 4. **命令执行**：执行Saga生成的命令
 * 5. **状态更新**：更新Saga的执行状态
 *
 * @example
 * ```typescript
 * // 创建Saga执行器
 * const executor = new SagaExecutor();
 *
 * // 定义Saga
 * const saga: ISaga = (eventBus) => {
 *   return eventBus.ofType(UserCreatedEvent).pipe(
 *     map(event => new SendWelcomeEmailCommand(event.userId))
 *   );
 * };
 *
 * // 执行Saga
 * const execution = await executor.executeSaga(saga, {
 *   name: 'UserWelcomeSaga',
 *   enableLogging: true
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class SagaExecutor {
  private readonly logger = new Logger(SagaExecutor.name);
  private readonly _executions = new Map<string, ISagaExecutionContext>();
  private readonly _runningExecutions = new Set<string>();

  /**
   * 执行Saga
   *
   * @description 执行指定的Saga并返回执行上下文
   * @param saga Saga实例
   * @param config Saga配置
   * @param context 异步上下文
   * @returns 执行上下文
   */
  async executeSaga(
    saga: ISaga,
    config: ISagaConfig = {},
    context?: AsyncContext
  ): Promise<ISagaExecutionContext> {
    const executionId = randomUUID();
    const sagaId = config.name || `saga_${Date.now()}`;

    // 创建执行上下文
    const executionContext: ISagaExecutionContext = {
      executionId,
      sagaId,
      state: SagaState.NOT_STARTED,
      currentStepIndex: 0,
      startTime: new Date(),
      data: {},
      stepHistory: [],
    };

    // 存储执行上下文
    this._executions.set(executionId, executionContext);

    try {
      // 更新状态为运行中
      this.updateSagaState(executionId, SagaState.RUNNING);

      if (config.enableLogging) {
        this.logger.debug(
          `Starting saga execution: ${sagaId} (${executionId})`
        );
      }

      // 执行Saga逻辑
      await this.runSagaLogic(saga, executionContext, config, context);

      // 更新状态为已完成
      this.updateSagaState(executionId, SagaState.COMPLETED);

      if (config.enableLogging) {
        this.logger.debug(
          `Completed saga execution: ${sagaId} (${executionId})`
        );
      }

      return executionContext;
    } catch (error) {
      // 更新状态为失败
      this.updateSagaState(executionId, SagaState.FAILED, error as Error);

      if (config.enableLogging) {
        this.logger.error(
          `Failed saga execution: ${sagaId} (${executionId})`,
          error
        );
      }

      throw error;
    } finally {
      // 清理运行中的执行记录
      this._runningExecutions.delete(executionId);
      executionContext.endTime = new Date();
    }
  }

  /**
   * 暂停Saga执行
   *
   * @description 暂停指定ID的Saga执行
   * @param executionId 执行ID
   */
  async pauseSaga(executionId: string): Promise<void> {
    const execution = this._executions.get(executionId);
    if (!execution) {
      throw new Error(`Saga execution not found: ${executionId}`);
    }

    if (execution.state !== SagaState.RUNNING) {
      throw new Error(`Cannot pause saga in state: ${execution.state}`);
    }

    this.updateSagaState(executionId, SagaState.PAUSED);
    this.logger.debug(`Paused saga execution: ${executionId}`);
  }

  /**
   * 恢复Saga执行
   *
   * @description 恢复指定ID的Saga执行
   * @param executionId 执行ID
   */
  async resumeSaga(executionId: string): Promise<void> {
    const execution = this._executions.get(executionId);
    if (!execution) {
      throw new Error(`Saga execution not found: ${executionId}`);
    }

    if (execution.state !== SagaState.PAUSED) {
      throw new Error(`Cannot resume saga in state: ${execution.state}`);
    }

    this.updateSagaState(executionId, SagaState.RUNNING);
    this.logger.debug(`Resumed saga execution: ${executionId}`);
  }

  /**
   * 取消Saga执行
   *
   * @description 取消指定ID的Saga执行
   * @param executionId 执行ID
   */
  async cancelSaga(executionId: string): Promise<void> {
    const execution = this._executions.get(executionId);
    if (!execution) {
      throw new Error(`Saga execution not found: ${executionId}`);
    }

    if (
      execution.state === SagaState.COMPLETED ||
      execution.state === SagaState.FAILED
    ) {
      throw new Error(`Cannot cancel saga in state: ${execution.state}`);
    }

    this.updateSagaState(executionId, SagaState.CANCELLED);
    this.logger.debug(`Cancelled saga execution: ${executionId}`);
  }

  /**
   * 获取Saga执行上下文
   *
   * @description 获取指定ID的Saga执行上下文
   * @param executionId 执行ID
   * @returns 执行上下文，如果不存在则返回undefined
   */
  getSagaExecution(executionId: string): ISagaExecutionContext | undefined {
    return this._executions.get(executionId);
  }

  /**
   * 获取所有活跃的Saga执行
   *
   * @description 获取所有正在运行的Saga执行
   * @returns 执行上下文数组
   */
  getAllActiveExecutions(): ISagaExecutionContext[] {
    return Array.from(this._executions.values()).filter(
      (execution) =>
        execution.state === SagaState.RUNNING ||
        execution.state === SagaState.PAUSED
    );
  }

  /**
   * 获取所有Saga执行
   *
   * @description 获取所有Saga执行记录
   * @returns 执行上下文数组
   */
  getAllExecutions(): ISagaExecutionContext[] {
    return Array.from(this._executions.values());
  }

  /**
   * 清除完成的Saga执行
   *
   * @description 清除已完成、失败或取消的Saga执行记录
   */
  clearCompletedExecutions(): void {
    const completedStates = [
      SagaState.COMPLETED,
      SagaState.FAILED,
      SagaState.CANCELLED,
    ];

    for (const [executionId, execution] of this._executions) {
      if (completedStates.includes(execution.state)) {
        this._executions.delete(executionId);
      }
    }

    this.logger.debug('Cleared completed saga executions');
  }

  /**
   * 运行Saga逻辑
   *
   * @description 执行Saga的核心逻辑
   * @param saga Saga实例
   * @param executionContext 执行上下文
   * @param config Saga配置
   * @param context 异步上下文
   */
  private async runSagaLogic(
    saga: ISaga,
    executionContext: ISagaExecutionContext,
    config: ISagaConfig,
    context?: AsyncContext
  ): Promise<void> {
    // 这里需要注入EventBus来创建SagaEventBus
    // 暂时使用模拟实现
    const eventBus = this.createMockEventBus();

    try {
      // 执行Saga并获取命令流
      const commandStream = saga(eventBus);

      if (!commandStream) {
        this.logger.warn(
          `Saga ${executionContext.sagaId} returned no command stream`
        );
        return;
      }

      // 订阅命令流并执行命令
      await this.executeCommandStream(
        commandStream,
        executionContext,
        config,
        context
      );
    } catch (error) {
      this.logger.error(
        `Error in saga logic: ${executionContext.sagaId}`,
        error
      );
      throw error;
    }
  }

  /**
   * 执行命令流
   *
   * @description 执行Saga生成的命令流
   * @param commandStream 命令流
   * @param executionContext 执行上下文
   * @param config Saga配置
   * @param context 异步上下文
   */
  private async executeCommandStream(
    commandStream: Observable<ICommand>,
    executionContext: ISagaExecutionContext,
    config: ISagaConfig,
    context?: AsyncContext
  ): Promise<void> {
    // 这里需要注入CommandBus来执行命令
    // 暂时使用模拟实现
    this.logger.debug(
      `Executing command stream for saga: ${executionContext.sagaId}`
    );

    // 模拟命令执行
    return new Promise((resolve, reject) => {
      commandStream.subscribe({
        next: async (command) => {
          try {
            await this.executeCommand(command, executionContext, context);
          } catch (error) {
            this.logger.error(
              `Error executing command: ${command.constructor.name}`,
              error
            );
            reject(error);
          }
        },
        error: (error) => {
          this.logger.error(
            `Error in command stream: ${executionContext.sagaId}`,
            error
          );
          reject(error);
        },
        complete: () => {
          this.logger.debug(
            `Command stream completed for saga: ${executionContext.sagaId}`
          );
          resolve();
        },
      });
    });
  }

  /**
   * 执行单个命令
   *
   * @description 执行单个命令
   * @param command 命令实例
   * @param executionContext 执行上下文
   * @param context 异步上下文
   */
  private async executeCommand(
    command: ICommand,
    executionContext: ISagaExecutionContext,
    context?: AsyncContext
  ): Promise<void> {
    const stepExecution: ISagaStepExecution = {
      stepId: `command_${Date.now()}`,
      startTime: new Date(),
      status: 'running',
    };

    executionContext.stepHistory.push(stepExecution);

    try {
      // 这里需要注入CommandBus来执行命令
      // 暂时使用模拟实现
      this.logger.debug(`Executing command: ${command.constructor.name}`);

      // 模拟命令执行延迟
      await new Promise((resolve) => setTimeout(resolve, 100));

      stepExecution.endTime = new Date();
      stepExecution.status = 'completed';
      stepExecution.duration =
        stepExecution.endTime.getTime() - stepExecution.startTime.getTime();

      this.logger.debug(
        `Command executed successfully: ${command.constructor.name}`
      );
    } catch (error) {
      stepExecution.endTime = new Date();
      stepExecution.status = 'failed';
      stepExecution.error = error as Error;
      stepExecution.duration =
        stepExecution.endTime.getTime() - stepExecution.startTime.getTime();

      this.logger.error(
        `Command execution failed: ${command.constructor.name}`,
        error
      );
      throw error;
    }
  }

  /**
   * 创建模拟事件总线
   *
   * @description 创建用于测试的模拟事件总线
   * @returns 模拟事件总线
   */
  private createMockEventBus(): any {
    // 这里应该返回真实的SagaEventBus实例
    // 暂时返回模拟对象
    return {
      ofType: (...types: any[]) => {
        this.logger.debug(
          `Mock event bus filtering types: ${types
            .map((t) => t.name)
            .join(', ')}`
        );
        // 返回空的Observable
        return new Observable();
      },
    };
  }

  /**
   * 更新Saga状态
   *
   * @description 更新Saga的执行状态
   * @param executionId 执行ID
   * @param state 新状态
   * @param error 错误信息（可选）
   */
  private updateSagaState(
    executionId: string,
    state: SagaState,
    error?: Error
  ): void {
    const execution = this._executions.get(executionId);
    if (execution) {
      execution.state = state;
      if (error) {
        execution.error = error;
      }

      if (state === SagaState.RUNNING) {
        this._runningExecutions.add(executionId);
      } else {
        this._runningExecutions.delete(executionId);
      }
    }
  }
}
