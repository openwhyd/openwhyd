FROM node:8.11.4

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies

COPY ./package.json /usr/src/app/
RUN npm install

# Fix Error: Cannot find module '../build/Release/bson' on newer node / MongoDB versions
# RUN sed -i.backup 's/..\/build\/Release\/bson/bson/g' /usr/src/app/node_modules/bson/ext/index.js

# Bundle app source
COPY ./ /usr/src/app

EXPOSE 8080

CMD [ "npm", "run", "run" ]
