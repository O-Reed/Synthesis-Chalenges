const IAgent = require('./interfaces/IAgent');
const { v4: uuidv4 } = require('uuid');

/**
 * BaseAgent - Abstract base class for all agents
 * Provides common functionality and enforces the IAgent contract
 * Implements the Template Method pattern for consistent agent behavior
 */
class BaseAgent extends IAgent {
  constructor(config = {}) {
    super();
    
    // Generate unique instance ID
    this.instanceId = uuidv4();
    
    // Set default configuration
    this.config = {
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      enableLogging: config.enableLogging !== false,
      ...config
    };

    // Execution state
    this.isExecuting = false;
    this.executionCount = 0;
    this.lastExecutionTime = null;
    this.errorCount = 0;

    // Initialize the agent
    this.initialize();
  }

  /**
   * Initialize the agent - called in constructor
   * Override this method for custom initialization
   */
  initialize() {
    // Default implementation - override in subclasses
  }

  /**
   * Get the agent's unique identifier
   * @returns {string} Agent name/ID
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * Get the agent's version
   * @returns {string} Agent version
   */
  getVersion() {
    return this.config.version || '1.0.0';
  }

  /**
   * Get the agent's configuration
   * @returns {Object} Agent configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get the agent's dependencies
   * @returns {Array<string>} Array of dependency names
   */
  getDependencies() {
    return this.config.dependencies || [];
  }

  /**
   * Get the agent's execution timeout
   * @returns {number} Timeout in milliseconds
   */
  getTimeout() {
    return this.config.timeout;
  }

  /**
   * Get the agent's retry configuration
   * @returns {Object} Retry configuration
   */
  getRetryConfig() {
    return {
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay
    };
  }

  /**
   * Check if the agent is healthy and ready to execute
   * @returns {Promise<boolean>} True if agent is healthy
   */
  async isHealthy() {
    try {
      // Default health check - override in subclasses
      return !this.isExecuting && this.errorCount < 10;
    } catch (error) {
      this.logError('Health check failed', error);
      return false;
    }
  }

  /**
   * Cleanup resources when agent is destroyed
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      this.isExecuting = false;
      // Default cleanup - override in subclasses
    } catch (error) {
      this.logError('Cleanup failed', error);
    }
  }

  /**
   * Main execution method with error handling and retry logic
   * @param {Object} input - Input data for the agent
   * @param {Object} context - Execution context and metadata
   * @returns {Promise<Object>} Execution result
   */
  async execute(input, context = {}) {
    const executionId = context.executionId || uuidv4();
    const startTime = Date.now();

    try {
      // Validate input
      if (!this.validateInput(input)) {
        throw new Error('Invalid input data');
      }

      // Check if agent is healthy
      if (!(await this.isHealthy())) {
        throw new Error('Agent is not healthy');
      }

      // Set execution state
      this.isExecuting = true;
      this.executionCount++;

      // Log execution start
      this.logInfo('Execution started', { executionId, input });

      // Execute with timeout
      const result = await this.executeWithTimeout(
        this.executeInternal(input, context),
        this.getTimeout()
      );

      // Update execution state
      this.lastExecutionTime = Date.now();
      this.isExecuting = false;

      // Log successful execution
      this.logInfo('Execution completed', { 
        executionId, 
        executionTime: Date.now() - startTime,
        result 
      });

      return {
        success: true,
        result,
        executionId,
        executionTime: Date.now() - startTime,
        agentName: this.getName(),
        agentVersion: this.getVersion()
      };

    } catch (error) {
      // Handle execution errors
      this.errorCount++;
      this.isExecuting = false;

      // Log error
      this.logError('Execution failed', { executionId, error: error.message });

      // Return error result
      return {
        success: false,
        error: error.message,
        executionId,
        executionTime: Date.now() - startTime,
        agentName: this.getName(),
        agentVersion: this.getVersion()
      };
    }
  }

  /**
   * Internal execution method - override in subclasses
   * @param {Object} input - Input data
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async executeInternal(input, context) {
    throw new Error('executeInternal() method must be implemented in subclasses');
  }

  /**
   * Execute with timeout wrapper
   * @param {Promise} promise - Promise to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Execution result
   */
  async executeWithTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      )
    ]);
  }

  /**
   * Validate input data - override in subclasses
   * @param {Object} input - Input data to validate
   * @returns {boolean} True if input is valid
   */
  validateInput(input) {
    // Default validation - override in subclasses
    return input !== null && input !== undefined;
  }

  /**
   * Log information message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  logInfo(message, data = {}) {
    if (this.config.enableLogging) {
      console.log(`[${this.getName()}] INFO: ${message}`, data);
    }
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  logError(message, data = {}) {
    if (this.config.enableLogging) {
      console.error(`[${this.getName()}] ERROR: ${message}`, data);
    }
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  logWarning(message, data = {}) {
    if (this.config.enableLogging) {
      console.warn(`[${this.getName()}] WARN: ${message}`, data);
    }
  }

  /**
   * Get agent statistics
   * @returns {Object} Agent statistics
   */
  getStats() {
    return {
      name: this.getName(),
      version: this.getVersion(),
      instanceId: this.instanceId,
      executionCount: this.executionCount,
      errorCount: this.errorCount,
      lastExecutionTime: this.lastExecutionTime,
      isExecuting: this.isExecuting,
      isHealthy: this.errorCount < 10 && !this.isExecuting
    };
  }
}

module.exports = BaseAgent;
