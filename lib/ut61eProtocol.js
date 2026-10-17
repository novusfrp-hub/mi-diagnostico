/**
 * Protocolo de Comunicación y Decodificación de Hardware para UNI-T UT61E+ vía WebHID.
 * Portado fielmente del firmware/script de hardware (WCH CH9325 PID 0xE429).
 */

export const MAPA_COMANDOS_DMM = {
  SELECT: 0x4C, // Rotar Ω -> Cont 🔊 -> Diodo ▶| -> Cap ⊣⊢ / DC <-> AC
  RANGE:  0x46, // Rango manual
  AUTO:   0x47, // Volver a rango AUTO
  HZ:     0x49, // Frecuencia Hz / Duty %
  REL:    0x48, // Modo Relativo (Delta Δ)
  HOLD:   0x4A, // Hold / Luz de pantalla
  PEAK:   0x4B  // MAX / MIN / PEAK
};

export function decodificarPerillaUT61EPlus(modoByte, rangoByte) {
  const r = (rangoByte >= 0x30 && rangoByte <= 0x39) ? (rangoByte - 0x30) : 0;

  switch (modoByte) {
    case 0x00: return { prefijo: 'AC', unidad: 'V', modoKey: 'voltio', label: 'AC V' };
    case 0x01: return { prefijo: 'AC', unidad: 'mV', modoKey: 'voltio', label: 'AC mV' };
    case 0x02: return { prefijo: 'DC', unidad: 'V', modoKey: 'voltio', label: 'DC V' };
    case 0x03: return { prefijo: 'DC', unidad: 'mV', modoKey: 'voltio', label: 'DC mV' };
    case 0x04: {
      const u = r <= 1 ? 'Hz' : (r <= 4 ? 'kHz' : 'MHz');
      return { prefijo: 'FREQ', unidad: u, modoKey: 'frecuencia', label: `FREQ ${u}` };
    }
    case 0x05: return { prefijo: 'DUTY', unidad: '%', modoKey: 'duty', label: 'DUTY %' };
    case 0x06: {
      const u = r === 0 ? 'Ω' : (r <= 3 ? 'kΩ' : 'MΩ');
      return { prefijo: 'OHM', unidad: u, modoKey: 'ohmio', label: `OHM ${u}` };
    }
    case 0x07: return { prefijo: 'CONT 🔊', unidad: 'Ω', modoKey: 'continuidad', label: 'CONT 🔊' };
    case 0x08: return { prefijo: 'DIOD ▶|', unidad: 'V', modoKey: 'diodo', label: 'DIOD ▶|' };
    case 0x09: {
      const u = r <= 2 ? 'nF' : (r <= 5 ? 'µF' : 'mF');
      return { prefijo: 'CAP ⊣⊢', unidad: u, modoKey: 'capacitancia', label: `CAP ${u}` };
    }
    case 0x0A:
    case 0x0B:
    case 0x12: return { prefijo: 'hFE', unidad: 'β', modoKey: 'hfe', label: 'hFE β' };
    case 0x0C: return { prefijo: 'DC', unidad: 'µA', modoKey: 'ua', label: 'DC µA' };
    case 0x0D: return { prefijo: 'AC', unidad: 'µA', modoKey: 'ua', label: 'AC µA' };
    case 0x0E: return { prefijo: 'DC', unidad: 'mA', modoKey: 'ma', label: 'DC mA' };
    case 0x0F: return { prefijo: 'AC', unidad: 'mA', modoKey: 'ma', label: 'AC mA' };
    case 0x10: return { prefijo: 'DC', unidad: 'A', modoKey: 'amperio', label: 'DC A' };
    case 0x11: return { prefijo: 'AC', unidad: 'A', modoKey: 'amperio', label: 'AC A' };
    case 0x13:
    case 0x14: return { prefijo: 'LPF AC', unidad: 'V', modoKey: 'voltio', label: 'LPF AC V' };
    case 0x15:
    case 0x16:
    case 0x17:
    case 0x18:
    case 0x19: return { prefijo: 'AC+DC', unidad: 'V', modoKey: 'voltio', label: 'AC+DC V' };
    case 0x1A: return { prefijo: 'NCV', unidad: '---', modoKey: 'ncv', label: 'NCV' };
    default: return { prefijo: 'AUTO', unidad: 'V', modoKey: 'libre', label: 'AUTO V' };
  }
}

export function procesarTramaUT61EPlus(dataView) {
  try {
    const raw = dataView instanceof Uint8Array ? dataView : new Uint8Array(dataView.buffer || dataView);
    if (!raw || raw.length < 14) return null;

    let offset = 0;
    if (raw[0] === 0x00 && raw.length > 14) offset = 1;

    let syncIdx = -1;
    for (let i = offset; i <= raw.length - 14; i++) {
      if (raw[i] === 0xAB && raw[i + 1] === 0xCD) {
        syncIdx = i;
        break;
      }
    }

    if (syncIdx !== -1 && syncIdx + 13 < raw.length) {
      const modoByte = raw[syncIdx + 2];
      const rangoByte = raw[syncIdx + 3];

      let displayStr = '';
      for (let j = syncIdx + 4; j <= syncIdx + 10; j++) {
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

      const { prefijo, unidad, modoKey, label } = decodificarPerillaUT61EPlus(modoByte, rangoByte);
      return { prefijo, valor: valStr, unidad, modoKey, label };
    }

    return null;
  } catch (err) {
    console.error('Error al procesar trama UT61E+:', err);
    return null;
  }
}

export async function enviarComandoDMM(device, tipoBoton) {
  const codigo = MAPA_COMANDOS_DMM[tipoBoton];
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
    try {
      const paqueteCorto = new Uint8Array([0x06, 0xAB, 0xCD, 0x03, codigo, hi, lo]);
      await device.sendReport(0x00, paqueteCorto);
      return true;
    } catch (e2) {
      console.warn('Error al enviar comando WebHID al DMM:', e2);
      return false;
    }
  }
}
