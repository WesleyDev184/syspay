import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty({
    description: 'Senha do usuário para confirmação da exclusão',
    example: 'senha123',
    minLength: 6,
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
