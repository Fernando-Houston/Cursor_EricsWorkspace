import { NextRequest, NextResponse } from 'next/server';
import { extractPropertyData, PropertyData } from '../../../lib/vision-service';
import { searchByAccountNumber } from '@/lib/google-cloud-db';
import { Pool } from 'pg';

// Railway database pool
const railwayPool = new Pool({
  connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
  ssl: false, // Railway uses proxy, no SSL needed
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Search Railway database by account number
async function searchRailwayByAccountNumber(accountNumber: string) {
  const client = await railwayPool.connect();
  try {
    const query = `
      SELECT 
        account_number,
        owner_name,
        property_address,
        mail_address,
        total_value::numeric as total_value,
        land_value::numeric as land_value,
        building_value::numeric as building_value,
        area_sqft::numeric as area_sqft,
        area_acres::numeric as area_acres,
        property_type,
        year_built,
        city,
        state,
        zip
      FROM properties 
      WHERE account_number = $1
      LIMIT 1
    `;
    
    // Clean the account number - remove any non-digits
    const cleanAccountNumber = accountNumber.replace(/\D/g, '');
    console.log('🔍 Searching for account number:', cleanAccountNumber, `(${cleanAccountNumber.length} digits)`);
    
    const result = await client.query(query, [cleanAccountNumber]);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      
      // Build complete mailing address with city, state, zip if available
      let fullMailingAddress = row.mail_address || row.property_address;
      if (row.city || row.state || row.zip) {
        const cityStateZip = [row.city, row.state, row.zip].filter(Boolean).join(' ');
        if (cityStateZip && !fullMailingAddress.includes(cityStateZip)) {
          fullMailingAddress = `${fullMailingAddress}, ${cityStateZip}`;
        }
      }
      
      return {
        accountNumber: row.account_number,
        owner: row.owner_name,
        propertyAddress: row.property_address,
        mailingAddress: fullMailingAddress,
        totalValue: row.total_value ? parseFloat(row.total_value) : null,
        landValue: row.land_value ? parseFloat(row.land_value) : null,
        improvementValue: row.building_value ? parseFloat(row.building_value) : null,
        squareFootage: row.area_sqft ? parseFloat(row.area_sqft) : null,
        lotSize: row.area_sqft ? `${row.area_sqft} sq ft` : 
                 row.area_acres ? `${row.area_acres} acres` : null,
        propertyType: row.property_type,
        yearBuilt: row.year_built,
        city: row.city,
        state: row.state,
        zip: row.zip
      };
    }
    return null;
  } catch (error) {
    console.error('Error searching Railway database:', error);
    return null;
  } finally {
    client.release();
  }
}

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

    // Validate file size (max 20MB)
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxFileSize) {
      console.log('❌ File too large:', file.size, 'bytes');
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json({ 
        error: `File size (${fileSizeMB}MB) exceeds maximum allowed size of 20MB. Please use a smaller image or compress it before uploading.`,
        details: {
          fileSize: file.size,
          maxSize: maxFileSize,
          fileSizeMB: fileSizeMB
        }
      }, { status: 400 });
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

    // Check Railway database first if we have a parcel ID
    let finalData: EnhancedPropertyData = visionData;
    const hasRailwayDb = !!process.env.RAILWAY_HCAD_DATABASE_URL;
    const hasGoogleDb = !!(process.env.DATABASE_URL || process.env.GOOGLE_CLOUD_DATABASE_URL || process.env.GOOGLE_CLOUD_SQL_HOST);
    
    console.log('🔍 Database check - Railway:', hasRailwayDb);
    console.log('🔍 Database check - Google Cloud:', hasGoogleDb);
    console.log('🔍 Database check - Parcel ID:', visionData.parcelId);
    
    // Try Railway database first (it has better data)
    if (visionData.parcelId && hasRailwayDb) {
      console.log('🔍 Checking Railway HCAD database for parcel:', visionData.parcelId);
      try {
        const railwayResult = await searchRailwayByAccountNumber(visionData.parcelId);
        console.log('🔍 Railway database search result:', railwayResult ? 'FOUND' : 'NOT FOUND');
        
        if (railwayResult) {
          console.log('✅ Found in Railway database! Using Railway data.');
          console.log('📊 Railway Data - Address:', railwayResult.propertyAddress);
          console.log('📊 Railway Data - Owner:', railwayResult.owner);
          console.log('📊 Railway Data - Size:', railwayResult.lotSize);
          console.log('📊 Railway Data - Total Value:', railwayResult.totalValue);
          
          // Map Railway data to our format
          finalData = {
            ...visionData,
            propertyAddress: railwayResult.propertyAddress || visionData.propertyAddress,
            mailingAddress: railwayResult.mailingAddress || visionData.mailingAddress,
            ownerName: railwayResult.owner || visionData.ownerName,
            owner: railwayResult.owner || visionData.ownerName,
            totalValue: railwayResult.totalValue || visionData.totalValue,
            landValue: railwayResult.landValue || visionData.landValue,
            improvementValue: railwayResult.improvementValue || visionData.improvementValue,
            appraisal: railwayResult.totalValue ? `$${Number(railwayResult.totalValue).toLocaleString()}` : 
                      'Not Available',
            yearBuilt: railwayResult.yearBuilt || visionData.yearBuilt,
            squareFootage: railwayResult.squareFootage || visionData.squareFootage,
            size: railwayResult.lotSize || visionData.size || 'Not Available',
            lotSize: railwayResult.lotSize || visionData.lotSize,
            propertyType: railwayResult.propertyType || visionData.propertyType,
            parcelId: visionData.parcelId,
            confidence: 100, // Railway data is 100% confident
            enhancedBy: 'railway-db',
            source: 'railway-db'
          };
          
          // Skip other database searches since we found it
          console.log('⏭️ Skipping other database searches - using Railway data');
        }
      } catch (railwayError) {
        console.error('⚠️ Railway database error:', railwayError);
      }
    }
    
    // If not found in Railway and we have Google Cloud config, try Google Cloud
    if (visionData.parcelId && !finalData.source && hasGoogleDb) {
      console.log('🔍 Checking Google Cloud HCAD database for parcel:', visionData.parcelId);
      try {
        const dbResult = await searchByAccountNumber(visionData.parcelId);
        console.log('🔍 Google Cloud database search result:', dbResult ? 'FOUND' : 'NOT FOUND');
        if (dbResult) {
          console.log('✅ Found in Google Cloud database! Using database data.');
          console.log('📊 DB Data - Address:', dbResult.propertyAddress);
          console.log('📊 DB Data - Size:', dbResult.lotSize);
          console.log('📊 DB Data - Total Value:', dbResult.totalValue);
          
          // Check if we have appraisal values
          const hasAppraisalData = dbResult.totalValue || dbResult.assessedValue || dbResult.landValue;
          
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
                  visionData.lotSize ||
                  'Not Available',
            propertyType: dbResult.propertyType || visionData.propertyType,
            parcelId: visionData.parcelId,
            confidence: 100, // Database data is 100% confident
            enhancedBy: 'google-cloud-db',
            source: 'google-cloud-db'
          };
          
          // If no appraisal data in database, we could fall back to web scraping
          if (!hasAppraisalData) {
            console.log('⚠️ No appraisal data in database for this property');
            console.log('💡 Note: Real Property with GIS types typically lack appraisal values in this database');
            // Could enable web scraping here if needed
            // finalData.needsAppraisalScraping = true;
          } else {
            console.log('✅ Appraisal data found in database');
          }
          
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
         // Get the correct base URL for the environment
         const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
                        'http://localhost:3001';
         
         // Only attempt HCAD search if we have a valid base URL
         if (baseUrl && baseUrl !== '') {
           const hcadResponse = await fetch(`${baseUrl}/api/hcad-search`, {
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
         } else {
           console.log('⚠️ No valid base URL for HCAD search, using vision data only');
         }
       } catch (hcadError) {
         console.warn('⚠️ HCAD search failed, using vision data only:', hcadError);
       }
     } else {
       console.log('⚠️ Missing parcel ID or already have database data, skipping HCAD enhancement');
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
      appraisal: finalData.appraisal || 
                 (finalData.totalValue ? `$${finalData.totalValue.toLocaleString()}` : 
                 finalData.landValue ? `$${finalData.landValue.toLocaleString()}` : 
                 'Not Available'),
      
      // Property details
      propertyType: finalData.propertyType || null,
      yearBuilt: finalData.yearBuilt || null,
      squareFootage: finalData.squareFootage || null,
      size: finalData.size || 
            (finalData.squareFootage ? `${finalData.squareFootage.toLocaleString()} sqft` : 
            finalData.lotSize ? finalData.lotSize : 'Not Available'),
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
    console.log('📊 Final Data Object:');
    console.log('- finalData.size:', finalData.size);
    console.log('- finalData.lotSize:', finalData.lotSize);
    console.log('- finalData.squareFootage:', finalData.squareFootage);
    console.log('- finalData.appraisal:', finalData.appraisal);
    console.log('- finalData.totalValue:', finalData.totalValue);
    console.log('📊 Final response data:');
    console.log('- Address:', response.propertyAddress);
    console.log('- Owner:', response.owner);
    console.log('- Size:', response.size);
    console.log('- Appraisal:', response.appraisal);
    console.log('- Source:', finalData.source || 'vision-only');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An error occurred while processing the image. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
} 