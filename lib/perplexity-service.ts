export interface EnhancedPropertyData {
  recentAppraisals: Array<{
    year: string;
    landValue: number;
    improvementValue: number;
    totalValue: number;
  }>;
  taxHistory: Array<{
    year: string;
    taxAmount: number;
    taxRate: number;
    exemptions: string;
  }>;
  salesHistory: Array<{
    date: string;
    price: number;
    documentType: string;
  }>;
  propertyDetails: {
    subdivision: string;
    schoolDistrict: string;
    municipalUtilityDistrict: string;
    floodZone: string;
    deed: string;
  };
  confidence: number;
}

export async function enhancePropertyData(parcelId: string, propertyAddress: string): Promise<EnhancedPropertyData | null> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: `Search the Harris County Appraisal District (HCAD) website for additional property information for parcel ID "${parcelId}" and property address "${propertyAddress}". 

Please find and extract:
1. Recent appraisal history (last 5 years)
2. Tax payment history 
3. Sales/transfer history
4. Property details (subdivision, school district, MUD, flood zone, deed info)

Return the data in this JSON format:
{
  "recentAppraisals": [
    {
      "year": "2024",
      "landValue": 45000,
      "improvementValue": 155000,
      "totalValue": 200000
    }
  ],
  "taxHistory": [
    {
      "year": "2024",
      "taxAmount": 4500,
      "taxRate": 2.25,
      "exemptions": "Homestead"
    }
  ],
  "salesHistory": [
    {
      "date": "2021-03-15",
      "price": 180000,
      "documentType": "Warranty Deed"
    }
  ],
  "propertyDetails": {
    "subdivision": "Oak Forest",
    "schoolDistrict": "Houston ISD",
    "municipalUtilityDistrict": "MUD 123",
    "floodZone": "X",
    "deed": "Book 1234, Page 567"
  },
  "confidence": 85
}

If you cannot find the property or data, return null. Focus on the official HCAD website data.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return null;
    }

    // Try to parse JSON from the response
    try {
      const enhancedData = JSON.parse(content) as EnhancedPropertyData;
      return enhancedData;
    } catch (parseError) {
      console.warn('Could not parse Perplexity response as JSON:', content);
      return null;
    }
  } catch (error) {
    console.error('Error enhancing property data:', error);
    return null;
  }
}

export function mergePropertyData(
  visionData: any,
  enhancedData: EnhancedPropertyData | null
): any {
  if (!enhancedData) {
    return visionData;
  }

  // Merge the data, prioritizing vision data for basic info
  // and adding enhanced data for historical/additional info
  return {
    ...visionData,
    recentAppraisals: enhancedData.recentAppraisals,
    taxHistory: enhancedData.taxHistory,
    salesHistory: enhancedData.salesHistory,
    propertyDetails: {
      ...visionData.propertyDetails,
      ...enhancedData.propertyDetails,
    },
    enhancedConfidence: enhancedData.confidence,
  };
} 