# HCAD Property Intelligence Platform - System Documentation

## Overview

This platform provides a comprehensive solution for extracting, analyzing, and managing Harris County Appraisal District (HCAD) property data. It combines screenshot extraction, database integration, and advanced analytics into a unified system.

## System Architecture

### Core Components

1. **Screenshot Extraction Tool**
   - Uses OpenAI Vision API to extract property data from HCAD screenshots
   - Automatically enhances data with Railway database lookups
   - Saves extracted properties to leads system

2. **Railway Database Integration**
   - 1.77M property records from HCAD
   - Only 3.1% have valuation data (known limitation)
   - Provides mailing addresses that were missing from other sources

3. **Analytics Dashboard**
   - Real-time property search across multiple criteria
   - Property detail pages with comprehensive information
   - Data quality indicators
   - Smart insights and investment scoring

4. **Leads Management System**
   - Unified storage for properties from screenshots and searches
   - Export functionality (CSV/JSON)
   - Cross-tab synchronization

## Technical Stack

- **Frontend**: Next.js 15.3.5, TypeScript, Tailwind CSS
- **Database**: PostgreSQL on Railway
- **APIs**: OpenAI Vision (GPT-4o-mini), Railway PostgreSQL
- **Deployment**: Vercel
- **State Management**: React hooks, localStorage for leads

## Key Features

### 1. Screenshot Extraction
```
Flow: Upload → OCR → Database Enhancement → Save to Leads
```
- Recognizes multiple HCAD interface types
- Extracts account numbers, owner names, addresses, values
- Cross-references with Railway database for accuracy
- Falls back to Google Cloud database if configured

### 2. Property Search
- **Search Types**:
  - Account/Parcel Number (exact match)
  - Property Address
  - Owner Name
  - ZIP Code
- **Dynamic Search**: Automatically detects search type
- **Real-time Results**: Direct database queries

### 3. Property Details
- Comprehensive property information display
- Data quality indicators
- Investment scoring
- Market analysis (when data available)
- Save to Leads functionality

### 4. Leads System
- Persistent storage using localStorage
- Unified format for screenshot and search results
- Export capabilities
- Duplicate prevention by parcel ID

## Database Schema

### Key Fields in Railway Database
```sql
- account_number (primary identifier)
- owner_name
- property_address
- mail_address (critical for accuracy)
- total_value, land_value, building_value
- area_acres, area_sqft
- property_type, property_class
- year_built
- centroid_lat, centroid_lon
- extra_data (JSONB with additional fields)
```

## Implementation Journey

### Phase 1: Initial Challenges
- Started with Google Cloud database missing mailing addresses
- Only partial data coverage
- Screenshot tool returning incorrect information

### Phase 2: Railway Integration
- Migrated to Railway database with complete HCAD dataset
- Fixed mailing address issues
- Improved data accuracy to near 100% for found properties

### Phase 3: Performance Optimization
- Implemented connection pooling
- Added static data fallbacks
- Optimized search queries with proper indexing

### Phase 4: Feature Enhancement
- Added property detail pages
- Implemented data quality scoring
- Created unified leads system
- Added Save to Leads from search results

## Current System Flow

### Screenshot Processing
1. User uploads HCAD screenshot
2. OpenAI Vision extracts text and structure
3. System searches Railway database by account number
4. Enhanced data returned with database values
5. Property saved to leads with source tracking

### Property Search
1. User enters search term
2. System detects search type (account, address, owner, ZIP)
3. Direct database query with appropriate filters
4. Results displayed with key metrics
5. Click through to detailed view

### Leads Management
1. Properties saved from screenshots or searches
2. Stored in localStorage with consistent format
3. Displayed in unified dashboard
4. Export available in CSV or JSON format

## Environment Configuration

### Required Environment Variables
```env
# Railway Database (Primary)
RAILWAY_HCAD_DATABASE_URL=postgresql://...

# OpenAI for Vision API
OPENAI_API_KEY=sk-...

# Optional: Google Cloud Database Fallback
GOOGLE_CLOUD_DATABASE_URL=postgresql://...
```

## Known Limitations

1. **Valuation Data**: Only 3.1% of properties have valuation data in the database
2. **Property History**: Not yet implemented (no property_history table)
3. **ML Predictions**: Planned but not implemented for missing valuations
4. **Monthly Updates**: Manual process currently, automation planned

## Future Enhancements

1. **Enhanced Database**
   - Property history tracking
   - Automated monthly updates
   - Change detection and alerts

2. **Machine Learning**
   - Predict missing property values
   - Investment opportunity scoring
   - Market trend analysis

3. **Advanced Analytics**
   - Portfolio tracking
   - Market heat maps
   - Comparative analysis tools

## Best Practices

1. **Data Integrity**
   - Always verify account numbers exist in database
   - Use mailing addresses from Railway database
   - Show data quality indicators to users

2. **Performance**
   - Use connection pooling for database queries
   - Implement proper error handling
   - Cache frequently accessed data

3. **User Experience**
   - Provide clear feedback on data sources
   - Show confidence levels for extracted data
   - Enable easy export and sharing

## Troubleshooting

### Common Issues
1. **Database Timeouts**: Check connection pool settings
2. **Missing Values**: Expected due to incomplete source data
3. **Search No Results**: Try different search criteria

### Debug Tools
- `/scripts/check-extra-data.js` - Inspect property extra_data
- `/scripts/analyze-property-data.js` - Database statistics
- Browser DevTools for localStorage inspection

## Conclusion

The HCAD Property Intelligence Platform successfully combines multiple data sources and technologies to provide a comprehensive property analysis tool. The integration of screenshot extraction with the Railway database solved the critical mailing address accuracy issue, while the unified leads system provides a seamless user experience across different property discovery methods.