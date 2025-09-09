import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, Currency } from './create-payment.dto';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Payment reference number', example: 'PAY-2024-001' })
  paymentReference: string;

  @ApiProperty({ description: 'Order ID', example: 1 })
  orderId: number;

  @ApiProperty({ description: 'Customer ID', example: 1 })
  customerId: number;

  @ApiProperty({ description: 'Customer email', example: 'john@example.com' })
  customerEmail: string;

  @ApiProperty({ description: 'Payment amount', example: 999.99 })
  amount: number;

  @ApiProperty({ 
    description: 'Currency', 
    enum: Currency,
    example: Currency.USD 
  })
  currency: Currency;

  @ApiProperty({ 
    description: 'Payment method', 
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD 
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ 
    description: 'Payment status', 
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED 
  })
  status: PaymentStatus;

  @ApiProperty({ 
    description: 'Transaction ID from payment provider', 
    example: 'txn_1234567890abcdef' 
  })
  transactionId: string;

  @ApiProperty({ 
    description: 'Payment gateway response', 
    example: 'Payment processed successfully' 
  })
  gatewayResponse: string;

  @ApiProperty({ 
    description: 'Last 4 digits of card (for card payments)', 
    example: '1234',
    required: false 
  })
  cardLast4?: string;

  @ApiProperty({ 
    description: 'Card brand (for card payments)', 
    example: 'Visa',
    required: false 
  })
  cardBrand?: string;

  @ApiProperty({ 
    description: 'Payment description', 
    example: 'Payment for Order #ORD-2024-001',
    required: false 
  })
  description?: string;

  @ApiProperty({ 
    description: 'Processing fee', 
    example: 29.99,
    required: false 
  })
  processingFee?: number;

  @ApiProperty({ 
    description: 'Net amount after fees', 
    example: 969.99 
  })
  netAmount: number;

  @ApiProperty({ description: 'Payment creation date', example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Payment completion date', example: '2024-01-15T10:32:00Z', required: false })
  completedAt?: Date;

  @ApiProperty({ description: 'Payment last update date', example: '2024-01-15T10:32:00Z' })
  updatedAt: Date;
}

