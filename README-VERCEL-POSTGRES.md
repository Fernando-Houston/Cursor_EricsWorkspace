# Vercel Postgres Integration Guide

This guide explains how to set up and use Vercel Postgres with the n8n webhook integration.

## Setup Instructions

### 1. Create Vercel Postgres Database

1. Go to your Vercel dashboard
2. Navigate to the Storage tab
3. Create a new Postgres database
4. Copy the connection strings from the environment variables

### 2. Configure Environment Variables

Create a `.env.local` file in your project root and add the following variables:

```bash
# Copy these from your Vercel dashboard
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NO_SSL="..."
POSTGRES_URL_NON_POOLING="..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# N8N Webhook Configuration
NEXT_PUBLIC_N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/analyze-property"
N8N_WEBHOOK_TOKEN="your-secure-token"
```

### 3. Initialize Database Schema

Run the SQL schema to create the necessary tables:

```bash
# Connect to your database and run:
psql $POSTGRES_URL < lib/db/schema.sql
```

Or use Vercel's query interface to run the schema.

## API Endpoints

### 1. Properties CRUD API
- `GET /api/properties` - List all properties
- `GET /api/properties?query=search` - Search properties
- `POST /api/properties` - Create/update a property
- `DELETE /api/properties?accountNumber=xxx` - Delete a property

### 2. N8N Webhook Endpoint
- `POST /api/webhook/n8n` - Receives data from n8n workflow
- `GET /api/webhook/n8n` - Health check endpoint

## N8N Workflow Integration

### N8N Webhook Configuration

1. In your n8n workflow, use the HTTP Request node to send data to:
   ```
   https://your-app.vercel.app/api/webhook/n8n
   ```

2. Set the authentication header:
   ```
   Authorization: Bearer YOUR_N8N_WEBHOOK_TOKEN
   ```

3. Send property data in this format:
   ```json
   {
     "accountNumber": "0660640130020",
     "owner": "John Doe",
     "propertyAddress": "123 Main St",
     "appraisedValue": "250000",
     "landValue": "50000",
     "improvementValue": "200000",
     // ... other fields
   }
   ```

### Frontend Integration

The app can work in two modes:

1. **Direct Upload Mode**: Uses the existing `/api/property-info` endpoint
2. **N8N Mode**: Sends screenshots to n8n for processing

To enable N8N mode, ensure `NEXT_PUBLIC_N8N_WEBHOOK_URL` is set.

## Database Schema

The database stores comprehensive property information including:
- Basic property details (address, owner, parcel ID)
- Valuation data (land, improvement, total values)
- Property characteristics (size, bedrooms, bathrooms, etc.)
- Tax and appraisal history
- Processing metadata

## Security Notes

1. Always use HTTPS for webhook endpoints
2. Implement webhook token authentication
3. Validate and sanitize all incoming data
4. Use environment variables for sensitive configuration
5. Enable SSL for database connections in production

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify all POSTGRES_* environment variables are set correctly
   - Check if your IP is whitelisted in Vercel dashboard

2. **Webhook Authentication Failures**
   - Ensure N8N_WEBHOOK_TOKEN matches in both n8n and your app
   - Check the Authorization header format

3. **Data Not Saving**
   - Check browser console for errors
   - Verify the accountNumber field is present
   - Check Vercel Function logs for detailed errors

### Debug Mode

To enable detailed logging, set:
```bash
DEBUG=true
```

This will log all database queries and webhook requests.