import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Sample property data for search functionality
const sampleProperties = [
  // Downtown Houston
  { account_number: "0010000010001", owner_name: "DOWNTOWN HOLDINGS LLC", property_address: "800 MAIN ST", mail_address: "PO BOX 1234", total_value: 12500000, area_acres: 0.45, property_type: "COMMERCIAL", zip: "77002" },
  { account_number: "0010000010002", owner_name: "HOUSTON CENTER LP", property_address: "1200 MCKINNEY ST", mail_address: "1200 MCKINNEY ST", total_value: 45000000, area_acres: 1.2, property_type: "COMMERCIAL", zip: "77002" },
  { account_number: "0010000010003", owner_name: "WELLS FARGO BANK", property_address: "1000 LOUISIANA ST", mail_address: "1000 LOUISIANA ST", total_value: 85000000, area_acres: 0.8, property_type: "COMMERCIAL", zip: "77002" },
  
  // River Oaks
  { account_number: "0020000020001", owner_name: "RIVER OAKS TRUST", property_address: "3800 RIVER OAKS BLVD", mail_address: "3800 RIVER OAKS BLVD", total_value: 8500000, area_acres: 2.5, property_type: "RESIDENTIAL", zip: "77019" },
  { account_number: "0020000020002", owner_name: "JOHNSON FAMILY TRUST", property_address: "2100 RIVER OAKS BLVD", mail_address: "2100 RIVER OAKS BLVD", total_value: 6200000, area_acres: 1.8, property_type: "RESIDENTIAL", zip: "77019" },
  
  // Heights
  { account_number: "0030000030001", owner_name: "INVITATION HOMES", property_address: "924 HEIGHTS BLVD", mail_address: "PO BOX 7890", total_value: 485000, area_acres: 0.15, property_type: "RESIDENTIAL", zip: "77008" },
  { account_number: "0030000030002", owner_name: "AMERICAN HOMES 4 RENT", property_address: "1823 ASHLAND ST", mail_address: "PO BOX 4567", total_value: 425000, area_acres: 0.12, property_type: "RESIDENTIAL", zip: "77008" },
  
  // Montrose
  { account_number: "0040000040001", owner_name: "MONTROSE PROPERTIES LLC", property_address: "4100 MONTROSE BLVD", mail_address: "4100 MONTROSE BLVD", total_value: 3200000, area_acres: 0.35, property_type: "COMMERCIAL", zip: "77006" },
  { account_number: "0040000040002", owner_name: "CAFE HOLDINGS INC", property_address: "1520 WESTHEIMER RD", mail_address: "1520 WESTHEIMER RD", total_value: 2800000, area_acres: 0.25, property_type: "COMMERCIAL", zip: "77006" },
  
  // Medical Center
  { account_number: "0050000050001", owner_name: "METHODIST HOSPITAL SYSTEM", property_address: "6565 FANNIN ST", mail_address: "6565 FANNIN ST", total_value: 125000000, area_acres: 5.2, property_type: "EXEMPT", zip: "77030" },
  { account_number: "0050000050002", owner_name: "TEXAS MEDICAL CENTER", property_address: "2450 HOLCOMBE BLVD", mail_address: "2450 HOLCOMBE BLVD", total_value: 95000000, area_acres: 4.8, property_type: "EXEMPT", zip: "77030" },
  
  // Energy Corridor
  { account_number: "0060000060001", owner_name: "SHELL OIL COMPANY", property_address: "16945 NORTHCHASE DR", mail_address: "16945 NORTHCHASE DR", total_value: 185000000, area_acres: 12.5, property_type: "COMMERCIAL", zip: "77060" },
  { account_number: "0060000060002", owner_name: "BP AMERICA INC", property_address: "501 WESTLAKE PARK BLVD", mail_address: "501 WESTLAKE PARK BLVD", total_value: 165000000, area_acres: 10.2, property_type: "COMMERCIAL", zip: "77079" },
];

export async function POST(req: NextRequest) {
  try {
    const { searchType, searchValue } = await req.json();
    
    if (!searchValue || searchValue.trim() === '') {
      return NextResponse.json({ results: [], count: 0 });
    }
    
    let results = sampleProperties;
    const searchLower = searchValue.toLowerCase();
    
    switch (searchType) {
      case 'owner':
        results = sampleProperties.filter(p => 
          p.owner_name.toLowerCase().includes(searchLower)
        );
        break;
        
      case 'address':
        results = sampleProperties.filter(p => 
          p.property_address.toLowerCase().includes(searchLower)
        );
        break;
        
      case 'zip':
        results = sampleProperties.filter(p => 
          p.zip === searchValue
        );
        break;
        
      case 'high-value':
        const minValue = parseInt(searchValue) || 1000000;
        results = sampleProperties.filter(p => 
          p.total_value >= minValue
        ).sort((a, b) => b.total_value - a.total_value);
        break;
    }
    
    return NextResponse.json({
      results: results.slice(0, 100),
      count: results.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      results: [],
      count: 0,
      error: 'Search failed'
    });
  }
}