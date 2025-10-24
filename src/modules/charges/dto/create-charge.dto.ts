import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
}

export enum Currency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR',
}

// DTOs para dados específicos de cada método de pagamento
export class PixPaymentDataDto {
  @ApiPropertyOptional({ description: 'Chave Pix (opcional)' })
  @IsOptional()
  @IsString()
  pixKey?: string;

  @ApiProperty({
    description: 'Data de expiração do QR Code',
    example: '2025-10-22T23:59:59Z',
  })
  @IsNotEmpty()
  @IsDateString()
  expiresAt: string;
}

export class CreditCardPaymentDataDto {
  @ApiProperty({ description: 'Nome do titular do cartão' })
  @IsNotEmpty()
  @IsString()
  cardHolderName: string;

  @ApiProperty({
    description: 'Token do cartão (gerado por gateway de pagamento)',
  })
  @IsNotEmpty()
  @IsString()
  cardToken: string;

  @ApiProperty({ description: 'Últimos 4 dígitos do cartão', example: '1234' })
  @IsNotEmpty()
  @IsString()
  cardLastDigits: string;

  @ApiProperty({ description: 'Bandeira do cartão', example: 'Visa' })
  @IsNotEmpty()
  @IsString()
  cardBrand: string;

  @ApiProperty({ description: 'Número de parcelas', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number = 1;
}

export class BoletoPaymentDataDto {
  @ApiProperty({
    description: 'Data de vencimento do boleto',
    example: '2025-10-30',
  })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;
}

export class CreateChargeDto {
  @ApiProperty({
    description: 'Valor da cobrança',
    example: 100.5,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    enum: Currency,
    description: 'Moeda da transação',
    default: Currency.BRL,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency = Currency.BRL;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'ID do usuário (cliente)' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Descrição da cobrança' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Chave de idempotência (para evitar cobranças duplicadas)',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  // Dados específicos por método de pagamento
  @ApiPropertyOptional({
    type: PixPaymentDataDto,
    description: 'Dados do pagamento PIX (obrigatório se paymentMethod = PIX)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PixPaymentDataDto)
  pixData?: PixPaymentDataDto;

  @ApiPropertyOptional({
    type: CreditCardPaymentDataDto,
    description:
      'Dados do cartão de crédito (obrigatório se paymentMethod = CREDIT_CARD)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardPaymentDataDto)
  creditCardData?: CreditCardPaymentDataDto;

  @ApiPropertyOptional({
    type: BoletoPaymentDataDto,
    description: 'Dados do boleto (obrigatório se paymentMethod = BOLETO)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BoletoPaymentDataDto)
  boletoData?: BoletoPaymentDataDto;
}
