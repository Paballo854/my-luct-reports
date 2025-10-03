const { pool } = require('./config/database');

async function testFeedback() {
  try {
    console.log('🔍 Testing feedback functionality...');
    
    // Test 1: Check if lecture_reports table exists and has prl_feedback column
    const [tableInfo] = await pool.execute('DESCRIBE lecture_reports');
    console.log('📊 lecture_reports table structure:');
    tableInfo.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null}`);
    });
    
    // Test 2: Check if we have any reports to test with
    const [reports] = await pool.execute('SELECT id, faculty_name FROM lecture_reports LIMIT 5');
    console.log('📋 Sample reports:', reports);
    
    // Test 3: Try a simple update to see if it works
    if (reports.length > 0) {
      const testReportId = reports[0].id;
      console.log(`🧪 Testing update on report ID: ${testReportId}`);
      
      const [result] = await pool.execute(
        'UPDATE lecture_reports SET prl_feedback = ? WHERE id = ?',
        ['Test feedback from debug script', testReportId]
      );
      
      console.log('✅ Test update successful:', result);
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      errno: error.errno
    });
  } finally {
    process.exit();
  }
}

testFeedback();