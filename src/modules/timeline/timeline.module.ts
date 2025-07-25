import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { Event, EventSchema } from './schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
  ],
  controllers: [TimelineController],
  providers: [TimelineService, Logger],
})
export class TimelineModule {}
