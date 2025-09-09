#!/usr/bin/env node

const http = require('http');
const url = require('url');

// MCP HTTP Server - Standalone implementation

console.log('🚀 Starting MCP HTTP Server...');

// MCP Server state
let mcpInitialized = false;
let mcpTools = [];

// Initialize MCP server
async function initializeMCP() {
  if (mcpInitialized) return;
  
  try {
    console.log('🔧 Initializing MCP server...');
    // Simulate MCP initialization
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
      }
    ];
    mcpInitialized = true;
    console.log('✅ MCP server initialized successfully');
  } catch (error) {
    console.error('❌ MCP initialization failed:', error.message);
    throw error;
  }
}

// Function to fetch OpenAPI spec from live NestJS application
async function fetchLiveOpenApiSpec() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/docs-json', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const spec = JSON.parse(data);
          console.log('✅ Successfully fetched live OpenAPI spec');
          resolve(spec);
        } catch (error) {
          console.error('❌ Error parsing OpenAPI spec:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Failed to fetch OpenAPI spec:', error.message);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      console.error('⏰ Request timeout');
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
            requestBody: details.requestBody ? getSchemaName(details.requestBody) : '—',
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
    console.error('❌ Search failed:', error.message);
    return {
      results: [],
      message: `❌ Error searching API: ${error.message}`
    };
  }
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
              name: 'api-searcher-ec2',
              version: '1.0.0'
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
              content: [
                {
                  type: 'text',
                  text: result.message
                }
              ]
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
  // Enable CORS
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
      service: 'MCP HTTP Server',
      timestamp: new Date().toISOString(),
      initialized: mcpInitialized
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
    message: 'Available endpoints: GET /health, POST /mcp'
  }));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 MCP HTTP Server running on http://0.0.0.0:${PORT}`);
  console.log(`📋 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔧 MCP endpoint: http://0.0.0.0:${PORT}/mcp`);
  console.log('🚀 Ready to accept MCP requests!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP HTTP Server...');
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
