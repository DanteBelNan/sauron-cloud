import os
import json
import time
import uuid
import queue
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import paho.mqtt.client as mqtt

load_dotenv()

from db import ClickHouseManager

app = FastAPI(
    title="Sauron Vision - Central Cloud API",
    description="API de Ingesta, Comandos y Gestión Centralizada para Sauron Vision SaaS",
    version="0.3.0"
)

db_manager = ClickHouseManager()

@app.on_event("startup")
def startup_db_client():
    db_manager.connect()

class TelemetryEvent(BaseModel):
    tenant_id: str = Field(..., example="tenant_poc")
    site_id: str = Field(..., example="site_home")
    camera_id: str = Field(..., example="webcam_laptop")
    person_id: str = Field(..., example="1787103829.431-abc")
    zone: str = Field(..., example="zona_extremo_a")
    direction: str = Field(default="IN", example="IN")
    timestamp: float = Field(..., example=1700000000.0)
    confidence: float = Field(default=1.0, example=0.85)
    snapshot_url: Optional[str] = Field(default=None, example=None)

class CommandRequest(BaseModel):
    tenant_id: str = Field(default_factory=lambda: os.getenv("TENANT_ID", "tenant_poc"))
    site_id: str = Field(default_factory=lambda: os.getenv("SITE_ID", "site_home"))
    action: str = Field(..., example="ping")  # ping, start_stream, reconfigure_zones
    command_id: Optional[str] = Field(default=None, example="cmd_001")
    payload: dict = Field(default_factory=dict, example={"camera_id": "webcam_laptop"})

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "sauron-cloud-api",
        "database_connected": db_manager.client is not None
    }

@app.post("/api/v1/telemetry/events", status_code=status.HTTP_201_CREATED)
def receive_telemetry_event(event: TelemetryEvent):
    """
    Endpoint de Ingesta Atómica de Eventos desde los Sauron Edge Proxies.
    """
    event_dict = event.model_dump()
    print(f"[CLOUD API] Evento atómico recibido (person_id: {event_dict['person_id']}): {event_dict}")

    success = db_manager.insert_event(event_dict)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fallo al registrar evento en ClickHouse."
        )

    return {
        "status": "success",
        "message": "Evento atómico registrado correctamente",
        "person_id": event_dict["person_id"]
    }

@app.post("/api/v1/commands", status_code=status.HTTP_200_OK)
def send_command_to_edge(cmd: CommandRequest):
    """
    Endpoint de Emisión de Comandos Sincronizados (Request-Reply sobre MQTT con Correlation ID).
    Publica en saas/{tenant_id}/{site_id}/commands y espera la respuesta en saas/{tenant_id}/{site_id}/status.
    """
    mqtt_host = os.getenv("MQTT_BROKER_HOST", "localhost")
    mqtt_port = int(os.getenv("MQTT_BROKER_PORT", 1883))

    command_id = cmd.command_id or f"cmd_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    target_topic = f"saas/{cmd.tenant_id}/{cmd.site_id}/commands"
    status_topic = f"saas/{cmd.tenant_id}/{cmd.site_id}/status"

    command_payload = {
        "command_id": command_id,
        "tenant_id": cmd.tenant_id,
        "site_id": cmd.site_id,
        "action": cmd.action,
        "payload": cmd.payload,
        "timestamp": time.time()
    }

    response_queue = queue.Queue()

    def on_message(client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
            if payload.get("command_id") == command_id:
                response_queue.put(payload)
        except Exception:
            pass

    try:
        client = mqtt.Client()
        client.on_message = on_message
        client.connect(mqtt_host, mqtt_port, 60)
        client.subscribe(status_topic)
        client.loop_start()

        # Publicar comando
        client.publish(target_topic, json.dumps(command_payload))
        print(f"[CLOUD API -> MQTT] Comando publicado (ID: {command_id}) en '{target_topic}'. Esperando respuesta...")

        # Esperar respuesta por Correlation ID (timeout 3s)
        try:
            edge_response = response_queue.get(timeout=3.0)
            client.loop_stop()
            client.disconnect()
            print(f"[CLOUD API <- STATUS] Respuesta recibida de Edge (ID: {command_id}): {edge_response}")
            return {
                "status": "success",
                "command_id": command_id,
                "action": cmd.action,
                "response": edge_response.get("result", edge_response)
            }
        except queue.Empty:
            client.loop_stop()
            client.disconnect()
            print(f"[CLOUD API WARN] Timeout esperando respuesta de Edge para command_id '{command_id}'.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Timeout: El Edge Agent ({cmd.tenant_id}/{cmd.site_id}) no respondió en 3 segundos."
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[CLOUD API ERROR] Fallo en la comunicación MQTT: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo en la comunicación MQTT con Edge Agent: {e}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
