# Hexagonal Architecture Migration

This project is currently migrated into [Hexagonal Architecture](https://beyondxscratch.com/2017/08/19/hexagonal-architecture-the-practical-guide-for-a-clean-architecture/) to optimize the sustainability of OpenWhyd Solo.

## Prerequisities

First of all, you need to install [docker desktop](https://www.docker.com/products/docker-desktop) on your computer.

## Development

Run OpenWhyd Solo locally:

```bash
docker compose up mongo --detach # starts mongo database in the background
npm install # installs the necessary node modules
. ./env-vars-testing-local.sh # sets the environment variables
npm run test-reset # resets and initialises the database
npm run start:localdb # starts the server locally
open http://localhost:8080 # opens the local server, use ngx-open on a linux system.
```

Then log into the application with `admin:admin` as credentials

## Migration exercise

To start the migration exercise, checkout the following git tag:

```bash
git checkout migration-start
```

## JSDoc type checks

```bash
npx tsc --target es2015 --moduleResolution node --noEmit --allowJs `find app/ -name "*.js"`
```
