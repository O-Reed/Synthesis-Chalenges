import mysql from "mysql2/promise";

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

export const pool = mysql.createPool({
  host: DB_HOST || "localhost",
  port: Number(DB_PORT || 3306),
  user: DB_USER || "app",
  password: DB_PASS || "apppass",
  database: DB_NAME || "agentdb",
  connectionLimit: 10
});

export async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Starting database migration...');
    
    // Drop existing tables in correct order (respecting foreign keys)
    console.log('Dropping existing tables...');
    await conn.query(`DROP TABLE IF EXISTS stats_results`);
    await conn.query(`DROP TABLE IF EXISTS run_nodes`);
    await conn.query(`DROP TABLE IF EXISTS runs`);
    
    // Create tables with complete and correct schema
    console.log('Creating runs table...');
    await conn.query(`
      CREATE TABLE runs (
        id            BIGINT PRIMARY KEY AUTO_INCREMENT,
        url           TEXT NOT NULL,
        status        ENUM('PENDING','RUNNING','SUCCEEDED','FAILED') NOT NULL DEFAULT 'PENDING',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Creating run_nodes table...');
    await conn.query(`
      CREATE TABLE run_nodes (
        id            BIGINT PRIMARY KEY AUTO_INCREMENT,
        run_id        BIGINT NOT NULL,
        node_id       VARCHAR(64) NOT NULL,
        status        ENUM('PENDING','RUNNING','SUCCEEDED','FAILED','TIMEOUT') NOT NULL DEFAULT 'PENDING',
        attempt       INT NOT NULL DEFAULT 0,
        output_json   JSON NULL,
        error_msg     TEXT NULL,
        started_at    TIMESTAMP NULL,
        finished_at   TIMESTAMP NULL,
        INDEX(run_id),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Creating stats_results table...');
    await conn.query(`
      CREATE TABLE stats_results (
        id            BIGINT PRIMARY KEY AUTO_INCREMENT,
        run_id        BIGINT NOT NULL,
        url           TEXT NOT NULL,
        line_count    INT NOT NULL,
        word_count    INT NOT NULL,
        char_count    INT NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(run_id),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Database migration completed successfully');
    
    // Verify tables were created correctly
    const [tables] = await conn.query('SHOW TABLES');
    console.log('Created tables:', tables);
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    conn.release();
  }
}
