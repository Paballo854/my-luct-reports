const mysql = require('mysql2');
require('dotenv').config();

// Database configuration for FreeSQLDatabase.com
const dbConfig = {
    host: process.env.DB_HOST || 'sql12.freesqldatabase.com',
    user: process.env.DB_USER || 'sql12802083',
    password: process.env.DB_PASSWORD || 'YOUR_DATABASE_PASSWORD_HERE',
    database: process.env.DB_NAME || 'sql12802083',
    port: process.env.DB_PORT || 3306, // remote MySQL usually uses 3306
    charset: 'utf8mb4',
    timezone: '+00:00'
};

// Create a connection pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Convert to a promise-based pool
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Connected to FreeSQLDatabase successfully!');
        const [rows] = await connection.query('SELECT NOW() AS current_time');
        console.log('🕒 Database time:', rows[0].current_time);
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('→ Invalid username or password.');
        } else if (err.code === 'ENOTFOUND') {
            console.error('→ Hostname not reachable. Check DB_HOST.');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('→ Connection refused. Remote host may block your IP.');
        }
    }
};

// Simple query function
const query = async (sql, params = []) => {
    try {
        const [results] = await promisePool.execute(sql, params);
        return { success: true, results };
    } catch (error) {
        console.error('Database query error:', error.message);
        return { success: false, error: error.message };
    }
};

// Health check endpoint helper
const healthCheck = async () => {
    try {
        const [rows] = await promisePool.query('SELECT NOW() AS current_time');
        return { status: 'healthy', time: rows[0].current_time };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
};

// Gracefully close pool
const closePool = async () => {
    try {
        await promisePool.end();
        console.log('🛑 Database pool closed.');
    } catch (err) {
        console.error('Error closing pool:', err.message);
    }
};

// Export
module.exports = {
    pool: promisePool,
    testConnection,
    query,
    healthCheck,
    closePool
};
