// Test your database connection
// Run with: node test-db-connection.js

require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    const { sql } = require('@vercel/postgres');
    
    console.log('Testing database connection...');
    
    // Simple test query
    const result = await sql`SELECT NOW() as current_time`;
    
    console.log('✅ Connection successful!');
    console.log('Current database time:', result.rows[0].current_time);
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    if (tables.rows.length > 0) {
      console.log('\n📋 Existing tables:');
      tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    } else {
      console.log('\n⚠️  No tables found. Run the schema.sql to create them.');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if .env.local exists and has POSTGRES_URL');
    console.log('2. Verify your database is active in Vercel dashboard');
    console.log('3. Check if your IP needs to be whitelisted');
  }
  
  process.exit(0);
}

testConnection();