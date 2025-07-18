import { NextRequest, NextResponse } from 'next/server';
import { searchByAccountNumber, searchByAddress, searchByOwner } from '@/lib/google-cloud-db';

export async function POST(request: NextRequest) {
  try {
    const { accountNumber, address, owner } = await request.json();

    // Validate input
    if (!accountNumber && !address && !owner) {
      return NextResponse.json({
        success: false,
        error: 'Please provide accountNumber, address, or owner to search'
      }, { status: 400 });
    }

    let result = null;

    // Search based on provided criteria
    if (accountNumber) {
      console.log('Searching Google Cloud DB for account:', accountNumber);
      result = await searchByAccountNumber(accountNumber);
    } else if (address) {
      console.log('Searching Google Cloud DB for address:', address);
      result = await searchByAddress(address);
    } else if (owner) {
      console.log('Searching Google Cloud DB for owner:', owner);
      const results = await searchByOwner(owner);
      result = results[0]; // Return first match
    }

    if (result) {
      console.log('Found property in Google Cloud DB:', result);
      return NextResponse.json({
        success: true,
        source: 'google-cloud-db',
        data: result
      });
    } else {
      console.log('Property not found in Google Cloud DB');
      return NextResponse.json({
        success: false,
        message: 'Property not found in database',
        suggestion: 'Try web scraping as fallback'
      });
    }

  } catch (error) {
    console.error('Error searching Google Cloud DB:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database search failed'
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountNumber = searchParams.get('accountNumber');
  
  if (!accountNumber) {
    return NextResponse.json({
      success: true,
      message: 'Google Cloud DB search endpoint is active',
      usage: 'POST with { accountNumber, address, or owner }'
    });
  }

  // Allow GET requests for testing
  const result = await searchByAccountNumber(accountNumber);
  
  return NextResponse.json({
    success: !!result,
    data: result
  });
}