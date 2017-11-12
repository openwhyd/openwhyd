.PHONY: help list-error-types-per-player

plots: plots/plot-user-growth.png plots/plot-nb-posts-per-day.png plots/plot-nb-users-posting-per-day.png plots/plot-nb-users-listening-per-day.png plots/plot-nb-plays-per-day.png plots/plot-nb-play-errors-per-day.png plots/plot-error-codes-per-week.png ## Generate all plots (default target)

help: ## This help
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

backup: ## Suffixes ".prev" to all existing png files (generated plots)
	@cd plots && ./backup-prev-plots.sh
	@echo 'Done. You can run make to generate fresh png files in plots/'

## targets to import collection dumps into local mongodb database

logs/collection-playlog.log: collection-dumps/playlog.bson.gz
	@echo 'Importing collection-dumps/playlog.bson.gz into local openwhyd_dump database...'
	@gunzip -c collection-dumps/playlog.bson.gz | mongorestore --collection playlog --db openwhyd_dump --drop - &>logs/collection-playlog.log

## intermediate targets, to generate aggregated mongodb collections

logs/list-error-codes-per-week.log: logs/collection-playlog.log ## List playback error codes per week
	@echo 'Aggregating playback error codes per week into intermediate db collection...'
	@cd src && mongo openwhyd_dump --eval "const RENDER_FCT = 'renderWeek', OUTPUT_COLLECTION = 'list-error-codes-per-week';" list-error-codes-per-period.mongo.js >../logs/list-error-codes-per-week.log
	@echo 'Done. Created db collection: list-error-codes-per-week'

logs/list-error-codes-per-day.log: logs/collection-playlog.log ## List playback error codes per day
	@echo 'Aggregating playback error codes per day into intermediate db collection...'
	@cd src && mongo openwhyd_dump --eval "const RENDER_FCT = 'renderDate', OUTPUT_COLLECTION = 'list-error-codes-per-day';" list-error-codes-per-period.mongo.js >../logs/list-error-codes-per-day.log
	@echo 'Done. Created db collection: list-error-codes-per-day'

src/list-error-types-per-player.log: logs/collection-playlog.log ## List playback errors and their distribution per player
	@cd src && mongo openwhyd_dump list-error-types-per-player.mongo.js >list-error-types-per-player.log

## targets to generate textual reports

list-error-types-per-player: src/list-error-types-per-player.log ## List playback errors and their distribution per player
	@cat src/list-error-types-per-player.log

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
