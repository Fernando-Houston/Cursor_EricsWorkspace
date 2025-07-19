import { NextResponse } from 'next/server';
import { searchByAccountNumber } from '@/lib/google-cloud-db';

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('Environment variables present:');
    console.log('- DATABASE_URL:', !!process.env.DATABASE_URL);
    console.log('- GOOGLE_CLOUD_DATABASE_URL:', !!process.env.GOOGLE_CLOUD_DATABASE_URL);
    console.log('- GOOGLE_CLOUD_SQL_HOST:', process.env.GOOGLE_CLOUD_SQL_HOST);
    
    // Test search
    const testAccount = '0660640130020';
    console.log(`\nSearching for account: ${testAccount}`);
    
    const result = await searchByAccountNumber(testAccount);
    
    return NextResponse.json({
      success: true,
      environmentVars: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasGoogleCloudUrl: !!process.env.GOOGLE_CLOUD_DATABASE_URL,
        hasHost: !!process.env.GOOGLE_CLOUD_SQL_HOST,
        host: process.env.GOOGLE_CLOUD_SQL_HOST
      },
      searchResult: result,
      message: result ? 'Property found in database!' : 'Property not found'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environmentVars: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasGoogleCloudUrl: !!process.env.GOOGLE_CLOUD_DATABASE_URL,
        hasHost: !!process.env.GOOGLE_CLOUD_SQL_HOST
      }
    }, { status: 500 });
  }
}