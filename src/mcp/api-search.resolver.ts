import { Resolver, Tool } from '@nestjs-mcp/server';
import { z } from 'zod';
import { OpenApiService } from '../openapi/openapi.service';

// Define CallToolResult type locally since the import is not working
type CallToolResult = {
  content: Array<{ type: 'text'; text: string }>;
};

const SearchParams = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(50).optional().default(10),
});

@Resolver('api')
export class ApiSearchResolver {
  constructor(private readonly openApi: OpenApiService) {}

  @Tool({
    name: 'search_api',
    description: 'Search OpenAPI endpoints and return method/path + request/response schemas'
  })
  search(params: z.infer<typeof SearchParams>): CallToolResult {
    const { query, limit } = params;
    const doc = this.openApi.get();
    const q = query.toLowerCase();

    type Hit = {
      method: string; path: string; summary?: string;
      requestBody?: any; response200?: any;
    };
    const hits: Hit[] = [];

    const paths = doc.paths ?? {};
    for (const [path, item] of Object.entries(paths)) {
      // Iterate HTTP methods on this path
      for (const method of Object.keys(item)) {
        // @ts-ignore - OpenAPI methods keys
        const op = item[method];
        if (!op || typeof op !== 'object') continue;

        const hay = [
          op.summary ?? '',
          op.description ?? '',
          ...(op.tags ?? []),
          path, method,
        ].join(' ').toLowerCase();

        if (hay.includes(q)) {
          const requestBody = op.requestBody?.content
            ? Object.fromEntries(Object.entries(op.requestBody.content).slice(0, 1))
            : undefined;

          const resp = op.responses?.['200'] ?? op.responses?.['201'];
          const response200 = resp?.content
            ? Object.fromEntries(Object.entries(resp.content).slice(0, 1))
            : undefined;

          hits.push({
            method: method.toUpperCase(),
            path,
            summary: op.summary,
            requestBody,
            response200,
          });
        }
      }
    }

    const limited = hits.slice(0, limit);
    const text = limited.length
      ? limited.map((h, i) => {
          const req = h.requestBody ? JSON.stringify(h.requestBody, null, 2) : '—';
          const res = h.response200 ? JSON.stringify(h.response200, null, 2) : '—';
          return [
            `#${i + 1} ${h.method} ${h.path}`,
            h.summary ? `  • ${h.summary}` : '',
            `  • RequestBody: ${req}`,
            `  • Response: ${res}`,
          ].join('\n');
        }).join('\n\n')
      : `No endpoints matched "${query}".`;

    return { content: [{ type: 'text', text }] };
  }
}
