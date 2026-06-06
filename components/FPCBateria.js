import React, { useState } from 'react';
import { Save, Cloud, CloudOff, Check, AlertCircle } from 'lucide-react';

export default function FPCBateria({
  pines,
  setPines,
  pinActivo,
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
  esIPhone = false
}) {

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
          p.id === pinActivo ? { ...p, tipo: tipoLimpio, nombre: tipoLimpio } : p
        ));
      }
    }
  };

  const obtenerColorPin = (pin) => {
    if (!pin) return '#d4af37';
    const colorBase = pin.colorCustom || '#d4af37';

    if (modo === 'crear') {
      if (pinActivo === pin.id) return '#00ffff';
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

  const handleSetQuickOL = () => {
    setPines(prev => prev.map(p => {
      if (p.id === pinActivo) {
        const key = modo === 'crear'
          ? (escala === 'diodo' ? 'valorSanoDiodo' : escala === 'ua' ? 'valorSanoUa' : 'valorSanoOhmio')
          : (escala === 'diodo' ? 'valorActualDiodo' : escala === 'ua' ? 'valorActualUa' : 'valorActualOhmio');
        
        const backupKey = modo === 'crear' ? 'valorSano' : 'valorActual';

        return {
          ...p,
          [key]: 'OL',
          [backupKey]: 'OL'
        };
      }
      return p;
    }));
  };

  const activePinInfo = pines.find(p => p.id === pinActivo) || {};

  const tiempoRelativo = (fecha) => {
    if (!fecha) return '';
    const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
    if (segundos < 60) return `hace ${segundos}s`;
    if (segundos < 3600) return `hace ${Math.floor(segundos / 60)}min`;
    return `hace ${Math.floor(segundos / 3600)}h`;
  };

  const renderDropdownSelector = (value, onChange) => (
    <select
      value={value}
      onChange={onChange}
      style={{
        background: '#1f2937',
        color: 'white',
        border: '1px solid #333',
        padding: '6px 10px',
        borderRadius: '5px',
        outline: 'none',
        fontSize: '0.85rem',
        cursor: 'pointer'
      }}
    >
      <optgroup label="Alimentación">
        <option value="VCC">VCC</option>
        <option value="VBAT">VBAT</option>
        <option value="VBUS">VBUS</option>
        <option value="PP_BATT">PP_BATT</option>
        <option value="GND">GND</option>
        <option value="NC">NC</option>
      </optgroup>
      <optgroup label="Comunicación">
        <option value="DATA">DATA</option>
        <option value="I2C">I2C</option>
        <option value="SPI">SPI</option>
        <option value="RFFE">RFFE</option>
        <option value="SWI">SWI</option>
        <option value="UART">UART</option>
        <option value="SDA">SDA</option>
        <option value="SCL">SCL</option>
        <option value="CLK">CLK</option>
        <option value="GND">GND</option>
        <option value="NC">NC</option>
      </optgroup>
      <optgroup label="Control y Sensores">
        <option value="RESET">RESET</option>
        <option value="ENABLE">ENABLE</option>
        <option value="INT">INT</option>
        <option value="NTC">NTC</option>
        <option value="ID">ID</option>
        <option value="GND">GND</option>
        <option value="NC">NC</option>
      </optgroup>
      {tiposCustom.length > 0 && (
        <optgroup label="Personalizados">
          {tiposCustom.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
          <option value="GND">GND</option>
          <option value="NC">NC</option>
        </optgroup>
      )}
    </select>
  );

  // DIBUJO SVG DEL CONECTOR
  const drawConnector = () => {
    if (esIPhone) {
      // iPhone SVG Drawing (6 pins)
      return (
        <svg viewBox="0 0 520 200" style={{ width: '100%', height: 'auto', maxHeight: '240px', display: 'block', margin: '0 auto' }}>
          <defs>
            <linearGradient id="iphoneBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1e24" />
              <stop offset="100%" stopColor="#0d0d10" />
            </linearGradient>
            <linearGradient id="innerCavityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#050505" />
              <stop offset="100%" stopColor="#151515" />
            </linearGradient>
            <linearGradient id="goldPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffe680" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#8a6d1c" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Base conector */}
          <rect x="10" y="10" width="500" height="180" rx="12" fill="url(#iphoneBgGrad)" stroke="#2f2f37" strokeWidth="3" />
          {/* Cavidad interna */}
          <rect x="25" y="25" width="470" height="150" rx="8" fill="url(#innerCavityGrad)" stroke="#1a1a20" strokeWidth="2" />
          
          {/* Separador plástico central */}
          <rect x="110" y="40" width="300" height="120" rx="4" fill="#0f0f12" stroke="#222" strokeWidth="1.5" />

          {/* RENDER PINES */}
          {pines.map((pin) => {
            const isAct = pin.id === pinActivo;
            const pinColor = obtenerColorPin(pin);
            const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
            const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
            const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);

            // Coordenadas y formas para iPhone (6 pines)
            if (pin.id === 1) {
              // Left Bracket (VCC)
              return (
                <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(1)}>
                  <path
                    d="M 35 40 L 95 40 L 95 65 L 70 65 L 70 135 L 95 135 L 95 160 L 35 160 Z"
                    fill={isAct ? 'none' : pinColor}
                    fillOpacity={isAct ? 0 : 0.85}
                    stroke={isAct ? '#00ffff' : '#b2922e'}
                    strokeWidth={isAct ? 4 : 2}
                    filter={isAct ? 'url(#glow)' : 'none'}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {isAct && (
                    <path
                      d="M 35 40 L 95 40 L 95 65 L 70 65 L 70 135 L 95 135 L 95 160 L 35 160 Z"
                      fill={pinColor}
                      fillOpacity={0.9}
                    />
                  )}
                  <text x="50" y="105" fill={isAct ? '#000' : '#fff'} fontSize="10" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>PIN 1</text>
                  <text x="50" y="122" fill={isAct ? '#000' : '#eab308'} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>{textVal || pin.nombre}</text>
                </g>
              );
            }

            if (pin.id === 2) {
              // Right Bracket (GND)
              return (
                <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(2)}>
                  <path
                    d="M 485 40 L 425 40 L 425 65 L 450 65 L 450 135 L 425 135 L 425 160 L 485 160 Z"
                    fill={isAct ? 'none' : pinColor}
                    fillOpacity={isAct ? 0 : 0.85}
                    stroke={isAct ? '#00ffff' : '#b2922e'}
                    strokeWidth={isAct ? 4 : 2}
                    filter={isAct ? 'url(#glow)' : 'none'}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {isAct && (
                    <path
                      d="M 485 40 L 425 40 L 425 65 L 450 65 L 450 135 L 425 135 L 425 160 L 485 160 Z"
                      fill={pinColor}
                      fillOpacity={0.9}
                    />
                  )}
                  <text x="465" y="105" fill={isAct ? '#000' : '#fff'} fontSize="10" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>PIN 2</text>
                  <text x="465" y="122" fill={isAct ? '#000' : '#eab308'} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>{textVal || pin.nombre}</text>
                </g>
              );
            }

            // Pines del medio (3, 4 en la parte superior; 5, 6 en la parte inferior)
            let x = 0;
            let y = 0;
            if (pin.id === 3) { x = 140; y = 50; }
            if (pin.id === 4) { x = 280; y = 50; }
            if (pin.id === 5) { x = 140; y = 110; }
            if (pin.id === 6) { x = 280; y = 110; }

            return (
              <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
                <rect
                  x={x}
                  y={y}
                  width="100"
                  height="40"
                  rx="6"
                  fill={isAct ? 'none' : pinColor}
                  fillOpacity={isAct ? 0 : 0.85}
                  stroke={isAct ? '#00ffff' : '#b2922e'}
                  strokeWidth={isAct ? 4 : 2}
                  filter={isAct ? 'url(#glow)' : 'none'}
                  style={{ transition: 'all 0.2s' }}
                />
                {isAct && (
                  <rect
                    x={x}
                    y={y}
                    width="100"
                    height="40"
                    rx="6"
                    fill={pinColor}
                    fillOpacity={0.9}
                  />
                )}
                <text x={x + 50} y={y + 16} fill={isAct ? '#000' : '#fff'} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>PIN {pin.id}</text>
                <text x={x + 50} y={y + 30} fill={isAct ? '#000' : '#eab308'} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>{textVal || pin.nombre}</text>
              </g>
            );
          })}
        </svg>
      );
    } else {
      // Android SVG Drawing (8 pins in parallel, structured logically)
      return (
        <svg viewBox="0 0 520 200" style={{ width: '100%', height: 'auto', maxHeight: '240px', display: 'block', margin: '0 auto' }}>
          <defs>
            <linearGradient id="androidBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1e24" />
              <stop offset="100%" stopColor="#0d0d10" />
            </linearGradient>
            <linearGradient id="innerCavityGradAndroid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#050505" />
              <stop offset="100%" stopColor="#151515" />
            </linearGradient>
            <filter id="glowAndroid" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Base exterior */}
          <rect x="10" y="10" width="500" height="180" rx="10" fill="url(#androidBgGrad)" stroke="#2f2f37" strokeWidth="3" />
          
          {/* Brackets estructurales metálicos externos (no activos) */}
          <rect x="18" y="20" width="16" height="160" rx="3" fill="#555" stroke="#333" />
          <rect x="486" y="20" width="16" height="160" rx="3" fill="#555" stroke="#333" />

          {/* Cavidad interna */}
          <rect x="42" y="25" width="436" height="150" rx="6" fill="url(#innerCavityGradAndroid)" stroke="#1a1a20" strokeWidth="2" />
          
          {/* Barra central plástica */}
          <rect x="90" y="90" width="340" height="20" rx="2" fill="#0c0c0e" stroke="#222" />

          {/* Render pins: Top row (1-4) and Bottom row (5-8) */}
          {pines.map((pin) => {
            const isAct = pin.id === pinActivo;
            const pinColor = obtenerColorPin(pin);
            const refVal = escala === 'diodo' ? (pin.valorSanoDiodo || pin.valorSano) : escala === 'ua' ? pin.valorSanoUa : pin.valorSanoOhmio;
            const actVal = escala === 'diodo' ? (pin.valorActualDiodo || pin.valorActual) : escala === 'ua' ? pin.valorActualUa : pin.valorActualOhmio;
            const textVal = modo === 'crear' ? formNum(refVal || '---', pin.tipo) : formNum(actVal || '---', pin.tipo);

            // Coordinates for Android
            let x = 0;
            let y = 0;
            const colWidth = 80;
            const startX = 95;

            if (pin.id <= 4) {
              // Row top
              x = startX + (pin.id - 1) * colWidth;
              y = 35;
            } else {
              // Row bottom
              x = startX + (pin.id - 5) * colWidth;
              y = 115;
            }

            return (
              <g key={pin.id} style={{ cursor: 'pointer' }} onClick={() => setPinActivo(pin.id)}>
                <rect
                  x={x}
                  y={y}
                  width="70"
                  height="50"
                  rx="4"
                  fill={isAct ? 'none' : pinColor}
                  fillOpacity={isAct ? 0 : 0.85}
                  stroke={isAct ? '#00ffff' : '#b2922e'}
                  strokeWidth={isAct ? 4 : 2}
                  filter={isAct ? 'url(#glowAndroid)' : 'none'}
                  style={{ transition: 'all 0.2s' }}
                />
                {isAct && (
                  <rect
                    x={x}
                    y={y}
                    width="70"
                    height="50"
                    rx="4"
                    fill={pinColor}
                    fillOpacity={0.9}
                  />
                )}
                <text x={x + 35} y={y + 18} fill={isAct ? '#000' : '#fff'} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>PIN {pin.id}</text>
                <text x={x + 35} y={y + 35} fill={isAct ? '#000' : '#eab308'} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>{textVal || pin.nombre}</text>
              </g>
            );
          })}
        </svg>
      );
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
      {/* BARRA SUPERIOR CON INDICADOR DE ESTADO Y BOTÓN GUARDAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        </div>

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

      {/* DIBUJO DEL CONECTOR */}
      <div style={{ backgroundColor: '#000', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #222' }}>
        {drawConnector()}
      </div>

      {/* FICHA TÉCNICA DEL PIN ACTIVO */}
      <div
        style={{
          padding: '10px',
          backgroundColor: '#1a1a1a',
          borderRadius: '10px',
          borderLeft: `4px solid ${obtenerColorPin(activePinInfo)}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ flex: '1 1 auto' }}>
            <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '1.1rem' }}>
              PIN {pinActivo}
            </span>

            {modo === 'crear' ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="color"
                  value={activePinInfo.colorCustom || '#d4af37'}
                  onChange={(e) => setPines(prev => prev.map(p => p.id === pinActivo ? { ...p, colorCustom: e.target.value } : p))}
                  style={{ padding: '0', border: 'none', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', background: 'transparent' }}
                  title="Color personalizado"
                />

                <input
                  value={activePinInfo.nombre || ''}
                  onChange={(e) =>
                    setPines(prev => prev.map(p => p.id === pinActivo ? { ...p, nombre: e.target.value.replace(/ /g, '_') } : p))
                  }
                  placeholder="Nombre_de_linea"
                  style={{ background: '#000', color: 'white', border: '1px solid #333', padding: '6px 10px', borderRadius: '5px', width: '140px', outline: 'none', fontSize: '0.85rem' }}
                />

                {renderDropdownSelector(activePinInfo.tipo || 'DATA', (e) => {
                  const val = e.target.value;
                  setPines(prev =>
                    prev.map(p =>
                      p.id === pinActivo ? {
                        ...p,
                        tipo: val,
                        nombre: val === 'GND' || val === 'NC' ? val : p.nombre
                      } : p
                    )
                  );
                })}

                <button
                  onClick={manejarAgregarTipo}
                  style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  + Tipo
                </button>

                <button
                  onClick={handleSetQuickOL}
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
                  onClick={handleSetQuickOL}
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
                {pinActivo === activePinInfo.id && lecturaEnVivo !== '----'
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
    </div>
  );
}
