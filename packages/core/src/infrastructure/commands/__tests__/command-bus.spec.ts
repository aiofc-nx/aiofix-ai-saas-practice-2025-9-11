/// <reference types="jest" />
import { CommandBus } from '../command-bus';
import { ICommandHandler, BaseCommand } from '../../../application/commands';
import { ResultType, Result } from '../../../shared/types/common';
import { EntityId } from '../../../domain/value-objects/entity-id';

/**
 * 测试用的命令
 */
class TestCommand extends BaseCommand {
  constructor(public readonly data: string, id?: EntityId) {
    super(id || EntityId.generate());
  }
}

/**
 * 测试用的命令处理器
 */
class TestCommandHandler implements ICommandHandler<TestCommand, string> {
  public handledCommands: TestCommand[] = [];
  public shouldThrowError = false;
  public shouldReturnFailure = false;

  async handle(command: TestCommand): Promise<ResultType<string>> {
    if (this.shouldThrowError) {
      throw new Error('Handler error');
    }

    if (this.shouldReturnFailure) {
      return Result.failure(new Error('Command failed'));
    }

    this.handledCommands.push(command);
    return Result.success(`Processed: ${command.data}`);
  }

  getCommandType(): new (...args: any[]) => TestCommand {
    return TestCommand;
  }
}

describe('CommandBus', () => {
  let commandBus: CommandBus;

  beforeEach(() => {
    commandBus = new CommandBus();
  });

  describe('register', () => {
    it('应该注册命令处理器', () => {
      const handler = new TestCommandHandler();
      commandBus.register(TestCommand, handler);

      expect(commandBus.isRegistered(TestCommand)).toBe(true);
    });

    it('应该防止重复注册', () => {
      const handler1 = new TestCommandHandler();
      const handler2 = new TestCommandHandler();

      commandBus.register(TestCommand, handler1);

      expect(() => commandBus.register(TestCommand, handler2)).toThrow(
        'Handler for command type TestCommand is already registered'
      );
    });
  });

  describe('unregister', () => {
    it('应该注销命令处理器', () => {
      const handler = new TestCommandHandler();
      commandBus.register(TestCommand, handler);

      expect(commandBus.isRegistered(TestCommand)).toBe(true);

      commandBus.unregister(TestCommand);

      expect(commandBus.isRegistered(TestCommand)).toBe(false);
    });
  });

  describe('execute', () => {
    it('应该执行命令并返回成功结果', async () => {
      const handler = new TestCommandHandler();
      commandBus.register(TestCommand, handler);

      const command = new TestCommand('test data');
      const result = await commandBus.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('Processed: test data');
      expect(handler.handledCommands).toHaveLength(1);
      expect(handler.handledCommands[0]).toBe(command);
    });

    it('应该处理命令执行失败', async () => {
      const handler = new TestCommandHandler();
      handler.shouldReturnFailure = true;
      commandBus.register(TestCommand, handler);

      const command = new TestCommand('test data');
      const result = await commandBus.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Command failed');
    });

    it('应该处理处理器异常', async () => {
      const handler = new TestCommandHandler();
      handler.shouldThrowError = true;
      commandBus.register(TestCommand, handler);

      const command = new TestCommand('test data');
      const result = await commandBus.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Handler error');
    });

    it('应该在没有处理器时返回错误', async () => {
      const command = new TestCommand('test data');
      const result = await commandBus.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe(
        'No handler registered for command type: TestCommand'
      );
    });
  });

  describe('executeBatch', () => {
    it('应该并行执行命令', async () => {
      const handler = new TestCommandHandler();
      commandBus.register(TestCommand, handler);

      const commands = [
        new TestCommand('data1'),
        new TestCommand('data2'),
        new TestCommand('data3'),
      ];

      const results = await commandBus.executeBatch(commands, {
        parallel: true,
      });

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.isSuccess).toBe(true);
      });
      expect(handler.handledCommands).toHaveLength(3);
    });

    it('应该串行执行命令', async () => {
      const handler = new TestCommandHandler();
      commandBus.register(TestCommand, handler);

      const commands = [
        new TestCommand('data1'),
        new TestCommand('data2'),
        new TestCommand('data3'),
      ];

      const results = await commandBus.executeBatch(commands, {
        parallel: false,
      });

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.isSuccess).toBe(true);
      });
      expect(handler.handledCommands).toHaveLength(3);
    });

    it('应该在事务模式下遇到失败时停止执行', async () => {
      const handler = new TestCommandHandler();
      commandBus.register(TestCommand, handler);

      const commands = [
        new TestCommand('data1'),
        new TestCommand('data2'),
        new TestCommand('data3'),
      ];

      // 设置第二个命令失败
      const originalHandle = handler.handle.bind(handler);
      handler.handle = async (command: TestCommand) => {
        if (command.data === 'data2') {
          return Promise.resolve(Result.failure(new Error('Command 2 failed')));
        }
        return originalHandle(command);
      };

      const results = await commandBus.executeBatch(commands, {
        parallel: false,
        transaction: true,
      });

      expect(results).toHaveLength(2); // 只执行了两个命令
      expect(results[0].isSuccess).toBe(true);
      expect(results[1].isSuccess).toBe(false);
    });
  });

  describe('统计信息', () => {
    it('应该跟踪处理统计信息', async () => {
      const handler = new TestCommandHandler();
      commandBus.register(TestCommand, handler);

      const command = new TestCommand('test data');
      await commandBus.execute(command);

      const stats = commandBus.getProcessingStats();
      expect(stats['TestCommand']).toBeDefined();
      expect(stats['TestCommand'].successCount).toBe(1);
      expect(stats['TestCommand'].failureCount).toBe(0);
    });

    it('应该清除统计信息', async () => {
      const handler = new TestCommandHandler();
      commandBus.register(TestCommand, handler);

      const command = new TestCommand('test data');
      await commandBus.execute(command);

      commandBus.clearStats();

      const stats = commandBus.getProcessingStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });

  describe('工具方法', () => {
    it('应该获取注册的命令类型', () => {
      const handler = new TestCommandHandler();
      commandBus.register(TestCommand, handler);

      const commandTypes = commandBus.getRegisteredCommandTypes();
      expect(commandTypes).toContain('TestCommand');
    });
  });
});
