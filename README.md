# Resource manager BE

This application provides REST API interface for resource manager.

## Description

Resource manager BE.

## Running the app

1. Run bash script `./.build/prepare-dev.sh`
2. Run `docker compose up`

* changes in `api/` folder will be reflected while running the app.
* changes in `shared/` folder will need to be updated manually. After changing files in `shared/` folder you should run `.build/prepare-dev.sh` and restart docker container.

## Test

Unit tests: `./.build/tests-unit.sh` or `npm run test:unit` from `api/` folder

E2E tests: `./.build/test-e2e.sh` or `npm run test:e2e` from `api/` folder
