import React, { useState } from 'react';
import { Zap, RotateCcw, Copy, Check, Link } from 'lucide-react';

/**
 * Componente Mini-HUD Desacoplado para Multímetro Digital (MARSHALL DMM PRO).
 * Condensado para streaming en OBS Studio (fondo transparente real)
 * o widget flotante en escritorio (Always-on-Top vía Document PiP).
 */
export default function MultimetroMiniHUD({
  valor = '----',
  unidad = '---',
  prefijo = 'DC',
  modoKey = 'voltio',
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
  enviarCmdDmmFn,
  onReacoplar,
  isPopout = false,
  isPip = false,
  colorFondo: colorFondoProp = 'dark',
  setColorFondo
}) {
  const [copiado, setCopiado] = useState(false);
  const [ultimoCmd, setUltimoCmd] = useState(null);

  const copiarLinkObs = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/?obs=multimetro`;
      navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const ejecutarComando = async (cmd) => {
    if (enviarCmdDmmFn) {
      setUltimoCmd(cmd);
      await enviarCmdDmmFn(cmd);
      setTimeout(() => setUltimoCmd(null), 800);
    }
  };

  const valNum = parseFloat(valor);
  const esOl = valor === 'OL' || String(valor).includes('?0');

  // Bargraph dinámico proporcional de 46 segmentos
  let pctBargraph = 0;
  if (!isNaN(valNum) && !esOl) {
    if (modoKey === 'diodo' || escalaActiva === 'diodo') pctBargraph = Math.min(100, Math.max(0, (valNum / 2.5) * 100));
    else if (modoKey === 'voltio' || escalaActiva === 'voltio') pctBargraph = Math.min(100, Math.max(0, (valNum / 20.0) * 100));
    else if (modoKey === 'ua' || escalaActiva === 'ua') pctBargraph = Math.min(100, Math.max(0, (valNum / 100.0) * 100));
    else if (modoKey === 'amperio' || escalaActiva === 'amperio') pctBargraph = Math.min(100, Math.max(0, (valNum / 5.0) * 100));
    else if (modoKey === 'ohmio' || escalaActiva === 'ohmio') pctBargraph = Math.min(100, Math.max(0, (Math.log10(Math.max(1, valNum)) / 6) * 100));
    else pctBargraph = Math.min(100, Math.max(0, valNum * 20));
  } else if (esOl) {
    pctBargraph = 100;
  }
  const numSegmentos = 46;
  const segmentosActivos = Math.round((pctBargraph / 100) * numSegmentos);

  const bgPrincipal = colorFondoProp === 'transparent'
    ? 'transparent'
    : (colorFondoProp === 'black' ? '#000000' : (colorFondoProp === 'green' ? '#00ff00' : '#0c1424'));

  return (
    <div
      style={{
        backgroundColor: bgPrincipal,
        border: isPopout && colorFondoProp === 'transparent' ? 'none' : '1px solid #1e3a5f',
        borderRadius: isPopout ? '0px' : '12px',
        padding: '8px 12px',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Consolas, monospace',
        overflow: 'hidden',
        boxShadow: isPopout ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* 1. BARRA SUPERIOR: ESTADO, TÍTULO Y HERRAMIENTAS RÁPIDAS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: conectado ? '#10b981' : '#ef4444', fontSize: '12px' }}>●</span>
          <span style={{ fontSize: '0.78rem', fontWeight: '900', color: '#00ffff', letterSpacing: '0.5px' }}>
            MARSHALL DMM PRO
          </span>
          <span style={{ fontSize: '0.65rem', background: '#172554', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
            {prefijo ? `${prefijo} ${unidad}` : (conectado ? 'AUTO V' : 'OFF')}
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

      {/* 2. BOTONERA DE HARDWARE COMPACTA (SELECT, RANGE, AUTO, Hz%, REL) */}
      <div style={{ display: 'flex', gap: '4px', margin: '3px 0', flexWrap: 'wrap' }}>
        <button
          onClick={() => ejecutarComando('SELECT')}
          title="SELECT: Alternar subfunciones de perilla (Ω/Cont/Diodo/Cap o DC/AC)"
          style={{
            background: ultimoCmd === 'SELECT' ? '#f59e0b' : '#d97706',
            color: '#000000',
            border: 'none',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 0 6px rgba(217,119,6,0.3)'
          }}
        >
          ⚡ SELECT
        </button>

        <button
          onClick={() => ejecutarComando('RANGE')}
          title="RANGE: Rango manual"
          style={{
            background: ultimoCmd === 'RANGE' ? '#475569' : '#1e293b',
            color: '#cbd5e1',
            border: '1px solid #334155',
            padding: '2px 7px',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          RANGE
        </button>

        <button
          onClick={() => ejecutarComando('AUTO')}
          title="AUTO: Auto-Rango"
          style={{
            background: ultimoCmd === 'AUTO' ? '#0284c7' : '#0f172a',
            color: '#38bdf8',
            border: '1px solid #1e3a8a',
            padding: '2px 7px',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          AUTO
        </button>

        <button
          onClick={() => ejecutarComando('HZ')}
          title="Hz%: Frecuencia y Duty"
          style={{
            background: ultimoCmd === 'HZ' ? '#0891b2' : '#1e293b',
            color: '#22d3ee',
            border: '1px solid #334155',
            padding: '2px 7px',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Hz %
        </button>

        <button
          onClick={() => ejecutarComando('REL')}
          title="REL: Delta Δ"
          style={{
            background: ultimoCmd === 'REL' ? '#059669' : '#1e293b',
            color: '#34d399',
            border: '1px solid #334155',
            padding: '2px 7px',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Δ REL
        </button>
      </div>

      {/* 3. PANTALLA DIGITAL GIGANTE Y TELEMETRÍA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '1px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            style={{
              color: esOl ? '#ff3b3b' : (conectado ? '#00ffff' : '#64748b'),
              fontSize: '3.0rem',
              fontWeight: '900',
              letterSpacing: '-1px',
              lineHeight: '1',
              textShadow: esOl ? '0 0 16px rgba(255,59,59,0.6)' : (conectado ? '0 0 16px rgba(0,255,255,0.4)' : 'none')
            }}
          >
            {valor}
          </span>
          <span style={{ color: '#00ffff', fontSize: '1.25rem', fontWeight: 'bold', opacity: 0.9 }}>
            {unidad}
          </span>
        </div>

        {/* Bloque MAX / MIN */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: '900' }}>MAX:</span>
            <span style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 'bold', fontFamily: 'Consolas, monospace' }}>
              {maxVal !== null ? `${maxVal.toFixed(3)}` : '----'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: '900' }}>MIN:</span>
            <span style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 'bold', fontFamily: 'Consolas, monospace' }}>
              {minVal !== null ? `${minVal.toFixed(3)}` : '----'}
            </span>
            {resetMaxMinFn && (
              <button
                onClick={resetMaxMinFn}
                title="Reiniciar picos MAX/MIN"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <RotateCcw size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. BARGRAPH ANALÓGICO DINÁMICO DE 46 SEGMENTOS */}
      <div style={{ width: '100%', marginTop: '3px' }}>
        <div style={{ display: 'flex', gap: '1px', width: '100%', height: '5px', background: '#0a0b0f', borderRadius: '3px', padding: '1px', overflow: 'hidden', border: '1px solid #1f2937' }}>
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
