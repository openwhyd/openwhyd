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

test: lint test-unit test-integration test-e2e test-approval test-in-docker ## Run all checks and tests

test-unit: node_modules public/js/bookmarklet.js ## Run tests that don't need a database
	npm run test:functional
	npm run test:unit

test-integration: node_modules public/js/bookmarklet.js ## Run tests against a local database
	docker compose stop
	docker compose up --detach mongo
	npm run test:integration:localdb
	npm run test:api
	docker compose stop

test-e2e: node_modules public/js/bookmarklet.js ## Run tests against a local database + Openwhyd server
	docker compose up --detach --build mongo web
	CYPRESS_SKIP_APPLITOOLS_TESTS=true npm run test:cypress
	docker compose stop

test-e2e-dev: node_modules public/js/bookmarklet.js ## Open Cypress test runner against a local database + Openwhyd server
	docker compose up --detach --build mongo web
	CYPRESS_SKIP_APPLITOOLS_TESTS=true npm run test:cypress:dev
	docker compose stop

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

release: ## Release a new version of Openwhyd.
	# we install just semantic-release and its plugins, without considering package.json
	mkdir "tmp-release"
	npm --prefix "tmp-release" install --no-save \
		"semantic-release@17.3.1" \
		"@semantic-release/release-notes-generator@11.0.7" \
		"@semantic-release/changelog@5.0.1" \
		"@semantic-release/git@9.0.0" \
		&& tmp-release/node_modules/.bin/semantic-release
	rm -rf "tmp-release"

help: ## This help.
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# PHONY deps are task dependencies that are not represented by files
.PHONY: install build dev start restart restart-to-latest lint docker-seed test test-unit test-integration test-e2e test-approval test-in-docker ci release help
