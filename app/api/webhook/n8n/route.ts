import { NextRequest, NextResponse } from 'next/server';
import { saveProperty } from '@/lib/db/railway';

// Verify webhook token if provided
function verifyWebhook(request: NextRequest): boolean {
  const webhookToken = process.env.N8N_WEBHOOK_TOKEN;
  if (!webhookToken) return true; // Skip verification if no token is set
  
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === webhookToken;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication
    if (!verifyWebhook(request)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.accountNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Account number is required' 
      }, { status: 400 });
    }

    // Map n8n data to our database schema
    const propertyData = {
      accountNumber: data.accountNumber,
      owner: data.owner || data.ownerName,
      propertyAddress: data.propertyAddress,
      mailingAddress: data.mailingAddress,
      appraisedValue: parseFloat(data.appraisedValue || data.appraisal || '0'),
      landValue: parseFloat(data.landValue || '0'),
      improvementValue: parseFloat(data.improvementValue || '0'),
      totalValue: parseFloat(data.totalValue || '0'),
      exemptions: data.exemptions,
      propertyType: data.propertyType,
      yearBuilt: parseInt(data.yearBuilt || '0') || undefined,
      squareFootage: parseInt(data.squareFootage || '0') || undefined,
      lotSize: data.lotSize,
      acreage: parseFloat(data.acreage || '0') || undefined,
      bedrooms: parseInt(data.bedrooms || '0') || undefined,
      bathrooms: parseFloat(data.bathrooms || '0') || undefined,
      stories: parseInt(data.stories || '0') || undefined,
      exteriorWall: data.exteriorWall,
      roofType: data.roofType,
      foundation: data.foundation,
      heating: data.heating,
      cooling: data.cooling,
      fireplace: data.fireplace === true || data.fireplace === 'true',
      pool: data.pool === true || data.pool === 'true',
      garage: data.garage,
      neighborhood: data.neighborhood,
      schoolDistrict: data.schoolDistrict,
      parcelId: data.parcelId,
      legalDescription: data.legalDescription,
      taxYear: data.taxYear,
      confidence: parseFloat(data.confidence || '0') || undefined,
      enhancedConfidence: parseFloat(data.enhancedConfidence || '0') || undefined,
      processedAt: data.processedAt || new Date().toISOString(),
      processingStages: data.processingStages || [],
      rawData: data
    };

    // Save to database
    const result = await saveProperty(propertyData);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Property data received and saved successfully',
        data: result.data 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in n8n webhook:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Health check endpoint for n8n
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'n8n webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}