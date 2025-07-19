# Fix Google Cloud Database Connection Timeout

## The Problem
Your database connection is timing out because Google Cloud SQL blocks external connections by default.

## Solution: Allow Vercel's IP Addresses

### Option 1: Allow All IPs (Quick Fix - Less Secure)
1. Go to Google Cloud Console
2. Navigate to SQL → Your Instance
3. Click "Connections" → "Networking"
4. Under "Authorized networks", click "Add Network"
5. Name: "Allow All (Temporary)"
6. Network: `0.0.0.0/0`
7. Click "Save"

⚠️ **Warning**: This allows connections from anywhere. Use only for testing.

### Option 2: Use Vercel's Static IPs (More Secure)
If you have Vercel Pro/Enterprise with static IPs:

1. Get your Vercel static IPs from your dashboard
2. In Google Cloud SQL → Connections → Add Network
3. Add each Vercel IP address

### Option 3: Use Cloud SQL Proxy (Most Secure)
For production, use Google Cloud SQL Proxy with service account authentication.

## Quick Test After Whitelisting

Once you've added the IPs, test the connection:

```bash
curl https://cursor-erics-workspace.vercel.app/api/test-db
```

You should see:
```json
{
  "success": true,
  "searchResult": { ... property data ... }
}
```

## Alternative: Use Serverless VPC Connector
For production apps, consider using Google Cloud's Serverless VPC Connector to securely connect without exposing your database to the internet.

## Immediate Actions:
1. **Add `0.0.0.0/0` to test** (you can remove it later)
2. **Wait 1-2 minutes** for changes to propagate
3. **Test your app again** - it should now show "0.27 acres" for the property size