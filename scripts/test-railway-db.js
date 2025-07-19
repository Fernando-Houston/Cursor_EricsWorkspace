const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing Railway PostgreSQL connection...\n');
  
  // Parse the connection string to check if SSL is needed
  const connectionString = process.env.RAILWAY_HCAD_DATABASE_URL;
  const needsSSL = connectionString && connectionString.includes('railway.app');
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: needsSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });
  
  console.log('Connection URL:', connectionString ? connectionString.replace(/:[^:@]+@/, ':****@').substring(0, 80) + '...' : 'NOT SET');
  console.log('SSL enabled:', needsSSL);

  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const client = await pool.connect();
    console.log('✓ Connected successfully!');
    
    // Test 2: Query database version
    console.log('\n2. Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log('✓ PostgreSQL:', versionResult.rows[0].version.split(',')[0]);
    
    // Test 3: List tables
    console.log('\n3. Listing tables...');
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    console.log('✓ Found', tablesResult.rows.length, 'tables:');
    tablesResult.rows.forEach(row => {
      console.log('  -', row.tablename);
    });
    
    // Test 4: Check properties table
    console.log('\n4. Checking properties table...');
    const countResult = await client.query('SELECT COUNT(*) FROM properties');
    console.log('✓ Properties count:', countResult.rows[0].count);
    
    // Test 5: Sample data
    console.log('\n5. Fetching sample property...');
    const sampleResult = await client.query('SELECT account_number, owner_name, total_value FROM properties LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('✓ Sample property:', sampleResult.rows[0]);
    } else {
      console.log('⚠ No properties found in table');
    }
    
    client.release();
    console.log('\n✅ All tests passed! Database is accessible.');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Database is sleeping - try enabling Serverless mode in Railway');
    console.error('2. Connection string is incorrect - check RAILWAY_HCAD_DATABASE_URL');
    console.error('3. Network issues - check if you can access Railway');
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection();