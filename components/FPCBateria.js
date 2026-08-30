import React, { useState } from 'react';
import { Save, Cloud, CloudOff, Check, AlertCircle, Zap, Sliders, Plus, Minus, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import SelectorTipoLinea from './SelectorTipoLinea.js';

export const PRESETS_BATERIA = [
  {
    id: 'iphone_clasico',
    nombre: 'iPhone Clásico (6P)',
    desc: 'Lugs laterales de potencia (VBAT, GND) + 4 señales centrales (SWI, NTC, I2C)',
    estilo: 'hibrido',
    pines: [
      { id: 1, nombre: 'VBAT', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 2, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563' },
      { id: 3, nombre: 'BATT_SWI', tipo: 'SWI', colorCustom: '#3b82f6' },
      { id: 4, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981' },
      { id: 5, nombre: 'I2C_SDA', tipo: 'SDA', colorCustom: '#eab308' },
      { id: 6, nombre: 'I2C_SCL', tipo: 'SCL', colorCustom: '#a855f7' }
    ]
  },
  {
    id: 'android_std_4p',
    nombre: 'Android Estándar (4P)',
    desc: 'Conector doble fila simétrico (VBAT, ID, NTC, GND)',
    estilo: 'doble_fila',
    pines: [
      { id: 1, nombre: 'VBAT', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 2, nombre: 'BATT_ID', tipo: 'ID', colorCustom: '#3b82f6' },
      { id: 3, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981' },
      { id: 4, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563' }
    ]
  },
  {
    id: 'android_b2b_6p',
    nombre: 'Android B2B (6P)',
    desc: 'Doble fila con pines dobles de potencia para mayor corriente',
    estilo: 'doble_fila',
    pines: [
      { id: 1, nombre: 'VBAT_1', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 2, nombre: 'VBAT_2', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 3, nombre: 'BATT_ID', tipo: 'ID', colorCustom: '#3b82f6' },
      { id: 4, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981' },
      { id: 5, nombre: 'GND_1', tipo: 'GND', colorCustom: '#4b5563' },
      { id: 6, nombre: 'GND_2', tipo: 'GND', colorCustom: '#4b5563' }
    ]
  },
  {
    id: 'android_b2b_8p',
    nombre: 'Android B2B Completo (8P)',
    desc: 'Doble fila con bus I2C, ID, Termistor NTC y pines dobles de masa/potencia',
    estilo: 'doble_fila',
    pines: [
      { id: 1, nombre: 'VBAT_1', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 2, nombre: 'VBAT_2', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 3, nombre: 'BATT_ID', tipo: 'ID', colorCustom: '#3b82f6' },
      { id: 4, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981' },
      { id: 5, nombre: 'I2C_SDA', tipo: 'SDA', colorCustom: '#eab308' },
      { id: 6, nombre: 'I2C_SCL', tipo: 'SCL', colorCustom: '#a855f7' },
      { id: 7, nombre: 'GND_1', tipo: 'GND', colorCustom: '#4b5563' },
      { id: 8, nombre: 'GND_2', tipo: 'GND', colorCustom: '#4b5563' }
    ]
  },
  {
    id: 'fast_charge_10p',
    nombre: 'Carga Rápida / Doble Celda (10P)',
    desc: 'Xiaomi 120W, Oppo VOOC, Samsung Ultra (2 Celdas + SMBus)',
    estilo: 'doble_fila',
    pines: [
      { id: 1, nombre: 'VBAT_C1', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 2, nombre: 'VBAT_C2', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 3, nombre: 'FAST_ID', tipo: 'ID', colorCustom: '#3b82f6' },
      { id: 4, nombre: 'TEMP_NTC', tipo: 'NTC', colorCustom: '#10b981' },
      { id: 5, nombre: 'SMB_SDA', tipo: 'SDA', colorCustom: '#eab308' },
      { id: 6, nombre: 'SMB_SCL', tipo: 'SCL', colorCustom: '#a855f7' },
      { id: 7, nombre: 'CELL_BAL', tipo: 'DATA', colorCustom: '#06b6d4' },
      { id: 8, nombre: 'NC', tipo: 'NC', colorCustom: '#1e3a8a' },
      { id: 9, nombre: 'GND_1', tipo: 'GND', colorCustom: '#4b5563' },
      { id: 10, nombre: 'GND_2', tipo: 'GND', colorCustom: '#4b5563' }
    ]
  },
  {
    id: 'fila_simple_3p',
    nombre: 'Láminas / Espadines (3P)',
    desc: 'Contactos planos o resortes lineales (VBAT, BSI/NTC, GND)',
    estilo: 'fila_simple',
    pines: [
      { id: 1, nombre: 'VBAT+', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 2, nombre: 'BSI_NTC', tipo: 'NTC', colorCustom: '#10b981' },
      { id: 3, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563' }
    ]
  },
  {
    id: 'fila_simple_4p',
    nombre: 'Láminas / Espadines (4P)',
    desc: 'Contactos lineales directos (VBAT, BSI, NTC, GND)',
    estilo: 'fila_simple',
    pines: [
      { id: 1, nombre: 'VBAT+', tipo: 'VBAT', colorCustom: '#ef4444' },
      { id: 2, nombre: 'BSI_ID', tipo: 'ID', colorCustom: '#3b82f6' },
      { id: 3, nombre: 'BATT_NTC', tipo: 'NTC', colorCustom: '#10b981' },
      { id: 4, nombre: 'GND', tipo: 'GND', colorCustom: '#4b5563' }
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
  estiloLayout = 'doble_fila',
  onCambiarEstiloLayout,
  onCambiarNumPines,
  onAplicarPreset,
  onRegistrarOL
}) {
  const [modalPresetsAbierto, setModalPresetsAbierto] = useState(false);

  // Determinación del estilo activo (hibrido, doble_fila, fila_simple)
  const estiloActivo = estiloLayout || (esIPhone ? 'hibrido' : 'doble_fila');

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
        const nuevos = Array.from({ length: num - pines.length }, (_, idx) => ({
          id: pines.length + idx + 1,
          nombre: '',
          tipo: 'DATA',
          valorSanoDiodo: '---',
          valorSanoUa: '---',
          valorSanoOhmio: '---',
          valorActualDiodo: '---',
          valorActualUa: '---',
          valorActualOhmio: '---',
          valorSano: '---',
          valorActual: '---'
        }));
        setPines([...pines, ...nuevos]);
      } else if (num < pines.length) {
        setPines(pines.slice(0, num));
        if (Number(pinActivo) > num) {
          setPinActivo(1);
        }
      }
    }
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
      if (pin.tipo === 'VCC' || pin.tipo === 'VBAT' || pin.tipo === 'PP_BATT') return '#7f1d1d';
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
    const pinesCentro = pines.filter(p => Number(p.id) >= 3);
    const pin1 = pines.find(p => Number(p.id) === 1) || { id: 1, tipo: 'VBAT', nombre: 'VBAT' };
    const pin2 = pines.find(p => Number(p.id) === 2) || { id: 2, tipo: 'GND', nombre: 'GND' };

    const renderLug = (pin, isLeft) => {
      const isAct = String(pin.id) === String(pinActivo);
      const pinColor = obtenerColorPin(pin);
      const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
      const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
      const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);

      const pathD = isLeft
        ? "M 35 40 L 95 40 L 95 65 L 70 65 L 70 135 L 95 135 L 95 160 L 35 160 Z"
        : "M 485 40 L 425 40 L 425 65 L 450 65 L 450 135 L 425 135 L 425 160 L 485 160 Z";
      const numX = isLeft ? 65 : 455;

      return (
        <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
          <path
            d={pathD}
            fill={isAct ? 'none' : pinColor}
            fillOpacity={isAct ? 0 : 0.85}
            stroke={isAct ? '#00ffff' : '#b2922e'}
            strokeWidth={isAct ? 4 : 2}
            filter={isAct ? 'url(#glowBateria)' : 'none'}
            style={{ transition: 'all 0.2s' }}
          />
          {isAct && (
            <path
              d={pathD}
              fill={pinColor}
              fillOpacity={0.9}
            />
          )}
          <text x={numX} y="32" fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">PIN {pin.id}</text>
          <text x={numX} y="105" fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
            {textVal || pin.nombre || '---'}
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

        {/* Base conector */}
        <rect x="10" y="10" width="500" height="180" rx="12" fill="url(#hibridoBgGrad)" stroke="#2f2f37" strokeWidth="3" />
        <rect x="25" y="25" width="470" height="150" rx="8" fill="url(#innerCavityHibrido)" stroke="#1a1a20" strokeWidth="2" />
        <rect x="110" y="40" width="300" height="120" rx="4" fill="#0f0f12" stroke="#222" strokeWidth="1.5" />

        {/* Brackets de potencia (PIN 1 y PIN 2) */}
        {renderLug(pin1, true)}
        {pines.length >= 2 && renderLug(pin2, false)}

        {/* Pines Centrales Paramétricos (PIN 3..N) */}
        {(() => {
          if (pinesCentro.length === 0) return null;

          if (pinesCentro.length <= 2) {
            // Distribución en 1 sola fila horizontal centrada
            const colW = Math.min(120, Math.floor(280 / pinesCentro.length));
            const startX = 120 + Math.floor((280 - (pinesCentro.length * colW)) / 2);

            return pinesCentro.map((pin, i) => {
              const isAct = String(pin.id) === String(pinActivo);
              const pinColor = obtenerColorPin(pin);
              const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
              const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
              const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);

              const x = startX + i * colW + 10;
              const y = 75;
              const width = colW - 20;

              return (
                <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
                  <rect x={x} y={y} width={width} height="50" rx="6" fill={isAct ? 'none' : pinColor} fillOpacity={isAct ? 0 : 0.85} stroke={isAct ? '#00ffff' : '#b2922e'} strokeWidth={isAct ? 4 : 2} filter={isAct ? 'url(#glowBateria)' : 'none'} style={{ transition: 'all 0.2s' }} />
                  {isAct && <rect x={x} y={y} width={width} height="50" rx="6" fill={pinColor} fillOpacity={0.9} />}
                  <text x={x + width / 2} y="67" fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">PIN {pin.id}</text>
                  <text x={x + width / 2} y="105" fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>{textVal || '---'}</text>
                </g>
              );
            });
          }

          // Distribución en 2 filas (Superior / Inferior)
          const half = Math.ceil(pinesCentro.length / 2);
          const topPins = pinesCentro.slice(0, half);
          const botPins = pinesCentro.slice(half);

          const renderFilaCentro = (arrPines, isTop) => {
            const count = arrPines.length;
            const colW = Math.min(90, Math.floor(280 / count));
            const startX = 120 + Math.floor((280 - (count * colW)) / 2);
            const y = isTop ? 50 : 110;
            const numY = isTop ? 42 : 102;
            const valY = isTop ? 75 : 135;

            return arrPines.map((pin, i) => {
              const isAct = String(pin.id) === String(pinActivo);
              const pinColor = obtenerColorPin(pin);
              const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
              const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
              const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);

              const x = startX + i * colW + 5;
              const width = colW - 10;

              return (
                <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
                  <rect x={x} y={y} width={width} height="40" rx="6" fill={isAct ? 'none' : pinColor} fillOpacity={isAct ? 0 : 0.85} stroke={isAct ? '#00ffff' : '#b2922e'} strokeWidth={isAct ? 4 : 2} filter={isAct ? 'url(#glowBateria)' : 'none'} style={{ transition: 'all 0.2s' }} />
                  {isAct && <rect x={x} y={y} width={width} height="40" rx="6" fill={pinColor} fillOpacity={0.9} />}
                  <text x={x + width / 2} y={numY} fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">PIN {pin.id}</text>
                  <text x={x + width / 2} y={valY} fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>{textVal || '---'}</text>
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
    const topPins = pines.slice(0, cols);
    const botPins = pines.slice(cols);

    const svgWidth = 540;
    const innerWidth = 440;
    const colWidth = Math.min(80, Math.floor(innerWidth / cols));
    const pinWidth = Math.max(34, colWidth - 10);
    const startX = 50 + Math.floor((innerWidth - (cols * colWidth)) / 2);

    const renderFila = (arrPines, isTop) => {
      const y = isTop ? 35 : 115;
      const numY = isTop ? 27 : 107;
      const valY = isTop ? 65 : 145;

      return arrPines.map((pin, i) => {
        const isAct = String(pin.id) === String(pinActivo);
        const pinColor = obtenerColorPin(pin);
        const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
        const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
        const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);

        const x = startX + i * colWidth + Math.floor((colWidth - pinWidth) / 2);

        return (
          <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
            <rect
              x={x}
              y={y}
              width={pinWidth}
              height="50"
              rx="4"
              fill={isAct ? 'none' : pinColor}
              fillOpacity={isAct ? 0 : 0.85}
              stroke={isAct ? '#00ffff' : '#b2922e'}
              strokeWidth={isAct ? 4 : 2}
              filter={isAct ? 'url(#glowDobleFila)' : 'none'}
              style={{ transition: 'all 0.2s' }}
            />
            {isAct && (
              <rect
                x={x}
                y={y}
                width={pinWidth}
                height="50"
                rx="4"
                fill={pinColor}
                fillOpacity={0.9}
              />
            )}
            <text x={x + pinWidth / 2} y={numY} fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">PIN {pin.id}</text>
            <text x={x + pinWidth / 2} y={valY} fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')} fontSize={pinWidth < 45 ? "8" : "9"} fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
              {textVal || '---'}
            </text>
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

        {/* Base exterior */}
        <rect x="10" y="10" width={svgWidth - 20} height="180" rx="10" fill="url(#b2bBgGrad)" stroke="#2f2f37" strokeWidth="3" />

        {/* Brackets estructurales metálicos externos */}
        <rect x="18" y="20" width="16" height="160" rx="3" fill="#555" stroke="#333" />
        <rect x={svgWidth - 34} y="20" width="16" height="160" rx="3" fill="#555" stroke="#333" />

        {/* Cavidad interna */}
        <rect x="42" y="25" width={svgWidth - 84} height="150" rx="6" fill="url(#innerCavityB2B)" stroke="#1a1a20" strokeWidth="2" />

        {/* Barra central plástica */}
        <rect x={startX - 10} y="90" width={cols * colWidth + 20} height="20" rx="2" fill="#0c0c0e" stroke="#222" />

        {/* Render filas */}
        {renderFila(topPins, true)}
        {renderFila(botPins, false)}
      </svg>
    );
  };

  // 3. DIBUJO ESTILO FILA SIMPLE / ESPADINES (LÁMINAS CONTACTO)
  const drawFilaSimple = () => {
    const totalPines = pines.length;
    const cols = Math.max(2, totalPines);
    const svgWidth = 540;
    const innerWidth = 460;
    const colWidth = Math.min(100, Math.floor(innerWidth / cols));
    const pinWidth = Math.max(45, colWidth - 16);
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

        {/* Base exterior */}
        <rect x="10" y="10" width={svgWidth - 20} height="170" rx="10" fill="url(#bladeBgGrad)" stroke="#2f2f37" strokeWidth="3" />
        <rect x="25" y="25" width={svgWidth - 50} height="140" rx="6" fill="url(#innerCavityBlade)" stroke="#1a1a20" strokeWidth="2" />

        {pines.map((pin, i) => {
          const isAct = String(pin.id) === String(pinActivo);
          const pinColor = obtenerColorPin(pin);
          const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
          const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
          const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);

          const x = startX + i * colWidth + Math.floor((colWidth - pinWidth) / 2);
          const y = 45;
          const height = 95;

          return (
            <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
              {/* Espadín / Contacto con curvatura */}
              <rect
                x={x}
                y={y}
                width={pinWidth}
                height={height}
                rx="8"
                fill={isAct ? 'none' : pinColor}
                fillOpacity={isAct ? 0 : 0.85}
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
                  fillOpacity={0.9}
                />
              )}
              {/* Marca de lámina de presión interna */}
              <line x1={x + 8} y1={y + 20} x2={x + pinWidth - 8} y2={y + 20} stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
              <line x1={x + 8} y1={y + height - 20} x2={x + pinWidth - 8} y2={y + height - 20} stroke="rgba(0,0,0,0.3)" strokeWidth="2" />

              <text x={x + pinWidth / 2} y="38" fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">PIN {pin.id}</text>
              <text x={x + pinWidth / 2} y={y + 45} fill={pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : (isAct ? '#000' : '#fff')} fontSize="10" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                {textVal || '---'}
              </text>
              <text x={x + pinWidth / 2} y={y + 65} fill="#9ca3af" fontSize="7.5" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                {pin.nombre || pin.tipo}
              </text>
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
        overflow: 'hidden',
        transition: 'border-color 0.3s'
      }}
    >
      {/* BARRA SUPERIOR CON INDICADOR DE ESTADO, SELECTOR DE LAYOUT Y GUARDAR */}
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
              Cambios locales sin guardar
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
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {modo === 'crear' && (
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
              title="Cargar plantilla o preset de pines para batería"
            >
              <Sparkles size={14} />
              Presets Rápidos
            </button>
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

      {/* BARRA DE CONFIGURACIÓN DEL CONECTOR (VISIBLE EN MODO GRABAR/CREAR) */}
      {modo === 'crear' && (
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
            <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                title="Brackets laterales de potencia + señales centrales (iPhone clásico / Fast-Charge)"
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
                title="Doble fila Mezzanine estándar (Android y iPhone 12+)"
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
                title="Láminas / Espadines / Contactos lineales"
              >
                ➖ Fila Simple
              </button>
            </div>
          </div>

          {/* Selector de Cantidad de Pines */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 'bold' }}>Pines:</span>
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
              {[3, 4, 6, 8, 10, 12].map(n => (
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
        </div>
      )}

      {/* DIBUJO DEL CONECTOR */}
      <div style={{ backgroundColor: '#000', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #222' }}>
        {drawConnector()}
      </div>

      {/* FICHA TÉCNICA DEL PIN ACTIVO */}
      <div
        style={{
          padding: '12px',
          backgroundColor: '#1a1a1a',
          borderRadius: '10px',
          borderLeft: `4px solid ${obtenerColorPin(activePinInfo)}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                PIN {pinActivo}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                de {pines.length} pines
              </span>
            </div>

            {modo === 'crear' ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="color"
                  value={activePinInfo.colorCustom || '#d4af37'}
                  onChange={(e) => setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, colorCustom: e.target.value } : p))}
                  style={{ padding: '0', border: 'none', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', background: 'transparent' }}
                  title="Color personalizado"
                />

                <input
                  value={activePinInfo.nombre || ''}
                  onChange={(e) =>
                    setPines(prev => prev.map(p => String(p.id) === String(pinActivo) ? { ...p, nombre: e.target.value.replace(/ /g, '_') } : p))
                  }
                  placeholder="Nombre_de_linea"
                  style={{ background: '#000', color: 'white', border: '1px solid #333', padding: '6px 10px', borderRadius: '5px', width: '140px', outline: 'none', fontSize: '0.85rem' }}
                />

                <SelectorTipoLinea
                  valor={activePinInfo.tipo || 'DATA'}
                  onChange={(val) => {
                    setPines(prev =>
                      prev.map(p =>
                        String(p.id) === String(pinActivo) ? {
                          ...p,
                          tipo: val,
                          nombre: val === 'GND' || val === 'NC' ? val : p.nombre
                        } : p
                      )
                    );
                  }}
                  tiposCustom={tiposCustom}
                  onAgregarTipo={manejarAgregarTipo}
                  onEliminarTipo={(tipo) => setTiposCustom && setTiposCustom(tiposCustom.filter(t => t !== tipo))}
                />

                <button
                  onClick={onRegistrarOL}
                  style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  title="Asigna OL a esta línea"
                >
                  OL
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: activePinInfo.colorCustom || '#d4af37' }}></span>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {activePinInfo.nombre || 'Línea sin nombre'}
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#374151', color: 'white', fontWeight: 'bold' }}>
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
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
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
              Selecciona una plantilla para configurar automáticamente el <strong>estilo visual</strong>, la <strong>cantidad de pines</strong> y los <strong>nombres/tipos de línea estándar</strong> (conservando los valores de medición si coinciden los pines).
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
                        {preset.estilo === 'hibrido' ? 'Híbrido Lugs' : preset.estilo === 'fila_simple' ? 'Fila Simple' : 'Doble Fila'}
                      </span>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: '0 0 8px 0' }}>{preset.desc}</p>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {preset.pines.map(p => (
                        <span key={p.id} style={{ fontSize: '0.65rem', padding: '2px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: p.colorCustom || '#d4af37', border: `1px solid ${p.colorCustom || '#444'}33` }}>
                          P{p.id}: {p.nombre}
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
                    Aplicar
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
