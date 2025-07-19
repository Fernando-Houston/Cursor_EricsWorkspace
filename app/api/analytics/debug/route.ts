import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    // Test database connection
    const connectionString = process.env.RAILWAY_HCAD_DATABASE_URL;
    
    if (!connectionString) {
      return NextResponse.json({
        error: 'Database connection string not found',
        env: 'RAILWAY_HCAD_DATABASE_URL is not set'
      }, { status: 500 });
    }

    const pool = new Pool({ connectionString });

    // Try a simple query first
    const testResult = await pool.query('SELECT COUNT(*) as count FROM properties LIMIT 1');
    
    // If that works, try the stats query
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_properties,
        COUNT(total_value) as properties_with_values,
        COALESCE(SUM(total_value), 0) as total_portfolio_value,
        COALESCE(AVG(total_value), 0) as avg_property_value,
        COUNT(DISTINCT owner_name) as unique_owners,
        COUNT(CASE WHEN property_address != mail_address THEN 1 END) as non_owner_occupied
      FROM properties
    `);

    await pool.end();

    return NextResponse.json({
      success: true,
      connection: 'Database connected successfully',
      test: testResult.rows[0],
      stats: statsResult.rows[0]
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}