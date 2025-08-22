#!/bin/bash

echo "🔧 Quick Fix - Killing all processes and restarting servers..."

# Kill all related processes
echo "Killing all Node.js processes..."
pkill -f "ts-node\|nodemon\|vite\|node.*3000\|node.*3001" 2>/dev/null

# Kill processes on specific ports
echo "Clearing ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Wait a moment
sleep 2

echo "✅ All processes killed. Starting servers..."

# Start servers
npm run dev
