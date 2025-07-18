// Test Property Search in Google Cloud Database
require('dotenv').config({ path: '.env.local' });
const { searchByAccountNumber, searchByAddress } = require('./lib/google-cloud-db');

async function testSearch() {
  console.log('🔍 Testing Google Cloud HCAD Database Search\n');
  
  // Test with the account number from your screenshot
  const testAccountNumber = '0660640130020';
  
  console.log(`Searching for account number: ${testAccountNumber}`);
  console.log('─'.repeat(60));
  
  try {
    const result = await searchByAccountNumber(testAccountNumber);
    
    if (result) {
      console.log('✅ Property found!\n');
      console.log('Owner:', result.owner);
      console.log('Address:', result.propertyAddress);
      console.log('City:', result.city, result.state, result.zip);
      console.log('Total Value:', result.totalValue ? `$${result.totalValue.toLocaleString()}` : 'N/A');
      console.log('Land Value:', result.landValue ? `$${result.landValue.toLocaleString()}` : 'N/A');
      console.log('Building Value:', result.improvementValue ? `$${result.improvementValue.toLocaleString()}` : 'N/A');
      console.log('Year Built:', result.yearBuilt || 'N/A');
      console.log('Square Feet:', result.squareFootage || 'N/A');
      console.log('Lot Size:', result.lotSize || 'N/A');
      console.log('Property Type:', result.propertyType);
      
      if (result.latitude && result.longitude) {
        console.log(`\n📍 Location: ${result.latitude}, ${result.longitude}`);
        console.log(`Google Maps: https://maps.google.com/?q=${result.latitude},${result.longitude}`);
      }
    } else {
      console.log('❌ Property not found');
      
      // Try searching by address
      console.log('\nTrying address search for "5412 IRVINGTON"...');
      const addressResult = await searchByAddress('5412 IRVINGTON');
      
      if (addressResult) {
        console.log('✅ Found by address!');
        console.log('Account:', addressResult.accountNumber);
        console.log('Owner:', addressResult.owner);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

testSearch();