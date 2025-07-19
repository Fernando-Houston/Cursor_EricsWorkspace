const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testPropertyDetail(accountNumber) {
  const pool = new Pool({
    connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
    ssl: false,
  });

  try {
    console.log(`Testing property detail for account: ${accountNumber}\n`);
    
    const result = await pool.query(
      `SELECT 
        account_number,
        owner_name,
        property_address,
        mail_address,
        total_value::numeric as total_value,
        land_value::numeric as land_value,
        building_value::numeric as improvement_value,
        area_acres::numeric as area_acres,
        area_sqft::numeric as area_sqft,
        property_type,
        year_built,
        zip,
        centroid_lat::numeric as latitude,
        centroid_lon::numeric as longitude,
        city,
        extra_data
      FROM properties 
      WHERE account_number = $1`,
      [accountNumber]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Property not found');
      
      // Try without leading zeros
      const cleanId = accountNumber.replace(/^0+/, '');
      console.log(`\nTrying without leading zeros: ${cleanId}`);
      const retryResult = await pool.query(
        'SELECT account_number FROM properties WHERE account_number = $1',
        [cleanId]
      );
      
      if (retryResult.rows.length > 0) {
        console.log('✅ Found with cleaned ID:', retryResult.rows[0].account_number);
      }
    } else {
      const property = result.rows[0];
      console.log('✅ Property found:');
      console.log('  Account:', property.account_number);
      console.log('  Owner:', property.owner_name);
      console.log('  Address:', property.property_address);
      console.log('  Total Value:', property.total_value);
      console.log('  Land Value:', property.land_value);
      console.log('  Building Value:', property.improvement_value);
      console.log('  Area:', property.area_acres, 'acres');
      console.log('  Extra Data:', property.extra_data ? 'Yes' : 'No');
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

// Test with the account number from the screenshot
testPropertyDetail('0660640130020');