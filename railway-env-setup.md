# Railway Postgres Environment Variables for Vercel

Add these environment variables to your Vercel project:

```
POSTGRES_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.railway.app:5432/railway
POSTGRES_PRISMA_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.railway.app:5432/railway?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NO_SSL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.railway.app:5432/railway
POSTGRES_URL_NON_POOLING=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.railway.app:5432/railway
POSTGRES_USER=postgres
POSTGRES_HOST=YOUR_HOST.railway.app
POSTGRES_PASSWORD=YOUR_PASSWORD
POSTGRES_DATABASE=railway

# N8N Webhook
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/analyze-property
N8N_WEBHOOK_TOKEN=your-secure-token
```

## Steps:
1. Replace YOUR_PASSWORD and YOUR_HOST with values from Railway
2. In Vercel, go to Settings → Environment Variables
3. Add each variable for all environments (Production, Preview, Development)
4. Click "Save" after adding each one

## Local Development:
Create `.env.local` with the same variables for local testing.