SHELL := /bin/zsh

.PHONY: dev build seed test test-e2e lint format typecheck up down logs

dev:
	PNPM_HOME=$$HOME/Library/pnpm pnpm dev

build:
	PNPM_HOME=$$HOME/Library/pnpm pnpm build

seed:
	PNPM_HOME=$$HOME/Library/pnpm pnpm seed

test:
	PNPM_HOME=$$HOME/Library/pnpm pnpm test

test-e2e:
	PNPM_HOME=$$HOME/Library/pnpm pnpm test:e2e

lint:
	PNPM_HOME=$$HOME/Library/pnpm pnpm lint

format:
	PNPM_HOME=$$HOME/Library/pnpm pnpm format

typecheck:
	PNPM_HOME=$$HOME/Library/pnpm pnpm typecheck

up:
	docker-compose up --build

down:
	docker-compose down -v

logs:
	docker-compose logs -f

