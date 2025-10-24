import { AuthProvider } from '@config/auth/auth.provider';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { ChargesController } from './charges.controller';
import { ChargesService } from './charges.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ChargesController],
  providers: [ChargesService, AuthProvider],
  exports: [ChargesService, AuthProvider],
})
export class ChargesModule {}
