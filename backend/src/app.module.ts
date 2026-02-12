import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { InterventionsModule } from './modules/interventions/interventions.module';
import { FinanceModule } from './modules/finance/finance.module';
import { StockModule } from './modules/stock/stock.module';
import { SettingsModule } from './modules/settings/settings.module';
import { OwnersModule } from './modules/owners/owners.module';
import { CashModule } from './modules/cash/cash.module';

// Common
import { SupabaseModule } from './common/supabase/supabase.module';
import { TenantModule } from './common/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 30,
    }]),
    SupabaseModule,
    TenantModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    InterventionsModule,
    FinanceModule,
    StockModule,
    SettingsModule,
    OwnersModule,
    CashModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
