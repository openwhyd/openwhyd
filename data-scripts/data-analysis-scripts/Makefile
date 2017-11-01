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

nb-plays-per-day: ## Generate the "number of plays per day" plot
	@cd src && ./plot-nb-plays-per-day.sh

nb-play-errors-per-day: ## Generate the "number of plays per day" plot
	@cd src && ./plot-nb-play-errors-per-day.sh

list-error-types-per-player: ## List playback errors and their distribution per player
	@cd src && mongo openwhyd_dump list-error-types-per-player.mongo.js >list-error-types-per-player.log; cat list-error-types-per-player.log

list-error-codes-per-week: ## List playback error codes per week
	@cd src && mongo openwhyd_dump list-error-codes-per-week.mongo.js >list-error-codes-per-week.log; cat list-error-codes-per-week.log

plot-error-codes-per-week: ## Generate the "distribution of playback error codes per week" plot
	@cd src && ./plot-error-codes-per-week.sh

plots: user-growth nb-posts-per-day nb-users-posting-per-day nb-users-listening-per-day nb-plays-per-day nb-play-errors-per-day plot-error-codes-per-week ## Generate all plots
