# Changelog - Sauron Cloud (`sauron-cloud`)

Todos los cambios notables en el servidor central cloud serán documentados en este archivo.

---

## [0.3.0] - 2026-08-19 (Ticket 1: Bus de Comandos Cloud -> Edge)

### Agregado
- **Endpoint de Emisión de Comandos (`POST /api/v1/commands`)**:
  - Permite a la API Central / Panel Web emitir acciones de control (`ping`, `start_stream`, `reconfigure_zones`) dirigidas a cualquier sede de un cliente.
- **Construcción Dinámica de Tópicos MQTT**:
  - Enrutamiento automático de comandos hacia el tópico `saas/{tenant_id}/{site_id}/commands`.

---

## [0.2.0] - 2026-08-18 (SaaS Ingestion API & Grafana Provisioning)

### Agregado
- API Central de Ingesta (FastAPI) con soporte para `person_id` y `snapshot_url`.
- Persistencia Analítica en ClickHouse DB.
- Aprovisionamiento Automático de Grafana 9.5.15 LTS y Dashboard JSON.

---

## [0.1.0] - 2026-08-18 (Esqueleto Inicial)

### Agregado
- Endpoint inicial `/health` y estructura base de FastAPI.
