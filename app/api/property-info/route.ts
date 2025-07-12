import { NextRequest, NextResponse } from 'next/server';
import { extractPropertyData, convertImageToBase64 } from '../../../lib/vision-service';
import { enhancePropertyData, mergePropertyData } from '../../../lib/perplexity-service';

export const runtime = 'nodejs';
export const maxDuration = 60; // Increased timeout for AI processing

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Property extraction API called');
    
    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    console.log('📁 File received:', file ? file.name : 'No file');
    
    if (!file) {
      console.log('❌ No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ error: 'Please upload an image file' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ File too large:', file.size, 'bytes');
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    console.log('📊 File size:', file.size, 'bytes');
    console.log('🎯 File type:', file.type);

    // Convert file to base64
    console.log('🔄 Converting image to base64...');
    const imageBase64 = await convertImageToBase64(file);
    
    // Stage 1: Extract property data using OpenAI Vision
    console.log('🤖 Stage 1: Extracting property data with OpenAI Vision...');
    const visionData = await extractPropertyData(imageBase64);
    console.log('✅ Vision extraction completed with confidence:', visionData.confidence);

         // Stage 2: Enhance data using Perplexity (if we have parcel ID)
     let finalData = visionData;
     if (visionData.parcelId && visionData.propertyAddress) {
       console.log('🔍 Stage 2: Enhancing data with Perplexity search...');
       try {
         const enhancedData = await enhancePropertyData(visionData.parcelId, visionData.propertyAddress);
         if (enhancedData) {
           finalData = mergePropertyData(visionData, enhancedData);
           console.log('✅ Data enhancement completed');
         } else {
           console.log('⚠️ No enhanced data found, using vision data only');
         }
       } catch (enhanceError) {
         console.warn('⚠️ Enhancement failed (likely need credit card), using vision data only:', enhanceError);
       }
     } else {
       console.log('⚠️ Missing parcel ID or address, skipping enhancement');
     }

    // Format response to match existing frontend expectations
    const response = {
      // Core property info
      propertyAddress: finalData.propertyAddress,
      mailingAddress: finalData.mailingAddress,
      ownerName: finalData.ownerName,
      parcelId: finalData.parcelId,
      
      // Appraisal info
      landValue: finalData.landValue,
      improvementValue: finalData.improvementValue,
      totalValue: finalData.totalValue,
      appraisal: finalData.totalValue ? `$${finalData.totalValue.toLocaleString()}` : null,
      
      // Property details
      propertyType: finalData.propertyType,
      yearBuilt: finalData.yearBuilt,
      squareFootage: finalData.squareFootage,
      size: finalData.squareFootage ? `${finalData.squareFootage.toLocaleString()} sqft` : null,
      lotSize: finalData.lotSize,
      acreage: finalData.acreage,
      
      // Building details
      bedrooms: finalData.bedrooms,
      bathrooms: finalData.bathrooms,
      stories: finalData.stories,
      exteriorWall: finalData.exteriorWall,
      roofType: finalData.roofType,
      foundation: finalData.foundation,
      heating: finalData.heating,
      cooling: finalData.cooling,
      fireplace: finalData.fireplace,
      pool: finalData.pool,
      garage: finalData.garage,
      
      // Legal and administrative
      legalDescription: finalData.legalDescription,
      exemptions: finalData.exemptions,
      taxYear: finalData.taxYear,
      neighborhood: finalData.neighborhood,
      
      // Enhanced data (if available)
      recentAppraisals: finalData.recentAppraisals || [],
      taxHistory: finalData.taxHistory || [],
      salesHistory: finalData.salesHistory || [],
      propertyDetails: finalData.propertyDetails || {},
      
      // Confidence scores
      confidence: finalData.confidence,
      enhancedConfidence: finalData.enhancedConfidence,
      
      // Processing metadata
      processedAt: new Date().toISOString(),
      processingStages: finalData.enhancedConfidence ? ['vision', 'enhancement'] : ['vision']
    };

    console.log('🎉 Property extraction completed successfully');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An error occurred while processing the image. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
} 