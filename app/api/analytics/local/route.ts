import { NextResponse } from 'next/server';

// This is a mock API that returns sample data for testing
// Replace this with actual database queries once connection is fixed
export async function GET() {
  try {
    // Sample data based on your HCAD database structure
    const mockData = {
      stats: {
        total_properties: 1774951,
        properties_with_values: 1650000,
        total_portfolio_value: 750000000000, // $750B
        avg_property_value: 454545,
        unique_owners: 850000,
        non_owner_occupied: 425000
      },
      top_owners: [
        { owner_name: "HOUSTON ISD", property_count: 850, portfolio_value: 2500000000, total_acres: 3200 },
        { owner_name: "HARRIS COUNTY", property_count: 650, portfolio_value: 1800000000, total_acres: 2800 },
        { owner_name: "CITY OF HOUSTON", property_count: 580, portfolio_value: 1500000000, total_acres: 2100 },
        { owner_name: "MEMORIAL HERMANN HEALTH", property_count: 120, portfolio_value: 950000000, total_acres: 450 },
        { owner_name: "METHODIST HOSPITAL", property_count: 95, portfolio_value: 850000000, total_acres: 380 }
      ],
      property_types: [
        { property_type: "RESIDENTIAL", count: 1450000, avg_value: 350000, total_value: 507500000000 },
        { property_type: "COMMERCIAL", count: 85000, avg_value: 2500000, total_value: 212500000000 },
        { property_type: "INDUSTRIAL", count: 35000, avg_value: 1800000, total_value: 63000000000 },
        { property_type: "VACANT LAND", count: 180000, avg_value: 75000, total_value: 13500000000 }
      ],
      zip_analysis: [
        { zip: "77002", property_count: 15420, avg_value: 425000, investor_owned: 4250, total_acres: 8500 },
        { zip: "77003", property_count: 12850, avg_value: 380000, investor_owned: 3500, total_acres: 6200 },
        { zip: "77004", property_count: 18900, avg_value: 520000, investor_owned: 5200, total_acres: 9800 },
        { zip: "77005", property_count: 22100, avg_value: 850000, investor_owned: 4500, total_acres: 11200 },
        { zip: "77006", property_count: 19500, avg_value: 680000, investor_owned: 5800, total_acres: 8900 }
      ],
      value_distribution: [
        { value_range: "Under $100k", count: 285000 },
        { value_range: "$100k-$250k", count: 520000 },
        { value_range: "$250k-$500k", count: 480000 },
        { value_range: "$500k-$1M", count: 285000 },
        { value_range: "$1M-$5M", count: 65000 },
        { value_range: "Over $5M", count: 15000 }
      ]
    };

    return NextResponse.json(mockData);
    
  } catch (error) {
    console.error('Local data error:', error);
    return NextResponse.json({
      stats: {
        total_properties: 0,
        properties_with_values: 0,
        total_portfolio_value: 0,
        avg_property_value: 0,
        unique_owners: 0,
        non_owner_occupied: 0
      },
      top_owners: [],
      property_types: [],
      zip_analysis: [],
      value_distribution: []
    });
  }
}

// Mock search endpoint
export async function POST() {
  // Return sample search results
  const sampleResults = [
    {
      account_number: "0010000010001",
      owner_name: "SAMPLE OWNER LLC",
      property_address: "123 MAIN ST",
      mail_address: "PO BOX 456",
      total_value: 450000,
      area_acres: 0.25,
      property_type: "COMMERCIAL"
    },
    {
      account_number: "0010000010002",
      owner_name: "SAMPLE OWNER LLC",
      property_address: "125 MAIN ST",
      mail_address: "PO BOX 456",
      total_value: 380000,
      area_acres: 0.20,
      property_type: "COMMERCIAL"
    }
  ];

  return NextResponse.json({
    results: sampleResults,
    count: 2
  });
}