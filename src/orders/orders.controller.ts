import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, OrderStatus } from './dto/update-order.dto';
import { OrderResponseDto, OrderItemResponseDto } from './dto/order-response.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created successfully',
    type: OrderResponseDto 
  })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    // Mock implementation - in real app this would call a service
    const mockItems: OrderItemResponseDto[] = createOrderDto.items.map((item, index) => ({
      id: index + 1,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice
    }));

    const mockOrder: OrderResponseDto = {
      id: 1,
      orderNumber: 'ORD-2024-001',
      customerId: createOrderDto.customerId,
      customerName: createOrderDto.customerName,
      customerEmail: createOrderDto.customerEmail,
      status: OrderStatus.PENDING,
      shippingAddress: createOrderDto.shippingAddress,
      items: mockItems,
      totalAmount: mockItems.reduce((sum, item) => sum + item.totalPrice, 0),
      notes: createOrderDto.notes,
      trackingNumber: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return mockOrder;
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Orders retrieved successfully',
    type: [OrderResponseDto] 
  })
  async getAllOrders(
    @Query('status') status?: string,
    @Query('customerId') customerId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<OrderResponseDto[]> {
    // Mock implementation
    const mockOrders: OrderResponseDto[] = [
      {
        id: 1,
        orderNumber: 'ORD-2024-001',
        customerId: 1,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        status: OrderStatus.PENDING,
        shippingAddress: '123 Main St, City, State 12345',
        items: [
          {
            id: 1,
            productId: 1,
            productName: 'Sample Product',
            quantity: 2,
            unitPrice: 29.99,
            totalPrice: 59.98
          }
        ],
        totalAmount: 74.77,
        notes: 'Rush delivery requested',
        trackingNumber: undefined,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
      }
    ];
    
    return mockOrders;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order retrieved successfully',
    type: OrderResponseDto 
  })
  async getOrderById(@Param('id') id: number): Promise<OrderResponseDto> {
    // Mock implementation
    const mockOrder: OrderResponseDto = {
      id: Number(id),
      orderNumber: `ORD-2024-${String(id).padStart(3, '0')}`,
      customerId: 1,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      status: OrderStatus.PROCESSING,
      shippingAddress: '123 Main St, City, State 12345',
      items: [
        {
          id: 1,
          productId: 1,
          productName: 'Sample Product',
          quantity: 2,
          unitPrice: 29.99,
          totalPrice: 59.98
        }
      ],
      totalAmount: 74.77,
      notes: 'Rush delivery requested',
      trackingNumber: 'TRK123456789',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      updatedAt: new Date('2024-01-16T14:20:00Z')
    };
    
    return mockOrder;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order updated successfully',
    type: OrderResponseDto 
  })
  async updateOrder(
    @Param('id') id: number,
    @Body() updateOrderDto: UpdateOrderDto
  ): Promise<OrderResponseDto> {
    // Mock implementation
    const defaultItems: OrderItemResponseDto[] = [
      {
        id: 1,
        productId: 1,
        productName: 'Sample Product',
        quantity: 2,
        unitPrice: 29.99,
        totalPrice: 59.98
      }
    ];

    const items = updateOrderDto.items 
      ? updateOrderDto.items.map((item, index) => ({
          id: index + 1,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))
      : defaultItems;

    const mockOrder: OrderResponseDto = {
      id: Number(id),
      orderNumber: `ORD-2024-${String(id).padStart(3, '0')}`,
      customerId: 1,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      status: updateOrderDto.status || OrderStatus.PROCESSING,
      shippingAddress: updateOrderDto.shippingAddress || '123 Main St, City, State 12345',
      items: items,
      totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0),
      notes: updateOrderDto.notes || 'Updated order',
      trackingNumber: updateOrderDto.trackingNumber || 'TRK123456789',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      updatedAt: new Date()
    };
    
    return mockOrder;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order cancelled successfully' 
  })
  async cancelOrder(@Param('id') id: number): Promise<{ message: string; orderId: number; status: string }> {
    return {
      message: 'Order cancelled successfully',
      orderId: Number(id),
      status: 'cancelled'
    };
  }

  @Get(':id/statusABC')
  @ApiOperation({ summary: 'Get order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order status retrieved successfully' 
  })
  async getOrderStatus(@Param('id') id: number): Promise<{ 
    orderId: number; 
    status: string; 
    trackingNumber?: string; 
    estimatedDelivery?: Date 
  }> {
    return {
      orderId: Number(id),
      status: 'shipped',
      trackingNumber: 'TRK123456789',
      estimatedDelivery: new Date('2024-01-20T00:00:00Z')
    };
  }

  @Get('test-notification')
  @ApiOperation({ summary: 'Test realtime notification system' })
  @ApiResponse({ status: 200, description: 'Test endpoint for notifications' })
  testNotification() {
    return {
      message: 'Testing realtime notifications locally!',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      endpoint: 'test-notification'
    };
  }

  @Get('test-notification-2')
  @ApiOperation({ summary: 'Second test endpoint for notifications' })
  @ApiResponse({ status: 200, description: 'Another test endpoint' })
  testNotification2() {
    return {
      message: 'Second test endpoint added!',
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      endpoint: 'test-notification-2'
    };
  }

}
