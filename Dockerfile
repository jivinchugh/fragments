# Use node version v20.17.0
FROM node:20.17.0@sha256:a5e0ed56f2c20b9689e0f7dd498cac7e08d2a3a283e92d9304e7b9b83e3c6ff3 AS dependencies

LABEL maintainer="Jivin Chugh <jivinchugh18@gmail.com>" \
      description="Fragments node.js microservice"

# We default to use port 8080 in our service
ENV PORT=8080 \ 
# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
NPM_CONFIG_LOGLEVEL=warn \ 
# https://docs.npmjs.com/cli/v8/using-npm/config#color
# Disable colour when run inside Docker
NPM_CONFIG_COLOR=false \ NODE_ENV=production
# Use /app as our working directory
WORKDIR /app

# Copy the package.json and package-lock.json
# files into /app (the working directory).
COPY package*.json ./

# Install node dependencies defined in package-lock.json
#RUN npm install

# Install only production dependencies
RUN npm ci --only=production

########################################################################################################################

# Use node version v20.17.0
FROM node:20.17.0@sha256:a5e0ed56f2c20b9689e0f7dd498cac7e08d2a3a283e92d9304e7b9b83e3c6ff3 AS production

USER node
WORKDIR /app

# Copy installed dependencies from the build stage
COPY --from=dependencies /app /app

# Copy src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# We run our service on port 8080
EXPOSE ${PORT}
CMD ["npm", "start"]

# Define an automated health check
HEALTHCHECK --interval=20s --timeout=30s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:${PORT} || exit 1
