.PHONY: help

plots: plots/plot-user-growth.png plots/plot-nb-posts-per-day.png plots/plot-nb-users-posting-per-day.png plots/plot-nb-users-listening-per-day.png plots/plot-nb-plays-per-day.png plots/plot-nb-play-errors-per-day.png plots/plot-error-codes-per-week.png plots/plot-error-codes-per-day.png plots/plot-error-codes-per-day-30.png plots/plot-error-codes-per-day-7.png ## Generate all plots (default target)

help: ## This help
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

backup: ## Suffixes ".prev" to all existing png files (generated plots)
	@cd plots && ./backup-prev-plots.sh
	@echo 'Done. You can run make to generate fresh png files in plots/'

## intermediate targets, to pre-process usage logs

logs/list-error-codes-per-week.log: logs/collection-playlog.log ## List playback error codes per week
	@echo 'Aggregating playback error codes per week into intermediate db collection...'
	@cd src && mongo openwhyd_dump --eval "const RENDER_FCT = 'renderWeek', OUTPUT_COLLECTION = 'list-error-codes-per-week';" list-error-codes-per-period.mongo.js >../logs/list-error-codes-per-week.log
	@echo 'Done. Created db collection: list-error-codes-per-week'

logs/list-error-codes-per-day.log: logs/collection-playlog.log ## List playback error codes per day
	@echo 'Aggregating playback error codes per day into intermediate db collection...'
	@cd src && mongo openwhyd_dump --eval "var PERIOD = 'YEAR', RENDER_FCT = 'renderDate', OUTPUT_COLLECTION = 'list-error-codes-per-day';" list-error-codes-per-period.mongo.js >../logs/list-error-codes-per-day.log
	@echo 'Done. Created db collection: list-error-codes-per-day'

logs/list-error-codes-per-day-30.log: logs/collection-playlog.log ## List playback error codes per day, over the last 30 days
	@echo 'Aggregating playback error codes per day into intermediate db collection...'
	@cd src && mongo openwhyd_dump --eval "var PERIOD = 'MONTH', RENDER_FCT = 'renderDate', OUTPUT_COLLECTION = 'list-error-codes-per-day-30';" list-error-codes-per-period.mongo.js >../logs/list-error-codes-per-day-30.log
	@echo 'Done. Created db collection: list-error-codes-per-day-30'

logs/list-error-codes-per-day-7.log: logs/collection-playlog.log ## List playback error codes per day, over the last 7 days
	@echo 'Aggregating playback error codes per day into intermediate db collection...'
	@cd src && mongo openwhyd_dump --eval "var PERIOD = 'WEEK', RENDER_FCT = 'renderDate', OUTPUT_COLLECTION = 'list-error-codes-per-day-7';" list-error-codes-per-period.mongo.js >../logs/list-error-codes-per-day-7.log
	@echo 'Done. Created db collection: list-error-codes-per-day-7'

logs/list-error-types-per-player.csv: ./playlog.json.log ## List playback errors and their distribution per player
	node src/list-error-types-per-player.js >./logs/list-error-types-per-player.json
	node src/convert-json-to-csv.js ../logs/list-error-types-per-player.json >logs/list-error-types-per-player.csv

## final targets, to generate plots (png files)

plots/plot-user-growth.png: ## Generate the "user growth" plot
	@echo 'Plotting user growth...'
	@cd src && ./plot-user-growth.sh

plots/plot-nb-posts-per-day.png: ## Generate the "number of posts per day" plot
	@echo 'Plotting nb posts per day...'
	@cd src && ./plot-nb-posts-per-day.sh

plots/plot-nb-users-posting-per-day.png: ## Generate the "number of users posting per day" plot
	@echo 'Plotting nb users posting per day...'
	@cd src && ./plot-nb-users-posting-per-day.sh

plots/plot-nb-users-listening-per-day.png: logs/collection-playlog.log ## Generate the "number of users listening per day" plot
	@echo 'Plotting nb users listening per day...'
	@cd src && ./plot-nb-users-listening-per-day.sh

plots/plot-nb-plays-per-day.png: logs/collection-playlog.log ## Generate the "number of plays per day" plot
	@echo 'Plotting nb plays per day...'
	@cd src && ./plot-nb-plays-per-day.sh

plots/plot-nb-play-errors-per-day.png: logs/collection-playlog.log ## Generate the "number of play errors per day" plot
	@echo 'Plotting nb play errors per day...'
	@cd src && ./plot-nb-play-errors-per-day.sh

plots/plot-error-codes-per-week.png: logs/list-error-codes-per-week.log ## Generate the "distribution of playback error codes per week" plot
	@echo 'Plotting error codes per week...'
	@cd src && ./plot-error-codes-per-period.sh "list-error-codes-per-week" "plot-error-codes-per-week" "Distribution of errors codes per week, normalised by number of plays"

plots/plot-error-codes-per-day.png: logs/list-error-codes-per-day.log ## Generate the "distribution of playback error codes per day" plot
	@echo 'Plotting error codes per day...'
	@cd src && ./plot-error-codes-per-period.sh "list-error-codes-per-day" "plot-error-codes-per-day" "Distribution of errors codes per day, normalised by number of plays"

plots/plot-error-codes-per-day-30.png: logs/list-error-codes-per-day-30.log ## Generate the "distribution of playback error codes per day, over the last 30 days" plot
	@echo 'Plotting error codes per day...'
	@cd src && ./plot-error-codes-per-period.sh "list-error-codes-per-day-30" "plot-error-codes-per-day-30" "Distribution of errors codes per day, normalised by number of plays, over the last 30 days"

plots/plot-error-codes-per-day-7.png: logs/list-error-codes-per-day-7.log ## Generate the "distribution of playback error codes per day, over the last 7 days" plot
	@echo 'Plotting error codes per day...'
	@cd src && ./plot-error-codes-per-period.sh "list-error-codes-per-day-7" "plot-error-codes-per-day-7" "Distribution of errors codes per day, normalised by number of plays, over the last 7 days"
