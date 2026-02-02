.PHONY: up down build restart logs clean setup

# Start the application
up:
	docker-compose up

# Start the application in detached mode (background)
up-d:
	docker-compose up -d

# Stop the application
down:
	docker-compose down

# Rebuild the containers
build:
	docker-compose build

# Restart the application
restart: down up

# View logs
logs:
	docker-compose logs -f

# Clean up docker resources (containers, networks)
clean:
	docker-compose down --rmi all --volumes --remove-orphans

# Interactive shell for backend
backend-shell:
	docker-compose exec backend /bin/bash

# Interactive shell for frontend
frontend-shell:
	docker-compose exec frontend /bin/bash
