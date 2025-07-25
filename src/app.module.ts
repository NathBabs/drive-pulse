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
      // By removing `envFilePath`, NestJS will load a .env file if it exists,\n
      // but will not fail if it doesn\'t. It will always prioritize\n
      // environment variables provided by the runtime (like from Docker Compose or Koyeb).\n
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
