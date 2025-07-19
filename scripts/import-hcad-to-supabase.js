require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const { Transform } = require('stream');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Batch processor
class BatchProcessor extends Transform {
  constructor(batchSize = 1000) {
    super({ objectMode: true });
    this.batch = [];
    this.batchSize = batchSize;
    this.totalProcessed = 0;
  }

  _transform(chunk, encoding, callback) {
    this.batch.push(chunk);
    
    if (this.batch.length >= this.batchSize) {
      this.processBatch().then(() => callback());
    } else {
      callback();
    }
  }

  _flush(callback) {
    if (this.batch.length > 0) {
      this.processBatch().then(() => callback());
    } else {
      callback();
    }
  }

  async processBatch() {
    const properties = this.batch.map(row => ({
      account_number: row['Account'],
      owner_name: row['Owner Name'],
      property_address: row['Property Address'],
      mail_address: row['Mail Address'],
      total_value: parseFloat(row['Total Value']) || 0,
      land_value: parseFloat(row['Land Value']) || 0,
      improvement_value: parseFloat(row['Improvement Value']) || 0,
      area_acres: parseFloat(row['Area Acres']) || 0,
      property_type: row['Property Type'] || 'RESIDENTIAL',
      year_built: parseInt(row['Year Built']) || null,
      zip: row['ZIP'],
      centroid_lat: parseFloat(row['Latitude']) || null,
      centroid_lon: parseFloat(row['Longitude']) || null,
      legal_description: row['Legal Description'],
      neighborhood: row['Neighborhood'],
      school_district: row['School District'],
      // Calculate derived fields
      is_owner_occupied: row['Property Address'] === row['Mail Address'],
      property_age: row['Year Built'] ? new Date().getFullYear() - parseInt(row['Year Built']) : null,
      value_per_acre: row['Area Acres'] > 0 ? (parseFloat(row['Total Value']) || 0) / parseFloat(row['Area Acres']) : null
    }));

    try {
      const { data, error } = await supabase
        .from('properties')
        .upsert(properties, { onConflict: 'account_number' });

      if (error) throw error;

      this.totalProcessed += this.batch.length;
      console.log(`✓ Processed ${this.totalProcessed} properties...`);
    } catch (error) {
      console.error('Batch insert error:', error);
      // Save failed batch for retry
      fs.appendFileSync('failed_imports.json', JSON.stringify(this.batch) + '\n');
    }

    this.batch = [];
  }
}

async function setupDatabase() {
  console.log('Setting up database schema...');
  
  // Create properties table with proper indexes
  const { error } = await supabase.rpc('create_properties_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS properties (
        account_number VARCHAR PRIMARY KEY,
        owner_name VARCHAR,
        property_address VARCHAR,
        mail_address VARCHAR,
        total_value NUMERIC,
        land_value NUMERIC,
        improvement_value NUMERIC,
        area_acres NUMERIC,
        property_type VARCHAR,
        year_built INTEGER,
        zip VARCHAR,
        centroid_lat NUMERIC,
        centroid_lon NUMERIC,
        legal_description TEXT,
        neighborhood VARCHAR,
        school_district VARCHAR,
        is_owner_occupied BOOLEAN,
        property_age INTEGER,
        value_per_acre NUMERIC,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for fast searches
      CREATE INDEX IF NOT EXISTS idx_owner_name ON properties(LOWER(owner_name));
      CREATE INDEX IF NOT EXISTS idx_property_address ON properties(LOWER(property_address));
      CREATE INDEX IF NOT EXISTS idx_zip ON properties(zip);
      CREATE INDEX IF NOT EXISTS idx_total_value ON properties(total_value);
      CREATE INDEX IF NOT EXISTS idx_owner_occupied ON properties(is_owner_occupied);
      CREATE INDEX IF NOT EXISTS idx_property_type ON properties(property_type);
    `
  });

  if (error) {
    console.error('Schema setup error:', error);
  } else {
    console.log('✓ Database schema ready');
  }
}

async function importHCAD(csvPath) {
  const startTime = Date.now();
  console.log(`Starting HCAD import from ${csvPath}...`);

  // Setup database first
  await setupDatabase();

  // Count total rows for progress
  let totalRows = 0;
  await new Promise((resolve) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', () => totalRows++)
      .on('end', resolve);
  });

  console.log(`Found ${totalRows.toLocaleString()} properties to import`);

  // Process CSV in batches
  const processor = new BatchProcessor(1000);
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .pipe(processor)
      .on('finish', resolve)
      .on('error', reject);
  });

  const duration = (Date.now() - startTime) / 1000 / 60;
  console.log(`\n✅ Import complete!`);
  console.log(`   Total time: ${duration.toFixed(2)} minutes`);
  console.log(`   Properties imported: ${processor.totalProcessed.toLocaleString()}`);
}

// Command line usage
if (require.main === module) {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.error('Usage: node import-hcad-to-supabase.js <path-to-hcad.csv>');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  importHCAD(csvPath).catch(console.error);
}

module.exports = { importHCAD };