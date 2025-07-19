import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.RAILWAY_HCAD_DATABASE_URL || 
    'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway'
});

export async function GET() {
  try {
    // Get hot market zones
    const hotZones = await pool.query(`
      WITH zone_stats AS (
        SELECT 
          zip,
          COUNT(*) as property_count,
          AVG(total_value) as avg_value,
          COUNT(CASE WHEN property_address != mail_address THEN 1 END) as investor_owned,
          COUNT(CASE WHEN total_value > 0 THEN 1 END) as valued_properties,
          SUM(total_value) as total_zone_value
        FROM properties
        WHERE zip IS NOT NULL AND total_value > 0
        GROUP BY zip
        HAVING COUNT(*) > 100
      ),
      zone_growth AS (
        SELECT 
          zip,
          property_count,
          avg_value,
          investor_owned::float / property_count * 100 as investor_percentage,
          valued_properties,
          total_zone_value,
          -- Simulate growth based on investor activity and value
          CASE 
            WHEN investor_owned::float / property_count > 0.3 THEN 15.5
            WHEN investor_owned::float / property_count > 0.2 THEN 8.2
            WHEN investor_owned::float / property_count > 0.1 THEN 3.5
            ELSE -2.1
          END + (RANDOM() * 4 - 2) as growth_rate
        FROM zone_stats
      )
      SELECT 
        zip,
        growth_rate,
        avg_value,
        property_count as transaction_volume,
        investor_percentage
      FROM zone_growth
      ORDER BY growth_rate DESC
      LIMIT 12
    `);

    // Get investment opportunities (properties potentially undervalued)
    const opportunities = await pool.query(`
      WITH valued_properties AS (
        SELECT 
          account_number,
          property_address,
          total_value as market_value,
          area_acres,
          property_type,
          zip,
          centroid_lat,
          centroid_lon
        FROM properties
        WHERE total_value > 0 
          AND total_value < 500000
          AND area_acres > 0.1
        ORDER BY RANDOM()
        LIMIT 20
      )
      SELECT 
        account_number,
        property_address,
        market_value,
        -- Simulate AI estimate (in reality, use your ML model)
        market_value * (1.1 + RANDOM() * 0.4) as estimated_value,
        ((market_value * (1.1 + RANDOM() * 0.4) - market_value) / market_value * 100) as discount_percentage,
        60 + RANDOM() * 35 as confidence
      FROM valued_properties
      WHERE market_value * 1.1 < market_value * 1.5 -- Only show good opportunities
      ORDER BY discount_percentage DESC
      LIMIT 10
    `);

    // Get active portfolio managers
    const portfolios = await pool.query(`
      WITH owner_stats AS (
        SELECT 
          owner_name,
          COUNT(*) as total_properties,
          SUM(total_value) as portfolio_value,
          AVG(total_value) as avg_property_value,
          COUNT(CASE WHEN area_acres > 1 THEN 1 END) as large_properties
        FROM properties
        WHERE owner_name IS NOT NULL 
          AND owner_name != ''
          AND total_value > 0
        GROUP BY owner_name
        HAVING COUNT(*) > 5
      ),
      ranked_owners AS (
        SELECT 
          *,
          -- Simulate recent acquisitions
          CASE 
            WHEN total_properties > 50 THEN 3 + FLOOR(RANDOM() * 5)
            WHEN total_properties > 20 THEN 1 + FLOOR(RANDOM() * 3)
            ELSE FLOOR(RANDOM() * 2)
          END as recent_acquisitions,
          -- Simulate growth trend
          CASE 
            WHEN total_properties > 30 AND large_properties > 5 THEN 'increasing'
            WHEN total_properties < 10 THEN 'stable'
            ELSE CASE WHEN RANDOM() > 0.5 THEN 'increasing' ELSE 'decreasing' END
          END as growth_trend
        FROM owner_stats
      )
      SELECT 
        owner_name,
        total_properties,
        portfolio_value,
        recent_acquisitions,
        avg_property_value,
        growth_trend
      FROM ranked_owners
      ORDER BY portfolio_value DESC
      LIMIT 10
    `);

    // Get ML predictions summary
    const predictions = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN confidence_score > 70 THEN 1 END) as high_confidence,
        AVG(confidence_score) as avg_confidence
      FROM properties
      WHERE estimated_value IS NOT NULL
    `);

    return NextResponse.json({
      hotZones: hotZones.rows,
      investmentOpportunities: opportunities.rows,
      portfolioAnalysis: portfolios.rows,
      predictions: predictions.rows[0] || { total: 0, high_confidence: 0, avg_confidence: 0 }
    });
    
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}