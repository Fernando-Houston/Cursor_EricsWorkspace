// Test the HCAD search endpoint
async function testHCADSearch() {
  const testParcelId = '0660640130020'; // The parcel ID from your previous successful extraction
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing HCAD Search Integration...');
  console.log('📍 Parcel ID:', testParcelId);
  console.log('🌐 Base URL:', baseUrl);
  
  try {
    // Test the HCAD search endpoint
    console.log('\n🔍 Testing HCAD search endpoint...');
    const response = await fetch(`${baseUrl}/api/hcad-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parcelId: testParcelId
      })
    });
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HCAD search failed:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ HCAD search successful!');
    
    // Display the results
    console.log('\n📋 HCAD Search Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (result.success && result.data) {
      const data = result.data;
      console.log('👤 Owner Name:', data.ownerName || 'Not found');
      console.log('🏠 Property Address:', data.propertyAddress || 'Not found');
      console.log('📮 Mailing Address:', data.mailingAddress || 'Not found');
      console.log('📜 Legal Description:', data.legalDescription || 'Not found');
      console.log('📏 Land Area:', data.landArea || 'Not found');
      console.log('🏘️ Total Living Area:', data.totalLivingArea || 'Not found');
      console.log('🏘️ Neighborhood:', data.neighborhood || 'Not found');
      console.log('🗺️ Market Area:', data.marketArea || 'Not found');
      console.log('🏗️ State Class Code:', data.stateClassCode || 'Not found');
      console.log('🏡 Land Use Code:', data.landUseCode || 'Not found');
      console.log('');
      console.log('💰 Valuation Information:');
      console.log('   💵 Land Value:', data.landValue || 'Not found');
      console.log('   🏠 Improvement Value:', data.improvementValue || 'Not found');
      console.log('   💰 Total Valuation:', data.totalValuation || 'Not found');
      console.log('   📅 Tax Year:', data.taxYear || 'Not found');
      
      if (data.error) {
        console.log('⚠️ Error:', data.error);
      }
    } else {
      console.log('❌ No data found in response');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testHCADSearch(); 