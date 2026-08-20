# Changelog - Sauron Cloud (`sauron-cloud`)

Todos los cambios notables en el servidor central cloud serán documentados en este archivo.

---

## [0.3.1] - 2026-08-19 (Ticket 2: Live View Panel, Botón Detener & Broker Central Cloud)

### Agregado
- **Contenedor Mosquitto Central Cloud (`docker-compose.yml`)**:
  - Broker MQTT propio del Servidor Central (puerto 1883) para recibir conexiones salientes de todos los Edge Nodes y publicar comandos sin requerir abrir puertos en las sedes de los clientes.
- **Frontend Dashboard Estático (`src/static/`)**:
  - `index.html`, `style.css` y `app.js` en Vanilla JS/CSS.
  - Reproductor adaptativo con indicador de estado en vivo, consola de respuestas y botón **"Detener Stream"** para cortar el tráfico de red a 0 KB/s bajo demanda.
  - Endpoint `GET /` sirviendo el panel de control.

---

## [0.3.0] - 2026-08-19 (Ticket 1: Bus de Comandos Cloud -> Edge)

### Agregado
- Endpoint de Emisión de Comandos (`POST /api/v1/commands`).
- Construcción Dinámica de Tópicos MQTT y patrón Request-Reply con Correlation ID.

---

## [0.2.0] - 2026-08-18 (SaaS Ingestion API & Grafana Provisioning)

### Agregado
- API Central de Ingesta (FastAPI) y persistencia analítica en ClickHouse DB.
