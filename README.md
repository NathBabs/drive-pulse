# DrivePulse Timeline API

This project is a Nest.js-based API designed to process and transform vehicle event data into a structured timeline format. It provides an endpoint that, given a vehicle ID and a time interval, returns a sequence of states for that vehicle, suitable for frontend timeline visualization.

The application is fully containerized with Docker, ensuring a consistent and easy-to-set-up development environment.

## Features

- **Timeline Generation**: Transforms raw vehicle events into a chronological sequence of states.
- **Robust Error Handling**: Implements comprehensive validation for all input parameters.
- **Database Integration**: Uses MongoDB to store and query event data.
- **Containerized Environment**: Fully containerized with Docker and Docker Compose for both the API and the database.
- **Automated Data Seeding**: Automatically loads the initial dataset from a CSV file into the database on the first run.
- **Configuration-driven**: Uses a `.env` file for easy configuration of ports and database credentials.
- **Unit Tested**: Includes a suite of unit tests for the core business logic to ensure reliability.

## Architecture

- **Framework**: [Nest.js](https://nestjs.com/) (a progressive Node.js framework for building efficient, reliable and scalable server-side applications).
- **Database**: [MongoDB](https://www.mongodb.com/) (a NoSQL database for handling large amounts of unstructured data).
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (for creating a consistent and isolated development environment).
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop).

## Setup and Installation

Follow these steps to get the application up and running.

**1. Clone the repository:**
```bash
git clone <repository-url>
cd drive-pulse
```

**2. Create the environment file:**
Create a file named `.env` in the root of the project. The defaults are configured to work out-of-the-box, but you can modify them if needed.
The essential variables are:
- `API_PORT`
- `MONGO_PORT`
- `MONGO_INITDB_ROOT_USERNAME`
- `MONGO_INITDB_ROOT_PASSWORD`
- `MONGO_INITDB_DATABASE`
- `DATABASE_URL`

**3. Build and Run the Application:**
Use Docker Compose to build the images and start the services.
```bash
docker-compose up --build
```
This command will:
- Build the Docker images for the Nest.js API and the MongoDB database.
- Start both containers.
- On the very first run, create a persistent volume for the database and execute the `init-mongo.sh` script to seed the `events` collection from the `Test Events Data - Sheet1.csv` file.

The API will be available at `http://localhost:3000` (or the port you specified in `API_PORT`).

## API Endpoint Documentation

### Get Vehicle Timeline

Returns a chronological sequence of states for a given vehicle within a specified time interval.

- **URL**: `/timeline`
- **Method**: `GET`
- **Query Parameters**:
  - `vehicleId` (string, **required**): The unique identifier for the vehicle.
  - `startDate` (string, **required**): The start of the time interval in UTC ISO-8601 format (e.g., `2023-12-13T00:08:40.000Z`).
  - `endDate` (string, **required**): The end of the time interval in UTC ISO-8601 format.

---

### Usage and Examples

#### Example 1: Standard Request

```bash
curl "http://localhost:3000/timeline?vehicleId=sprint-4&startDate=2023-12-13T00:08:40.000Z&endDate=2023-12-13T00:15:07.000Z"
```

**Successful Response (200 OK):**
The `from` and `to` fields are UTC timestamps in milliseconds.
```json
{
    "success": true,
    "message": "Timeline retrieved successfully.",
    "data": [
        {
            "from": 1702426120000,
            "to": 1702426123000,
            "event": "error"
        },
        {
            "from": 1702426123000,
            "to": 1702426506000,
            "event": "not_ready"
        },
        {
            "from": 1702426506000,
            "to": 1702426507000,
            "event": "vehicle_error"
        }
    ]
}
```

#### Example 2: Request with "No Data"

If there are no events recorded for the vehicle before the `startDate`.

```bash
curl "http://localhost:3000/timeline?vehicleId=sprint-3&startDate=2023-12-13T00:00:00.000Z&endDate=2023-12-13T00:02:00.000Z"
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Timeline retrieved successfully.",
    "data": [
        {
            "from": 1702425600000,
            "to": 1702425720000,
            "event": "no_data"
        }
    ]
}
```

### Error Responses

If the input parameters are invalid, the API will return a `400 Bad Request` with a descriptive error message.

#### Example: Invalid `startDate` format

```bash
curl "http://localhost:3000/timeline?vehicleId=sprint-3&startDate=not-a-date&endDate=2024-01-01T00:00:00Z" -i
```

**Response (400 Bad Request):**
```json
{
    "statusCode": 400,
    "message": [
        "startDate must be a valid ISO 8601 date string (e.g., 2024-01-01T00:00:00Z)."
    ],
    "error": "Bad Request"
}
```

## Running Tests

The project includes unit tests for the core service logic. To run the tests, you can execute the following command:

```bash
yarn test
```

This will run all `.spec.ts` files in the project. To run tests for a specific file:
```bash
yarn test src/modules/timeline/timeline.service.spec.ts
```
