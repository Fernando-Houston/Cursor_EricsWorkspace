import { NextResponse } from 'next/server';
import { searchByAccountNumber } from '@/lib/google-cloud-db';

export async function GET() {
  try {
    const testAccount = '0660640130020';
    console.log(`Searching for appraisal data: ${testAccount}`);
    
    const result = await searchByAccountNumber(testAccount);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Property found - checking appraisal fields',
        appraisalFields: {
          appraisedValue: result.appraisedValue,
          totalValue: result.totalValue,
          landValue: result.landValue,
          improvementValue: result.improvementValue,
          assessedValue: (result as any).assessedValue, // Check if this field exists
        },
        allFields: Object.keys(result),
        rawResult: result
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Property not found'
      });
    }
  } catch (error) {
    console.error('Appraisal test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}