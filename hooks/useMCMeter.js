import { useState, useRef, useEffect, useCallback } from 'react';

// VID y PID oficiales del KM003C (Marshall MC-Meter Pro)
export const MC_METER_VID = 0x5FC9;
export const MC_METER_PID = 0x0063;

/**
 * Filtro de mediana de 3 muestras:
 * Elimina picos espurios de 1 muestra de ruido ADC sin introducir retraso en la señal.
 */
function mediana3(a, b, c) {
  if ((a - b) * (c - a) >= 0) return a;
  if ((b - a) * (c - b) >= 0) return b;
  return c;
}

/**
 * Buffer circular de alto rendimiento en memoria para hasta 60,000 muestras.
 */
class CircularBuffer {
  constructor(maxSize = 60000) {
    this.maxSize = maxSize;
    this.buffer = new Array(maxSize);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  push(item) {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.maxSize;
    if (this.size < this.maxSize) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.maxSize;
    }
  }

  clear() {
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  toArray() {
    if (this.size === 0) return [];
    const result = new Array(this.size);
    for (let i = 0; i < this.size; i++) {
      result[i] = this.buffer[(this.head + i) % this.maxSize];
    }
    return result;
  }

  slice(start, end) {
    if (this.size === 0) return [];
    const len = this.size;
    let s = start < 0 ? Math.max(0, len + start) : Math.min(len, start);
    let e = end === undefined ? len : (end < 0 ? Math.max(0, len + end) : Math.min(len, end));
    if (s >= e) return [];
    const count = e - s;
    const result = new Array(count);
    for (let i = 0; i < count; i++) {
      result[i] = this.buffer[(this.head + s + i) % this.maxSize];
    }
    return result;
  }

  getLast(count) {
    if (this.size === 0 || count <= 0) return [];
    const actualCount = Math.min(this.size, count);
    const startIdx = this.size - actualCount;
    return this.slice(startIdx, this.size);
  }
}

/**
 * Hook maestro 100% nativo WebHID para el Marshall MC-Meter Pro (KM003C).
 */
export function useMCMeter() {
  const [conectado, setConectado] = useState(false);
  const [sps, setSps] = useState('-- SPS');
  const [vbus, setVbus] = useState(0.0);
  const [ibus, setIbus] = useState(0.0);
  const [watts, setWatts] = useState(0.0);
  const [peakIbus, setPeakIbus] = useState(0.0);
  const [dp, setDp] = useState(0.0);
  const [dm, setDm] = useState(0.0);
  const [cc1, setCc1] = useState(0.0);
  const [cc2, setCc2] = useState(0.0);
  const [tick, setTick] = useState(0);

  // Estados de control de análisis
  const [pausado, setPausado] = useState(false);
  const [autoTriggerArmed, setAutoTriggerArmed] = useState(false);
  const [triggerThreshold, setTriggerThreshold] = useState(0.015); // 15mA

  // Referencias internas inmutables
  const deviceRef = useRef(null);
  const seqIdRef = useRef(0);
  const isPollingRef = useRef(false);
  const keepRunningRef = useRef(false);
  const sessionStartTRef = useRef(performance.now());
  const pausadoRef = useRef(pausado);
  pausadoRef.current = pausado;

  const autoTriggerArmedRef = useRef(autoTriggerArmed);
  autoTriggerArmedRef.current = autoTriggerArmed;

  // Buffer circular de 60,000 muestras
  const historyBufferRef = useRef(new CircularBuffer(60000));
  // Mini buffer de 180 muestras para mini sparklines
  const miniVbusRef = useRef(new Array(180).fill(0));
  const miniIbusRef = useRef(new Array(180).fill(0));

  // Filtro de mediana (últimas 3 muestras)
  const bufVRef = useRef([0.0, 0.0, 0.0]);
  const bufIRef = useRef([0.0, 0.0, 0.0]);
  const sampleCountRef = useRef(0);

  // Auto-detección de SPS
  const lastAdcBlockRef = useRef(null);
  const adcChangesInSecRef = useRef(0);
  const lastSpsCalcTRef = useRef(performance.now());
  const peakIbusRef = useRef(0.0);

  // Snapshot congelado al pausar
  const pausedSnapshotRef = useRef([]);

  /**
   * Envía un paquete de polling HID de 65 bytes:
   * Report ID 0x00 + [0x0C, seq_id, 0x02, 0x00] + 60 bytes de 0x00
   */
  const enviarPoll = useCallback(async () => {
    const dev = deviceRef.current;
    if (!dev || !dev.opened || !keepRunningRef.current) return;
    try {
      seqIdRef.current = (seqIdRef.current + 1) & 0xff;
      const payload = new Uint8Array(64);
      payload[0] = 0x0c;
      payload[1] = seqIdRef.current;
      payload[2] = 0x02;
      payload[3] = 0x00;
      // Los bytes restantes 4..63 quedan en 0x00

      // En WebHID, sendReport toma (reportId, dataUint8Array)
      await dev.sendReport(0x00, payload);
    } catch (err) {
      // Ignorar fallos transitorios durante desconexión
    }
  }, []);

  /**
   * Decodificador de trama de respuesta de 64 bytes (Little-Endian)
   */
  const handleInputReport = useCallback((event) => {
    const { data } = event; // data es un DataView con el payload recibido
    if (!data || data.byteLength < 42) return;

    try {
      // Bytes 8..11 (int32): VBUS instantáneo en microvoltios (uV)
      const vbusUv = data.getInt32(8, true);
      // Bytes 12..15 (int32): IBUS instantáneo en microamperios (uA)
      const ibusUa = data.getInt32(12, true);

      // Bytes 34..41 (4 x uint16): CC1, CC2, D+, D- en décimas de milivoltio (0.1 mV)
      const cc1Raw = data.getUint16(34, true);
      const cc2Raw = data.getUint16(36, true);
      const dpRaw = data.getUint16(38, true);
      const dmRaw = data.getUint16(40, true);

      const vRaw = Math.abs(vbusUv) / 1000000.0;
      const iRaw = Math.abs(ibusUa) / 1000000.0;
      const cc1Val = cc1Raw / 10000.0;
      const cc2Val = cc2Raw / 10000.0;
      const dpVal = dpRaw / 10000.0;
      const dmVal = dmRaw / 10000.0;

      // Detección de SPS contando cambios en bytes 8..15
      const b0 = data.getUint32(8, true);
      const b1 = data.getUint32(12, true);
      const bloqueActual = `${b0}_${b1}`;

      if (bloqueActual !== lastAdcBlockRef.current) {
        adcChangesInSecRef.current++;
        lastAdcBlockRef.current = bloqueActual;

        // Filtro de mediana de 3 muestras
        bufVRef.current.push(vRaw);
        if (bufVRef.current.length > 3) bufVRef.current.shift();
        bufIRef.current.push(iRaw);
        if (bufIRef.current.length > 3) bufIRef.current.shift();
        sampleCountRef.current++;

        const vFiltrado =
          sampleCountRef.current >= 3
            ? mediana3(bufVRef.current[0], bufVRef.current[1], bufVRef.current[2])
            : vRaw;
        const iFiltrado =
          sampleCountRef.current >= 3
            ? mediana3(bufIRef.current[0], bufIRef.current[1], bufIRef.current[2])
            : iRaw;

        // Auto-Trigger por corriente (>15 mA)
        if (autoTriggerArmedRef.current && iRaw >= triggerThreshold) {
          setAutoTriggerArmed(false);
          setPausado(false);
          historyBufferRef.current.clear();
          sessionStartTRef.current = performance.now();
        }

        const tRel = (performance.now() - sessionStartTRef.current) / 1000.0;

        // Almacenar en el buffer de 60,000 muestras
        historyBufferRef.current.push([tRel, vFiltrado, iFiltrado, dpVal, dmVal, cc1Val, cc2Val]);

        // Actualizar mini-buffer
        if (!pausadoRef.current) {
          miniVbusRef.current.push(vFiltrado);
          if (miniVbusRef.current.length > 180) miniVbusRef.current.shift();
          miniIbusRef.current.push(iFiltrado);
          if (miniIbusRef.current.length > 180) miniIbusRef.current.shift();
        }

        if (iRaw > peakIbusRef.current) {
          peakIbusRef.current = iRaw;
          setPeakIbus(iRaw);
        }

        // Actualizar estados reactivos
        setVbus(vRaw);
        setIbus(iRaw);
        setWatts(vRaw * iRaw);
        setDp(dpVal);
        setDm(dmVal);
        setCc1(cc1Val);
        setCc2(cc2Val);
        setTick((prev) => (prev + 1) & 0x7fffffff);
      }

      // Cálculo de frecuencia de muestreo (SPS) cada 1 segundo
      const now = performance.now();
      if (now - lastSpsCalcTRef.current >= 1000.0) {
        const c = adcChangesInSecRef.current;
        let etiqueta = '-- SPS';
        if (c <= 5) etiqueta = '2 SPS';
        else if (c <= 16) etiqueta = '10 SPS';
        else if (c <= 110) etiqueta = '50 SPS';
        else etiqueta = '1Ksps';

        setSps(etiqueta);
        adcChangesInSecRef.current = 0;
        lastSpsCalcTRef.current = now;
      }
    } catch (e) {
      console.error('Error al decodificar reporte MC-Meter:', e);
    }

    // Chain-polling de máxima velocidad:
    // Al recibir la respuesta, disparar inmediatamente el siguiente polling
    if (keepRunningRef.current) {
      enviarPoll();
    }
  }, [enviarPoll, triggerThreshold]);

  /**
   * Conectar con el dispositivo WebHID
   */
  const conectar = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.hid) {
      alert('Tu navegador no soporta la WebHID API. Por favor usa Google Chrome, Microsoft Edge o Brave.');
      return false;
    }

    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: MC_METER_VID, productId: MC_METER_PID }]
      });

      if (!devices || devices.length === 0) return false;

      // Buscar el dispositivo correspondiente a la interfaz 3 (MI_03)
      let targetDev = devices[0];
      for (const d of devices) {
        // En dispositivos compuestos en WebHID, collections incluye los reportes
        const hasReport = d.collections?.some((c) =>
          c.outputReports?.some((r) => r.reportId === 0 || r.items) ||
          c.inputReports?.some((r) => r.reportId === 0 || r.items)
        );
        if (hasReport) {
          targetDev = d;
          break;
        }
      }

      if (!targetDev.opened) {
        await targetDev.open();
      }

      targetDev.addEventListener('inputreport', handleInputReport);

      deviceRef.current = targetDev;
      keepRunningRef.current = true;
      sessionStartTRef.current = performance.now();
      lastSpsCalcTRef.current = performance.now();
      adcChangesInSecRef.current = 0;
      peakIbusRef.current = 0.0;

      setConectado(true);

      // Iniciar el ciclo de polling continuo
      enviarPoll();

      // Watchdog para reconexión de polling si un paquete se pierde
      if (!isPollingRef.current) {
        isPollingRef.current = true;
        const watchdog = setInterval(() => {
          if (!keepRunningRef.current || !deviceRef.current || !deviceRef.current.opened) {
            clearInterval(watchdog);
            isPollingRef.current = false;
            return;
          }
          // Si hace más de 120ms no hay cambio, reactivar polling
          enviarPoll();
        }, 80);
      }

      return true;
    } catch (err) {
      console.error('Error al conectar con Marshall MC-Meter Pro:', err);
      alert(`No se pudo conectar con el Marshall MC-Meter Pro: ${err.message || err}`);
      setConectado(false);
      return false;
    }
  }, [handleInputReport, enviarPoll]);

  /**
   * Desconectar dispositivo
   */
  const desconectar = useCallback(async () => {
    keepRunningRef.current = false;
    if (deviceRef.current) {
      try {
        deviceRef.current.removeEventListener('inputreport', handleInputReport);
        if (deviceRef.current.opened) {
          await deviceRef.current.close();
        }
      } catch (e) {
        // Ignorar
      }
      deviceRef.current = null;
    }
    setConectado(false);
    setSps('-- SPS');
    setVbus(0.0);
    setIbus(0.0);
    setWatts(0.0);
    setDp(0.0);
    setDm(0.0);
    setCc1(0.0);
    setCc2(0.0);
  }, [handleInputReport]);

  /**
   * Pausar o reanudar análisis
   */
  const togglePausa = useCallback(() => {
    setPausado((prev) => {
      const nuevo = !prev;
      if (nuevo) {
        // Congelar instantánea completa del buffer
        pausedSnapshotRef.current = historyBufferRef.current.toArray();
      } else {
        pausedSnapshotRef.current = [];
      }
      return nuevo;
    });
  }, []);

  /**
   * Limpiar historial completo
   */
  const limpiarHistorial = useCallback(() => {
    historyBufferRef.current.clear();
    pausedSnapshotRef.current = [];
    miniVbusRef.current = new Array(180).fill(0);
    miniIbusRef.current = new Array(180).fill(0);
    peakIbusRef.current = 0.0;
    setPeakIbus(0.0);
    sessionStartTRef.current = performance.now();
  }, []);

  /**
   * Restablecer pico de corriente
   */
  const resetPeak = useCallback(() => {
    peakIbusRef.current = 0.0;
    setPeakIbus(0.0);
  }, []);

  /**
   * Alternar Auto-Trigger (>15 mA)
   */
  const toggleAutoTrigger = useCallback(() => {
    setAutoTriggerArmed((prev) => {
      const nuevo = !prev;
      if (nuevo) {
        setPausado(true);
        pausedSnapshotRef.current = [];
      } else {
        setPausado(false);
      }
      return nuevo;
    });
  }, []);

  // Limpieza al desmontar el hook
  useEffect(() => {
    return () => {
      desconectar();
    };
  }, [desconectar]);

  return {
    // Estados principales
    conectado,
    sps,
    vbus,
    ibus,
    watts,
    peakIbus,
    dp,
    dm,
    cc1,
    cc2,
    tick,

    // Estados de control
    pausado,
    autoTriggerArmed,
    triggerThreshold,
    setTriggerThreshold,

    // Buffers de alta resolución
    historyBufferRef,
    pausedSnapshotRef,
    miniVbusRef,
    miniIbusRef,

    // Métodos de acción
    conectar,
    desconectar,
    togglePausa,
    limpiarHistorial,
    resetPeak,
    toggleAutoTrigger
  };
}
