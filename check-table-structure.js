// Check Google Cloud Database Table Structure
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkTableStructure() {
  const pool = new Pool({
    connectionString: process.env.GOOGLE_CLOUD_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    console.log('📊 Checking properties table structure...\n');
    
    // Get column information
    const columns = await client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'properties'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in properties table:');
    console.log('─'.repeat(60));
    columns.rows.forEach(col => {
      const type = col.character_maximum_length 
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;
      console.log(`${col.column_name.padEnd(25)} ${type.padEnd(20)} ${col.is_nullable}`);
    });
    
    // Get sample data
    console.log('\n📝 Sample data (first row):');
    console.log('─'.repeat(60));
    const sample = await client.query('SELECT * FROM properties LIMIT 1');
    
    if (sample.rows.length > 0) {
      Object.entries(sample.rows[0]).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          console.log(`${key.padEnd(25)} ${String(value).substring(0, 50)}`);
        }
      });
    } else {
      console.log('No data found in table');
    }
    
    // Get row count
    const count = await client.query('SELECT COUNT(*) as total FROM properties');
    console.log(`\n📈 Total records: ${count.rows[0].total}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();