import React, { useState, useEffect, useMemo } from 'react';
import {
  Save, Cloud, CloudOff, Check, AlertCircle, Shield, Zap, Radio,
  Activity, Cpu, Tag, RotateCcw, Filter, Eye, AlertTriangle,
  CheckCircle2, Lock, Unlock, Edit3, Plus, Trash2
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

// Detección automática inteligente de categoría basada en el nombre de red/línea
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
  const [modoEdicion, setModoEdicion] = useState(modo === 'crear');
  const [filtroSoloFallas, setFiltroSoloFallas] = useState(false);

  // Sincronizar modoEdicion cuando cambie el modo exterior
  useEffect(() => {
    if (modo === 'crear') {
      setModoEdicion(true);
    }
  }, [modo]);

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

  // EVALUACIÓN DIFERENCIAL DE SALUD DEL PIN
  const evaluarSaludPin = (pin) => {
    const vSanoStr = obtenerValSano(pin);
    const vActStr = obtenerValActual(pin);
    const cat = pin.categoria || deducirCategoriaNet(pin.nombre || pin.tipo);

    // En modo Grabar (Placa Buena): ¡NO hay búsqueda de cortos!
    if (modo === 'crear') {
      let bg = pin.colorCustom || CATEGORIAS_FPC[cat]?.color || '#d4af37';
      let text = CATEGORIAS_FPC[cat]?.text || '#000000';

      if (pin.tipo === 'GND') {
        bg = '#4b5563';
        text = '#ffffff';
      } else if (pin.tipo === 'NC') {
        bg = '#1e3a8a';
        text = '#93c5fd';
      } else if (vSanoStr === 'OL') {
        bg = '#ffffff';
        text = '#000000';
      }

      return {
        bg,
        text,
        border: String(pinActivo) === String(pin.id) ? '2px solid #00ffff' : '1px solid #222',
        estado: 'GRABADO',
        badge: 'Grabando Ref.',
        delta: null
      };
    }

    // --- MODO DIAGNÓSTICO (Comparación Diferencial contra Placa Buena) ---
    // Si aún no se mide el pin en esta placa de prueba:
    if (!vActStr || vActStr === '---') {
      const bgBase = pin.colorCustom || CATEGORIAS_FPC[cat]?.color || '#374151';
      return {
        bg: 'rgba(31, 41, 55, 0.7)',
        text: '#9ca3af',
        border: String(pinActivo) === String(pin.id) ? '2px solid #00ffff' : `1px dashed ${bgBase}`,
        estado: 'PENDIENTE',
        badge: 'Pendiente',
        delta: null
      };
    }

    const vActNum = parseFloat(vActStr);
    const vSanoNum = parseFloat(vSanoStr);

    // CASO 1: En la placa buena este pin era GND (o medía ~0V)
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

    // CASO 3: Línea activa normal (ej. 0.450V en diodo, 1.8V en voltaje, etc.)
    // Si la placa averiada marca OL inesperadamente:
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

    // Si la placa averiada cayó a corto (<0.050V) cuando la sana NO era tierra:
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

    // Tolerancia por escala:
    let estaEnTolerancia = false;
    let deltaTexto = '---';

    if (!isNaN(vActNum) && !isNaN(vSanoNum)) {
      const diff = Math.abs(vActNum - vSanoNum);
      if (escala === 'diodo') {
        estaEnTolerancia = diff <= 0.040;
        deltaTexto = `${diff > 0 ? (vActNum > vSanoNum ? '+' : '-') : ''}${diff.toFixed(3)} V`;
      } else if (escala === 'ua') {
        estaEnTolerancia = diff <= 50;
        deltaTexto = `${diff.toFixed(0)} uA`;
      } else if (escala === 'voltio') {
        estaEnTolerancia = diff <= 0.10;
        deltaTexto = `${diff.toFixed(2)} V`;
      } else if (escala === 'ohmio') {
        estaEnTolerancia = diff <= 5.0 || (vSanoNum > 0 && (diff / vSanoNum) <= 0.10);
        deltaTexto = `${diff.toFixed(1)} Ω`;
      } else if (escala === 'amperio') {
        estaEnTolerancia = diff <= 0.05;
        deltaTexto = `${diff.toFixed(3)} A`;
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

    // Fuera de tolerancia pero no corto total: Fuga / Desviación
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

  // ACCIONES RÁPIDAS DE EDICIÓN DE PIN (1-CLICK)
  const aplicarTipoRapido = (tipoDestino) => {
    const cat = tipoDestino === 'GND' || tipoDestino === 'NC' ? 'tierra'
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
          if (modo === 'crear') {
            mod.valorSano = '0.000';
            mod.valorSanoDiodo = '0.000';
          }
        } else if (tipoDestino === 'NC') {
          mod.colorCustom = '#1e3a8a';
          if (modo === 'crear') {
            mod.valorSano = 'OL';
            mod.valorSanoDiodo = 'OL';
          }
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

  const manejarAgregarTipo = () => {
    const nuevoTipo = window.prompt('Ingrese el nombre del nuevo tipo de línea (Ej: I2C, SPI):', '');
    if (nuevoTipo && nuevoTipo.trim() !== '') {
      const tipoLimpio = nuevoTipo.trim().toUpperCase().replace(/\s+/g, '_');
      if (tiposCustom.includes(tipoLimpio)) {
        alert('Este tipo ya existe en la lista.');
        return;
      }
      if (setTiposCustom) {
        setTiposCustom([...tiposCustom, tipoLimpio]);
      }
      aplicarTipoRapido(tipoLimpio);
    }
  };

  // LÍNEAS FILTRADAS PARA LA TABLA DE DIAGNÓSTICO
  const resumenDiagnostico = useMemo(() => {
    let total = pines.length;
    let medidos = 0;
    let normales = 0;
    let fallas = 0;

    const lista = pines.map(p => {
      const salud = evaluarSaludPin(p);
      const valSano = obtenerValSano(p);
      const valAct = obtenerValActual(p);

      const yaMedido = valAct && valAct !== '---';
      if (yaMedido) {
        medidos++;
        if (salud.estado === 'OK') normales++;
        else if (salud.estado === 'FALLA' || salud.estado === 'ALTERADO') fallas++;
      }

      return {
        ...p,
        valSano,
        valAct,
        salud,
        yaMedido
      };
    });

    return { total, medidos, normales, fallas, lista };
  }, [pines, escala, modo]);

  // REINICIAR DIAGNÓSTICO: Limpia los valores medidos en la sesión de prueba sin tocar la placa buena
  const reiniciarDiagnostico = () => {
    if (!window.confirm('¿Deseas reiniciar las mediciones de esta placa averiada? (La placa de referencia se mantendrá intacta).')) return;
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

  // RENDERIZADO DEL PIN FPC FÍSICO
  const renderPin = (pin, esArriba, isExtremo) => {
    const salud = evaluarSaludPin(pin);
    const valSano = obtenerValSano(pin);
    const valAct = obtenerValActual(pin);
    const esActivo = String(pinActivo) === String(pin.id);

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
        {esArriba && <span style={{ fontSize: '0.55rem', color: esActivo ? '#00ffff' : '#6b7280', marginBottom: '2px', fontWeight: esActivo ? 'bold' : 'normal' }}>{pin.id}</span>}
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
          title={`Pin ${pin.id} (${pin.nombre || 'Línea'}) - Ref: ${valSano} | Medido: ${valAct}`}
        >
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 'bold',
              lineHeight: 1
            }}
          >
            {valorTexto || '---'}
          </span>
          {modo === 'diagnostico' && valAct === '---' && valSano !== '---' && (
            <span style={{ fontSize: '0.5rem', opacity: 0.6, marginTop: '1px' }}>
              {formNum(valSano, pin.tipo)}
            </span>
          )}
        </div>
        {!esArriba && <span style={{ fontSize: '0.55rem', color: esActivo ? '#00ffff' : '#6b7280', marginTop: '2px', fontWeight: esActivo ? 'bold' : 'normal' }}>{pin.id}</span>}
      </div>
    );
  };

  const pinActivoObj = pines.find(p => String(p.id) === String(pinActivo)) || pines[0] || {};
  const saludActivo = evaluarSaludPin(pinActivoObj);
  const valSanoActivo = obtenerValSano(pinActivoObj);
  const valActActivo = obtenerValActual(pinActivoObj);
  const unidadEscala = escala === 'diodo' ? 'V' : escala === 'ua' ? 'uA' : escala === 'voltio' ? 'V' : escala === 'ohmio' ? 'Ω' : 'A';

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

      {/* --- BARRA SUPERIOR: ESTADO DE REFERENCIA Y CONTROLES DE MODO --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {modo === 'diagnostico' ? (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.75rem', color: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '5px 12px', borderRadius: '20px',
              fontWeight: 'bold'
            }}>
              <Shield size={14} color="#10b981" />
              PLACA BUENA PROTEGIDA (GOLDEN LOCK 🔒)
            </span>
          ) : (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.75rem', color: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: '5px 12px', borderRadius: '20px',
              fontWeight: 'bold'
            }}>
              <Edit3 size={14} color="#8b5cf6" />
              MODO GRABAR PLACA BUENA (REFERENCIA)
            </span>
          )}

          {/* Toggle de Modo Edición de Pinout */}
          <button
            onClick={() => setModoEdicion(!modoEdicion)}
            style={{
              background: modoEdicion ? '#374151' : 'transparent',
              color: modoEdicion ? '#f3f4f6' : '#9ca3af',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Activar/desactivar panel para renombrar líneas y asignar tipos"
          >
            {modoEdicion ? <Unlock size={13} color="#eab308" /> : <Lock size={13} />}
            {modoEdicion ? 'Ocultar Editor de Pines' : '✏️ Editar Nombres y Tipos'}
          </button>
        </div>

        {/* Botón Guardar en Nube (Solo disponible en Modo Crear/Grabar) */}
        {modo === 'crear' && onGuardar && (
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
            {cambiosPendientes ? <CloudOff size={15} /> : <Cloud size={15} />}
            {guardando ? 'GUARDANDO...' : (cambiosPendientes ? 'SINCRONIZAR AHORA' : 'GUARDADO EN NUBE')}
          </button>
        )}

        {/* En Modo Diagnóstico: Botón de Reiniciar Prueba */}
        {modo === 'diagnostico' && (
          <button
            onClick={reiniciarDiagnostico}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Limpia las mediciones de la placa averiada para iniciar una nueva"
          >
            <RotateCcw size={13} />
            Reiniciar Diagnóstico
          </button>
        )}
      </div>

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

      {/* --- TARJETA DE COMPARACIÓN EN VIVO (PIN ACTIVO) --- */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          {/* Identificación del Pin */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              {saludActivo.badge && (
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

            {/* BARRA DE EDICIÓN RÁPIDA (ACCIONES 1-CLICK Y AUTODETECCIÓN) */}
            {modoEdicion && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* 1-Click: GND */}
                <button
                  onClick={() => aplicarTipoRapido('GND')}
                  style={{ background: '#4b5563', color: 'white', border: 'none', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar como Tierra (GND)"
                >
                  GND
                </button>

                {/* 1-Click: NC */}
                <button
                  onClick={() => aplicarTipoRapido('NC')}
                  style={{ background: '#1e3a8a', color: '#93c5fd', border: 'none', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar como No Conectado (NC)"
                >
                  NC
                </button>

                {/* 1-Click: OL (Blanco con texto negro) */}
                <button
                  onClick={() => {
                    if (modo === 'crear') {
                      setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, valorSano: 'OL', valorSanoDiodo: 'OL' } : p));
                    } else if (onRegistrarOL) {
                      onRegistrarOL();
                    }
                  }}
                  style={{ background: '#ffffff', color: '#000000', border: '1px solid #cbd5e1', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar como Circuito Abierto (OL)"
                >
                  OL
                </button>

                {/* 1-Click: VCC */}
                <button
                  onClick={() => aplicarTipoRapido('VCC')}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 9px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Marcar como Alimentación (VCC)"
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

                {/* Input de Nombre con autodetección de categoría */}
                <input
                  value={pinActivoObj.nombre || ''}
                  onChange={(e) => manejarCambioNombre(e.target.value)}
                  placeholder="Nombre_línea..."
                  style={{ background: '#000', color: 'white', border: '1px solid #374151', padding: '5px 8px', borderRadius: '5px', width: '130px', outline: 'none', fontSize: '0.78rem' }}
                  title="Escribe el nombre: detectará automáticamente si es VCC, I2C, NTC, etc."
                />

                {/* Paleta de Color personalizado */}
                <input
                  type="color"
                  value={pinActivoObj.colorCustom || '#d4af37'}
                  onChange={(e) => setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, colorCustom: e.target.value } : p))}
                  style={{ padding: '0', border: 'none', borderRadius: '4px', width: '26px', height: '26px', cursor: 'pointer', background: 'transparent' }}
                  title="Personalizar color del pin"
                />

                {/* Modal Catálogo Completo (SelectorTipoLinea) */}
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
                  onAgregarTipo={manejarAgregarTipo}
                  onEliminarTipo={(tipo) => setTiposCustom && setTiposCustom(tiposCustom.filter(t => t !== tipo))}
                />

                {/* Eliminar Pin (Solo en modo crear) */}
                {modo === 'crear' && (
                  <button
                    onClick={() => {
                      if (pines.length <= 1) return alert('No puedes eliminar el último pin.');
                      if (!window.confirm('¿Seguro de eliminar este pin?')) return;
                      setPines(prev => {
                        const nuevos = prev.filter(p => String(p.id) !== String(pinActivo));
                        return nuevos.map((p, i) => ({ ...p, id: i + 1 }));
                      });
                      setPinActivo(1);
                    }}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.7rem' }}
                    title="Eliminar este pin"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Comparación Numérica Lado a Lado */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.7rem', display: 'block' }}>
                PLACA BUENA (REF)
              </span>
              <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>
                {valSanoActivo} {valSanoActivo !== '---' && valSanoActivo !== 'OL' ? unidadEscala : ''}
              </strong>
            </div>

            <div style={{ width: '1px', height: '35px', backgroundColor: '#374151' }} />

            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.7rem', display: 'block' }}>
                PLACA EN PRUEBA
              </span>
              <strong style={{ color: saludActivo.bg === '#10b981' ? '#10b981' : saludActivo.bg === '#ef4444' ? '#ef4444' : '#ffffff', fontSize: '1.3rem' }}>
                {String(pinActivo) === String(pinActivoObj.id) && lecturaEnVivo !== '----' && valActActivo === '---'
                  ? `${lecturaEnVivo} (En vivo)`
                  : `${valActActivo} ${valActActivo !== '---' && valActActivo !== 'OL' ? unidadEscala : ''}`}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* --- PANEL INFERIOR DE HALLAZGOS Y DISCREPANCIAS (OPCIÓN C) --- */}
      {modo === 'diagnostico' && (
        <div style={{ marginTop: '16px', backgroundColor: '#0a0d14', borderRadius: '12px', border: '1px solid #1f2937', padding: '12px' }}>
          {/* Barra de Estadísticas y Filtros */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 'bold' }}>
                Medidos: <strong style={{ color: '#ffffff' }}>{resumenDiagnostico.medidos}/{resumenDiagnostico.total}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>
                ✅ Normales: {resumenDiagnostico.normales}
              </span>
              <span style={{ fontSize: '0.8rem', color: resumenDiagnostico.fallas > 0 ? '#ef4444' : '#6b7280', fontWeight: 'bold' }}>
                ⚠️ Anomalías: {resumenDiagnostico.fallas}
              </span>
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

          {/* Tabla de Resultados */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af', textAlign: 'left' }}>
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
                        <td style={{ padding: '6px 8px', color: '#38bdf8', fontWeight: 'bold' }}>
                          {p.valSano}
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: p.salud.bg === '#10b981' ? '#10b981' : p.salud.bg === '#ef4444' ? '#ef4444' : '#e2e8f0' }}>
                          {p.valAct}
                        </td>
                        <td style={{ padding: '6px 8px', color: '#9ca3af' }}>
                          {p.salud.delta || '---'}
                        </td>
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
                🎉 No se han detectado anomalías en los pines medidos hasta ahora.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
