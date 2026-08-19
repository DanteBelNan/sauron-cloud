import os
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from db import ClickHouseManager

app = FastAPI(
    title="Sauron Vision - Central Cloud API",
    description="API de Ingesta y Gestión Centralizada para Sauron Vision SaaS",
    version="0.2.0"
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
    snapshot_url: Optional[str] = Field(default=None, example="http://localhost:5000/api/events/123/snapshot.jpg")

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
