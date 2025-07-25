#!/bin/bash
# Use set -x to print every command that is executed, for easier debugging.
set -ex

# --- Wait for MongoDB to be ready ---
# This loop will try to connect to the database every second until it succeeds.
# This prevents the import from running before the server is ready to accept connections.
echo "Waiting for MongoDB to start..."
# We use mongosh --eval to run a simple, non-intrusive command.
# It will fail with a non-zero exit code until the server is ready, which is what the 'until' loop needs.
# The output is redirected to /dev/null to keep the logs clean.
until mongosh --host localhost --eval "db.adminCommand('ping')" > /dev/null 2>&1
do
    echo "Still waiting for MongoDB..."
    sleep 1
done
echo "MongoDB is ready. Starting data import..."


# --- Run the Import ---
# The CSV's header row is skipped using `tail -n +2` and the result is piped to mongoimport.
# --columnsHaveTypes is a crucial flag that tells mongoimport to parse the type specifiers in the --fields list.
# The 'id' field from the CSV is imported as a string, as MongoDB will provide its own unique _id.
tail -n +2 "/docker-entrypoint-initdb.d/Test Events Data - Sheet1.csv" | mongoimport \
    --host localhost \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --db "$MONGO_INITDB_DATABASE" \
    --collection events \
    --type csv \
    --columnsHaveTypes \
    --fields "id.string(),timestamp.date(2006-01-02 15:04:05),vehicleId.string(),event.string()" \
    --drop

echo "--- Data import finished successfully ---"
