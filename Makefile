.DEFAULT_GOAL := help

fetch-deps: ## Fetch JS dependencies.
	@cd whydJS && npm install

dev: fetch-deps ## Start a local dev server.
	@cd whydJS && npm run run-dev

restart: ## Restart the production server without downtime.
	@cd scripts && ./restart.sh

restart-to-latest: ## Restart the production server to its latest version, without downtime.
	@cd openwhyd/whydJS && git checkout -- package-lock.json && git pull && npm i && cd ../scripts && ./restart.sh

lint: fetch-deps ## Run ESLint
	@cd whydJS && npm run lint 

test: fetch-deps lint ## Run the tests.
	@cd whydJS && npm test

help: ## This help.
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: fetch-deps dev lint test help
