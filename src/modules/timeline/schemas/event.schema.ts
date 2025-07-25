import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema({
  timestamps: true,
  collection: 'events',
})
export class Event extends Document {
  @Prop({ required: true, index: true })
  vehicleId: string;

  @Prop({ required: true })
  event: string;

  @Prop({ required: true, index: true })
  timestamp: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
