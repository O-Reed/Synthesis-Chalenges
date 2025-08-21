const BaseAgent = require('./BaseAgent');

/**
 * AgentManager - Manages agent lifecycle and provides agent registry
 * Implements the Registry pattern for dynamic agent management
 */
class AgentManager {
  constructor() {
    // Agent registry - maps agent names to agent classes
    this.agentRegistry = new Map();
    
    // Agent instances - maps agent names to instances
    this.agentInstances = new Map();
    
    // Agent metadata - stores additional information about agents
    this.agentMetadata = new Map();
    
    // Default configuration
    this.defaultConfig = {
      enableLogging: true,
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000
    };
  }

  /**
   * Register an agent class
   * @param {string} name - Agent name
   * @param {Class} agentClass - Agent class (must extend BaseAgent)
   * @param {Object} metadata - Additional metadata
   * @returns {boolean} True if registration successful
   */
  registerAgent(name, agentClass, metadata = {}) {
    try {
      // Validate agent class
      if (!this.isValidAgentClass(agentClass)) {
        throw new Error(`Invalid agent class: ${name} must extend BaseAgent`);
      }

      // Check if agent already exists
      if (this.agentRegistry.has(name)) {
        throw new Error(`Agent ${name} is already registered`);
      }

      // Register the agent
      this.agentRegistry.set(name, agentClass);
      this.agentMetadata.set(name, {
        name,
        class: agentClass,
        registeredAt: new Date(),
        version: metadata.version || '1.0.0',
        dependencies: metadata.dependencies || [],
        description: metadata.description || '',
        ...metadata
      });

      console.log(`Agent registered successfully: ${name}`);
      return true;

    } catch (error) {
      console.error(`Failed to register agent ${name}:`, error.message);
      return false;
    }
  }

  /**
   * Unregister an agent
   * @param {string} name - Agent name
   * @returns {boolean} True if unregistration successful
   */
  unregisterAgent(name) {
    try {
      // Check if agent exists
      if (!this.agentRegistry.has(name)) {
        throw new Error(`Agent ${name} is not registered`);
      }

      // Cleanup agent instance if it exists
      if (this.agentInstances.has(name)) {
        const instance = this.agentInstances.get(name);
        instance.cleanup();
        this.agentInstances.delete(name);
      }

      // Remove from registry
      this.agentRegistry.delete(name);
      this.agentMetadata.delete(name);

      console.log(`Agent unregistered successfully: ${name}`);
      return true;

    } catch (error) {
      console.error(`Failed to unregister agent ${name}:`, error.message);
      return false;
    }
  }

  /**
   * Create an agent instance
   * @param {string} name - Agent name
   * @param {Object} config - Agent configuration
   * @returns {BaseAgent|null} Agent instance or null if creation failed
   */
  createAgent(name, config = {}) {
    try {
      // Check if agent is registered
      if (!this.agentRegistry.has(name)) {
        throw new Error(`Agent ${name} is not registered`);
      }

      // Get agent class
      const AgentClass = this.agentRegistry.get(name);
      
      // Merge configuration with defaults
      const finalConfig = {
        ...this.defaultConfig,
        ...config
      };

      // Create agent instance
      const agent = new AgentClass(finalConfig);

      // Store instance
      this.agentInstances.set(name, agent);

      console.log(`Agent instance created: ${name}`);
      return agent;

    } catch (error) {
      console.error(`Failed to create agent instance ${name}:`, error.message);
      return null;
    }
  }

  /**
   * Get an agent instance (creates if doesn't exist)
   * @param {string} name - Agent name
   * @param {Object} config - Agent configuration
   * @returns {BaseAgent|null} Agent instance or null if not found
   */
  getAgent(name, config = {}) {
    // Return existing instance if available
    if (this.agentInstances.has(name)) {
      return this.agentInstances.get(name);
    }

    // Create new instance
    return this.createAgent(name, config);
  }

  /**
   * Execute an agent
   * @param {string} name - Agent name
   * @param {Object} input - Input data
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async executeAgent(name, input, context = {}) {
    try {
      // Get or create agent instance
      const agent = this.getAgent(name);
      if (!agent) {
        throw new Error(`Failed to get agent instance: ${name}`);
      }

      // Execute the agent
      const result = await agent.execute(input, context);
      return result;

    } catch (error) {
      console.error(`Failed to execute agent ${name}:`, error.message);
      return {
        success: false,
        error: error.message,
        agentName: name
      };
    }
  }

  /**
   * Get all registered agent names
   * @returns {Array<string>} Array of agent names
   */
  getRegisteredAgents() {
    return Array.from(this.agentRegistry.keys());
  }

  /**
   * Get agent metadata
   * @param {string} name - Agent name
   * @returns {Object|null} Agent metadata or null if not found
   */
  getAgentMetadata(name) {
    return this.agentMetadata.get(name) || null;
  }

  /**
   * Get all agent metadata
   * @returns {Array<Object>} Array of agent metadata
   */
  getAllAgentMetadata() {
    return Array.from(this.agentMetadata.values());
  }

  /**
   * Check if agent is registered
   * @param {string} name - Agent name
   * @returns {boolean} True if agent is registered
   */
  isAgentRegistered(name) {
    return this.agentRegistry.has(name);
  }

  /**
   * Get agent instance count
   * @returns {number} Number of agent instances
   */
  getInstanceCount() {
    return this.agentInstances.size;
  }

  /**
   * Validate agent class
   * @param {Class} agentClass - Agent class to validate
   * @returns {boolean} True if valid agent class
   */
  isValidAgentClass(agentClass) {
    try {
      // Check if it's a class
      if (typeof agentClass !== 'function') {
        return false;
      }

      // Check if it extends BaseAgent
      let currentClass = agentClass;
      while (currentClass && currentClass !== BaseAgent) {
        currentClass = Object.getPrototypeOf(currentClass);
      }
      
      return currentClass === BaseAgent;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get agent statistics
   * @returns {Object} Agent manager statistics
   */
  getStats() {
    const registeredAgents = this.getRegisteredAgents();
    const instances = Array.from(this.agentInstances.values());
    
    return {
      totalRegistered: registeredAgents.length,
      totalInstances: instances.length,
      registeredAgents,
      instanceStats: instances.map(agent => agent.getStats()),
      metadata: this.getAllAgentMetadata()
    };
  }

  /**
   * Cleanup all agent instances
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      const cleanupPromises = Array.from(this.agentInstances.values())
        .map(agent => agent.cleanup());
      
      await Promise.all(cleanupPromises);
      this.agentInstances.clear();
      
      console.log('All agent instances cleaned up');
    } catch (error) {
      console.error('Failed to cleanup agent instances:', error.message);
    }
  }

  /**
   * Reload agent (unregister and re-register)
   * @param {string} name - Agent name
   * @param {Class} agentClass - New agent class
   * @param {Object} metadata - New metadata
   * @returns {boolean} True if reload successful
   */
  reloadAgent(name, agentClass, metadata = {}) {
    try {
      // Unregister existing agent
      this.unregisterAgent(name);
      
      // Register new agent
      return this.registerAgent(name, agentClass, metadata);
    } catch (error) {
      console.error(`Failed to reload agent ${name}:`, error.message);
      return false;
    }
  }
}

module.exports = AgentManager;
