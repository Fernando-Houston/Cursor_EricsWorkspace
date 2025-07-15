import { sql } from '@vercel/postgres';

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
  rawData?: any;
}

export async function saveProperty(propertyData: PropertyData) {
  try {
    const result = await sql`
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
        ${propertyData.accountNumber}, ${propertyData.owner}, ${propertyData.propertyAddress}, 
        ${propertyData.mailingAddress}, ${propertyData.appraisedValue}, ${propertyData.landValue}, 
        ${propertyData.improvementValue}, ${propertyData.totalValue}, ${propertyData.exemptions}, 
        ${propertyData.propertyType}, ${propertyData.yearBuilt}, ${propertyData.squareFootage},
        ${propertyData.lotSize}, ${propertyData.acreage}, ${propertyData.bedrooms}, 
        ${propertyData.bathrooms}, ${propertyData.stories}, ${propertyData.exteriorWall},
        ${propertyData.roofType}, ${propertyData.foundation}, ${propertyData.heating}, 
        ${propertyData.cooling}, ${propertyData.fireplace}, ${propertyData.pool}, 
        ${propertyData.garage}, ${propertyData.neighborhood}, ${propertyData.schoolDistrict},
        ${propertyData.parcelId}, ${propertyData.legalDescription}, ${propertyData.taxYear}, 
        ${propertyData.confidence}, ${propertyData.enhancedConfidence}, 
        ${propertyData.processedAt ? new Date(propertyData.processedAt) : null},
        ${propertyData.processingStages || []}, ${JSON.stringify(propertyData.rawData || {})}
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
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error saving property:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getProperties(limit = 100, offset = 0) {
  try {
    const result = await sql`
      SELECT * FROM properties 
      ORDER BY date_added DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching properties:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getPropertyByAccountNumber(accountNumber: string) {
  try {
    const result = await sql`
      SELECT * FROM properties 
      WHERE account_number = ${accountNumber}
    `;
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error fetching property:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function searchProperties(query: string) {
  try {
    const searchTerm = `%${query}%`;
    const result = await sql`
      SELECT * FROM properties 
      WHERE 
        account_number ILIKE ${searchTerm} OR
        owner ILIKE ${searchTerm} OR
        property_address ILIKE ${searchTerm} OR
        neighborhood ILIKE ${searchTerm}
      ORDER BY date_added DESC
      LIMIT 100
    `;
    
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error searching properties:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteProperty(accountNumber: string) {
  try {
    const result = await sql`
      DELETE FROM properties 
      WHERE account_number = ${accountNumber}
      RETURNING *
    `;
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error deleting property:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}