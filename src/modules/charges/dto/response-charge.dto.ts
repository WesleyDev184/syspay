import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChargeStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class PixPaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  pixKey?: string;

  @ApiPropertyOptional()
  qrCode?: string;

  @ApiPropertyOptional()
  qrCodeBase64?: string;

  @ApiPropertyOptional()
  emvCode?: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}

export class CreditCardPaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cardHolderName: string;

  @ApiProperty()
  cardLastDigits: string;

  @ApiProperty()
  cardBrand: string;

  @ApiProperty()
  installments: number;

  @ApiProperty()
  installmentAmount: number;

  @ApiProperty()
  createdAt: Date;
}

export class BoletoPaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiPropertyOptional()
  digitableLine?: string;

  @ApiPropertyOptional()
  boletoUrl?: string;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ChargeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: ChargeStatus })
  status: ChargeStatus;

  @ApiProperty()
  paymentMethod: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ type: PixPaymentResponseDto })
  pixData?: PixPaymentResponseDto;

  @ApiPropertyOptional({ type: CreditCardPaymentResponseDto })
  creditCardData?: CreditCardPaymentResponseDto;

  @ApiPropertyOptional({ type: BoletoPaymentResponseDto })
  boletoData?: BoletoPaymentResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;
}
