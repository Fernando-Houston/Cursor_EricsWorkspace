const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testAnalyticsQuery() {
  const pool = new Pool({
    connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
    ssl: false,
  });

  try {
    console.log('Testing value distribution query...\n');
    
    const result = await pool.query(`
      WITH value_ranges AS (
        SELECT 
          CASE 
            WHEN total_value < 100000 THEN 'Under $100k'
            WHEN total_value < 250000 THEN '$100k-$250k'
            WHEN total_value < 500000 THEN '$250k-$500k'
            WHEN total_value < 1000000 THEN '$500k-$1M'
            WHEN total_value < 2500000 THEN '$1M-$2.5M'
            ELSE 'Over $2.5M'
          END as value_range,
          CASE 
            WHEN total_value < 100000 THEN 1
            WHEN total_value < 250000 THEN 2
            WHEN total_value < 500000 THEN 3
            WHEN total_value < 1000000 THEN 4
            WHEN total_value < 2500000 THEN 5
            ELSE 6
          END as sort_order
        FROM properties
        WHERE total_value IS NOT NULL AND total_value > 0
        LIMIT 10000
      )
      SELECT value_range, COUNT(*) as count
      FROM value_ranges
      GROUP BY value_range, sort_order
      ORDER BY sort_order
    `);
    
    console.log('✅ Query successful! Value distribution:');
    result.rows.forEach(row => {
      console.log(`  ${row.value_range}: ${row.count} properties`);
    });
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  } finally {
    await pool.end();
  }
}

testAnalyticsQuery();