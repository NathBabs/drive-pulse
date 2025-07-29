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
  ],
  controllers: [TimelineController],
  providers: [TimelineService, Logger, DataSeederService],
})
// Implement OnModuleInit to hook into the application startup lifecycle.
export class TimelineModule implements OnModuleInit {
  // Inject the services we need.
  constructor(
    private readonly seederService: DataSeederService,
    private readonly logger: Logger,
  ) {}

  /**
   * @method onModuleInit
   * @description This NestJS lifecycle hook runs once the module's dependencies are resolved.
   * We use it here to trigger the database seeder conditionally.
   */
  async onModuleInit() {
    // Await the completion of the seed method.
    await this.seederService.seed();
  }
}
