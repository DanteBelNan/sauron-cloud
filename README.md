# Sauron Cloud (`sauron-cloud`)

Componente Servidor Central del sistema **Sauron Vision SaaS** encargado de la ingesta REST multi-tenant, almacenamiento de telemetría analítica en ClickHouse y aprovisionamiento automático de dashboards en Grafana.

---

## 🚀 Características
* **API Central de Ingesta (FastAPI)**: Endpoint `/api/v1/telemetry/events` (HTTP POST) de alta velocidad para recibir telemetría atómica.
* **Persistencia en ClickHouse DB**: Almacenamiento analítico columnar de alto rendimiento particionado por fecha (`toYYYYMM`).
* **Bucle de Reintentos de Conexión (`ClickHouseManager`)**: Reintenta automáticamente la conexión a la base de datos durante el arranque en contenedor.
* **Aprovisionamiento Automático en Grafana**:
  * Auto-instalación del plugin `grafana-clickhouse-datasource`.
  * Creación automática del Datasource ClickHouse (`http://clickhouse:8123`).
  * Tablero auto-cargado **"Sauron Vision - Analítica de Pasillo"** con 4 paneles preconfigurados:
    1. Registro de Entradas, Salidas, Permanencia en segundos y fotos por `person_id`.
    2. Stat de Tiempo Promedio de Permanencia.
    3. PieChart de Distribución de Primer Contacto (Extremo A vs Extremo B).
    4. Tabla de Telemetría en Crudo.

---

## 🛠️ Requisitos Previos
* Docker y Docker Compose
* Python 3.10+

---

## ⚡ Inicio Rápido

### 1. Configuración de Variables de Entorno
Copia la plantilla `.env.example` a `.env`:
```bash
cp .env.example .env
```

### 2. Instalación de Dependencias
```bash
make install
```

### 3. Iniciar Servicios en Docker (ClickHouse + Grafana)
```bash
make up
```
* **Grafana Web UI**: [http://localhost:3000](http://localhost:3000) (Usuario: `admin` / Password: `admin`)
* **ClickHouse HTTP Port**: `8123`

### 4. Ejecutar la API Central FastAPI
```bash
make run
```
* **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 📂 Estructura del Proyecto
```text
sauron-cloud/
├── grafana/
│   ├── dashboards/          # Tableros JSON aprovisionados
│   │   └── sauron_analytics.json
│   └── provisioning/        # Configuración de Aprovisionamiento Automático
│       ├── datasources/
│       │   └── clickhouse.yml
│       └── dashboards/
│           └── dashboards.yml
├── src/
│   ├── main.py              # API FastAPI con Swagger
│   └── db.py                # Gestor de conexión a ClickHouse
├── .env.example
├── docker-compose.yml       # Stack ClickHouse + Grafana LTS
├── Makefile
└── requirements.txt
```
