.PHONY: help install up down restart run logs

help:
	@echo "Sauron Cloud - Comandos disponibles:"
	@echo "  make install - Crea entorno virtual e instala dependencias Python"
	@echo "  make up      - Levanta contenedores Docker (ClickHouse, Grafana)"
	@echo "  make down    - Apaga contenedores Docker"
	@echo "  make restart - Reinicia contenedores Docker"
	@echo "  make run     - Ejecuta la API Cloud de FastAPI"
	@echo "  make logs    - Muestra logs de los contenedores"

install:
	python3 -m venv venv && ./venv/bin/pip install -r requirements.txt

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

run:
	./venv/bin/python src/main.py

logs:
	docker compose logs -f --tail=50
