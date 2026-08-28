# Changelog - Sauron Cloud (`sauron-cloud`)

Todos los cambios notables en el servidor central cloud serán documentados en este archivo.

---

## [0.4.0] - 2026-08-27 (Ticket 4: Alta de Cámaras Parametrizada & Modal UI)

### Agregado
- **Gestor Dinámico de Cámaras (`src/static/`)**:
  - Selector desplegable de cámaras (`<select id="cameraSelector">`).
  - Ventana modal emergente (`#addCameraModal`) con campos parametrizados (ID de Cámara, IP, Puerto, Substream, Usuario, Contraseña).
  - Alta optimista en el desplegable y envío del comando `"add_camera"` por MQTT.

### Datos de Referencia para Pruebas
- **Cámara Física TP-Link Tapo 2K**:
  - ID: `camara_ip` | IP: `192.168.1.90` | Puerto: `554` | Path: `stream2` | User: `dbelnan` | Pass: `password`
- **Webcam Laptop (MediaMTX)**:
  - ID: `webcam_laptop` | IP: `mediamtx` | Puerto: `8554` | Path: `webcam` | User/Pass: *(en blanco)*

---

## [0.3.3] - 2026-08-23 (Bugfix: Limpieza de Estado de Edición)

### Corregido
- Implementada la función `resetEditingState()` para limpiar el texto y la visibilidad de los botones de edición al desconectarse o aplicar reconfiguraciones.

---

## [0.3.2] - 2026-08-23 (Ticket 3: Editor de Hitboxes en Canvas & Sincronización)

### Agregado
- Capa Canvas HTML5 interactiva con puntos de agarre (*handles*) arrastrables.

---

## [0.3.1] - 2026-08-19 (Ticket 2: Live View Panel & 2 Brokers)

### Agregado
- Contenedor Mosquitto Central Cloud (`docker-compose.yml`) en puerto 1883.
- Frontend Dashboard Estático (`src/static/`) servido en `GET /`.

---

## [0.3.0] - 2026-08-19 (Ticket 1: Bus de Comandos Cloud -> Edge)

### Agregado
- Endpoint de Emisión de Comandos (`POST /api/v1/commands`).
