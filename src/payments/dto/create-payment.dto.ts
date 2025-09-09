import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, Min, IsEmail } from 'class-validator';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD'
}

export class PaymentCardDto {
  @ApiProperty({ description: 'Card number (masked)', example: '**** **** **** 1234' })
  @IsNotEmpty()
  @IsString()
  cardNumber: string;

  @ApiProperty({ description: 'Card holder name', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  cardHolderName: string;

  @ApiProperty({ description: 'Expiry month', example: '12' })
  @IsNotEmpty()
  @IsString()
  expiryMonth: string;

  @ApiProperty({ description: 'Expiry year', example: '2025' })
  @IsNotEmpty()
  @IsString()
  expiryYear: string;

  @ApiProperty({ description: 'CVV', example: '123' })
  @IsNotEmpty()
  @IsString()
  cvv: string;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: 'Customer ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @ApiProperty({ description: 'Customer email', example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ 
    description: 'Payment amount', 
    example: 999.99,
    minimum: 0.01 
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ 
    description: 'Currency', 
    enum: Currency,
    example: Currency.USD 
  })
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ 
    description: 'Payment method', 
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD 
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ 
    description: 'Card details (required for card payments)', 
    type: PaymentCardDto,
    required: false 
  })
  @IsOptional()
  cardDetails?: PaymentCardDto;

  @ApiProperty({ 
    description: 'PayPal email (required for PayPal payments)', 
    example: 'john@paypal.com',
    required: false 
  })
  @IsOptional()
  @IsEmail()
  paypalEmail?: string;

  @ApiProperty({ 
    description: 'Bank account number (required for bank transfer)', 
    example: 'ACC123456789',
    required: false 
  })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiProperty({ 
    description: 'Payment description', 
    example: 'Payment for Order #ORD-2024-001',
    required: false 
  })
  @IsOptional()
  @IsString()
  description?: string;
}

