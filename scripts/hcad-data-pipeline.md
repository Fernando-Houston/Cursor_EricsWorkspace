# HCAD Data Pipeline - Making It Production Ready

## The Goal
Transform your property analytics platform from sample data to real, accurate HCAD data that updates automatically.

## Current Status
- ✅ Frontend working perfectly
- ✅ Search by account number, address, ZIP, owner
- ✅ Property details with smart analytics
- ❌ Using sample/generated data
- ❌ Database connection timeouts

## Solution Architecture

### 1. Data Source Strategy
```
HCAD Website → Download CSV → Process → Database → Your App
```

### 2. Database Options (Ranked by Recommendation)

#### Option A: Supabase (Recommended)
- Free tier: 500MB storage, 2GB bandwidth
- Built for serverless/Vercel
- Better connection handling
- Steps:
  1. Create account at supabase.com
  2. Create new project
  3. Use their import tool for CSV
  4. Update RAILWAY_HCAD_DATABASE_URL in Vercel

#### Option B: Neon.tech
- Free tier: 3GB storage
- Serverless Postgres
- Auto-scaling connections
- Built specifically for Vercel

#### Option C: Fix Railway
- Add connection pooling
- Increase timeout limits
- Check if database is sleeping

### 3. Data Import Process

```javascript
// scripts/import-hcad-data.js
const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');

async function importHCAD() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  // Create tables if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      account_number VARCHAR PRIMARY KEY,
      owner_name VARCHAR,
      property_address VARCHAR,
      mail_address VARCHAR,
      total_value NUMERIC,
      land_value NUMERIC,
      improvement_value NUMERIC,
      area_acres NUMERIC,
      property_type VARCHAR,
      year_built INTEGER,
      zip VARCHAR,
      centroid_lat NUMERIC,
      centroid_lon NUMERIC,
      legal_description TEXT,
      -- Add all HCAD fields
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Stream CSV and insert
  let count = 0;
  fs.createReadStream('hcad_data.csv')
    .pipe(csv())
    .on('data', async (row) => {
      await pool.query(
        `INSERT INTO properties (account_number, owner_name, ...) 
         VALUES ($1, $2, ...) 
         ON CONFLICT (account_number) 
         DO UPDATE SET ...`,
        [row.account_number, row.owner_name, ...]
      );
      
      count++;
      if (count % 1000 === 0) {
        console.log(`Imported ${count} properties...`);
      }
    });
}
```

### 4. Monthly Update Automation

```yaml
# .github/workflows/update-hcad.yml
name: Update HCAD Data
on:
  schedule:
    - cron: '0 0 1 * *' # First day of month
  workflow_dispatch: # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Download HCAD Data
        run: |
          curl -o hcad_data.csv "HCAD_DOWNLOAD_URL"
      - name: Import to Database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          npm run import-data
```

### 5. Performance Optimization

#### Pre-calculated Analytics
```sql
-- Create materialized views for fast queries
CREATE MATERIALIZED VIEW analytics_summary AS
SELECT 
  COUNT(*) as total_properties,
  SUM(total_value) as total_value,
  COUNT(DISTINCT owner_name) as unique_owners,
  COUNT(CASE WHEN property_address != mail_address THEN 1 END) as investor_owned
FROM properties;

-- Refresh monthly
REFRESH MATERIALIZED VIEW analytics_summary;
```

#### Indexed Searches
```sql
-- Add indexes for fast searches
CREATE INDEX idx_account_number ON properties(account_number);
CREATE INDEX idx_owner_name ON properties(LOWER(owner_name));
CREATE INDEX idx_property_address ON properties(LOWER(property_address));
CREATE INDEX idx_zip ON properties(zip);
CREATE INDEX idx_value ON properties(total_value);
```

### 6. API Updates

Update your APIs to use real data:

```typescript
// app/api/property/[id]/route.ts
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const result = await pool.query(
      'SELECT * FROM properties WHERE account_number = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    const property = result.rows[0];
    
    // Add smart features
    const enhanced = await enhanceProperty(property);
    
    return NextResponse.json(enhanced);
  } finally {
    await pool.end();
  }
}
```

## Implementation Steps

1. **Week 1: Database Migration**
   - Set up Supabase/Neon account
   - Create schema
   - Import sample data (1000 records) for testing

2. **Week 2: Full Data Import**
   - Download full HCAD dataset
   - Clean and process CSV
   - Import all 1.77M records
   - Verify data integrity

3. **Week 3: Performance Optimization**
   - Add indexes
   - Create materialized views
   - Test query performance
   - Implement caching

4. **Week 4: Automation**
   - Set up monthly update scripts
   - Add error handling
   - Create monitoring alerts
   - Document process

## Success Metrics
- [ ] All 1.77M properties searchable
- [ ] Search results < 100ms
- [ ] Property details < 200ms
- [ ] Monthly updates automated
- [ ] 99.9% uptime

## Next Steps
1. Choose database provider (Supabase recommended)
2. Start with 1000 record test import
3. Verify all features work with real data
4. Scale to full dataset
5. Set up automation