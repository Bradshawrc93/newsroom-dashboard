#!/bin/bash

# Quick Vercel Deployment Script for Newsroom Dashboard

echo "🚀 Deploying Newsroom Dashboard to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install API dependencies
echo "📦 Installing API dependencies..."
cd api
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Build the frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🔗 Your app should be available at the URL shown above"
echo ""
echo "📋 Next steps:"
echo "1. Test the squad management at /squads"
echo "2. Test the API endpoints at /api/squads"
echo "3. Update environment variables in Vercel dashboard if needed"
