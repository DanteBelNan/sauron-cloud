import os
import time
from datetime import datetime
import clickhouse_connect

class ClickHouseManager:
    """
    Gestor de conexión y operaciones sobre ClickHouse para sauron-cloud.
    Soporta reintentos automáticos de conexión al iniciar.
    """

    def __init__(self):
        self.host = os.getenv("CLICKHOUSE_HOST", "localhost")
        self.port = int(os.getenv("CLICKHOUSE_PORT", 8123))
        self.user = os.getenv("CLICKHOUSE_USER", "default")
        self.password = os.getenv("CLICKHOUSE_PASSWORD", "Clickhouse123!")
        self.database = os.getenv("CLICKHOUSE_DB", "sauron")
        self.client = None

    def connect(self, retries: int = 5, delay: int = 2):
        """Intenta conectar a ClickHouse con reintentos en caso de que el contenedor esté iniciando."""
        for attempt in range(1, retries + 1):
            try:
                print(f"[CLOUD DB] Intentando conectar a ClickHouse en {self.host}:{self.port} (Intento {attempt}/{retries})...")
                self.client = clickhouse_connect.get_client(
                    host=self.host,
                    port=self.port,
                    username=self.user,
                    password=self.password
                )
                print(f"[CLOUD DB SUCCESS] Conectado exitosamente a ClickHouse!")
                self._init_db()
                return True
            except Exception as e:
                print(f"[CLOUD DB WARN] Intento {attempt}/{retries} fallido: {e}")
                if attempt < retries:
                    time.sleep(delay)

        print("[CLOUD DB ERROR] No se pudo conectar a ClickHouse tras varios intentos. Modo fallback activo.")
        return False

    def _init_db(self):
        if not self.client:
            return
        
        self.client.command(f"CREATE DATABASE IF NOT EXISTS {self.database}")
        
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {self.database}.telemetry_events (
            event_id UUID DEFAULT generateUUIDv4(),
            tenant_id String,
            site_id String,
            camera_id String,
            person_id String,
            zone String,
            direction Enum8('IN' = 1, 'OUT' = 2, 'ZONE_ENTER' = 3),
            timestamp DateTime64(3, 'UTC'),
            confidence Float32,
            snapshot_url Nullable(String),
            created_at DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (tenant_id, site_id, camera_id, person_id, timestamp);
        """
        self.client.command(create_table_query)
        print(f"[CLOUD DB] Tabla '{self.database}.telemetry_events' verificada correctamente.")

    def insert_event(self, event_data: dict):
        if not self.client:
            print(f"[CLOUD DB FALLBACK] Registrando evento localmente: {event_data}")
            return True

        try:
            ts = datetime.utcfromtimestamp(event_data.get("timestamp", datetime.utcnow().timestamp()))
            
            row = [
                event_data["tenant_id"],
                event_data["site_id"],
                event_data["camera_id"],
                event_data.get("person_id", "unknown"),
                event_data.get("zone", "unknown_zone"),
                event_data.get("direction", "IN"),
                ts,
                float(event_data.get("confidence", 1.0)),
                event_data.get("snapshot_url", None)
            ]

            self.client.insert(
                f"{self.database}.telemetry_events",
                [row],
                column_names=[
                    'tenant_id', 'site_id', 'camera_id', 'person_id', 
                    'zone', 'direction', 'timestamp', 'confidence', 'snapshot_url'
                ]
            )
            print(f"[CLOUD DB] Evento de person_id '{event_data.get('person_id')}' (Zona: {event_data.get('zone')}) insertado en ClickHouse.")
            return True

        except Exception as e:
            print(f"[CLOUD DB ERROR] Error al insertar evento en ClickHouse: {e}")
            return False
