# Changelog - Sauron Cloud (`sauron-cloud`)

Todos los cambios notables en el servidor central cloud serán documentados en este archivo.

---

## [0.2.0] - 2026-08-18 (SaaS Ingestion API & Grafana Provisioning)

### Agregado
- **API Central de Ingesta (FastAPI)**:
  - Endpoint `/api/v1/telemetry/events` (HTTP POST) preparado para recibir eventos atómicos enriquecidos con `tenant_id`, `site_id`, `camera_id`, `person_id`, `zone`, `direction`, `timestamp`, `confidence` y `snapshot_url`.
- **Persistencia Analítica en ClickHouse**:
  - Creación de base de datos `sauron` y tabla `telemetry_events` particionada por mes (`toYYYYMM(timestamp)`).
  - Gestor de conexión `ClickHouseManager` en `src/db.py` con bucle de reintentos automáticos (5 intentos x 2 segundos) para manejar arranques en paralelo con Docker.
- **Aprovisionamiento Automático en Grafana (Kickstart)**:
  - Cambio a Grafana `9.5.15` LTS en `docker-compose.yml` para garantizar compatibilidad total entre Query Builder y SQL Code Editor.
  - Auto-instalación del plugin `grafana-clickhouse-datasource`.
  - Configuración de aprovisionamiento de Datasource (`grafana/provisioning/datasources/clickhouse.yml`).
  - Aprovisionamiento automático del Dashboard **"Sauron Vision - Analítica de Pasillo"** (`grafana/dashboards/sauron_analytics.json`) con 4 paneles preconfigurados:
    1. Registro de Entradas, Salidas, Permanencia en segundos y fotos por `person_id`.
    2. Stat de Tiempo Promedio de Permanencia.
    3. PieChart de Distribución de Primer Contacto (Extremo A vs Extremo B).
    4. Tabla de Telemetría en Crudo.
- **Orquestación y Automatización**:
  - `docker-compose.yml` integrando `clickhouse` y `grafana` con volúmenes persistentes.
  - `Makefile` con comandos `install`, `up`, `down`, `restart`, `run` y `logs`.
  - Variables de entorno en `.env` y `.env.example`.

---

## [0.1.0] - 2026-08-18 (Esqueleto Inicial)

### Agregado
- Endpoint inicial `/health` y estructura base de FastAPI.
