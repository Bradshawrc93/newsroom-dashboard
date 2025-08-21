#!/bin/bash

# One-Command Deployment for Newsroom Dashboard
# This script will deploy your app to Vercel for testing

echo "🚀 Deploying Newsroom Dashboard to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd api && npm install && cd ..
cd frontend && npm install && cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend && npm run build && cd ..

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Your app is now live! You can:"
echo "   - Visit the frontend at the URL shown above"
echo "   - Test the squad management at /squads"
echo "   - Test the API at /api/squads/hierarchy"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Configure your Slack app with the new URLs"
echo "3. Test the authentication flow"
echo ""
echo "📚 For detailed instructions, see docs/DEPLOYMENT.md"
