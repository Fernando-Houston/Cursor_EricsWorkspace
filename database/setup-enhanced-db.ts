import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Script to set up the enhanced database schema
export async function setupEnhancedDatabase() {
  // Load env vars
  require('dotenv').config({ path: '.env.local' });
  
  const pool = new Pool({
    connectionString: process.env.RAILWAY_HCAD_DATABASE_URL || 'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway'
  });

  try {
    console.log('🚀 Setting up enhanced HCAD database schema...');
    
    // Read the schema SQL file
    const schemaSQL = fs.readFileSync(
      path.join(process.cwd(), 'database/enhanced-schema.sql'),
      'utf-8'
    );

    // Execute the schema
    await pool.query(schemaSQL);
    console.log('✅ Enhanced schema created successfully');

    // Migrate existing data to enhanced table
    console.log('📦 Migrating existing data...');
    await pool.query(`
      INSERT INTO properties_enhanced (
        account_number, owner_name, property_address, city, state, zip,
        mail_address, mail_city, mail_state, mail_zip,
        property_type, property_class, property_class_desc,
        land_value, building_value, total_value, assessed_value,
        area_sqft, area_acres, year_built,
        centroid_lat, centroid_lon,
        first_seen_date, last_updated_date
      )
      SELECT 
        account_number, owner_name, property_address, city, state, zip,
        mail_address, mail_city, mail_state, mail_zip,
        property_type, property_class, property_class_desc,
        land_value, building_value, total_value, assessed_value,
        area_sqft, area_acres, year_built,
        centroid_lat, centroid_lon,
        CURRENT_DATE, CURRENT_DATE
      FROM properties
      ON CONFLICT (account_number) DO NOTHING
    `);

    const result = await pool.query('SELECT COUNT(*) FROM properties_enhanced');
    console.log(`✅ Migrated ${result.rows[0].count} properties`);

    // Initialize owner portfolio
    console.log('👥 Building owner portfolio...');
    await pool.query(`
      INSERT INTO owner_portfolio (
        owner_name, total_properties, total_acres, total_portfolio_value,
        avg_property_value, owner_type
      )
      SELECT 
        owner_name,
        COUNT(*) as total_properties,
        SUM(area_acres) as total_acres,
        SUM(total_value) as total_portfolio_value,
        AVG(total_value) as avg_property_value,
        CASE
          WHEN owner_name LIKE '%LLC%' THEN 'llc'
          WHEN owner_name LIKE '%TRUST%' THEN 'trust'
          WHEN owner_name LIKE '%CORP%' OR owner_name LIKE '%INC%' THEN 'corporate'
          WHEN owner_name LIKE '%LP%' OR owner_name LIKE '%LTD%' THEN 'partnership'
          ELSE 'individual'
        END as owner_type
      FROM properties_enhanced
      WHERE owner_name IS NOT NULL
      GROUP BY owner_name
    `);

    const owners = await pool.query('SELECT COUNT(*) FROM owner_portfolio');
    console.log(`✅ Created portfolio for ${owners.rows[0].count} owners`);

    console.log('🎉 Enhanced database setup complete!');
    
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupEnhancedDatabase();
}