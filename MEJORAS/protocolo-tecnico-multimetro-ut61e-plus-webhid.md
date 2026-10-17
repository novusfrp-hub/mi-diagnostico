# Protocolo Técnico de Comunicación y Decodificación: UNI-T UT61E+ vía WebHID / USB

Este documento detalla la especificación técnica completa de la comunicación bidireccional entre la computadora/navegador y el multímetro digital **UNI-T UT61E+ (22,000 Counts)** mediante el puente USB-HID integrado (chip **WCH CH9325**).

---

## 1. Identificación y Hardware USB (Puente WCH CH9325)

El multímetro UT61E+ incorpora internamente un chip microcontrolador de medición (DMM ASIC) que envía lecturas seriales UART hacia un chip puente USB-HID de QinHeng Electronics (**WCH CH9325**).

### Parámetros de Identificación USB:
* **Vendor ID (VID):** `0x1A86` (QinHeng Electronics)
* **Product ID (PID):** `0xE429` (WCH CH9325 HID Bridge)
* **Tipo de Conexión:** Dispositivo USB HID estándar (Human Interface Device).
* **Compatibilidad de Navegadores:** Chrome, Edge, Opera, Brave (requiere API nativa `navigator.hid`). No requiere controladores COM virtuales ni privilegios de administrador.

### ¿Qué significa la especificación técnica `9600 8N1`?
Es la configuración fija de la interfaz serial UART interna del chip puente:
* **9600:** Velocidad de modulación de 9,600 baudios por segundo (~1.04 ms por byte).
* **8:** 8 bits de datos por cada carácter (rango `0x00` a `0xFF`).
* **N (None):** Sin bit de paridad (sin verificación de paridad por hardware).
* **1:** 1 bit de parada (Stop Bit) para resincronizar el marco temporal.

> **Regla de Interfaz Gráfica:** Este parámetro es fijo a nivel de hardware/firmware. Mostrar `9600 8N1` en la pantalla del usuario técnico genera ruido visual innecesario, por lo que se elimina de la interfaz de usuario.

---

## 2. Secuencia de Inicialización y Polling WebHID

Para que el multímetro empiece a transferir lecturas, el host debe realizar dos operaciones:

### Paso A: Configurar el UART del chip WCH (Feature Report 0x00)
Al abrir el dispositivo HID, se debe enviar un reporte de características (*Feature Report*) con Report ID `0x00`:
```javascript
// [0x80, 0x25, 0x00, 0x00, 0x03] configura 9600 baudios, 8 bits, 1 stop bit
await device.sendFeatureReport(0x00, new Uint8Array([0x80, 0x25, 0x00, 0x00, 0x03]));
```

### Paso B: Ciclo de Polling Activo cada 180 a 200 ms
El UT61E+ no envía datos en modo *stream continuo*, sino en modo **solicitud - respuesta (polling)**. El host debe solicitar cada medición:
* **Comando de Consulta:** `[0x06, 0xAB, 0xCD, 0x03, 0x5E, 0x01, 0xD9]`
* **Estructura del paquete:**
  * `0x06`: Longitud de los 6 bytes siguientes.
  * `0xAB, 0xCD`: Cabecera de sincronización UNI-T.
  * `0x03`: Identificador de comando.
  * `0x5E`: Código del comando de lectura (*Poll Read*).
  * `0x01, 0xD9`: Checksum de 16 bits de la consulta.
* **Envío:** Se envía como reporte de salida (*Output Report*) con Report ID `0x00`, rellenando el buffer a 64 bytes:
```javascript
const pollCmd = new Uint8Array(64);
pollCmd.set([0x06, 0xAB, 0xCD, 0x03, 0x5E, 0x01, 0xD9]);
await device.sendReport(0x00, pollCmd);
```

---

## 3. Estructura de la Trama de Datos Recibida (Input Report)

Cada respuesta del multímetro llega a través del evento `inputreport` con un array de bytes (`Uint8Array` / `DataView`) de al menos 14 bytes útiles:

| Posición en Trama (`syncIdx`) | Nombre de Campo | Tipo de Dato | Descripción |
| :---: | :--- | :---: | :--- |
| `syncIdx + 0` | Cabecera Sync 1 | HEX (`0xAB`) | Primer byte de sincronización de trama legítima UNI-T. |
| `syncIdx + 1` | Cabecera Sync 2 | HEX (`0xCD`) | Segundo byte de sincronización de trama legítima UNI-T. |
| `syncIdx + 2` | Longitud Payload | HEX (`0x10` = 16) | Longitud de la carga útil del paquete UNI-T. |
| **`syncIdx + 3`** | **Modo / Posición Perilla** | **HEX (`0x00` - `0x1A`)** | **Posición física de la perilla y submodo activo.** |
| **`syncIdx + 4`** | **Rango / Escala** | **ASCII (`'0'` - `'7'`)** | Escala de medición (`r = Byte - 0x30`). Define el punto decimal. |
| **`syncIdx + 5` a `11`** | **Lectura LCD (7 bytes)** | **ASCII Puro** | Cadena exacta visible en el display físico del multímetro. |
| `syncIdx + 12` | Flags 1 | HEX Bitmask | Indicadores de Auto-Range, Hold, etc. |
| `syncIdx + 13` | Flags 2 | HEX Bitmask | Batería baja, polaridad, advertencias. |

---

## 4. Tabla Maestra de Decodificación de la Perilla (Byte 3 y Byte 4)

La función `decodificarPerillaUT61EPlus(modoByte, rangoByte)` traduce los valores directamente a formato técnico:

| Byte 3 (HEX) | Posición Física / Función | Prefijo | Unidad Base | Escala según Byte 4 (`r = B4 - 0x30`) |
| :---: | :--- | :---: | :---: | :--- |
| `0x00` | **V~** (Voltaje Alterno AC) | `AC` | `V` | 2.2000V, 22.000V, 220.00V, 750.0V |
| `0x01` | **mV~** (Milivoltios AC con SELECT) | `AC` | `mV` | 220.00 mV |
| `0x02` | **V⎓** (Voltaje Continuo DC) | `DC` | `V` | 2.2000V, 22.000V, 220.00V, 1000.0V |
| `0x03` | **mV⎓** (Milivoltios DC) | `DC` | `mV` | 220.00 mV |
| `0x04` | **Hz%** (Frecuencia) | `FREQ` | `Hz` / `kHz` / `MHz` | `r <= 1`: Hz | `r <= 4`: kHz | `r > 4`: MHz |
| `0x05` | **Hz%** (Ciclo de Trabajo Duty) | `DUTY` | `%` | 0.1% a 99.9% |
| `0x06` | **Ω** (Resistencia Ohmios) | `OHM` | `Ω` / `kΩ` / `MΩ` | `r = 0`: Ω | `r = 1..3`: kΩ | `r > 3`: MΩ |
| `0x07` | **Continuidad con Buzzer** | `CONT 🔊` | `Ω` | Pitido de continuidad física (< 50 Ω) |
| `0x08` | **Diodo (Caída de Tensión)** | `DIOD ▶|` | `V` | 0.0000 V a 3.0000 V (Ideal conectores FPC) |
| `0x09` | **Capacitancia** | `CAP ⊣⊢` | `nF` / `µF` / `mF` | `r <= 2`: nF | `r <= 5`: µF | `r > 5`: mF |
| `0x0A`, `0x0B` | **hFE** (Ganancia de Transistores) | `hFE` | `β` | Ganancia DC de transistores bipolares |
| `0x0C` | **µA⎓** (Microamperios DC) | `DC` | `µA` | 220.00 µA, 2200.0 µA |
| `0x0D` | **µA~** (Microamperios AC) | `AC` | `µA` | 220.00 µA, 2200.0 µA |
| `0x0E` | **mA⎓** (Miliamperios DC) | `DC` | `mA` | 22.000 mA, 220.00 mA |
| `0x0F` | **mA~** (Miliamperios AC) | `AC` | `mA` | 22.000 mA, 220.00 mA |
| `0x10` | **A⎓** (Amperios DC Alta Corriente)| `DC` | `A` | 20.000 A (Entrada 10A/20A) |
| `0x11` | **A~** (Amperios AC Alta Corriente)| `AC` | `A` | 20.000 A (Entrada 10A/20A) |
| `0x13`, `0x14` | Submodo **LPF AC** (Filtro Pasa-Bajos) | `LPF AC`| `V` | Atenúa armónicos en variadores/inversores |
| `0x15`..`0x19`| Submodo **AC + DC** Combinado | `AC+DC` | `V` | Lectura True-RMS combinada |
| `0x1A` | Submodo **NCV** (Detector de Campo AC) | `NCV` | `---` | Indicador visual de proximidad AC |

---

## 5. Control Remoto de Botones Físicos vía WebHID

El UT61E+ permite simular la pulsación de sus botones frontales enviando paquetes de reporte de salida (*Output Reports*). Esto permite cambiar de escala o activar funciones desde la interfaz en pantalla sin tocar el multímetro físico.

### Mapa Oficial de Comandos de Botones:
| Botón Frontal | Código HEX | Acción en el Multímetro |
| :---: | :---: | :--- |
| **SELECT** | `0x4C` | Conmuta subfunciones cíclicas: **Ω ➔ Cont 🔊 ➔ Diodo ▶| ➔ Cap ⊣⊢** (o alterna DC / AC). |
| **RANGE**  | `0x46` | Cambia el rango manual paso a paso. |
| **AUTO**   | `0x47` | Devuelve el instrumento al modo de auto-rango. |
| **HZ %**   | `0x49` | Conmuta entre Frecuencia (Hz) y Ciclo de Trabajo (%). |
| **REL**    | `0x48` | Activa modo relativo (ajusta la lectura actual como referencia cero Δ). |
| **HOLD**   | `0x4A` | Congela la lectura en pantalla y activa/apaga la luz del display LCD. |
| **PEAK**   | `0x4B` | Activa la captura de picos MAX / MIN por hardware. |

### Algoritmo de Cálculo de Checksum:
```javascript
const chkSum = (0xAB + 0xCD + 0x03 + codigo) & 0xFFFF;
const hi = (chkSum >> 8) & 0xFF;
const lo = chkSum & 0xFF;
```

### Estructura del Paquete de Salida (Output Report):
El paquete transmitido por WebHID tiene exactamente 7 bytes útiles, rellenados a 64 bytes para cumplir con el descriptor del chip WCH:
```text
[0x06, 0xAB, 0xCD, 0x03, codigo, hi, lo, 0x00, 0x00, ...]
```

---

## 6. Implementación Nativa en JavaScript (WebHID)

A continuación se muestra el código listo para ser utilizado en cualquier módulo React o aplicación web sin librerías externas:

```javascript
/**
 * Decodifica la perilla y el rango del UT61E+ directamente desde los bytes de hardware.
 */
export function decodificarPerillaUT61EPlus(modoByte, rangoByte) {
  const r = (rangoByte >= 0x30 && rangoByte <= 0x39) ? (rangoByte - 0x30) : 0;

  switch (modoByte) {
    case 0x00: return { prefijo: 'AC', unidad: 'V', modoKey: 'voltio' };
    case 0x01: return { prefijo: 'AC', unidad: 'mV', modoKey: 'voltio' };
    case 0x02: return { prefijo: 'DC', unidad: 'V', modoKey: 'voltio' };
    case 0x03: return { prefijo: 'DC', unidad: 'mV', modoKey: 'voltio' };
    case 0x04: {
      const u = r <= 1 ? 'Hz' : (r <= 4 ? 'kHz' : 'MHz');
      return { prefijo: 'FREQ', unidad: u, modoKey: 'frecuencia' };
    }
    case 0x05: return { prefijo: 'DUTY', unidad: '%', modoKey: 'duty' };
    case 0x06: {
      const u = r === 0 ? 'Ω' : (r <= 3 ? 'kΩ' : 'MΩ');
      return { prefijo: 'OHM', unidad: u, modoKey: 'ohmio' };
    }
    case 0x07: return { prefijo: 'CONT 🔊', unidad: 'Ω', modoKey: 'continuidad' };
    case 0x08: return { prefijo: 'DIOD ▶|', unidad: 'V', modoKey: 'diodo' };
    case 0x09: {
      const u = r <= 2 ? 'nF' : (r <= 5 ? 'µF' : 'mF');
      return { prefijo: 'CAP ⊣⊢', unidad: u, modoKey: 'capacitancia' };
    }
    case 0x0A:
    case 0x0B:
    case 0x12: return { prefijo: 'hFE', unidad: 'β', modoKey: 'hfe' };
    case 0x0C: return { prefijo: 'DC', unidad: 'µA', modoKey: 'ua' };
    case 0x0D: return { prefijo: 'AC', unidad: 'µA', modoKey: 'ua' };
    case 0x0E: return { prefijo: 'DC', unidad: 'mA', modoKey: 'ma' };
    case 0x0F: return { prefijo: 'AC', unidad: 'mA', modoKey: 'ma' };
    case 0x10: return { prefijo: 'DC', unidad: 'A', modoKey: 'amperio' };
    case 0x11: return { prefijo: 'AC', unidad: 'A', modoKey: 'amperio' };
    case 0x13:
    case 0x14: return { prefijo: 'LPF AC', unidad: 'V', modoKey: 'voltio' };
    case 0x15:
    case 0x16:
    case 0x17:
    case 0x18:
    case 0x19: return { prefijo: 'AC+DC', unidad: 'V', modoKey: 'voltio' };
    case 0x1A: return { prefijo: 'NCV', unidad: '---', modoKey: 'ncv' };
    default: return { prefijo: 'AUTO', unidad: 'V', modoKey: 'libre' };
  }
}

/**
 * Procesa la trama binaria recibida en event.data desde el listener de WebHID.
 */
export function procesarTramaUT61EPlus(dataView) {
  try {
    const raw = new Uint8Array(dataView.buffer || dataView);
    if (!raw || raw.length < 14) return null;

    let offset = 0;
    if (raw[0] === 0x00 && raw.length > 14) offset = 1;

    // Buscar cabecera 0xAB, 0xCD
    let syncIdx = -1;
    for (let i = offset; i <= raw.length - 14; i++) {
      if (raw[i] === 0xAB && raw[i + 1] === 0xCD) {
        syncIdx = i;
        break;
      }
    }

    if (syncIdx !== -1 && syncIdx + 11 < raw.length) {
      const modoByte = raw[syncIdx + 3];
      const rangoByte = raw[syncIdx + 4];

      // Extraer 7 caracteres LCD (bytes syncIdx+5 a syncIdx+11)
      let displayStr = '';
      for (let j = syncIdx + 5; j <= syncIdx + 11; j++) {
        const b = raw[j];
        if (b >= 32 && b <= 126) displayStr += String.fromCharCode(b);
      }
      displayStr = displayStr.trim();

      let valStr = displayStr;
      if (displayStr.toUpperCase().includes('OL') || displayStr.includes('?0')) {
        valStr = 'OL';
      } else {
        const m = displayStr.replace(/ /g, '').match(/[-+]?\d+\.?\d*/);
        if (m) valStr = m[0];
      }

      const { prefijo, unidad, modoKey } = decodificarPerillaUT61EPlus(modoByte, rangoByte);
      return { prefijo, valor: valStr, unidad, modoKey };
    }

    return null;
  } catch (err) {
    console.error('Error procesando trama UT61E+:', err);
    return null;
  }
}

/**
 * Envía un comando de botón físico al multímetro UT61E+ vía WebHID.
 */
export async function enviarComandoDMM(device, tipoBoton) {
  const MAPA_CMD = {
    SELECT: 0x4C,
    RANGE:  0x46,
    AUTO:   0x47,
    HZ:     0x49,
    REL:    0x48,
    HOLD:   0x4A,
    PEAK:   0x4B
  };

  const codigo = MAPA_CMD[tipoBoton];
  if (!codigo || !device || !device.opened) return false;

  const chkSum = (0xAB + 0xCD + 0x03 + codigo) & 0xFFFF;
  const hi = (chkSum >> 8) & 0xFF;
  const lo = chkSum & 0xFF;

  const paquete = new Uint8Array(64);
  paquete.set([0x06, 0xAB, 0xCD, 0x03, codigo, hi, lo]);

  try {
    await device.sendReport(0x00, paquete);
    return true;
  } catch (err) {
    console.warn('Error al enviar comando WebHID:', err);
    return false;
  }
}
```

---

## 7. Ventajas de la Arquitectura Directa

1. **Eliminación Total de la Desincronización Manual:** El técnico no necesita tocar la pantalla para indicarle al software que cambió a medición de diodos o continuidad; al mover la perilla o presionar `SELECT`, la aplicación se actualiza en tiempo real.
2. **Compatibilidad Inmediata con Golden Values en FPC:** Al medir líneas de conectores FPC, la base de datos compara automáticamente la caída de tensión en diodo porque `modoKey === 'diodo'` se activa por hardware.
3. **Máximo Espacio en Pantalla:** Al sustituir la hilera de botones estáticos por la botonera física interactiva (`SELECT`, `RANGE`, etc.) y agrupar los controles auxiliares en el menú colapsable `⚙ CONTROLES`, los dígitos LCD crecen hasta el doble de su tamaño original, ofreciendo una lectura inmejorable para streaming y trabajo de laboratorio.
