import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert at reading Harris County Appraisal District (HCAD) property records. Please extract ALL available property information from this HCAD screenshot and return it in JSON format. 

CRITICAL INSTRUCTIONS:
1. Extract EVERY piece of data visible in the image
2. For numeric values, return actual numbers (not strings)
3. For boolean values, return true/false
4. If a field is not visible or unclear, use null
5. Pay special attention to property address vs mailing address (they're often different)
6. Include a confidence score (0-100) for the overall extraction accuracy

Expected JSON structure:
{
  "propertyAddress": "string",
  "mailingAddress": "string", 
  "ownerName": "string",
  "parcelId": "string",
  "legalDescription": "string",
  "propertyType": "string",
  "landValue": number,
  "improvementValue": number,
  "totalValue": number,
  "exemptions": "string",
  "taxYear": "string",
  "neighborhood": "string",
  "acreage": number,
  "yearBuilt": number,
  "squareFootage": number,
  "lotSize": "string",
  "bedrooms": number,
  "bathrooms": number,
  "stories": number,
  "exteriorWall": "string",
  "roofType": "string",
  "foundation": "string",
  "heating": "string",
  "cooling": "string",
  "fireplace": boolean,
  "pool": boolean,
  "garage": "string",
  "confidence": number
}

Return ONLY the JSON object, no additional text or formatting.`
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
    if (!propertyData.propertyAddress && !propertyData.parcelId) {
      throw new Error('Could not extract essential property information');
    }

    return propertyData;
  } catch (error) {
    console.error('Error extracting property data:', error);
    throw new Error(`Failed to extract property data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix to get just the base64 string
      const base64String = base64.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
} 