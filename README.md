# NestJS MCP API Searcher

Search API endpoints from live NestJS application via MCP protocol with optional real-time notifications.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start API server
npm run start:dev

# 3. Choose MCP server mode:
# Basic MCP server
npm run mcp:server

# OR with polling notifications
npm run mcp:notifications

# OR with real-time WebSocket notifications
npm run mcp:realtime
```

## Cursor Setup

Update your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "api-searcher": {
      "url": "http://localhost:5000/mcp"
    }
  }
}
```

Restart Cursor to load the MCP server.

## Server Options

### Basic MCP Server (`mcp:server`)
- **🔍 Search API endpoints** by query
- **📊 Health monitoring**
- Simple and lightweight

### Notifications Server (`mcp:notifications`)
- **🔍 Search API endpoints** by query
- **📋 Get API changes** since timestamp  
- **🔔 Polling-based notifications** (30s intervals)
- **📊 Enhanced health monitoring**

### Real-time WebSocket Server (`mcp:realtime`)
- **🔍 Search API endpoints** by query
- **📋 Get API changes** since timestamp
- **⚡ Real-time WebSocket notifications** (instant alerts)
- **🔗 WebSocket client connections** (ws://localhost:5001)
- **📊 Advanced monitoring** with client tracking

## MCP Tools

### Basic Server:
1. **`search_api`** - Search endpoints by query

### Notifications Server:
1. **`search_api`** - Search endpoints by query
2. **`get_api_changes`** - Get recent API changes

### Real-time WebSocket Server:
1. **`search_api`** - Search endpoints by query
2. **`get_api_changes`** - Get recent API changes
3. **`subscribe_realtime`** - Get WebSocket connection info

## Endpoints

- Health: `http://localhost:5000/health`
- MCP: `http://localhost:5000/mcp`
- Notifications: `http://localhost:5000/notifications` (notifications server only)

## Configuration

Set environment variables:
```bash
API_BASE_URL=http://localhost:3000  # Your API server
POLL_INTERVAL=30000                 # Check for changes every 30s (notifications server)
ENABLE_NOTIFICATIONS=true           # Enable/disable notifications
```

## Real-time WebSocket Testing

```bash
# Terminal 1: Start real-time server
npm run mcp:realtime

# Terminal 2: Connect WebSocket test client
npm run test:websocket

# Terminal 3: Make API changes and see instant notifications!
```

## Distribution

Share these files with team members:
- `mcp-http-server.js` (basic server)
- `mcp-realtime-notifications.js` (polling notifications)
- `mcp-websocket-realtime.js` (real-time WebSocket)
- `websocket-test-client.js` (test client)
- `package.json`
- `README.md`

Team members run the same setup commands above.