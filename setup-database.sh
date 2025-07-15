#\!/bin/bash
# Run this after adding your .env.local file
source .env.local
psql "$POSTGRES_URL" < lib/db/schema.sql
echo "Database tables created successfully\!"
