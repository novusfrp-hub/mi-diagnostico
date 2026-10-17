import React, { useState } from 'react';
import { Zap, Link as LinkIcon, RotateCcw, Pin, PinOff, Eye, Copy, Check } from 'lucide-react';

/**
 * Componente Mini-HUD Desacoplado para Multímetro Digital (UNI-T UT61E+).
 * Admite modo PiP (Escritorio Always-on-top), Popout (OBS Studio con fondo transparente),
 * y ventana flotante In-App. Incluye Bargraph analógico y rastreador MAX/MIN.
 */
export default function MultimetroMiniHUD({
  valor = '----',
  unidad = '---',
  conectado = false,
  conectarFn,
  desconectarFn,
  escalaActiva = 'diodo',
  setEscalaFn,
  autoHoldActivo = false,
  toggleAutoHoldFn,
  maxVal = null,
  minVal = null,
  resetMaxMinFn,
  onReacoplar,
  onDesacoplar,
  isPopout = false,
  isPip = false,
  colorFondo = 'transparent',
  setColorFondo
}) {
  const [copiado, setCopiado] = useState(false);

  // Normalizar valor numérico para el Bargraph analógico de 46 segmentos
  const valNum = parseFloat(valor);
  const esOl = valor === 'OL' || String(valor).includes('?0');

  // Calcular porcentaje de llenado del Bargraph según la escala
  let porcentajeBargraph = 0;
  if (!isNaN(valNum) && !esOl) {
    if (escalaActiva === 'diodo') {
      porcentajeBargraph = Math.min(100, Math.max(0, (valNum / 2.5) * 100));
    } else if (escalaActiva === 'voltio') {
      porcentajeBargraph = Math.min(100, Math.max(0, (valNum / 20.0) * 100));
    } else if (escalaActiva === 'ua') {
      porcentajeBargraph = Math.min(100, Math.max(0, (valNum / 100.0) * 100));
    } else if (escalaActiva === 'amperio') {
      porcentajeBargraph = Math.min(100, Math.max(0, (valNum / 5.0) * 100));
    } else if (escalaActiva === 'ohmio') {
      porcentajeBargraph = Math.min(100, Math.max(0, (Math.log10(Math.max(1, valNum)) / 6) * 100));
    } else {
      porcentajeBargraph = Math.min(100, Math.max(0, valNum * 20));
    }
  } else if (esOl) {
    porcentajeBargraph = 100;
  }

  const numSegmentos = 46;
  const segmentosActivos = Math.round((porcentajeBargraph / 100) * numSegmentos);

  // Copiar link para OBS Browser Source
  const copiarLinkObs = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/?obs=multimetro`;
      navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const ESCALAS = [
    { id: 'diodo', label: 'DIOD', color: '#3b82f6', icon: '⚡' },
    { id: 'voltio', label: 'VOLT', color: '#ef4444', icon: 'V' },
    { id: 'ohmio', label: 'OHM', color: '#a855f7', icon: 'Ω' },
    { id: 'ua', label: 'µA', color: '#10b981', icon: 'µ' },
    { id: 'amperio', label: 'AMP', color: '#f59e0b', icon: 'A' },
    { id: 'libre', label: 'AUTO', color: '#06b6d4', icon: '🌐' }
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: '280px',
        backgroundColor: colorFondo === 'transparent' ? 'transparent' : (colorFondo === 'black' ? '#000000' : (colorFondo === 'green' ? '#00ff00' : '#070b12')),
        border: colorFondo === 'transparent' ? 'none' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: isPopout ? '0' : '12px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Consolas, monospace',
        color: '#ffffff',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. BARRA SUPERIOR: ESTADO, SELECTOR DE ESCALA Y HERRAMIENTAS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: conectado ? '#10b981' : '#ef4444', fontSize: '12px' }}>●</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#00ffff', letterSpacing: '0.5px' }}>
            UNI-T UT61E+
          </span>
          {autoHoldActivo && (
            <span style={{ fontSize: '0.62rem', background: '#065f46', color: '#34d399', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
              HOLD ON
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Botón AutoHold */}
          <button
            onClick={toggleAutoHoldFn}
            title="AutoHold inteligente"
            style={{
              background: autoHoldActivo ? '#065f46' : '#1e293b',
              color: autoHoldActivo ? '#34d399' : '#94a3b8',
              border: 'none',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <Zap size={11} /> HOLD
          </button>

          {/* Copiar enlace OBS */}
          <button
            onClick={copiarLinkObs}
            title="Copiar URL para Fuente Navegador en OBS Studio (Fondo 100% Transparente)"
            style={{
              background: copiado ? '#065f46' : '#1e293b',
              color: copiado ? '#34d399' : '#94a3b8',
              border: 'none',
              padding: '3px 7px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            {copiado ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
            {copiado ? 'COPIADO' : 'OBS URL'}
          </button>

          {/* Selector de fondo Croma en Popout */}
          {isPopout && setColorFondo && (
            <div style={{ display: 'flex', gap: '2px', background: '#0f172a', padding: '2px', borderRadius: '4px' }}>
              <button onClick={() => setColorFondo('transparent')} title="Transparente" style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'transparent', border: '1px dashed #64748b', cursor: 'pointer' }} />
              <button onClick={() => setColorFondo('black')} title="Negro" style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#000000', border: '1px solid #334155', cursor: 'pointer' }} />
              <button onClick={() => setColorFondo('green')} title="Verde Croma" style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#00ff00', border: 'none', cursor: 'pointer' }} />
            </div>
          )}

          {/* Botón Re-acoplar */}
          {onReacoplar && (
            <button
              onClick={onReacoplar}
              title="Re-acoplar a la plataforma principal"
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔗 ACOPLAR
            </button>
          )}
        </div>
      </div>

      {/* 2. SELECTOR DE ESCALAS COMPACTO */}
      {setEscalaFn && (
        <div style={{ display: 'flex', gap: '4px', margin: '4px 0', flexWrap: 'wrap' }}>
          {ESCALAS.map((esc) => {
            const activa = escalaActiva === esc.id;
            return (
              <button
                key={esc.id}
                onClick={() => setEscalaFn(esc.id)}
                style={{
                  background: activa ? esc.color : '#111827',
                  color: activa ? '#ffffff' : '#64748b',
                  border: `1px solid ${activa ? esc.color : '#1f2937'}`,
                  padding: '2px 7px',
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  boxShadow: activa ? `0 0 8px ${esc.color}66` : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{esc.icon}</span> {esc.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. PANTALLA DIGITAL GIGANTE Y TELEMETRÍA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            style={{
              color: esOl ? '#ff0000' : (conectado ? '#00ffff' : '#64748b'),
              fontSize: '2.6rem',
              fontWeight: '900',
              letterSpacing: '-1px',
              lineHeight: '1',
              textShadow: esOl ? '0 0 16px rgba(255,0,0,0.6)' : (conectado ? '0 0 16px rgba(0,255,255,0.4)' : 'none')
            }}
          >
            {valor}
          </span>
          <span style={{ color: '#00ffff', fontSize: '1.15rem', fontWeight: 'bold', opacity: 0.9 }}>
            {unidad}
          </span>
        </div>

        {/* Bloque MAX / MIN */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: 'bold' }}>MAX:</span>
            <span style={{ fontSize: '0.72rem', color: '#fca5a5', fontWeight: 'bold' }}>
              {maxVal !== null ? `${maxVal.toFixed(3)}` : '----'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.62rem', color: '#3b82f6', fontWeight: 'bold' }}>MIN:</span>
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 'bold' }}>
              {minVal !== null ? `${minVal.toFixed(3)}` : '----'}
            </span>
            {resetMaxMinFn && (
              <button
                onClick={resetMaxMinFn}
                title="Reiniciar picos MAX/MIN"
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
              >
                <RotateCcw size={10} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. BARGRAPH ANALÓGICO DINÁMICO DE 46 SEGMENTOS */}
      <div style={{ width: '100%', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '1px', width: '100%', height: '5px', background: '#0f172a', borderRadius: '3px', padding: '1px', overflow: 'hidden' }}>
          {Array.from({ length: numSegmentos }).map((_, idx) => {
            const activo = idx < segmentosActivos;
            let colorSeg = '#10b981'; // verde
            if (idx > numSegmentos * 0.7) colorSeg = '#f59e0b'; // ámbar
            if (idx > numSegmentos * 0.9) colorSeg = '#ef4444'; // rojo
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  backgroundColor: activo ? colorSeg : '#1e293b',
                  borderRadius: '1px',
                  boxShadow: activo ? `0 0 3px ${colorSeg}` : 'none',
                  transition: 'background-color 0.08s ease'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
