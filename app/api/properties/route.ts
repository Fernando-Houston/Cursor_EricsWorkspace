import { NextRequest, NextResponse } from 'next/server';
import { saveProperty, getProperties, searchProperties, deleteProperty } from '@/lib/db/railway';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let result;
    if (query) {
      result = await searchProperties(query);
    } else {
      result = await getProperties(limit, offset);
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        properties: result.data 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/properties:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const propertyData = await request.json();
    
    if (!propertyData.accountNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Account number is required' 
      }, { status: 400 });
    }

    const result = await saveProperty(propertyData);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Property saved successfully',
        data: result.data 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/properties:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountNumber = searchParams.get('accountNumber');

    if (!accountNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Account number is required' 
      }, { status: 400 });
    }

    const result = await deleteProperty(accountNumber);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Property deleted successfully',
        data: result.data 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in DELETE /api/properties:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}