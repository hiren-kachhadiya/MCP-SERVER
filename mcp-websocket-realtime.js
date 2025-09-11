#!/usr/bin/env node

const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const crypto = require('crypto');

// Real-time MCP Server with WebSocket Notifications
console.log('🚀 Starting Real-time MCP Server with WebSocket...');

// Server state
let mcpInitialized = false;
let mcpTools = [];
let lastSchemaHash = '';
let lastSchema = null;
let connectedClients = new Map();

// Configuration
const CONFIG = {
  httpPort: 5000,
  wsPort: 5001,
  pollInterval: 15000, // 15 seconds for faster detection
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false'
};

// Initialize MCP server
async function initializeMCP() {
  if (mcpInitialized) return;
  
  try {
    console.log('🔧 Initializing Real-time MCP server...');
    
    mcpTools = [
      {
        name: 'search_api',
        description: 'Search OpenAPI endpoints from live NestJS application and return method/path + request/response schemas',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant API endpoints'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10, max: 50)',
              default: 10,
              minimum: 1,
              maximum: 50
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_api_changes',
        description: 'Get recent API schema changes and notifications',
        inputSchema: {
          type: 'object',
          properties: {
            since: {
              type: 'string',
              description: 'Get changes since timestamp (ISO format)',
              default: new Date(Date.now() - 24*60*60*1000).toISOString()
            }
          }
        }
      },
      {
        name: 'subscribe_realtime',
        description: 'Get WebSocket connection info for real-time notifications',
        inputSchema: {
          type: 'object',
          properties: {
            clientId: {
              type: 'string',
              description: 'Optional client identifier',
              default: 'cursor-client'
            }
          }
        }
      }
    ];
    
    mcpInitialized = true;
    console.log('✅ Real-time MCP server initialized');
    
    // Start notification systems
    if (CONFIG.enableNotifications) {
      setupWebSocketServer();
      startSchemaPolling();
    }
  } catch (error) {
    console.error('❌ MCP initialization failed:', error.message);
    throw error;
  }
}

// Setup WebSocket server for real-time notifications
function setupWebSocketServer() {
  const wss = new WebSocket.Server({ port: CONFIG.wsPort });
  
  wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    console.log(`🔗 WebSocket client connected: ${clientId}`);
    
    // Store client connection
    connectedClients.set(clientId, {
      ws: ws,
      connected: true,
      connectedAt: new Date(),
      lastPing: new Date()
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId: clientId,
      message: '🎉 Connected to Real-time API Notification Server',
      timestamp: new Date().toISOString(),
      features: ['api_changes', 'endpoint_monitoring', 'real_time_alerts']
    }));
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleWebSocketMessage(clientId, data);
      } catch (error) {
        console.error(`❌ WebSocket message error from ${clientId}:`, error.message);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log(`🔌 WebSocket client disconnected: ${clientId}`);
      connectedClients.delete(clientId);
    });
    
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for ${clientId}:`, error.message);
      connectedClients.delete(clientId);
    });
  });
  
  console.log(`📡 WebSocket server running on port ${CONFIG.wsPort}`);
  console.log(`🔗 Connect to: ws://localhost:${CONFIG.wsPort}`);
  
  // Keep-alive ping
  setInterval(() => {
    connectedClients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
        client.lastPing = new Date();
      } else {
        connectedClients.delete(clientId);
      }
    });
  }, 30000);
}

// Handle WebSocket messages
function handleWebSocketMessage(clientId, data) {
  const client = connectedClients.get(clientId);
  if (!client) return;
  
  switch (data.type) {
    case 'ping':
      client.ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
      break;
      
    case 'get_status':
      client.ws.send(JSON.stringify({
        type: 'status',
        server: 'Real-time MCP API Monitor',
        connectedClients: connectedClients.size,
        monitoring: CONFIG.enableNotifications,
        lastCheck: lastSchemaHash ? 'Active' : 'Not started',
        timestamp: new Date().toISOString()
      }));
      break;
  }
}

// Generate unique client ID
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start schema polling with real-time broadcasting
function startSchemaPolling() {
  console.log('🔔 Starting real-time schema monitoring...');
  
  // Initial schema fetch
  fetchAndCheckSchema();
  
  // Setup polling
  setInterval(fetchAndCheckSchema, CONFIG.pollInterval);
  
  console.log(`📡 Monitoring API changes every ${CONFIG.pollInterval/1000} seconds`);
}

// Check for schema changes and broadcast real-time
async function fetchAndCheckSchema() {
  try {
    const newSchema = await fetchLiveOpenApiSpec();
    const newHash = generateSchemaHash(newSchema);
    
    if (lastSchemaHash && newHash !== lastSchemaHash) {
      const changes = detectSchemaChanges(lastSchema, newSchema);
      
      if (changes.length > 0) {
        console.log(`🔄 Schema changes detected: ${changes.length} changes`);
        
        const notification = {
          type: 'schema_updated',
          timestamp: new Date().toISOString(),
          changes: changes,
          changeCount: changes.length,
          message: `🚨 API Schema Updated! ${changes.length} changes detected`
        };
        
        // Store notification
        storeNotification(notification);
        
        // 🚀 REAL-TIME BROADCAST to all connected WebSocket clients
        broadcastToAllClients(notification);
        
        // Log each change
        changes.forEach(change => {
          console.log(`  📝 ${change.type}: ${change.method} ${change.path}`);
        });
      }
    }
    
    lastSchemaHash = newHash;
    lastSchema = newSchema;
  } catch (error) {
    console.error('⚠️ Failed to check schema changes:', error.message);
  }
}

// 🚀 REAL-TIME BROADCAST to all WebSocket clients
function broadcastToAllClients(notification) {
  const message = JSON.stringify({
    type: 'api_change_alert',
    notification: notification,
    timestamp: new Date().toISOString()
  });
  
  let broadcastCount = 0;
  
  connectedClients.forEach((client, clientId) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(message);
        broadcastCount++;
      } catch (error) {
        console.error(`❌ Failed to broadcast to ${clientId}:`, error.message);
        connectedClients.delete(clientId);
      }
    } else {
      connectedClients.delete(clientId);
    }
  });
  
  console.log(`📢 Real-time notification sent to ${broadcastCount} clients`);
}

// Generate schema hash
function generateSchemaHash(schema) {
  const schemaString = JSON.stringify(schema, Object.keys(schema).sort());
  return crypto.createHash('md5').update(schemaString).digest('hex');
}

// Detect schema changes
function detectSchemaChanges(oldSchema, newSchema) {
  const changes = [];
  
  if (!oldSchema || !newSchema) return changes;
  
  const oldPaths = Object.keys(oldSchema.paths || {});
  const newPaths = Object.keys(newSchema.paths || {});
  
  // Detect new endpoints
  newPaths.forEach(path => {
    if (!oldPaths.includes(path)) {
      const methods = Object.keys(newSchema.paths[path]);
      methods.forEach(method => {
        const operation = newSchema.paths[path][method];
        changes.push({
          type: 'endpoint_added',
          path: path,
          method: method.toUpperCase(),
          summary: operation.summary || 'New endpoint added',
          description: operation.description || '',
          tags: operation.tags || [],
          timestamp: new Date().toISOString()
        });
      });
    }
  });
  
  // Detect removed endpoints
  oldPaths.forEach(path => {
    if (!newPaths.includes(path)) {
      const methods = Object.keys(oldSchema.paths[path]);
      methods.forEach(method => {
        changes.push({
          type: 'endpoint_removed',
          path: path,
          method: method.toUpperCase(),
          summary: 'Endpoint removed',
          timestamp: new Date().toISOString()
        });
      });
    }
  });
  
  // Detect modified endpoints
  oldPaths.forEach(path => {
    if (newPaths.includes(path)) {
      const oldMethods = Object.keys(oldSchema.paths[path]);
      const newMethods = Object.keys(newSchema.paths[path]);
      
      oldMethods.forEach(method => {
        if (newMethods.includes(method)) {
          const oldOp = oldSchema.paths[path][method];
          const newOp = newSchema.paths[path][method];
          
          if (JSON.stringify(oldOp) !== JSON.stringify(newOp)) {
            changes.push({
              type: 'endpoint_modified',
              path: path,
              method: method.toUpperCase(),
              summary: newOp.summary || 'Endpoint modified',
              description: newOp.description || '',
              tags: newOp.tags || [],
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    }
  });
  
  return changes;
}

// Store notifications
function storeNotification(notification) {
  if (!global.notifications) global.notifications = [];
  global.notifications.push(notification);
  
  // Keep only last 100 notifications
  if (global.notifications.length > 100) {
    global.notifications = global.notifications.slice(-100);
  }
}

// Fetch OpenAPI spec
async function fetchLiveOpenApiSpec() {
  return new Promise((resolve, reject) => {
    const apiUrl = `${CONFIG.apiBaseUrl}/docs-json`;
    const req = http.get(apiUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const spec = JSON.parse(data);
          resolve(spec);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Search API endpoints
async function searchApiEndpoints(query, limit = 10) {
  try {
    const spec = await fetchLiveOpenApiSpec();
    const results = [];
    
    if (!spec.paths) {
      return { results: [], message: 'No API paths found in OpenAPI spec' };
    }
    
    const searchTerm = query.toLowerCase();
    let count = 0;
    
    for (const [path, methods] of Object.entries(spec.paths)) {
      if (count >= limit) break;
      
      for (const [method, details] of Object.entries(methods)) {
        if (count >= limit) break;
        
        const searchableText = `${method} ${path} ${details.summary || ''} ${details.description || ''} ${(details.tags || []).join(' ')}`.toLowerCase();
        
        if (searchableText.includes(searchTerm)) {
          results.push({
            method: method.toUpperCase(),
            path: path,
            summary: details.summary || 'No description',
            requestBody: getSchemaName(details.requestBody),
            response: getResponseSchema(details.responses),
            tags: details.tags || []
          });
          count++;
        }
      }
    }
    
    return {
      results,
      message: `🔴 LIVE DATA from NestJS Application\n\n${results.length > 0 ? results.map((r, i) => 
        `#${i + 1} ${r.method} ${r.path}\n  • ${r.summary}\n  • RequestBody: ${r.requestBody}\n  • Response: ${r.response}\n  • Tags: ${r.tags.join(', ')}`
      ).join('\n\n') : `No endpoints matched "${query}".`}`
    };
    
  } catch (error) {
    return {
      results: [],
      message: `❌ Error searching API: ${error.message}`
    };
  }
}

// Get API changes
async function getApiChanges(since) {
  try {
    const sinceDate = new Date(since);
    const notifications = global.notifications || [];
    
    const recentChanges = notifications.filter(n => 
      new Date(n.timestamp) > sinceDate
    );
    
    const wsStatus = connectedClients.size > 0 
      ? `🟢 ${connectedClients.size} clients connected for real-time alerts`
      : '🔴 No clients connected (connect to ws://localhost:5001)';
    
    const message = recentChanges.length > 0 
      ? `📋 Recent API Changes (since ${sinceDate.toISOString()}):\n\n${recentChanges.map((change, i) => 
          `#${i + 1} ${change.type.toUpperCase()}\n  • ${change.message}\n  • Time: ${change.timestamp}\n  • Changes: ${change.changeCount || change.changes?.length || 0} items`
        ).join('\n\n')}\n\n📡 Real-time Status: ${wsStatus}`
      : `✅ No API changes since ${sinceDate.toISOString()}\n\n📡 Real-time Status: ${wsStatus}`;
    
    return {
      changes: recentChanges,
      message: message
    };
  } catch (error) {
    return {
      changes: [],
      message: `❌ Error fetching changes: ${error.message}`
    };
  }
}

// Get WebSocket subscription info
async function getRealtimeInfo(clientId) {
  const wsUrl = `ws://localhost:${CONFIG.wsPort}`;
  const connectedCount = connectedClients.size;
  
  return {
    message: `🚀 Real-time API Notifications\n\n📡 WebSocket URL: ${wsUrl}\n🔗 Connected Clients: ${connectedCount}\n📊 Monitoring: ${CONFIG.enableNotifications ? 'Active' : 'Disabled'}\n⏱️  Check Interval: ${CONFIG.pollInterval/1000}s\n\n💡 To receive real-time notifications:\n1. Connect WebSocket client to ${wsUrl}\n2. Send: {"type": "get_status"} for server info\n3. Automatic alerts when API changes!\n\n🎯 Client ID: ${clientId}`
  };
}

// Helper functions
function getSchemaName(requestBody) {
  if (!requestBody || !requestBody.content) return '—';
  const content = requestBody.content['application/json'];
  if (!content || !content.schema) return '—';
  return content.schema.$ref ? content.schema.$ref.split('/').pop() : 'Object';
}

function getResponseSchema(responses) {
  if (!responses || !responses['200'] && !responses['201']) return '—';
  const response = responses['200'] || responses['201'];
  if (!response.content || !response.content['application/json']) return '—';
  const schema = response.content['application/json'].schema;
  if (!schema) return '—';
  if (schema.$ref) return schema.$ref.split('/').pop();
  if (schema.type === 'array' && schema.items && schema.items.$ref) {
    return `Array of ${schema.items.$ref.split('/').pop()}`;
  }
  return schema.type || 'Object';
}

// Handle MCP JSON-RPC requests
async function handleMcpRequest(body) {
  try {
    const request = JSON.parse(body);
    
    switch (request.method) {
      case 'initialize':
        await initializeMCP();
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'api-searcher-realtime-ws',
              version: '3.0.0'
            }
          }
        };
        
      case 'tools/list':
        await initializeMCP();
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: mcpTools
          }
        };
        
      case 'tools/call':
        await initializeMCP();
        const { name, arguments: args } = request.params;
        
        if (name === 'search_api') {
          const result = await searchApiEndpoints(args.query, args.limit);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: result.message }]
            }
          };
        }
        
        if (name === 'get_api_changes') {
          const result = await getApiChanges(args.since);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: result.message }]
            }
          };
        }
        
        if (name === 'subscribe_realtime') {
          const result = await getRealtimeInfo(args.clientId);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: result.message }]
            }
          };
        }
        
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Tool '${name}' not found`
          }
        };
        
      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method '${request.method}' not found`
          }
        };
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${error.message}`
      }
    };
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  
  // Health check endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'Real-time MCP Server with WebSocket',
      timestamp: new Date().toISOString(),
      initialized: mcpInitialized,
      websocket: {
        enabled: true,
        port: CONFIG.wsPort,
        url: `ws://localhost:${CONFIG.wsPort}`,
        connectedClients: connectedClients.size,
        clientIds: Array.from(connectedClients.keys())
      },
      notifications: {
        enabled: CONFIG.enableNotifications,
        pollInterval: CONFIG.pollInterval,
        stored: (global.notifications || []).length
      }
    }));
    return;
  }
  
  // WebSocket info endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/websocket') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      websocketUrl: `ws://localhost:${CONFIG.wsPort}`,
      connectedClients: connectedClients.size,
      clientIds: Array.from(connectedClients.keys()),
      instructions: {
        connect: `Connect WebSocket to ws://localhost:${CONFIG.wsPort}`,
        ping: 'Send: {"type": "ping"} for ping/pong',
        status: 'Send: {"type": "get_status"} for server status',
        realtime: 'Automatic notifications when API changes detected'
      }
    }));
    return;
  }
  
  // Notifications endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/notifications') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      notifications: global.notifications || [],
      count: (global.notifications || []).length,
      connectedClients: connectedClients.size,
      realtimeEnabled: true,
      websocketUrl: `ws://localhost:${CONFIG.wsPort}`,
      lastUpdate: lastSchemaHash ? new Date().toISOString() : null
    }));
    return;
  }
  
  // MCP JSON-RPC endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/mcp') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const response = await handleMcpRequest(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('❌ Request handling error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: `Internal error: ${error.message}`
          }
        }));
      }
    });
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    message: 'Available endpoints: GET /health, GET /websocket, GET /notifications, POST /mcp'
  }));
});

// Start servers
server.listen(CONFIG.httpPort, '0.0.0.0', () => {
  console.log(`🌐 Real-time MCP HTTP Server running on http://0.0.0.0:${CONFIG.httpPort}`);
  console.log(`📋 Health check: http://0.0.0.0:${CONFIG.httpPort}/health`);
  console.log(`🔗 WebSocket info: http://0.0.0.0:${CONFIG.httpPort}/websocket`);
  console.log(`🔔 Notifications: http://0.0.0.0:${CONFIG.httpPort}/notifications`);
  console.log(`🔧 MCP endpoint: http://0.0.0.0:${CONFIG.httpPort}/mcp`);
  console.log('🚀 Ready for real-time MCP connections with WebSocket!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Real-time MCP Server...');
  
  // Notify all connected clients
  connectedClients.forEach((client, clientId) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'server_shutdown',
        message: 'Server is shutting down',
        timestamp: new Date().toISOString()
      }));
      client.ws.close();
    }
  });
  
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});
