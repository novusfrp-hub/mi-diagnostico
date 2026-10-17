# Plan de Implementación Corregido: Inicialización WebHID en JSX (`pages/index.js`)

## 1. Alcance Exclusivo
- **Archivo único a modificar:** [`pages/index.js`](file:///d:/programacion/mi-diagnostico/pages/index.js)
- **Función única:** `conectarMultimetroUSB` (líneas ~1303 a 1415).
- **Tecnología:** 100% WebHID nativo en el navegador (`navigator.hid`) dentro de React/JSX. Sin dependencias externas ni scripts de otros lenguajes.

---

## 2. Las 3 Reglas Críticas de Implementación

1. **TextDecoder 100% Intacto:**
   En el listener `device.addEventListener("inputreport", event => { ... })`:
   ```javascript
   const text = new TextDecoder("latin1").decode(event.data);
   ```
   **NO se altera, NO se recorta con slice, NO se aplica máscara `& 0x3F`**. Se mantiene la decodificación nativa original tal como está.

2. **Inicialización Feature Report Inmediatamente tras `device.open()`:**
   Configura el UART interno del puente WCH (9600 bps 8N1) y estabiliza el PLL con una pausa de 100 ms:
   ```javascript
   await device.open();
   await device.sendFeatureReport(0x00, new Uint8Array([0x80, 0x25, 0x00, 0x00, 0x03]));
   await new Promise(resolve => setTimeout(resolve, 100));
   ```

3. **Envío de `sendReport` POSTERIOR al Registro del Listener:**
   Para evitar condiciones de carrera donde el dispositivo empiece a emitir lecturas antes de que el navegador esté escuchando, el listener se registra primero y el comando de activación se dispara inmediatamente después de cerrar el bloque `device.addEventListener`:
   ```javascript
   await device.sendReport(0x00, new Uint8Array([0x06, 0xAB, 0xCD, 0x03, 0x5E, 0x01, 0xD9]));
   ```

---

## 3. Dónde se Implementan las Correcciones en `pages/index.js`

### Bloque A: Apertura e Inicialización (Línea ~1307)
```diff
- const devices = await navigator.hid.requestDevice({ filters: [{ vendorId: 0x1A86, productId: 0xE429 }] });
- if (devices.length === 0) return; const device = devices[0]; await device.open(); setDispositivoUsb(device); setUsbConectado(true);
+ const devices = await navigator.hid.requestDevice({ filters: [{ vendorId: 0x1A86, productId: 0xE429 }] });
+ if (devices.length === 0) return; 
+ const device = devices[0]; 
+ await device.open();
+ 
+ // Inicialización Feature Report WCH (9600 baudios 8N1) y estabilización
+ await device.sendFeatureReport(0x00, new Uint8Array([0x80, 0x25, 0x00, 0x00, 0x03]));
+ await new Promise(resolve => setTimeout(resolve, 100));
+ 
+ setDispositivoUsb(device); 
+ setUsbConectado(true);
```

### Bloque B: Listener `inputreport` (Líneas ~1308 a 1413)
```javascript
  // 100% INTACTO: TextDecoder original sin recortes ni máscaras
  device.addEventListener("inputreport", event => {
    const text = new TextDecoder("latin1").decode(event.data);
    // ... todo el procesamiento, regex y AutoHold original sin tocar ...
  });
```

### Bloque C: Envío del Comando de Polling (Línea ~1414, justo tras cerrar el listener)
```diff
    });
+   
+   // Comando de activación / polling una vez registrado el listener
+   await device.sendReport(0x00, new Uint8Array([0x06, 0xAB, 0xCD, 0x03, 0x5E, 0x01, 0xD9]));
  } catch (error) { alert("Error USB."); }
```

---

## 4. Garantías de No Afectación
- Toda la lógica existente de captura de valores (`OL`, voltios, diodo, amperios, microamperios, ohmios), avance mágico de pines y estados del HUD queda completamente preservada sin riesgo de desfase en los índices de la trama.
