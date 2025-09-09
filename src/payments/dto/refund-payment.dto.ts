import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ 
    description: 'Refund amount (must be less than or equal to original payment)', 
    example: 500.00,
    minimum: 0.01 
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ 
    description: 'Reason for refund', 
    example: 'Customer requested cancellation' 
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({ 
    description: 'Additional notes about the refund', 
    example: 'Processed due to product defect',
    required: false 
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'Notify customer via email', 
    example: true,
    default: true,
    required: false 
  })
  @IsOptional()
  notifyCustomer?: boolean;
}

export class RefundResponseDto {
  @ApiProperty({ description: 'Refund ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Refund reference number', example: 'REF-2024-001' })
  refundReference: string;

  @ApiProperty({ description: 'Original payment ID', example: 1 })
  paymentId: number;

  @ApiProperty({ description: 'Refund amount', example: 500.00 })
  amount: number;

  @ApiProperty({ description: 'Reason for refund', example: 'Customer requested cancellation' })
  reason: string;

  @ApiProperty({ description: 'Refund status', example: 'completed' })
  status: string;

  @ApiProperty({ description: 'Transaction ID from payment provider', example: 'ref_1234567890abcdef' })
  transactionId: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Refund creation date', example: '2024-01-15T15:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Refund completion date', example: '2024-01-15T15:32:00Z', required: false })
  completedAt?: Date;
}

