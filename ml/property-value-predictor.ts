import { Pool } from 'pg';

// Simple ML model for predicting property values
// This uses a weighted average approach based on similar properties

interface PropertyFeatures {
  latitude: number;
  longitude: number;
  area_acres: number;
  year_built?: number;
  property_type: string;
  zip: string;
}

interface TrainingData extends PropertyFeatures {
  total_value: number;
}

export class PropertyValuePredictor {
  private pool: Pool;
  private trainingData: TrainingData[] = [];
  
  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Load training data from properties with known values
  async loadTrainingData() {
    console.log('🤖 Loading training data...');
    
    const result = await this.pool.query(`
      SELECT 
        centroid_lat as latitude,
        centroid_lon as longitude,
        area_acres,
        year_built,
        property_type,
        zip,
        total_value
      FROM properties
      WHERE total_value > 0
        AND centroid_lat IS NOT NULL
        AND centroid_lon IS NOT NULL
        AND area_acres IS NOT NULL
        AND area_acres > 0
      LIMIT 50000
    `);
    
    this.trainingData = result.rows;
    console.log(`✅ Loaded ${this.trainingData.length} training samples`);
  }

  // Calculate distance between two coordinates (in miles)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Find k-nearest neighbors based on multiple features
  private findKNN(property: PropertyFeatures, k: number = 20): (TrainingData & { score: number })[] {
    const scored = this.trainingData.map(training => {
      // Calculate feature distances
      const distanceMiles = this.calculateDistance(
        property.latitude, property.longitude,
        training.latitude, training.longitude
      );
      
      const sizeDiff = Math.abs(property.area_acres - training.area_acres) / property.area_acres;
      const ageDiff = property.year_built && training.year_built 
        ? Math.abs(property.year_built - training.year_built) / 50 // Normalize by 50 years
        : 0.5; // Default penalty if year missing
      
      const sameType = property.property_type === training.property_type ? 0 : 1;
      const sameZip = property.zip === training.zip ? 0 : 1;
      
      // Weighted score (lower is better)
      const score = 
        distanceMiles * 0.4 +        // Location is most important
        sizeDiff * 10 * 0.3 +         // Size similarity
        ageDiff * 0.2 +               // Age similarity
        sameType * 5 * 0.05 +         // Property type
        sameZip * 3 * 0.05;           // Same ZIP bonus
      
      return { ...training, score };
    });
    
    // Sort by score and return top k
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, k);
  }

  // Predict value for a single property
  predictValue(property: PropertyFeatures): { 
    estimatedValue: number; 
    confidence: number; 
    comparables: any[] 
  } {
    if (this.trainingData.length === 0) {
      throw new Error('No training data loaded');
    }
    
    const neighbors = this.findKNN(property);
    
    if (neighbors.length === 0) {
      return { estimatedValue: 0, confidence: 0, comparables: [] };
    }
    
    // Calculate weighted average based on inverse distance
    let totalWeight = 0;
    let weightedSum = 0;
    
    neighbors.forEach(neighbor => {
      const weight = 1 / (1 + neighbor.score); // Inverse of score
      weightedSum += neighbor.total_value * weight;
      totalWeight += weight;
    });
    
    const estimatedValue = Math.round(weightedSum / totalWeight);
    
    // Calculate confidence based on variance of neighbors
    const values = neighbors.map(n => n.total_value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    
    // Confidence decreases with higher variation
    const confidence = Math.max(0, Math.min(100, 100 * (1 - coefficientOfVariation)));
    
    // Return top 5 comparables
    const comparables = neighbors.slice(0, 5).map(n => ({
      address: `${n.latitude.toFixed(4)}, ${n.longitude.toFixed(4)}`,
      value: n.total_value,
      acres: n.area_acres,
      yearBuilt: n.year_built,
      distance: this.calculateDistance(property.latitude, property.longitude, n.latitude, n.longitude).toFixed(2)
    }));
    
    return { estimatedValue, confidence, comparables };
  }

  // Batch predict for multiple properties
  async predictMissingValues(limit: number = 1000) {
    console.log('🔮 Predicting missing property values...');
    
    // Get properties without values
    const propertiesResult = await this.pool.query(`
      SELECT 
        account_number,
        centroid_lat as latitude,
        centroid_lon as longitude,
        area_acres,
        year_built,
        property_type,
        zip
      FROM properties
      WHERE total_value IS NULL
        AND centroid_lat IS NOT NULL
        AND centroid_lon IS NOT NULL
        AND area_acres IS NOT NULL
        AND area_acres > 0
      LIMIT $1
    `, [limit]);
    
    const predictions = [];
    
    for (const property of propertiesResult.rows) {
      try {
        const prediction = this.predictValue(property);
        
        if (prediction.estimatedValue > 0 && prediction.confidence > 30) {
          predictions.push({
            account_number: property.account_number,
            estimated_value: prediction.estimatedValue,
            confidence: prediction.confidence
          });
        }
      } catch (error) {
        console.error(`Failed to predict for ${property.account_number}:`, error);
      }
    }
    
    // Update database with predictions
    if (predictions.length > 0) {
      console.log(`💾 Saving ${predictions.length} predictions...`);
      
      // Create temp table for bulk update
      await this.pool.query(`
        CREATE TEMP TABLE property_predictions (
          account_number VARCHAR,
          estimated_value NUMERIC,
          confidence NUMERIC
        )
      `);
      
      // Insert predictions
      const values = predictions.map(p => 
        `('${p.account_number}', ${p.estimated_value}, ${p.confidence})`
      ).join(',');
      
      await this.pool.query(`
        INSERT INTO property_predictions VALUES ${values}
      `);
      
      // Update properties with predictions
      await this.pool.query(`
        UPDATE properties p
        SET 
          estimated_value = pp.estimated_value,
          confidence_score = pp.confidence,
          investment_score = CASE 
            WHEN pp.estimated_value > 500000 THEN 80
            WHEN pp.estimated_value > 250000 THEN 70
            WHEN pp.estimated_value > 100000 THEN 60
            ELSE 50
          END
        FROM property_predictions pp
        WHERE p.account_number = pp.account_number
      `);
      
      console.log('✅ Predictions saved successfully');
    }
    
    return predictions;
  }
}

// API endpoint handler
export async function runPredictions() {
  const pool = new Pool({
    connectionString: process.env.RAILWAY_HCAD_DATABASE_URL || 
      'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway'
  });
  
  try {
    const predictor = new PropertyValuePredictor(pool);
    await predictor.loadTrainingData();
    const results = await predictor.predictMissingValues(5000);
    
    return {
      success: true,
      predictions: results.length,
      message: `Predicted values for ${results.length} properties`
    };
  } catch (error) {
    console.error('Prediction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    await pool.end();
  }
}