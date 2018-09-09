FROM node:6.11.1

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g forever

# Install app dependencies

COPY ./whydJS/package.json /usr/src/app/
RUN npm install

# Fix Error: Cannot find module '../build/Release/bson' on newer node / MongoDB versions
# RUN sed -i.backup 's/..\/build\/Release\/bson/bson/g' /usr/src/app/node_modules/bson/ext/index.js

# Bundle app source
COPY ./whydJS/ /usr/src/app

EXPOSE 8080

CMD [ "npm", "run", "run" ]
