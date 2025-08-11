#!/bin/bash

# This script checks the project structure for the Azure Static Web App deployment.

echo "🔍 Starting structure check..."
has_error=false

# Check for frontend entry point
if [ -f "src/App.js" ]; then
  echo "✅ Found frontend: src/App.js"
else
  echo "❌ ERROR: Frontend entry point not found at 'src/App.js'."
  has_error=true
fi

# Check for API folder
if [ -d "api" ]; then
  echo "✅ Found API folder: api/"
else
  echo "❌ ERROR: API folder not found. It should be in the project root."
  has_error=true
fi

# Check for the specific function folder
if [ -d "api/get-reservation-analysis" ]; then
  echo "✅ Found function folder: api/get-reservation-analysis/"
else
  echo "❌ ERROR: Function folder 'get-reservation-analysis' not found inside 'api/'."
  has_error=true
fi

# Check for the function's entry point file
if [ -f "api/get-reservation-analysis/index.js" ]; then
  echo "✅ Found function entry point: api/get-reservation-analysis/index.js"
else
  echo "❌ ERROR: Function file 'index.js' not found inside 'api/get-reservation-analysis/'."
  has_error=true
fi

# Check for the API's package.json
if [ -f "api/package.json" ]; then
  echo "✅ Found API package.json: api/package.json"
else
  echo "❌ CRITICAL ERROR: 'package.json' not found inside 'api/'. This is required for the backend build."
  has_error=true
fi

echo ""
if [ "$has_error" = true ]; then
  echo "❗️ Structure check failed. Please fix the errors listed above."
  exit 1
else
  echo "🎉 Structure check passed! Your project appears to be set up correctly."
fi