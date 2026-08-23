# Changelog - Sauron Cloud (`sauron-cloud`)

Todos los cambios notables en el servidor central cloud serán documentados en este archivo.

---

## [0.3.3] - 2026-08-23 (Bugfix: Limpieza de Estado de Edición y Visibilidad Standby)

### Corregido
- **Gestión de Estado de Interfaz (`src/static/app.js`)**:
  - Implementada la función `resetEditingState()` para limpiar el texto y la visibilidad de los botones de edición al desconectarse o aplicar reconfiguraciones.
  - Forzada la inicialización limpia en modo `STANDBY` al cargar la aplicación (`DOMContentLoaded`).

---

## [0.3.2] - 2026-08-23 (Ticket 3: Editor de Hitboxes en Canvas & Sincronización de Zonas)

### Agregado
- Capa Canvas HTML5 interactiva con puntos de agarre (*handles*) arrastrables.
- Sincronización dinámica con las coordenadas reales de la cámara.
- Botón **"Aplicar Zonas"** con aviso de recarga y desconexión del stream.

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
