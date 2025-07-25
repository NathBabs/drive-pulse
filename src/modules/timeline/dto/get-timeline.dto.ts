import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';
import { IsBefore } from '../../../common/decorators/is-before.decorator';

/**
 * @class GetTimelineDto
 * @description Data transfer object for timeline queries.
 * Defines the structure and validation rules for the input parameters.
 */
export class GetTimelineDto {
  /**
   * @property startDate
   * @description The start of the time interval. Must be a valid ISO 8601 date string and must occur before the endDate.
   * @example "2024-01-01T00:00:00Z"
   */
  @IsISO8601(
    {},
    {
      message:
        'startDate must be a valid ISO 8601 date string (e.g., 2024-01-01T00:00:00Z).',
    },
  )
  @IsNotEmpty({ message: 'startDate should not be empty.' })
  @IsBefore('endDate', {
    message: 'startDate must be a date that occurs before endDate.',
  })
  readonly startDate: string;

  /**
   * @property endDate
   * @description The end of the time interval. Must be a valid ISO 8601 date string.
   * @example "2024-01-02T00:00:00Z"
   */
  @IsISO8601(
    {},
    {
      message:
        'endDate must be a valid ISO 8601 date string (e.g., 2024-01-02T00:00:00Z).',
    },
  )
  @IsNotEmpty({ message: 'endDate should not be empty.' })
  readonly endDate: string;

  /**
   * @property vehicleId
   * @description The ID of the vehicle to retrieve the timeline for. Must be a non-empty string.
   * @example "sprint-3"
   */
  @IsString({ message: 'vehicleId must be a string.' })
  @IsNotEmpty({ message: 'vehicleId should not be empty.' })
  readonly vehicleId: string;
}
