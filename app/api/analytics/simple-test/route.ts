import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test with a simple fetch to avoid connection pooling issues
    const { Client } = require('pg');
    
    // Try the original Harris County database
    const client = new Client({
      connectionString: 'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway',
      ssl: { rejectUnauthorized: false }, // Railway requires SSL
      connectionTimeoutMillis: 20000 // 20 seconds
    });

    await client.connect();
    
    // Simple count query
    const result = await client.query('SELECT COUNT(*) as total FROM properties LIMIT 1');
    const count = result.rows[0].total;
    
    await client.end();
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully!',
      propertyCount: count,
      database: 'Harris County Original'
    });
    
  } catch (error) {
    console.error('Connection error:', error);
    
    // If original fails, try the GOAT database
    try {
      const { Client } = require('pg');
      const client2 = new Client({
        connectionString: 'postgresql://postgres:wkmQNTkDRqnFJGBkPvRFCwiClgEbCRKl@tramway.proxy.rlwy.net:31762/railway',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 20000
      });

      await client2.connect();
      const result2 = await client2.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      await client2.end();
      
      return NextResponse.json({
        success: true,
        message: 'Connected to GOAT database instead',
        tables: result2.rows.map((r: any) => r.table_name),
        note: 'Original database timed out, but GOAT database is accessible'
      });
      
    } catch (error2) {
      return NextResponse.json({
        success: false,
        error: 'Both databases failed to connect',
        original_error: error instanceof Error ? error.message : 'Unknown',
        goat_error: error2 instanceof Error ? error2.message : 'Unknown',
        suggestion: 'Railway databases might be sleeping or have connection limits'
      });
    }
  }
}