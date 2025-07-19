import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.RAILWAY_HCAD_DATABASE_URL || 'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway'
});

export async function GET() {
  try {
    // Get basic statistics
    const stats = await pool.query(`
      WITH property_stats AS (
        SELECT 
          COUNT(*) as total_properties,
          COUNT(total_value) as properties_with_values,
          SUM(total_value) as total_portfolio_value,
          AVG(total_value) as avg_property_value,
          COUNT(DISTINCT owner_name) as unique_owners,
          COUNT(CASE WHEN property_address != mail_address THEN 1 END) as non_owner_occupied
        FROM properties
      ),
      top_owners AS (
        SELECT 
          owner_name,
          COUNT(*) as property_count,
          SUM(total_value) as portfolio_value,
          SUM(area_acres) as total_acres
        FROM properties
        WHERE owner_name IS NOT NULL
        GROUP BY owner_name
        ORDER BY COUNT(*) DESC
        LIMIT 20
      ),
      property_types AS (
        SELECT 
          property_type,
          COUNT(*) as count,
          AVG(total_value) as avg_value,
          SUM(total_value) as total_value
        FROM properties
        WHERE property_type IS NOT NULL
        GROUP BY property_type
      ),
      zip_analysis AS (
        SELECT 
          zip,
          COUNT(*) as property_count,
          AVG(total_value) as avg_value,
          COUNT(CASE WHEN property_address != mail_address THEN 1 END) as investor_owned,
          SUM(area_acres) as total_acres
        FROM properties
        WHERE zip IS NOT NULL AND total_value > 0
        GROUP BY zip
        ORDER BY COUNT(*) DESC
        LIMIT 20
      ),
      value_distribution AS (
        SELECT 
          CASE 
            WHEN total_value < 100000 THEN 'Under $100k'
            WHEN total_value < 250000 THEN '$100k-$250k'
            WHEN total_value < 500000 THEN '$250k-$500k'
            WHEN total_value < 1000000 THEN '$500k-$1M'
            WHEN total_value < 5000000 THEN '$1M-$5M'
            ELSE 'Over $5M'
          END as value_range,
          COUNT(*) as count
        FROM properties
        WHERE total_value > 0
        GROUP BY 1
        ORDER BY 
          CASE value_range
            WHEN 'Under $100k' THEN 1
            WHEN '$100k-$250k' THEN 2
            WHEN '$250k-$500k' THEN 3
            WHEN '$500k-$1M' THEN 4
            WHEN '$1M-$5M' THEN 5
            ELSE 6
          END
      )
      SELECT 
        json_build_object(
          'stats', (SELECT row_to_json(ps.*) FROM property_stats ps),
          'top_owners', (SELECT json_agg(to_jsonb(to.*) ORDER BY property_count DESC) FROM top_owners to),
          'property_types', (SELECT json_agg(pt.*) FROM property_types pt),
          'zip_analysis', (SELECT json_agg(za.*) FROM zip_analysis za),
          'value_distribution', (SELECT json_agg(vd.*) FROM value_distribution vd)
        ) as data
    `);

    return NextResponse.json(stats.rows[0].data);
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Search for properties by various criteria
export async function POST(req: NextRequest) {
  try {
    const { searchType, searchValue } = await req.json();
    
    let query = '';
    let params: (string | number)[] = [];
    
    switch (searchType) {
      case 'owner':
        query = `
          SELECT 
            account_number,
            owner_name,
            property_address,
            mail_address,
            total_value,
            area_acres,
            property_type
          FROM properties
          WHERE LOWER(owner_name) LIKE LOWER($1)
          ORDER BY total_value DESC NULLS LAST
          LIMIT 100
        `;
        params = [`%${searchValue}%`];
        break;
        
      case 'address':
        query = `
          SELECT 
            account_number,
            owner_name,
            property_address,
            mail_address,
            total_value,
            area_acres,
            property_type
          FROM properties
          WHERE LOWER(property_address) LIKE LOWER($1)
          ORDER BY property_address
          LIMIT 100
        `;
        params = [`%${searchValue}%`];
        break;
        
      case 'zip':
        query = `
          SELECT 
            account_number,
            owner_name,
            property_address,
            mail_address,
            total_value,
            area_acres,
            property_type
          FROM properties
          WHERE zip = $1
          ORDER BY total_value DESC NULLS LAST
          LIMIT 100
        `;
        params = [searchValue];
        break;
        
      case 'high-value':
        query = `
          SELECT 
            account_number,
            owner_name,
            property_address,
            mail_address,
            total_value,
            area_acres,
            property_type
          FROM properties
          WHERE total_value > $1
          ORDER BY total_value DESC
          LIMIT 100
        `;
        params = [parseInt(searchValue) || 1000000];
        break;
    }
    
    const results = await pool.query(query, params);
    
    return NextResponse.json({
      results: results.rows,
      count: results.rowCount
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}