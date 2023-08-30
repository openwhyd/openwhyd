.DEFAULT_GOAL := help

install: node_modules ## Fetch JS dependencies.
	make node_modules

node_modules: .nvmrc package.json package-lock.json
	npm install
	touch node_modules # optimisation: prevents reinstallation of dependencies, until package files are updated

build: ## Build/transpile runtime assets.
	make public/js/bookmarklet.js

public/js/bookmarklet.js: public/js/bookmarklet*.ts
	npm run build

dev: node_modules public/js/bookmarklet.js ## Start a local dev server.
	docker compose stop
	docker compose up --detach mongo
	npm run start:localdb
	docker compose stop

start: node_modules public/js/bookmarklet.js ## Start the production server without downtime.
	@cd scripts && ./start.sh

restart: node_modules public/js/bookmarklet.js ## Restart the production server without downtime.
	@cd scripts && ./restart.sh

restart-to-latest: ## Restart the production server to its latest version, without downtime.
	git pull
	npm ci --omit=dev --prefer-offline --no-audit
	make restart
	# also don't forget to switch to the right version of nodejs, e.g. with "$ nvm use"

lint: node_modules public/js/bookmarklet.js ## Run static code checks
	npm run lint:jsdoc-typing
	npm run lint:typescript
	npm run lint:format
	npm run lint:fix

docker-seed: ## (Re)initializes the test db and restart Openwhyd's docker container
	docker-compose exec -T web npm run test-reset
	docker-compose restart web
	docker-compose exec -T web ./scripts/wait-for-http-server.sh 8080

test-all: lint test test-approval test-in-docker ## Run all checks and tests

test: node_modules public/js/bookmarklet.js ## Run tests against a local db
	# 1. tests that don't need a database
	docker compose stop
	npm run test:functional
	npm run test:unit
	# 2. tests that need a database
	docker compose up --detach mongo
	npm run test:integration:localdb
	npm run test:api
	# 3. tests that need a database and Openwhyd server running
	docker compose up --detach --build mongo web
	CYPRESS_SKIP_APPLITOOLS_TESTS=true npm run test:cypress
	# 4. release services
	docker compose stop
	@echo "ℹ️ To run approval tests: $ make test-approval"

test-approval: node_modules public/js/bookmarklet.js ## Run approval tests against a local db
	docker compose stop
	docker compose up --detach mongo
	npm run test:approval:routes:start
	npm run test:approval:hot-tracks:start
	npm run test:approval:posting:start
	docker compose stop

test-in-docker: ## Run tests in the Openwhyd's docker container
	docker compose up --detach --build mongo web
	make docker-seed
	docker-compose exec web npm run test:functional
	docker-compose exec web npm run test:unit
	docker-compose exec --env MONGODB_URL='mongodb://mongo:27017/openwhyd_test' web npm run test:integration
	docker-compose exec --env MONGODB_URL='mongodb://mongo:27017/openwhyd_test' web npm run test:api:raw
	@echo "ℹ️ Note: Cypress will be run on the host, because it's complicated to make it work from a Docker container"
	. ./.env-docker && npm run test:cypress
	docker compose stop

ci: ## Run automated tests defined in GitHub Actions CI workflow.
	@echo 'ℹ️  Prerequisite: https://github.com/nektos/act#installation-through-package-managers'
	@echo '{"head_commit": {"message": "build latest"}}' >github_event.tmp
	@act --job tests --platform "ubuntu-20.04=lucasalt/act_base:latest" --container-architecture linux/amd64 -s GITHUB_TOKEN=${GITHUB_TOKEN} -e github_event.tmp
	# TODO: run other CI jobs too.
	@rm -f github_event.tmp

help: ## This help.
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# PHONY deps are task dependencies that are not represented by files
.PHONY: install build dev start restart restart-to-latest lint docker-seed test-all test test-approval test-in-docker ci help
