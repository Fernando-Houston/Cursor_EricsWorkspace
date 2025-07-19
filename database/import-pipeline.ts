import { Pool } from 'pg';
import csv from 'csv-parser';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Enhanced HCAD Data Import Pipeline
// Handles monthly updates with change tracking and enrichment

interface ImportStats {
  batchId: string;
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  ownerChanges: number;
  valueChanges: number;
  errors: number;
}

export class HCADImportPipeline {
  private pool: Pool;
  private batchId: string;
  private stats: ImportStats;

  constructor(pool: Pool) {
    this.pool = pool;
    this.batchId = uuidv4();
    this.stats = {
      batchId: this.batchId,
      totalRecords: 0,
      newRecords: 0,
      updatedRecords: 0,
      ownerChanges: 0,
      valueChanges: 0,
      errors: 0
    };
  }

  async importMonthlyData(csvFilePath: string): Promise<ImportStats> {
    console.log(`🚀 Starting HCAD import batch: ${this.batchId}`);
    
    try {
      // 1. Create import batch record
      await this.createImportBatch(csvFilePath);
      
      // 2. Create temporary staging table
      await this.createStagingTable();
      
      // 3. Load CSV data into staging
      await this.loadCSVToStaging(csvFilePath);
      
      // 4. Process changes and updates
      await this.processChanges();
      
      // 5. Update enhanced fields
      await this.updateEnhancedFields();
      
      // 6. Generate analytics
      await this.generateAnalytics();
      
      // 7. Clean up
      await this.cleanup();
      
      // 8. Mark batch as completed
      await this.completeBatch();
      
      console.log('✅ Import completed successfully!', this.stats);
      return this.stats;
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      await this.failBatch(error as Error);
      throw error;
    }
  }

  private async createImportBatch(fileName: string) {
    await this.pool.query(`
      INSERT INTO import_batches (batch_id, file_name, status)
      VALUES ($1, $2, 'processing')
    `, [this.batchId, fileName]);
  }

  private async createStagingTable() {
    await this.pool.query(`
      CREATE TEMP TABLE staging_properties (
        LIKE properties_enhanced INCLUDING DEFAULTS
      );
    `);
  }

  private async loadCSVToStaging(csvFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          records.push(this.transformRow(row));
          if (records.length >= 1000) {
            this.batchInsertStaging(records.splice(0, 1000));
          }
        })
        .on('end', async () => {
          if (records.length > 0) {
            await this.batchInsertStaging(records);
          }
          console.log(`📊 Loaded ${this.stats.totalRecords} records to staging`);
          resolve();
        })
        .on('error', reject);
    });
  }

  private transformRow(row: any) {
    // Transform CSV row to match our schema
    return {
      account_number: row.account_number || row.parcel_id,
      owner_name: row.owner_name?.toUpperCase(),
      property_address: row.property_address?.toUpperCase(),
      city: row.city?.toUpperCase(),
      state: row.state || 'TX',
      zip: row.zip,
      mail_address: row.mail_address?.toUpperCase(),
      mail_city: row.mail_city?.toUpperCase(),
      mail_state: row.mail_state || 'TX',
      mail_zip: row.mail_zip,
      property_type: row.property_type,
      land_value: this.parseNumeric(row.land_value),
      building_value: this.parseNumeric(row.building_value),
      total_value: this.parseNumeric(row.total_value),
      assessed_value: this.parseNumeric(row.assessed_value),
      area_sqft: this.parseNumeric(row.area_sqft),
      area_acres: this.parseNumeric(row.area_acres),
      year_built: this.parseNumeric(row.year_built),
      centroid_lat: this.parseNumeric(row.latitude),
      centroid_lon: this.parseNumeric(row.longitude),
      import_batch_id: this.batchId
    };
  }

  private parseNumeric(value: any): number | null {
    if (!value) return null;
    const num = parseFloat(value.toString().replace(/[$,]/g, ''));
    return isNaN(num) ? null : num;
  }

  private async batchInsertStaging(records: any[]) {
    const values = records.map(r => [
      r.account_number, r.owner_name, r.property_address, r.city, r.state,
      r.zip, r.mail_address, r.mail_city, r.mail_state, r.mail_zip,
      r.property_type, r.land_value, r.building_value, r.total_value,
      r.assessed_value, r.area_sqft, r.area_acres, r.year_built,
      r.centroid_lat, r.centroid_lon, r.import_batch_id
    ]);

    await this.pool.query(`
      INSERT INTO staging_properties (
        account_number, owner_name, property_address, city, state,
        zip, mail_address, mail_city, mail_state, mail_zip,
        property_type, land_value, building_value, total_value,
        assessed_value, area_sqft, area_acres, year_built,
        centroid_lat, centroid_lon, import_batch_id
      ) VALUES ${values.map((_, i) => 
        `($${i*21+1}, $${i*21+2}, $${i*21+3}, $${i*21+4}, $${i*21+5},
          $${i*21+6}, $${i*21+7}, $${i*21+8}, $${i*21+9}, $${i*21+10},
          $${i*21+11}, $${i*21+12}, $${i*21+13}, $${i*21+14},
          $${i*21+15}, $${i*21+16}, $${i*21+17}, $${i*21+18},
          $${i*21+19}, $${i*21+20}, $${i*21+21})`
      ).join(', ')}
    `, values.flat());

    this.stats.totalRecords += records.length;
  }

  private async processChanges() {
    // Track new properties
    const newProps = await this.pool.query(`
      INSERT INTO properties_enhanced
      SELECT s.*, CURRENT_DATE, CURRENT_DATE, NULL, NULL, NULL
      FROM staging_properties s
      WHERE NOT EXISTS (
        SELECT 1 FROM properties_enhanced p 
        WHERE p.account_number = s.account_number
      )
      RETURNING account_number
    `);
    this.stats.newRecords = newProps.rowCount || 0;

    // Track owner changes
    const ownerChanges = await this.pool.query(`
      INSERT INTO property_history (account_number, field_name, old_value, new_value, change_type, import_batch_id)
      SELECT 
        p.account_number,
        'owner_name',
        p.owner_name,
        s.owner_name,
        'owner_change',
        $1
      FROM properties_enhanced p
      JOIN staging_properties s ON p.account_number = s.account_number
      WHERE p.owner_name != s.owner_name
      RETURNING account_number
    `, [this.batchId]);
    this.stats.ownerChanges = ownerChanges.rowCount || 0;

    // Track value changes
    const valueChanges = await this.pool.query(`
      INSERT INTO property_history (account_number, field_name, old_value, new_value, change_type, import_batch_id)
      SELECT 
        p.account_number,
        'total_value',
        p.total_value::text,
        s.total_value::text,
        'value_change',
        $1
      FROM properties_enhanced p
      JOIN staging_properties s ON p.account_number = s.account_number
      WHERE COALESCE(p.total_value, 0) != COALESCE(s.total_value, 0)
      RETURNING account_number
    `, [this.batchId]);
    this.stats.valueChanges = valueChanges.rowCount || 0;

    // Update existing properties
    const updated = await this.pool.query(`
      UPDATE properties_enhanced p
      SET 
        owner_name = s.owner_name,
        property_address = s.property_address,
        mail_address = s.mail_address,
        total_value = s.total_value,
        land_value = s.land_value,
        building_value = s.building_value,
        assessed_value = s.assessed_value,
        last_updated_date = CURRENT_DATE,
        last_modified_date = CASE 
          WHEN p.owner_name != s.owner_name OR 
               COALESCE(p.total_value, 0) != COALESCE(s.total_value, 0)
          THEN CURRENT_DATE 
          ELSE p.last_modified_date 
        END,
        owner_changed_date = CASE 
          WHEN p.owner_name != s.owner_name 
          THEN CURRENT_DATE 
          ELSE p.owner_changed_date 
        END,
        value_changed_date = CASE 
          WHEN COALESCE(p.total_value, 0) != COALESCE(s.total_value, 0)
          THEN CURRENT_DATE 
          ELSE p.value_changed_date 
        END
      FROM staging_properties s
      WHERE p.account_number = s.account_number
        AND (p.owner_name != s.owner_name OR 
             p.property_address != s.property_address OR
             COALESCE(p.total_value, 0) != COALESCE(s.total_value, 0))
    `);
    this.stats.updatedRecords = updated.rowCount || 0;
  }

  private async updateEnhancedFields() {
    // Update owner portfolio stats
    await this.pool.query(`
      INSERT INTO owner_portfolio (owner_name, total_properties, total_acres, total_portfolio_value)
      SELECT 
        owner_name,
        COUNT(*) as total_properties,
        SUM(area_acres) as total_acres,
        SUM(total_value) as total_portfolio_value
      FROM properties_enhanced
      WHERE owner_name IS NOT NULL
      GROUP BY owner_name
      ON CONFLICT (owner_name) DO UPDATE SET
        total_properties = EXCLUDED.total_properties,
        total_acres = EXCLUDED.total_acres,
        total_portfolio_value = EXCLUDED.total_portfolio_value,
        last_active_date = CURRENT_DATE
    `);

    // Identify institutional owners
    await this.pool.query(`
      UPDATE owner_portfolio
      SET 
        is_institutional = true,
        owner_type = CASE
          WHEN owner_name LIKE '%LLC%' THEN 'llc'
          WHEN owner_name LIKE '%TRUST%' THEN 'trust'
          WHEN owner_name LIKE '%CORP%' OR owner_name LIKE '%INC%' THEN 'corporate'
          ELSE 'individual'
        END
      WHERE owner_name LIKE '%LLC%' 
         OR owner_name LIKE '%TRUST%' 
         OR owner_name LIKE '%CORP%'
         OR owner_name LIKE '%INC%'
         OR total_properties > 10
    `);
  }

  private async generateAnalytics() {
    // Generate monthly market analytics by ZIP
    await this.pool.query(`
      INSERT INTO market_analytics (zip, month, total_properties, avg_value, median_value)
      SELECT 
        zip,
        DATE_TRUNC('month', CURRENT_DATE) as month,
        COUNT(*) as total_properties,
        AVG(total_value) as avg_value,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_value) as median_value
      FROM properties_enhanced
      WHERE total_value IS NOT NULL AND total_value > 0
      GROUP BY zip
      ON CONFLICT (zip, month) DO UPDATE SET
        total_properties = EXCLUDED.total_properties,
        avg_value = EXCLUDED.avg_value,
        median_value = EXCLUDED.median_value
    `);
  }

  private async cleanup() {
    // Mark inactive properties (no longer in feed)
    await this.pool.query(`
      UPDATE properties_enhanced
      SET is_active = false
      WHERE account_number NOT IN (
        SELECT account_number FROM staging_properties
      )
    `);
  }

  private async completeBatch() {
    await this.pool.query(`
      UPDATE import_batches
      SET 
        status = 'completed',
        total_records = $2,
        new_records = $3,
        updated_records = $4,
        processing_time_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - import_date)) * 1000
      WHERE batch_id = $1
    `, [this.batchId, this.stats.totalRecords, this.stats.newRecords, this.stats.updatedRecords]);
  }

  private async failBatch(error: Error) {
    await this.pool.query(`
      UPDATE import_batches
      SET 
        status = 'failed',
        error_records = $2
      WHERE batch_id = $1
    `, [this.batchId, this.stats.errors]);
  }
}

// ML Value Prediction Pipeline
export class ValuePredictionPipeline {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async predictMissingValues() {
    console.log('🤖 Starting ML value prediction...');
    
    // Get properties with values for training
    const training = await this.pool.query(`
      SELECT 
        centroid_lat,
        centroid_lon,
        area_acres,
        year_built,
        property_type,
        total_value
      FROM properties_enhanced
      WHERE total_value IS NOT NULL 
        AND total_value > 0
        AND centroid_lat IS NOT NULL
        AND area_acres IS NOT NULL
    `);

    // Simple example: average value by area and type
    // In reality, you'd use a proper ML model here
    const predictions = await this.pool.query(`
      WITH area_type_avg AS (
        SELECT 
          property_type,
          CASE 
            WHEN area_acres < 0.25 THEN 'micro'
            WHEN area_acres < 1 THEN 'small'
            WHEN area_acres < 5 THEN 'medium'
            ELSE 'large'
          END as size_category,
          AVG(total_value) as avg_value,
          COUNT(*) as sample_size
        FROM properties_enhanced
        WHERE total_value IS NOT NULL AND total_value > 0
        GROUP BY 1, 2
        HAVING COUNT(*) > 10
      )
      UPDATE properties_enhanced p
      SET 
        estimated_value = ata.avg_value * 
          (1 + (RANDOM() - 0.5) * 0.2), -- Add 20% variance
        confidence_score = LEAST(ata.sample_size / 100.0, 1.0) * 100
      FROM area_type_avg ata
      WHERE p.total_value IS NULL
        AND p.property_type = ata.property_type
        AND CASE 
          WHEN p.area_acres < 0.25 THEN 'micro'
          WHEN p.area_acres < 1 THEN 'small'
          WHEN p.area_acres < 5 THEN 'medium'
          ELSE 'large'
        END = ata.size_category
    `);

    console.log(`✅ Predicted values for ${predictions.rowCount} properties`);
  }
}