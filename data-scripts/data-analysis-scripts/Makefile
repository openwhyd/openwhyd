.PHONY: help list-error-types-per-player

plots: plots/plot-user-growth.png plots/plot-nb-posts-per-day.png plots/plot-nb-users-posting-per-day.png plots/plot-nb-users-listening-per-day.png plots/plot-nb-plays-per-day.png plots/plot-nb-play-errors-per-day.png plots/plot-error-codes-per-week.png ## Generate all plots (default target)

help: ## This help
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

backup: ## Suffixes ".prev" to all existing png files (generated plots)
	@cd plots && ./backup-prev-plots.sh
	@echo 'Done. You can run make to generate fresh png files in plots/'

plots/plot-user-growth.png: ## Generate the "user growth" plot
	@echo 'Plotting user growth...'
	@cd src && ./plot-user-growth.sh

plots/plot-nb-posts-per-day.png: ## Generate the "number of posts per day" plot
	@echo 'Plotting nb posts per day...'
	@cd src && ./plot-nb-posts-per-day.sh

plots/plot-nb-users-posting-per-day.png: ## Generate the "number of users posting per day" plot
	@echo 'Plotting nb users posting per day...'
	@cd src && ./plot-nb-users-posting-per-day.sh

plots/plot-nb-users-listening-per-day.png: ## Generate the "number of users listening per day" plot
	@echo 'Plotting nb users listening per day...'
	@cd src && ./plot-nb-users-listening-per-day.sh

plots/plot-nb-plays-per-day.png: ## Generate the "number of plays per day" plot
	@echo 'Plotting nb plays per day...'
	@cd src && ./plot-nb-plays-per-day.sh

plots/plot-nb-play-errors-per-day.png: ## Generate the "number of plays per day" plot
	@echo 'Plotting nb play errors per day...'
	@cd src && ./plot-nb-play-errors-per-day.sh

list-error-types-per-player: ## List playback errors and their distribution per player
	@cd src && mongo openwhyd_dump list-error-types-per-player.mongo.js >list-error-types-per-player.log; cat list-error-types-per-player.log

logs/list-error-codes-per-week.log: ## List playback error codes per week
	@mkdir logs &>/dev/null
	@mongo openwhyd_dump src/list-error-codes-per-week.mongo.js >logs/list-error-codes-per-week.log # -> db collection: list-error-codes-per-week

plots/plot-error-codes-per-week.png: logs/list-error-codes-per-week.log ## Generate the "distribution of playback error codes per week" plot
	@echo 'Plotting error codes per week...'
	@cd src && ./plot-error-codes-per-week.sh
