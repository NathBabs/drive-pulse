import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetTimelineDto } from './dto/get-timeline.dto';
import { Interval } from './interfaces/timeline.interface';
import { Event } from './schemas/event.schema';

@Injectable()
export class TimelineService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
    private readonly logger: Logger,
  ) {}

  /**
   * Generates a timeline of vehicle events for a given period.
   * @param {GetTimelineDto} getTimelineDto - The DTO containing query parameters.
   * @returns {Promise<Interval[]>} A promise that resolves to an array of timeline intervals.
   */
  async generateTimeline(getTimelineDto: GetTimelineDto): Promise<Interval[]> {
    const { vehicleId, startDate, endDate } = getTimelineDto;
    this.logger.log(
      `Generating timeline for vehicleId: ${vehicleId} from ${startDate} to ${endDate}`,
      TimelineService.name,
    );

    try {
      // 1. Fetch the last known event before the startDate to determine the initial state.
      const initialEvent = await this.findLatestEventBefore(
        vehicleId,
        new Date(startDate),
      );

      // 2. Fetch all events within the specified [startDate, endDate] interval.
      const eventsInInterval = await this.findEventsInInterval(
        vehicleId,
        new Date(startDate),
        new Date(endDate),
      );

      // 3. Construct the timeline based on the initial state and subsequent events.
      return this.buildIntervals(
        startDate,
        endDate,
        initialEvent,
        eventsInInterval,
      );
    } catch (error) {
      this.logger.error(
        `Error generating timeline for vehicle ${vehicleId}: ${error.message}`,
        error.stack,
        TimelineService.name,
      );
      // Re-throw database or other unexpected errors as a generic internal server error.
      throw new HttpException(
        'Failed to generate timeline due to an internal error.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Finds the most recent event for a vehicle before a given timestamp.
   * @private
   */
  private async findLatestEventBefore(
    vehicleId: string,
    timestamp: Date,
  ): Promise<Event | null> {
    return this.eventModel
      .findOne({
        vehicleId,
        timestamp: { $lt: timestamp },
      })
      .sort({ timestamp: -1 })
      .exec();
  }

  /**
   * Finds all events for a vehicle within a given time interval.
   * @private
   */
  private async findEventsInInterval(
    vehicleId: string,
    start: Date,
    end: Date,
  ): Promise<Event[]> {
    return this.eventModel
      .find({
        vehicleId,
        timestamp: {
          $gte: start,
          $lte: end,
        },
      })
      .sort({ timestamp: 'asc' })
      .exec();
  }

  /**
   * Constructs the array of timeline intervals.
   * @private
   */
  private buildIntervals(
    startDate: string,
    endDate: string,
    initialEvent: Event | null,
    events: Event[],
  ): Interval[] {
    const timeline: Interval[] = [];
    let currentEventState = initialEvent?.event || 'no_data';
    let lastTimestamp = new Date(startDate);

    // Process each event within the interval
    for (const event of events) {
      const eventTimestamp = event.timestamp;

      // If the event's timestamp is the same as the last timestamp, we just update the state.
      // This handles cases where an event happens exactly at the start of a period.
      if (eventTimestamp.getTime() === lastTimestamp.getTime()) {
        currentEventState = event.event;
        continue;
      }

      // If the event introduces a new state, the previous state interval ends here.
      if (event.event !== currentEventState) {
        timeline.push({
          from: lastTimestamp.getTime(),
          to: eventTimestamp.getTime(),
          event: currentEventState,
        });

        // The new state starts from this event's timestamp.
        lastTimestamp = eventTimestamp;
        currentEventState = event.event;
      }
      // If the event state is the same, we do nothing and let the interval extend.
    }

    const endDateMs = new Date(endDate).getTime();
    // After the last event, the final state continues until the endDate.
    // This also handles the case where there are no events in the interval.
    if (lastTimestamp.getTime() < endDateMs) {
      timeline.push({
        from: lastTimestamp.getTime(),
        to: endDateMs,
        event: currentEventState,
      });
    }

    // If the timeline is still empty (which can happen if the last event timestamp equals the endDate),
    // it means one state persisted for the entire duration.
    if (timeline.length === 0) {
      timeline.push({
        from: new Date(startDate).getTime(),
        to: endDateMs,
        event: currentEventState,
      });
    }

    // Safeguard to ensure the timeline boundaries match the request exactly.
    if (timeline.length > 0) {
      timeline[0].from = new Date(startDate).getTime();
      timeline[timeline.length - 1].to = endDateMs;
    }

    this.logger.log(
      `Successfully built ${timeline.length} intervals.`,
      TimelineService.name,
    );

    return timeline;
  }
}
