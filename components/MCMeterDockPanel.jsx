import React from 'react';
import { Maximize2, Activity, Zap, RotateCcw, Link as LinkIcon, X } from 'lucide-react';

export default function MCMeterDockPanel({
  mcMeter,
  onDesacoplar,
  onAbrirOscilograma,
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
    conectar,
    desconectar,
    resetPeak
  } = mcMeter;

  // Formateadores numéricos según modo avanzado (🔬)
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

  const cc1Activo = conectado && cc1 > 0.25 && cc1 >= cc2;
  const cc2Activo = conectado && cc2 > 0.25 && cc2 > cc1;

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        border: conectado ? '2px solid rgba(0, 229, 255, 0.4)' : '2px solid #333333',
        borderRadius: '15px',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginBottom: '15px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: conectado ? '0 0 20px rgba(0, 229, 255, 0.15)' : 'none',
        fontFamily: 'Consolas, monospace'
      }}
    >
      {/* 1. BARRA SUPERIOR DE HERRAMIENTAS */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              color: conectado ? '#10b981' : '#ef4444',
              fontSize: '12px'
            }}
          >
            ●
          </span>
          <span style={{ color: '#00e5ff', fontSize: '0.8rem', fontWeight: 'bold' }}>
            MARSHALL MC-METER PRO
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              backgroundColor: '#172554',
              color: '#fbbf24',
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            {sps}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Conectar / Desconectar */}
          <button
            onClick={conectado ? desconectar : conectar}
            style={{
              background: conectado ? 'rgba(239, 68, 68, 0.2)' : '#333',
              color: conectado ? '#ef4444' : 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <LinkIcon size={12} /> {conectado ? 'DESCONECTAR' : 'CONECTAR USB'}
          </button>

          {/* Modo Avanzado 🔬 */}
          <button
            onClick={() => setModoAvanzado(!modoAvanzado)}
            title="Alternar Micro-Dígitos de 6 decimales"
            style={{
              background: modoAvanzado ? '#1e3a8a' : '#333',
              color: modoAvanzado ? '#00e5ff' : 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔬 {modoAvanzado ? '6 DIG' : '3 DIG'}
          </button>

          {/* Botón Oscilograma Amperios */}
          <button
            onClick={onAbrirOscilograma}
            style={{
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
              border: '1px solid #06b6d4',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 0 10px rgba(6,182,212,0.3)'
            }}
          >
            <Activity size={12} /> OSCILOGRAMA
          </button>

          {/* Botón Desacoplar 🗗 (Ventana Externa para OBS Studio) */}
          <button
            onClick={() => onDesacoplar && onDesacoplar('popout')}
            title="Abrir ventana externa independiente del Sistema Operativo para capturar directamente en OBS Studio ('Captura de Ventana')"
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '6px 11px',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 0 10px rgba(2, 132, 199, 0.35)'
            }}
          >
            <Maximize2 size={12} /> DESACOPLAR (OBS)
          </button>
        </div>
      </div>

      {/* 2. VALORES PRINCIPALES: VBUS E IBUS EN GRANDE */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          alignItems: 'center',
          margin: '8px 0'
        }}
      >
        {/* VBUS */}
        <div
          style={{
            backgroundColor: '#0c1424',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '10px 14px'
          }}
        >
          <div style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 'bold' }}>VBUS</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-start', marginTop: '2px' }}>
            <span style={{ color: '#ff4444', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>
              {vData.ent}
            </span>
            {vData.micro && (
              <span style={{ color: '#f87171', fontSize: '1rem', fontWeight: 700, marginLeft: '4px' }}>
                {vData.micro}
              </span>
            )}
            <span style={{ color: '#fca5a5', fontSize: '1.1rem', fontWeight: 700, marginLeft: '4px' }}>
              {vData.unit}
            </span>
          </div>
        </div>

        {/* IBUS */}
        <div
          style={{
            backgroundColor: '#0c1424',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '10px 14px'
          }}
        >
          <div style={{ color: '#fde047', fontSize: '0.75rem', fontWeight: 'bold' }}>IBUS</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-start', marginTop: '2px' }}>
            <span style={{ color: '#facc15', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>
              {iData.ent}
            </span>
            {iData.micro && (
              <span style={{ color: '#fde047', fontSize: '1rem', fontWeight: 700, marginLeft: '4px' }}>
                {iData.micro}
              </span>
            )}
            <span style={{ color: '#fde047', fontSize: '1.1rem', fontWeight: 700, marginLeft: '4px' }}>
              {iData.unit}
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILA DE POTENCIA, PICO Y PINES USB-C */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0c1424',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '6px 12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: 'bold' }}>
            PWR: {fmtWatts(watts)}
          </span>
          <span style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 'bold' }}>
            PEAK: {peakIbus.toFixed(3)}A
          </span>
          <button
            onClick={resetPeak}
            title="Resetear pico de corriente"
            style={{
              background: '#1e293b',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '3px',
              padding: '1px 5px',
              fontSize: '0.65rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={10} />
          </button>
        </div>

        {/* Pines USB-C */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold' }}>
            D+:{fmtPin(dp)}
          </span>
          <span style={{ color: '#eab308', fontSize: '0.75rem', fontWeight: 'bold' }}>
            D-:{fmtPin(dm)}
          </span>
          <span
            style={{
              color: cc1Activo ? '#10b981' : '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              border: cc1Activo ? '1px solid #10b981' : 'none',
              padding: cc1Activo ? '1px 4px' : 0,
              borderRadius: '3px',
              backgroundColor: cc1Activo ? 'rgba(16, 185, 129, 0.15)' : 'transparent'
            }}
          >
            {cc1Activo ? `[CC1:${fmtPin(cc1)}]` : `CC1:${fmtPin(cc1)}`}
          </span>
          <span
            style={{
              color: cc2Activo ? '#10b981' : '#c084fc',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              border: cc2Activo ? '1px solid #10b981' : 'none',
              padding: cc2Activo ? '1px 4px' : 0,
              borderRadius: '3px',
              backgroundColor: cc2Activo ? 'rgba(16, 185, 129, 0.15)' : 'transparent'
            }}
          >
            {cc2Activo ? `[CC2:${fmtPin(cc2)}]` : `CC2:${fmtPin(cc2)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
