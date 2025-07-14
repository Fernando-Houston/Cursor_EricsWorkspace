import { NextRequest, NextResponse } from 'next/server';

// Mock HCAD data based on the screenshots provided
// This simulates the actual HCAD website response structure
function getMockHCADData(parcelId: string) {
  // Based on the screenshots, this data matches the parcel ID 0660640130020
  if (parcelId === '0660640130020') {
    return {
      ownerName: 'GATHMA LLC',
      propertyAddress: '5412 IRVINGTON BLVD, HOUSTON TX 77009',
      mailingAddress: '711 QUITMAN ST, HOUSTON TX 77009-8115',
      legalDescription: 'LTS 20 & 21 BLK 13 LINDALE PARK SEC 2',
      stateClassCode: 'C1 -- Real, Vacant Lots/Tracts (In City)',
      landUseCode: '1000 -- Residential Vacant',
      landArea: '11,681 SF',
      totalLivingArea: '0 SF',
      neighborhood: '7049',
      marketArea: '150 -- 1E Ryan, Irvington, Lindale Areas',
      landValue: '$363,157',
      improvementValue: '$0',
      totalValuation: '$363,157',
      taxYear: '2025'
    };
  }
  
  // For other parcel IDs, return empty data to simulate "not found"
  return {
    ownerName: '',
    propertyAddress: '',
    mailingAddress: '',
    legalDescription: '',
    stateClassCode: '',
    landUseCode: '',
    landArea: '',
    totalLivingArea: '',
    neighborhood: '',
    marketArea: '',
    landValue: '',
    improvementValue: '',
    totalValuation: '',
    taxYear: '',
    error: 'No property data found for this parcel ID'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { parcelId } = await request.json();
    
    if (!parcelId) {
      return NextResponse.json({ error: 'Parcel ID is required' }, { status: 400 });
    }

    console.log(`🔍 Searching HCAD for parcel ID: ${parcelId}`);
    
    // Mock implementation based on the provided screenshots
    // In a real implementation, this would scrape the actual HCAD website
    const propertyData = getMockHCADData(parcelId);
    
    return NextResponse.json({
      success: true,
      data: propertyData,
      parcelId
    });

  } catch (error) {
    console.error('HCAD search error:', error);
    return NextResponse.json(
      { error: 'Failed to search HCAD property data' },
      { status: 500 }
    );
  }
}

// This function would be used for actual HTML parsing in a real implementation
// For now, it's replaced with the mock data function above 