import React, { useState, useEffect, useMemo } from 'react';
import {
  Save, Cloud, CloudOff, Check, AlertCircle, Shield, Zap, Radio,
  Activity, Cpu, Tag, RotateCcw, Filter, Eye, AlertTriangle,
  CheckCircle2, Lock, Unlock, Edit3, Plus, Trash2, ArrowRightLeft,
  Download, HelpCircle
} from 'lucide-react';
import SelectorTipoLinea from './SelectorTipoLinea.js';

// --- CATÁLOGO DE CATEGORÍAS Y COLORES OFICIALES ---
export const CATEGORIAS_FPC = {
  alimentacion: { id: 'alimentacion', label: 'Alimentación (Voltajes / Power)', color: '#ef4444', text: '#ffffff' },
  comunicacion: { id: 'comunicacion', label: 'Comunicación (Buses / Datos)', color: '#eab308', text: '#000000' },
  sensado: { id: 'sensado', label: 'Sensado (Térmico / ADC / Sensores)', color: '#06b6d4', text: '#000000' },
  control: { id: 'control', label: 'Control & Sincronización', color: '#10b981', text: '#ffffff' },
  tierra: { id: 'tierra', label: 'Tierra / Neutro (GND / NC)', color: '#4b5563', text: '#ffffff' },
  custom: { id: 'custom', label: 'Personalizada', color: '#8b5cf6', text: '#ffffff' }
};

// Detección automática de categoría según el nombre de la señal
export const deducirCategoriaNet = (nombre = '') => {
  const n = String(nombre).toUpperCase().trim();
  if (!n) return 'comunicacion';

  // 1. TIERRA Y NEUTRO
  if (n === 'GND' || n === 'GROUND' || n.endsWith('_GND') || n.startsWith('GND_') || n === 'AGND' || n === 'PGND') {
    return 'tierra';
  }
  if (n === 'NC' || n === 'NO_CONNECT' || n.startsWith('NC_')) {
    return 'tierra';
  }

  // 2. ALIMENTACIÓN (Voltajes, Power, Batería, LDOs, Rails, Backlight)
  if (
    /(LEDA|LED_A|LEDK|LED_K|ANODE|ANODO|CATODO|CATHODE|VBOOST|BOOST|VBAT|VPH|VDD|VBUS|VREG|VCC|CHARGER|CHG|BATT|VLED|AVDD|ELVDD|ELVSS|VSP|VSN|VIO|VBIAS|HV_|PP_|_PWR|POWER|VOLT|VOUT|VIN)/i.test(n)
  ) {
    return 'alimentacion';
  }

  // 3. SENSADO / TÉRMICO / ADC / ID
  if (
    /(THERM|SENSE|ISENSE|CSENSE|_ADC$|ADC_|JACK_DET|EAR_DET|BOARD_ID|NTC|BATT_NTC|^ID$|_ID$|BATT_ID|BATT_DET|CELL_BAL)/i.test(n)
  ) {
    return 'sensado';
  }

  // 4. CONTROL Y SINCRONIZACIÓN (Relojes, Enables, Reset, Botones)
  if (
    /(RESET|RST|ENABLE|_EN$|^EN_|INT|IRQ|CLK|CLOCK|PWM|POWER_KEY|VOL_UP|VOL_DOWN|HOLD|SYNC)/i.test(n)
  ) {
    return 'control';
  }

  // 5. COMUNICACIÓN (Datos, Protocolos, Buses diferenciales)
  if (
    /(I2C|SPI|UART|USB|MIPI|DSI|CSI|RFFE|SWI|DATA|SDA|SCL|MOSI|MISO|DP|DN|TX|RX|CAN|BUS)/i.test(n)
  ) {
    return 'comunicacion';
  }

  return 'comunicacion';
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
  nombreFpc = 'FPC'
}) {
  const [filtroSoloFallas, setFiltroSoloFallas] = useState(false);
  const [ayudaVisible, setAyudaVisible] = useState(false);

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
      : tipoDestino === 'VCC' ? 'alimentacion'
        : 'comunicacion';

    setPines(prev => prev.map(p => {
      if (String(p.id) === String(pinActivo)) {
        const mod = {
          ...p,
          tipo: tipoDestino,
          categoria: cat,
          nombre: (tipoDestino === 'GND' || tipoDestino === 'NC') ? tipoDestino : p.nombre
        };
        if (tipoDestino === 'GND') {
          mod.colorCustom = '#4b5563';
          mod.valorSano = '0.000';
          mod.valorSanoDiodo = '0.000';
        } else if (tipoDestino === 'NC') {
          mod.colorCustom = '#1e3a8a';
          mod.valorSano = 'OL';
          mod.valorSanoDiodo = 'OL';
        } else if (tipoDestino === 'VCC') {
          mod.colorCustom = '#ef4444';
        } else if (tipoDestino === 'DATA') {
          mod.colorCustom = '#eab308';
        }
        return mod;
      }
      return p;
    }));
  };

  const manejarCambioNombre = (nuevoNombre) => {
    const nombreLimpio = nuevoNombre.replace(/\s+/g, '_');
    const catDeducida = deducirCategoriaNet(nombreLimpio);
    const colorAuto = CATEGORIAS_FPC[catDeducida]?.color || '#d4af37';

    setPines(prev => prev.map(p => {
      if (String(p.id) === String(pinActivo)) {
        return {
          ...p,
          nombre: nombreLimpio,
          categoria: catDeducida,
          colorCustom: colorAuto,
          tipo: catDeducida === 'tierra' ? (nombreLimpio.toUpperCase().includes('NC') ? 'NC' : 'GND') : p.tipo
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

  // REINICIAR DIAGNÓSTICO (Limpia las lecturas de la placa averiada)
  const reiniciarDiagnostico = () => {
    if (!window.confirm('¿Reiniciar diagnóstico? Las lecturas tomadas de la placa averiada (En Prueba) se limpiarán a "---". La Placa Buena se mantendrá intacta.')) return;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {modo === 'crear' ? (
            <>
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
              <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                PIN {pinActivo}
              </span>
              <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1rem' }}>
                {pinActivoObj.nombre || 'Línea_sin_nombre'}
              </span>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: CATEGORIAS_FPC[pinActivoObj.categoria || deducirCategoriaNet(pinActivoObj.nombre)]?.color || '#4b5563',
                color: CATEGORIAS_FPC[pinActivoObj.categoria || deducirCategoriaNet(pinActivoObj.nombre)]?.text || '#ffffff',
                fontWeight: 'bold'
              }}>
                {pinActivoObj.tipo || 'DATA'}
              </span>

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
                  }}
                  style={{ background: '#ffffff', color: '#000000', border: '1px solid #cbd5e1', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar medición de referencia como Abierto (OL)"
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

                {/* 1-Click: DATA */}
                <button
                  onClick={() => aplicarTipoRapido('DATA')}
                  style={{ background: '#eab308', color: 'black', border: 'none', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar como Datos / Buses"
                >
                  DATA
                </button>

                {/* Input de Nombre con autodetección */}
                <input
                  value={pinActivoObj.nombre || ''}
                  onChange={(e) => manejarCambioNombre(e.target.value)}
                  placeholder="Nombre_línea..."
                  style={{ background: '#000', color: 'white', border: '1px solid #374151', padding: '4px 8px', borderRadius: '5px', width: '120px', outline: 'none', fontSize: '0.78rem' }}
                  title="Nombre de la línea. Detecta si es VBAT, I2C, NTC, etc."
                />

                {/* Input Manual de Valor de Referencia */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#05070d', border: '1px solid #374151', borderRadius: '5px', padding: '2px 6px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Ref:</span>
                  <input
                    type="text"
                    value={valSanoActivo === '---' ? '' : valSanoActivo}
                    onChange={(e) => actualizarValorReferenciaManual(e.target.value)}
                    placeholder="0.000"
                    style={{ background: 'transparent', color: '#38bdf8', border: 'none', width: '55px', outline: 'none', fontSize: '0.78rem', fontWeight: 'bold', textAlign: 'center' }}
                    title="Escribe manualmente el valor sano de referencia con el teclado"
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
                  valor={pinActivoObj.tipo || 'DATA'}
                  nombreComponente={nombreFpc}
                  idPad={pinActivo}
                  onChange={(val, cat) => {
                    setPines(prev =>
                      prev.map(p =>
                        String(p.id) === String(pinActivo) ? {
                          ...p,
                          tipo: val,
                          categoria: cat || deducirCategoriaNet(val),
                          nombre: val === 'GND' || val === 'NC' ? val : p.nombre
                        } : p
                      )
                    );
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
      <div style={{ marginTop: '16px', backgroundColor: '#0a0d14', borderRadius: '12px', border: '1px solid #1f2937', padding: '12px' }}>
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
                      <td style={{ padding: '6px 8px', color: '#e2e8f0' }}>
                        {p.nombre || 'Línea_' + p.id}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: CATEGORIAS_FPC[p.categoria || deducirCategoriaNet(p.nombre)]?.color || '#374151',
                          color: CATEGORIAS_FPC[p.categoria || deducirCategoriaNet(p.nombre)]?.text || '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 'bold'
                        }}>
                          {p.tipo || 'DATA'}
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
