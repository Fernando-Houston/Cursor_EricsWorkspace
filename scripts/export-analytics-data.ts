// This script pre-calculates analytics and exports to JSON files
// Run this locally where you have a stable database connection

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: 'postgresql://postgres:JtJbPAybwWfYvRCgIlKWakPutHuggUoN@caboose.proxy.rlwy.net:21434/railway',
  ssl: { rejectUnauthorized: false }
});

async function exportAnalytics() {
  console.log('🚀 Starting analytics export...');
  
  try {
    // 1. Basic Stats
    console.log('📊 Calculating basic stats...');
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_properties,
        COUNT(CASE WHEN total_value > 0 THEN 1 END) as properties_with_values,
        COALESCE(SUM(total_value), 0) as total_portfolio_value,
        COALESCE(AVG(CASE WHEN total_value > 0 THEN total_value END), 0) as avg_property_value,
        COUNT(DISTINCT owner_name) as unique_owners,
        COUNT(CASE WHEN property_address != mail_address THEN 1 END) as non_owner_occupied
      FROM properties
    `);
    
    // 2. Top Owners
    console.log('🏢 Getting top owners...');
    const ownersResult = await pool.query(`
      SELECT 
        owner_name,
        COUNT(*) as property_count,
        COALESCE(SUM(total_value), 0) as portfolio_value,
        COALESCE(SUM(area_acres), 0) as total_acres
      FROM properties
      WHERE owner_name IS NOT NULL AND owner_name != ''
      GROUP BY owner_name
      ORDER BY COUNT(*) DESC
      LIMIT 100
    `);
    
    // 3. Property Types
    console.log('🏠 Analyzing property types...');
    const typesResult = await pool.query(`
      SELECT 
        COALESCE(property_type, 'UNKNOWN') as property_type,
        COUNT(*) as count,
        COALESCE(AVG(total_value), 0) as avg_value,
        COALESCE(SUM(total_value), 0) as total_value
      FROM properties
      GROUP BY property_type
      ORDER BY COUNT(*) DESC
    `);
    
    // 4. ZIP Analysis
    console.log('📍 Analyzing ZIP codes...');
    const zipResult = await pool.query(`
      SELECT 
        zip,
        COUNT(*) as property_count,
        COALESCE(AVG(total_value), 0) as avg_value,
        COUNT(CASE WHEN property_address != mail_address THEN 1 END) as investor_owned,
        COALESCE(SUM(area_acres), 0) as total_acres
      FROM properties
      WHERE zip IS NOT NULL
      GROUP BY zip
      ORDER BY COUNT(*) DESC
      LIMIT 50
    `);
    
    // 5. Value Distribution
    console.log('💰 Calculating value distribution...');
    const valueResult = await pool.query(`
      SELECT 
        CASE 
          WHEN total_value < 100000 THEN 'Under $100k'
          WHEN total_value < 250000 THEN '$100k-$250k'
          WHEN total_value < 500000 THEN '$250k-$500k'
          WHEN total_value < 1000000 THEN '$500k-$1M'
          WHEN total_value < 5000000 THEN '$1M-$5M'
          ELSE 'Over $5M'
        END as value_range,
        COUNT(*) as count
      FROM properties
      WHERE total_value > 0
      GROUP BY 1
      ORDER BY 
        CASE value_range
          WHEN 'Under $100k' THEN 1
          WHEN '$100k-$250k' THEN 2
          WHEN '$250k-$500k' THEN 3
          WHEN '$500k-$1M' THEN 4
          WHEN '$1M-$5M' THEN 5
          ELSE 6
        END
    `);
    
    // Prepare the data
    const analyticsData = {
      stats: statsResult.rows[0],
      top_owners: ownersResult.rows,
      property_types: typesResult.rows,
      zip_analysis: zipResult.rows,
      value_distribution: valueResult.rows,
      last_updated: new Date().toISOString()
    };
    
    // Save to public directory
    const outputPath = path.join(process.cwd(), 'public', 'data', 'analytics.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(analyticsData, null, 2));
    
    console.log('✅ Analytics data exported to:', outputPath);
    console.log('📊 Total properties:', analyticsData.stats.total_properties);
    console.log('💵 Total value:', `$${(analyticsData.stats.total_portfolio_value / 1e9).toFixed(1)}B`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the export
exportAnalytics();