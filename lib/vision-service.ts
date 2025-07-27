import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface PropertyData {
  propertyAddress: string;
  mailingAddress: string;
  ownerName: string;
  parcelId: string;
  legalDescription: string;
  propertyType: string;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  exemptions: string;
  taxYear: string;
  neighborhood: string;
  acreage: number;
  yearBuilt: number;
  squareFootage: number;
  lotSize: string;
  bedrooms: number;
  bathrooms: number;
  stories: number;
  exteriorWall: string;
  roofType: string;
  foundation: string;
  heating: string;
  cooling: string;
  fireplace: boolean;
  pool: boolean;
  garage: string;
  confidence: number;
  [key: string]: unknown;
  // Enhanced data fields (optional)
  recentAppraisals?: Array<{
    year: string;
    landValue: number;
    improvementValue: number;
    totalValue: number;
  }>;
  taxHistory?: Array<{
    year: string;
    taxAmount: number;
    taxRate: number;
    exemptions: string;
  }>;
  salesHistory?: Array<{
    date: string;
    price: number;
    documentType: string;
  }>;
  propertyDetails?: {
    subdivision: string;
    schoolDistrict: string;
    municipalUtilityDistrict: string;
    floodZone: string;
    deed: string;
  };
  enhancedConfidence?: number;
}

export async function extractPropertyData(imageBase64: string): Promise<PropertyData> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured');
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert at reading Harris County Appraisal District (HCAD) property records from various interface types. Please extract ALL available property information from this HCAD screenshot and return it in JSON format.

HCAD INTERFACE TYPES TO RECOGNIZE:
1. **Map View Interface**: Shows aerial map with property boundaries, search bar at top, property info panel at bottom
2. **Property Detail Page**: Traditional tabular layout with detailed property information
3. **Search Results**: List of properties with basic information
4. **Appraisal History**: Shows historical values and assessments

CRITICAL EXTRACTION INSTRUCTIONS:

🔍 **PRIMARY DATA LOCATIONS**:
- **Bottom Panel/Card**: Often contains Owner, Address, Parcel ID
- **Map Labels**: Property numbers, addresses on map overlay
- **Search Bar**: May show current property address
- **Side Panels**: Detailed property characteristics
- **Tables**: Appraisal values, tax information, building details

🏠 **ESSENTIAL FIELDS TO EXTRACT**:
- **Owner Name**: Look for "Owner", "Property Owner", company names (LLC, INC, etc.)
- **Property Address**: Street address of the actual property location
- **Mailing Address**: Where tax bills are sent (often different from property address)
- **Parcel ID**: Long numeric identifier (e.g., "0660640130020")

💰 **FINANCIAL DATA**:
- **Land Value**: Raw land worth
- **Improvement Value**: Building/structure value
- **Total Value**: Combined appraised value
- **Market Value**: Current market assessment
- **Exemptions**: Homestead, senior, veteran, etc.

🏘️ **PROPERTY CHARACTERISTICS**:
- **Property Type**: Residential, Commercial, Vacant Land, etc.
- **Year Built**: Construction year
- **Square Footage**: Living/building area
- **Lot Size**: Property dimensions
- **Bedrooms/Bathrooms**: For residential properties
- **Stories**: Number of floors

📍 **LOCATION DETAILS**:
- **Neighborhood**: Subdivision or area name
- **School District**: Educational district
- **Legal Description**: Lot, block, subdivision details

🚨 **SPECIAL HANDLING**:
- **Vacant Lots**: May only show owner, address, parcel ID, land value
- **Multiple Buildings**: Extract primary structure info
- **Commercial Properties**: Focus on total area, property type
- **Map Coordinates**: If visible, note approximate location

RESPONSE FORMAT:
Return ONLY a JSON object with this exact structure:
{
  "propertyAddress": "string or null",
  "mailingAddress": "string or null", 
  "ownerName": "string or null",
  "parcelId": "string or null",
  "legalDescription": "string or null",
  "propertyType": "string or null",
  "landValue": number or null,
  "improvementValue": number or null,
  "totalValue": number or null,
  "exemptions": "string or null",
  "taxYear": "string or null",
  "neighborhood": "string or null",
  "acreage": number or null,
  "yearBuilt": number or null,
  "squareFootage": number or null,
  "lotSize": "string or null",
  "bedrooms": number or null,
  "bathrooms": number or null,
  "stories": number or null,
  "exteriorWall": "string or null",
  "roofType": "string or null",
  "foundation": "string or null",
  "heating": "string or null",
  "cooling": "string or null",
  "fireplace": boolean or null,
  "pool": boolean or null,
  "garage": "string or null",
  "confidence": number
}

EXTRACTION RULES:
- For numeric values: Return actual numbers (150000, not "150,000")
- For boolean values: Return true/false/null
- For missing data: Use null, not empty strings
- For addresses: Include full address with city, state, zip if visible
- For confidence: Rate 0-100 based on data clarity and completeness

EXAMPLE EXTRACTIONS:
- "GATHMA LLC" → ownerName: "GATHMA LLC"
- "5412 IRVINGTON" → propertyAddress: "5412 IRVINGTON"
- "0660640130020" → parcelId: "0660640130020"
- "$45,000" → landValue: 45000
- "Vacant Land" → propertyType: "Vacant Land"

Return ONLY the JSON object, no additional text or markdown formatting.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI Vision API');
    }

    // Parse the JSON response
    const propertyData = JSON.parse(content) as PropertyData;
    
    // Validate that we have essential fields
    if (!propertyData.propertyAddress && !propertyData.parcelId && !propertyData.ownerName) {
      throw new Error('Could not extract essential property information from HCAD screenshot');
    }

    return propertyData;
  } catch (error) {
    console.error('Error extracting property data:', error);
    throw new Error(`Failed to extract property data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Note: convertImageToBase64 function removed - file conversion now handled directly in API route
// to avoid FileReader dependency which is browser-only 