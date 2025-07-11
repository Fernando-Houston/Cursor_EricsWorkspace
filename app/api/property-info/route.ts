import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    console.log('API route called');
    
    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    console.log('File received:', file ? file.name : 'No file');
    
    if (!file) {
      console.log('No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    // For now, return a mock response to test file upload
    // In production, you would integrate with external OCR and scraping services
    const mockResult = {
      propertyAddress: "1712 MOODY",
      mailingAddress: "1712 MOODY ST, HOUSTON, TX 77009",
      appraisal: "$150,000",
      owner: "BENNETT CLARA MRS ESTATE OF",
      size: "5,000 sqft",
      parcelId: "0311370000012"
    };

    console.log('Returning mock result');
    return NextResponse.json(mockResult);
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'An error occurred while processing the image. Please try again.' 
    }, { status: 500 });
  }
} 