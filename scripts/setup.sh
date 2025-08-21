#!/bin/bash

# Newsroom Dashboard Setup Script

echo "🚀 Setting up Newsroom Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install shared dependencies
echo "📦 Installing shared dependencies..."
cd shared
npm install
cd ..

# Create data directory
echo "📁 Creating data directory..."
mkdir -p backend/data

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your Slack and OpenAI API credentials"
fi

# Build shared package
echo "🔨 Building shared package..."
cd shared
npm run build
cd ..

# Build backend
echo "🔨 Building backend..."
cd backend
npm run build
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your API credentials"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Environment variables needed:"
echo "- SLACK_CLIENT_ID: Your Slack app client ID"
echo "- SLACK_CLIENT_SECRET: Your Slack app client secret"
echo "- OPENAI_API_KEY: Your OpenAI API key"
echo "- JWT_SECRET: A secure random string for JWT signing"
