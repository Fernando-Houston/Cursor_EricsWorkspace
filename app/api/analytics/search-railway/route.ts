import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function POST(req: NextRequest) {
  try {
    const { searchType, searchValue } = await req.json();
    
    if (!searchValue || searchValue.trim() === '') {
      return NextResponse.json({ results: [], count: 0 });
    }

    let query = '';
    let params: (string | number)[] = [];
    
    switch (searchType) {
      case 'account':
        query = `
          SELECT account_number, owner_name, property_address, mail_address, 
                 total_value::numeric as total_value, area_acres::numeric as area_acres, 
                 property_type, zip
          FROM properties 
          WHERE account_number = $1 OR account_number = $2
          LIMIT 25
        `;
        params = [searchValue, searchValue.replace(/\D/g, '')];
        break;
        
      case 'address':
        query = `
          SELECT account_number, owner_name, property_address, mail_address, 
                 total_value::numeric as total_value, area_acres::numeric as area_acres, 
                 property_type, zip
          FROM properties 
          WHERE LOWER(property_address) LIKE LOWER($1)
          LIMIT 25
        `;
        params = [`%${searchValue}%`];
        break;
        
      case 'zip':
        query = `
          SELECT account_number, owner_name, property_address, mail_address, 
                 total_value::numeric as total_value, area_acres::numeric as area_acres, 
                 property_type, zip
          FROM properties 
          WHERE zip = $1
          LIMIT 25
        `;
        params = [searchValue];
        break;
        
      case 'owner':
        query = `
          SELECT account_number, owner_name, property_address, mail_address, 
                 total_value::numeric as total_value, area_acres::numeric as area_acres, 
                 property_type, zip
          FROM properties 
          WHERE LOWER(owner_name) LIKE LOWER($1)
          LIMIT 25
        `;
        params = [`%${searchValue}%`];
        break;
        
      case 'high-value':
        const minValue = parseInt(searchValue) || 1000000;
        query = `
          SELECT account_number, owner_name, property_address, mail_address, 
                 total_value::numeric as total_value, area_acres::numeric as area_acres, 
                 property_type, zip
          FROM properties 
          WHERE total_value >= $1
          ORDER BY total_value DESC
          LIMIT 25
        `;
        params = [minValue];
        break;
        
      default:
        return NextResponse.json({ results: [], count: 0, error: 'Invalid search type' });
    }
    
    const result = await pool.query(query, params);
    
    // Convert numeric values to numbers
    const results = result.rows.map(row => ({
      ...row,
      total_value: row.total_value ? parseFloat(row.total_value) : null,
      area_acres: row.area_acres ? parseFloat(row.area_acres) : null
    }));
    
    return NextResponse.json({
      results,
      count: results.length,
      source: 'railway-live'
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      results: [],
      count: 0,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}