// Check specific property data in Google Cloud database
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkPropertyData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.GOOGLE_CLOUD_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    console.log('🔍 Searching for property: 0660640130020\n');
    
    // Get all data for this property
    const result = await client.query(
      'SELECT * FROM properties WHERE account_number = $1',
      ['0660640130020']
    );
    
    if (result.rows.length > 0) {
      const property = result.rows[0];
      console.log('✅ Found property in database!\n');
      console.log('Key fields:');
      console.log('─'.repeat(60));
      console.log(`Account Number:     ${property.account_number}`);
      console.log(`Owner Name:         ${property.owner_name}`);
      console.log(`Property Address:   ${property.property_address}`);
      console.log(`Property Type:      ${property.property_type}`);
      console.log(`Total Value:        ${property.total_value}`);
      console.log(`Land Value:         ${property.land_value}`);
      console.log(`Building Value:     ${property.building_value}`);
      console.log(`Assessed Value:     ${property.assessed_value}`);
      console.log(`Area (sq ft):       ${property.area_sqft}`);
      console.log(`Area (acres):       ${property.area_acres}`);
      console.log(`Year Built:         ${property.year_built}`);
      console.log(`City:               ${property.city}`);
      console.log(`State:              ${property.state}`);
      console.log(`ZIP:                ${property.zip}`);
      
      console.log('\n📊 Value fields in database:');
      console.log('─'.repeat(60));
      Object.entries(property).forEach(([key, value]) => {
        if (key.includes('value') && value !== null) {
          console.log(`${key.padEnd(20)} = ${value}`);
        }
      });
      
      console.log('\n📏 Size/Area fields in database:');
      console.log('─'.repeat(60));
      Object.entries(property).forEach(([key, value]) => {
        if ((key.includes('area') || key.includes('sqft') || key.includes('size')) && value !== null) {
          console.log(`${key.padEnd(20)} = ${value}`);
        }
      });
      
    } else {
      console.log('❌ Property not found in database');
    }
    
    client.release();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPropertyData();