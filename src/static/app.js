document.addEventListener("DOMContentLoaded", () => {
    const tenantIdInput = document.getElementById("tenantId");
    const siteIdInput = document.getElementById("siteId");
    const cameraIdInput = document.getElementById("cameraId");

    const btnStartStream = document.getElementById("btnStartStream");
    const btnStopStream = document.getElementById("btnStopStream");
    const btnPing = document.getElementById("btnPing");
    const btnClearConsole = document.getElementById("btnClearConsole");

    const streamImagePlayer = document.getElementById("streamImagePlayer");
    const placeholderOverlay = document.getElementById("placeholderOverlay");
    const streamBadge = document.getElementById("streamBadge");
    const streamBadgeText = document.getElementById("streamBadgeText");
    const consoleOutput = document.getElementById("consoleOutput");

    function logToConsole(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        let formattedMessage = `[${timestamp}] ${message}`;
        if (data) {
            formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
        }
        consoleOutput.textContent = formattedMessage + "\n\n" + consoleOutput.textContent;
    }

    function setStreamState(online, text = "STANDBY") {
        streamBadgeText.textContent = text;
        if (online) {
            streamBadge.className = "stream-badge online";
            streamImagePlayer.classList.remove("hidden");
            btnStopStream.classList.remove("hidden");
            placeholderOverlay.style.display = "none";
        } else {
            streamBadge.className = "stream-badge offline";
            streamImagePlayer.classList.add("hidden");
            btnStopStream.classList.add("hidden");
            streamImagePlayer.src = "";
            placeholderOverlay.style.display = "flex";
        }
    }

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
        const cameraId = cameraIdInput.value.trim() || "webcam_laptop";

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
        const cameraId = cameraIdInput.value.trim() || "webcam_laptop";

        logToConsole(`Deteniendo sesión de transmisión para cámara '${cameraId}'...`);

        // Cortar la conexión HTTP del reproductor inmediatamente (cae a 0 KB/s)
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
