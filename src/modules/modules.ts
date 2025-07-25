import { Module } from '@nestjs/common';
import { TimelineModule } from './timeline/timeline.module';

@Module({
  imports: [TimelineModule],
  controllers: [],
  providers: [],
})
export class Modules {}
