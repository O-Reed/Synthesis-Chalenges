/**
 * IAgent Interface
 * Defines the contract that all agents must implement
 * This ensures consistency and enables dynamic agent creation
 */
class IAgent {
  /**
   * Get the agent's unique identifier
   * @returns {string} Agent name/ID
   */
  getName() {
    throw new Error('getName() method must be implemented');
  }

  /**
   * Get the agent's version
   * @returns {string} Agent version
   */
  getVersion() {
    throw new Error('getVersion() method must be implemented');
  }

  /**
   * Get the agent's configuration
   * @returns {Object} Agent configuration
   */
  getConfig() {
    throw new Error('getConfig() method must be implemented');
  }

  /**
   * Get the agent's dependencies
   * @returns {Array<string>} Array of dependency names
   */
  getDependencies() {
    throw new Error('getDependencies() method must be implemented');
  }

  /**
   * Execute the agent's main logic
   * @param {Object} input - Input data for the agent
   * @param {Object} context - Execution context and metadata
   * @returns {Promise<Object>} Execution result
   */
  async execute(input, context) {
    throw new Error('execute() method must be implemented');
  }

  /**
   * Validate input data
   * @param {Object} input - Input data to validate
   * @returns {boolean} True if input is valid
   */
  validateInput(input) {
    throw new Error('validateInput() method must be implemented');
  }

  /**
   * Get the agent's execution timeout
   * @returns {number} Timeout in milliseconds
   */
  getTimeout() {
    throw new Error('getTimeout() method must be implemented');
  }

  /**
   * Get the agent's retry configuration
   * @returns {Object} Retry configuration
   */
  getRetryConfig() {
    throw new Error('getRetryConfig() method must be implemented');
  }

  /**
   * Check if the agent is healthy and ready to execute
   * @returns {Promise<boolean>} True if agent is healthy
   */
  async isHealthy() {
    throw new Error('isHealthy() method must be implemented');
  }

  /**
   * Cleanup resources when agent is destroyed
   * @returns {Promise<void>}
   */
  async cleanup() {
    throw new Error('cleanup() method must be implemented');
  }
}

module.exports = IAgent;
