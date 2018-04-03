.PHONY: help

# Before running these scripts:
# 1. run /scripts/backup-remote.sh to download gzipped collections from production server
# 2. run /scripts/mongodb-scripts/start-local-db.sh to create and run a local database
# 3. run /scripts/mongodb-scripts/restore-ugc.sh to restore collections to local database
# 4. run /scripts/mongodb-scripts/export-ugc-to-json-lines.sh to generate JSON dumps
# 5. copy or move the JSON dumps into this directory
# 6. stop the local database and delete the /scripts/mongodb-scripts/db folder
# 7. (optional) run `make backup` to make a backup of previous plots
# 8. run `make` to generate plots from fresh JSON dumps

plots: plots/plot-user-growth.png plots/plot-nb-posts-per-day.png plots/plot-nb-users-posting-per-day.png plots/plot-nb-users-listening-per-day.png plots/plot-nb-plays-per-day.png plots/plot-nb-play-errors-per-day.png plots/plot-error-codes-per-week.png plots/plot-error-codes-per-day.png plots/plot-error-codes-per-day-30.png plots/plot-error-codes-per-day-7.png ## Generate all plots (default target)

help: ## This help
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

backup: ## Suffixes ".prev" to all existing png files (generated plots)
	@cd plots && ./backup-prev-plots.sh
	@echo 'Done. You can run make to generate fresh png files in plots/'

## intermediate targets, to pre-process usage logs

logs/list-error-codes-per-week.csv: ./playlog.json.log ## List playback error codes per week
	RENDER_FCT=renderWeek PERIOD=YEAR node src/list-error-codes-per-period.js >./logs/list-error-codes-per-week.json
	node src/convert-json-to-csv.js ../logs/list-error-codes-per-week.json >logs/list-error-codes-per-week.csv

logs/list-error-codes-per-day-365.csv: ./playlog.json.log ## List playback error codes per day, over the last year
	RENDER_FCT=renderDate PERIOD=YEAR node src/list-error-codes-per-period.js >./logs/list-error-codes-per-day-365.json
	node src/convert-json-to-csv.js ../logs/list-error-codes-per-day-365.json >logs/list-error-codes-per-day-365.csv

logs/list-error-codes-per-day-30.csv: ./playlog.json.log ## List playback error codes per day, over the last 30 days
	RENDER_FCT=renderDate PERIOD=MONTH node src/list-error-codes-per-period.js >./logs/list-error-codes-per-day-30.json
	node src/convert-json-to-csv.js ../logs/list-error-codes-per-day-30.json >logs/list-error-codes-per-day-30.csv

logs/list-error-codes-per-day-7.csv: ./playlog.json.log ## List playback error codes per day, over the last 7 days
	RENDER_FCT=renderDate PERIOD=WEEK node src/list-error-codes-per-period.js >./logs/list-error-codes-per-day-7.json
	node src/convert-json-to-csv.js ../logs/list-error-codes-per-day-7.json >logs/list-error-codes-per-day-7.csv

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

plots/plot-nb-play-errors-per-day.png: ./playlog.json.log ## Generate the "number of play errors per day" plot
	@echo 'Plotting nb play errors per day...'
	@cd src && ./plot-nb-play-errors-per-day.sh

plots/plot-error-codes-per-week.png: logs/list-error-codes-per-week.csv ## Generate the "distribution of playback error codes per week" plot
	@echo 'Plotting error codes per week...'
	@cd src && ./plot-error-codes-per-period.sh "list-error-codes-per-week" "plot-error-codes-per-week" "Distribution of errors codes per week, normalised by number of plays"

plots/plot-error-codes-per-day-365.png: logs/list-error-codes-per-day-365.csv ## Generate the "distribution of playback error codes per day, over the last 365 days" plot
	@echo 'Plotting error codes per day...'
	@cd src && ./plot-error-codes-per-period.sh "list-error-codes-per-day-365" "plot-error-codes-per-day" "Distribution of errors codes per day, normalised by number of plays, over the last 365 days"

plots/plot-error-codes-per-day-30.png: logs/list-error-codes-per-day-30.csv ## Generate the "distribution of playback error codes per day, over the last 30 days" plot
	@echo 'Plotting error codes per day...'
	@cd src && ./plot-error-codes-per-period.sh "list-error-codes-per-day-30" "plot-error-codes-per-day-30" "Distribution of errors codes per day, normalised by number of plays, over the last 30 days"

plots/plot-error-codes-per-day-7.png: logs/list-error-codes-per-day-7.csv ## Generate the "distribution of playback error codes per day, over the last 7 days" plot
	@echo 'Plotting error codes per day...'
	@cd src && ./plot-error-codes-per-period.sh "list-error-codes-per-day-7" "plot-error-codes-per-day-7" "Distribution of errors codes per day, normalised by number of plays, over the last 7 days"
