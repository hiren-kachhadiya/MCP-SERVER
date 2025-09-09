import { Module } from '@nestjs/common';
import { McpModule } from '@nestjs-mcp/server';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { OpenApiService } from './openapi/openapi.service';
import { ApiSearchResolver } from './mcp/api-search.resolver';

@Module({
  imports: [
    UsersModule,
    OrdersModule,
    PaymentsModule,
    McpModule.forRoot({
      name: 'Nest API Search MCP',
      version: '1.0.0',
      // transports enabled by default: streamable (/mcp) and SSE (/sse)
      // you can disable SSE with: transports: { sse: { enabled: false } }
    }),
  ],
  providers: [OpenApiService, ApiSearchResolver],
})
export class AppModule {}
