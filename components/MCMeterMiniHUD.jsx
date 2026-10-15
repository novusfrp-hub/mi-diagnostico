import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, X, ChevronDown, ChevronUp, Activity, Pin, PinOff, RotateCcw } from 'lucide-react';

export default function MCMeterMiniHUD({
  mcMeter,
  onAbrirGrande,
  onReacoplar,
  modoAvanzado,
  setModoAvanzado
}) {
  const {
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
    miniVbusRef,
    miniIbusRef,
    conectar,
    desconectar,
    resetPeak
  } = mcMeter;

  const [expandido, setExpandido] = useState(false);
  const [mostrarMiniGrafico, setMostrarMiniGrafico] = useState(false);
  const [anclado, setAnclado] = useState(false);

  const canvasRef = useRef(null);

  // Formateadores numéricos
  const fmtVbus = (val) => {
    if (!conectado) return { ent: '0.000', micro: '', unit: 'V' };
    const s = val.toFixed(6).split('.');
    if (modoAvanzado) {
      return { ent: `${s[0]}.${s[1].slice(0, 3)}`, micro: ` ${s[1].slice(3)}`, unit: 'V' };
    }
    return { ent: val.toFixed(3), micro: '', unit: 'V' };
  };

  const fmtIbus = (val) => {
    if (!conectado) return { ent: '0.000', micro: '', unit: 'A' };
    const s = val.toFixed(6).split('.');
    if (modoAvanzado) {
      return { ent: `${s[0]}.${s[1].slice(0, 3)}`, micro: ` ${s[1].slice(3)}`, unit: 'A' };
    }
    return { ent: val.toFixed(3), micro: '', unit: 'A' };
  };

  const fmtWatts = (val) => {
    if (!conectado) return '0.000 W';
    if (modoAvanzado) {
      const s = val.toFixed(5).split('.');
      return `${s[0]}.${s[1].slice(0, 3)} ${s[1].slice(3)} W`;
    }
    return `${val.toFixed(3)} W`;
  };

  const fmtPin = (val) => {
    if (!conectado) return '0.00V';
    return modoAvanzado ? `${val.toFixed(3)}V` : `${val.toFixed(2)}V`;
  };

  const vData = fmtVbus(vbus);
  const iData = fmtIbus(ibus);

  // Detección de pin CC activo
  const cc1Activo = conectado && cc1 > 0.25 && cc1 >= cc2;
  const cc2Activo = conectado && cc2 > 0.25 && cc2 > cc1;

  // Dibujado del Mini Sparkline Canvas (180 muestras)
  useEffect(() => {
    if (!mostrarMiniGrafico || !canvasRef.current) return;
    let animId;

    const renderMini = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#04070d';
      ctx.fillRect(0, 0, w, h);

      // Líneas de rejilla sutiles
      ctx.strokeStyle = '#111c30';
      ctx.lineWidth = 1;
      for (const y of [22, 45, 68]) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const vList = miniVbusRef.current || [];
      const iList = miniIbusRef.current || [];
      const n = vList.length;

      if (n >= 2) {
        let minV = Math.min(...vList);
        let maxV = Math.max(...vList);
        let minI = Math.min(...iList);
        let maxI = Math.max(...iList);

        if (maxV - minV < 0.1) {
          minV = Math.max(0, minV - 0.2);
          maxV += 0.2;
        }
        if (maxI - minI < 0.05) {
          minI = Math.max(0, minI - 0.05);
          maxI += 0.05;
        }

        const spanV = Math.max(1e-5, maxV - minV);
        const spanI = Math.max(1e-5, maxI - minI);

        // Curva VBUS (Rojo)
        ctx.strokeStyle = '#ff3b3b';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let idx = 0; idx < n; idx++) {
          const x = (idx / (n - 1)) * w;
          const y = h - 5 - ((vList[idx] - minV) / spanV) * (h - 10);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Curva IBUS (Amarillo)
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let idx = 0; idx < n; idx++) {
          const x = (idx / (n - 1)) * w;
          const y = h - 5 - ((iList[idx] - minI) / spanI) * (h - 10);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(renderMini);
    };

    renderMini();
    return () => cancelAnimationFrame(animId);
  }, [mostrarMiniGrafico, miniVbusRef, miniIbusRef]);

  return (
    <motion.div
      drag={!anclado}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'fixed',
        top: '75px',
        right: '25px',
        zIndex: 9990,
        width: '320px',
        backgroundColor: '#070b12',
        border: '1px solid #1e3a5f',
        borderRadius: '12px',
        boxShadow: conectado
          ? '0 10px 30px rgba(0, 229, 255, 0.2), 0 0 15px rgba(2, 132, 199, 0.3)'
          : '0 10px 30px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: 'Consolas, monospace'
      }}
    >
      {/* BARRA SUPERIOR CON CONTROLES */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          padding: '6px 10px',
          borderBottom: '1px solid #1e293b',
          cursor: anclado ? 'default' : 'grab'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              color: conectado ? '#10b981' : '#ef4444',
              fontSize: '12px',
              animation: conectado ? 'pulse 2s infinite' : 'none'
            }}
          >
            ●
          </span>
          <span style={{ color: '#00e5ff', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px' }}>
            MC-METER PRO
          </span>
          <span
            style={{
              backgroundColor: '#172554',
              color: '#fbbf24',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '4px'
            }}
          >
            {sps}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Botón Re-Acoplar a Hardware Suite 🔗 */}
          {onReacoplar && (
            <button
              onClick={onReacoplar}
              title="Re-acoplar en Marshall Hardware Suite"
              style={{
                background: '#1e293b',
                border: '1px solid #00e5ff',
                borderRadius: '4px',
                color: '#00e5ff',
                padding: '3px 6px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              🔗 Acoplar
            </button>
          )}

          {/* Botón Anclar */}
          <button
            onClick={() => setAnclado(!anclado)}
            title={anclado ? 'Desanclar (Arrastrable)' : 'Anclar (Fijo)'}
            style={{
              background: '#1e293b',
              border: 'none',
              borderRadius: '4px',
              color: anclado ? '#10b981' : '#64748b',
              padding: '3px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {anclado ? <Pin size={12} /> : <PinOff size={12} />}
          </button>

          {/* Botón Modo Avanzado 🔬 */}
          <button
            onClick={() => setModoAvanzado(!modoAvanzado)}
            title="Alternar Modo Avanzado (Micro-dígitos de 6 decimales)"
            style={{
              background: modoAvanzado ? '#1e3a8a' : '#1e293b',
              border: 'none',
              borderRadius: '4px',
              color: modoAvanzado ? '#00e5ff' : '#64748b',
              padding: '3px 6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            🔬
          </button>

          {/* Botón Sparkline 📈 */}
          <button
            onClick={() => setMostrarMiniGrafico(!mostrarMiniGrafico)}
            title="Mini-Gráfico Sparkline"
            style={{
              background: mostrarMiniGrafico ? '#1e3a8a' : '#1e293b',
              border: 'none',
              borderRadius: '4px',
              color: mostrarMiniGrafico ? '#00e5ff' : '#94a3b8',
              padding: '3px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Activity size={12} />
          </button>

          {/* Botón 🗗 ABRIR GRANDE (EXCLUSIÓN MUTUA) */}
          <button
            onClick={onAbrirGrande}
            title="Abrir Analizador Oscilograma X-Y a Pantalla Grande (Oculta este Mini-HUD)"
            style={{
              background: '#0284c7',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              padding: '3px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 700
            }}
          >
            <Maximize2 size={12} />
          </button>

          {/* Botón Desplegar Panel ▾ */}
          <button
            onClick={() => setExpandido(!expandido)}
            title="Expandir / Contraer Pines y Potencia"
            style={{
              background: '#1e293b',
              border: 'none',
              borderRadius: '4px',
              color: '#00e5ff',
              padding: '3px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Botón Cerrar / Reacoplar */}
          <button
            onClick={onReacoplar || (conectado ? desconectar : conectar)}
            title={onReacoplar ? "Cerrar ventana flotante y re-acoplar a la Suite" : (conectado ? 'Desconectar MC-Meter' : 'Conectar MC-Meter')}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: 'none',
              borderRadius: '4px',
              color: '#ef4444',
              padding: '3px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 800,
              fontSize: '11px'
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* CUERPO PRINCIPAL: VBUS E IBUS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '8px 10px' }}>
        {/* Celda VBUS */}
        <div
          style={{
            backgroundColor: '#0c1424',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '6px 8px'
          }}
        >
          <div style={{ color: '#fca5a5', fontSize: '0.68rem', fontWeight: 700, marginBottom: '2px' }}>
            VBUS
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end' }}>
            <span style={{ color: '#ff4444', fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>
              {vData.ent}
            </span>
            {vData.micro && (
              <span style={{ color: '#f87171', fontSize: '0.72rem', fontWeight: 700, marginLeft: '2px' }}>
                {vData.micro}
              </span>
            )}
            <span style={{ color: '#fca5a5', fontSize: '0.8rem', fontWeight: 700, marginLeft: '2px' }}>
              {vData.unit}
            </span>
          </div>
        </div>

        {/* Celda IBUS */}
        <div
          style={{
            backgroundColor: '#0c1424',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '6px 8px'
          }}
        >
          <div style={{ color: '#fde047', fontSize: '0.68rem', fontWeight: 700, marginBottom: '2px' }}>
            IBUS
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end' }}>
            <span style={{ color: '#facc15', fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>
              {iData.ent}
            </span>
            {iData.micro && (
              <span style={{ color: '#fde047', fontSize: '0.72rem', fontWeight: 700, marginLeft: '2px' }}>
                {iData.micro}
              </span>
            )}
            <span style={{ color: '#fde047', fontSize: '0.8rem', fontWeight: 700, marginLeft: '2px' }}>
              {iData.unit}
            </span>
          </div>
        </div>
      </div>

      {/* MINI OSCILOGRAMA INTEGRADO (SPARKLINE) */}
      {mostrarMiniGrafico && (
        <div style={{ padding: '0 10px 8px 10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#0c1424',
              padding: '3px 8px',
              borderRadius: '6px 6px 0 0',
              border: '1px solid #1e293b',
              borderBottom: 'none'
            }}
          >
            <span style={{ color: '#facc15', fontSize: '0.7rem', fontWeight: 700 }}>
              PEAK: {peakIbus.toFixed(3)}A
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={resetPeak}
                style={{
                  background: '#1e293b',
                  border: 'none',
                  color: '#cbd5e1',
                  borderRadius: '3px',
                  padding: '2px 5px',
                  fontSize: '0.65rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <RotateCcw size={10} /> RST
              </button>
              <button
                onClick={onAbrirGrande}
                style={{
                  background: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🗗 ABRIR GRANDE
              </button>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={300}
            height={85}
            style={{
              display: 'block',
              width: '100%',
              height: '85px',
              backgroundColor: '#04070d',
              border: '1px solid #1e293b',
              borderRadius: '0 0 6px 6px'
            }}
          />
        </div>
      )}

      {/* PANEL EXPANDIDO: POTENCIA Y PINES DE CARGA */}
      {expandido && (
        <div style={{ padding: '0 10px 10px 10px' }}>
          {/* Potencia (Watts) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#0c1424',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '6px 10px',
              marginBottom: '6px'
            }}
          >
            <span style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 700 }}>
              POTENCIA
            </span>
            <span style={{ color: '#38bdf8', fontSize: '0.95rem', fontWeight: 800 }}>
              {fmtWatts(watts)}
            </span>
          </div>

          {/* Grilla de Pines D+, D-, CC1, CC2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {/* D+ */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0b1220',
                border: '1px solid #19253d',
                borderRadius: '6px',
                padding: '4px 8px'
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700 }}>D+</span>
              <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 800 }}>{fmtPin(dp)}</span>
            </div>

            {/* D- */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0b1220',
                border: '1px solid #19253d',
                borderRadius: '6px',
                padding: '4px 8px'
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700 }}>D-</span>
              <span style={{ color: '#eab308', fontSize: '0.85rem', fontWeight: 800 }}>{fmtPin(dm)}</span>
            </div>

            {/* CC1 con enmarcado verde en activo */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0b1220',
                border: cc1Activo ? '2px solid #10b981' : '1px solid #19253d',
                borderRadius: '6px',
                padding: '4px 8px',
                boxShadow: cc1Activo ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              <span style={{ color: cc1Activo ? '#10b981' : '#94a3b8', fontSize: '0.7rem', fontWeight: 700 }}>
                {cc1Activo ? '[CC1]' : 'CC1'}
              </span>
              <span style={{ color: cc1Activo ? '#10b981' : '#38bdf8', fontSize: '0.85rem', fontWeight: 800 }}>
                {fmtPin(cc1)}
              </span>
            </div>

            {/* CC2 con enmarcado verde en activo */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0b1220',
                border: cc2Activo ? '2px solid #10b981' : '1px solid #19253d',
                borderRadius: '6px',
                padding: '4px 8px',
                boxShadow: cc2Activo ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              <span style={{ color: cc2Activo ? '#10b981' : '#94a3b8', fontSize: '0.7rem', fontWeight: 700 }}>
                {cc2Activo ? '[CC2]' : 'CC2'}
              </span>
              <span style={{ color: cc2Activo ? '#10b981' : '#c084fc', fontSize: '0.85rem', fontWeight: 800 }}>
                {fmtPin(cc2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
