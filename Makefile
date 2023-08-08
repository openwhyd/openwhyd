.DEFAULT_GOAL := help

fetch-deps: ## Fetch JS dependencies.
	@npm install

dev: fetch-deps ## Start a local dev server.
	@npm start

start: ## Start the production server without downtime.
	@cd scripts && ./start.sh

restart: ## Restart the production server without downtime.
	@cd scripts && ./restart.sh

restart-to-latest: ## Restart the production server to its latest version, without downtime.
	@git checkout -- package-lock.json && git pull && npm install --prefer-offline --no-audit --production && cd scripts && ./restart.sh
	# also don't forget to switch to the right version of nodejs, e.g. with "$ nvm use"

lint: fetch-deps ## Run ESLint
	@npm run lint 

test: fetch-deps lint ## Run tests against a local db
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
	npm run test:cypress
	# 4. release services
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

.PHONY: fetch-deps dev start restart restart-to-latest lint test ci help
