import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nome completo do usuário',
    example: 'Maria Silva',
    minLength: 3,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem de avatar do usuário',
    example: 'https://example.com/avatar.jpg',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiPropertyOptional({
    description: 'Documento do usuário (CPF ou outro identificador)',
    example: '123.456.789-00',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    description: 'Número de telefone com código do país',
    example: '+5511999999999',
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Número de telefone inválido. Use formato internacional: +5511999999999',
  })
  phoneNumber?: string;
}
