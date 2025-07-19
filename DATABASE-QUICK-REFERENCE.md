# 🗄️ HCAD Database Quick Reference

## 🔍 What You Can Search By

### Primary Search Fields
- **Account Number** ✅ (e.g., `0660640130020`) - BEST for exact match
- **Owner Name** ✅ (e.g., `GATHMA LLC`)
- **Property Address** ✅ (e.g., `5412 IRVINGTON BLVD`)
- **ZIP Code** ✅ (e.g., `77009`)
- **Coordinates** ✅ (lat/lon for map searches)

## 📊 What Data Is Available

### ✅ Always Available (for your property type)
- Property Address
- Owner Name
- Mailing Address
- City, State, ZIP
- **Lot Size in Acres** (e.g., "0.27 acres")
- GPS Coordinates (latitude/longitude)
- Property Type

### ❌ Usually NOT Available (for "Real Property with GIS")
- **Appraisal Value** 
- **Land Value**
- **Building Value**
- **Assessed Value**
- Square Footage
- Year Built
- Property Class

## 🏠 Property Type Data Availability

| Property Type | Has Address | Has Size | Has Values | Has Coordinates |
|--------------|------------|----------|------------|----------------|
| **Real Property with GIS** | ✅ Yes | ✅ Acres | ❌ No | ✅ Yes |
| **Personal Property** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Real Property - No GIS** | ✅ Yes | ❓ Maybe | ✅ Yes | ❌ No |

## 💡 Your Property Example
```
Account: 0660640130020
Type: Real Property with GIS
What's Available:
  ✅ Address: 5412 IRVINGTON BLVD
  ✅ Owner: GATHMA LLC
  ✅ Size: 0.27 acres
  ✅ Location: 29.8092022, -95.3608262
  ❌ Appraisal: Not in database
  ❌ Year Built: Not in database
```

## 🚀 Quick Search Examples

### Find a property by account number:
```javascript
searchByAccountNumber('0660640130020')
```

### Find properties by owner:
```javascript
searchByOwner('GATHMA LLC')
```

### Find properties by address:
```javascript
searchByAddress('5412 IRVINGTON')
```

## ⚠️ Important Notes
1. **1.78 million properties** in database
2. Only **209,360 have appraisal values** (12%)
3. **NO "Real Property with GIS"** has appraisal values
4. All addresses are UPPERCASE
5. Account numbers may have leading zeros