# Google Cloud Database Integration Guide

This guide helps you integrate your Google Cloud database for faster property lookups.

## Overview

Instead of web scraping, the app can now search your Google Cloud database first:

```
Screenshot → Extract Account Number → Search Google Cloud DB → Return Results
                                             ↓ (if not found)
                                      Fallback to Web Scraping
```

## Setup Instructions

### 1. Add Google Cloud Database Credentials

Add these to your `.env.local` file:

```bash
# Google Cloud SQL Database
GOOGLE_CLOUD_SQL_HOST="your-cloud-sql-ip-address"
GOOGLE_CLOUD_SQL_PORT="5432"
GOOGLE_CLOUD_SQL_DATABASE="your-database-name"
GOOGLE_CLOUD_SQL_USER="your-username"
GOOGLE_CLOUD_SQL_PASSWORD="your-password"
```

### 2. Database Table Structure

Your Google Cloud database should have a table with these columns (adjust names as needed):

```sql
CREATE TABLE properties (
  account_number VARCHAR(50) PRIMARY KEY,
  owner VARCHAR(255),
  property_address TEXT,
  mailing_address TEXT,
  appraised_value DECIMAL(12, 2),
  land_value DECIMAL(12, 2),
  improvement_value DECIMAL(12, 2),
  total_value DECIMAL(12, 2),
  year_built INTEGER,
  square_footage INTEGER,
  lot_size VARCHAR(100),
  property_type VARCHAR(100)
);
```

### 3. Update the Search Query (if needed)

If your table has different column names, update the queries in `/lib/google-cloud-db.ts`:

```typescript
// Example: If your columns are named differently
const query = `
  SELECT 
    parcel_num as "accountNumber",  // Change to match your column
    owner_name as "owner",           // Change to match your column
    site_address as "propertyAddress" // Change to match your column
    // ... etc
  FROM your_table_name
  WHERE parcel_num = $1
`;
```

## How It Works

1. **User uploads screenshot** → AI extracts account/parcel number
2. **App searches Google Cloud DB** using the account number
3. **If found** → Returns database data (faster, more accurate)
4. **If not found** → Falls back to web scraping

## API Endpoints

### Search Google Cloud Database
```bash
POST /api/search-google-cloud
{
  "accountNumber": "0660640130020"
}
```

### Property Info (with DB integration)
```bash
POST /api/property-info
# Automatically checks Google Cloud DB first
```

## Testing

1. Test database connection:
```bash
curl -X POST https://your-app.vercel.app/api/search-google-cloud \
  -H "Content-Type: application/json" \
  -d '{"accountNumber": "0660640130020"}'
```

2. Upload a screenshot - it will automatically search the database first

## Benefits

- **Speed**: Database lookups are instant (< 100ms)
- **Reliability**: No web scraping failures
- **Cost**: Reduces AI/scraping API calls
- **Accuracy**: Your database has verified data

## n8n Integration

Your n8n workflow can also query the database directly:

```
n8n → HTTP Request → /api/search-google-cloud → Get Property Data
```

## Troubleshooting

### Connection Issues
- Whitelist Vercel's IP addresses in Google Cloud SQL
- Use Cloud SQL Proxy for secure connections
- Check firewall rules

### Performance
- Add indexes on frequently searched columns:
  ```sql
  CREATE INDEX idx_account_number ON properties(account_number);
  CREATE INDEX idx_property_address ON properties(property_address);
  ```

### Security
- Use SSL connections in production
- Limit database user permissions
- Use connection pooling