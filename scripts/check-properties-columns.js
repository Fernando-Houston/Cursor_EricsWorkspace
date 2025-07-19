const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkColumns() {
  const pool = new Pool({
    connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
    ssl: false,
  });

  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
      ORDER BY ordinal_position
    `);
    
    console.log('Properties table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    // Check if specific columns exist
    const importantColumns = ['improvement_value', 'land_value', 'building_style_code', 'num_buildings'];
    console.log('\nChecking for specific columns:');
    importantColumns.forEach(col => {
      const exists = result.rows.some(row => row.column_name === col);
      console.log(`  ${col}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkColumns();