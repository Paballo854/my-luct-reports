const mysql = require('mysql2');
require('dotenv').config();

// ✅ Database configuration for FreeSQLDatabase.com
const dbConfig = {
    host: process.env.DB_HOST || 'sql12.freesqldatabase.com',
    user: process.env.DB_USER || 'sql12802083',
    password: process.env.DB_PASSWORD || 'EbsbDxhYt5',
    database: process.env.DB_NAME || 'sql12802083',
    port: process.env.DB_PORT || 3306, // FreeSQLDatabase uses 3306
    charset: 'utf8mb4',
    timezone: '+00:00'
};

// ✅ Create connection pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10, // Reduced for free hosting
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// ✅ Promise-based pool
const promisePool = pool.promise();

// ✅ Test database connection with detailed error handling
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully!');
        
        // Test query
        const [result] = await connection.execute('SELECT NOW() as current_time');
        console.log('🕒 Database time:', result[0].current_time);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('🔍 Connection details:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            port: dbConfig.port
        });
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Tip: Check your password and IP whitelisting in FreeSQLDatabase control panel');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Tip: Check if the host/port is correct');
        }
        
        return false;
    }
};

// ✅ Simple query function
const query = async (sql, params = []) => {
    try {
        const [results] = await promisePool.execute(sql, params);
        return { success: true, results };
    } catch (error) {
        console.error('Database query error:', error.message);
        return { success: false, error: error.message };
    }
};

// ✅ Export functions
module.exports = {
    pool: promisePool,
    testConnection,
    query
};