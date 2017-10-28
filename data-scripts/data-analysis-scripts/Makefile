.DEFAULT_GOAL := help
.PHONY: help

help: ## This help
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

user-growth: ## Generate the "user growth" plot
	@cd src && ./plot-user-growth.sh

nb-posts-per-day: ## Generate the "number of posts per day" plot
	@cd src && ./nb-posts-per-day.sh

plots: user-growth nb-posts-per-day ## Generate all plots
