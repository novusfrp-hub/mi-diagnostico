# Plan de Implementación Definitivo: Conexión WebHID con Polling Continuo (`pages/index.js`)

## 1. Alcance
- **Archivo:** [`pages/index.js`](file:///d:/programacion/mi-diagnostico/pages/index.js)
- **Función:** `conectarMultimetroUSB` ([Líneas 1303 a 1461](file:///d:/programacion/mi-diagnostico/pages/index.js#L1303-L1461)) y `desconectarMultimetroUSB` ([Líneas 1462 a 1475](file:///d:/programacion/mi-diagnostico/pages/index.js#L1462-L1475))
- **Objetivo:** Inicialización WCH a 9600 bps y ciclo de polling continuo a 200 ms para capturar lecturas en tiempo real del multímetro UNI-T (UT61E+ PID `0xE429`).

---

## 2. Arquitectura de la Solución Aplicada

### A. Apertura y Configuración UART a 9600 Baudios (Feature Report)
Al abrir el dispositivo, se envía el Feature Report que configura el UART interno del puente WCH a **9600 baudios 8N1**:
```javascript
if (!device.opened) {
  await device.open();
}
try {
  await device.sendFeatureReport(0x00, new Uint8Array([0x80, 0x25, 0x00, 0x00, 0x03]));
  await new Promise(resolve => setTimeout(resolve, 100));
} catch (e1) {
  try {
    const feat64 = new Uint8Array(64);
    feat64.set([0x80, 0x25, 0x00, 0x00, 0x03]);
    await device.sendFeatureReport(0x00, feat64);
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (e2) {
    console.warn("Aviso en sendFeatureReport:", e2);
  }
}
setDispositivoUsb(device);
setUsbConectado(true);
```

### B. Listener `inputreport` Intacto
El listener original recibe y procesa todas las tramas que llegan en respuesta al polling:
```javascript
device.addEventListener("inputreport", event => {
  const text = new TextDecoder("latin1").decode(event.data);
  // ... procesamiento y AutoHold original sin alteraciones ...
});
```

### C. Ciclo de Polling Continuo cada 200 ms (`window.unitPollInterval`)
Dado que el protocolo opera en modo solicitud-respuesta, un `setInterval` a 200 ms emite continuamente el comando `[0x06, 0xAB, 0xCD, 0x03, 0x5E, 0x01, 0xD9]` con fallback automático a 64 bytes para compatibilidad estricta con Windows:
```javascript
if (typeof window !== 'undefined') {
  if (window.unitPollInterval) clearInterval(window.unitPollInterval);
  const pollCmd = new Uint8Array([0x06, 0xAB, 0xCD, 0x03, 0x5E, 0x01, 0xD9]);
  const pollCmd64 = new Uint8Array(64);
  pollCmd64.set(pollCmd);

  window.unitPollInterval = setInterval(async () => {
    if (!device || !device.opened) {
      clearInterval(window.unitPollInterval);
      return;
    }
    try {
      await device.sendReport(0x00, pollCmd);
    } catch (e1) {
      try {
        await device.sendReport(0x00, pollCmd64);
      } catch (e2) {
        // Ignorar si el puerto se cierra
      }
    }
  }, 200);
}
```

### D. Limpieza al Desconectar
Al ejecutar `desconectarMultimetroUSB`, el temporizador se cancela y se libera la memoria:
```javascript
if (typeof window !== 'undefined' && window.unitPollInterval) {
  clearInterval(window.unitPollInterval);
  window.unitPollInterval = null;
}
```
