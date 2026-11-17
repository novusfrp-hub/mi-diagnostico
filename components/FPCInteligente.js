import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Save, Cloud, CloudOff, Check, AlertCircle, Shield, Zap, Radio,
  Activity, Cpu, Tag, RotateCcw, Filter, Eye, AlertTriangle,
  CheckCircle2, Lock, Unlock, Edit3, Plus, Trash2, ArrowRightLeft,
  Download, HelpCircle, Printer, FileText, Share2, Copy, X
} from 'lucide-react';
import SelectorTipoLinea, { CATEGORIAS_LINEAS } from './SelectorTipoLinea.js';

// --- CATÁLOGO DE CATEGORÍAS Y COLORES OFICIALES ---
export const CATEGORIAS_FPC = {
  alimentacion: { id: 'alimentacion', label: 'Alimentación (Voltajes / Power)', color: '#ef4444', text: '#ffffff' },
  actuadores: { id: 'actuadores', label: 'Salidas de Potencia / Actuador', color: '#f97316', text: '#ffffff' },
  comunicacion: { id: 'comunicacion', label: 'Comunicación (Buses / Protocolos)', color: '#6366f1', text: '#ffffff' },
  sensado: { id: 'sensado', label: 'Sensado (Térmico / ADC / Sensores)', color: '#06b6d4', text: '#000000' },
  control: { id: 'control', label: 'Control & Sincronización', color: '#10b981', text: '#ffffff' },
  tierra: { id: 'tierra', label: 'Tierra / Neutro (GND / NC)', color: '#4b5563', text: '#ffffff' },
  generico: { id: 'generico', label: 'Pin Genérico (Sin Asignar)', color: '#eab308', text: '#000000' },
  custom: { id: 'custom', label: 'Personalizada', color: '#8b5cf6', text: '#ffffff' }
};

// Helper para verificar si un pin o línea sigue teniendo nombre genérico por defecto
export const esNombreGenerico = (nombre = '') => {
  if (!nombre) return true;
  const n = String(nombre).trim();
  return /^(LINEA_\d+|PIN_\d+|PIN\s*\d+|PAD_\d+|PIN$)/i.test(n) || n.toUpperCase() === 'DATA';
};

// Detección automática de categoría según el nombre de la señal
export const deducirCategoriaNet = (nombre = '') => {
  const n = String(nombre).toUpperCase().trim();
  if (!n || esNombreGenerico(n)) return 'generico';

  // 1. TIERRA Y NEUTRO
  if (n === 'GND' || n === 'GROUND' || n.endsWith('_GND') || n.startsWith('GND_') || n === 'AGND' || n === 'PGND') {
    return 'tierra';
  }
  if (n === 'NC' || n === 'NO_CONNECT' || n.startsWith('NC_')) {
    return 'tierra';
  }

  // 2. Coincidencia directa con catálogo oficial de líneas
  if (typeof CATEGORIAS_LINEAS !== 'undefined' && CATEGORIAS_LINEAS) {
    for (const [catKey, catVal] of Object.entries(CATEGORIAS_LINEAS)) {
      if (catVal.items && catVal.items.includes(n)) {
        return catKey;
      }
    }
  }

  // 3. SALIDAS DE POTENCIA / ACTUADOR (Audio, Parlantes, Auricular, Haptics, Vibrador)
  if (
    /(SPKR|SPEAKER|SPK_|RCV|EAR|LINE_OUT|HP_L|HP_R|HAP_OUT|HAPTIC|VIB|MOTOR|BUZZER|AU_VOUT)/i.test(n)
  ) {
    return 'actuadores';
  }

  // 4. ALIMENTACIÓN (Voltajes, Power, Batería, LDOs, Rails, Backlight)
  if (
    /(LEDA|LED_A|LEDK|LED_K|ANODE|ANODO|CATODO|CATHODE|VBOOST|BOOST|VBAT|VPH|VDD|VBUS|VREG|VCC|CHARGER|CHG|BATT|VLED|AVDD|ELVDD|ELVSS|VSP|VSN|VIO|VBIAS|MICBIAS|MIC_BIAS|VFE|HV_|PP_|_PWR|POWER|VOLT|VOUT|VIN)/i.test(n)
  ) {
    return 'alimentacion';
  }

  // 5. SENSADO / TÉRMICO / ADC / ID
  if (
    /(THERM|TEMP|SENSE|ISENSE|CSENSE|_ADC$|ADC_|JACK_DET|EAR_DET|BOARD_ID|NTC|BATT_NTC|^ID$|_ID$|BATT_ID|BATT_DET|CELL_BAL|SAR_|ANT_ID)/i.test(n)
  ) {
    return 'sensado';
  }

  // 6. CONTROL Y SINCRONIZACIÓN (Relojes, Enables, Reset, Botones, Interrupciones)
  if (
    /(RESET|RST|ENABLE|_EN$|^EN_|INT|IRQ|CLK|CLOCK|PWM|POWER_KEY|VOL_UP|VOL_DOWN|HOLD|SYNC|EINT|CABC|MATCH|DSI_TE|_TE$)/i.test(n)
  ) {
    return 'control';
  }

  // 7. COMUNICACIÓN (Datos, Protocolos, Buses diferenciales)
  if (
    /(I2C|SPI|UART|USB|MIPI|DSI|CSI|RFFE|SWI|BPI|SDA|SCL|MOSI|MISO|DP|DN|TX|RX|CAN|BUS)/i.test(n)
  ) {
    return 'comunicacion';
  }

  return 'generico';
};

export default function FPCInteligente({
  pines = [],
  setPines,
  pinActivo = 1,
  setPinActivo,
  modo = 'diagnostico',
  setModo,
  escala = 'diodo',
  lecturaEnVivo = '----',
  tiposCustom = [],
  setTiposCustom,
  onGuardar,
  cambiosPendientes = false,
  guardando = false,
  ultimaSincronizacion = null,
  onRegistrarOL,
  nombreFpc = 'FPC',
  fpcId = '',
  marca = '',
  modeloNombre = ''
}) {
  const [filtroSoloFallas, setFiltroSoloFallas] = useState(false);
  const [ayudaVisible, setAyudaVisible] = useState(false);
  const [modalReporteVisible, setModalReporteVisible] = useState(false);

  // --- AUDIO SINTETIZADO: PRE-AVISO DE TIERRA (GND) ---
  const reproducirAvisoGND = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      // Tono grave distintivo (320Hz bajando a 220Hz, inconfundible con el beep agudo)
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) { }
  };

  // Detectar cambio de pinActivo y avisar si el nuevo pin es GND
  const prevPinActivoRef = useRef(pinActivo);
  useEffect(() => {
    if (String(prevPinActivoRef.current) !== String(pinActivo)) {
      prevPinActivoRef.current = pinActivo;
      const pinObj = pines.find(p => String(p.id) === String(pinActivo));
      if (pinObj && (pinObj.tipo === 'GND' || pinObj.nombre === 'GND' || pinObj.valorSanoDiodo === '0.000' || pinObj.valorSano === '0.000')) {
        reproducirAvisoGND();
      }
    }
  }, [pinActivo, pines]);

  // --- HELPER DE AUTO-AVANCE AL SIGUIENTE PIN (SECUENCIA FÍSICA ESTRICTA) ---
  const avanzarPinActivo = () => {
    if (setPinActivo) {
      setPinActivo(prev => {
        const actual = Number(prev);
        return actual < pines.length ? actual + 1 : actual;
      });
    }
  };

  // --- PERSISTENCIA LOCAL DE LA SESIÓN DE DIAGNÓSTICO (INMUNE A APAGONES / 0 COSTO FIREBASE) ---
  const storageDiagKey = `sesion_diag_fpc_${fpcId || nombreFpc}`;

  // 1. Restaurar mediciones guardadas al montar en modo diagnóstico
  useEffect(() => {
    if (typeof window === 'undefined' || modo !== 'diagnostico') return;
    try {
      const guardado = localStorage.getItem(storageDiagKey);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (parsed && parsed.valores) {
          setPines(prev => prev.map(p => {
            const valsGuardados = parsed.valores[p.id];
            if (valsGuardados && (!p.valorActual || p.valorActual === '---')) {
              return { ...p, ...valsGuardados };
            }
            return p;
          }));
        }
      }
    } catch (e) { }
  }, [storageDiagKey, modo]);

  // 2. Guardar automáticamente cada medición tomada en modo diagnóstico
  useEffect(() => {
    if (typeof window === 'undefined' || modo !== 'diagnostico') return;
    const tieneMediciones = pines.some(p => p.valorActual && p.valorActual !== '---');
    if (tieneMediciones) {
      try {
        const mapa = {};
        pines.forEach(p => {
          if (p.valorActual && p.valorActual !== '---') {
            mapa[p.id] = {
              valorActual: p.valorActual,
              valorActualDiodo: p.valorActualDiodo,
              valorActualVoltio: p.valorActualVoltio,
              valorActualUa: p.valorActualUa,
              valorActualOhmio: p.valorActualOhmio,
              valorActualAmperio: p.valorActualAmperio
            };
          }
        });
        localStorage.setItem(storageDiagKey, JSON.stringify({
          valores: mapa,
          timestamp: Date.now(),
          nombreFpc,
          escala
        }));
      } catch (e) { }
    }
  }, [pines, modo, storageDiagKey, escala, nombreFpc]);

  const mitad = Math.ceil(pines.length / 2);
  const filaSup = pines.slice(0, mitad);
  const filaInf = pines.slice(mitad);

  // Helper para extraer valor sano según escala activa
  const obtenerValSano = (pin) => {
    if (!pin) return '---';
    if (escala === 'diodo') return pin.valorSanoDiodo !== undefined ? pin.valorSanoDiodo : pin.valorSano ?? '---';
    if (escala === 'ua') return pin.valorSanoUa ?? '---';
    if (escala === 'voltio') return pin.valorSanoVoltio ?? '---';
    if (escala === 'ohmio') return pin.valorSanoOhmio ?? '---';
    if (escala === 'amperio') return pin.valorSanoAmperio ?? '---';
    return pin.valorSano ?? '---';
  };

  // Helper para extraer valor medido actual según escala activa
  const obtenerValActual = (pin) => {
    if (!pin) return '---';
    if (escala === 'diodo') return pin.valorActualDiodo !== undefined ? pin.valorActualDiodo : pin.valorActual ?? '---';
    if (escala === 'ua') return pin.valorActualUa ?? '---';
    if (escala === 'voltio') return pin.valorActualVoltio ?? '---';
    if (escala === 'ohmio') return pin.valorActualOhmio ?? '---';
    if (escala === 'amperio') return pin.valorActualAmperio ?? '---';
    return pin.valorActual ?? '---';
  };

  // EVALUACIÓN DE SALUD DEL PIN
  const evaluarSaludPin = (pin) => {
    const vSanoStr = obtenerValSano(pin);
    const vActStr = obtenerValActual(pin);
    const cat = pin.categoria || deducirCategoriaNet(pin.nombre || pin.tipo);
    const esPinActivo = String(pinActivo) === String(pin.id);

    // --- MODO 1: GRABAR / CALIBRAR REFERENCIA (PLACA BUENA) ---
    // En este modo mostramos la placa sana. ¡NO hay detección de cortos!
    if (modo === 'crear') {
      let bg = pin.colorCustom || CATEGORIAS_FPC[cat]?.color || '#d4af37';
      let text = CATEGORIAS_FPC[cat]?.text || '#000000';

      if (pin.tipo === 'GND') {
        bg = '#4b5563'; // Gris
        text = '#ffffff';
      } else if (pin.tipo === 'NC') {
        bg = '#1e3a8a'; // Azul navy
        text = '#93c5fd';
      } else if (vSanoStr === 'OL') {
        bg = '#ffffff'; // Blanco puro
        text = '#000000';
      }

      return {
        bg,
        text,
        border: esPinActivo ? '2px solid #00ffff' : '1px solid #222',
        estado: 'REFERENCIA',
        badge: 'Placa Buena (Ref)',
        delta: null
      };
    }

    // --- MODO 2: DIAGNÓSTICO (CONTRASTAR PLACA AVERIADA) ---
    // Si la placa en prueba aún no ha medido este pin:
    if (!vActStr || vActStr === '---') {
      const bgBase = pin.colorCustom || CATEGORIAS_FPC[cat]?.color || '#374151';
      return {
        bg: 'rgba(31, 41, 55, 0.65)',
        text: '#9ca3af',
        border: esPinActivo ? '2px solid #00ffff' : `1px dashed ${bgBase}`,
        estado: 'PENDIENTE',
        badge: '⚪ Pendiente',
        delta: '---'
      };
    }

    // Si la placa buena NO tiene valor de referencia registrado:
    if (!vSanoStr || vSanoStr === '---') {
      return {
        bg: '#374151',
        text: '#cbd5e1',
        border: esPinActivo ? '2px solid #00ffff' : '1px solid #4b5563',
        estado: 'SIN_REF',
        badge: '⚪ Sin Referencia',
        delta: '---'
      };
    }

    const vActNum = parseFloat(vActStr);
    const vSanoNum = parseFloat(vSanoStr);

    // CASO 1: En la placa buena este pin era GND (o medía 0V)
    const esGndReferencia = pin.tipo === 'GND' || vSanoStr === '0.000' || (!isNaN(vSanoNum) && vSanoNum < 0.050);
    if (esGndReferencia) {
      if (vActStr === '0.000' || (!isNaN(vActNum) && vActNum < 0.050)) {
        return {
          bg: '#10b981',
          text: '#ffffff',
          border: '1px solid #059669',
          estado: 'OK',
          badge: '🟢 GND Normal',
          delta: '0.000 V'
        };
      } else {
        return {
          bg: '#ef4444',
          text: '#ffffff',
          border: '1px solid #b91c1c',
          estado: 'FALLA',
          badge: '🔴 Tierra Desoldada / Fuga',
          delta: `+${vActStr}`
        };
      }
    }

    // CASO 2: En la placa buena este pin era NC o OL
    const esNcReferencia = pin.tipo === 'NC' || vSanoStr === 'OL';
    if (esNcReferencia) {
      if (vActStr === 'OL') {
        return {
          bg: '#ffffff',
          text: '#000000',
          border: '1px solid #cbd5e1',
          estado: 'OK',
          badge: '⚪ OL Normal (Abierto)',
          delta: 'OL'
        };
      } else {
        return {
          bg: '#ef4444',
          text: '#ffffff',
          border: '1px solid #b91c1c',
          estado: 'FALLA',
          badge: '🔴 Fuga Anómala en NC',
          delta: vActStr
        };
      }
    }

    // CASO 3: Línea activa normal con valor en la placa sana (ej. 0.450V)
    // A) Si la averiada marca OL inesperadamente:
    if (vActStr === 'OL') {
      return {
        bg: '#ffffff',
        text: '#ef4444',
        border: '2px solid #ef4444',
        estado: 'FALLA',
        badge: '🟠 Línea Abierta (OL Inesperado)',
        delta: 'OL vs ' + vSanoStr
      };
    }

    // B) Si la averiada cayó a corto (<0.050V) cuando la sana NO era tierra:
    if (escala === 'diodo' && vActNum < 0.050) {
      return {
        bg: '#ef4444',
        text: '#ffffff',
        border: '1px solid #b91c1c',
        estado: 'FALLA',
        badge: '🔴 Corto a Tierra (<50mV)',
        delta: `${(vActNum - vSanoNum).toFixed(3)} V`
      };
    }

    // C) Diferencia por escala y tolerancia
    let estaEnTolerancia = false;
    let deltaTexto = '---';

    if (!isNaN(vActNum) && !isNaN(vSanoNum)) {
      const diff = Math.abs(vActNum - vSanoNum);
      const sign = vActNum >= vSanoNum ? '+' : '-';
      if (escala === 'diodo') {
        estaEnTolerancia = diff <= 0.040;
        deltaTexto = `${sign}${diff.toFixed(3)} V`;
      } else if (escala === 'ua') {
        estaEnTolerancia = diff <= 50;
        deltaTexto = `${sign}${diff.toFixed(0)} uA`;
      } else if (escala === 'voltio') {
        estaEnTolerancia = diff <= 0.10;
        deltaTexto = `${sign}${diff.toFixed(2)} V`;
      } else if (escala === 'ohmio') {
        estaEnTolerancia = diff <= 5.0 || (vSanoNum > 0 && (diff / vSanoNum) <= 0.10);
        deltaTexto = `${sign}${diff.toFixed(1)} Ω`;
      } else if (escala === 'amperio') {
        estaEnTolerancia = diff <= 0.05;
        deltaTexto = `${sign}${diff.toFixed(3)} A`;
      }
    }

    if (estaEnTolerancia) {
      return {
        bg: '#10b981',
        text: '#ffffff',
        border: '1px solid #059669',
        estado: 'OK',
        badge: '🟢 Valor Normal',
        delta: deltaTexto
      };
    }

    return {
      bg: '#eab308',
      text: '#000000',
      border: '1px solid #ca8a04',
      estado: 'ALTERADO',
      badge: '🟡 Fuga / Fuera de Tolerancia',
      delta: deltaTexto
    };
  };

  const formNum = (val, tipo) => {
    if (tipo === 'GND') return 'GND';
    if (tipo === 'NC') return 'NC';
    if (!val || val === '---') return '';
    if (val === 'OL') return 'OL';
    return val.startsWith('0.') ? val.substring(1) : val;
  };

  // EDICIÓN MANUAL DEL VALOR DE REFERENCIA
  const actualizarValorReferenciaManual = (nuevoValor) => {
    const valLimpio = nuevoValor.trim();
    setPines(prev => prev.map(p => {
      if (String(p.id) === String(pinActivo)) {
        return {
          ...p,
          valorSano: valLimpio || '---',
          valorSanoDiodo: escala === 'diodo' ? (valLimpio || '---') : p.valorSanoDiodo,
          valorSanoUa: escala === 'ua' ? (valLimpio || '---') : p.valorSanoUa,
          valorSanoVoltio: escala === 'voltio' ? (valLimpio || '---') : p.valorSanoVoltio,
          valorSanoOhmio: escala === 'ohmio' ? (valLimpio || '---') : p.valorSanoOhmio,
          valorSanoAmperio: escala === 'amperio' ? (valLimpio || '---') : p.valorSanoAmperio
        };
      }
      return p;
    }));
  };

  // ACCIONES RÁPIDAS DE 1-CLICK PARA LA PLACA BUENA
  const aplicarTipoRapido = (tipoDestino) => {
    const cat = (tipoDestino === 'GND' || tipoDestino === 'NC') ? 'tierra'
      : tipoDestino === 'VCC' || tipoDestino === 'PWR' ? 'alimentacion'
      : tipoDestino === 'ACT' ? 'actuadores'
      : 'generico';

    setPines(prev => prev.map(p => {
      if (String(p.id) === String(pinActivo)) {
        const mod = {
          ...p,
          tipo: tipoDestino === 'VCC' ? 'PWR' : tipoDestino,
          categoria: cat,
          nombre: (tipoDestino === 'GND' || tipoDestino === 'NC') ? tipoDestino : (tipoDestino === 'PIN' ? `Pin_${p.id}` : p.nombre)
        };
        if (tipoDestino === 'GND') {
          mod.colorCustom = '#4b5563';
          mod.valorSano = '0.000';
          mod.valorSanoDiodo = '0.000';
        } else if (tipoDestino === 'NC') {
          mod.colorCustom = '#1e3a8a';
          mod.valorSano = 'OL';
          mod.valorSanoDiodo = 'OL';
        } else if (tipoDestino === 'VCC' || tipoDestino === 'PWR') {
          mod.colorCustom = '#ef4444';
        } else if (tipoDestino === 'ACT') {
          mod.colorCustom = '#f97316';
        } else if (tipoDestino === 'PIN') {
          mod.colorCustom = '#eab308';
        }
        return mod;
      }
      return p;
    }));
    avanzarPinActivo();
  };

  const manejarCambioNombre = (nuevoNombre) => {
    const nombreLimpio = nuevoNombre.replace(/\s+/g, '_');
    const catDeducida = deducirCategoriaNet(nombreLimpio);
    const colorAuto = CATEGORIAS_FPC[catDeducida]?.color || '#eab308';

    setPines(prev => prev.map(p => {
      if (String(p.id) === String(pinActivo)) {
        return {
          ...p,
          nombre: nombreLimpio,
          categoria: catDeducida,
          colorCustom: colorAuto,
          tipo: catDeducida === 'tierra' ? (nombreLimpio.toUpperCase().includes('NC') ? 'NC' : 'GND') : (esNombreGenerico(nombreLimpio) ? 'PIN' : p.tipo)
        };
      }
      return p;
    }));
  };

  // RESCATE INTELIGENTE: Promover mediciones de 'En Prueba' a 'Placa Buena de Referencia'
  const transferirEnPruebaAReferencia = () => {
    const pinesConLectura = pines.filter(p => {
      const v = obtenerValActual(p);
      return v && v !== '---';
    });

    if (pinesConLectura.length === 0) {
      alert('No se encontraron mediciones registradas en prueba para transferir.');
      return;
    }

    if (!window.confirm(
      `Se encontraron ${pinesConLectura.length} pines medidos en prueba.\n\n` +
      `¿Deseas transferir estas mediciones como los valores oficiales de la PLACA BUENA (Referencia)?\n\n` +
      `• Los pines con 0.0000V se clasificarán como GND (Gris).\n` +
      `• Los pines con OL se clasificarán como NC (Azul marino).\n` +
      `• El campo 'En Prueba' se limpiará para dejar la plantilla lista para diagnosticar.`
    )) {
      return;
    }

    setPines(prev => prev.map(p => {
      const vAct = obtenerValActual(p);
      if (vAct && vAct !== '---') {
        const vNum = parseFloat(vAct);
        const esGnd = vAct === '0.000' || vAct === '0.0000' || (!isNaN(vNum) && vNum < 0.050);
        const esOl = vAct === 'OL';

        return {
          ...p,
          valorSano: vAct,
          valorSanoDiodo: escala === 'diodo' ? vAct : p.valorSanoDiodo,
          valorSanoUa: escala === 'ua' ? vAct : p.valorSanoUa,
          valorSanoVoltio: escala === 'voltio' ? vAct : p.valorSanoVoltio,
          valorSanoOhmio: escala === 'ohmio' ? vAct : p.valorSanoOhmio,
          valorSanoAmperio: escala === 'amperio' ? vAct : p.valorSanoAmperio,
          tipo: (esGnd && p.tipo === 'DATA') ? 'GND' : (esOl && p.tipo === 'DATA') ? 'NC' : p.tipo,
          nombre: (esGnd && (p.nombre.startsWith('Linea_') || !p.nombre)) ? 'GND' : (esOl && (p.nombre.startsWith('Linea_') || !p.nombre)) ? 'NC' : p.nombre,
          categoria: esGnd ? 'tierra' : esOl ? 'tierra' : p.categoria,
          colorCustom: esGnd ? '#4b5563' : esOl ? '#1e3a8a' : p.colorCustom,
          // Dejar limpio valorActual listo para diagnóstico
          valorActual: '---',
          valorActualDiodo: '---',
          valorActualUa: '---',
          valorActualVoltio: '---',
          valorActualOhmio: '---',
          valorActualAmperio: '---'
        };
      }
      return p;
    }));

    if (setModo) setModo('crear');
    alert('✅ ¡Éxito! Todas las mediciones ahora son la Referencia Oficial de la Placa Buena. Puedes pulsar "GUARDAR REFERENCIA" para subirlas a la nube.');
  };

  // REINICIAR DIAGNÓSTICO (Limpia las lecturas de la placa averiada y el caché local)
  const reiniciarDiagnostico = () => {
    if (!window.confirm('¿Reiniciar diagnóstico? Las lecturas tomadas de la placa averiada (En Prueba) se limpiarán a "---". La Placa Buena se mantendrá intacta.')) return;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageDiagKey);
      } catch (e) { }
    }
    setPines(prev => prev.map(p => ({
      ...p,
      valorActual: '---',
      valorActualDiodo: '---',
      valorActualUa: '---',
      valorActualVoltio: '---',
      valorActualOhmio: '---',
      valorActualAmperio: '---'
    })));
    setPinActivo(1);
  };

  // --- EXPORTACIÓN A ARCHIVO TXT LIMPIO ---
  const exportarTXT = (tipo = 'diagnostico') => {
    const esDiag = tipo === 'diagnostico';
    const fecha = new Date().toLocaleString();
    const tituloDoc = esDiag ? 'REPORTE DE DIAGNÓSTICO COMPARATIVO FPC' : 'HOJA DE DATOS FPC - PLACA BUENA (REFERENCIA)';

    const lineasTxt = [
      '========================================================================================',
      tituloDoc,
      '========================================================================================',
      `Dispositivo:  ${marca || 'Dispositivo'} ${modeloNombre || ''}`.trim(),
      `Conector:     ${nombreFpc} (${pines.length} Pines)`,
      `Escala:       ${escala.toUpperCase()} (V)`,
      `Fecha:        ${fecha}`,
      esDiag
        ? `Resultados:   Medidos: ${resumenDiagnostico.medidos}/${resumenDiagnostico.total} | Normales: ${resumenDiagnostico.normales} | Anomalías: ${resumenDiagnostico.fallas}`
        : `Total Pines:  ${pines.length} Pines registrados`,
      '========================================================================================'
    ];

    if (esDiag) {
      lineasTxt.push(
        'PIN'.padEnd(6) + '| ' +
        'LÍNEA / NET'.padEnd(24) + '| ' +
        'TIPO'.padEnd(10) + '| ' +
        'REF (BUENA)'.padEnd(14) + '| ' +
        'EN PRUEBA'.padEnd(14) + '| ' +
        'DELTA'.padEnd(12) + '| ' +
        'ESTADO'
      );
      lineasTxt.push(''.padEnd(96, '-'));

      pines.forEach(p => {
        const s = evaluarSaludPin(p);
        const vSano = obtenerValSano(p);
        const vAct = obtenerValActual(p);
        const nom = esNombreGenerico(p.nombre) ? '---' : p.nombre;
        const delta = (s.delta !== null && s.delta !== undefined) ? `${s.delta > 0 ? '+' : ''}${s.delta} V` : '---';
        const estadoTexto = s.estado === 'corto' ? 'ANOMALÍA: CORTOCIRCUITO'
          : s.estado === 'abierto' ? 'ANOMALÍA: LÍNEA ABIERTA'
          : s.estado === 'fuga' ? 'ANOMALÍA: FUGA / TOLERANCIA'
          : s.estado === 'gnd' ? 'GND Normal'
          : s.estado === 'ok' ? 'Normal (OK)'
          : 'Sin Medir';

        lineasTxt.push(
          `#${p.id}`.padEnd(6) + '| ' +
          nom.padEnd(24) + '| ' +
          (p.tipo || 'PIN').padEnd(10) + '| ' +
          `${vSano} V`.padEnd(14) + '| ' +
          `${vAct} V`.padEnd(14) + '| ' +
          delta.padEnd(12) + '| ' +
          estadoTexto
        );
      });
    } else {
      lineasTxt.push(
        'PIN'.padEnd(6) + '| ' +
        'LÍNEA / NET'.padEnd(28) + '| ' +
        'CATEGORÍA'.padEnd(24) + '| ' +
        'TIPO'.padEnd(10) + '| ' +
        'VALOR REFERENCIA'
      );
      lineasTxt.push(''.padEnd(80, '-'));

      pines.forEach(p => {
        const vSano = obtenerValSano(p);
        const nom = esNombreGenerico(p.nombre) ? `Pin_${p.id}` : p.nombre;
        const cat = CATEGORIAS_FPC[p.categoria || deducirCategoriaNet(p.nombre)]?.label || 'Genérico';
        lineasTxt.push(
          `#${p.id}`.padEnd(6) + '| ' +
          nom.padEnd(28) + '| ' +
          cat.padEnd(24) + '| ' +
          (p.tipo || 'PIN').padEnd(10) + '| ' +
          `${vSano} V`
        );
      });
    }

    lineasTxt.push('========================================================================================');
    lineasTxt.push('Generado con Mi Diagnóstico Pro - Laboratorio de Reparación y Microelectrónica');
    lineasTxt.push('========================================================================================');

    const contenido = lineasTxt.join('\n');
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const prefijo = esDiag ? 'Diagnostico' : 'Referencia_PlacaBuena';
    const tagEquipo = `${marca || 'Equipo'}_${modeloNombre || ''}`.trim().replace(/\s+/g, '_');
    a.download = `${prefijo}_${tagEquipo}_${nombreFpc}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- GENERACIÓN E IMPRESIÓN DIRECTA EN PDF PROFESIONAL ---
  const imprimirReportePDF = (tipo = 'diagnostico') => {
    const esDiag = tipo === 'diagnostico';
    const fecha = new Date().toLocaleString();
    const tituloDoc = esDiag ? 'INFORME DE DIAGNÓSTICO COMPARATIVO FPC' : 'HOJA DE DATOS FPC - PLACA BUENA (REFERENCIA)';
    const ventana = window.open('', '_blank', 'width=950,height=1000');
    if (!ventana) {
      alert('Por favor permite ventanas emergentes en tu navegador para generar el PDF.');
      return;
    }

    const filasHtml = pines.map(p => {
      const s = evaluarSaludPin(p);
      const vSano = obtenerValSano(p);
      const vAct = obtenerValActual(p);
      const nom = esNombreGenerico(p.nombre) ? `Pin_${p.id}` : p.nombre;
      const cat = CATEGORIAS_FPC[p.categoria || deducirCategoriaNet(p.nombre)] || CATEGORIAS_FPC.generico;
      const delta = (s.delta !== null && s.delta !== undefined) ? `${s.delta > 0 ? '+' : ''}${s.delta} V` : '---';

      let badgeEstado = '';
      if (esDiag) {
        if (s.estado === 'corto') badgeEstado = '<span style="background:#ef4444;color:white;padding:2px 7px;border-radius:4px;font-weight:bold;font-size:11px;">CORTOCIRCUITO</span>';
        else if (s.estado === 'abierto') badgeEstado = '<span style="background:#ef4444;color:white;padding:2px 7px;border-radius:4px;font-weight:bold;font-size:11px;">LÍNEA ABIERTA</span>';
        else if (s.estado === 'fuga') badgeEstado = '<span style="background:#f59e0b;color:black;padding:2px 7px;border-radius:4px;font-weight:bold;font-size:11px;">FUGA / TOLERANCIA</span>';
        else if (s.estado === 'gnd') badgeEstado = '<span style="background:#10b981;color:white;padding:2px 7px;border-radius:4px;font-weight:bold;font-size:11px;">GND Normal</span>';
        else if (s.estado === 'ok') badgeEstado = '<span style="background:#10b981;color:white;padding:2px 7px;border-radius:4px;font-weight:bold;font-size:11px;">Normal (OK)</span>';
        else badgeEstado = '<span style="background:#64748b;color:white;padding:2px 7px;border-radius:4px;font-size:11px;">Sin Medir</span>';
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
          <td style="padding: 7px 8px; font-weight: bold; text-align: center; color: #0f172a;">#${p.id}</td>
          <td style="padding: 7px 8px;">
            <span style="display:inline-block; padding: 2px 7px; border-radius: 4px; font-weight: bold; font-size: 11px; background: ${cat.color}; color: ${cat.text};">
              ${nom}
            </span>
          </td>
          <td style="padding: 7px 8px; color: #475569; font-size: 11px;">${cat.label}</td>
          <td style="padding: 7px 8px; font-family: monospace; font-weight: bold; color: #0284c7;">${vSano} V</td>
          ${esDiag ? `
            <td style="padding: 7px 8px; font-family: monospace; font-weight: bold; color: ${s.esAnomalia ? '#dc2626' : '#16a34a'};">${vAct} V</td>
            <td style="padding: 7px 8px; font-family: monospace; color: #64748b;">${delta}</td>
            <td style="padding: 7px 8px; text-align: center;">${badgeEstado}</td>
          ` : ''}
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${tituloDoc} - ${marca} ${modeloNombre}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #ffffff; }
          .no-print-bar { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          .btn-print { background: #0284c7; color: white; border: none; padding: 9px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; }
          .header { border-bottom: 3px solid #0284c7; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
          .titulo-principal { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
          .subtitulo { font-size: 13px; color: #64748b; font-weight: 600; margin: 0; }
          .meta-grid { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; margin-bottom: 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-k { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .meta-v { font-size: 13px; font-weight: bold; color: #0f172a; }
          .resumen-cards { display: flex; gap: 10px; margin-bottom: 18px; }
          .card { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fafafa; }
          .card-t { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 2px; }
          .card-n { font-size: 18px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0f172a; color: white; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
          .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
          @media print {
            body { padding: 0; }
            .no-print-bar { display: none !important; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <div>
            <strong>Reporte Listo para Exportar / Imprimir</strong>
            <span style="color:#94a3b8; font-size: 12px; margin-left: 10px;">Selecciona "Guardar como PDF" en el destino de tu impresora</span>
          </div>
          <button class="btn-print" onclick="window.print()">🖨️ Guardar como PDF / Imprimir</button>
        </div>

        <div class="header">
          <div>
            <h1 class="titulo-principal">🔬 MI DIAGNÓSTICO PRO</h1>
            <p class="subtitulo">${tituloDoc}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #64748b; font-weight: bold;">FECHA: ${fecha}</div>
            <div style="font-size: 12px; font-weight: bold; color: #0284c7; margin-top: 3px;">ESCALA: ${escala.toUpperCase()} (V)</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><span class="meta-k">Marca / Fabricante</span><span class="meta-v">${marca || 'Dispositivo'}</span></div>
          <div class="meta-item"><span class="meta-k">Modelo</span><span class="meta-v">${modeloNombre || 'Estándar'}</span></div>
          <div class="meta-item"><span class="meta-k">Conector</span><span class="meta-v">${nombreFpc}</span></div>
          <div class="meta-item"><span class="meta-k">Total Pines</span><span class="meta-v">${pines.length} Pines</span></div>
        </div>

        ${esDiag ? `
          <div class="resumen-cards">
            <div class="card" style="border-left: 4px solid #3b82f6;"><div class="card-t">Medidos</div><div class="card-n" style="color: #3b82f6;">${resumenDiagnostico.medidos} / ${resumenDiagnostico.total}</div></div>
            <div class="card" style="border-left: 4px solid #10b981;"><div class="card-t">Pines Normales (OK)</div><div class="card-n" style="color: #10b981;">${resumenDiagnostico.normales}</div></div>
            <div class="card" style="border-left: 4px solid #ef4444;"><div class="card-t">Con Anomalías</div><div class="card-n" style="color: #ef4444;">${resumenDiagnostico.fallas}</div></div>
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">PIN</th>
              <th>LÍNEA / NET</th>
              <th>CATEGORÍA</th>
              <th>REF (BUENA)</th>
              ${esDiag ? `
                <th>EN PRUEBA</th>
                <th>DELTA</th>
                <th style="text-align: center;">ESTADO</th>
              ` : ''}
            </tr>
          </thead>
          <tbody>
            ${filasHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>Mi Diagnóstico Pro • Soluciones Avanzadas en Microelectrónica</span>
          <span>Reporte Oficial de Laboratorio • 0 Costo Cloud</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  };

  // RESUMEN ESTADÍSTICO PARA LA TABLA INFERIOR
  const resumenDiagnostico = useMemo(() => {
    let total = pines.length;
    let medidos = 0;
    let normales = 0;
    let fallas = 0;
    let sinRef = 0;

    const lista = pines.map(p => {
      const salud = evaluarSaludPin(p);
      const valSano = obtenerValSano(p);
      const valAct = obtenerValActual(p);
      const yaMedido = valAct && valAct !== '---';

      if (yaMedido) {
        medidos++;
        if (salud.estado === 'OK') normales++;
        else if (salud.estado === 'FALLA' || salud.estado === 'ALTERADO') fallas++;
        else if (salud.estado === 'SIN_REF') sinRef++;
      }

      return {
        ...p,
        valSano,
        valAct,
        salud,
        yaMedido
      };
    });

    return { total, medidos, normales, fallas, sinRef, lista };
  }, [pines, escala, modo]);

  // RENDERIZADO VISUAL DEL PIN
  const renderPin = (pin, esArriba, isExtremo) => {
    const salud = evaluarSaludPin(pin);
    const valSano = obtenerValSano(pin);
    const valAct = obtenerValActual(pin);
    const esActivo = String(pinActivo) === String(pin.id);

    // Texto del pin: en modo grabar muestra la referencia, en diagnóstico muestra lo medido en la averiada
    const valorTexto = modo === 'crear' ? formNum(valSano, pin.tipo) : formNum(valAct, pin.tipo);

    return (
      <div
        key={pin.id}
        onClick={() => setPinActivo(pin.id)}
        style={{
          width: isExtremo ? '70px' : '45px',
          minWidth: isExtremo ? '70px' : '45px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        {esArriba && (
          <span style={{ fontSize: '0.55rem', color: esActivo ? '#00ffff' : '#6b7280', marginBottom: '2px', fontWeight: esActivo ? 'bold' : 'normal' }}>
            {pin.id}
          </span>
        )}
        <div
          style={{
            width: '100%',
            height: '32px',
            backgroundColor: salud.bg,
            color: salud.text,
            border: esActivo ? '2px solid #00ffff' : salud.border,
            borderRadius: '4px',
            transition: 'all 0.15s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: esActivo ? '0 0 10px rgba(0,255,255,0.4)' : 'none'
          }}
          title={`Pin ${pin.id} (${pin.nombre || 'Línea'}) | Ref: ${valSano} | Prueba: ${valAct}`}
        >
          <span style={{ fontSize: '0.62rem', fontWeight: 'bold', lineHeight: 1 }}>
            {valorTexto || '---'}
          </span>
          {modo === 'diagnostico' && valAct === '---' && valSano !== '---' && (
            <span style={{ fontSize: '0.5rem', opacity: 0.6, marginTop: '1px' }}>
              {formNum(valSano, pin.tipo)}
            </span>
          )}
        </div>
        {!esArriba && (
          <span style={{ fontSize: '0.55rem', color: esActivo ? '#00ffff' : '#6b7280', marginTop: '2px', fontWeight: esActivo ? 'bold' : 'normal' }}>
            {pin.id}
          </span>
        )}
      </div>
    );
  };

  const pinActivoObj = pines.find(p => String(p.id) === String(pinActivo)) || pines[0] || {};
  const saludActivo = evaluarSaludPin(pinActivoObj);
  const valSanoActivo = obtenerValSano(pinActivoObj);
  const valActActivo = obtenerValActual(pinActivoObj);
  const unidadEscala = escala === 'diodo' ? 'V' : escala === 'ua' ? 'uA' : escala === 'voltio' ? 'V' : escala === 'ohmio' ? 'Ω' : 'A';

  // Verificar si la referencia está vacía pero hay mediciones en prueba (caso de rescate)
  const tieneMedicionesEnPruebaSinRef = useMemo(() => {
    const haySano = pines.some(p => {
      const s = obtenerValSano(p);
      return s && s !== '---';
    });
    const hayPrueba = pines.some(p => {
      const a = obtenerValActual(p);
      return a && a !== '---';
    });
    return !haySano && hayPrueba;
  }, [pines, escala]);

  return (
    <div
      style={{
        backgroundColor: '#111827',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid #374151',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <style>{`
        .fpc-scroll-container::-webkit-scrollbar { height: 8px; }
        .fpc-scroll-container::-webkit-scrollbar-track { background: #0b0f19; border-radius: 4px; }
        .fpc-scroll-container::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; }
        .fpc-scroll-container::-webkit-scrollbar-thumb:hover { background: #2563eb; }
      `}</style>

      {/* --- BANNER DE RESCATE SI HAY MEDICIONES EN PRUEBA PERO LA REFERENCIA ESTÁ VACÍA --- */}
      {tieneMedicionesEnPruebaSinRef && (
        <div style={{
          backgroundColor: 'rgba(234, 179, 8, 0.12)',
          border: '1px solid #eab308',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fef08a', fontSize: '0.8rem' }}>
            <AlertTriangle size={18} color="#eab308" />
            <span>
              <strong>Detectadas mediciones en prueba sin referencia guardada:</strong> Las mediciones que grabaste previamente están en la columna <em>En Prueba</em>. Pulsa aquí para promoverlas a <strong>Placa Buena de Referencia</strong>.
            </span>
          </div>
          <button
            onClick={transferirEnPruebaAReferencia}
            style={{
              background: '#eab308',
              color: '#000000',
              fontWeight: 'bold',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(234, 179, 8, 0.4)'
            }}
          >
            <Download size={14} />
            Promover a Placa Buena Oficial
          </button>
        </div>
      )}

      {/* --- SELECTOR DE MODO: REFERENCIA vs DIAGNÓSTICO --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Botón Pestaña 1: Configurar Placa Buena */}
          <button
            onClick={() => setModo && setModo('crear')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: modo === 'crear' ? '2px solid #8b5cf6' : '1px solid #374151',
              background: modo === 'crear' ? 'rgba(139, 92, 246, 0.25)' : '#1a202c',
              color: modo === 'crear' ? '#c4b5fd' : '#9ca3af',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem'
            }}
          >
            <Edit3 size={14} color={modo === 'crear' ? '#c4b5fd' : '#9ca3af'} />
            1. Placa Buena (Referencia)
          </button>

          {/* Botón Pestaña 2: Diagnóstico */}
          <button
            onClick={() => setModo && setModo('diagnostico')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: modo === 'diagnostico' ? '2px solid #10b981' : '1px solid #374151',
              background: modo === 'diagnostico' ? 'rgba(16, 185, 129, 0.25)' : '#1a202c',
              color: modo === 'diagnostico' ? '#6ee7b7' : '#9ca3af',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem'
            }}
          >
            <Shield size={14} color={modo === 'diagnostico' ? '#6ee7b7' : '#9ca3af'} />
            2. Diagnóstico (Placa Averiada)
          </button>

          {/* Botón de Ayuda */}
          <button
            onClick={() => setAyudaVisible(!ayudaVisible)}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="¿Cómo funciona la separación de modos?"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {/* Acciones de la barra superior */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {modo === 'crear' ? (
            <>
              <button
                onClick={() => imprimirReportePDF('referencia')}
                style={{
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Exportar hoja de datos oficial de la Placa Buena en PDF"
              >
                <Printer size={13} />
                PDF Referencia
              </button>

              <button
                onClick={() => exportarTXT('referencia')}
                style={{
                  background: '#1e293b',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Descargar mediciones de la Placa Buena en archivo TXT simple"
              >
                <FileText size={13} />
                TXT Referencia
              </button>

              <button
                onClick={transferirEnPruebaAReferencia}
                style={{
                  background: 'transparent',
                  border: '1px solid #4b5563',
                  color: '#9ca3af',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Copia las mediciones tomadas en prueba a los valores de la placa buena"
              >
                <ArrowRightLeft size={13} />
                Copiar Prueba → Buena
              </button>

              {onGuardar && (
                <button
                  onClick={onGuardar}
                  disabled={guardando}
                  style={{
                    background: cambiosPendientes ? '#f59e0b' : '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem'
                  }}
                >
                  <Save size={15} />
                  {guardando ? 'GUARDANDO...' : (cambiosPendientes ? 'GUARDAR REFERENCIA' : 'GUARDADO EN NUBE')}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => imprimirReportePDF('diagnostico')}
                style={{
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 0 10px rgba(2, 132, 199, 0.3)'
                }}
                title="Generar e imprimir informe de diagnóstico en PDF con formato profesional de laboratorio"
              >
                <Printer size={13} />
                Exportar PDF
              </button>

              <button
                onClick={() => exportarTXT('diagnostico')}
                style={{
                  background: '#1e293b',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Descargar reporte comparativo en archivo TXT simple"
              >
                <FileText size={13} />
                Descargar TXT
              </button>

              <button
                onClick={reiniciarDiagnostico}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Limpia la columna 'En Prueba' para comenzar a diagnosticar otra placa"
              >
                <RotateCcw size={13} />
                Reiniciar Diagnóstico
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- EXPLICACIÓN FLOTANTE DE AYUDA (SI ESTÁ ABIERTA) --- */}
      {ayudaVisible && (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', marginBottom: '12px', fontSize: '0.75rem', color: '#cbd5e1' }}>
          <strong style={{ color: '#ffffff' }}>📌 Flujo de Trabajo Profesional:</strong>
          <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
            <li><strong>Modo Placa Buena:</strong> Aquí defines la plantilla oficial (nombres de líneas, GNDs, NCs y valores de referencia en diodo/voltaje). Puedes medir con el multímetro o escribirlos a mano. Pulsa <em>Guardar Referencia</em> para subirlos a la nube.</li>
            <li><strong>Modo Diagnóstico:</strong> La placa buena queda <strong>bloqueada como lectura</strong>. Conectas la placa averiada del cliente y mides pin a pin. La columna <em>Ref (Buena)</em> muestra lo que guardaste, y <em>En Prueba</em> muestra la medición actual con el diagnóstico diferencial (Corto, Abierto o Normal).</li>
          </ol>
        </div>
      )}

      {/* --- CONECTOR FPC FÍSICO SCROLLEABLE --- */}
      <div
        className="fpc-scroll-container"
        style={{
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '10px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            backgroundColor: '#05070d',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #1f2937',
            width: 'max-content'
          }}
        >
          <div style={{ display: 'flex', gap: '3px' }}>
            {filaSup.map((pin, i) => renderPin(pin, true, i === 0 || i === filaSup.length - 1))}
          </div>
          <div style={{ height: '8px', backgroundColor: '#111827', borderRadius: '2px', width: '100%' }} />
          <div style={{ display: 'flex', gap: '3px' }}>
            {filaInf.map((pin, i) => renderPin(pin, false, i === 0 || i === filaInf.length - 1))}
          </div>
        </div>
      </div>

      {/* --- TARJETA DE CONTROL Y COMPARACIÓN DEL PIN ACTIVO --- */}
      <div
        style={{
          marginTop: '14px',
          padding: '14px',
          backgroundColor: '#0d131f',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          borderLeft: `5px solid ${saludActivo.bg || '#3b82f6'}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          {/* Datos del Pin */}
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '0.5px' }}>
                PIN {pinActivo}
              </span>

              {/* Si se cambió a un nombre real (como USB_TYPEC_CC1 en imagen 5), se muestra su pastilla con el nombre y color oficial */}
              {!esNombreGenerico(pinActivoObj.nombre) ? (
                <span style={{
                  fontSize: '0.8rem',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  backgroundColor: CATEGORIAS_FPC[pinActivoObj.categoria || deducirCategoriaNet(pinActivoObj.nombre)]?.color || '#ef4444',
                  color: CATEGORIAS_FPC[pinActivoObj.categoria || deducirCategoriaNet(pinActivoObj.nombre)]?.text || '#ffffff',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px'
                }}>
                  {pinActivoObj.nombre}
                </span>
              ) : (
                /* Si no ha sido cambiado (sigue genérico), muestra la pastilla [ PIN ] en amarillo boardview unida a PIN X sin el texto 'Linea_47' */
                <span style={{
                  fontSize: '0.75rem',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  backgroundColor: CATEGORIAS_FPC.generico.color, // #eab308 (Amarillo Boardview)
                  color: '#000000',
                  fontWeight: 'bold'
                }}>
                  {pinActivoObj.tipo === 'GND' || pinActivoObj.tipo === 'NC' ? pinActivoObj.tipo : 'PIN'}
                </span>
              )}

              {modo === 'diagnostico' && saludActivo.badge && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: saludActivo.bg,
                  color: saludActivo.text,
                  fontWeight: 'bold'
                }}>
                  {saludActivo.badge}
                </span>
              )}
            </div>

            {/* MODO 1: CONTROLES DE EDICIÓN DE LA PLACA BUENA (NOMBRE, TIPO, VALOR MANUAL) */}
            {modo === 'crear' ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* 1-Click: GND */}
                <button
                  onClick={() => aplicarTipoRapido('GND')}
                  style={{ background: '#4b5563', color: 'white', border: 'none', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar como Tierra (GND, 0.000V)"
                >
                  GND
                </button>

                {/* 1-Click: NC */}
                <button
                  onClick={() => aplicarTipoRapido('NC')}
                  style={{ background: '#1e3a8a', color: '#93c5fd', border: 'none', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar como No Conectado (NC, OL)"
                >
                  NC
                </button>

                {/* 1-Click: OL */}
                <button
                  onClick={() => {
                    setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, valorSano: 'OL', valorSanoDiodo: 'OL' } : p));
                    avanzarPinActivo();
                  }}
                  style={{ background: '#ffffff', color: '#000000', border: '1px solid #cbd5e1', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar medición de referencia como Abierto (OL) y pasar al siguiente pin"
                >
                  OL
                </button>

                {/* 1-Click: VCC / Power */}
                <button
                  onClick={() => aplicarTipoRapido('VCC')}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar como Alimentación (PWR/VCC)"
                >
                  PWR
                </button>

                {/* 1-Click: ACT (Potencia / Actuador / Audio) */}
                <button
                  onClick={() => aplicarTipoRapido('ACT')}
                  style={{ background: '#f97316', color: 'white', border: 'none', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar como Potencia / Actuador (Audio, Haptic, Parlante)"
                >
                  ACT
                </button>

                {/* 1-Click: PIN (Genérico / Amarillo Boardview) */}
                <button
                  onClick={() => aplicarTipoRapido('PIN')}
                  style={{ background: '#eab308', color: '#000000', border: 'none', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Restablecer a PIN Genérico (Amarillo Boardview)"
                >
                  PIN
                </button>

                {/* Input de Nombre con autodetección y avance con Enter */}
                <input
                  value={esNombreGenerico(pinActivoObj.nombre) ? '' : pinActivoObj.nombre}
                  onChange={(e) => manejarCambioNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      avanzarPinActivo();
                    }
                  }}
                  placeholder="Asignar nombre de línea... (Enter = siguiente)"
                  style={{ background: '#000', color: 'white', border: '1px solid #374151', padding: '4px 8px', borderRadius: '5px', width: '200px', outline: 'none', fontSize: '0.78rem', fontWeight: 'bold' }}
                  title="Escribe o pega el nombre de la línea. Pulsa Enter para pasar al siguiente pin automáticamente"
                />

                {/* Input Manual de Valor de Referencia */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#05070d', border: '1px solid #374151', borderRadius: '5px', padding: '2px 6px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Ref:</span>
                  <input
                    type="text"
                    value={valSanoActivo === '---' ? '' : valSanoActivo}
                    onChange={(e) => actualizarValorReferenciaManual(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        avanzarPinActivo();
                      }
                    }}
                    placeholder="0.000"
                    style={{ background: 'transparent', color: '#38bdf8', border: 'none', width: '55px', outline: 'none', fontSize: '0.78rem', fontWeight: 'bold', textAlign: 'center' }}
                    title="Escribe manualmente el valor sano de referencia con el teclado (Enter = siguiente)"
                  />
                  <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>{unidadEscala}</span>
                </div>

                {/* Paleta de Color */}
                <input
                  type="color"
                  value={pinActivoObj.colorCustom || '#d4af37'}
                  onChange={(e) => setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, colorCustom: e.target.value } : p))}
                  style={{ padding: '0', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', background: 'transparent' }}
                  title="Color personalizado de la línea"
                />

                {/* Selector de Catálogo Completo */}
                <SelectorTipoLinea
                  valor={esNombreGenerico(pinActivoObj.nombre) ? 'PIN' : (pinActivoObj.nombre || pinActivoObj.tipo || 'PIN')}
                  nombreComponente={nombreFpc}
                  idPad={pinActivo}
                  onChange={(val, cat) => {
                    const catLimpia = cat || deducirCategoriaNet(val);
                    const colorAuto = CATEGORIAS_FPC[catLimpia]?.color || '#eab308';
                    setPines(prev =>
                      prev.map(p =>
                        String(p.id) === String(pinActivo) ? {
                          ...p,
                          nombre: val === 'GND' || val === 'NC' ? val : val,
                          tipo: val === 'GND' || val === 'NC' ? val : (catLimpia === 'alimentacion' ? 'PWR' : catLimpia === 'actuadores' ? 'ACT' : 'PIN'),
                          categoria: catLimpia,
                          colorCustom: colorAuto
                        } : p
                      )
                    );
                    avanzarPinActivo();
                  }}
                  tiposCustom={tiposCustom}
                  onAgregarTipo={(nuevo) => setTiposCustom && setTiposCustom([...tiposCustom, nuevo])}
                  onEliminarTipo={(tipo) => setTiposCustom && setTiposCustom(tiposCustom.filter(t => t !== tipo))}
                />
              </div>
            ) : (
              /* MODO DIAGNÓSTICO: INFORMACIÓN PROTEGIDA */
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#9ca3af' }}>
                <span>🔒 Placa de Referencia protegida. Para modificar nombres o valores Golden, ve a la pestaña <em>1. Placa Buena</em>.</span>
              </div>
            )}
          </div>

          {/* Comparación Numérica Lado a Lado */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.7rem', display: 'block', fontWeight: 'bold' }}>
                PLACA BUENA (REF)
              </span>
              <strong style={{ color: valSanoActivo !== '---' ? '#38bdf8' : '#64748b', fontSize: '1.2rem' }}>
                {valSanoActivo} {valSanoActivo !== '---' && valSanoActivo !== 'OL' ? unidadEscala : ''}
              </strong>
            </div>

            <div style={{ width: '1px', height: '35px', backgroundColor: '#374151' }} />

            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.7rem', display: 'block', fontWeight: 'bold' }}>
                EN PRUEBA (MEDIDO)
              </span>
              <strong style={{
                color: saludActivo.bg === '#10b981' ? '#10b981' : saludActivo.bg === '#ef4444' ? '#ef4444' : '#ffffff',
                fontSize: '1.3rem'
              }}>
                {String(pinActivo) === String(pinActivoObj.id) && lecturaEnVivo !== '----' && valActActivo === '---'
                  ? `${lecturaEnVivo} (En vivo)`
                  : `${valActActivo} ${valActActivo !== '---' && valActActivo !== 'OL' ? unidadEscala : ''}`}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* --- PANEL INFERIOR DE HALLAZGOS Y DISCREPANCIAS (OPCIÓN C) --- */}
      <div style={{ marginTop: '16px', backgroundColor: '#0a0d14', borderRadius: '12px', border: '1px solid #1f2937', padding: '14px' }}>
        {/* Cabecera y Título Oficial de la Tabla */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '10px',
          marginBottom: '10px',
          borderBottom: '1px solid #1e293b',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>📋</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#f8fafc', letterSpacing: '0.3px' }}>
                {modo === 'diagnostico'
                  ? 'TABLA DE DIAGNÓSTICO DIFERENCIAL Y CONTRASTE DE PINES'
                  : 'REGISTRO Y MAPEO DE LÍNEAS DE LA PLACA BUENA (PATRÓN)'}
              </span>
              <span style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: modo === 'diagnostico' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                color: modo === 'diagnostico' ? '#6ee7b7' : '#c4b5fd',
                border: modo === 'diagnostico' ? '1px solid #059669' : '1px solid #7c3aed',
                fontWeight: 'bold'
              }}>
                {modo === 'diagnostico' ? 'MODO DIAGNÓSTICO' : 'MODO REFERENCIA'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              {modo === 'diagnostico'
                ? 'Compara en tiempo real los valores de la placa bajo prueba contra la placa de referencia patrón'
                : 'Catálogo de pines, líneas asignadas y valores estándar de referencia'}
            </div>
          </div>
        </div>

        {/* Barra de Estadísticas y Filtros */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 'bold' }}>
              Medidos: <strong style={{ color: '#ffffff' }}>{resumenDiagnostico.medidos}/{resumenDiagnostico.total}</strong>
            </span>
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>
              ✅ Normales: {resumenDiagnostico.normales}
            </span>
            <span style={{ fontSize: '0.8rem', color: resumenDiagnostico.fallas > 0 ? '#ef4444' : '#6b7280', fontWeight: 'bold' }}>
              ⚠️ Con Anomalías: {resumenDiagnostico.fallas}
            </span>
            {resumenDiagnostico.sinRef > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>
                (Faltan {resumenDiagnostico.sinRef} valores de Ref)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setFiltroSoloFallas(!filtroSoloFallas)}
              style={{
                background: filtroSoloFallas ? '#ef4444' : '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Filter size={12} />
              {filtroSoloFallas ? 'Mostrando Solo Anomalías' : 'Ver Solo Anomalías'}
            </button>
          </div>
        </div>

        {/* Tabla de Resultados Comparativos */}
        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af', textAlign: 'left', position: 'sticky', top: 0, backgroundColor: '#0a0d14' }}>
                <th style={{ padding: '6px 8px' }}>PIN</th>
                <th style={{ padding: '6px 8px' }}>LÍNEA</th>
                <th style={{ padding: '6px 8px' }}>TIPO</th>
                <th style={{ padding: '6px 8px' }}>REF (BUENA)</th>
                <th style={{ padding: '6px 8px' }}>EN PRUEBA</th>
                <th style={{ padding: '6px 8px' }}>DELTA</th>
                <th style={{ padding: '6px 8px' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {resumenDiagnostico.lista
                .filter(p => !filtroSoloFallas || (p.yaMedido && p.salud.estado !== 'OK'))
                .map(p => {
                  const isSel = String(p.id) === String(pinActivo);
                  const esGenerico = esNombreGenerico(p.nombre);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setPinActivo(p.id)}
                      style={{
                        borderBottom: '1px solid #1a202c',
                        backgroundColor: isSel ? 'rgba(0, 255, 255, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s'
                      }}
                    >
                      <td style={{ padding: '6px 8px', fontWeight: 'bold', color: isSel ? '#00ffff' : '#ffffff' }}>
                        #{p.id}
                      </td>
                      <td style={{ padding: '6px 8px', color: esGenerico ? '#64748b' : '#e2e8f0', fontWeight: esGenerico ? 'normal' : 'bold' }}>
                        {esGenerico ? '---' : p.nombre}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: esGenerico
                            ? (p.tipo === 'GND' ? '#4b5563' : p.tipo === 'NC' ? '#1e3a8a' : CATEGORIAS_FPC.generico.color)
                            : (CATEGORIAS_FPC[p.categoria || deducirCategoriaNet(p.nombre)]?.color || CATEGORIAS_FPC.generico.color),
                          color: esGenerico
                            ? (p.tipo === 'GND' || p.tipo === 'NC' ? '#ffffff' : CATEGORIAS_FPC.generico.text)
                            : (CATEGORIAS_FPC[p.categoria || deducirCategoriaNet(p.nombre)]?.text || '#ffffff'),
                          fontSize: '0.65rem',
                          fontWeight: 'bold'
                        }}>
                          {esGenerico ? (p.tipo === 'GND' || p.tipo === 'NC' ? p.tipo : 'PIN') : (p.tipo || 'PIN')}
                        </span>
                      </td>
                      {/* REF (BUENA): Muestra el valor de referencia patrón */}
                      <td style={{ padding: '6px 8px', color: '#38bdf8', fontWeight: 'bold' }}>
                        {p.valSano}
                      </td>
                      {/* EN PRUEBA: Muestra el valor tomado de la placa bajo prueba */}
                      <td style={{ padding: '6px 8px', fontWeight: 'bold', color: p.salud.bg === '#10b981' ? '#10b981' : p.salud.bg === '#ef4444' ? '#ef4444' : '#e2e8f0' }}>
                        {p.valAct}
                      </td>
                      {/* DELTA: Diferencia matemática entre ambos */}
                      <td style={{ padding: '6px 8px', color: '#9ca3af' }}>
                        {p.salud.delta || '---'}
                      </td>
                      {/* ESTADO / DIAGNÓSTICO */}
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: p.salud.bg,
                          color: p.salud.text,
                          fontWeight: 'bold',
                          fontSize: '0.68rem',
                          border: p.salud.border
                        }}>
                          {p.salud.badge}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {filtroSoloFallas && resumenDiagnostico.fallas === 0 && (
            <div style={{ textAlign: 'center', padding: '16px', color: '#10b981', fontSize: '0.8rem' }}>
              🎉 No se han detectado anomalías en los pines medidos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
