import React, { useState, useEffect } from 'react';
import { Save, Cloud, CloudOff, Check, AlertCircle } from 'lucide-react';

export default function FPCInteligente({ pines, setPines, pinActivo, setPinActivo, modo = 'diagnostico', escala = 'diodo', lecturaEnVivo, tiposDisponibles: tiposProp = ['DATA', 'VCC', 'GND', 'NC'], setTiposDisponibles, onGuardar, cambiosPendientes = false, guardando = false, ultimaSincronizacion = null }) {
  const [tiposInternos, setTiposInternos] = useState(tiposProp);
  const tipos = setTiposDisponibles ? tiposProp : tiposInternos;
  const setTipos = setTiposDisponibles || setTiposInternos;

  const mitad = Math.ceil(pines.length / 2);
  const filaSup = pines.slice(0, mitad);
  const filaInf = pines.slice(mitad);

  const manejarAgregarTipo = () => {
    const nuevoTipo = window.prompt('Ingrese el nombre del nuevo tipo de línea (Ej: I2C, SPI):', '');
    if (nuevoTipo && nuevoTipo.trim() !== '') {
      const tipoLimpio = nuevoTipo.trim().toUpperCase().replace(/\s+/g, '_');
      if (!tipos.includes(tipoLimpio)) {
        setTipos([...tipos, tipoLimpio]);
        setPines(prev => prev.map(p =>
          p.id === pinActivo ? { ...p, tipo: tipoLimpio, nombre: tipoLimpio } : p
        ));
      } else {
        alert('Este tipo ya existe en la lista.');
      }
    }
  };

  const obtenerColorPin = (pin) => {
    const colorBase = pin.colorCustom || '#d4af37';

    if (modo === 'crear') {
      if (pinActivo === pin.id) return '#00ffff';
      if (pin.tipo === 'GND') return '#4b5563';
      if (pin.tipo === 'NC') return '#1e3a8a';
      if (pin.tipo === 'VCC') return '#7f1d1d';
      return colorBase;
    }

    if (pin.tipo === 'GND') return '#4b5563';
    if (pin.tipo === 'NC') return '#1e3a8a';

    const valActual = escala === 'diodo'
      ? (pin.valorActualDiodo !== undefined ? pin.valorActualDiodo : pin.valorActual)
      : (pin.valorActualUa !== undefined ? pin.valorActualUa : '---');

    const valSano = escala === 'diodo'
      ? (pin.valorSanoDiodo !== undefined ? pin.valorSanoDiodo : pin.valorSano)
      : (pin.valorSanoUa !== undefined ? pin.valorSanoUa : '---');

    if (!valActual || valActual === '---') return colorBase;
    if (valActual === 'OL' && valSano !== 'OL') return '#f97316';

    const vAct = parseFloat(valActual);
    const vSano = parseFloat(valSano);

    if (escala === 'diodo') {
      if (vAct < 0.050) return '#ef4444';
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 0.040) return '#10b981';
    } else {
      if (vAct > 2000) return '#ef4444';
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 50) return '#10b981';
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

  const renderPin = (pin, esArriba, isExtremo) => {
    const valSano = escala === 'diodo'
      ? (pin.valorSanoDiodo !== undefined ? pin.valorSanoDiodo : pin.valorSano)
      : (pin.valorSanoUa !== undefined ? pin.valorSanoUa : '---');

    const valActual = escala === 'diodo'
      ? (pin.valorActualDiodo !== undefined ? pin.valorActualDiodo : pin.valorActual)
      : (pin.valorActualUa !== undefined ? pin.valorActualUa : '---');

    const valorTexto = modo === 'crear' ? formNum(valSano, pin.tipo) : formNum(valActual, pin.tipo);

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
        {esArriba && <span style={{ fontSize: '0.55rem', color: 'gray', marginBottom: '2px' }}>{pin.id}</span>}
        <div
          style={{
            width: '100%',
            height: '30px',
            backgroundColor: obtenerColorPin(pin),
            border: pinActivo === pin.id ? '2px solid #fff' : '1px solid #222',
            borderRadius: '4px',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <span
            style={{
              fontSize: '0.6rem',
              fontWeight: 'bold',
              color: pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : '#000',
              textShadow: pin.tipo !== 'GND' && pin.tipo !== 'NC' ? 'none' : '1px 1px 2px #000'
            }}
          >
            {valorTexto}
          </span>
        </div>
        {!esArriba && <span style={{ fontSize: '0.55rem', color: 'gray', marginTop: '2px' }}>{pin.id}</span>}
      </div>
    );
  };

  // Formatear tiempo relativo
  const tiempoRelativo = (fecha) => {
    if (!fecha) return '';
    const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
    if (segundos < 60) return `hace ${segundos}s`;
    if (segundos < 3600) return `hace ${Math.floor(segundos / 60)}min`;
    return `hace ${Math.floor(segundos / 3600)}h`;
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
      <style>{`
        .fpc-scroll-container::-webkit-scrollbar { height: 10px; }
        .fpc-scroll-container::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 5px; }
        .fpc-scroll-container::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 5px; cursor: pointer; }
        .fpc-scroll-container::-webkit-scrollbar-thumb:hover { background: #2563eb; }
      `}</style>

      {/* BARRA SUPERIOR CON INDICADOR DE ESTADO Y BOTÓN GUARDAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>

        {/* Indicador de estado de sincronización */}
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

        {/* Botón Guardar */}
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
              opacity: guardando ? 0.7 : 1,
              animation: cambiosPendientes ? 'pulse 2s infinite' : 'none'
            }}
            title={cambiosPendientes ? 'Hay cambios sin guardar en la nube' : 'Todo está sincronizado'}
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

      <div
        className="fpc-scroll-container"
        style={{
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '12px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            backgroundColor: '#000',
            padding: '12px',
            borderRadius: '10px',
            width: 'max-content'
          }}
        >
          <div style={{ display: 'flex', gap: '3px' }}>
            {filaSup.map((pin, i) => renderPin(pin, true, i === 0 || i === filaSup.length - 1))}
          </div>
          <div style={{ height: '8px', backgroundColor: '#1a1a1a', borderRadius: '2px', width: '100%' }} />
          <div style={{ display: 'flex', gap: '3px' }}>
            {filaInf.map((pin, i) => renderPin(pin, false, i === 0 || i === filaInf.length - 1))}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#1a1a1a',
          borderRadius: '10px',
          borderLeft: `4px solid ${obtenerColorPin(pines.find(p => p.id === pinActivo) || {})}`
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
                  value={pines.find(p => p.id === pinActivo)?.colorCustom || '#d4af37'}
                  onChange={(e) => setPines(prev => prev.map(p => p.id === pinActivo ? { ...p, colorCustom: e.target.value } : p))}
                  style={{ padding: '0', border: 'none', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', background: 'transparent' }}
                  title="Color personalizado de la línea"
                />

                <input
                  value={pines.find(p => p.id === pinActivo)?.nombre || ''}
                  onChange={(e) =>
                    setPines(prev => prev.map(p => p.id === pinActivo ? { ...p, nombre: e.target.value.replace(/ /g, '_') } : p))
                  }
                  placeholder="Nombre_de_linea"
                  style={{ background: '#000', color: 'white', border: '1px solid #333', padding: '6px 10px', borderRadius: '5px', width: '140px', outline: 'none', fontSize: '0.85rem' }}
                />

                <select
                  value={pines.find(p => p.id === pinActivo)?.tipo || 'DATA'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPines(prev =>
                      prev.map(p =>
                        p.id === pinActivo ? {
                          ...p,
                          tipo: val,
                          nombre: val
                        } : p
                      )
                    );
                  }}
                  style={{ background: '#1f2937', color: 'white', border: '1px solid #333', padding: '6px 10px', borderRadius: '5px', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {tipos.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>

                <button
                  onClick={manejarAgregarTipo}
                  style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  + Añadir Tipo
                </button>

                <button
                  onClick={() => {
                    if (pines.length <= 1) return alert('No puedes eliminar el último pin.');
                    if (!window.confirm('¿Seguro de eliminar este pin específico?')) return;
                    setPines(prev => {
                      const nuevosPines = prev.filter(p => p.id !== pinActivo);
                      return nuevosPines.map((p, i) => ({ ...p, id: i + 1 }));
                    });
                    setPinActivo(1);
                  }}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  - Quitar Pin
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: pines.find(p => p.id === pinActivo)?.colorCustom || '#d4af37', marginRight: '8px' }}></span>
                <span style={{ display: 'inline-block', color: '#fff', fontSize: '0.85rem' }}>
                  {pines.find(p => p.id === pinActivo)?.nombre || 'Línea sin nombre'}
                </span>
                <span style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#374151', color: 'white', fontWeight: 'bold' }}>
                  {pines.find(p => p.id === pinActivo)?.tipo || 'DATA'}
                </span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flex: '0 1 auto' }}>
            <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block' }}>
              Valor Sano:{' '}
              <strong style={{ color: '#fff' }}>
                {(escala === 'diodo'
                  ? (pines.find(p => p.id === pinActivo)?.valorSanoDiodo !== undefined ? pines.find(p => p.id === pinActivo)?.valorSanoDiodo : pines.find(p => p.id === pinActivo)?.valorSano)
                  : (pines.find(p => p.id === pinActivo)?.valorSanoUa !== undefined ? pines.find(p => p.id === pinActivo)?.valorSanoUa : '---')) || '---'}{' '}
                {escala === 'diodo' ? 'V' : 'uA'}
              </strong>
            </span>
            <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
              Actual:{' '}
              <strong style={{ color: '#fff', fontSize: '1.3rem' }}>
                {pinActivo === pines.find(p => p.id === pinActivo)?.id && lecturaEnVivo !== '----'
                  ? lecturaEnVivo
                  : (escala === 'diodo'
                    ? (pines.find(p => p.id === pinActivo)?.valorActualDiodo !== undefined ? pines.find(p => p.id === pinActivo)?.valorActualDiodo : pines.find(p => p.id === pinActivo)?.valorActual)
                    : (pines.find(p => p.id === pinActivo)?.valorActualUa !== undefined ? pines.find(p => p.id === pinActivo)?.valorActualUa : '---')) || '---'}{' '}
                {escala === 'diodo' ? 'V' : 'uA'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Animaciones CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.7); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}