import { auth } from '@config/auth/auth';
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ChargesModule } from './modules/charges/charges.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './shared/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule.forRoot(auth),
    UsersModule,
    ChargesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
