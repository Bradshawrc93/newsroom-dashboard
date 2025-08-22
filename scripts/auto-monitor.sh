#!/bin/bash

# Auto-monitor script for newsroom dashboard
# Detects crashes, port conflicts, and restart loops, then fixes them automatically

echo "🤖 Starting Auto-Monitor for Newsroom Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -ti:$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        log "${YELLOW}Killing processes on port $port: $pids${NC}"
        echo $pids | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Function to check server health
check_backend_health() {
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        local response=$(curl -s http://localhost:3001/health)
        if [[ $response == *"ok"* ]] || [[ $response == *"healthy"* ]]; then
            return 0  # Healthy
        fi
    fi
    return 1  # Not healthy
}

check_frontend_health() {
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        local response=$(curl -s http://localhost:3000)
        if [[ $response == *"Newsroom Dashboard"* ]]; then
            return 0  # Healthy
        fi
    fi
    return 1  # Not healthy
}

# Function to detect restart loops
detect_restart_loop() {
    local nodemon_count=$(ps aux | grep -c "nodemon.*restarting")
    local ts_node_count=$(ps aux | grep -c "ts-node")
    local vite_count=$(ps aux | grep -c "vite")
    
    if [ "$nodemon_count" -gt 3 ] || [ "$ts_node_count" -gt 2 ] || [ "$vite_count" -gt 2 ]; then
        return 0  # Restart loop detected
    fi
    return 1  # No restart loop
}

# Function to detect crashes
detect_crashes() {
    # Check for "app crashed" messages in recent logs
    local crash_count=$(ps aux | grep -c "app crashed")
    if [ "$crash_count" -gt 0 ]; then
        return 0  # Crash detected
    fi
    return 1  # No crash
}

# Function to fix issues
fix_issues() {
    log "${YELLOW}🔧 Fixing issues...${NC}"
    
    # Kill all related processes
    pkill -f "ts-node\|nodemon\|vite\|node.*3000\|node.*3001" 2>/dev/null
    
    # Kill processes on specific ports
    kill_port 3000
    kill_port 3001
    kill_port 3002
    
    # Wait a moment
    sleep 2
    
    log "${GREEN}✅ Issues fixed, ready to restart${NC}"
}

# Function to restart servers
restart_servers() {
    log "${YELLOW}🔄 Restarting servers...${NC}"
    
    # Change to project directory
    cd /Users/cody.bradshaw/newsroom-dashboard
    
    # Start servers in background
    npm run dev > /tmp/newsroom-dev.log 2>&1 &
    local dev_pid=$!
    
    log "${GREEN}✅ Servers restarted (PID: $dev_pid)${NC}"
    return $dev_pid
}

# Function to wait for servers to be ready
wait_for_servers() {
    local max_attempts=30
    local attempt=0
    
    log "${BLUE}⏳ Waiting for servers to be ready...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if check_backend_health && check_frontend_health; then
            log "${GREEN}✅ Both servers are healthy!${NC}"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    log "${RED}❌ Servers failed to start within $((max_attempts * 2)) seconds${NC}"
    return 1
}

# Main monitoring loop
monitor_loop() {
    local consecutive_failures=0
    local max_failures=3
    
    while true; do
        # Check for restart loops
        if detect_restart_loop; then
            log "${RED}🚨 RESTART LOOP DETECTED!${NC}"
            fix_issues
            restart_servers
            consecutive_failures=$((consecutive_failures + 1))
        fi
        
        # Check for crashes
        if detect_crashes; then
            log "${RED}🚨 CRASH DETECTED!${NC}"
            fix_issues
            restart_servers
            consecutive_failures=$((consecutive_failures + 1))
        fi
        
        # Check server health
        local backend_healthy=false
        local frontend_healthy=false
        
        if check_backend_health; then
            backend_healthy=true
        else
            log "${YELLOW}⚠️  Backend not responding${NC}"
        fi
        
        if check_frontend_health; then
            frontend_healthy=true
        else
            log "${YELLOW}⚠️  Frontend not responding${NC}"
        fi
        
        # If both servers are healthy, reset failure counter
        if $backend_healthy && $frontend_healthy; then
            if [ $consecutive_failures -gt 0 ]; then
                log "${GREEN}✅ Servers recovered!${NC}"
            fi
            consecutive_failures=0
        else
            consecutive_failures=$((consecutive_failures + 1))
        fi
        
        # If too many consecutive failures, force restart
        if [ $consecutive_failures -ge $max_failures ]; then
            log "${RED}🚨 Too many consecutive failures, forcing restart...${NC}"
            fix_issues
            restart_servers
            consecutive_failures=0
        fi
        
        # Status report
        if $backend_healthy && $frontend_healthy; then
            log "${GREEN}✅ All systems operational${NC}"
        else
            log "${YELLOW}⚠️  Issues detected (failures: $consecutive_failures/$max_failures)${NC}"
        fi
        
        # Wait before next check
        sleep 10
    done
}

# Trap to handle script termination
cleanup() {
    log "${YELLOW}🛑 Auto-monitor stopping...${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start monitoring
log "${GREEN}🚀 Auto-monitor started!${NC}"
log "${BLUE}📊 Monitoring ports: 3000, 3001, 3002${NC}"
log "${BLUE}🔍 Checking every 10 seconds${NC}"
log "${BLUE}🛑 Press Ctrl+C to stop${NC}"

monitor_loop
