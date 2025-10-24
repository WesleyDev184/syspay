import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentMethod } from './create-charge.dto';
import { ChargeStatus } from './response-charge.dto';

export class QueryChargeDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID do usuário' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: ChargeStatus,
    description: 'Filtrar por status',
  })
  @IsOptional()
  @IsEnum(ChargeStatus)
  status?: ChargeStatus;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Filtrar por método de pagamento',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
