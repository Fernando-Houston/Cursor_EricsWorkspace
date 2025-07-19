import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    railway: {
      connected: false,
      error: null as string | null,
      tables: [] as string[]
    }
  };

  if (process.env.RAILWAY_HCAD_DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
      ssl: false,
      connectionTimeoutMillis: 5000,
    });

    try {
      // Test connection
      const client = await pool.connect();
      
      // Get table count
      const tablesResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      // Get properties count
      const propertiesResult = await client.query('SELECT COUNT(*) as count FROM properties LIMIT 1');
      
      checks.railway = {
        connected: true,
        error: null,
        tables: [`${tablesResult.rows[0].count} tables`, `${propertiesResult.rows[0].count} properties`]
      };
      
      client.release();
    } catch (error) {
      checks.railway.error = error instanceof Error ? error.message : 'Unknown error';
      checks.status = 'error';
    } finally {
      await pool.end();
    }
  } else {
    checks.railway.error = 'RAILWAY_HCAD_DATABASE_URL not configured';
    checks.status = 'error';
  }

  return NextResponse.json(checks);
}