const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'luct_reporting_system',
    port: process.env.DB_PORT || 3307  // Updated to 3307
});

console.log('Testing database connection on port 3307...');

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        console.log('\nTroubleshooting steps:');
        console.log('1. Make sure XAMPP MySQL is running on port 3307');
        console.log('2. Check if database "luct_reporting_system" exists');
        console.log('3. Verify MySQL credentials in .env file');
        console.log('4. Check if MySQL port 3307 is correct');
        console.log('5. In XAMPP, check MySQL config for port number');
        return;
    }
    
    console.log('Connected to MySQL database successfully on port 3307!');
    
    // Test query
    connection.query('SELECT COUNT(*) as user_count FROM users', (err, results) => {
        if (err) {
            console.error('Query test failed:', err.message);
        } else {
            console.log(`Database test successful! Found ${results[0].user_count} users in the system.`);
        }
        connection.end();
    });
});