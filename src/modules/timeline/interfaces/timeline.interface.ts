/**
 * @interface Interval
 * @description Defines the structure of a single time interval in the timeline response.
 */
export interface Interval {
  /**
   * @property from
   * @description The start timestamp of the interval in UTC milliseconds since the epoch.
   * @example 1704125614000
   */
  from: number;

  /**
   * @property to
   * @description The end timestamp of the interval in UTC milliseconds since the epoch.
   * @example 1704132000000
   */
  to: number;

  /**
   * @property event
   * @description The status or event type of the vehicle during this interval.
   * Can be 'no_data' if there is no preceding event information.
   * @example "running" | "offline" | "no_data"
   */
  event: string;
}
