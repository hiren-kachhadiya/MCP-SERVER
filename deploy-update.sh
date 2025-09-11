#!/bin/bash

# AWS EC2 Deployment Update Script
# Run this script on your EC2 instance to update the application

echo "🚀 Starting AWS EC2 Deployment Update..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/ubuntu/mcp-final/mcp-api-searcher"  # Adjust path as needed
PM2_APP_NAME="mcp-api-server"
BACKUP_DIR="/home/ubuntu/backups/$(date +%Y%m%d_%H%M%S)"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Create backup
print_status "Creating backup..."
mkdir -p $BACKUP_DIR
cp -r $APP_DIR $BACKUP_DIR/
print_success "Backup created at $BACKUP_DIR"

# Step 2: Navigate to app directory
print_status "Navigating to application directory..."
cd $APP_DIR || {
    print_error "Failed to navigate to $APP_DIR"
    exit 1
}

# Step 3: Stop PM2 processes
print_status "Stopping PM2 processes..."
pm2 stop all
pm2 delete all 2>/dev/null || true

# Step 4: Pull latest changes (if using Git)
print_status "Pulling latest changes..."
if [ -d ".git" ]; then
    git pull origin main || git pull origin master
    print_success "Git pull completed"
else
    print_warning "No Git repository found. Skipping git pull."
fi

# Step 5: Install/Update dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Step 6: Build the application
print_status "Building application..."
npm run build
print_success "Application built successfully"

# Step 7: Start services with PM2
print_status "Starting services with PM2..."

# Start main NestJS application (Port 3000)
pm2 start npm --name "nestjs-app" -- run start:prod

# Start MCP HTTP Server (Port 5000)
pm2 start mcp-http-server.js --name "mcp-http-server"

# Start WebSocket Realtime Server (Port 5001)
pm2 start mcp-websocket-realtime.js --name "mcp-websocket-realtime"

# Step 8: Save PM2 configuration
pm2 save
pm2 startup

print_success "All services started successfully!"

# Step 9: Display status
print_status "Current PM2 status:"
pm2 status

print_status "Service URLs:"
echo "🌐 Main NestJS App: http://$(curl -s ifconfig.me):3000"
echo "📋 API Documentation: http://$(curl -s ifconfig.me):3000/docs"
echo "🔧 MCP HTTP Server: http://$(curl -s ifconfig.me):5000"
echo "📡 WebSocket Server: ws://$(curl -s ifconfig.me):5001"

print_success "Deployment update completed! 🎉"

# Step 10: Health check
print_status "Running health checks..."
sleep 5

# Check NestJS app
if curl -f -s http://localhost:3000 > /dev/null; then
    print_success "✅ NestJS app is running (Port 3000)"
else
    print_error "❌ NestJS app health check failed"
fi

# Check MCP HTTP server
if curl -f -s http://localhost:5000/health > /dev/null; then
    print_success "✅ MCP HTTP server is running (Port 5000)"
else
    print_error "❌ MCP HTTP server health check failed"
fi

# Check if WebSocket server port is listening
if netstat -tuln | grep -q ":5001 "; then
    print_success "✅ WebSocket server is running (Port 5001)"
else
    print_error "❌ WebSocket server health check failed"
fi

echo ""
print_success "🚀 Deployment update completed successfully!"
print_status "📋 Check PM2 logs: pm2 logs"
print_status "🔄 Restart services: pm2 restart all"
print_status "⏹️  Stop services: pm2 stop all"
