const AgentManager = require('../../src/agents/AgentManager');
const BaseAgent = require('../../src/agents/BaseAgent');

// Create test agents for testing
class TestAgent1 extends BaseAgent {
  async executeInternal(input, context) {
    return { agent: 'TestAgent1', input, context };
  }

  validateInput(input) {
    return input && input.test;
  }
}

class TestAgent2 extends BaseAgent {
  async executeInternal(input, context) {
    return { agent: 'TestAgent2', input, context };
  }

  validateInput(input) {
    return input && input.test;
  }
}

// Invalid agent that doesn't extend BaseAgent
class InvalidAgent {
  execute() {
    return 'invalid';
  }
}

describe('AgentManager', () => {
  let manager;

  beforeEach(() => {
    manager = new AgentManager();
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  describe('Agent Registration', () => {
    it('should register valid agent classes', () => {
      const result = manager.registerAgent('test1', TestAgent1, {
        version: '1.0.0',
        description: 'Test agent 1'
      });

      expect(result).toBe(true);
      expect(manager.isAgentRegistered('test1')).toBe(true);
      expect(manager.getRegisteredAgents()).toContain('test1');
    });

    it('should reject invalid agent classes', () => {
      const result = manager.registerAgent('invalid', InvalidAgent);

      expect(result).toBe(false);
      expect(manager.isAgentRegistered('invalid')).toBe(false);
    });

    it('should prevent duplicate agent registration', () => {
      manager.registerAgent('test1', TestAgent1);
      
      const result = manager.registerAgent('test1', TestAgent1);
      
      expect(result).toBe(false);
    });

    it('should store agent metadata', () => {
      manager.registerAgent('test1', TestAgent1, {
        version: '2.0.0',
        dependencies: ['dep1', 'dep2'],
        description: 'Test description'
      });

      const metadata = manager.getAgentMetadata('test1');
      
      expect(metadata.name).toBe('test1');
      expect(metadata.version).toBe('2.0.0');
      expect(metadata.dependencies).toEqual(['dep1', 'dep2']);
      expect(metadata.description).toBe('Test description');
      expect(metadata.registeredAt).toBeInstanceOf(Date);
    });
  });

  describe('Agent Unregistration', () => {
    it('should unregister agents successfully', () => {
      manager.registerAgent('test1', TestAgent1);
      expect(manager.isAgentRegistered('test1')).toBe(true);

      const result = manager.unregisterAgent('test1');
      
      expect(result).toBe(true);
      expect(manager.isAgentRegistered('test1')).toBe(false);
    });

    it('should handle unregistering non-existent agents', () => {
      const result = manager.unregisterAgent('nonexistent');
      
      expect(result).toBe(false);
    });

    it('should cleanup agent instances when unregistering', () => {
      manager.registerAgent('test1', TestAgent1);
      manager.createAgent('test1');
      
      expect(manager.getInstanceCount()).toBe(1);
      
      manager.unregisterAgent('test1');
      
      expect(manager.getInstanceCount()).toBe(0);
    });
  });

  describe('Agent Creation', () => {
    it('should create agent instances', () => {
      manager.registerAgent('test1', TestAgent1);
      
      const agent = manager.createAgent('test1');
      
      expect(agent).toBeInstanceOf(TestAgent1);
      expect(manager.getInstanceCount()).toBe(1);
    });

    it('should return null for non-existent agents', () => {
      const agent = manager.createAgent('nonexistent');
      
      expect(agent).toBeNull();
    });

    it('should merge configuration with defaults', () => {
      manager.registerAgent('test1', TestAgent1);
      
      const agent = manager.createAgent('test1', {
        timeout: 60000,
        enableLogging: false
      });
      
      expect(agent.config.timeout).toBe(60000);
      expect(agent.config.enableLogging).toBe(false);
      expect(agent.config.maxRetries).toBe(3); // default value
    });
  });

  describe('Agent Retrieval', () => {
    it('should return existing instances', () => {
      manager.registerAgent('test1', TestAgent1);
      const createdAgent = manager.createAgent('test1');
      
      const retrievedAgent = manager.getAgent('test1');
      
      expect(retrievedAgent).toBe(createdAgent);
    });

    it('should create new instances if none exist', () => {
      manager.registerAgent('test1', TestAgent1);
      
      const agent = manager.getAgent('test1');
      
      expect(agent).toBeInstanceOf(TestAgent1);
      expect(manager.getInstanceCount()).toBe(1);
    });
  });

  describe('Agent Execution', () => {
    it('should execute agents successfully', async () => {
      manager.registerAgent('test1', TestAgent1);
      
      const result = await manager.executeAgent('test1', { test: true }, { execId: '123' });
      
      expect(result.success).toBe(true);
      expect(result.result.agent).toBe('TestAgent1');
      expect(result.result.input).toEqual({ test: true });
      expect(result.result.context).toEqual({ execId: '123' });
    });

    it('should handle execution failures', async () => {
      manager.registerAgent('test1', TestAgent1);
      
      const result = await manager.executeAgent('test1', { invalid: true }, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input data');
    });

    it('should return error for non-existent agents', async () => {
      const result = await manager.executeAgent('nonexistent', {}, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get agent instance');
    });
  });

  describe('Agent Reloading', () => {
    it('should reload agents successfully', () => {
      manager.registerAgent('test1', TestAgent1);
      
      const result = manager.reloadAgent('test1', TestAgent2, {
        version: '2.0.0',
        description: 'Updated agent'
      });
      
      expect(result).toBe(true);
      expect(manager.isAgentRegistered('test1')).toBe(true);
      
      const metadata = manager.getAgentMetadata('test1');
      expect(metadata.description).toBe('Updated agent');
    });

    it('should handle reload failures', () => {
      // Reloading a non-existent agent should succeed (it's like registering a new one)
      const result = manager.reloadAgent('nonexistent', TestAgent1);
      
      expect(result).toBe(true);
      expect(manager.isAgentRegistered('nonexistent')).toBe(true);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide comprehensive statistics', () => {
      manager.registerAgent('test1', TestAgent1);
      manager.registerAgent('test2', TestAgent2);
      
      const stats = manager.getStats();
      
      expect(stats.totalRegistered).toBe(2);
      expect(stats.totalInstances).toBe(0);
      expect(stats.registeredAgents).toContain('test1');
      expect(stats.registeredAgents).toContain('test2');
      expect(stats.metadata).toHaveLength(2);
    });

    it('should track instance count', () => {
      expect(manager.getInstanceCount()).toBe(0);
      
      manager.registerAgent('test1', TestAgent1);
      manager.createAgent('test1');
      
      expect(manager.getInstanceCount()).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all agent instances', async () => {
      manager.registerAgent('test1', TestAgent1);
      manager.registerAgent('test2', TestAgent2);
      
      manager.createAgent('test1');
      manager.createAgent('test2');
      
      expect(manager.getInstanceCount()).toBe(2);
      
      await manager.cleanup();
      
      expect(manager.getInstanceCount()).toBe(0);
    });
  });
});
