# Plan de Implementación Definitivo: Conexión WebHID Limpia (`pages/index.js`)

## 1. Alcance
- **Archivo:** [`pages/index.js`](file:///d:/programacion/mi-diagnostico/pages/index.js)
- **Función:** `conectarMultimetroUSB` ([Líneas 1303 a 1437](file:///d:/programacion/mi-diagnostico/pages/index.js#L1303-L1437))
- **Objetivo:** Conexión autónoma y directa del multímetro UNI-T (WCH VID `0x1A86`, PID `0xE429`) en WebHID sin requerir el software del fabricante y sin interrumpir el flujo continuo de lecturas.

---

## 2. Arquitectura de la Solución Aplicada

### A. Apertura y Configuración UART a 9600 Baudios (Feature Report)
Al abrir el dispositivo, se envía exclusivamente el Feature Report que configura el UART interno del puente WCH a **9600 baudios 8N1** (la única acción que realizaba el software del fabricante al iniciar):
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

### B. Streaming Continuo en `inputreport` (Sin Comandos Intrusivos)
Se eliminó el comando `sendReport` (`0x06, 0xAB, 0xCD...`) que interfería y bloqueaba la transmisión natural del multímetro. El multímetro emite autónomamente su ráfaga continua de tramas al listener original:
```javascript
device.addEventListener("inputreport", event => {
  const text = new TextDecoder("latin1").decode(event.data);
  // ... procesamiento y AutoHold original sin alteraciones ...
});
```
