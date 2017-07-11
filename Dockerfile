FROM node

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g eslint \
                   forever

# Install app dependencies
COPY ./whydJS/package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY ./whydJS/ /usr/src/app

EXPOSE 8080

CMD [ "npm", "run", "run" ]
