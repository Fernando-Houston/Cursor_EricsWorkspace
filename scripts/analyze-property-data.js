const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function analyzePropertyData() {
  const pool = new Pool({
    connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
    ssl: false,
  });

  try {
    // Get a sample property with data
    console.log('Finding properties with complete data...\n');
    
    const sampleResult = await pool.query(`
      SELECT * FROM properties 
      WHERE total_value IS NOT NULL 
      AND owner_name IS NOT NULL 
      AND property_address IS NOT NULL
      LIMIT 5
    `);
    
    if (sampleResult.rows.length > 0) {
      const property = sampleResult.rows[0];
      console.log('Sample property with data:');
      console.log('Account:', property.account_number);
      console.log('\nAvailable fields:');
      
      Object.keys(property).forEach(key => {
        if (property[key] !== null && property[key] !== '') {
          console.log(`  ${key}: ${typeof property[key] === 'object' ? JSON.stringify(property[key]).substring(0, 50) + '...' : property[key]}`);
        }
      });
      
      // Check extra_data contents
      if (property.extra_data) {
        console.log('\nExtra data fields:');
        Object.keys(property.extra_data).forEach(key => {
          console.log(`  ${key}: ${property.extra_data[key]}`);
        });
      }
    }
    
    // Get statistics on data completeness
    console.log('\n\nData completeness statistics:');
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(total_value) as has_value,
        COUNT(land_value) as has_land_value,
        COUNT(building_value) as has_building_value,
        COUNT(area_acres) as has_acres,
        COUNT(area_sqft) as has_sqft,
        COUNT(year_built) as has_year,
        COUNT(property_type) as has_type,
        COUNT(CASE WHEN extra_data IS NOT NULL AND extra_data != '{}' THEN 1 END) as has_extra_data
      FROM properties
    `);
    
    const stats = statsResult.rows[0];
    console.log(`Total properties: ${stats.total}`);
    console.log(`Has total_value: ${stats.has_value} (${(stats.has_value/stats.total*100).toFixed(1)}%)`);
    console.log(`Has land_value: ${stats.has_land_value} (${(stats.has_land_value/stats.total*100).toFixed(1)}%)`);
    console.log(`Has building_value: ${stats.has_building_value} (${(stats.has_building_value/stats.total*100).toFixed(1)}%)`);
    console.log(`Has area data: ${stats.has_acres} acres, ${stats.has_sqft} sqft`);
    console.log(`Has extra_data: ${stats.has_extra_data} (${(stats.has_extra_data/stats.total*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

analyzePropertyData();