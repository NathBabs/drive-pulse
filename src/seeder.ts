import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederModule } from './database/seeder/seeder.module';
import { DataSeederService } from './database/seeder/seeder.service';

async function bootstrap() {
  const logger = new Logger('Seeder');

  const appContext = await NestFactory.createApplicationContext(SeederModule, {
    // Disable logging of NestJS bootstrap messages
    logger: ['error', 'warn'],
  });

  const seeder = appContext.get(DataSeederService);

  try {
    logger.log('Starting the seeding process...');
    await seeder.seed();
    logger.log('Seeding completed successfully.');
  } catch (error) {
    logger.error('Seeding failed.', error.stack);
    process.exit(1); // Exit with a non-zero code to indicate failure
  } finally {
    await appContext.close();
    logger.log('Application context closed.');
    process.exit(0);
  }
}

bootstrap();
