import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testExtraction() {
  try {
    console.log('🧪 Testing HCAD Screenshot Extraction');
    console.log('=====================================');
    
    // Check if a test image exists
    const testImagePath = path.join(__dirname, 'test-screenshot.png');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ No test image found.');
      console.log('📋 To test extraction:');
      console.log('   1. Save your HCAD screenshot as "test-screenshot.png" in the project root');
      console.log('   2. Run: node test-extraction.mjs');
      console.log('   3. Or save as JPG: "test-screenshot.jpg"');
      return;
    }
    
    console.log('📁 Found test image:', testImagePath);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath));
    
    console.log('🤖 Sending to local API for extraction...');
    const startTime = Date.now();
    
    // Test with local API
    const response = await fetch('http://localhost:3000/api/property-info', {
      method: 'POST',
      body: formData,
    });
    
    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }
    
    const propertyData = await response.json();
    
    console.log('✅ Extraction completed!');
    console.log('⏱️  Processing time:', processingTime, 'seconds');
    console.log('📊 Confidence score:', propertyData.confidence + '%');
    console.log('');
    
    // Display extracted data
    console.log('📋 EXTRACTED PROPERTY DATA:');
    console.log('============================');
    
    const fields = [
      { key: 'ownerName', label: 'Owner Name' },
      { key: 'propertyAddress', label: 'Property Address' },
      { key: 'mailingAddress', label: 'Mailing Address' },
      { key: 'parcelId', label: 'Parcel ID' },
      { key: 'propertyType', label: 'Property Type' },
      { key: 'appraisal', label: 'Appraised Value' },
      { key: 'landValue', label: 'Land Value', prefix: '$' },
      { key: 'improvementValue', label: 'Improvement Value', prefix: '$' },
      { key: 'totalValue', label: 'Total Value', prefix: '$' },
      { key: 'yearBuilt', label: 'Year Built' },
      { key: 'size', label: 'Size' },
      { key: 'squareFootage', label: 'Square Footage', suffix: ' sqft' },
      { key: 'lotSize', label: 'Lot Size' },
      { key: 'acreage', label: 'Acreage', suffix: ' acres' },
      { key: 'bedrooms', label: 'Bedrooms' },
      { key: 'bathrooms', label: 'Bathrooms' },
      { key: 'neighborhood', label: 'Neighborhood' },
      { key: 'exemptions', label: 'Exemptions' },
      { key: 'taxYear', label: 'Tax Year' }
    ];
    
    fields.forEach(field => {
      const value = propertyData[field.key];
      if (value !== null && value !== undefined && value !== '') {
        const prefix = field.prefix || '';
        const suffix = field.suffix || '';
        const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
        console.log(`   ${field.label}: ${prefix}${displayValue}${suffix}`);
      }
    });
    
    // Check for missing essential data
    console.log('');
    console.log('🔍 DATA VALIDATION:');
    console.log('===================');
    
    const essentialFields = ['ownerName', 'propertyAddress', 'parcelId'];
    const missingFields = essentialFields.filter(field => 
      !propertyData[field] || propertyData[field] === null || propertyData[field] === ''
    );
    
    if (missingFields.length === 0) {
      console.log('✅ All essential fields extracted successfully!');
    } else {
      console.log('⚠️  Missing essential fields:', missingFields.join(', '));
    }
    
    // Check processing stages
    if (propertyData.processingStages) {
      console.log('🔄 Processing stages:', propertyData.processingStages.join(' → '));
    }
    
    // Save results to JSON file
    const resultsPath = path.join(__dirname, 'extraction-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(propertyData, null, 2));
    console.log('💾 Full results saved to:', resultsPath);
    
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    console.error('🔧 Troubleshooting:');
    console.error('   • Ensure your Next.js app is running (npm run dev)');
    console.error('   • Check that your OpenAI API key is set in .env.local');
    console.error('   • Verify the image is a valid HCAD screenshot');
    console.error('   • Make sure the image format is supported (PNG, JPG, JPEG)');
  }
}

// Check if JPG version exists if PNG doesn't
const testImagePng = path.join(path.dirname(fileURLToPath(import.meta.url)), 'test-screenshot.png');
const testImageJpg = path.join(path.dirname(fileURLToPath(import.meta.url)), 'test-screenshot.jpg');

if (!fs.existsSync(testImagePng) && fs.existsSync(testImageJpg)) {
  // Copy JPG to PNG for the test
  fs.copyFileSync(testImageJpg, testImagePng);
}

// Run the test
testExtraction(); 