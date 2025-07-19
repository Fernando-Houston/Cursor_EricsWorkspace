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
        WITH value_ranges AS (
          SELECT 
            CASE 
              WHEN total_value < 100000 THEN 'Under $100k'
              WHEN total_value < 250000 THEN '$100k-$250k'
              WHEN total_value < 500000 THEN '$250k-$500k'
              WHEN total_value < 1000000 THEN '$500k-$1M'
              WHEN total_value < 2500000 THEN '$1M-$2.5M'
              ELSE 'Over $2.5M'
            END as value_range,
            CASE 
              WHEN total_value < 100000 THEN 1
              WHEN total_value < 250000 THEN 2
              WHEN total_value < 500000 THEN 3
              WHEN total_value < 1000000 THEN 4
              WHEN total_value < 2500000 THEN 5
              ELSE 6
            END as sort_order
          FROM properties
          WHERE total_value IS NOT NULL AND total_value > 0
        )
        SELECT value_range, COUNT(*) as count
        FROM value_ranges
        GROUP BY value_range, sort_order
        ORDER BY sort_order
      `)
    ]);
    
    // Ensure all numeric values are properly converted
    const stats = statsResult.rows[0];
    const formattedStats = {
      total_properties: parseInt(stats.total_properties) || 0,
      properties_with_values: parseInt(stats.properties_with_values) || 0,
      total_portfolio_value: parseFloat(stats.total_portfolio_value) || 0,
      avg_property_value: parseFloat(stats.avg_property_value) || 0,
      unique_owners: parseInt(stats.unique_owners) || 0,
      non_owner_occupied: parseInt(stats.non_owner_occupied) || 0
    };
    
    return NextResponse.json({
      stats: formattedStats,
      top_owners: ownersResult.rows.map(row => ({
        owner_name: row.owner_name,
        property_count: parseInt(row.property_count) || 0,
        portfolio_value: parseFloat(row.portfolio_value) || 0,
        total_acres: parseFloat(row.total_acres) || 0
      })),
      property_types: typesResult.rows.map(row => ({
        property_type: row.property_type,
        count: parseInt(row.count) || 0,
        avg_value: parseFloat(row.avg_value) || 0,
        total_value: parseFloat(row.total_value) || 0
      })),
      zip_analysis: zipsResult.rows.map(row => ({
        zip: row.zip,
        property_count: parseInt(row.property_count) || 0,
        avg_value: parseFloat(row.avg_value) || 0,
        investor_owned: parseInt(row.investor_owned) || 0,
        total_acres: parseFloat(row.total_acres) || 0
      })),
      value_distribution: distributionResult.rows.map(row => ({
        value_range: row.value_range,
        count: parseInt(row.count) || 0
      })),
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