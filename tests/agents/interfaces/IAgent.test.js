const IAgent = require('../../../src/agents/interfaces/IAgent');

describe('IAgent Interface', () => {
  let agent;

  beforeEach(() => {
    // Create a concrete implementation for testing
    agent = new IAgent();
  });

  describe('getName()', () => {
    it('should throw error when not implemented', () => {
      expect(() => agent.getName()).toThrow('getName() method must be implemented');
    });
  });

  describe('getVersion()', () => {
    it('should throw error when not implemented', () => {
      expect(() => agent.getVersion()).toThrow('getVersion() method must be implemented');
    });
  });

  describe('getConfig()', () => {
    it('should throw error when not implemented', () => {
      expect(() => agent.getConfig()).toThrow('getConfig() method must be implemented');
    });
  });

  describe('getDependencies()', () => {
    it('should throw error when not implemented', () => {
      expect(() => agent.getDependencies()).toThrow('getDependencies() method must be implemented');
    });
  });

  describe('execute()', () => {
    it('should throw error when not implemented', async () => {
      await expect(agent.execute({}, {})).rejects.toThrow('execute() method must be implemented');
    });
  });

  describe('validateInput()', () => {
    it('should throw error when not implemented', () => {
      expect(() => agent.validateInput({})).toThrow('validateInput() method must be implemented');
    });
  });

  describe('getTimeout()', () => {
    it('should throw error when not implemented', () => {
      expect(() => agent.getTimeout()).toThrow('getTimeout() method must be implemented');
    });
  });

  describe('getRetryConfig()', () => {
    it('should throw error when not implemented', () => {
      expect(() => agent.getRetryConfig()).toThrow('getRetryConfig() method must be implemented');
    });
  });

  describe('isHealthy()', () => {
    it('should throw error when not implemented', async () => {
      await expect(agent.isHealthy()).rejects.toThrow('isHealthy() method must be implemented');
    });
  });

  describe('cleanup()', () => {
    it('should throw error when not implemented', async () => {
      await expect(agent.cleanup()).rejects.toThrow('cleanup() method must be implemented');
    });
  });
});
