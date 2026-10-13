import React, { useState } from 'react';
import {
  Save, Cloud, CloudOff, Check, AlertCircle, Zap, Sliders, Plus, Minus,
  Layers, Sparkles, CheckCircle2, RotateCcw, ArrowLeftRight, ArrowUpDown,
  Eye, Cpu
} from 'lucide-react';
import SelectorTipoLinea from './SelectorTipoLinea.js';

export const PRESETS_BATERIA = [
  {
    id: 'android_hibrido_10p',
    nombre: 'Android Híbrido Moderno (10P)',
    desc: '2 Lugs de potencia (VBAT, GND) + 8 pines internos delgados (ID, NTC, I2C, THERM, CELL_BAL, DET) - Como Xiaomi, Samsung, Oppo',
    estilo: 'hibrido',
    pines: [
      { id: 1, nombre: 'VBAT', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' },
      { id: 3, nombre: 'BOARD_ID', tipo: 'BOARD_ID', colorCustom: '#3b82f6', grosor: 'delgado' },
      { id: 4, nombre: 'CHG_THERM', tipo: 'CHG_THERM', colorCustom: '#06b6d4', grosor: 'delgado' },
      { id: 5, nombre: 'I2C_SDA', tipo: 'I2C_SDA', colorCustom: '#eab308', grosor: 'delgado' },
      { id: 6, nombre: 'I2C_SCL', tipo: 'I2C_SCL', colorCustom: '#a855f7', grosor: 'delgado' },
      { id: 7, nombre: 'USB_THERM', tipo: 'USB_THERM', colorCustom: '#06b6d4', grosor: 'delgado' },
      { id: 8, nombre: 'BATT_ISENSE', tipo: 'BATT_ISENSE', colorCustom: '#06b6d4', grosor: 'delgado' },
      { id: 9, nombre: 'JACK_DET', tipo: 'JACK_DET', colorCustom: '#f59e0b', grosor: 'delgado' },
      { id: 10, nombre: 'NC', tipo: 'NC', colorCustom: '#1e3a8a', grosor: 'delgado' }
    ]
  },
  {
    id: 'android_hibrido_8p',
    nombre: 'Android Híbrido Estándar (8P)',
    desc: '2 Lugs de potencia laterales + 6 pines centrales delgados (BOARD_ID, CHG_THERM, I2C, USB_THERM, NC)',
    estilo: 'hibrido',
    pines: [
      { id: 1, nombre: 'VBAT', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' },
      { id: 3, nombre: 'BOARD_ID', tipo: 'BOARD_ID', colorCustom: '#3b82f6', grosor: 'delgado' },
      { id: 4, nombre: 'CHG_THERM', tipo: 'CHG_THERM', colorCustom: '#06b6d4', grosor: 'delgado' },
      { id: 5, nombre: 'I2C_SDA', tipo: 'I2C_SDA', colorCustom: '#eab308', grosor: 'delgado' },
      { id: 6, nombre: 'I2C_SCL', tipo: 'I2C_SCL', colorCustom: '#a855f7', grosor: 'delgado' },
      { id: 7, nombre: 'USB_THERM', tipo: 'USB_THERM', colorCustom: '#06b6d4', grosor: 'delgado' },
      { id: 8, nombre: 'NC', tipo: 'NC', colorCustom: '#1e3a8a', grosor: 'delgado' }
    ]
  },
  {
    id: 'android_hibrido_6p',
    nombre: 'Android Híbrido Compacto (6P)',
    desc: '2 Lugs de potencia laterales + 4 pines centrales delgados (ID, NTC, SDA, SCL)',
    estilo: 'hibrido',
    pines: [
      { id: 1, nombre: 'VBAT', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' },
      { id: 3, nombre: 'BATT_ID', tipo: 'ID', colorCustom: '#3b82f6', grosor: 'delgado' },
      { id: 4, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981', grosor: 'delgado' },
      { id: 5, nombre: 'I2C_SDA', tipo: 'I2C_SDA', colorCustom: '#eab308', grosor: 'delgado' },
      { id: 6, nombre: 'I2C_SCL', tipo: 'I2C_SCL', colorCustom: '#a855f7', grosor: 'delgado' }
    ]
  },
  {
    id: 'iphone_clasico',
    nombre: 'iPhone Clásico (6P)',
    desc: 'Lugs laterales de potencia (VBAT, GND) + 4 señales centrales (SWI, NTC, I2C)',
    estilo: 'hibrido',
    pines: [
      { id: 1, nombre: 'VBAT', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' },
      { id: 3, nombre: 'BATT_SWI', tipo: 'SWI', colorCustom: '#3b82f6', grosor: 'delgado' },
      { id: 4, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981', grosor: 'delgado' },
      { id: 5, nombre: 'I2C_SDA', tipo: 'I2C_SDA', colorCustom: '#eab308', grosor: 'delgado' },
      { id: 6, nombre: 'I2C_SCL', tipo: 'I2C_SCL', colorCustom: '#a855f7', grosor: 'delgado' }
    ]
  },
  {
    id: 'android_std_4p',
    nombre: 'Android Estándar (4P)',
    desc: 'Conector doble fila simétrico (VBAT, ID, NTC, GND)',
    estilo: 'doble_fila',
    pines: [
      { id: 1, nombre: 'VBAT', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'BATT_ID', tipo: 'ID', colorCustom: '#3b82f6', grosor: 'delgado' },
      { id: 3, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981', grosor: 'delgado' },
      { id: 4, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' }
    ]
  },
  {
    id: 'android_b2b_6p',
    nombre: 'Android B2B (6P)',
    desc: 'Doble fila con pines dobles de potencia para mayor corriente',
    estilo: 'doble_fila',
    pines: [
      { id: 1, nombre: 'VBAT_1', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'VBAT_2', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 3, nombre: 'BATT_ID', tipo: 'ID', colorCustom: '#3b82f6', grosor: 'delgado' },
      { id: 4, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981', grosor: 'delgado' },
      { id: 5, nombre: 'GND_1', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' },
      { id: 6, nombre: 'GND_2', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' }
    ]
  },
  {
    id: 'android_b2b_8p',
    nombre: 'Android B2B Completo (8P)',
    desc: 'Doble fila con bus I2C, ID, Termistor NTC y pines dobles de masa/potencia',
    estilo: 'doble_fila',
    pines: [
      { id: 1, nombre: 'VBAT_1', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'VBAT_2', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 3, nombre: 'BATT_ID', tipo: 'ID', colorCustom: '#3b82f6', grosor: 'delgado' },
      { id: 4, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981', grosor: 'delgado' },
      { id: 5, nombre: 'I2C_SDA', tipo: 'I2C_SDA', colorCustom: '#eab308', grosor: 'delgado' },
      { id: 6, nombre: 'I2C_SCL', tipo: 'I2C_SCL', colorCustom: '#a855f7', grosor: 'delgado' },
      { id: 7, nombre: 'GND_1', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' },
      { id: 8, nombre: 'GND_2', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' }
    ]
  },
  {
    id: 'fast_charge_10p',
    nombre: 'Carga Rápida / Doble Celda (10P)',
    desc: 'Xiaomi 120W, Oppo VOOC, Samsung Ultra (2 Celdas + SMBus)',
    estilo: 'doble_fila',
    pines: [
      { id: 1, nombre: 'VBAT_C1', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'VBAT_C2', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 3, nombre: 'FAST_ID', tipo: 'ID', colorCustom: '#3b82f6', grosor: 'delgado' },
      { id: 4, nombre: 'TEMP_NTC', tipo: 'NTC', colorCustom: '#10b981', grosor: 'delgado' },
      { id: 5, nombre: 'SMB_SDA', tipo: 'I2C_SDA', colorCustom: '#eab308', grosor: 'delgado' },
      { id: 6, nombre: 'SMB_SCL', tipo: 'I2C_SCL', colorCustom: '#a855f7', grosor: 'delgado' },
      { id: 7, nombre: 'CELL_BAL', tipo: 'DATA', colorCustom: '#06b6d4', grosor: 'delgado' },
      { id: 8, nombre: 'NC', tipo: 'NC', colorCustom: '#1e3a8a', grosor: 'delgado' },
      { id: 9, nombre: 'GND_1', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' },
      { id: 10, nombre: 'GND_2', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' }
    ]
  },
  {
    id: 'fila_simple_3p',
    nombre: 'Láminas / Espadines (3P)',
    desc: 'Contactos planos o resortes lineales (VBAT, BSI/NTC, GND)',
    estilo: 'fila_simple',
    pines: [
      { id: 1, nombre: 'VBAT+', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'BSI_NTC', tipo: 'NTC', colorCustom: '#10b981', grosor: 'delgado' },
      { id: 3, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' }
    ]
  },
  {
    id: 'fila_simple_4p',
    nombre: 'Láminas / Espadines (4P)',
    desc: 'Contactos lineales directos (VBAT, BSI, NTC, GND)',
    estilo: 'fila_simple',
    pines: [
      { id: 1, nombre: 'VBAT+', tipo: 'VBAT', colorCustom: '#ef4444', grosor: 'grueso' },
      { id: 2, nombre: 'BSI_ID', tipo: 'ID', colorCustom: '#3b82f6', grosor: 'delgado' },
      { id: 3, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981', grosor: 'delgado' },
      { id: 4, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563', grosor: 'grueso' }
    ]
  }
];

export default function FPCBateria({
  pines = [],
  setPines,
  pinActivo = 1,
  setPinActivo,
  modo = 'diagnostico',
  escala = 'diodo',
  lecturaEnVivo,
  tiposCustom = [],
  setTiposCustom,
  onGuardar,
  cambiosPendientes = false,
  guardando = false,
  ultimaSincronizacion = null,
  esIPhone = false,
  estiloLayout = 'hibrido',
  onCambiarEstiloLayout,
  onCambiarNumPines,
  onAplicarPreset,
  onRestablecerOriginal,
  onRegistrarOL
}) {
  const [modalPresetsAbierto, setModalPresetsAbierto] = useState(false);

  // Estados interactivos para orientación y visualización
  const [espejoH, setEspejoH] = useState(false); // Invertir horizontalmente (Flex ↔ Placa)
  const [espejoV, setEspejoV] = useState(false); // Invertir verticalmente (Fila superior ↔ inferior)
  const [modoVista, setModoVista] = useState('ambos'); // 'ambos' | 'nombres' | 'valores'

  // Determinación del estilo activo (hibrido, doble_fila, fila_simple)
  const estiloActivo = estiloLayout || 'hibrido';

  const manejarCambiarEstilo = (nuevoEstilo) => {
    if (onCambiarEstiloLayout) {
      onCambiarEstiloLayout(nuevoEstilo);
    }
  };

  const manejarCambioPines = (nuevaCant) => {
    const num = Math.max(2, Math.min(24, parseInt(nuevaCant, 10) || 2));
    if (onCambiarNumPines) {
      onCambiarNumPines(num);
    } else if (setPines) {
      if (num > pines.length) {
        const nuevos = Array.from({ length: num - pines.length }, (_, idx) => {
          const nuevoId = pines.length + idx + 1;
          return {
            id: nuevoId,
            nombre: '',
            tipo: 'DATA',
            grosor: nuevoId <= 2 ? 'grueso' : 'delgado',
            valorSanoDiodo: '---',
            valorSanoUa: '---',
            valorSanoOhmio: '---',
            valorActualDiodo: '---',
            valorActualUa: '---',
            valorActualOhmio: '---',
            valorSano: '---',
            valorActual: '---'
          };
        });
        setPines([...pines, ...nuevos]);
      } else if (num < pines.length) {
        setPines(pines.slice(0, num));
        if (Number(pinActivo) > num) {
          setPinActivo(1);
        }
      }
    }
  };

  // Intercambiar permanentemente los dos Lugs laterales (Pin 1 y Pin 2)
  const manejarInvertirLugs = () => {
    if (pines.length < 2) return;
    const pin1 = pines.find(p => Number(p.id) === 1);
    const pin2 = pines.find(p => Number(p.id) === 2);
    if (!pin1 || !pin2) return;

    setPines(prev => prev.map(p => {
      if (Number(p.id) === 1) {
        return {
          ...p,
          nombre: pin2.nombre,
          tipo: pin2.tipo,
          colorCustom: pin2.colorCustom,
          grosor: pin2.grosor || 'grueso',
          valorSanoDiodo: pin2.valorSanoDiodo,
          valorSanoUa: pin2.valorSanoUa,
          valorSanoOhmio: pin2.valorSanoOhmio,
          valorActualDiodo: pin2.valorActualDiodo,
          valorActualUa: pin2.valorActualUa,
          valorActualOhmio: pin2.valorActualOhmio,
          valorSano: pin2.valorSano,
          valorActual: pin2.valorActual
        };
      }
      if (Number(p.id) === 2) {
        return {
          ...p,
          nombre: pin1.nombre,
          tipo: pin1.tipo,
          colorCustom: pin1.colorCustom,
          grosor: pin1.grosor || 'grueso',
          valorSanoDiodo: pin1.valorSanoDiodo,
          valorSanoUa: pin1.valorSanoUa,
          valorSanoOhmio: pin1.valorSanoOhmio,
          valorActualDiodo: pin1.valorActualDiodo,
          valorActualUa: pin1.valorActualUa,
          valorActualOhmio: pin1.valorActualOhmio,
          valorSano: pin1.valorSano,
          valorActual: pin1.valorActual
        };
      }
      return p;
    }));
  };

  // Cambiar en lote grosor de los pines centrales
  const manejarCentralesDelgados = () => {
    setPines(prev => prev.map(p => Number(p.id) >= 3 ? { ...p, grosor: 'delgado' } : p));
  };

  const manejarTodosGruesos = () => {
    setPines(prev => prev.map(p => ({ ...p, grosor: 'grueso' })));
  };

  const manejarAgregarTipo = () => {
    const nuevoTipo = window.prompt('Ingrese el nombre del nuevo tipo de línea (Ej: I2C, SPI):', '');
    if (nuevoTipo && nuevoTipo.trim() !== '') {
      const tipoLimpio = nuevoTipo.trim().toUpperCase().replace(/\s+/g, '_');
      if (['DATA', 'VCC', 'GND', 'NC', 'VBAT', 'VBUS', 'PP_BATT', 'I2C', 'SPI', 'RFFE', 'SWI', 'UART', 'SDA', 'SCL', 'CLK', 'RESET', 'ENABLE', 'INT', 'NTC', 'ID'].includes(tipoLimpio) || tiposCustom.includes(tipoLimpio)) {
        alert('Este tipo ya existe en la lista.');
        return;
      }
      if (setTiposCustom) {
        setTiposCustom([...tiposCustom, tipoLimpio]);
        setPines(prev => prev.map(p =>
          String(p.id) === String(pinActivo) ? { ...p, tipo: tipoLimpio, nombre: tipoLimpio } : p
        ));
      }
    }
  };

  const obtenerColorPin = (pin) => {
    if (!pin) return '#d4af37';
    const colorBase = pin.colorCustom || '#d4af37';

    if (modo === 'crear') {
      if (String(pinActivo) === String(pin.id)) return '#00ffff';
      if (pin.tipo === 'GND') return '#4b5563';
      if (pin.tipo === 'NC') return '#1e3a8a';
      if (pin.tipo === 'VCC' || pin.tipo === 'VBAT' || pin.tipo === 'PP_BATT') return '#ef4444';
      if (/(THERM|SENSE|ISENSE|CSENSE|_ADC$|ADC_|JACK_DET|EAR_DET|BOARD_ID)/i.test(pin.tipo || '')) return pin.colorCustom || '#06b6d4';
      return colorBase;
    }

    if (pin.tipo === 'GND') return '#4b5563';
    if (pin.tipo === 'NC') return '#1e3a8a';

    let valActual = '---';
    let valSano = '---';

    if (escala === 'diodo') {
      valActual = pin.valorActualDiodo !== undefined ? pin.valorActualDiodo : pin.valorActual;
      valSano = pin.valorSanoDiodo !== undefined ? pin.valorSanoDiodo : pin.valorSano;
    } else if (escala === 'ua') {
      valActual = pin.valorActualUa !== undefined ? pin.valorActualUa : '---';
      valSano = pin.valorSanoUa !== undefined ? pin.valorSanoUa : '---';
    } else if (escala === 'ohmio') {
      valActual = pin.valorActualOhmio !== undefined ? pin.valorActualOhmio : '---';
      valSano = pin.valorSanoOhmio !== undefined ? pin.valorSanoOhmio : '---';
    }

    if (!valActual || valActual === '---') return colorBase;
    if (valActual === 'OL' && valSano !== 'OL') return '#f97316';

    const vAct = parseFloat(valActual);
    const vSano = parseFloat(valSano);

    if (escala === 'diodo') {
      if (vAct < 0.050) return '#ef4444';
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 0.040) return '#10b981';
    } else if (escala === 'ua') {
      if (vAct > 2000) return '#ef4444';
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 50) return '#10b981';
    } else if (escala === 'ohmio') {
      if (vAct < 2.0 && vSano > 10.0) return '#ef4444';
      if (!isNaN(vAct) && !isNaN(vSano) && (Math.abs(vAct - vSano) <= 5.0 || Math.abs(vAct - vSano) / vSano <= 0.1)) return '#10b981';
    }
    return '#eab308';
  };

  const formNum = (val, tipo) => {
    if (tipo === 'GND') return 'GND';
    if (tipo === 'NC') return 'NC';
    if (!val || val === '---') return '';
    if (val === 'OL') return 'OL';
    return val.startsWith('0.') ? val.substring(1) : val;
  };

  const activePinInfo = pines.find(p => String(p.id) === String(pinActivo)) || {};

  const tiempoRelativo = (fecha) => {
    if (!fecha) return '';
    const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
    if (segundos < 60) return `hace ${segundos}s`;
    if (segundos < 3600) return `hace ${Math.floor(segundos / 60)}min`;
    return `hace ${Math.floor(segundos / 3600)}h`;
  };

  // ==========================================
  // RENDERIZADO PARAMÉTRICO DE LOS CONECTORES
  // ==========================================

  // 1. DIBUJO ESTILO HÍBRIDO (LUGS LATERALES DE POTENCIA + PINES CENTRALES)
  const drawHibrido = () => {
    const rawPinesCentro = pines.filter(p => Number(p.id) >= 3);
    const pin1Raw = pines.find(p => Number(p.id) === 1) || { id: 1, tipo: 'VBAT', nombre: 'VBAT', grosor: 'grueso' };
    const pin2Raw = pines.find(p => Number(p.id) === 2) || { id: 2, tipo: 'GND', nombre: 'GND', grosor: 'grueso' };

    // Si modo espejo está activo, intercambiamos visualmente Lug 1 y Lug 2
    const lugIzquierdo = espejoH ? pin2Raw : pin1Raw;
    const lugDerecho = espejoH ? pin1Raw : pin2Raw;

    const renderLug = (pin, isLeft) => {
      const isAct = String(pin.id) === String(pinActivo);
      const pinColor = obtenerColorPin(pin);
      const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
      const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
      const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);
      const nombreMostrar = pin.nombre || pin.tipo || '---';

      const pathD = isLeft
        ? "M 32 38 L 96 38 L 96 66 L 72 66 L 72 134 L 96 134 L 96 162 L 32 162 Z"
        : "M 488 38 L 424 38 L 424 66 L 448 66 L 448 134 L 424 134 L 424 162 L 488 162 Z";

      // Centro del lomo vertical del Lug (donde hay 124px de altura continua)
      const lugCenterX = isLeft ? 52 : 468;
      const lugCenterY = 100;

      // Determinación del texto a mostrar de forma vertical
      let textoLug = nombreMostrar;
      if (modoVista === 'valores') {
        textoLug = textVal || nombreMostrar;
      } else if (modoVista === 'ambos') {
        if (textVal && textVal !== nombreMostrar) {
          textoLug = `${nombreMostrar}  •  ${textVal}`;
        } else {
          textoLug = nombreMostrar;
        }
      }

      return (
        <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
          {/* Base del lug metálico */}
          <path
            d={pathD}
            fill={isAct ? 'none' : pinColor}
            fillOpacity={isAct ? 0 : 0.88}
            stroke={isAct ? '#00ffff' : '#d4af37'}
            strokeWidth={isAct ? 4 : 2}
            filter={isAct ? 'url(#glowBateria)' : 'none'}
            style={{ transition: 'all 0.2s' }}
          />
          {isAct && (
            <path
              d={pathD}
              fill={pinColor}
              fillOpacity={0.92}
            />
          )}

          {/* Etiqueta superior del Pin */}
          <text x={lugCenterX} y="28" fill={isAct ? '#00ffff' : '#9ca3af'} fontSize="9.5" fontWeight="bold" textAnchor="middle">
            PIN {pin.id}
          </text>

          {/* TEXTO VERTICAL DENTRO DEL LUG (GND / VBAT / VALOR) */}
          <text
            x={lugCenterX}
            y={lugCenterY}
            transform={`rotate(-90 ${lugCenterX} ${lugCenterY})`}
            fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')}
            fontSize={textoLug.length > 11 ? "9.5" : "11"}
            fontWeight="900"
            letterSpacing="0.8px"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ pointerEvents: 'none' }}
          >
            {textoLug}
          </text>
        </g>
      );
    };

    return (
      <svg viewBox="0 0 520 200" style={{ width: '100%', height: 'auto', maxHeight: '240px', display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="hibridoBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e1e24" />
            <stop offset="100%" stopColor="#0d0d10" />
          </linearGradient>
          <linearGradient id="innerCavityHibrido" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#050505" />
            <stop offset="100%" stopColor="#151515" />
          </linearGradient>
          <filter id="glowBateria" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Chasis exterior del conector */}
        <rect x="10" y="10" width="500" height="180" rx="12" fill="url(#hibridoBgGrad)" stroke="#2f2f37" strokeWidth="3" />
        <rect x="22" y="22" width="476" height="156" rx="9" fill="url(#innerCavityHibrido)" stroke="#1a1a20" strokeWidth="2" />

        {/* Cavidad interna central plástica */}
        <rect x="106" y="36" width="308" height="128" rx="5" fill="#08080a" stroke="#222" strokeWidth="1.5" />

        {/* NERVADURA / GUÍA CENTRAL PLÁSTICA NEGRA (IDÉNTICA A LA FOTO DE MICROSCOPIO) */}
        <rect x="110" y="93" width="300" height="14" rx="2" fill="#000000" stroke="#1c1c22" strokeWidth="1" />
        <line x1="114" y1="100" x2="406" y2="100" stroke="#2a2a30" strokeWidth="1.5" strokeDasharray="6 3" />

        {/* Brackets de potencia (PIN 1 y PIN 2) */}
        {renderLug(lugIzquierdo, true)}
        {pines.length >= 2 && renderLug(lugDerecho, false)}

        {/* Pines Centrales Paramétricos (PIN 3..N) */}
        {(() => {
          if (rawPinesCentro.length === 0) return null;

          if (rawPinesCentro.length <= 2) {
            // Distribución en 1 sola fila horizontal centrada
            let arr = [...rawPinesCentro];
            if (espejoH) arr.reverse();

            const colW = Math.min(120, Math.floor(280 / arr.length));
            const startX = 120 + Math.floor((280 - (arr.length * colW)) / 2);

            return arr.map((pin, i) => {
              const isAct = String(pin.id) === String(pinActivo);
              const pinColor = obtenerColorPin(pin);
              const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
              const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
              const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);
              const nombreMostrar = pin.nombre || pin.tipo || '---';

              const esDelgado = (pin.grosor || 'delgado') === 'delgado';
              const colCenterX = startX + i * colW + colW / 2;
              const pinW = esDelgado ? 22 : colW - 14;
              const x = colCenterX - pinW / 2;
              const y = 72;
              const h = 56;

              return (
                <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
                  <rect
                    x={x} y={y} width={pinW} height={h} rx={esDelgado ? 4 : 6}
                    fill={isAct ? 'none' : pinColor} fillOpacity={isAct ? 0 : 0.88}
                    stroke={isAct ? '#00ffff' : '#b2922e'} strokeWidth={isAct ? 4 : 2}
                    filter={isAct ? 'url(#glowBateria)' : 'none'} style={{ transition: 'all 0.2s' }}
                  />
                  {isAct && <rect x={x} y={y} width={pinW} height={h} rx={esDelgado ? 4 : 6} fill={pinColor} fillOpacity={0.92} />}
                  <text x={colCenterX} y="64" fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">PIN {pin.id}</text>
                  <text x={colCenterX} y={y + 32} fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                    {modoVista === 'valores' ? (textVal || nombreMostrar) : nombreMostrar}
                  </text>
                </g>
              );
            });
          }

          // Distribución en 2 filas (Superior / Inferior)
          const half = Math.ceil(rawPinesCentro.length / 2);
          let topPins = rawPinesCentro.slice(0, half);
          let botPins = rawPinesCentro.slice(half);

          // Si espejo vertical está activo, intercambiamos filas
          if (espejoV) {
            const temp = topPins;
            topPins = botPins;
            botPins = temp;
          }

          // Si espejo horizontal está activo, invertimos columnas de izquierda a derecha
          if (espejoH) {
            topPins = [...topPins].reverse();
            botPins = [...botPins].reverse();
          }

          const renderFilaCentro = (arrPines, isTop) => {
            const count = arrPines.length;
            const colW = Math.min(74, Math.floor(290 / count));
            const startX = 115 + Math.floor((290 - (count * colW)) / 2);
            const y = isTop ? 42 : 112;
            const pinH = 46;
            const numY = isTop ? 34 : 172;

            return arrPines.map((pin, i) => {
              const isAct = String(pin.id) === String(pinActivo);
              const pinColor = obtenerColorPin(pin);
              const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
              const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
              const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);
              const nombreMostrar = pin.nombre || pin.tipo || '---';

              const colCenterX = startX + i * colW + colW / 2;
              // Si no tiene grosor explícito, por defecto los pines internos son DELGADOS (como en la foto 2 de Android)
              const esDelgado = (pin.grosor || 'delgado') === 'delgado';
              const pinW = esDelgado ? 20 : Math.min(56, colW - 8);
              const x = colCenterX - pinW / 2;

              return (
                <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
                  {/* Espadín / Contacto metálico */}
                  <rect
                    x={x}
                    y={y}
                    width={pinW}
                    height={pinH}
                    rx={esDelgado ? 3 : 5}
                    fill={isAct ? 'none' : pinColor}
                    fillOpacity={isAct ? 0 : 0.88}
                    stroke={isAct ? '#00ffff' : '#b2922e'}
                    strokeWidth={isAct ? 3.5 : 1.8}
                    filter={isAct ? 'url(#glowBateria)' : 'none'}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {isAct && (
                    <rect
                      x={x}
                      y={y}
                      width={pinW}
                      height={pinH}
                      rx={esDelgado ? 3 : 5}
                      fill={pinColor}
                      fillOpacity={0.92}
                    />
                  )}

                  {/* Ranura central de contacto microscópico (para simular el contacto blade dorado) */}
                  {esDelgado && (
                    <line
                      x1={colCenterX}
                      y1={y + 6}
                      x2={colCenterX}
                      y2={y + pinH - 6}
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Número del Pin */}
                  <text
                    x={colCenterX}
                    y={numY}
                    fill={isAct ? '#00ffff' : '#9ca3af'}
                    fontSize="8.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    P{pin.id}
                  </text>

                  {/* NOMBRE DE LA LÍNEA DENTRO DEL PIN */}
                  {esDelgado ? (
                    // Pin Delgado: Si el nombre es corto cabe horizontal, si es largo se muestra en texto vertical
                    (() => {
                      const txt = modoVista === 'valores' ? (textVal || nombreMostrar) : nombreMostrar;
                      const esLargo = txt.length > 4;

                      if (esLargo && modoVista !== 'valores') {
                        return (
                          <text
                            x={colCenterX}
                            y={y + pinH / 2}
                            transform={`rotate(-90 ${colCenterX} ${y + pinH / 2})`}
                            fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')}
                            fontSize="7.5"
                            fontWeight="900"
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={{ pointerEvents: 'none' }}
                          >
                            {txt}
                          </text>
                        );
                      }

                      return (
                        <text
                          x={colCenterX}
                          y={y + 26}
                          fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')}
                          fontSize={esLargo ? "6.8" : "8"}
                          fontWeight="bold"
                          textAnchor="middle"
                          style={{ pointerEvents: 'none' }}
                        >
                          {txt}
                        </text>
                      );
                    })()
                  ) : (
                    // Pin Grueso: Nombre arriba y valor abajo
                    <>
                      <text
                        x={colCenterX}
                        y={modoVista === 'valores' ? y + 27 : y + 22}
                        fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')}
                        fontSize="8.8"
                        fontWeight="bold"
                        textAnchor="middle"
                        style={{ pointerEvents: 'none' }}
                      >
                        {modoVista === 'valores' ? (textVal || nombreMostrar) : nombreMostrar}
                      </text>
                      {modoVista !== 'nombres' && textVal && textVal !== nombreMostrar && (
                        <text
                          x={colCenterX}
                          y={y + 35}
                          fill={isAct ? '#111' : '#f59e0b'}
                          fontSize="7.8"
                          fontWeight="bold"
                          textAnchor="middle"
                          style={{ pointerEvents: 'none' }}
                        >
                          {textVal}
                        </text>
                      )}
                    </>
                  )}
                </g>
              );
            });
          };

          return (
            <>
              {renderFilaCentro(topPins, true)}
              {renderFilaCentro(botPins, false)}
            </>
          );
        })()}
      </svg>
    );
  };

  // 2. DIBUJO ESTILO DOBLE FILA (MEZZANINE B2B ESTÁNDAR)
  const drawDobleFila = () => {
    const totalPines = pines.length;
    const cols = Math.max(2, Math.ceil(totalPines / 2));
    let topPins = pines.slice(0, cols);
    let botPins = pines.slice(cols);

    if (espejoV) {
      const temp = topPins;
      topPins = botPins;
      botPins = temp;
    }

    if (espejoH) {
      topPins = [...topPins].reverse();
      botPins = [...botPins].reverse();
    }

    const svgWidth = 540;
    const innerWidth = 440;
    const colWidth = Math.min(80, Math.floor(innerWidth / cols));
    const startX = 50 + Math.floor((innerWidth - (cols * colWidth)) / 2);

    const renderFila = (arrPines, isTop) => {
      const y = isTop ? 35 : 115;
      const numY = isTop ? 27 : 107;
      const pinH = 50;

      return arrPines.map((pin, i) => {
        const isAct = String(pin.id) === String(pinActivo);
        const pinColor = obtenerColorPin(pin);
        const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
        const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
        const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);
        const nombreMostrar = pin.nombre || pin.tipo || '---';

        const esDelgado = pin.grosor === 'delgado';
        const colCenterX = startX + i * colWidth + colWidth / 2;
        const pinW = esDelgado ? 22 : Math.max(34, colWidth - 10);
        const x = colCenterX - pinW / 2;

        return (
          <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
            <rect
              x={x}
              y={y}
              width={pinW}
              height={pinH}
              rx={esDelgado ? 3 : 5}
              fill={isAct ? 'none' : pinColor}
              fillOpacity={isAct ? 0 : 0.88}
              stroke={isAct ? '#00ffff' : '#b2922e'}
              strokeWidth={isAct ? 4 : 2}
              filter={isAct ? 'url(#glowDobleFila)' : 'none'}
              style={{ transition: 'all 0.2s' }}
            />
            {isAct && (
              <rect
                x={x}
                y={y}
                width={pinW}
                height={pinH}
                rx={esDelgado ? 3 : 5}
                fill={pinColor}
                fillOpacity={0.92}
              />
            )}
            <text x={colCenterX} y={numY} fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">
              PIN {pin.id}
            </text>

            {esDelgado ? (
              <text
                x={colCenterX}
                y={y + pinH / 2}
                transform={`rotate(-90 ${colCenterX} ${y + pinH / 2})`}
                fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')}
                fontSize="7.5"
                fontWeight="900"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ pointerEvents: 'none' }}
              >
                {modoVista === 'valores' ? (textVal || nombreMostrar) : nombreMostrar}
              </text>
            ) : (
              <>
                <text
                  x={colCenterX}
                  y={modoVista === 'valores' ? y + 28 : y + 22}
                  fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')}
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {modoVista === 'valores' ? (textVal || nombreMostrar) : nombreMostrar}
                </text>
                {modoVista !== 'nombres' && textVal && textVal !== nombreMostrar && (
                  <text
                    x={colCenterX}
                    y={y + 36}
                    fill={isAct ? '#111' : '#f59e0b'}
                    fontSize="7.8"
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    {textVal}
                  </text>
                )}
              </>
            )}
          </g>
        );
      });
    };

    return (
      <svg viewBox={`0 0 ${svgWidth} 200`} style={{ width: '100%', height: 'auto', maxHeight: '240px', display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="b2bBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e1e24" />
            <stop offset="100%" stopColor="#0d0d10" />
          </linearGradient>
          <linearGradient id="innerCavityB2B" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#050505" />
            <stop offset="100%" stopColor="#151515" />
          </linearGradient>
          <filter id="glowDobleFila" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect x="10" y="10" width={svgWidth - 20} height="180" rx="10" fill="url(#b2bBgGrad)" stroke="#2f2f37" strokeWidth="3" />
        <rect x="18" y="20" width="16" height="160" rx="3" fill="#555" stroke="#333" />
        <rect x={svgWidth - 34} y="20" width="16" height="160" rx="3" fill="#555" stroke="#333" />
        <rect x="42" y="25" width={svgWidth - 84} height="150" rx="6" fill="url(#innerCavityB2B)" stroke="#1a1a20" strokeWidth="2" />
        <rect x={startX - 10} y="90" width={cols * colWidth + 20} height="20" rx="2" fill="#0c0c0e" stroke="#222" />

        {renderFila(topPins, true)}
        {renderFila(botPins, false)}
      </svg>
    );
  };

  // 3. DIBUJO ESTILO FILA SIMPLE / ESPADINES
  const drawFilaSimple = () => {
    let arrPines = [...pines];
    if (espejoH) arrPines.reverse();

    const totalPines = arrPines.length;
    const cols = Math.max(2, totalPines);
    const svgWidth = 540;
    const innerWidth = 460;
    const colWidth = Math.min(100, Math.floor(innerWidth / cols));
    const startX = 40 + Math.floor((innerWidth - (cols * colWidth)) / 2);

    return (
      <svg viewBox={`0 0 ${svgWidth} 190`} style={{ width: '100%', height: 'auto', maxHeight: '230px', display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="bladeBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e1e24" />
            <stop offset="100%" stopColor="#0d0d10" />
          </linearGradient>
          <linearGradient id="innerCavityBlade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#050505" />
            <stop offset="100%" stopColor="#151515" />
          </linearGradient>
          <filter id="glowFilaSimple" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect x="10" y="10" width={svgWidth - 20} height="170" rx="10" fill="url(#bladeBgGrad)" stroke="#2f2f37" strokeWidth="3" />
        <rect x="25" y="25" width={svgWidth - 50} height="140" rx="6" fill="url(#innerCavityBlade)" stroke="#1a1a20" strokeWidth="2" />

        {arrPines.map((pin, i) => {
          const isAct = String(pin.id) === String(pinActivo);
          const pinColor = obtenerColorPin(pin);
          const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
          const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
          const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);
          const nombreMostrar = pin.nombre || pin.tipo || '---';

          const esDelgado = pin.grosor === 'delgado';
          const colCenterX = startX + i * colWidth + colWidth / 2;
          const pinWidth = esDelgado ? 26 : Math.max(45, colWidth - 16);
          const x = colCenterX - pinWidth / 2;
          const y = 45;
          const height = 95;

          return (
            <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
              <rect
                x={x}
                y={y}
                width={pinWidth}
                height={height}
                rx="8"
                fill={isAct ? 'none' : pinColor}
                fillOpacity={isAct ? 0 : 0.88}
                stroke={isAct ? '#00ffff' : '#b2922e'}
                strokeWidth={isAct ? 4 : 2}
                filter={isAct ? 'url(#glowFilaSimple)' : 'none'}
                style={{ transition: 'all 0.2s' }}
              />
              {isAct && (
                <rect
                  x={x}
                  y={y}
                  width={pinWidth}
                  height={height}
                  rx="8"
                  fill={pinColor}
                  fillOpacity={0.92}
                />
              )}

              <line x1={x + 4} y1={y + 18} x2={x + pinWidth - 4} y2={y + 18} stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
              <line x1={x + 4} y1={y + height - 18} x2={x + pinWidth - 4} y2={y + height - 18} stroke="rgba(0,0,0,0.3)" strokeWidth="2" />

              <text x={colCenterX} y="38" fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">
                PIN {pin.id}
              </text>
              <text x={colCenterX} y={y + 48} fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')} fontSize="9.5" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                {modoVista === 'valores' ? (textVal || nombreMostrar) : nombreMostrar}
              </text>
              {modoVista !== 'nombres' && textVal && textVal !== nombreMostrar && (
                <text x={colCenterX} y={y + 68} fill={isAct ? '#111' : '#f59e0b'} fontSize="8" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                  {textVal}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const drawConnector = () => {
    if (estiloActivo === 'hibrido') {
      return drawHibrido();
    } else if (estiloActivo === 'fila_simple') {
      return drawFilaSimple();
    } else {
      return drawDobleFila();
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#111827',
        padding: '15px',
        borderRadius: '15px',
        border: cambiosPendientes ? '2px solid #f59e0b' : '2px solid #374151',
        width: '100%',
        maxWidth: '100%',
        overflow: 'visible',
        transition: 'border-color 0.3s'
      }}
    >
      {/* BARRA SUPERIOR CON INDICADOR DE ESTADO, PRESETS Y GUARDAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {cambiosPendientes ? (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '0.7rem', color: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              padding: '4px 10px', borderRadius: '12px',
              fontWeight: 'bold'
            }}>
              <AlertCircle size={14} />
              Cambios sin guardar
            </span>
          ) : ultimaSincronizacion ? (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '0.7rem', color: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '4px 10px', borderRadius: '12px'
            }}>
              <Check size={14} />
              Sincronizado {tiempoRelativo(ultimaSincronizacion)}
            </span>
          ) : (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '0.7rem', color: '#6b7280',
              padding: '4px 10px'
            }}>
              <Cloud size={14} />
              Borrador local
            </span>
          )}

          {/* Badge del estilo activo */}
          <span style={{
            fontSize: '0.7rem',
            padding: '3px 8px',
            borderRadius: '6px',
            backgroundColor: '#1f2937',
            color: '#9ca3af',
            border: '1px solid #374151'
          }}>
            {estiloActivo === 'hibrido' ? '🔲 Híbrido (Lugs + Señal)' : estiloActivo === 'fila_simple' ? '➖ Fila Simple' : '📶 Doble Fila B2B'} • {pines.length}P
          </span>

          {espejoH && (
            <span style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid #0284c7',
              fontWeight: 'bold'
            }}>
              🪞 Espejo (Flex Batería)
            </span>
          )}

          {espejoV && (
            <span style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid #9333ea',
              fontWeight: 'bold'
            }}>
              ↕️ Filas Invertidas
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {modo === 'crear' && (
            <>
              <button
                onClick={() => setModalPresetsAbierto(true)}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
                }}
                title="Cargar plantilla de pines (Android Híbrido 10P, Xiaomi, iPhone, etc.)"
              >
                <Sparkles size={14} />
                Presets Rápidos
              </button>

              {onRestablecerOriginal && (
                <button
                  onClick={onRestablecerOriginal}
                  style={{
                    background: '#1f2937',
                    color: '#9ca3af',
                    border: '1px solid #374151',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.72rem'
                  }}
                  title="Restablecer el conector al formato original por defecto"
                >
                  <RotateCcw size={13} />
                  Restablecer
                </button>
              )}
            </>
          )}

          {onGuardar && (
            <button
              onClick={onGuardar}
              disabled={guardando}
              style={{
                background: cambiosPendientes ? '#f59e0b' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: guardando ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                boxShadow: cambiosPendientes
                  ? '0 0 15px rgba(245, 158, 11, 0.4)'
                  : '0 0 10px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s',
                opacity: guardando ? 0.7 : 1
              }}
            >
              {guardando ? (
                <>
                  <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  GUARDANDO...
                </>
              ) : (
                <>
                  {cambiosPendientes ? <CloudOff size={16} /> : <Cloud size={16} />}
                  {cambiosPendientes ? 'SINCRONIZAR AHORA' : 'GUARDADO EN NUBE'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS Y ORIENTACIÓN (ESTILO, INVERSIÓN Y VISTA) */}
      <div style={{
        backgroundColor: '#0a0b0f',
        padding: '10px 14px',
        borderRadius: '10px',
        marginBottom: '12px',
        border: '1px solid #1f2937',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Selector de Geometría / Layout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.74rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={13} color="#f59e0b" /> Estilo:
          </span>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#111827', padding: '3px', borderRadius: '6px' }}>
            <button
              onClick={() => manejarCambiarEstilo('hibrido')}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                background: estiloActivo === 'hibrido' ? '#f59e0b' : 'transparent',
                color: estiloActivo === 'hibrido' ? 'black' : 'gray',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.72rem'
              }}
              title="Brackets laterales de potencia + pines centrales delgados"
            >
              🔲 Híbrido Lugs
            </button>
            <button
              onClick={() => manejarCambiarEstilo('doble_fila')}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                background: estiloActivo === 'doble_fila' ? '#f59e0b' : 'transparent',
                color: estiloActivo === 'doble_fila' ? 'black' : 'gray',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.72rem'
              }}
              title="Doble fila Mezzanine estándar"
            >
              📶 Doble Fila B2B
            </button>
            <button
              onClick={() => manejarCambiarEstilo('fila_simple')}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                background: estiloActivo === 'fila_simple' ? '#f59e0b' : 'transparent',
                color: estiloActivo === 'fila_simple' ? 'black' : 'gray',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.72rem'
              }}
              title="Láminas / Espadines lineales directos"
            >
              ➖ Fila Simple
            </button>
          </div>
        </div>

        {/* HERRAMIENTAS DE INVERSIÓN (EXTREMOS Y MODO ESPEJO) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.74rem', fontWeight: 'bold' }}>Orientación:</span>

          {estiloActivo === 'hibrido' && (
            <button
              onClick={manejarInvertirLugs}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#e5e7eb',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Intercambia los datos de los 2 lugs laterales (Pin 1 ↔ Pin 2)"
            >
              <ArrowLeftRight size={12} color="#00ffff" />
              Invertir Lugs (1 ↔ 2)
            </button>
          )}

          <button
            onClick={() => setEspejoH(!espejoH)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: espejoH ? '1px solid #38bdf8' : '1px solid #374151',
              background: espejoH ? 'rgba(56, 189, 248, 0.2)' : '#1f2937',
              color: espejoH ? '#38bdf8' : '#9ca3af',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Invierte todo el conector horizontalmente (vista desde Flex de Batería frente a Placa)"
          >
            <ArrowLeftRight size={12} />
            Modo Espejo (Flex ↔ Placa)
          </button>

          <button
            onClick={() => setEspejoV(!espejoV)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: espejoV ? '1px solid #c084fc' : '1px solid #374151',
              background: espejoV ? 'rgba(168, 85, 247, 0.2)' : '#1f2937',
              color: espejoV ? '#c084fc' : '#9ca3af',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Invierte la fila superior con la inferior"
          >
            <ArrowUpDown size={12} />
            Invertir Filas
          </button>
        </div>

        {/* SELECTOR DE VISTA EN PINES */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.74rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={13} color="#10b981" /> Ver:
          </span>
          <div style={{ display: 'flex', gap: '2px', backgroundColor: '#111827', padding: '2px', borderRadius: '6px' }}>
            <button
              onClick={() => setModoVista('nombres')}
              style={{
                padding: '3px 7px',
                borderRadius: '4px',
                border: 'none',
                background: modoVista === 'nombres' ? '#10b981' : 'transparent',
                color: modoVista === 'nombres' ? 'black' : 'gray',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
              title="Ver nombres de las líneas dentro de los pines"
            >
              Nombres
            </button>
            <button
              onClick={() => setModoVista('valores')}
              style={{
                padding: '3px 7px',
                borderRadius: '4px',
                border: 'none',
                background: modoVista === 'valores' ? '#10b981' : 'transparent',
                color: modoVista === 'valores' ? 'black' : 'gray',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
              title="Ver valores medidos/referencia dentro de los pines"
            >
              Valores
            </button>
            <button
              onClick={() => setModoVista('ambos')}
              style={{
                padding: '3px 7px',
                borderRadius: '4px',
                border: 'none',
                background: modoVista === 'ambos' ? '#10b981' : 'transparent',
                color: modoVista === 'ambos' ? 'black' : 'gray',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
              title="Ver nombres y valores simultáneamente"
            >
              Ambos
            </button>
          </div>
        </div>

        {/* SELECTOR DE CANTIDAD DE PINES (MODO CREAR) */}
        {modo === 'crear' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ color: '#9ca3af', fontSize: '0.74rem', fontWeight: 'bold' }}>Pines:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#111827', padding: '3px 6px', borderRadius: '6px' }}>
              <button
                onClick={() => manejarCambioPines(pines.length - (estiloActivo === 'doble_fila' ? 2 : 1))}
                disabled={pines.length <= 2}
                style={{ background: '#1f2937', color: 'white', border: 'none', borderRadius: '4px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: pines.length <= 2 ? 'not-allowed' : 'pointer' }}
                title="Quitar pin"
              >
                <Minus size={12} />
              </button>
              <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '0.85rem', minWidth: '24px', textAlign: 'center' }}>
                {pines.length}
              </span>
              <button
                onClick={() => manejarCambioPines(pines.length + (estiloActivo === 'doble_fila' ? 2 : 1))}
                disabled={pines.length >= 24}
                style={{ background: '#1f2937', color: 'white', border: 'none', borderRadius: '4px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: pines.length >= 24 ? 'not-allowed' : 'pointer' }}
                title="Añadir pin"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Accesos rápidos de conteo */}
            <div style={{ display: 'flex', gap: '3px' }}>
              {[4, 6, 8, 10, 12].map(n => (
                <button
                  key={n}
                  onClick={() => manejarCambioPines(n)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '0.68rem',
                    borderRadius: '4px',
                    border: '1px solid #374151',
                    background: pines.length === n ? '#f59e0b' : '#111827',
                    color: pines.length === n ? 'black' : '#9ca3af',
                    fontWeight: pines.length === n ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  {n}P
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DIBUJO DEL CONECTOR */}
      <div style={{ backgroundColor: '#000', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #222' }}>
        {drawConnector()}
      </div>

      {/* FICHA TÉCNICA DEL PIN ACTIVO */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#1a1a1a',
          borderRadius: '10px',
          borderLeft: `5px solid ${obtenerColorPin(activePinInfo)}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '1.15rem' }}>
                PIN {pinActivo}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                de {pines.length} pines
              </span>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#111827',
                color: (activePinInfo.grosor || (Number(pinActivo) <= 2 ? 'grueso' : 'delgado')) === 'delgado' ? '#38bdf8' : '#f59e0b',
                border: '1px solid #374151',
                fontWeight: 'bold'
              }}>
                {(activePinInfo.grosor || (Number(pinActivo) <= 2 ? 'grueso' : 'delgado')) === 'delgado' ? '📏 Delgado' : '🧱 Grueso'}
              </span>
            </div>

            {modo === 'crear' ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Selector de Color */}
                <input
                  type="color"
                  value={activePinInfo.colorCustom || '#d4af37'}
                  onChange={(e) => setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, colorCustom: e.target.value } : p))}
                  style={{ padding: '0', border: 'none', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', background: 'transparent' }}
                  title="Color personalizado"
                />

                {/* Input Nombre de Línea */}
                <input
                  value={activePinInfo.nombre || ''}
                  onChange={(e) =>
                    setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, nombre: e.target.value.replace(/ /g, '_') } : p))
                  }
                  placeholder="Nombre_de_linea"
                  style={{ background: '#000', color: 'white', border: '1px solid #333', padding: '6px 10px', borderRadius: '6px', width: '135px', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}
                />

                {/* Selector de Tipo y Nombre de Red (Conectado a Portal) */}
                <div style={{ minWidth: '150px' }}>
                  <SelectorTipoLinea
                    valor={activePinInfo.tipo || 'DATA'}
                    nombreComponente="FPC Batería"
                    idPad={pinActivo}
                    onChange={(val) => {
                      setPines(prev =>
                        prev.map(p =>
                          String(p.id) === String(pinActivo) ? {
                            ...p,
                            tipo: val,
                            nombre: val // Asigna automáticamente el nombre seleccionado
                          } : p
                        )
                      );
                    }}
                    tiposCustom={tiposCustom}
                    onAgregarTipo={manejarAgregarTipo}
                    onEliminarTipo={(tipo) => setTiposCustom && setTiposCustom(tiposCustom.filter(t => t !== tipo))}
                  />
                </div>

                {/* Selector de Grosor Individual para este pin */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#000', padding: '2px', borderRadius: '6px', border: '1px solid #333' }}>
                  <button
                    type="button"
                    onClick={() => setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, grosor: 'delgado' } : p))}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: (activePinInfo.grosor || (Number(pinActivo) <= 2 ? 'grueso' : 'delgado')) === 'delgado' ? '#38bdf8' : 'transparent',
                      color: (activePinInfo.grosor || (Number(pinActivo) <= 2 ? 'grueso' : 'delgado')) === 'delgado' ? '#000' : '#9ca3af',
                      fontWeight: 'bold',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                    title="Pin delgado (Espadín de señal)"
                  >
                    📏 Delgado
                  </button>
                  <button
                    type="button"
                    onClick={() => setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, grosor: 'grueso' } : p))}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: (activePinInfo.grosor || (Number(pinActivo) <= 2 ? 'grueso' : 'delgado')) === 'grueso' ? '#f59e0b' : 'transparent',
                      color: (activePinInfo.grosor || (Number(pinActivo) <= 2 ? 'grueso' : 'delgado')) === 'grueso' ? '#000' : '#9ca3af',
                      fontWeight: 'bold',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                    title="Pin grueso (Pad ancho de potencia)"
                  >
                    🧱 Grueso
                  </button>
                </div>

                {/* Botón rápido GND */}
                <button
                  type="button"
                  onClick={() => {
                    setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, tipo: 'GND', nombre: 'GND', colorCustom: '#4b5563' } : p));
                  }}
                  style={{ background: '#374151', color: 'white', border: '1px solid #4b5563', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  title="Marcar este pin como GND (Masa)"
                >
                  GND
                </button>

                {/* Botón rápido OL */}
                <button
                  type="button"
                  onClick={onRegistrarOL}
                  style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  title="Asigna OL a esta línea"
                >
                  OL
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: activePinInfo.colorCustom || '#d4af37' }}></span>
                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {activePinInfo.nombre || 'Línea sin nombre'}
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#374151', color: 'white', fontWeight: 'bold' }}>
                  {activePinInfo.tipo || 'DATA'}
                </span>
                <button
                  onClick={onRegistrarOL}
                  style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}
                  title="Marcar medición actual como OL"
                >
                  Medir OL
                </button>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', flex: '0 1 auto' }}>
            <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block' }}>
              Valor Sano:{' '}
              <strong style={{ color: '#fff' }}>
                {(() => {
                  if (escala === 'diodo') return (activePinInfo.valorSanoDiodo !== undefined ? activePinInfo.valorSanoDiodo : activePinInfo.valorSano) || '---';
                  if (escala === 'ua') return activePinInfo.valorSanoUa || '---';
                  if (escala === 'ohmio') return activePinInfo.valorSanoOhmio || '---';
                  return '---';
                })()}{' '}
                {escala === 'diodo' ? 'V' : escala === 'ua' ? 'uA' : 'Ω'}
              </strong>
            </span>
            <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
              Actual:{' '}
              <strong style={{ color: '#fff', fontSize: '1.3rem' }}>
                {String(pinActivo) === String(activePinInfo.id) && lecturaEnVivo !== '----'
                  ? lecturaEnVivo
                  : (() => {
                      if (escala === 'diodo') return (activePinInfo.valorActualDiodo !== undefined ? activePinInfo.valorActualDiodo : activePinInfo.valorActual) || '---';
                      if (escala === 'ua') return activePinInfo.valorActualUa || '---';
                      if (escala === 'ohmio') return activePinInfo.valorActualOhmio || '---';
                      return '---';
                    })()}{' '}
                {escala === 'diodo' ? 'V' : escala === 'ua' ? 'uA' : 'Ω'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* MODAL DE PRESETS RÁPIDOS DE BATERÍA */}
      {modalPresetsAbierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #374151',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#8b5cf6" />
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>Presets de FPC Batería</h3>
              </div>
              <button
                onClick={() => setModalPresetsAbierto(false)}
                style={{ background: '#1f2937', border: 'none', color: '#9ca3af', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕ Cerrar
              </button>
            </div>

            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '18px' }}>
              Selecciona una plantilla para configurar automáticamente el <strong>estilo visual</strong>, la <strong>cantidad de pines</strong>, el <strong>grosor (delgado o grueso)</strong> y los <strong>nombres de línea estándar</strong> (conservando tus valores de medición existentes).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {PRESETS_BATERIA.map(preset => (
                <div
                  key={preset.id}
                  style={{
                    backgroundColor: '#1a1a24',
                    border: '1px solid #2f2f3d',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '0.95rem' }}>{preset.nombre}</span>
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: '#374151', color: '#e5e7eb', fontWeight: 'bold' }}>
                        {preset.estilo === 'hibrido' ? '🔲 Híbrido Lugs' : preset.estilo === 'fila_simple' ? '➖ Fila Simple' : '📶 Doble Fila'}
                      </span>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: '0 0 8px 0' }}>{preset.desc}</p>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {preset.pines.map(p => (
                        <span key={p.id} style={{ fontSize: '0.65rem', padding: '2px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: p.colorCustom || '#d4af37', border: `1px solid ${p.colorCustom || '#444'}33` }}>
                          P{p.id}: {p.nombre} {p.grosor === 'delgado' ? '📏' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onAplicarPreset) {
                        onAplicarPreset(preset);
                      }
                      setModalPresetsAbierto(false);
                    }}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Aplicar Preset
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
