# Stage-1 dependencies
FROM node:10.16.3-buster as dep

# Install dependencies for node-gyp and argon2
RUN apk add --no-cache python

# Install and build app dependencies
WORKDIR /usr/src/app
COPY ./package*.json /usr/src/app/
RUN npm install --no-audit --production

# Stage-2 final image
FROM node:10.16.3-buster-slim

# Install runtime dependencies
RUN apk add --no-cache graphicsmagick

# Create app directory
WORKDIR /usr/src/app

# Fetch app dependencies built in stage-1
COPY --from=dep /usr/src/app/node_modules ./node_modules
RUN ["npm", "rebuild", "-q"]

# Fix Error: Cannot find module '../build/Release/bson' on newer node / MongoDB versions
# RUN sed -i.backup 's/..\/build\/Release\/bson/bson/g' /usr/src/app/node_modules/bson/ext/index.js

# Bundle app source
COPY ./ /usr/src/app

EXPOSE 8080

CMD [ "npm", "start" ]
