import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './create-order.dto';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export class UpdateOrderDto {
  @ApiProperty({ 
    description: 'Order status', 
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
    required: false 
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ 
    description: 'Shipping address', 
    example: '456 Oak Ave, City, State 67890',
    required: false 
  })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiProperty({ 
    description: 'Order items', 
    type: [OrderItemDto],
    required: false,
    example: [
      {
        productId: 1,
        productName: 'Laptop',
        quantity: 2,
        unitPrice: 999.99
      }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @ApiProperty({ 
    description: 'Order notes', 
    example: 'Updated delivery instructions',
    required: false 
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'Tracking number', 
    example: 'TRK123456789',
    required: false 
  })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

