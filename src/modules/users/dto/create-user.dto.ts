import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Maria Silva',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name: string;

  @ApiProperty({
    description: 'Endereço de email do usuário',
    example: 'maria@example.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'senha123',
    minLength: 6,
    maxLength: 128,
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  @Length(6, 128)
  password: string;

  @ApiProperty({
    description: 'Número de telefone com código do país',
    example: '+5511999999999',
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Número de telefone inválido. Use formato internacional: +5511999999999',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Documento do usuário (CPF ou outro identificador)',
    example: '123.456.789-00',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiPropertyOptional({
    description: 'URL da imagem de avatar do usuário',
    example: 'https://example.com/avatar.jpg',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiPropertyOptional({
    description: 'Manter usuário conectado (sessão persistente)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
