import React, { useState, useRef, useEffect } from 'react';
import { Zap, RotateCcw, Copy, Check, Activity, Pin, Minus, Maximize2 } from 'lucide-react';
import MultimetroMiniHUD from './MultimetroMiniHUD';

/**
 * Componente Suite Dual Unificada (Multímetro UNI-T + Marshall MC-Meter Pro).
 * Condensado a ~1/3 del tamaño de pantalla para streaming en OBS Studio (fondo transparente real)
 * o widget flotante en escritorio (Always-on-Top vía Document PiP).
 */
export default function MarshallSuiteDualHUD({
  // Props Multímetro
  lecturaUsb = { valor: '----', unidad: '---', tick: 0 },
  usbConectado = false,
  conectarMultimetroFn,
  desconectarMultimetroFn,
  escalaActiva = 'diodo',
  setEscalaFn,
  autoHoldActivo = false,
  toggleAutoHoldFn,
  maxVal = null,
  minVal = null,
  resetMaxMinFn,
  enviarCmdDmmFn,

  // Props MC-Meter Pro
  mcMeter,
  onAbrirOscilograma,
  modoAvanzado = false,
  setModoAvanzado,

  // Control general
  onReacoplar,
  isPopout = false,
  isPip = false,
  colorFondo: colorFondoProp = 'dark'
}) {
  const [colorFondo, setColorFondo] = useState(colorFondoProp || 'dark');
  const [copiado, setCopiado] = useState(false);
  const containerRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Restablecer al tamaño original por defecto (680 x 210 px)
  const resetTamanoOriginal = () => {
    try {
      const doc = containerRef.current?.ownerDocument;
      const win = doc?.defaultView;
      if (win && win.resizeTo) {
        win.resizeTo(680, 210);
      }
      try { localStorage.removeItem('marshall_suite_dual_size'); } catch (e) {}
      setIsMinimized(false);
    } catch (e) {
      console.warn('Error al resetear tamaño:', e);
    }
  };

  // Alternar entre ventana completa y barra delgada flotante (para no tapar esquemáticos)
  const toggleMinimizar = () => {
    try {
      const doc = containerRef.current?.ownerDocument;
      const win = doc?.defaultView;
      if (!isMinimized) {
        if (win && win.resizeTo) {
          try { win.resizeTo(win.innerWidth || 680, 78); } catch (e) {}
        }
        setIsMinimized(true);
      } else {
        let targetW = 680;
        let targetH = 210;
        try {
          const saved = localStorage.getItem('marshall_suite_dual_size');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.width && parsed.height) {
              targetW = parsed.width;
              targetH = parsed.height;
            }
          }
        } catch (e) {}
        if (win && win.resizeTo) {
          try { win.resizeTo(targetW, targetH); } catch (e) {}
        }
        setIsMinimized(false);
      }
    } catch (e) {
      console.warn('Error en toggleMinimizar:', e);
    }
  };

  // Sincronizar dinámicamente el fondo de la ventana popout externa
  useEffect(() => {
    if (!isPopout || !containerRef.current) return;
    const doc = containerRef.current.ownerDocument;
    if (doc) {
      const bgHex = colorFondo === 'transparent'
        ? (isPopout ? '#070b12' : 'transparent')
        : (colorFondo === 'black' ? '#000000' : (colorFondo === 'green' ? '#00ff00' : '#070b12'));
      if (doc.body) doc.body.style.backgroundColor = bgHex;
      if (doc.documentElement) doc.documentElement.style.backgroundColor = bgHex;
    }
  }, [isPopout, colorFondo]);

  // Copiar link OBS para fuente navegador 100% transparente (con fallback seguro para PiP/Popout)
  const copiarLinkObsDual = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.origin ? (window.location.origin + '/?obs=hud') : 'https://diag-self.vercel.app/?obs=hud';
      const fallback = () => {
        try {
          const ta = document.createElement('textarea');
          ta.value = url;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch (e) {
          prompt('Copia esta URL para OBS Studio:', url);
        }
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          })
          .catch(fallback);
      } else {
        fallback();
      }
    }
  };

  const {
    conectado: mcConectado,
    sps,
    vbus,
    ibus,
    watts,
    dp,
    dm,
    cc1,
    cc2,
    conectar: conectarMc,
    desconectar: desconectarMc
  } = mcMeter || {};

  const cc1Activo = mcConectado && cc1 > 0.25 && cc1 >= cc2;
  const cc2Activo = mcConectado && cc2 > 0.25 && cc2 > cc1;

  const bgStyle = colorFondo === 'transparent'
    ? 'transparent'
    : (colorFondo === 'black' ? '#000000' : (colorFondo === 'green' ? '#00ff00' : '#070b12'));

  if (isMinimized) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          backgroundColor: bgStyle,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'Consolas, monospace',
          color: '#ffffff',
          userSelect: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* DMM Lectura */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#00e5ff', fontWeight: '900', fontSize: '0.8rem' }}>DMM</span>
          <span style={{ color: usbConectado ? '#10b981' : '#ef4444', fontSize: '10px' }}>●</span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {lecturaUsb.prefijo ? `${lecturaUsb.prefijo} ` : ''}{lecturaUsb.valor} {lecturaUsb.unidad}
          </span>
        </div>

        {/* Separador */}
        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        {/* MC-Meter Lectura */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#00e5ff', fontWeight: '900', fontSize: '0.8rem' }}>MC</span>
          <span style={{ color: mcConectado ? '#10b981' : '#ef4444', fontSize: '10px' }}>●</span>
          <span style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {mcConectado ? `${vbus.toFixed(3)}V` : '--V'}
          </span>
          <span style={{ color: '#facc15', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {mcConectado ? `${ibus.toFixed(3)}A` : '--A'}
          </span>
          <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
            {mcConectado ? `${watts.toFixed(2)}W` : '0.0W'}
          </span>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={resetTamanoOriginal}
            title="Restablecer tamaño original (680x210)"
            style={{
              background: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '3px 7px',
              borderRadius: '5px',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <RotateCcw size={10} /> 680×210
          </button>
          <button
            onClick={toggleMinimizar}
            title="Expandir ventana completa"
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '3px 10px',
              borderRadius: '5px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Maximize2 size={12} /> EXPANDIR
          </button>
          {onReacoplar && (
            <button
              onClick={onReacoplar}
              title="Volver a la plataforma"
              style={{
                background: '#1e3a8a',
                color: '#60a5fa',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '0.65rem',
                cursor: 'pointer'
              }}
            >
              ACOPLAR
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minWidth: '560px',
        maxWidth: '720px',
        backgroundColor: bgStyle,
        border: colorFondo === 'transparent' ? 'none' : '1px solid rgba(255,255,255,0.12)',
        borderRadius: isPopout ? '0' : '14px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: 'Consolas, monospace',
        color: '#ffffff',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      {/* CABECERA SUITE UNIFICADA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: colorFondo === 'transparent' ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#00e5ff', letterSpacing: '0.5px' }}>
            ⚡ MARSHALL HARDWARE SUITE (DUAL HUD)
          </span>
          <span style={{ fontSize: '0.65rem', background: '#1e293b', color: '#94a3b8', padding: '1px 6px', borderRadius: '4px' }}>
            1/3 COMPACT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botón copiar URL OBS */}
          <button
            onClick={copiarLinkObsDual}
            title="Copiar URL para OBS Studio (Fuente Navegador con transparencia real 100%)"
            style={{
              background: copiado ? '#065f46' : '#1e293b',
              color: copiado ? '#34d399' : '#38bdf8',
              border: 'none',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {copiado ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
            {copiado ? 'COPIADO' : 'OBS URL (HUD)'}
          </button>

          {/* Selectores de Fondo Croma en Popout */}
          {isPopout && (
            <div style={{ display: 'flex', gap: '3px', background: '#0f172a', padding: '2px 4px', borderRadius: '6px', alignItems: 'center' }}>
              <button
                onClick={() => setColorFondo('dark')}
                title="Fondo Oscuro (Recomendado para Escritorio Windows)"
                style={{ width: '13px', height: '13px', borderRadius: '2px', background: '#070b12', border: colorFondo === 'dark' ? '2px solid #00e5ff' : '1px solid #334155', cursor: 'pointer' }}
              />
              <button
                onClick={() => setColorFondo('black')}
                title="Fondo Negro (Para filtro Color Key / Screen en OBS)"
                style={{ width: '13px', height: '13px', borderRadius: '2px', background: '#000000', border: colorFondo === 'black' ? '2px solid #00e5ff' : '1px solid #334155', cursor: 'pointer' }}
              />
              <button
                onClick={() => setColorFondo('green')}
                title="Fondo Verde (Para filtro Chroma Key en OBS)"
                style={{ width: '13px', height: '13px', borderRadius: '2px', background: '#00ff00', border: colorFondo === 'green' ? '2px solid #00e5ff' : 'none', cursor: 'pointer' }}
              />
              <button
                onClick={() => setColorFondo('transparent')}
                title="Transparente (Para OBS Browser Source / Fuente Navegador)"
                style={{ width: '13px', height: '13px', borderRadius: '2px', background: 'transparent', border: colorFondo === 'transparent' ? '2px solid #00e5ff' : '1px dashed #64748b', cursor: 'pointer' }}
              />
            </div>
          )}

          {/* Botón Reset Tamaño Original (680x210) */}
          {isPopout && (
            <button
              onClick={resetTamanoOriginal}
              title="Restablecer tamaño original por defecto (680 x 210 px)"
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
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
              <RotateCcw size={10} /> 680×210
            </button>
          )}

          {/* Botón Minimizar a barra delgada */}
          {isPopout && (
            <button
              onClick={toggleMinimizar}
              title={isMinimized ? "Restaurar ventana completa" : "Minimizar a barra delgada flotante (no tapa esquemáticos)"}
              style={{
                background: isMinimized ? '#0284c7' : '#1e293b',
                color: isMinimized ? '#ffffff' : '#fbbf24',
                border: `1px solid ${isMinimized ? '#38bdf8' : '#78350f'}`,
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
              {isMinimized ? <Maximize2 size={10} /> : <Minus size={10} />}
              {isMinimized ? 'EXPANDIR' : 'MIN'}
            </button>
          )}

          {/* Botón Re-acoplar */}
          {onReacoplar && (
            <button
              onClick={onReacoplar}
              title="Volver a la vista dividida 50%/50% en la plataforma"
              style={{
                background: '#1e3a8a',
                color: '#60a5fa',
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

      {/* CUERPO DUAL DIVIDIDO: MULTÍMETRO (IZQ) / MC-METER PRO (DER) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '12px', alignItems: 'stretch' }}>
        {/* PANEL IZQUIERDO: MULTÍMETRO */}
        <div style={{
          background: colorFondo === 'transparent' ? 'transparent' : 'rgba(17, 24, 39, 0.5)',
          borderRadius: '10px',
          padding: '6px 10px',
          border: colorFondo === 'transparent' ? '1px solid rgba(0, 255, 255, 0.18)' : '1px solid rgba(255,255,255,0.06)'
        }}>
          <MultimetroMiniHUD
            valor={lecturaUsb.valor}
            unidad={lecturaUsb.unidad}
            prefijo={lecturaUsb.prefijo}
            modoKey={lecturaUsb.modoKey}
            enviarCmdDmmFn={enviarCmdDmmFn}
            conectado={usbConectado}
            conectarFn={conectarMultimetroFn}
            desconectarFn={desconectarMultimetroFn}
            escalaActiva={escalaActiva}
            setEscalaFn={setEscalaFn}
            autoHoldActivo={autoHoldActivo}
            toggleAutoHoldFn={toggleAutoHoldFn}
            maxVal={maxVal}
            minVal={minVal}
            resetMaxMinFn={resetMaxMinFn}
            isPopout={isPopout}
            isPip={isPip}
            colorFondo={colorFondo}
          />
        </div>

        {/* PANEL DERECHO: MARSHALL MC-METER PRO */}
        <div style={{
          background: colorFondo === 'transparent' ? 'transparent' : 'rgba(17, 24, 39, 0.5)',
          borderRadius: '10px',
          padding: '8px 10px',
          border: colorFondo === 'transparent' ? '1px solid rgba(0, 229, 255, 0.18)' : '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Header MC-Meter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: mcConectado ? '#10b981' : '#ef4444', fontSize: '11px' }}>●</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#00e5ff' }}>MC-METER PRO</span>
              <span style={{ fontSize: '0.6rem', color: '#fbbf24', background: '#172554', padding: '1px 4px', borderRadius: '3px' }}>{sps || '-- SPS'}</span>
            </div>
            {onAbrirOscilograma && (
              <button
                onClick={onAbrirOscilograma}
                title="Abrir oscilograma completo"
                style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Activity size={10} /> OSC
              </button>
            )}
          </div>

          {/* Valores VBUS e IBUS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', margin: '4px 0' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '4px 6px' }}>
              <div style={{ fontSize: '0.6rem', color: '#f87171', fontWeight: 'bold' }}>VBUS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff3b3b', lineHeight: 1.1 }}>
                {mcConectado ? vbus.toFixed(3) : '0.000'}<span style={{ fontSize: '0.75rem', marginLeft: '2px' }}>V</span>
              </div>
            </div>
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '6px', padding: '4px 6px' }}>
              <div style={{ fontSize: '0.6rem', color: '#fde047', fontWeight: 'bold' }}>IBUS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#facc15', lineHeight: 1.1 }}>
                {mcConectado ? ibus.toFixed(3) : '0.000'}<span style={{ fontSize: '0.75rem', marginLeft: '2px' }}>A</span>
              </div>
            </div>
          </div>

          {/* Watts y Pines USB-C */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
            <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
              ⚡ {mcConectado ? `${watts.toFixed(2)} W` : '0.00 W'}
            </span>
            <div style={{ display: 'flex', gap: '6px', fontSize: '0.62rem', color: '#94a3b8' }}>
              <span style={{ color: cc1Activo ? '#10b981' : '#64748b' }}>CC1: {mcConectado ? cc1.toFixed(2) : '0.0'}V</span>
              <span style={{ color: cc2Activo ? '#10b981' : '#64748b' }}>CC2: {mcConectado ? cc2.toFixed(2) : '0.0'}V</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
