import { NextRequest, NextResponse } from 'next/server';
import { extractPropertyData, PropertyData } from '../../../lib/vision-service';
import { searchByAccountNumber } from '@/lib/google-cloud-db';

// Types for the data structures
interface HCADData {
  ownerName?: string;
  propertyAddress?: string;
  mailingAddress?: string;
  totalValuation?: string;
  landValue?: string;
  improvementValue?: string;
  stateClassCode?: string;
  propertyType?: string;
  yearBuilt?: number;
  taxYear?: number;
  landArea?: string;
  legalDescription?: string;
  neighborhood?: string;
  landUseCode?: string;
  totalLivingArea?: string;
  marketArea?: string;
  error?: boolean;
}

interface EnhancedPropertyData extends PropertyData {
  source?: string;
  enhancedBy?: string;
}

// Function to merge vision data with HCAD search results
function mergeHCADData(visionData: PropertyData, hcadData: HCADData) {
  return {
    ...visionData,
    // Override with HCAD data where available
    ownerName: hcadData.ownerName || visionData.ownerName,
    propertyAddress: hcadData.propertyAddress || visionData.propertyAddress,
    mailingAddress: hcadData.mailingAddress || visionData.mailingAddress,
    totalValue: parseFloat(hcadData.totalValuation?.replace(/[^\d.]/g, '') || '0') || visionData.totalValue,
    landValue: parseFloat(hcadData.landValue?.replace(/[^\d.]/g, '') || '0') || visionData.landValue,
    improvementValue: parseFloat(hcadData.improvementValue?.replace(/[^\d.]/g, '') || '0') || visionData.improvementValue,
    propertyType: hcadData.stateClassCode || hcadData.propertyType || visionData.propertyType,
    yearBuilt: hcadData.yearBuilt || visionData.yearBuilt,
    taxYear: hcadData.taxYear?.toString() || visionData.taxYear,
    lotSize: hcadData.landArea || visionData.lotSize,
    // Add HCAD-specific detailed data
    legalDescription: hcadData.legalDescription || visionData.legalDescription,
    neighborhood: hcadData.neighborhood || visionData.neighborhood,
    stateClassCode: hcadData.stateClassCode,
    landUseCode: hcadData.landUseCode,
    totalLivingArea: hcadData.totalLivingArea,
    marketArea: hcadData.marketArea,
    // Add HCAD-specific data
    hcadData: hcadData,
    enhancedConfidence: hcadData.error ? 0 : 95, // Very high confidence for HCAD official data
    enhancedBy: 'HCAD Official Records'
  };
}

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

    // Convert file to base64 using Node.js APIs
    console.log('🔄 Converting image to base64...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageBase64 = buffer.toString('base64');
    
    // Stage 1: Extract property data using OpenAI Vision
    console.log('🤖 Stage 1: Extracting property data with OpenAI Vision...');
    const visionData = await extractPropertyData(imageBase64);
    console.log('✅ Vision extraction completed with confidence:', visionData.confidence);

    // Check Google Cloud database first if we have a parcel ID
    let finalData: EnhancedPropertyData = visionData;
    const hasDbConfig = !!(process.env.DATABASE_URL || process.env.GOOGLE_CLOUD_DATABASE_URL || process.env.GOOGLE_CLOUD_SQL_HOST);
    console.log('🔍 Database check - Config present:', hasDbConfig);
    console.log('🔍 Database check - Parcel ID:', visionData.parcelId);
    
    if (visionData.parcelId && hasDbConfig) {
      console.log('🔍 Checking Google Cloud HCAD database for parcel:', visionData.parcelId);
      try {
        const dbResult = await searchByAccountNumber(visionData.parcelId);
        console.log('🔍 Database search result:', dbResult ? 'FOUND' : 'NOT FOUND');
        if (dbResult) {
          console.log('✅ Found in Google Cloud database! Using database data.');
          console.log('📊 DB Data - Address:', dbResult.propertyAddress);
          console.log('📊 DB Data - Size:', dbResult.lotSize);
          // Map database fields to our expected format
          finalData = {
            ...visionData,
            propertyAddress: dbResult.propertyAddress || visionData.propertyAddress,
            mailingAddress: dbResult.mailingAddress || visionData.mailingAddress,
            ownerName: dbResult.owner || visionData.ownerName,
            owner: dbResult.owner || visionData.ownerName,
            totalValue: dbResult.totalValue || visionData.totalValue,
            landValue: dbResult.landValue || visionData.landValue,
            improvementValue: dbResult.improvementValue || visionData.improvementValue,
            appraisal: dbResult.totalValue ? `$${Number(dbResult.totalValue).toLocaleString()}` : 
                      dbResult.assessedValue ? `$${Number(dbResult.assessedValue).toLocaleString()}` :
                      'Not Available',
            yearBuilt: dbResult.yearBuilt || visionData.yearBuilt,
            squareFootage: dbResult.squareFootage || visionData.squareFootage,
            size: dbResult.squareFootage ? `${dbResult.squareFootage} sq ft` : 
                  dbResult.lotSize || 
                  visionData.size || 
                  'Not Available',
            propertyType: dbResult.propertyType || visionData.propertyType,
            parcelId: visionData.parcelId,
            confidence: 100, // Database data is 100% confident
            enhancedBy: 'google-cloud-db',
            source: 'google-cloud-db'
          };
          // Skip HCAD web search since we have database data
          console.log('⏭️ Skipping HCAD web search - using database data');
        } else {
          console.log('❌ Not found in Google Cloud database, will try HCAD web search');
        }
      } catch (dbError) {
        console.error('⚠️ Google Cloud database error:', dbError);
      }
    }

    // Stage 2: Enhance data using HCAD search (if we have parcel ID and didn't find in database)
    if (visionData.parcelId && !finalData.source) {
       console.log('🔍 Stage 2: Enhancing data with HCAD search...');
       try {
         const hcadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/hcad-search`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({ parcelId: visionData.parcelId })
         });
         
         if (hcadResponse.ok) {
           const hcadResult = await hcadResponse.json();
           if (hcadResult.success && hcadResult.data) {
             console.log('✅ HCAD search completed successfully');
             finalData = mergeHCADData(visionData, hcadResult.data);
           } else {
             console.log('⚠️ HCAD search returned no data, using vision data only');
           }
         } else {
           console.log('⚠️ HCAD search failed, using vision data only');
         }
       } catch (hcadError) {
         console.warn('⚠️ HCAD search failed, using vision data only:', hcadError);
       }
     } else {
       console.log('⚠️ Missing parcel ID, skipping HCAD enhancement');
     }

    // Format response to match existing frontend expectations
    const response = {
      // Core property info
      propertyAddress: finalData.propertyAddress || null,
      mailingAddress: finalData.mailingAddress || finalData.propertyAddress || null,
      owner: finalData.ownerName || null, // Legacy field name
      ownerName: finalData.ownerName || null,
      parcelId: finalData.parcelId || null,
      
      // Appraisal info
      landValue: finalData.landValue || null,
      improvementValue: finalData.improvementValue || null,
      totalValue: finalData.totalValue || null,
      appraisal: finalData.totalValue ? `$${finalData.totalValue.toLocaleString()}` : 
                 finalData.landValue ? `$${finalData.landValue.toLocaleString()}` : 
                 'Not Available',
      
      // Property details
      propertyType: finalData.propertyType || null,
      yearBuilt: finalData.yearBuilt || null,
      squareFootage: finalData.squareFootage || null,
      size: finalData.squareFootage ? `${finalData.squareFootage.toLocaleString()} sqft` : 
            finalData.lotSize ? finalData.lotSize : 'Not Available',
      lotSize: finalData.lotSize || null,
      acreage: finalData.acreage || null,
      
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
      
      // HCAD specific data
      hcadData: finalData.hcadData || null,
      landArea: (finalData.hcadData && (finalData.hcadData as HCADData).landArea) || finalData.lotSize || null,
      totalValuation: (finalData.hcadData && (finalData.hcadData as HCADData).totalValuation) || 
                     (finalData.totalValue ? `$${finalData.totalValue.toLocaleString()}` : null),
      
      // Confidence scores
      confidence: finalData.confidence,
      enhancedConfidence: finalData.enhancedConfidence,
      enhancedBy: finalData.enhancedBy || null,
      
      // Processing metadata
      processedAt: new Date().toISOString(),
      processingStages: finalData.enhancedConfidence ? ['vision', 'hcad-search'] : ['vision']
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