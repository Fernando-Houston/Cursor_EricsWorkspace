import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.RAILWAY_HCAD_DATABASE_URL || 'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway'
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    
    // Get recent changes
    const changes = await pool.query(`
      WITH change_summary AS (
        SELECT 
          DATE(change_date) as date,
          change_type,
          COUNT(*) as count
        FROM property_history
        WHERE change_date >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(change_date), change_type
      ),
      owner_changes AS (
        SELECT 
          ph.account_number,
          ph.old_value as previous_owner,
          ph.new_value as new_owner,
          ph.change_date,
          pe.property_address,
          pe.total_value
        FROM property_history ph
        JOIN properties_enhanced pe ON ph.account_number = pe.account_number
        WHERE ph.change_type = 'owner_change'
          AND ph.change_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY ph.change_date DESC
        LIMIT 100
      ),
      value_changes AS (
        SELECT 
          ph.account_number,
          pe.property_address,
          pe.owner_name,
          ph.old_value::numeric as old_value,
          ph.new_value::numeric as new_value,
          ROUND(((ph.new_value::numeric - ph.old_value::numeric) / NULLIF(ph.old_value::numeric, 0)) * 100, 2) as pct_change
        FROM property_history ph
        JOIN properties_enhanced pe ON ph.account_number = pe.account_number
        WHERE ph.change_type = 'value_change'
          AND ph.change_date >= CURRENT_DATE - INTERVAL '${days} days'
          AND ph.old_value::numeric > 0
        ORDER BY ABS(ph.new_value::numeric - ph.old_value::numeric) DESC
        LIMIT 100
      ),
      market_activity AS (
        SELECT 
          zip,
          COUNT(DISTINCT CASE WHEN change_type = 'owner_change' THEN account_number END) as transactions,
          COUNT(DISTINCT CASE WHEN change_type = 'value_change' THEN account_number END) as reappraisals,
          AVG(CASE WHEN property_type = 'value_change' THEN new_value::numeric END) as avg_new_value
        FROM property_history ph
        JOIN properties_enhanced pe ON ph.account_number = pe.account_number
        WHERE change_date >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY zip
        ORDER BY transactions DESC
        LIMIT 20
      )
      SELECT 
        json_build_object(
          'summary', (SELECT json_agg(cs.*) FROM change_summary cs),
          'owner_changes', (SELECT json_agg(oc.*) FROM owner_changes oc),
          'value_changes', (SELECT json_agg(vc.*) FROM value_changes vc),
          'market_activity', (SELECT json_agg(ma.*) FROM market_activity ma),
          'stats', json_build_object(
            'total_properties', (SELECT COUNT(*) FROM properties_enhanced WHERE is_active),
            'properties_with_values', (SELECT COUNT(*) FROM properties_enhanced WHERE total_value > 0 OR estimated_value > 0),
            'total_portfolio_value', (SELECT SUM(COALESCE(total_value, estimated_value)) FROM properties_enhanced),
            'last_import', (SELECT MAX(import_date) FROM import_batches WHERE status = 'completed')
          )
        ) as analytics
    `);

    return NextResponse.json(changes.rows[0].analytics);
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Get specific property history
export async function POST(req: NextRequest) {
  try {
    const { account_number } = await req.json();
    
    const history = await pool.query(`
      SELECT 
        ph.*,
        pe.property_address,
        pe.owner_name as current_owner,
        pe.total_value as current_value
      FROM property_history ph
      JOIN properties_enhanced pe ON ph.account_number = pe.account_number
      WHERE ph.account_number = $1
      ORDER BY ph.change_date DESC
    `, [account_number]);

    const timeline = await pool.query(`
      WITH monthly_values AS (
        SELECT 
          DATE_TRUNC('month', change_date) as month,
          MAX(new_value::numeric) as value
        FROM property_history
        WHERE account_number = $1
          AND field_name = 'total_value'
          AND new_value::numeric > 0
        GROUP BY DATE_TRUNC('month', change_date)
      )
      SELECT 
        month,
        value,
        LAG(value) OVER (ORDER BY month) as prev_value,
        value - LAG(value) OVER (ORDER BY month) as change
      FROM monthly_values
      ORDER BY month
    `, [account_number]);

    return NextResponse.json({
      property: history.rows[0],
      history: history.rows,
      timeline: timeline.rows
    });
    
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property history' },
      { status: 500 }
    );
  }
}