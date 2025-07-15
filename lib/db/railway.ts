import { Pool } from 'pg';

// Create connection pool for Railway Postgres
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export interface PropertyData {
  accountNumber: string;
  owner?: string;
  propertyAddress?: string;
  mailingAddress?: string;
  appraisedValue?: number;
  landValue?: number;
  improvementValue?: number;
  totalValue?: number;
  exemptions?: string;
  propertyType?: string;
  yearBuilt?: number;
  squareFootage?: number;
  lotSize?: string;
  acreage?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  exteriorWall?: string;
  roofType?: string;
  foundation?: string;
  heating?: string;
  cooling?: string;
  fireplace?: boolean;
  pool?: boolean;
  garage?: string;
  neighborhood?: string;
  schoolDistrict?: string;
  parcelId?: string;
  legalDescription?: string;
  taxYear?: string;
  confidence?: number;
  enhancedConfidence?: number;
  processedAt?: string;
  processingStages?: string[];
  rawData?: Record<string, unknown>;
}

export async function saveProperty(propertyData: PropertyData) {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO properties (
        account_number, owner, property_address, mailing_address,
        appraised_value, land_value, improvement_value, total_value,
        exemptions, property_type, year_built, square_footage,
        lot_size, acreage, bedrooms, bathrooms, stories,
        exterior_wall, roof_type, foundation, heating, cooling,
        fireplace, pool, garage, neighborhood, school_district,
        parcel_id, legal_description, tax_year, confidence,
        enhanced_confidence, processed_at, processing_stages, raw_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35
      )
      ON CONFLICT (account_number) 
      DO UPDATE SET
        owner = EXCLUDED.owner,
        property_address = EXCLUDED.property_address,
        mailing_address = EXCLUDED.mailing_address,
        appraised_value = EXCLUDED.appraised_value,
        land_value = EXCLUDED.land_value,
        improvement_value = EXCLUDED.improvement_value,
        total_value = EXCLUDED.total_value,
        exemptions = EXCLUDED.exemptions,
        property_type = EXCLUDED.property_type,
        year_built = EXCLUDED.year_built,
        square_footage = EXCLUDED.square_footage,
        lot_size = EXCLUDED.lot_size,
        acreage = EXCLUDED.acreage,
        bedrooms = EXCLUDED.bedrooms,
        bathrooms = EXCLUDED.bathrooms,
        stories = EXCLUDED.stories,
        exterior_wall = EXCLUDED.exterior_wall,
        roof_type = EXCLUDED.roof_type,
        foundation = EXCLUDED.foundation,
        heating = EXCLUDED.heating,
        cooling = EXCLUDED.cooling,
        fireplace = EXCLUDED.fireplace,
        pool = EXCLUDED.pool,
        garage = EXCLUDED.garage,
        neighborhood = EXCLUDED.neighborhood,
        school_district = EXCLUDED.school_district,
        parcel_id = EXCLUDED.parcel_id,
        legal_description = EXCLUDED.legal_description,
        tax_year = EXCLUDED.tax_year,
        confidence = EXCLUDED.confidence,
        enhanced_confidence = EXCLUDED.enhanced_confidence,
        processed_at = EXCLUDED.processed_at,
        processing_stages = EXCLUDED.processing_stages,
        raw_data = EXCLUDED.raw_data,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const values = [
      propertyData.accountNumber,
      propertyData.owner,
      propertyData.propertyAddress,
      propertyData.mailingAddress,
      propertyData.appraisedValue,
      propertyData.landValue,
      propertyData.improvementValue,
      propertyData.totalValue,
      propertyData.exemptions,
      propertyData.propertyType,
      propertyData.yearBuilt,
      propertyData.squareFootage,
      propertyData.lotSize,
      propertyData.acreage,
      propertyData.bedrooms,
      propertyData.bathrooms,
      propertyData.stories,
      propertyData.exteriorWall,
      propertyData.roofType,
      propertyData.foundation,
      propertyData.heating,
      propertyData.cooling,
      propertyData.fireplace,
      propertyData.pool,
      propertyData.garage,
      propertyData.neighborhood,
      propertyData.schoolDistrict,
      propertyData.parcelId,
      propertyData.legalDescription,
      propertyData.taxYear,
      propertyData.confidence,
      propertyData.enhancedConfidence,
      propertyData.processedAt ? new Date(propertyData.processedAt) : null,
      propertyData.processingStages || [],
      JSON.stringify(propertyData.rawData || {})
    ];
    
    const result = await client.query(query, values);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error saving property:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    client.release();
  }
}

export async function getProperties(limit = 100, offset = 0) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM properties ORDER BY date_added DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching properties:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    client.release();
  }
}

export async function getPropertyByAccountNumber(accountNumber: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM properties WHERE account_number = $1',
      [accountNumber]
    );
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error fetching property:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    client.release();
  }
}

export async function searchProperties(query: string) {
  const client = await pool.connect();
  try {
    const searchTerm = `%${query}%`;
    const result = await client.query(
      `SELECT * FROM properties 
       WHERE 
         account_number ILIKE $1 OR
         owner ILIKE $1 OR
         property_address ILIKE $1 OR
         neighborhood ILIKE $1
       ORDER BY date_added DESC
       LIMIT 100`,
      [searchTerm]
    );
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error searching properties:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    client.release();
  }
}

export async function deleteProperty(accountNumber: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM properties WHERE account_number = $1 RETURNING *',
      [accountNumber]
    );
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error deleting property:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    client.release();
  }
}

// Close pool on app termination
process.on('SIGTERM', () => {
  pool.end();
});