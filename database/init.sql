-- Multi-Agent Task Solver Database Schema
-- This script initializes the database with all necessary tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS multi_agent_solver;
USE multi_agent_solver;

-- Agents table - stores registered agents
CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    code_path VARCHAR(500) NOT NULL,
    dependencies JSON,
    config JSON,
    status ENUM('active', 'inactive', 'error') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
);

-- Execution graphs table - stores workflow definitions
CREATE TABLE IF NOT EXISTS execution_graphs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    description TEXT,
    config JSON NOT NULL,
    status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_name (name),
    INDEX idx_status (status)
);

-- Executions table - stores workflow execution history
CREATE TABLE IF NOT EXISTS executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(100) NOT NULL UNIQUE,
    graph_name VARCHAR(100) NOT NULL,
    graph_version VARCHAR(20) NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    input JSON,
    output JSON,
    error_message TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_execution_id (execution_id),
    INDEX idx_graph_name (graph_name),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Execution steps table - stores individual agent execution results
CREATE TABLE IF NOT EXISTS execution_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(100) NOT NULL,
    step_id VARCHAR(100) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed', 'skipped') DEFAULT 'pending',
    input JSON,
    output JSON,
    error_message TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    execution_time_ms INT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_execution_id (execution_id),
    INDEX idx_step_id (step_id),
    INDEX idx_agent_name (agent_name),
    INDEX idx_status (status),
    FOREIGN KEY (execution_id) REFERENCES executions(execution_id) ON DELETE CASCADE
);

-- Text statistics table - stores results from text analysis
CREATE TABLE IF NOT EXISTS text_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    lines_count INT NOT NULL,
    words_count INT NOT NULL,
    characters_count INT NOT NULL,
    processing_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_execution_id (execution_id),
    INDEX idx_url (url),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (execution_id) REFERENCES executions(execution_id) ON DELETE CASCADE
);

-- Agent metrics table - stores performance metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    execution_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    avg_execution_time_ms DECIMAL(10,2) DEFAULT 0,
    last_execution_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_agent_name (agent_name),
    INDEX idx_last_execution (last_execution_at)
);

-- System configuration table - stores application settings
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
);

-- Insert default agents
INSERT INTO agents (name, version, code_path, dependencies, config, status) VALUES
('http_fetch', '1.0.0', './src/agents/HttpFetchAgent.js', '[]', '{"timeout": 30000, "maxRetries": 3}', 'active'),
('text_stats', '1.0.0', './src/agents/TextStatsAgent.js', '[]', '{}', 'active'),
('save_mysql', '1.0.0', './src/agents/SaveMysqlAgent.js', '[]', '{}', 'active');

-- Insert default execution graph
INSERT INTO execution_graphs (name, version, description, config, status) VALUES
('default_workflow', '1.0.0', 'Basic workflow: fetch URL, analyze text, save to database', 
'{"nodes": [{"id": "fetch", "agent": "http_fetch"}, {"id": "analyze", "agent": "text_stats", "depends_on": ["fetch"]}, {"id": "save", "agent": "save_mysql", "depends_on": ["analyze"]}]}', 
'active');

-- Insert system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('max_concurrent_executions', '100', 'Maximum number of concurrent workflow executions'),
('agent_timeout', '30000', 'Default timeout for agent execution in milliseconds'),
('max_retries', '3', 'Maximum number of retries for failed agent executions'),
('result_cache_ttl', '3600', 'Time-to-live for cached results in seconds');

-- Create indexes for better performance
CREATE INDEX idx_executions_status_created ON executions(status, created_at);
CREATE INDEX idx_execution_steps_execution_status ON execution_steps(execution_id, status);
CREATE INDEX idx_text_statistics_url_created ON text_statistics(url, created_at);

-- Create views for common queries
CREATE VIEW active_agents AS
SELECT name, version, status, created_at, updated_at
FROM agents
WHERE status = 'active';

CREATE VIEW execution_summary AS
SELECT 
    e.execution_id,
    e.graph_name,
    e.status,
    e.created_at,
    e.completed_at,
    TIMESTAMPDIFF(SECOND, e.created_at, e.completed_at) as duration_seconds,
    COUNT(es.id) as total_steps,
    SUM(CASE WHEN es.status = 'completed' THEN 1 ELSE 0 END) as completed_steps,
    SUM(CASE WHEN es.status = 'failed' THEN 1 ELSE 0 END) as failed_steps
FROM executions e
LEFT JOIN execution_steps es ON e.execution_id = es.execution_id
GROUP BY e.execution_id, e.graph_name, e.status, e.created_at, e.completed_at;

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON multi_agent_solver.* TO 'agent_user'@'%';
-- FLUSH PRIVILEGES;
