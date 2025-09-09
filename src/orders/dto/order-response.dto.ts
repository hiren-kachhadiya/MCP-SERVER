import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from './update-order.dto';

export class OrderItemResponseDto {
  @ApiProperty({ description: 'Order item ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Product ID', example: 1 })
  productId: number;

  @ApiProperty({ description: 'Product name', example: 'Laptop' })
  productName: string;

  @ApiProperty({ description: 'Quantity', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: 999.99 })
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item', example: 1999.98 })
  totalPrice: number;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Order number', example: 'ORD-2024-001' })
  orderNumber: string;

  @ApiProperty({ description: 'Customer ID', example: 1 })
  customerId: number;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  customerName: string;

  @ApiProperty({ description: 'Customer email', example: 'john@example.com' })
  customerEmail: string;

  @ApiProperty({ description: 'Shipping address', example: '123 Main St, City, State 12345' })
  shippingAddress: string;

  @ApiProperty({ 
    description: 'Order status', 
    enum: OrderStatus,
    example: OrderStatus.PENDING 
  })
  status: OrderStatus;

  @ApiProperty({ 
    description: 'Order items', 
    type: [OrderItemResponseDto],
    example: [
      {
        id: 1,
        productId: 1,
        productName: 'Laptop',
        quantity: 1,
        unitPrice: 999.99,
        totalPrice: 999.99
      }
    ]
  })
  items: OrderItemResponseDto[];

  @ApiProperty({ description: 'Total order amount', example: 999.99 })
  totalAmount: number;

  @ApiProperty({ description: 'Order notes', example: 'Please deliver after 5 PM', required: false })
  notes?: string;

  @ApiProperty({ description: 'Tracking number', example: 'TRK123456789', required: false })
  trackingNumber?: string;

  @ApiProperty({ description: 'Order creation date', example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Order last update date', example: '2024-01-15T14:20:00Z' })
  updatedAt: Date;
}

