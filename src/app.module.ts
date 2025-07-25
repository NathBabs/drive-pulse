import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Modules } from './modules/modules';

@Module({
  imports: [
    // Set up the ConfigModule to be global, so it's available everywhere.
    // It automatically loads variables from the root .env file.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    Modules,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
