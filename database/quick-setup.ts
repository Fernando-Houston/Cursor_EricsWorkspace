import { Pool } from 'pg';

async function quickSetup() {
  require('dotenv').config({ path: '.env.local' });
  
  const pool = new Pool({
    connectionString: process.env.RAILWAY_HCAD_DATABASE_URL || 'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway'
  });

  try {
    // Check if enhanced table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'properties_enhanced'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('✅ Enhanced schema already exists');
      const count = await pool.query('SELECT COUNT(*) FROM properties_enhanced');
      console.log(`📊 Found ${count.rows[0].count} properties in enhanced table`);
    } else {
      console.log('🚀 Creating minimal enhanced schema...');
      
      // Create a simplified version first
      await pool.query(`
        CREATE TABLE properties_enhanced AS 
        SELECT 
          *,
          CURRENT_DATE as first_seen_date,
          CURRENT_DATE as last_updated_date,
          NULL::DATE as last_modified_date,
          NULL::NUMERIC as estimated_value,
          NULL::INTEGER as investment_score,
          CASE WHEN property_address = mail_address THEN true ELSE false END as is_owner_occupied
        FROM properties
        LIMIT 10000; -- Start with 10k for testing
        
        ALTER TABLE properties_enhanced ADD PRIMARY KEY (account_number);
      `);
      
      console.log('✅ Created enhanced table with 10k sample properties');
    }

    // Test the data
    const sample = await pool.query(`
      SELECT 
        account_number,
        owner_name,
        property_address,
        mail_address,
        total_value,
        is_owner_occupied
      FROM properties_enhanced
      WHERE mail_address IS NOT NULL 
        AND mail_address != property_address
      LIMIT 5
    `);

    console.log('\n📊 Sample properties with different mailing addresses:');
    console.table(sample.rows);

  } catch (error) {
    console.error('Setup error:', error);
  } finally {
    await pool.end();
  }
}

quickSetup();