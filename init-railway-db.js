// Initialize Railway Postgres Database
// Run: node init-railway-db.js

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  console.log('🚀 Initializing Railway Postgres database...\n');
  
  const client = await pool.connect();
  try {
    // Test connection
    console.log('Testing connection...');
    const test = await client.query('SELECT NOW() as time');
    console.log('✅ Connected successfully at:', test.rows[0].time);
    
    // Create properties table
    console.log('\nCreating properties table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        account_number VARCHAR(50) UNIQUE NOT NULL,
        owner VARCHAR(255),
        property_address TEXT,
        mailing_address TEXT,
        appraised_value DECIMAL(12, 2),
        land_value DECIMAL(12, 2),
        improvement_value DECIMAL(12, 2),
        total_value DECIMAL(12, 2),
        exemptions TEXT,
        property_type VARCHAR(100),
        year_built INTEGER,
        square_footage INTEGER,
        lot_size VARCHAR(100),
        acreage DECIMAL(10, 4),
        bedrooms INTEGER,
        bathrooms DECIMAL(3, 1),
        stories INTEGER,
        exterior_wall VARCHAR(100),
        roof_type VARCHAR(100),
        foundation VARCHAR(100),
        heating VARCHAR(100),
        cooling VARCHAR(100),
        fireplace BOOLEAN DEFAULT FALSE,
        pool BOOLEAN DEFAULT FALSE,
        garage VARCHAR(100),
        neighborhood VARCHAR(255),
        school_district VARCHAR(255),
        parcel_id VARCHAR(50),
        legal_description TEXT,
        tax_year VARCHAR(10),
        confidence DECIMAL(3, 2),
        enhanced_confidence DECIMAL(3, 2),
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        processing_stages TEXT[],
        raw_data JSONB
      )
    `);
    console.log('✅ Properties table created');
    
    // Create indexes
    console.log('\nCreating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_properties_account_number ON properties(account_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_properties_property_address ON properties(property_address)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_properties_date_added ON properties(date_added DESC)');
    console.log('✅ Indexes created');
    
    // Create tax history table
    console.log('\nCreating tax_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_history (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        year VARCHAR(10),
        tax_amount DECIMAL(10, 2),
        tax_rate DECIMAL(5, 4),
        payment_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tax history table created');
    
    // Create appraisal history table
    console.log('\nCreating appraisal_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS appraisal_history (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        year VARCHAR(10),
        land_value DECIMAL(12, 2),
        improvement_value DECIMAL(12, 2),
        total_value DECIMAL(12, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Appraisal history table created');
    
    // Verify tables
    console.log('\n📋 Verifying tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tables in database:');
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    
    console.log('\n🎉 Database initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Push your code to GitHub: git push origin main');
    console.log('2. Add environment variables to Vercel');
    console.log('3. Your database is ready to receive data from n8n!');
    console.log('\nYour webhook URL:');
    console.log('https://cursor-erics-workspace.vercel.app/api/webhook/n8n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Details:', error.detail);
    console.log('\nTroubleshooting:');
    console.log('1. Check your Railway database is active');
    console.log('2. Verify the connection string in .env.local');
    console.log('3. Make sure the port (31762) is correct');
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();