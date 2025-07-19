const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkExtraData() {
  const pool = new Pool({
    connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
    ssl: false,
  });

  try {
    // Check the specific property from the search
    console.log('Checking property 0660640130020...\n');
    
    const result = await pool.query(`
      SELECT account_number, owner_name, property_address, 
             total_value, area_acres, extra_data,
             property_class, property_class_desc
      FROM properties 
      WHERE account_number = $1
    `, ['0660640130020']);
    
    if (result.rows.length > 0) {
      const property = result.rows[0];
      console.log('Property found:');
      console.log('  Account:', property.account_number);
      console.log('  Owner:', property.owner_name);
      console.log('  Address:', property.property_address);
      console.log('  Acres:', property.area_acres);
      console.log('  Property Class:', property.property_class, '-', property.property_class_desc);
      console.log('\nExtra data:', JSON.stringify(property.extra_data, null, 2));
    }
    
    // Sample properties with different types of extra_data
    console.log('\n\nSampling extra_data patterns...');
    const samples = await pool.query(`
      SELECT property_type, extra_data, COUNT(*) as count
      FROM properties
      WHERE extra_data IS NOT NULL 
      AND extra_data::text != '{}'
      GROUP BY property_type, extra_data
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log('\nCommon extra_data patterns:');
    samples.rows.forEach(row => {
      console.log(`\n${row.property_type} (${row.count} properties):`);
      console.log(JSON.stringify(row.extra_data, null, 2));
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkExtraData();