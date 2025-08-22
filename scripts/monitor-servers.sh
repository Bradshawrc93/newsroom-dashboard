#!/bin/bash

# Monitor script to detect and stop infinite restart loops
echo "🔍 Starting server monitor..."

# Function to check for restart loops
check_restart_loop() {
    # Check if nodemon is restarting too frequently
    local restart_count=$(ps aux | grep -c "nodemon.*restarting")
    local ts_node_count=$(ps aux | grep -c "ts-node")
    
    if [ "$restart_count" -gt 5 ] || [ "$ts_node_count" -gt 3 ]; then
        echo "🚨 RESTART LOOP DETECTED! Killing processes..."
        pkill -9 -f "ts-node\|nodemon\|vite" 2>/dev/null
        lsof -ti:3000 -ti:3001 | xargs kill -9 2>/dev/null
        echo "✅ Processes killed. Restart servers manually."
        exit 1
    fi
}

# Function to check server health
check_server_health() {
    # Check backend
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        echo "✅ Backend healthy"
    else
        echo "❌ Backend not responding"
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend healthy"
    else
        echo "❌ Frontend not responding"
    fi
}

# Monitor loop
while true; do
    check_restart_loop
    check_server_health
    echo "---"
    sleep 10
done
