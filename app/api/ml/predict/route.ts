import { NextRequest, NextResponse } from 'next/server';
import { PropertyValuePredictor } from '@/ml/property-value-predictor';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.RAILWAY_HCAD_DATABASE_URL || 
    'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway'
});

// Run batch predictions
export async function POST(req: NextRequest) {
  try {
    const { limit = 1000 } = await req.json();
    
    const predictor = new PropertyValuePredictor(pool);
    await predictor.loadTrainingData();
    const results = await predictor.predictMissingValues(limit);
    
    return NextResponse.json({
      success: true,
      predictions: results.length,
      message: `Predicted values for ${results.length} properties`
    });
  } catch (error) {
    console.error('ML prediction error:', error);
    return NextResponse.json(
      { error: 'Prediction failed' },
      { status: 500 }
    );
  }
}

// Get prediction for specific property
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const accountNumber = searchParams.get('account');
    
    if (!accountNumber) {
      return NextResponse.json(
        { error: 'Account number required' },
        { status: 400 }
      );
    }
    
    // Get property details
    const propertyResult = await pool.query(`
      SELECT 
        account_number,
        property_address,
        owner_name,
        centroid_lat as latitude,
        centroid_lon as longitude,
        area_acres,
        year_built,
        property_type,
        zip,
        total_value
      FROM properties
      WHERE account_number = $1
    `, [accountNumber]);
    
    if (propertyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    const property = propertyResult.rows[0];
    
    // If already has value, return it
    if (property.total_value) {
      return NextResponse.json({
        property,
        hasValue: true,
        actualValue: property.total_value
      });
    }
    
    // Predict value
    const predictor = new PropertyValuePredictor(pool);
    await predictor.loadTrainingData();
    
    const prediction = predictor.predictValue({
      latitude: property.latitude,
      longitude: property.longitude,
      area_acres: property.area_acres,
      year_built: property.year_built,
      property_type: property.property_type,
      zip: property.zip
    });
    
    return NextResponse.json({
      property,
      hasValue: false,
      prediction
    });
    
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to get prediction' },
      { status: 500 }
    );
  }
}