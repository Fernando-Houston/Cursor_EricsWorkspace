#!/bin/bash
# Test Google Cloud database search on deployed app

echo "🔍 Testing Google Cloud database search for account: 0660640130020"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test the search endpoint
curl -X POST https://cursor-erics-workspace.vercel.app/api/search-google-cloud \
  -H "Content-Type: application/json" \
  -d '{"accountNumber": "0660640130020"}' \
  2>/dev/null | jq .

echo -e "\n📊 Testing property info endpoint (with database integration)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# You can also test by uploading a screenshot through the API
# This would trigger the database search automatically