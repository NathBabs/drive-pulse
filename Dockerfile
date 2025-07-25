# Stage 1: Data Preparation Stage
# This stage is used to gather the necessary data and initialization scripts.
# Using a multi-stage build here allows for potential future data processing steps
# before it gets moved to the final database image.
FROM busybox:latest AS data_preparer

WORKDIR /data

# Copy the CSV data file and the initialization script into this stage.
# Using the JSON array format for COPY is a robust way to handle paths with spaces.
COPY ["Test Events Data - Sheet1.csv", "./"]
COPY ["init-mongo.sh", "./"]
COPY ["mongod.conf", "./"]


# Stage 2: Final MongoDB Image
# This stage uses the official MongoDB image and populates it with our data.
FROM mongo:latest

# Copy the data and the initialization script from the preparation stage
# into the /docker-entrypoint-initdb.d/ directory. The official mongo image
# is configured to automatically execute any .sh or .js files in this
# directory when the container is created for the first time.
COPY --from=data_preparer /data/ /docker-entrypoint-initdb.d/

ENTRYPOINT [ "mongod",  "--config", "/etc/mongod.conf" ]

# Ensure the initialization script is executable.
RUN chmod +x /docker-entrypoint-initdb.d/init-mongo.sh
