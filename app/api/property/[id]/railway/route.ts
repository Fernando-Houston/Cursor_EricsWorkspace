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
    
    // Get property from Railway database with all available fields
    const result = await pool.query(
      `SELECT 
        account_number,
        owner_name,
        property_address,
        mail_address,
        mail_city,
        mail_state,
        mail_zip,
        total_value::numeric as total_value,
        land_value::numeric as land_value,
        building_value::numeric as improvement_value,
        assessed_value::numeric as assessed_value,
        area_acres::numeric as area_acres,
        area_sqft::numeric as area_sqft,
        property_type,
        property_class,
        property_class_desc,
        year_built,
        zip,
        city,
        state,
        centroid_lat::numeric as latitude,
        centroid_lon::numeric as longitude,
        has_geometry,
        bbox_minx::numeric as bbox_minx,
        bbox_miny::numeric as bbox_miny,
        bbox_maxx::numeric as bbox_maxx,
        bbox_maxy::numeric as bbox_maxy,
        import_date,
        extra_data,
        estimated_value::numeric as estimated_value,
        confidence_score::numeric as confidence_score,
        investment_score
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
    
    // Convert numeric values and extract all available data
    const extraData = property.extra_data || {};
    
    // Parse numeric values
    const totalValue = property.total_value ? parseFloat(property.total_value) : null;
    const landValue = property.land_value ? parseFloat(property.land_value) : null;
    const buildingValue = property.improvement_value ? parseFloat(property.improvement_value) : null;
    const assessedValue = property.assessed_value ? parseFloat(property.assessed_value) : null;
    const areaAcres = property.area_acres ? parseFloat(property.area_acres) : null;
    const areaSqft = property.area_sqft ? parseFloat(property.area_sqft) : null;
    
    const enhancedProperty = {
      ...property,
      total_value: totalValue,
      land_value: landValue,
      improvement_value: buildingValue,
      assessed_value: assessedValue,
      area_acres: areaAcres,
      area_sqft: areaSqft,
      latitude: property.latitude ? parseFloat(property.latitude) : null,
      longitude: property.longitude ? parseFloat(property.longitude) : null,
      
      // Bounding box for map display
      bbox: property.bbox_minx ? {
        minx: parseFloat(property.bbox_minx),
        miny: parseFloat(property.bbox_miny),
        maxx: parseFloat(property.bbox_maxx),
        maxy: parseFloat(property.bbox_maxy)
      } : null,
      
      // Extract from extra_data
      state_class: extraData.state_class || property.property_class || null,
      tax_year: extraData.tax_year || null,
      batch: extraData.batch || null,
      
      // Calculate derived values
      square_feet: areaSqft || (areaAcres ? Math.round(areaAcres * 43560) : null),
      
      // Property characteristics
      is_owner_occupied: property.property_address === property.mail_address,
      is_exempt: property.property_type?.includes('Exempt') || extraData.state_class === 'X1',
      is_commercial: property.property_type?.includes('Commercial') || 
                     property.property_class?.startsWith('F') ||
                     property.property_class?.startsWith('L'),
      is_residential: property.property_type?.includes('Residential') || 
                      property.property_class?.startsWith('A') ||
                      property.property_class?.startsWith('B'),
      
      // Complete mailing address
      full_mail_address: property.mail_address ? 
        `${property.mail_address}, ${property.mail_city || ''} ${property.mail_state || ''} ${property.mail_zip || ''}`.trim() : null,
      
      // Investment analysis
      investment_score: property.investment_score || calculateInvestmentScore(property),
      rental_estimate: totalValue ? estimateRent(property) : null,
      
      // Market analysis with fallbacks
      market_analysis: {
        estimated_value: property.estimated_value ? parseFloat(property.estimated_value) : 
                        totalValue ? totalValue * 1.05 : null,
        confidence: property.confidence_score ? parseFloat(property.confidence_score) : 
                   totalValue ? 85 : 50,
        trend: totalValue ? 'up' : 'unknown',
        growth_rate: totalValue ? 5.2 : null,
        has_valuation: totalValue !== null,
        valuation_date: property.import_date || null
      },
      
      // Data quality indicators
      data_quality: {
        has_value: totalValue !== null,
        has_geometry: property.has_geometry || false,
        has_coordinates: property.latitude !== null && property.longitude !== null,
        has_area: areaAcres !== null || areaSqft !== null,
        completeness_score: calculateDataCompleteness(property)
      },
      
      // Clean up - remove raw extra_data
      extra_data: undefined,
      bbox_minx: undefined,
      bbox_miny: undefined,
      bbox_maxx: undefined,
      bbox_maxy: undefined
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

function calculateDataCompleteness(property: {
  account_number?: string;
  owner_name?: string;
  property_address?: string;
  total_value?: number | string | null;
  land_value?: number | string | null;
  building_value?: number | string | null;
  area_acres?: number | string | null;
  area_sqft?: number | string | null;
  year_built?: number | null;
  property_type?: string;
  zip?: string;
  latitude?: number | null;
  longitude?: number | null;
}): number {
  const fields = [
    property.account_number,
    property.owner_name,
    property.property_address,
    property.total_value,
    property.land_value,
    property.building_value,
    property.area_acres || property.area_sqft,
    property.year_built,
    property.property_type,
    property.zip,
    property.latitude && property.longitude
  ];
  
  const filledFields = fields.filter(field => field !== null && field !== undefined && field !== '').length;
  return Math.round((filledFields / fields.length) * 100);
}