import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const databases = [
    {
      name: 'Postgres-Harris County (Original)',
      url: 'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway'
    },
    {
      name: 'Postgres-GOAT Screenshots (New)',
      url: 'postgresql://postgres:wkmQNTkDRqnFJGBkPvRFCwiClgEbCRKl@tramway.proxy.rlwy.net:31762/railway'
    }
  ];

  const results = [];

  for (const db of databases) {
    try {
      const pool = new Pool({ 
        connectionString: db.url,
        connectionTimeoutMillis: 5000
      });
      
      const countResult = await pool.query('SELECT COUNT(*) as count FROM properties LIMIT 1');
      await pool.end();
      
      results.push({
        database: db.name,
        status: 'Connected',
        propertyCount: countResult.rows[0].count,
        url: db.url.replace(/:[^:@]+@/, ':****@') // Hide password
      });
    } catch (error) {
      results.push({
        database: db.name,
        status: 'Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        url: db.url.replace(/:[^:@]+@/, ':****@') // Hide password
      });
    }
  }

  return NextResponse.json({ results });
}