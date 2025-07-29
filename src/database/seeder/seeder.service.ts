import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import {
  Event,
  EventDocument,
} from '../../modules/timeline/schemas/event.schema';

@Injectable()
export class DataSeederService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    private readonly logger: Logger,
  ) {}

  async seed() {
    this.logger.log(
      'Checking database for existing data...',
      'DataSeederService',
    );

    try {
      const count = await this.eventModel.estimatedDocumentCount().exec();
      if (count > 0) {
        this.logger.log(
          `Database already contains ${count} records. Seeding skipped.`,
          'DataSeederService',
        );
        return;
      }
    } catch (error) {
      this.logger.error(
        'Error checking existing data in database',
        error.stack,
        'DataSeederService',
      );
      // Continue to attempt seeding even if count check fails, in case it's a transient issue
    }

    this.logger.log(
      'Starting to seed the database from CSV file...',
      'DataSeederService',
    );
    const csvFilePath = 'Test Events Data - Sheet1.csv';
    const results = [];

    // Check if the CSV file exists. In a Docker environment, this path is relative to the working directory.
    if (!fs.existsSync(csvFilePath)) {
      this.logger.error(
        `CSV file not found at ${csvFilePath}. Cannot seed data.`,
        '',
        'DataSeederService',
      );
      // Exit gracefully if the source data is missing.
      return;
    }

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            if (results.length > 0) {
              this.logger.log(
                `Parsed ${results.length} records from CSV. Inserting into database...`,
                'DataSeederService',
              );

              const events = results.map((record) => ({
                vehicleId: record.vehicleId,
                event: record.event,
                // Ensure timestamp is parsed as a Date object.
                timestamp: new Date(record.timestamp),
              }));

              await this.eventModel.insertMany(events);
              this.logger.log(
                'Database seeding completed successfully.',
                'DataSeederService',
              );
            } else {
              this.logger.warn(
                'CSV file is empty or contains no parsable records. No data to seed.',
                'DataSeederService',
              );
            }
            resolve();
          } catch (error) {
            this.logger.error(
              'Error during data insertion into database.',
              error.stack,
              'DataSeederService',
            );
            reject(error);
          }
        })
        .on('error', (error) => {
          this.logger.error(
            'Error reading or parsing CSV file.',
            error.stack,
            'DataSeederService',
          );
          reject(error);
        });
    });
  }
}
