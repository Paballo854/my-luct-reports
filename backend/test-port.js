const mysql = require('mysql2');

// Test both ports to confirm which one is working
const portsToTest = [3306, 3307];

const testPort = (port) => {
    const testConnection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        port: port,
        connectTimeout: 2000
    });

    return new Promise((resolve) => {
        testConnection.connect((err) => {
            if (err) {
                console.log(`Port ${port}: ❌ Connection failed - ${err.code}`);
                resolve({ port, success: false });
            } else {
                console.log(`Port ${port}: ✅ Connection successful`);
                testConnection.end();
                resolve({ port, success: true });
            }
        });
    });
};

const testAllPorts = async () => {
    console.log('Testing MySQL ports...');
    for (const port of portsToTest) {
        await testPort(port);
    }
};

testAllPorts();