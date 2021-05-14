FROM node:14.16.1-slim@sha256:58dbfbdf664f703072bd8263b787301614579c8e345029cdc3d9acf682e853a9
# note: keep nodejs version above in sync with the one in .nvmrc + don't forget to append the corresponding sha256 hash

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  g++ \
  gcc \
  libc6-dev \
  make \
  python \
  graphicsmagick \
  && rm -rf /var/lib/apt/lists/*

# Install and build app dependencies
WORKDIR /usr/src/app
COPY ./package*.json /usr/src/app/
RUN npm ci --only=production --no-audit

# Fix Error: Cannot find module '../build/Release/bson' on newer node / MongoDB versions
# RUN sed -i.backup 's/..\/build\/Release\/bson/bson/g' /usr/src/app/node_modules/bson/ext/index.js

# Bundle app source
COPY ./ /usr/src/app

EXPOSE 8080

CMD [ "npm", "start" ]
