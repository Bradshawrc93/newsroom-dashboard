#!/bin/bash

echo "📊 Newsroom Dashboard Status Check"
echo "=================================="

# Check backend
echo -n "Backend (port 3001): "
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    response=$(curl -s http://localhost:3001/health)
    if [[ $response == *"ok"* ]]; then
        echo "✅ Running"
    else
        echo "⚠️  Responding but unhealthy"
    fi
else
    echo "❌ Not responding"
fi

# Check frontend
echo -n "Frontend (port 3000): "
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    response=$(curl -s http://localhost:3000)
    if [[ $response == *"Newsroom Dashboard"* ]]; then
        echo "✅ Running"
    else
        echo "⚠️  Responding but unexpected content"
    fi
else
    echo "❌ Not responding"
fi

# Check processes
echo ""
echo "🔍 Process Check:"
echo "Nodemon processes: $(ps aux | grep -c 'nodemon')"
echo "ts-node processes: $(ps aux | grep -c 'ts-node')"
echo "Vite processes: $(ps aux | grep -c 'vite')"

# Check ports
echo ""
echo "🔌 Port Usage:"
for port in 3000 3001 3002; do
    if lsof -ti:$port >/dev/null 2>&1; then
        pids=$(lsof -ti:$port)
        echo "Port $port: ✅ In use by PIDs: $pids"
    else
        echo "Port $port: ❌ Free"
    fi
done

echo ""
echo "💡 Quick Commands:"
echo "  ./scripts/quick-fix.sh  - Kill all and restart"
echo "  ./scripts/auto-monitor.sh  - Start auto-monitor"
echo "  npm run dev  - Start servers normally"
