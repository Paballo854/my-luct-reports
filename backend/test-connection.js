const db = require('./database/db.js');

async function test() {
    console.log('🧪 Testing database connection...');
    const result = await db.testConnection();
    
    if (result) {
        console.log('🎉 SUCCESS: Database connection working!');
    } else {
        console.log('❌ FAILED: Could not connect to database');
    }
    
    process.exit();
}

test();