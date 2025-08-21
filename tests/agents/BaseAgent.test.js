const BaseAgent = require('../../src/agents/BaseAgent');

// Create a concrete test agent that extends BaseAgent
class TestAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
  }

  async executeInternal(input, context) {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 10));
    return { processed: input, context };
  }

  validateInput(input) {
    return input && typeof input === 'object';
  }
}

describe('BaseAgent', () => {
  let agent;

  beforeEach(() => {
    agent = new TestAgent();
  });

  afterEach(async () => {
    await agent.cleanup();
  });

  describe('Constructor and Initialization', () => {
    it('should create agent with default configuration', () => {
      expect(agent.config.timeout).toBe(30000);
      expect(agent.config.maxRetries).toBe(3);
      expect(agent.config.retryDelay).toBe(1000);
      expect(agent.config.enableLogging).toBe(true);
    });

    it('should create agent with custom configuration', () => {
      const customAgent = new TestAgent({
        timeout: 60000,
        maxRetries: 5,
        enableLogging: false
      });

      expect(customAgent.config.timeout).toBe(60000);
      expect(customAgent.config.maxRetries).toBe(5);
      expect(customAgent.config.enableLogging).toBe(false);
    });

    it('should generate unique instance ID', () => {
      const agent1 = new TestAgent();
      const agent2 = new TestAgent();
      
      expect(agent1.instanceId).toBeDefined();
      expect(agent2.instanceId).toBeDefined();
      expect(agent1.instanceId).not.toBe(agent2.instanceId);
    });
  });

  describe('Interface Methods', () => {
    it('should return correct name', () => {
      expect(agent.getName()).toBe('TestAgent');
    });

    it('should return correct version', () => {
      expect(agent.getVersion()).toBe('1.0.0');
    });

    it('should return configuration', () => {
      const config = agent.getConfig();
      expect(config.timeout).toBe(30000);
      expect(config.maxRetries).toBe(3);
    });

    it('should return dependencies', () => {
      expect(agent.getDependencies()).toEqual([]);
    });

    it('should return timeout', () => {
      expect(agent.getTimeout()).toBe(30000);
    });

    it('should return retry configuration', () => {
      const retryConfig = agent.getRetryConfig();
      expect(retryConfig.maxRetries).toBe(3);
      expect(retryConfig.retryDelay).toBe(1000);
    });
  });

  describe('Health and State', () => {
    it('should be healthy initially', async () => {
      expect(await agent.isHealthy()).toBe(true);
    });

    it('should not be healthy when executing', async () => {
      agent.isExecuting = true;
      expect(await agent.isHealthy()).toBe(false);
    });

    it('should not be healthy after too many errors', async () => {
      agent.errorCount = 10;
      expect(await agent.isHealthy()).toBe(false);
    });
  });

  describe('Execution', () => {
    it('should execute successfully with valid input', async () => {
      const input = { test: 'data' };
      const context = { executionId: 'test-123' };

      const result = await agent.execute(input, context);

      expect(result.success).toBe(true);
      expect(result.result.processed).toEqual(input);
      expect(result.executionId).toBe('test-123');
      expect(result.agentName).toBe('TestAgent');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should fail with invalid input', async () => {
      const result = await agent.execute(null, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input data');
    });

    it('should handle execution timeout', async () => {
      // Create agent with very short timeout
      const fastAgent = new TestAgent({ timeout: 1 });
      
      const result = await fastAgent.execute({}, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Execution timeout');
    });

    it('should track execution statistics', async () => {
      expect(agent.executionCount).toBe(0);
      
      await agent.execute({ test: 'data' }, {});
      
      expect(agent.executionCount).toBe(1);
      expect(agent.lastExecutionTime).toBeDefined();
    });
  });

  describe('Logging', () => {
    it('should log info messages when logging is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      agent.logInfo('Test message', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith('[TestAgent] INFO: Test message', { data: 'test' });
      consoleSpy.mockRestore();
    });

    it('should not log when logging is disabled', () => {
      const silentAgent = new TestAgent({ enableLogging: false });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      silentAgent.logInfo('Test message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Statistics', () => {
    it('should return comprehensive statistics', async () => {
      await agent.execute({ test: 'data' }, {});
      
      const stats = agent.getStats();
      
      expect(stats.name).toBe('TestAgent');
      expect(stats.version).toBe('1.0.0');
      expect(stats.instanceId).toBeDefined();
      expect(stats.executionCount).toBe(1);
      expect(stats.errorCount).toBe(0);
      expect(stats.lastExecutionTime).toBeDefined();
      expect(stats.isExecuting).toBe(false);
      expect(typeof stats.isHealthy).toBe('boolean');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      agent.isExecuting = true;
      
      await agent.cleanup();
      
      expect(agent.isExecuting).toBe(false);
    });
  });
});
