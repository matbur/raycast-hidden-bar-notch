.DEFAULT_GOAL := help

.PHONY: help install dev build lint fix-lint typecheck test check

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*## / {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install npm dependencies
	npm install

dev: install ## Install the extension in Raycast (dev mode, stop with Ctrl+C)
	@# ray develop exits with 1 on Ctrl+C; treat that as a normal stop.
	@status=0; npm run dev || status=$$?; \
		if [ $$status -ne 0 ] && [ $$status -ne 1 ] && [ $$status -ne 130 ]; then exit $$status; fi

build: ## Build the extension
	npm run build

lint: ## Run ray lint (ESLint, Prettier, manifest)
	npm run lint

fix-lint: ## Fix lint and formatting issues
	npm run fix-lint

typecheck: ## Type-check with tsc
	npm run typecheck

test: ## Run unit tests
	npm test

check: lint typecheck test build ## Run lint, typecheck, tests and build
