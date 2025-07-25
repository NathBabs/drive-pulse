import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { Event } from '../../modules/timeline/schemas/event.schema';
import { join } from 'path';

@Injectable()
export class DataSeederService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
    private readonly logger: Logger,
  ) {}

  async seed() {
    try {
      this.logger.log('Checking database for existing data...', 'DataSeederService');
      const count = await this.eventModel.countDocuments().exec();

      if (count > 0) {
        this.logger.log('Database is not empty. Skipping seeding.', 'DataSeederService');
        return;
      }

      this.logger.log('Starting to seed the database from CSV file...', 'DataSeederService');
      const events = await this.parseCsv();

      if (events.length > 0) {
        this.logger.log(`Parsed ${events.length} records from CSV. Inserting into database...`, 'DataSeederService');
        await this.eventModel.insertMany(events, { ordered: false });
        this.logger.log('Database seeding completed successfully.', 'DataSeederService');
      } else {
        this.logger.log('CSV file is empty or contains no valid data. No data to seed.', 'DataSeederService');
      }
    } catch (error) {
      this.logger.error('An error occurred during the seeding process:', error.stack, 'DataSeederService');
      throw error;
    }
  }

  private parseCsv(): Promise<Partial<Event>[]> {
    return new Promise((resolve, reject) => {
      const events: Partial<Event>[] = [];
      // Assuming the CSV file is in the project root
      const csvFilePath = join(process.cwd(), 'Test Events Data - Sheet1.csv');

      if (!fs.existsSync(csvFilePath)) {
          const fileNotFoundError = new Error(`CSV file not found at path: ${csvFilePath}`);
          this.logger.error(fileNotFoundError.message, 'DataSeederService');
          return reject(fileNotFoundError);
      }

      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          const event: Partial<Event> = {
            vehicleId: row.vehicleId,
            event: row.event,
            timestamp: new Date(row.timestamp),
          };

          if (event.vehicleId && event.event && !isNaN(event.timestamp.getTime())) {
            events.push(event);
          } else {
            this.logger.warn(`Skipping invalid row from CSV: ${JSON.stringify(row)}`, 'DataSeederService');
          }
        })
        .on('end', () => {
          this.logger.log('CSV file successfully processed.', 'DataSeederService');
          resolve(events);
        })
        .on('error', (error) => {
          this.logger.error('Error while reading or parsing CSV file:', error.stack, 'DataSeederService');
          reject(error);
        });
    });
  }
}
