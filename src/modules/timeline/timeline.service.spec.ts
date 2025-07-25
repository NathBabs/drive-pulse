import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Logger } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { Event } from './schemas/event.schema';
import { GetTimelineDto } from './dto/get-timeline.dto';
import { Interval } from './interfaces/timeline.interface';

// Mock Mongoose Model
type MockModel<T = any> = Model<T> & {
  findOne: jest.Mock;
  find: jest.Mock;
  sort: jest.Mock;
  exec: jest.Mock;
};

const createMockModel = (): MockModel =>
  ({
    findOne: jest.fn(),
    find: jest.fn(),
    sort: jest.fn(() => ({ exec: jest.fn() })),
    exec: jest.fn(),
  }) as any;

describe('TimelineService', () => {
  let service: TimelineService;
  let eventModel: MockModel;

  const vehicleId = 'test-vehicle-1';
  const startDate = '2024-01-10T10:00:00.000Z';
  const endDate = '2024-01-10T12:00:00.000Z';
  const startDateMs = new Date(startDate).getTime();
  const endDateMs = new Date(endDate).getTime();

  const getTimelineDto: GetTimelineDto = {
    vehicleId,
    startDate,
    endDate,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        {
          provide: getModelToken(Event.name),
          useValue: createMockModel(),
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TimelineService>(TimelineService);
    eventModel = module.get<MockModel>(getModelToken(Event.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTimeline', () => {
    it('should return a single "no_data" interval if no events exist for the vehicle', async () => {
      // No initial event
      (eventModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      // No events in interval
      (eventModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result: Interval[] = await service.generateTimeline(getTimelineDto);

      expect(result).toEqual([
        {
          from: startDateMs,
          to: endDateMs,
          event: 'no_data',
        },
      ]);
    });

    it('should use the initial event state if no events are within the interval', async () => {
      const initialEvent = {
        vehicleId,
        event: 'offline',
        timestamp: new Date('2024-01-10T09:59:00.000Z'),
      };
      (eventModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(initialEvent),
      });
      (eventModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.generateTimeline(getTimelineDto);
      expect(result).toEqual([
        {
          from: startDateMs,
          to: endDateMs,
          event: 'offline',
        },
      ]);
    });

    it('should handle a simple case with one event change in the interval', async () => {
      const initialEvent = {
        event: 'offline',
        timestamp: new Date('2024-01-10T09:00:00Z'),
      };
      const eventsInInterval = [
        { event: 'running', timestamp: new Date('2024-01-10T11:00:00.000Z') },
      ];

      (eventModel.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(initialEvent) }),
      });
      (eventModel.find as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(eventsInInterval) }),
      });

      const result = await service.generateTimeline(getTimelineDto);
      const eventChangeTime = new Date('2024-01-10T11:00:00.000Z').getTime();

      expect(result).toEqual([
        { from: startDateMs, to: eventChangeTime, event: 'offline' },
        { from: eventChangeTime, to: endDateMs, event: 'running' },
      ]);
    });

    it('should create a single interval if all events (including initial) have the same state', async () => {
      const initialEvent = {
        event: 'running',
        timestamp: new Date('2024-01-10T09:00:00Z'),
      };
      const eventsInInterval = [
        { event: 'running', timestamp: new Date('2024-01-10T11:00:00.000Z') },
        { event: 'running', timestamp: new Date('2024-01-10T11:30:00.000Z') },
      ];

      (eventModel.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(initialEvent) }),
      });
      (eventModel.find as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(eventsInInterval) }),
      });

      const result = await service.generateTimeline(getTimelineDto);

      expect(result).toEqual([
        { from: startDateMs, to: endDateMs, event: 'running' },
      ]);
    });

    it('should correctly handle an event occurring exactly at the startDate', async () => {
      const initialEvent = {
        event: 'offline',
        timestamp: new Date('2024-01-10T09:00:00Z'),
      };
      const eventsInInterval = [
        { event: 'running', timestamp: new Date(startDate) },
      ];

      (eventModel.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(initialEvent) }),
      });
      (eventModel.find as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(eventsInInterval) }),
      });

      const result = await service.generateTimeline(getTimelineDto);

      expect(result).toEqual([
        { from: startDateMs, to: endDateMs, event: 'running' },
      ]);
    });

    it('should correctly handle an event occurring exactly at the endDate', async () => {
      const initialEvent = {
        event: 'offline',
        timestamp: new Date('2024-01-10T09:00:00Z'),
      };
      const eventsInInterval = [
        { event: 'running', timestamp: new Date(endDate) },
      ];

      (eventModel.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(initialEvent) }),
      });
      (eventModel.find as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(eventsInInterval) }),
      });

      const result = await service.generateTimeline(getTimelineDto);

      expect(result).toEqual([
        { from: startDateMs, to: endDateMs, event: 'offline' },
      ]);
    });

    it('should merge consecutive similar events into one interval', async () => {
      const initialEvent = {
        event: 'offline',
        timestamp: new Date('2024-01-10T09:00:00Z'),
      };
      const eventsInInterval = [
        { event: 'running', timestamp: new Date('2024-01-10T10:30:00Z') },
        { event: 'running', timestamp: new Date('2024-01-10T11:00:00Z') }, // This should be merged
        { event: 'error', timestamp: new Date('2024-01-10T11:30:00Z') },
      ];

      (eventModel.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(initialEvent) }),
      });
      (eventModel.find as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(eventsInInterval) }),
      });

      const result = await service.generateTimeline(getTimelineDto);
      const time1 = new Date('2024-01-10T10:30:00Z').getTime();
      const time2 = new Date('2024-01-10T11:30:00Z').getTime();

      expect(result).toEqual([
        { from: startDateMs, to: time1, event: 'offline' },
        {
          from: time1,
          to: time2,
          event: 'running',
        },
        { from: time2, to: endDateMs, event: 'error' },
      ]);
    });

    it('should handle a complex sequence of events correctly', async () => {
      const initialEvent = {
        event: 'running',
        timestamp: new Date('2024-01-10T09:59:00Z'),
      };
      const eventsInInterval = [
        { event: 'offline', timestamp: new Date('2024-01-10T10:15:00Z') },
        { event: 'offline', timestamp: new Date('2024-01-10T10:30:00Z') },
        { event: 'error', timestamp: new Date('2024-01-10T11:00:00Z') },
        { event: 'running', timestamp: new Date('2024-01-10T11:45:00Z') },
      ];

      (eventModel.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(initialEvent) }),
      });
      (eventModel.find as jest.Mock).mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue(eventsInInterval) }),
      });

      const result = await service.generateTimeline(getTimelineDto);

      const time1 = new Date('2024-01-10T10:15:00Z').getTime();
      const time2 = new Date('2024-01-10T11:00:00Z').getTime();
      const time3 = new Date('2024-01-10T11:45:00Z').getTime();

      expect(result).toEqual([
        { from: startDateMs, to: time1, event: 'running' },
        {
          from: time1,
          to: time2,
          event: 'offline',
        },
        {
          from: time2,
          to: time3,
          event: 'error',
        },
        { from: time3, to: endDateMs, event: 'running' },
      ]);
    });
  });
});
