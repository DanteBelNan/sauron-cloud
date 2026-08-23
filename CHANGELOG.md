# Changelog - Sauron Cloud (`sauron-cloud`)

Todos los cambios notables en el servidor central cloud serán documentados en este archivo.

---

## [0.3.2] - 2026-08-23 (Ticket 3: Editor de Hitboxes en Canvas & Sincronización de Zonas)

### Agregado
- **Capa Canvas HTML5 Interfaz de Zonas (`src/static/`)**:
  - Puntos de agarre (*handles*) arrastrables para redimensionar vértices de `zona_extremo_a` y `zona_extremo_b` sobre el video en vivo de la cámara física.
  - Inicialización dinámica con las coordenadas reales devueltas por el Edge.
  - Escalado automático de coordenadas a resolución nativa `1280x720`.
  - Botón **"Aplicar Zonas"** con aviso de recarga y desconexión automática del stream.

---

## [0.3.1] - 2026-08-19 (Ticket 2: Live View Panel, Botón Detener & Broker Central Cloud)

### Agregado
- Contenedor Mosquitto Central Cloud (`docker-compose.yml`) en puerto 1883.
- Frontend Dashboard Estático (`src/static/`) servido en `GET /`.

---

## [0.3.0] - 2026-08-19 (Ticket 1: Bus de Comandos Cloud -> Edge)

### Agregado
- Endpoint de Emisión de Comandos (`POST /api/v1/commands`).
- Construcción Dinámica de Tópicos MQTT y patrón Request-Reply con Correlation ID.
