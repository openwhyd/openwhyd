FROM node:14.18.1-slim@sha256:58dbfbdf664f703072bd8263b787301614579c8e345029cdc3d9acf682e853a9 AS build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  g++ \
  gcc \
  libc6-dev \
  make \
  python

# Install and build app dependencies
WORKDIR /usr/src/app
COPY --chown=node:node ./package*.json /usr/src/app/
RUN npm ci --only=production --no-audit

# Fix Error: Cannot find module '../build/Release/bson' on newer node / MongoDB versions
# RUN sed -i.backup 's/..\/build\/Release\/bson/bson/g' /usr/src/app/node_modules/bson/ext/index.js

FROM node:14.18.1-slim@sha256:58dbfbdf664f703072bd8263b787301614579c8e345029cdc3d9acf682e853a9
# note: keep nodejs version above in sync with the one in .nvmrc + don't forget to append the corresponding sha256 hash

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  dumb-init \
  graphicsmagick \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production

# Bundle app source
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node ./ /usr/src/app

# Allow openwhyd server (running as "node" user) to create files (e.g. playlog.json.log) in /usr/src/app
RUN chown node:node /usr/src/app
USER node

EXPOSE 8080

# dumb-init is invoked with PID 1, then spawns node as another process whilst ensuring that all signals are proxied to it
CMD [ "dumb-init", "node", "app.js", "--fakeEmail", "--digestInterval", "-1" ]
