FROM node:4

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g eslint \
                   forever

# Install app dependencies

# Custom packages
COPY ./whydJS/node_modules/get /usr/src/app/node_modules/get
COPY ./whydJS/node_modules/my /usr/src/app/node_modules/my
COPY ./whydJS/node_modules/hypem /usr/src/app/node_modules/hypem

COPY ./whydJS/package.json /usr/src/app/
RUN npm install

# Fix Error: Cannot find module '../build/Release/bson' on newer node / MongoDB versions
# RUN sed -i.backup 's/..\/build\/Release\/bson/bson/g' /usr/src/app/node_modules/bson/ext/index.js

# Bundle app source
COPY ./whydJS/ /usr/src/app

EXPOSE 8080

CMD [ "npm", "run", "run" ]
