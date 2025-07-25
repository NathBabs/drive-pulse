import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { DataSeederService } from '../../database/seeder/seeder.service';
import { Event, EventSchema } from './schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    // ConfigModule is needed to be able to read environment variables.
    ConfigModule,
  ],
  controllers: [TimelineController],
  // Make DataSeederService available for injection within this module.
  providers: [TimelineService, Logger, DataSeederService],
})
// Implement OnModuleInit to hook into the application startup lifecycle.
export class TimelineModule implements OnModuleInit {
  // Inject the services we need.
  constructor(
    private readonly seederService: DataSeederService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  /**
   * @method onModuleInit
   * @description This NestJS lifecycle hook runs once the module's dependencies are resolved.
   * We use it here to trigger the database seeder conditionally.
   */
  async onModuleInit() {
    // Check if the RUN_SEEDER environment variable is set to 'true'.
    if (this.configService.get<string>('RUN_SEEDER') === 'true') {
      this.logger.log(
        'RUN_SEEDER environment variable detected. Seeding database...',
        'TimelineModule',
      );

      // Await the completion of the seed method.
      await this.seederService.seed();

      this.logger.log(
        'Database seeding finished successfully. The application will now exit.',
        'TimelineModule',
      );

      // Exit the process with a success code. This is crucial. It prevents the
      // seeder instance from continuing to run as a web server after its job is done.
      process.exit(0);
    }
  }
}
