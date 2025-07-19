import { NextResponse } from 'next/server';
import { searchByAccountNumber } from '@/lib/google-cloud-db';

export async function GET() {
  try {
    // Test the exact same search that property-info would do
    const testParcelId = '0660640130020';
    
    console.log('Testing property search...');
    console.log('Environment check:');
    console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('- Searching for:', testParcelId);
    
    const dbResult = await searchByAccountNumber(testParcelId);
    
    if (dbResult) {
      // Format it like property-info would
      const formatted = {
        propertyAddress: dbResult.propertyAddress || 'Not Found',
        mailingAddress: dbResult.mailingAddress || 'Not Found',
        owner: dbResult.owner || 'Not Found',
        appraisal: dbResult.totalValue ? `$${Number(dbResult.totalValue).toLocaleString()}` : 
                  dbResult.assessedValue ? `$${Number(dbResult.assessedValue).toLocaleString()}` :
                  'Not Available',
        size: dbResult.squareFootage ? `${dbResult.squareFootage} sq ft` : 
              dbResult.lotSize || 
              'Not Available',
        parcelId: testParcelId,
        source: 'google-cloud-db',
        confidence: 100
      };
      
      return NextResponse.json({
        success: true,
        message: 'This is what should appear in your app',
        expected: formatted,
        raw: dbResult
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Property not found'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}