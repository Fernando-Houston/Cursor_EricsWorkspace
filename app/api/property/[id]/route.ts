import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Enhanced property database with smart features
const propertyDatabase: Record<string, any> = {
  "0010000010001": {
    // Basic Information
    account_number: "0010000010001",
    property_address: "800 MAIN ST",
    legal_description: "DOWNTOWN DISTRICT BLK 145 LOT 3",
    
    // Ownership
    owner_name: "DOWNTOWN HOLDINGS LLC",
    mail_address: "PO BOX 1234",
    ownership_history: [
      { owner: "DOWNTOWN HOLDINGS LLC", date: "2020-03-15", price: 11500000 },
      { owner: "MAIN STREET PROPERTIES", date: "2015-07-22", price: 8900000 },
      { owner: "HOUSTON DEVELOPMENT CO", date: "2008-11-30", price: 6200000 }
    ],
    
    // Property Characteristics
    property_type: "COMMERCIAL",
    year_built: 1982,
    area_acres: 0.45,
    square_feet: 125000,
    stories: 15,
    construction_type: "Steel Frame",
    foundation_type: "Concrete Slab",
    
    // Location
    zip: "77002",
    subdivision: "DOWNTOWN HOUSTON",
    city: "HOUSTON",
    school_district: "HOUSTON ISD",
    neighborhood: "Downtown",
    latitude: 29.7589,
    longitude: -95.3677,
    
    // Valuation
    total_value: 12500000,
    land_value: 4500000,
    improvement_value: 8000000,
    tax_amount: 287500,
    exemptions: [],
    
    // Smart Features
    market_analysis: {
      estimated_value: 13850000,
      confidence: 92,
      trend: "up" as const,
      growth_rate: 5.8
    },
    comparables: [
      { address: "1000 LOUISIANA ST", distance: 0.3, value: 85000000, price_per_sqft: 340 },
      { address: "1200 MCKINNEY ST", distance: 0.4, value: 45000000, price_per_sqft: 280 },
      { address: "600 TRAVIS ST", distance: 0.2, value: 32000000, price_per_sqft: 295 }
    ],
    investment_score: 85,
    rental_estimate: 18750
  },
  
  "0020000020001": {
    account_number: "0020000020001",
    property_address: "3800 RIVER OAKS BLVD",
    legal_description: "RIVER OAKS SEC 5 BLK 12 LOT 8",
    
    owner_name: "RIVER OAKS TRUST",
    mail_address: "3800 RIVER OAKS BLVD",
    ownership_history: [
      { owner: "RIVER OAKS TRUST", date: "2018-05-20", price: 7200000 },
      { owner: "JOHNSON FAMILY", date: "1995-03-15", price: 2100000 }
    ],
    
    property_type: "RESIDENTIAL",
    year_built: 1938,
    area_acres: 2.5,
    square_feet: 12500,
    bedrooms: 6,
    bathrooms: 8,
    stories: 2,
    construction_type: "Brick Veneer",
    foundation_type: "Pier & Beam",
    
    zip: "77019",
    subdivision: "RIVER OAKS",
    city: "HOUSTON",
    school_district: "HOUSTON ISD",
    neighborhood: "River Oaks",
    latitude: 29.7558,
    longitude: -95.4156,
    
    total_value: 8500000,
    land_value: 5500000,
    improvement_value: 3000000,
    tax_amount: 195500,
    exemptions: ["Homestead"],
    
    market_analysis: {
      estimated_value: 9200000,
      confidence: 88,
      trend: "stable" as const,
      growth_rate: 3.2
    },
    comparables: [
      { address: "3900 RIVER OAKS BLVD", distance: 0.1, value: 9500000, price_per_sqft: 720 },
      { address: "3700 RIVER OAKS BLVD", distance: 0.1, value: 7800000, price_per_sqft: 680 },
      { address: "2100 RIVER OAKS BLVD", distance: 0.8, value: 6200000, price_per_sqft: 650 }
    ],
    investment_score: 72,
    rental_estimate: 25000
  },
  
  "0030000030001": {
    account_number: "0030000030001",
    property_address: "924 HEIGHTS BLVD",
    legal_description: "HOUSTON HEIGHTS BLK 92 LOT 15",
    
    owner_name: "INVITATION HOMES",
    mail_address: "PO BOX 7890",
    ownership_history: [
      { owner: "INVITATION HOMES", date: "2021-08-10", price: 425000 },
      { owner: "GARCIA FAMILY", date: "2003-06-15", price: 185000 }
    ],
    
    property_type: "RESIDENTIAL",
    year_built: 1920,
    area_acres: 0.15,
    square_feet: 2200,
    bedrooms: 3,
    bathrooms: 2,
    stories: 1,
    construction_type: "Wood Frame",
    foundation_type: "Pier & Beam",
    
    zip: "77008",
    subdivision: "HOUSTON HEIGHTS",
    city: "HOUSTON",
    school_district: "HOUSTON ISD",
    neighborhood: "Heights",
    latitude: 29.7901,
    longitude: -95.3982,
    
    total_value: 485000,
    land_value: 285000,
    improvement_value: 200000,
    tax_amount: 11155,
    exemptions: [],
    
    market_analysis: {
      estimated_value: 515000,
      confidence: 85,
      trend: "up" as const,
      growth_rate: 7.2
    },
    comparables: [
      { address: "1012 HEIGHTS BLVD", distance: 0.1, value: 525000, price_per_sqft: 235 },
      { address: "847 HEIGHTS BLVD", distance: 0.1, value: 495000, price_per_sqft: 225 },
      { address: "1823 ASHLAND ST", distance: 0.3, value: 425000, price_per_sqft: 210 }
    ],
    investment_score: 88,
    rental_estimate: 2850
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = propertyDatabase[params.id];
    
    if (!property) {
      // Try to generate a property based on the ID pattern
      const generatedProperty = generatePropertyFromId(params.id);
      if (generatedProperty) {
        return NextResponse.json(generatedProperty);
      }
      
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(property);
    
  } catch (error) {
    console.error('Property detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property details' },
      { status: 500 }
    );
  }
}

// Generate realistic property data for any account number
function generatePropertyFromId(id: string): any {
  const num = parseInt(id.slice(-4)) || 1;
  const isCommercial = num % 5 === 0;
  const isHighValue = num % 3 === 0;
  
  const baseValue = isCommercial ? 5000000 : isHighValue ? 800000 : 350000;
  const value = baseValue + (num * 1000);
  
  return {
    account_number: id,
    property_address: `${1000 + num} ${getStreetName(num)} ${getStreetType(num)}`,
    legal_description: `SECTION ${Math.floor(num / 100)} BLOCK ${num % 100} LOT ${num % 10}`,
    
    owner_name: getOwnerName(num),
    mail_address: isCommercial ? `PO BOX ${num}` : `${1000 + num} ${getStreetName(num)} ${getStreetType(num)}`,
    
    property_type: isCommercial ? "COMMERCIAL" : "RESIDENTIAL",
    year_built: 1950 + (num % 70),
    area_acres: isCommercial ? 0.5 + (num % 10) / 10 : 0.1 + (num % 5) / 20,
    square_feet: isCommercial ? 20000 + num * 10 : 1500 + num % 2000,
    bedrooms: isCommercial ? undefined : 2 + (num % 4),
    bathrooms: isCommercial ? undefined : 1 + (num % 3),
    
    zip: `770${(num % 90 + 10).toString().padStart(2, '0')}`,
    city: "HOUSTON",
    school_district: "HOUSTON ISD",
    
    total_value: value,
    land_value: value * 0.3,
    improvement_value: value * 0.7,
    
    market_analysis: {
      estimated_value: value * (1.05 + (num % 10) / 100),
      confidence: 70 + (num % 25),
      trend: num % 3 === 0 ? "up" : num % 3 === 1 ? "stable" : "down",
      growth_rate: (num % 8) - 2
    },
    investment_score: 60 + (num % 35),
    rental_estimate: Math.round(value * 0.006)
  };
}

function getStreetName(num: number): string {
  const streets = ["MAIN", "ELM", "OAK", "PINE", "MAPLE", "CEDAR", "WASHINGTON", "HOUSTON", "TEXAS", "MEMORIAL"];
  return streets[num % streets.length];
}

function getStreetType(num: number): string {
  const types = ["ST", "AVE", "BLVD", "DR", "LN", "RD", "WAY", "CT", "PL"];
  return types[num % types.length];
}

function getOwnerName(num: number): string {
  const owners = [
    "SMITH FAMILY TRUST", "JOHNSON PROPERTIES LLC", "WILLIAMS INVESTMENTS",
    "BROWN HOLDINGS", "JONES REAL ESTATE", "GARCIA FAMILY",
    "MILLER DEVELOPMENT", "DAVIS PROPERTIES", "RODRIGUEZ LLC",
    "MARTINEZ INVESTMENTS"
  ];
  return owners[num % owners.length];
}