import { Module } from '@nestjs/common';
import { AuthProvider } from '../../config/auth/auth.provider';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [AuthProvider],
  exports: [AuthProvider],
})
export class UsersModule {}
