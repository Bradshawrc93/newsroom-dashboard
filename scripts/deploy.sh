#!/bin/bash

# Newsroom Dashboard Deployment Script

echo "🚀 Setting up Newsroom Dashboard for hosting..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create production environment file
echo "📝 Creating production environment file..."
cat > frontend/.env.production << EOF
# Production Environment Variables
VITE_API_URL=https://newsroom-dashboard-api.vercel.app/api
VITE_SLACK_CLIENT_ID=your_slack_client_id_here
EOF

# Create Railway configuration for backend
echo "📝 Creating Railway configuration..."
cat > railway.json << EOF
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Create Procfile for backend
echo "📝 Creating Procfile for backend..."
cat > Procfile << EOF
web: npm run start
EOF

# Update package.json scripts for production
echo "📝 Updating package.json for production..."
node -e "
const pkg = require('./package.json');
pkg.scripts.start = 'cd backend && npm run start';
pkg.scripts.build = 'npm run build:shared && npm run build:backend && npm run build:frontend';
console.log('✅ Updated package.json for production');
"

echo "✅ Deployment configuration created!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your environment variables:"
echo "   - SLACK_CLIENT_ID"
echo "   - SLACK_CLIENT_SECRET" 
echo "   - OPENAI_API_KEY"
echo "   - JWT_SECRET"
echo ""
echo "2. Deploy to Railway (Backend):"
echo "   - Install Railway CLI: npm i -g @railway/cli"
echo "   - Run: railway login"
echo "   - Run: railway init"
echo "   - Run: railway up"
echo ""
echo "3. Deploy to Vercel (Frontend):"
echo "   - Install Vercel CLI: npm i -g vercel"
echo "   - Run: cd frontend && vercel"
echo ""
echo "4. Update Slack App redirect URL to your production domain"
echo ""
echo "🔗 Quick deploy commands:"
echo "railway up && cd frontend && vercel --prod"
