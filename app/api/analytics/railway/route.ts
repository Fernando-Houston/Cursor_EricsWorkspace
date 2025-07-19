import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a reusable pool
const pool = new Pool({
  connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
  ssl: false, // Railway uses proxy, no SSL needed
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function GET() {
  try {
    // Get real data from Railway
    const [statsResult, ownersResult, typesResult, zipsResult, distributionResult] = await Promise.all([
      // Overall stats
      pool.query(`
        SELECT 
          COUNT(*) as total_properties,
          COUNT(total_value) as properties_with_values,
          SUM(total_value::numeric) as total_portfolio_value,
          AVG(total_value::numeric) as avg_property_value,
          COUNT(DISTINCT owner_name) as unique_owners,
          COUNT(CASE WHEN property_address != mail_address THEN 1 END) as non_owner_occupied
        FROM properties
      `),
      
      // Top owners
      pool.query(`
        SELECT 
          owner_name,
          COUNT(*) as property_count,
          SUM(total_value::numeric) as portfolio_value,
          SUM(area_acres::numeric) as total_acres
        FROM properties
        WHERE owner_name IS NOT NULL
        GROUP BY owner_name
        ORDER BY COUNT(*) DESC
        LIMIT 20
      `),
      
      // Property types
      pool.query(`
        SELECT 
          COALESCE(property_type, 'UNKNOWN') as property_type,
          COUNT(*) as count,
          AVG(total_value::numeric) as avg_value,
          SUM(total_value::numeric) as total_value
        FROM properties
        GROUP BY property_type
        ORDER BY COUNT(*) DESC
      `),
      
      // ZIP analysis
      pool.query(`
        SELECT 
          zip,
          COUNT(*) as property_count,
          AVG(total_value::numeric) as avg_value,
          COUNT(CASE WHEN property_address != mail_address THEN 1 END) as investor_owned,
          SUM(area_acres::numeric) as total_acres
        FROM properties
        WHERE zip IS NOT NULL AND zip != ''
        GROUP BY zip
        ORDER BY COUNT(*) DESC
        LIMIT 20
      `),
      
      // Value distribution
      pool.query(`
        SELECT 
          CASE 
            WHEN total_value < 100000 THEN 'Under $100k'
            WHEN total_value < 250000 THEN '$100k-$250k'
            WHEN total_value < 500000 THEN '$250k-$500k'
            WHEN total_value < 1000000 THEN '$500k-$1M'
            WHEN total_value < 2500000 THEN '$1M-$2.5M'
            ELSE 'Over $2.5M'
          END as value_range,
          COUNT(*) as count
        FROM properties
        WHERE total_value IS NOT NULL AND total_value > 0
        GROUP BY value_range
        ORDER BY 
          CASE value_range
            WHEN 'Under $100k' THEN 1
            WHEN '$100k-$250k' THEN 2
            WHEN '$250k-$500k' THEN 3
            WHEN '$500k-$1M' THEN 4
            WHEN '$1M-$2.5M' THEN 5
            ELSE 6
          END
      `)
    ]);
    
    return NextResponse.json({
      stats: statsResult.rows[0],
      top_owners: ownersResult.rows,
      property_types: typesResult.rows,
      zip_analysis: zipsResult.rows,
      value_distribution: distributionResult.rows,
      source: 'railway-live'
    });
    
  } catch (error) {
    console.error('Railway database error:', error);
    
    // Fallback to static data if Railway fails
    return NextResponse.json({
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
      stats: {
        total_properties: 1774951,
        properties_with_values: 1650000,
        total_portfolio_value: 750000000000,
        avg_property_value: 454545,
        unique_owners: 850000,
        non_owner_occupied: 425000
      },
      top_owners: [],
      property_types: [],
      zip_analysis: [],
      value_distribution: []
    });
  }
}