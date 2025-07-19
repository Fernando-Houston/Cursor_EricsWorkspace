# Google Cloud HCAD Database Schema

## Table: `properties`
Total Records: 1,780,240 properties

### All Columns and Data Types

| Column Name | Description | Example Values | Notes |
|-------------|-------------|----------------|-------|
| **account_number** | Property account/parcel ID | '0660640130020', '0000442' | Primary identifier for searching |
| **property_type** | Type of property | 'Real Property with GIS', 'Personal Property' | 4 types total |
| **owner_name** | Property owner | 'GATHMA LLC', 'MAC DERMID CANNING LTD' | Full name of owner |
| **property_address** | Physical property address | '5412 IRVINGTON BLVD' | Street address |
| **city** | Property city | 'HOUSTON' | |
| **state** | Property state | 'TX' | |
| **zip** | Property ZIP code | '77009' | |
| **mail_address** | Mailing address | '5412 IRVINGTON BLVD' | Often same as property address |
| **mail_city** | Mailing city | 'HOUSTON' | |
| **mail_state** | Mailing state | 'TX' | |
| **mail_zip** | Mailing ZIP | '77009' | |
| **property_class** | Property classification code | NULL for many | |
| **property_class_desc** | Property class description | NULL for many | |
| **land_value** | Land value in dollars | NULL for most GIS properties | Numeric value |
| **building_value** | Building/improvement value | NULL for most GIS properties | Numeric value |
| **total_value** | Total appraised value | 2098836.00, NULL | Only 209k properties have values |
| **assessed_value** | Assessed value | NULL for most | Different from appraised value |
| **area_sqft** | Square footage | NULL for many | Building area |
| **area_acres** | Lot size in acres | 0.27 | Land area |
| **year_built** | Year constructed | 1950, NULL | |
| **has_geometry** | Has GIS geometry data | true/false | |
| **centroid_lat** | Latitude coordinate | '29.8092022' | Property center point |
| **centroid_lon** | Longitude coordinate | '-95.3608262' | Property center point |
| **geometry_wkt** | GIS geometry (WKT format) | Complex polygon data | |
| **bbox_minx** | Bounding box min X | Coordinate value | |
| **bbox_miny** | Bounding box min Y | Coordinate value | |
| **bbox_maxx** | Bounding box max X | Coordinate value | |
| **bbox_maxy** | Bounding box max Y | Coordinate value | |
| **extra_data** | Additional JSON data | NULL for most | |

## Property Type Breakdown

| Property Type | Count | Has Appraisal Values |
|---------------|-------|---------------------|
| Real Property with GIS | 699,999 | ❌ No (0%) |
| Real Property - GIS | 823,664 | ❌ No (0%) |
| Real Property - No GIS | 73,783 | ✅ Yes (89%) |
| Personal Property | 182,794 | ✅ Yes (79%) |

## Search Examples

### 1. Search by Account Number (Most Common)
```sql
SELECT * FROM properties WHERE account_number = '0660640130020';
```

### 2. Search by Owner Name
```sql
SELECT * FROM properties WHERE LOWER(owner_name) LIKE '%gathma%';
```

### 3. Search by Address
```sql
SELECT * FROM properties WHERE LOWER(property_address) LIKE '%5412 irvington%';
```

### 4. Search by ZIP Code
```sql
SELECT * FROM properties WHERE zip = '77009';
```

### 5. Find Properties with Appraisal Values
```sql
SELECT * FROM properties 
WHERE total_value IS NOT NULL 
AND total_value > 0;
```

### 6. Search by Coordinates (nearby properties)
```sql
SELECT * FROM properties 
WHERE centroid_lat BETWEEN 29.80 AND 29.82 
AND centroid_lon BETWEEN -95.37 AND -95.35;
```

## Important Notes

1. **Appraisal Values**: Only ~12% of properties have appraisal values. Properties with "GIS" in the type have NO values.

2. **Primary Search Field**: `account_number` is the best field for exact property lookup

3. **Address Formatting**: Addresses are uppercase without punctuation (e.g., "5412 IRVINGTON BLVD")

4. **Coordinates**: All GIS properties have lat/lon coordinates for mapping

5. **Size Data**: 
   - Use `area_acres` for land size (e.g., "0.27")
   - Use `area_sqft` for building size (often NULL)

## Common Search Patterns in Your App

1. **By Parcel/Account Number** (from screenshots): Uses `account_number`
2. **By Owner Name**: Uses `owner_name` with LIKE search
3. **By Address**: Uses `property_address` with LIKE search

## Missing Data Patterns

- **Real Property with GIS**: Has coordinates and acres, but NO appraisal values
- **Personal Property**: Usually has appraisal values but NO coordinates
- **Year Built**: Often missing for vacant land or older properties