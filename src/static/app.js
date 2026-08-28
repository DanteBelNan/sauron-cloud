document.addEventListener("DOMContentLoaded", () => {
    const tenantIdInput = document.getElementById("tenantId");
    const siteIdInput = document.getElementById("siteId");
    const cameraSelector = document.getElementById("cameraSelector");

    const btnStartStream = document.getElementById("btnStartStream");
    const btnStopStream = document.getElementById("btnStopStream");
    const btnEditZones = document.getElementById("btnEditZones");
    const btnSaveZones = document.getElementById("btnSaveZones");
    const btnPing = document.getElementById("btnPing");
    const btnClearConsole = document.getElementById("btnClearConsole");

    // Modal de Alta de Cámara
    const addCameraModal = document.getElementById("addCameraModal");
    const btnOpenAddModal = document.getElementById("btnOpenAddModal");
    const btnCloseAddModal = document.getElementById("btnCloseAddModal");
    const btnCancelAddCamera = document.getElementById("btnCancelAddCamera");
    const btnSubmitAddCamera = document.getElementById("btnSubmitAddCamera");

    const newCameraIdInput = document.getElementById("newCameraId");
    const newCameraIpInput = document.getElementById("newCameraIp");
    const newCameraPortInput = document.getElementById("newCameraPort");
    const newCameraPathInput = document.getElementById("newCameraPath");
    const newCameraUserInput = document.getElementById("newCameraUser");
    const newCameraPassInput = document.getElementById("newCameraPass");

    const streamImagePlayer = document.getElementById("streamImagePlayer");
    const zoneCanvas = document.getElementById("zoneCanvas");
    const placeholderOverlay = document.getElementById("placeholderOverlay");
    const streamBadge = document.getElementById("streamBadge");
    const streamBadgeText = document.getElementById("streamBadgeText");
    const consoleOutput = document.getElementById("consoleOutput");

    const ctx = zoneCanvas.getContext("2d");

    // Vértices de Zonas iniciales (Normalizados entre 0.0 y 1.0)
    let zonesData = {
        "zona_extremo_a": {
            color: "#f97316", // Naranja
            points: [
                { x: 0.0, y: 0.0 },
                { x: 0.59, y: 0.0 },
                { x: 0.59, y: 1.0 },
                { x: 0.0, y: 1.0 }
            ]
        },
        "zona_extremo_b": {
            color: "#3b82f6", // Azul
            points: [
                { x: 0.41, y: 0.0 },
                { x: 1.0, y: 0.0 },
                { x: 1.0, y: 1.0 },
                { x: 0.41, y: 1.0 }
            ]
        }
    };

    let isEditing = false;
    let draggingZone = null;
    let draggingPointIndex = -1;

    function logToConsole(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        let formattedMessage = `[${timestamp}] ${message}`;
        if (data) {
            formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
        }
        consoleOutput.textContent = formattedMessage + "\n\n" + consoleOutput.textContent;
    }

    function resetEditingState() {
        isEditing = false;
        btnEditZones.textContent = "✏️ Editar Hitboxes";
        btnEditZones.classList.add("hidden");
        btnSaveZones.classList.add("hidden");
        zoneCanvas.classList.add("hidden");
        draggingZone = null;
        draggingPointIndex = -1;
    }

    function setStreamState(online, text = "STANDBY") {
        streamBadgeText.textContent = text;
        if (online) {
            streamBadge.className = "stream-badge online";
            streamImagePlayer.classList.remove("hidden");
            btnStopStream.classList.remove("hidden");
            btnEditZones.classList.remove("hidden");
            placeholderOverlay.style.display = "none";
        } else {
            streamBadge.className = "stream-badge offline";
            streamImagePlayer.classList.add("hidden");
            btnStopStream.classList.add("hidden");
            resetEditingState();
            streamImagePlayer.src = "";
            placeholderOverlay.style.display = "flex";
        }
    }

    // Inicializar estado limpio desde el inicio
    setStreamState(false, "STANDBY");

    // Modal Events
    function openModal() { addCameraModal.classList.remove("hidden"); }
    function closeModal() { addCameraModal.classList.add("hidden"); }

    btnOpenAddModal.addEventListener("click", openModal);
    btnCloseAddModal.addEventListener("click", closeModal);
    btnCancelAddCamera.addEventListener("click", closeModal);

    // Enviar Alta de Cámara Parametrizada
    btnSubmitAddCamera.addEventListener("click", async () => {
        const tenantId = tenantIdInput.value.trim() || "tenant_poc";
        const siteId = siteIdInput.value.trim() || "site_home";

        const cameraId = newCameraIdInput.value.trim();
        const ip = newCameraIpInput.value.trim();
        const port = newCameraPortInput.value.trim() || "554";
        const streamPath = newCameraPathInput.value.trim() || "stream2";
        const username = newCameraUserInput.value.trim();
        const password = newCameraPassInput.value.trim();

        if (!cameraId || !ip) {
            alert("⚠️ Por favor complete el ID de Cámara y la IP.");
            return;
        }

        logToConsole(`Enviando orden 'add_camera' para '${cameraId}' (${ip}:${port}/${streamPath})...`);

        // Alta Optimista en el desplegable
        let existingOption = Array.from(cameraSelector.options).find(opt => opt.value === cameraId);
        if (!existingOption) {
            const newOpt = document.createElement("option");
            newOpt.value = cameraId;
            newOpt.textContent = `${cameraId} (${ip})`;
            cameraSelector.appendChild(newOpt);
        }
        cameraSelector.value = cameraId;

        closeModal();

        try {
            const response = await fetch("/api/v1/commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    site_id: siteId,
                    action: "add_camera",
                    payload: {
                        camera_id: cameraId,
                        ip: ip,
                        port: parseInt(port, 10),
                        username: username,
                        password: password,
                        stream_path: streamPath
                    }
                })
            });

            const data = await response.json();
            if (response.ok && data.status === "success") {
                const resPayload = data.response || {};
                if (resPayload.status === "already_exists") {
                    logToConsole("ℹ️ La cámara ya estaba registrada en Frigate NVR:", resPayload);
                    alert(`ℹ️ Cámara '${cameraId}' ya estaba registrada en Frigate.`);
                } else {
                    logToConsole("✅ Nueva cámara agregada exitosamente a Frigate:", resPayload);
                    alert(`✅ Cámara '${cameraId}' agregada a Frigate NVR.\n\nPresione 'Ver Cámara en Vivo' para iniciar el stream.`);
                }
            } else {
                logToConsole("❌ Error registrando nueva cámara:", data);
            }
        } catch (err) {
            logToConsole("🔥 Error de red en alta de cámara:", err.message);
        }
    });

    function updateZonesFromEdge(currentZones) {
        if (!currentZones || Object.keys(currentZones).length === 0) return;

        const cameraWidth = 1280;
        const cameraHeight = 720;

        const zoneColors = {
            "zona_extremo_a": "#f97316", // Naranja
            "zona_extremo_b": "#3b82f6"  // Azul
        };

        for (const [zName, coordStr] of Object.entries(currentZones)) {
            if (!coordStr) continue;
            const nums = coordStr.split(",").map(n => parseInt(n.trim(), 10));
            const points = [];

            for (let i = 0; i < nums.length; i += 2) {
                if (!isNaN(nums[i]) && !isNaN(nums[i+1])) {
                    points.push({
                        x: Math.max(0.0, Math.min(nums[i] / cameraWidth, 1.0)),
                        y: Math.max(0.0, Math.min(nums[i+1] / cameraHeight, 1.0))
                    });
                }
            }

            if (points.length >= 3) {
                const color = zoneColors[zName] || (Object.keys(zonesData).length % 2 === 0 ? "#10b981" : "#a855f7");
                zonesData[zName] = { color: color, points: points };
            }
        }
        logToConsole("📍 Zonas inicializadas dinámicamente desde la cámara real:", zonesData);
    }

    function resizeCanvas() {
        const rect = streamImagePlayer.getBoundingClientRect();
        zoneCanvas.width = rect.width || 800;
        zoneCanvas.height = rect.height || 450;
        drawZones();
    }

    function drawZones() {
        if (!isEditing) return;
        ctx.clearRect(0, 0, zoneCanvas.width, zoneCanvas.height);

        const w = zoneCanvas.width;
        const h = zoneCanvas.height;

        for (const [zoneName, zone] of Object.entries(zonesData)) {
            const pts = zone.points;
            if (!pts || pts.length === 0) continue;

            // Dibujar polígono
            ctx.beginPath();
            ctx.moveTo(pts[0].x * w, pts[0].y * h);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x * w, pts[i].y * h);
            }
            ctx.closePath();

            ctx.fillStyle = zone.color + "33"; // Transparencia 20%
            ctx.fill();
            ctx.strokeStyle = zone.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Dibujar puntos de agarre (Handles)
            pts.forEach((pt) => {
                ctx.beginPath();
                ctx.arc(pt.x * w, pt.y * h, 6, 0, 2 * Math.PI);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.strokeStyle = zone.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // Etiqueta de la zona
            const labelX = pts[0].x * w + 10;
            const labelY = pts[0].y * h + 20;
            ctx.fillStyle = zone.color;
            ctx.font = "bold 14px Outfit, sans-serif";
            ctx.fillText(zoneName, labelX, labelY);
        }
    }

    // Manejo de Interacción Mouse en Canvas
    zoneCanvas.addEventListener("mousedown", (e) => {
        if (!isEditing) return;
        const rect = zoneCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const w = zoneCanvas.width;
        const h = zoneCanvas.height;

        for (const [zoneName, zone] of Object.entries(zonesData)) {
            zone.points.forEach((pt, idx) => {
                const px = pt.x * w;
                const py = pt.y * h;
                const dist = Math.hypot(mouseX - px, mouseY - py);
                if (dist <= 10) {
                    draggingZone = zoneName;
                    draggingPointIndex = idx;
                }
            });
        }
    });

    zoneCanvas.addEventListener("mousemove", (e) => {
        if (!isEditing || !draggingZone) return;
        const rect = zoneCanvas.getBoundingClientRect();
        const mouseX = Math.max(0, Math.min(e.clientX - rect.left, zoneCanvas.width));
        const mouseY = Math.max(0, Math.min(e.clientY - rect.top, zoneCanvas.height));

        zonesData[draggingZone].points[draggingPointIndex] = {
            x: mouseX / zoneCanvas.width,
            y: mouseY / zoneCanvas.height
        };

        drawZones();
    });

    zoneCanvas.addEventListener("mouseup", () => {
        draggingZone = null;
        draggingPointIndex = -1;
    });

    btnEditZones.addEventListener("click", () => {
        isEditing = !isEditing;
        if (isEditing) {
            btnEditZones.textContent = "❌ Cancelar Edición";
            btnSaveZones.classList.remove("hidden");
            zoneCanvas.classList.remove("hidden");
            resizeCanvas();
        } else {
            resetEditingState();
            btnEditZones.classList.remove("hidden");
        }
    });

    // Guardar y Aplicar Zonas
    btnSaveZones.addEventListener("click", async () => {
        const tenantId = tenantIdInput.value.trim() || "tenant_poc";
        const siteId = siteIdInput.value.trim() || "site_home";
        const cameraId = cameraSelector.value || "camara_ip";

        // Escalar coordenadas a la resolución real de la cámara (1280x720)
        const cameraWidth = 1280;
        const cameraHeight = 720;

        const formattedZones = {};
        for (const [zoneName, zone] of Object.entries(zonesData)) {
            const coordArray = [];
            zone.points.forEach(pt => {
                const px = Math.round(pt.x * cameraWidth);
                const py = Math.round(pt.y * cameraHeight);
                coordArray.push(`${px},${py}`);
            });
            formattedZones[zoneName] = coordArray.join(",");
        }

        logToConsole(`Enviando reconfiguración de zonas para '${cameraId}'...`, formattedZones);

        // Cortar la conexión del stream y resetear estado de edición mientras el Edge se recarga
        setStreamState(false, "RECARGANDO EDGE...");

        try {
            const response = await fetch("/api/v1/commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    site_id: siteId,
                    action: "reconfigure_zones",
                    payload: {
                        camera_id: cameraId,
                        zones: formattedZones
                    }
                })
            });

            const data = await response.json();
            if (response.ok && data.status === "success") {
                logToConsole("🔄 Reconfiguración enviada. Frigate se está recargando en el Edge. Aguarde unos segundos y vuelva a presionar 'Ver Cámara en Vivo'.", data);
                alert("🔄 Reconfiguración Aplicada Exitosamente.\n\nFrigate NVR se está recargando en el Edge Agent con los nuevos polígonos.\n\nPor favor aguarde 5 a 10 segundos y presione nuevamente 'Ver Cámara en Vivo' para reconectar.");
            } else {
                logToConsole("❌ Error reconfigurando zonas:", data);
            }
        } catch (err) {
            logToConsole("🔥 Error de red al aplicar zonas:", err.message);
        }
    });

    btnClearConsole.addEventListener("click", () => {
        consoleOutput.textContent = "-- Consola despejada.";
    });

    // 1. Probar Estado (Ping)
    btnPing.addEventListener("click", async () => {
        const tenantId = tenantIdInput.value.trim() || "tenant_poc";
        const siteId = siteIdInput.value.trim() || "site_home";

        logToConsole(`Enviando comando 'ping' a ${tenantId}/${siteId}...`);

        try {
            const response = await fetch("/api/v1/commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    site_id: siteId,
                    action: "ping"
                })
            });

            const data = await response.json();
            if (response.ok) {
                logToConsole("✅ Respuesta recibida de Edge Agent:", data);
            } else {
                logToConsole("❌ Error en comando ping:", data);
            }
        } catch (err) {
            logToConsole("🔥 Error de red conectando a Cloud API:", err.message);
        }
    });

    // 2. Ver Cámara en Vivo (start_stream)
    btnStartStream.addEventListener("click", async () => {
        const tenantId = tenantIdInput.value.trim() || "tenant_poc";
        const siteId = siteIdInput.value.trim() || "site_home";
        const cameraId = cameraSelector.value;

        if (!cameraId) {
            alert("⚠️ Seleccione o agregue una cámara primero.");
            return;
        }

        logToConsole(`Solicitando stream limpio para cámara '${cameraId}' (${tenantId}/${siteId})...`);
        setStreamState(false, "CONECTANDO...");

        try {
            const response = await fetch("/api/v1/commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    site_id: siteId,
                    action: "start_stream",
                    payload: { camera_id: cameraId }
                })
            });

            const data = await response.json();
            if (response.ok && data.status === "success") {
                const streamUrl = data.response?.stream_url;
                const currentZones = data.response?.current_zones;

                if (currentZones) {
                    updateZonesFromEdge(currentZones);
                }

                if (streamUrl) {
                    logToConsole("🎥 Stream limpio recibido. Cargando reproductor...", data);
                    streamImagePlayer.src = streamUrl;
                    setStreamState(true, "EN VIVO");
                } else {
                    logToConsole("⚠️ El Edge no devolvió stream_url:", data);
                    setStreamState(false, "ERROR URL");
                }
            } else {
                logToConsole("❌ Error al iniciar stream:", data);
                setStreamState(false, "OFFLINE");
            }
        } catch (err) {
            logToConsole("🔥 Error de red solicitando stream:", err.message);
            setStreamState(false, "ERROR DE RED");
        }
    });

    // 3. Detener Stream (stop_stream)
    btnStopStream.addEventListener("click", async () => {
        const tenantId = tenantIdInput.value.trim() || "tenant_poc";
        const siteId = siteIdInput.value.trim() || "site_home";
        const cameraId = cameraSelector.value || "camara_ip";

        logToConsole(`Deteniendo sesión de transmisión para cámara '${cameraId}'...`);

        setStreamState(false, "STANDBY");

        try {
            const response = await fetch("/api/v1/commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    site_id: siteId,
                    action: "stop_stream",
                    payload: { camera_id: cameraId }
                })
            });

            const data = await response.json();
            if (response.ok) {
                logToConsole("⏹️ Confirmación de cierre recibida de Edge Agent:", data);
            } else {
                logToConsole("⚠️ El Edge no confirmó la detención:", data);
            }
        } catch (err) {
            logToConsole("🔥 Error de red al detener stream:", err.message);
        }
    });
});
