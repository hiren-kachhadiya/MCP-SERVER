#!/usr/bin/env node

console.error('MCP API Searcher (Live) started');

const http = require('http');

// Function to fetch OpenAPI spec from live NestJS application
async function fetchLiveOpenApiSpec() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://54.226.212.22:3000/docs-json', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const spec = JSON.parse(data);
          console.error('Successfully fetched live OpenAPI spec');
          resolve(spec);
        } catch (error) {
          console.error('Error parsing OpenAPI spec:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error fetching OpenAPI spec:', error.message);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Function to search endpoints in OpenAPI spec
function searchEndpoints(spec, query, limit = 10) {
  const results = [];
  const q = query.toLowerCase();
  
  if (!spec.paths) {
    return results;
  }
  
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (typeof operation !== 'object' || !operation) continue;
      
      // Search in various fields
      const searchFields = [
        operation.summary || '',
        operation.description || '',
        ...(operation.tags || []),
        path,
        method
      ].join(' ').toLowerCase();
      
      if (searchFields.includes(q)) {
        // Extract request body schema
        let requestBody = '—';
        if (operation.requestBody?.content) {
          const contentTypes = Object.keys(operation.requestBody.content);
          if (contentTypes.length > 0) {
            const schema = operation.requestBody.content[contentTypes[0]].schema;
            if (schema?.$ref) {
              const refName = schema.$ref.split('/').pop();
              requestBody = refName;
            } else if (schema?.type) {
              requestBody = `${schema.type} object`;
            } else {
              requestBody = 'Request body required';
            }
          }
        }
        
        // Extract response schema
        let response200 = '—';
        const responses = operation.responses || {};
        const successResponse = responses['200'] || responses['201'];
        if (successResponse?.content) {
          const contentTypes = Object.keys(successResponse.content);
          if (contentTypes.length > 0) {
            const schema = successResponse.content[contentTypes[0]].schema;
            if (schema?.$ref) {
              const refName = schema.$ref.split('/').pop();
              response200 = refName;
            } else if (schema?.type === 'array' && schema.items?.$ref) {
              const refName = schema.items.$ref.split('/').pop();
              response200 = `Array of ${refName}`;
            } else if (schema?.type) {
              response200 = `${schema.type} response`;
            } else {
              response200 = 'Success response';
            }
          }
        }
        
        results.push({
          method: method.toUpperCase(),
          path,
          summary: operation.summary || 'No summary available',
          requestBody,
          response200,
          tags: operation.tags || []
        });
      }
    }
  }
  
  return results.slice(0, limit);
}

// MCP server implementation
process.stdin.on('data', async (data) => {
  try {
    const request = JSON.parse(data.toString().trim());
    console.error('Received request:', JSON.stringify(request));
    
    if (request.method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'api-searcher-live',
            version: '2.0.0'
          }
        }
      };
      console.error('Sending initialize response:', JSON.stringify(response));
      process.stdout.write(JSON.stringify(response) + '\n');
      
    } else if (request.method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
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
                    minimum: 1,
                    maximum: 50,
                    default: 10
                  }
                },
                required: ['query']
              }
            }
          ]
        }
      };
      console.error('Sending tools/list response:', JSON.stringify(response));
      process.stdout.write(JSON.stringify(response) + '\n');
      
    } else if (request.method === 'tools/call' && request.params.name === 'search_api') {
      try {
        const { query, limit = 10 } = request.params.arguments;
        console.error(`Searching for: "${query}" with limit: ${limit}`);
        
        // Fetch live OpenAPI spec
        const spec = await fetchLiveOpenApiSpec();
        
        // Search endpoints
        const results = searchEndpoints(spec, query, limit);
        
        const text = results.length > 0 
          ? results.map((result, i) => [
              `#${i + 1} ${result.method} ${result.path}`,
              result.summary ? `  • ${result.summary}` : '',
              `  • RequestBody: ${result.requestBody}`,
              `  • Response: ${result.response200}`,
              result.tags.length > 0 ? `  • Tags: ${result.tags.join(', ')}` : ''
            ].filter(line => line).join('\n')).join('\n\n')
          : `No endpoints matched "${query}".`;
        
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [{ 
              type: 'text', 
              text: `🔴 LIVE DATA from NestJS Application\n\n${text}` 
            }]
          }
        };
        console.error('Sending tools/call response with live data');
        process.stdout.write(JSON.stringify(response) + '\n');
        
      } catch (error) {
        console.error('Error in search_api tool:', error.message);
        
        // Fallback to mock data if live API is not available
        const { query, limit = 10 } = request.params.arguments;
        
        const mockResults = [
          // Fallback mock data (same as original)
          {
            method: 'POST',
            path: '/payments',
            summary: 'Process payment',
            requestBody: 'CreatePaymentDto with orderId, customerId, amount, currency, paymentMethod, cardDetails',
            response200: 'PaymentResponseDto with payment details and transaction info'
          },
          {
            method: 'GET',
            path: '/payments',
            summary: 'Get all payments',
            requestBody: '—',
            response200: 'Array of PaymentResponseDto with filtering by status, customerId, orderId, paymentMethod'
          },
          {
            method: 'GET',
            path: '/payments/{id}',
            summary: 'Get payment by ID',
            requestBody: '—',
            response200: 'PaymentResponseDto with complete payment details'
          }
        ];
        
        const filtered = mockResults.filter(result => 
          result.path.toLowerCase().includes(query.toLowerCase()) ||
          result.summary.toLowerCase().includes(query.toLowerCase()) ||
          result.method.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);
        
        const text = filtered.length > 0 
          ? filtered.map((h, i) => [
              `#${i + 1} ${h.method} ${h.path}`,
              h.summary ? `  • ${h.summary}` : '',
              `  • RequestBody: ${h.requestBody}`,
              `  • Response: ${h.response200}`
            ].join('\n')).join('\n\n')
          : `No endpoints matched "${query}".`;
        
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [{ 
              type: 'text', 
              text: `⚠️ FALLBACK DATA (Live API unavailable: ${error.message})\n\n${text}` 
            }]
          }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      }
      
    } else {
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (error) {
    console.error('Parse error:', error.message);
    const response = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error'
      }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }
});

// Handle cleanup
process.on('SIGINT', () => {
  console.error('MCP API Searcher (Live) shutting down');
  process.exit();
});

process.on('SIGTERM', () => {
  console.error('MCP API Searcher (Live) shutting down');
  process.exit();
});

console.error('MCP API Searcher (Live) ready for requests');
