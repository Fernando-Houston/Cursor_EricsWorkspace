// Test Google Cloud Database Connection
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.GOOGLE_CLOUD_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Google Cloud HCAD database...');
    console.log('Host:', process.env.GOOGLE_CLOUD_SQL_HOST);
    console.log('Database:', process.env.GOOGLE_CLOUD_SQL_DATABASE);
    
    const client = await pool.connect();
    
    // Test connection
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Connected successfully!');
    console.log('Database time:', result.rows[0].current_time);
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 10
    `);
    
    console.log('\n📋 Tables found:');
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Test property search
    console.log('\n🔍 Testing property search...');
    const testQuery = `
      SELECT COUNT(*) as total 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    `;
    const countResult = await client.query(testQuery);
    console.log('Total columns in database:', countResult.rows[0].total);
    
    client.release();
    console.log('\n🎉 Google Cloud database is ready!');
    console.log('\nNext: Update the SQL queries in /lib/google-cloud-db.ts to match your table structure');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('\n🔧 Check if the IP address is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Check if the database is accepting connections from your IP');
      console.log('   You may need to whitelist your IP in Google Cloud SQL');
    }
  } finally {
    await pool.end();
  }
}

testConnection();