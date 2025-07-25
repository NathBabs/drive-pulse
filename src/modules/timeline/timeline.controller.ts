import {
  Controller,
  Get,
  Query,
  Logger,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { GetTimelineDto } from './dto/get-timeline.dto';
import { Interval } from './interfaces/timeline.interface';

/**
 * @interface TimelineResponse
 * @description Defines the shape of a successful API response.
 */
interface TimelineResponse {
  success: boolean;
  message: string;
  data: Interval[] | null;
}

@Controller('timeline')
export class TimelineController {
  private readonly logger = new Logger(TimelineController.name);

  constructor(private readonly timelineService: TimelineService) {}

  /**
   * @method getTimeline
   * @description Retrieves the timeline for a specific vehicle within a given date range.
   * It validates the incoming query parameters using the GetTimelineDto.
   * @param getTimelineDto - The DTO containing startDate, endDate, and vehicleId.
   * @returns A structured response object with the timeline data.
   */
  @Get()
  // Use a ValidationPipe to automatically validate the incoming query DTO.
  // 'transform: true' will attempt to convert primitive types, e.g., string from a query param to a number if specified in the DTO.
  // 'whitelist: true' will strip any properties that do not have any decorators in the DTO.
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getTimeline(
    @Query() getTimelineDto: GetTimelineDto,
  ): Promise<TimelineResponse> {
    this.logger.log(
      `Timeline request received for vehicle: ${getTimelineDto.vehicleId} from ${getTimelineDto.startDate} to ${getTimelineDto.endDate}`,
    );

    try {
      const timelineData =
        await this.timelineService.generateTimeline(getTimelineDto);

      return {
        success: true,
        message: 'Timeline retrieved successfully.',
        data: timelineData,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate timeline for vehicle ${getTimelineDto.vehicleId}: ${error.message}`,
        error.stack,
      );

      // If the service throws a known HttpException, re-throw it to be handled by Nest's exception layer.
      if (error instanceof HttpException) {
        throw error;
      }

      // For any other unexpected errors, wrap them in a standard internal server error response.
      throw new HttpException(
        'An unexpected internal error occurred while processing your request.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
