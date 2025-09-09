import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsArray, ValidateNested, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty({ description: 'Product name', example: 'Laptop' })
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Quantity', example: 2, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: 999.99, minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Customer email', example: 'john@example.com' })
  @IsNotEmpty()
  @IsString()
  customerEmail: string;

  @ApiProperty({ 
    description: 'Shipping address', 
    example: '123 Main St, City, State 12345' 
  })
  @IsNotEmpty()
  @IsString()
  shippingAddress: string;

  @ApiProperty({ 
    description: 'Order items', 
    type: [OrderItemDto],
    example: [
      {
        productId: 1,
        productName: 'Laptop',
        quantity: 1,
        unitPrice: 999.99
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ 
    description: 'Order notes (optional)', 
    example: 'Please deliver after 5 PM',
    required: false 
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

