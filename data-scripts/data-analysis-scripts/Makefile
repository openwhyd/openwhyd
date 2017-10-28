.DEFAULT_GOAL := help
.PHONY: help

help: ## This help
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

user-growth: ## Generate the "user growth" plot
	@cd src && ./plot-user-growth.sh

nb-posts-per-day: ## Generate the "number of posts per day" plot
	@cd src && ./plot-nb-posts-per-day.sh

nb-users-posting-per-day: ## Generate the "number of users posting per day" plot
	@cd src && ./plot-nb-users-posting-per-day.sh

nb-users-listening-per-day: ## Generate the "number of users listening per day" plot
	@cd src && ./plot-nb-users-listening-per-day.sh

plots: user-growth nb-posts-per-day nb-users-posting-per-day nb-users-listening-per-day ## Generate all plots
