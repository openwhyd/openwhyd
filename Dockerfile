FROM node:14.16.1-slim
# note: keep nodejs version above in sync with the one in .nvmrc

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
RUN npm install --no-audit --production

# Fix Error: Cannot find module '../build/Release/bson' on newer node / MongoDB versions
# RUN sed -i.backup 's/..\/build\/Release\/bson/bson/g' /usr/src/app/node_modules/bson/ext/index.js

# Bundle app source
COPY ./ /usr/src/app

EXPOSE 8080

CMD [ "npm", "start" ]
