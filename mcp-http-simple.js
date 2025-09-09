#!/usr/bin/env node

const http = require('http');

console.log('🚀 Starting Simple MCP HTTP Server...');

// Function to fetch OpenAPI spec from local NestJS
async function fetchOpenApiSpec() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/docs-json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const spec = JSON.parse(data);
          resolve(spec);
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Search API endpoints
async function searchApi(query, limit = 10) {
  try {
    const spec = await fetchOpenApiSpec();
    const results = [];
    
    if (!spec.paths) return { results: [], message: 'No paths found' };
    
    const searchTerm = query.toLowerCase();
    let count = 0;
    
    for (const [path, methods] of Object.entries(spec.paths)) {
      if (count >= limit) break;
      
      for (const [method, details] of Object.entries(methods)) {
        if (count >= limit) break;
        
        const searchText = `${method} ${path} ${details.summary || ''} ${(details.tags || []).join(' ')}`.toLowerCase();
        
        if (searchText.includes(searchTerm)) {
          results.push({
            method: method.toUpperCase(),
            path: path,
            summary: details.summary || 'No description',
            tags: details.tags || []
          });
          count++;
        }
      }
    }
    
    return {
      results,
      message: `🔴 LIVE DATA from NestJS Application\n\n${results.length > 0 ? 
        results.map((r, i) => `#${i + 1} ${r.method} ${r.path}\n  • ${r.summary}\n  • Tags: ${r.tags.join(', ')}`).join('\n\n') : 
        `No endpoints matched "${query}".`}`
    };
    
  } catch (error) {
    return {
      results: [],
      message: `❌ Error: ${error.message}`
    };
  }
}

// Handle MCP requests
async function handleMcp(body) {
  try {
    const req = JSON.parse(body);
    
    if (req.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'api-searcher-ec2', version: '1.0.0' }
        }
      };
    }
    
    if (req.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          tools: [{
            name: 'search_api',
            description: 'Search API endpoints',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', default: 10, minimum: 1, maximum: 50 }
              },
              required: ['query']
            }
          }]
        }
      };
    }
    
    if (req.method === 'tools/call' && req.params.name === 'search_api') {
      const result = await searchApi(req.params.arguments.query, req.params.arguments.limit);
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          content: [{ type: 'text', text: result.message }]
        }
      };
    }
    
    return {
      jsonrpc: '2.0',
      id: req.id,
      error: { code: -32601, message: `Method '${req.method}' not found` }
    };
    
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: `Parse error: ${error.message}` }
    };
  }
}

// Create server
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'MCP HTTP Server',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // MCP endpoint
  if (req.method === 'POST' && req.url === '/mcp') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const response = await handleMcp(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Start server
const PORT = 4001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 MCP HTTP Server running on http://0.0.0.0:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
  console.log(`🔧 MCP: http://localhost:${PORT}/mcp`);
});

// Keep alive
setInterval(() => {
  console.log(`⏰ Server alive at ${new Date().toISOString()}`);
}, 30000);
