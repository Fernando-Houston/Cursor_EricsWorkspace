import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    // Get property from Railway database
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
        legal_description,
        city,
        extra_data
      FROM properties 
      WHERE account_number = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      // Try without leading zeros
      const cleanId = id.replace(/^0+/, '');
      const retryResult = await pool.query(
        'SELECT * FROM properties WHERE account_number = $1',
        [cleanId]
      );
      
      if (retryResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }
      result.rows = retryResult.rows;
    }
    
    const property = result.rows[0];
    
    // Convert numeric values and extract extra data
    const extraData = property.extra_data || {};
    
    const enhancedProperty = {
      ...property,
      total_value: property.total_value ? parseFloat(property.total_value) : null,
      land_value: property.land_value ? parseFloat(property.land_value) : null,
      improvement_value: property.improvement_value ? parseFloat(property.improvement_value) : null,
      area_acres: property.area_acres ? parseFloat(property.area_acres) : null,
      latitude: property.latitude ? parseFloat(property.latitude) : null,
      longitude: property.longitude ? parseFloat(property.longitude) : null,
      
      // Extract from extra_data if available
      neighborhood: extraData.neighborhood || null,
      school_district: extraData.school_district || null,
      subdivision: extraData.subdivision || null,
      
      // Calculate square feet - use area_sqft if available, otherwise calculate from acres
      square_feet: property.area_sqft ? parseFloat(property.area_sqft) : 
                   property.area_acres ? Math.round(parseFloat(property.area_acres) * 43560) : null,
      
      // Smart features
      is_owner_occupied: property.property_address === property.mail_address,
      
      // Investment analysis - use existing scores if available
      investment_score: property.investment_score || calculateInvestmentScore(property),
      rental_estimate: estimateRent(property),
      
      // Market analysis
      market_analysis: {
        estimated_value: property.estimated_value ? parseFloat(property.estimated_value) : 
                        property.total_value ? parseFloat(property.total_value) * 1.05 : null,
        confidence: property.confidence_score || 85,
        trend: 'up',
        growth_rate: 5.2
      },
      
      // Remove extra_data from response
      extra_data: undefined
    };
    
    // Get comparable properties
    if (property.zip && property.total_value) {
      const comparablesResult = await pool.query(
        `SELECT 
          account_number,
          property_address,
          total_value::numeric as total_value,
          area_acres::numeric as area_acres
        FROM properties 
        WHERE zip = $1 
          AND account_number != $2
          AND total_value IS NOT NULL
          AND total_value BETWEEN $3 AND $4
          AND property_type = $5
        ORDER BY ABS(total_value - $6)
        LIMIT 5`,
        [
          property.zip,
          id,
          parseFloat(property.total_value) * 0.7,
          parseFloat(property.total_value) * 1.3,
          property.property_type || 'RESIDENTIAL',
          parseFloat(property.total_value)
        ]
      );
      
      enhancedProperty.comparables = comparablesResult.rows.map(comp => ({
        address: comp.property_address,
        value: comp.total_value ? parseFloat(comp.total_value) : 0,
        price_per_sqft: comp.area_acres ? 
          parseFloat(comp.total_value) / (parseFloat(comp.area_acres) * 43560) : 0,
        distance: 0.5 // Approximate
      }));
    }
    
    return NextResponse.json(enhancedProperty);
    
  } catch (error) {
    console.error('Property detail error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch property details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculateInvestmentScore(property: {
  property_address?: string;
  mail_address?: string;
  zip?: string;
  total_value?: number | string;
  area_acres?: number | string;
}): number {
  let score = 50;
  
  // Non-owner occupied properties are investment opportunities
  if (property.property_address !== property.mail_address) score += 20;
  
  // Properties in growing areas
  if (property.zip && ['77008', '77007', '77009'].includes(property.zip)) score += 15;
  
  // Good value properties
  const totalValue = typeof property.total_value === 'string' ? parseFloat(property.total_value) : property.total_value;
  if (totalValue && totalValue < 500000) score += 10;
  
  // Larger properties
  const acres = typeof property.area_acres === 'string' ? parseFloat(property.area_acres) : property.area_acres;
  if (acres && acres > 0.5) score += 5;
  
  return Math.min(score, 100);
}

function estimateRent(property: {
  total_value?: number | string;
  property_type?: string;
}): number {
  if (!property.total_value) return 0;
  
  const totalValue = typeof property.total_value === 'string' ? parseFloat(property.total_value) : property.total_value;
  if (!totalValue) return 0;
  
  // Simple rent estimation: 0.7-1% of property value per month
  const rentRatio = property.property_type === 'COMMERCIAL' ? 0.01 : 0.007;
  return Math.round(totalValue * rentRatio);
}