const mysql = require('mysql2');
require('dotenv').config();

// Database configuration - REMOVED INVALID OPTIONS
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'luct_reporting_system',
    port: process.env.DB_PORT || 3307,
    charset: 'utf8mb4',
    timezone: '+00:00'
    // Removed invalid options: connectTimeout, acquireTimeout, timeout, reconnect
};

// Create connection pool with valid configuration
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    acquireTimeout: 60000, // This is valid for pool configuration
    timeout: 60000, // This is valid for pool configuration
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Convert to promise-based pool
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully on port 3307');
        
        // Test basic query
        const [result] = await connection.execute('SELECT 1 as test');
        console.log('✅ Database test query executed successfully');
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        
        // Provide detailed error information
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Please check:');
            console.error('1. Is MySQL running in XAMPP on port 3307?');
            console.error('2. Is the port 3307 correct?');
            console.error('3. Are the credentials in .env file correct?');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('Database does not exist. Please create database:', dbConfig.database);
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Please check MySQL username and password.');
        }
        
        return false;
    }
};

// Simple health check
const healthCheck = async () => {
    try {
        const [result] = await promisePool.execute('SELECT NOW() as current_time');
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                name: dbConfig.database,
                host: dbConfig.host,
                port: dbConfig.port,
                current_time: result[0].current_time
            }
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
};

// Simple query wrapper
const query = async (sql, params = []) => {
    try {
        const [results] = await promisePool.execute(sql, params);
        return { success: true, results };
    } catch (error) {
        console.error('Database query error:', error.message);
        return { 
            success: false, 
            error: error.message
        };
    }
};

// Close pool gracefully
const closePool = async () => {
    try {
        await promisePool.end();
        console.log('Database connection pool closed successfully');
    } catch (error) {
        console.error('Error closing connection pool:', error.message);
    }
};

// Event listeners for pool monitoring
pool.on('connection', (connection) => {
    console.log('New database connection established');
});

pool.on('enqueue', () => {
    console.log('Waiting for available connection slot');
});

// Handle process termination
process.on('SIGINT', async () => {
    console.log('Closing database connections...');
    await closePool();
    process.exit(0);
});

module.exports = {
    pool: promisePool,
    testConnection,
    healthCheck,
    query,
    closePool
};