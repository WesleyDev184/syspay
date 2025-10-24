import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ChargeStatus } from './response-charge.dto';

export class UpdateChargeStatusDto {
  @ApiPropertyOptional({
    enum: ChargeStatus,
    description: 'Novo status da cobrança',
  })
  @IsOptional()
  @IsEnum(ChargeStatus)
  status?: ChargeStatus;
}
