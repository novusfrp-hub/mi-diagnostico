import React, { useState, useEffect } from 'react';
import { Save, Cloud, CloudOff, Check, AlertCircle } from 'lucide-react';
import SelectorTipoLinea from './SelectorTipoLinea.js';

const LETRAS_FILAS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'T', 'U', 'V', 'W', 'Y',
  'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AP', 'AR', 'AT', 'AU', 'AV', 'AW', 'AY'
];

export default function ICInteligente({
  ic,
  setPines,
  padActivo,
  setPadActivo,
  modo = 'diagnostico',
  escala = 'diodo',
  lecturaEnVivo,
  tiposCustom = [],
  setTiposCustom,
  onGuardar,
  cambiosPendientes = false,
  guardando = false,
  ultimaSincronizacion = null,
  onRegistrarOL
}) {

  const filasCount = parseInt(ic.filas) || 5;
  const columnasCount = parseInt(ic.columnas) || 5;
  const esquinaGuia = ic.esquinaGuia || 'top-left';

  // Obtener letras correspondientes a las filas
  const filasLetras = LETRAS_FILAS.slice(0, filasCount);

  // Asegurar que ic.pines existe y contiene todos los pads
  const pines = ic.pines || [];

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
          String(p.id) === String(padActivo) ? { ...p, tipo: tipoLimpio, nombre: tipoLimpio } : p
        ));
      }
    }
  };

  const obtenerColorPad = (pad) => {
    if (!pad) return '#374151'; // color por defecto si no existe
    const colorBase = pad.colorCustom || '#d4af37';

    if (modo === 'crear') {
      if (String(padActivo) === String(pad.id)) return '#00ffff';
      if (pad.tipo === 'GND') return '#4b5563';
      if (pad.tipo === 'NC') return '#1e3a8a';
      if (pad.tipo === 'VCC') return '#7f1d1d';
      return colorBase;
    }

    if (pad.tipo === 'GND') return '#4b5563';
    if (pad.tipo === 'NC') return '#1e3a8a';

    let valActual = '---';
    let valSano = '---';

    if (escala === 'diodo') {
      valActual = pad.valorActualDiodo !== undefined ? pad.valorActualDiodo : pad.valorActual;
      valSano = pad.valorSanoDiodo !== undefined ? pad.valorSanoDiodo : pad.valorSano;
    } else if (escala === 'ua') {
      valActual = pad.valorActualUa !== undefined ? pad.valorActualUa : '---';
      valSano = pad.valorSanoUa !== undefined ? pad.valorSanoUa : '---';
    } else if (escala === 'voltio') {
      valActual = pad.valorActualVoltio !== undefined ? pad.valorActualVoltio : '---';
      valSano = pad.valorSanoVoltio !== undefined ? pad.valorSanoVoltio : '---';
    } else if (escala === 'ohmio') {
      valActual = pad.valorActualOhmio !== undefined ? pad.valorActualOhmio : '---';
      valSano = pad.valorSanoOhmio !== undefined ? pad.valorSanoOhmio : '---';
    } else if (escala === 'amperio') {
      valActual = pad.valorActualAmperio !== undefined ? pad.valorActualAmperio : '---';
      valSano = pad.valorSanoAmperio !== undefined ? pad.valorSanoAmperio : '---';
    }

    if (!valActual || valActual === '---') return colorBase;
    if (valActual === 'OL' && valSano !== 'OL') return '#f97316';

    const vAct = parseFloat(valActual);
    const vSano = parseFloat(valSano);

    if (escala === 'diodo') {
      if (vAct < 0.050) return '#ef4444'; // Corto
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 0.040) return '#10b981'; // Sano
    } else if (escala === 'ua') {
      if (vAct > 2000) return '#ef4444'; // Exceso consumo
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 50) return '#10b981'; // Sano
    } else if (escala === 'voltio') {
      if (vAct < 0.1 && vSano >= 1.0) return '#ef4444';
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 0.1) return '#10b981';
    } else if (escala === 'ohmio') {
      if (vAct < 2.0 && vSano > 10.0) return '#ef4444';
      if (!isNaN(vAct) && !isNaN(vSano) && (Math.abs(vAct - vSano) <= 5.0 || Math.abs(vAct - vSano) / vSano <= 0.1)) return '#10b981';
    } else if (escala === 'amperio') {
      if (vAct > 1.5) return '#ef4444';
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 0.05) return '#10b981';
    }
    return '#eab308'; // Alterado/Desviado
  };

  const formNum = (val, tipo) => {
    if (tipo === 'GND') return 'GND';
    if (tipo === 'NC') return 'NC';
    if (!val || val === '---') return '';
    if (val === 'OL') return 'OL';
    return val.startsWith('0.') ? val.substring(1) : val;
  };

  const getValorFontSize = (valor) => {
    if (!valor) return '0.75rem';
    if (valor.length > 5) return '0.6rem';
    if (valor.length === 5) return '0.68rem';
    if (valor.length === 4) return '0.75rem';
    return '0.8rem';
  };

  const padActualInfo = pines.find(p => String(p.id) === String(padActivo)) || {};

  // Formatear tiempo relativo
  const tiempoRelativo = (fecha) => {
    if (!fecha) return '';
    const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
    if (segundos < 60) return `hace ${segundos}s`;
    if (segundos < 3600) return `hace ${Math.floor(segundos / 60)}min`;
    return `hace ${Math.floor(segundos / 3600)}h`;
  };

  // Posicionamiento de la guía del Pin 1
  const renderGuiaAngulo = () => {
    const size = '16px';
    const offset = '6px';
    const style = {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: '#f59e0b',
      boxShadow: '0 0 10px #f59e0b',
      zIndex: 10,
      border: '2px solid #000'
    };

    if (esquinaGuia === 'top-left') {
      style.top = offset;
      style.left = offset;
    } else if (esquinaGuia === 'top-right') {
      style.top = offset;
      style.right = offset;
    } else if (esquinaGuia === 'bottom-left') {
      style.bottom = offset;
      style.left = offset;
    } else if (esquinaGuia === 'bottom-right') {
      style.bottom = offset;
      style.right = offset;
    }

    return <div style={style} title={`Guía de ángulo (${esquinaGuia})`} />;
  };

  return (
    <div
      style={{
        backgroundColor: '#111827',
        padding: '20px',
        borderRadius: '15px',
        border: cambiosPendientes ? '2px solid #f59e0b' : '2px solid #374151',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        transition: 'border-color 0.3s'
      }}
    >
      <style>{`
        .ic-scroll-container::-webkit-scrollbar { height: 10px; width: 10px; }
        .ic-scroll-container::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 5px; }
        .ic-scroll-container::-webkit-scrollbar-thumb { background: #8b5cf6; border-radius: 5px; cursor: pointer; }
        .ic-scroll-container::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
        
        .ic-grid-wrapper {
          display: grid;
          gap: 6px;
          background-color: #0b0f19;
          padding: 12px;
          border-radius: 12px;
          border: 4px solid #1f2937;
          position: relative;
          width: max-content;
          margin: 0 auto;
        }

        .ic-pad {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          alignItems: center;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
          box-shadow: inset 0 -2px 4px rgba(0,0,0,0.3);
        }
        
        .ic-pad:hover {
          transform: scale(1.08);
          filter: brightness(1.1);
        }

        .ic-label-col {
          color: #6b7280;
          font-size: 0.8rem;
          font-weight: bold;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 30px;
        }

        .ic-label-row {
          color: #6b7280;
          font-size: 0.8rem;
          font-weight: bold;
          width: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>

      {/* BARRA SUPERIOR CON ESTADO Y GUARDADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '8px' }}>
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

      {/* CONTENEDOR DEL CHIP DE IC */}
      <div
        className="ic-scroll-container"
        style={{
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '15px',
          display: 'flex',
          justifyContent: 'center',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div
          className="ic-grid-wrapper"
          style={{
            gridTemplateColumns: `30px repeat(${columnasCount}, 56px)`,
          }}
        >
          {/* Indicador de Ángulo (Pin 1) */}
          {renderGuiaAngulo()}

          {/* Fila superior: Vacío (esquina) + Números de columnas */}
          <div className="ic-label-col"></div>
          {Array.from({ length: columnasCount }).map((_, cIndex) => (
            <div key={`col-lbl-${cIndex + 1}`} className="ic-label-col">
              {cIndex + 1}
            </div>
          ))}

          {/* Filas: Letra de fila + Pads del IC */}
          {filasLetras.map((letra, rIndex) => (
            <React.Fragment key={`row-group-${letra}`}>
              {/* Etiqueta de la Fila (Letra) */}
              <div className="ic-label-row">{letra}</div>

              {/* Pads de esta fila */}
              {Array.from({ length: columnasCount }).map((_, cIndex) => {
                const colNum = cIndex + 1;
                const idPad = `${letra}${colNum}`;
                const pad = pines.find(p => p.id === idPad) || {
                  id: idPad,
                  nombre: `Linea_${idPad}`,
                  tipo: 'DATA',
                  valorSano: '---',
                  valorActual: '---'
                };

                const esActivo = String(padActivo) === String(idPad);
                const colorPad = obtenerColorPad(pad);
                let valSano = '---';
                let valActual = '---';

                if (escala === 'diodo') {
                  valSano = pad.valorSanoDiodo !== undefined ? pad.valorSanoDiodo : pad.valorSano;
                  valActual = pad.valorActualDiodo !== undefined ? pad.valorActualDiodo : pad.valorActual;
                } else if (escala === 'ua') {
                  valSano = pad.valorSanoUa !== undefined ? pad.valorSanoUa : '---';
                  valActual = pad.valorActualUa !== undefined ? pad.valorActualUa : '---';
                } else if (escala === 'voltio') {
                  valSano = pad.valorSanoVoltio !== undefined ? pad.valorSanoVoltio : '---';
                  valActual = pad.valorActualVoltio !== undefined ? pad.valorActualVoltio : '---';
                } else if (escala === 'ohmio') {
                  valSano = pad.valorSanoOhmio !== undefined ? pad.valorSanoOhmio : '---';
                  valActual = pad.valorActualOhmio !== undefined ? pad.valorActualOhmio : '---';
                } else if (escala === 'amperio') {
                  valSano = pad.valorSanoAmperio !== undefined ? pad.valorSanoAmperio : '---';
                  valActual = pad.valorActualAmperio !== undefined ? pad.valorActualAmperio : '---';
                }

                const valorTexto = modo === 'crear' ? formNum(valSano, pad.tipo) : formNum(valActual, pad.tipo);

                return (
                  <div
                    key={idPad}
                    className="ic-pad"
                    onClick={() => setPadActivo(idPad)}
                    style={{
                      backgroundColor: colorPad,
                      border: esActivo ? '3px solid #ffffff' : '1px solid #1a1a1a',
                      boxShadow: esActivo ? '0 0 12px #ffffff' : 'inset 0 -2px 4px rgba(0,0,0,0.3)',
                      width: '56px',
                      height: '56px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxSizing: 'border-box'
                    }}
                    title={`Pad ${idPad}: ${pad.nombre || 'Sin nombre'} (${pad.tipo})`}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '5px',
                        left: '0',
                        right: '0',
                        textAlign: 'center',
                        fontSize: '0.5rem',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        opacity: 0.6,
                        textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                        lineHeight: '1',
                        pointerEvents: 'none'
                      }}
                    >
                      {idPad}
                    </span>
                    <span
                      style={{
                        fontSize: getValorFontSize(valorTexto),
                        color: pad.tipo === 'GND' || pad.tipo === 'NC' ? '#cbd5e1' : '#000000',
                        textShadow: pad.tipo !== 'GND' && pad.tipo !== 'NC' ? 'none' : '1px 1px 2px #000',
                        fontWeight: 'bold',
                        lineHeight: '1',
                        marginTop: '8px',
                        textAlign: 'center',
                        pointerEvents: 'none'
                      }}
                    >
                      {valorTexto || '---'}
                    </span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* PANEL DE CONTROL / EDICIÓN DEL PAD ACTIVO */}
      <div
        style={{
          marginTop: '15px',
          padding: '12px 15px',
          backgroundColor: '#1a1a1a',
          borderRadius: '10px',
          borderLeft: `4px solid ${obtenerColorPad(pines.find(p => String(p.id) === String(padActivo)) || { id: padActivo })}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ flex: '1 1 auto' }}>
            <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '1.1rem' }}>
              PAD {padActivo}
            </span>

            {modo === 'crear' ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="color"
                  value={padActualInfo.colorCustom || '#d4af37'}
                  onChange={(e) => setPines(prev => prev.map(p => String(p.id) === String(padActivo) ? { ...p, colorCustom: e.target.value } : p))}
                  style={{ padding: '0', border: 'none', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', background: 'transparent' }}
                  title="Color personalizado"
                />

                <input
                  value={padActualInfo.nombre || ''}
                  onChange={(e) =>
                    setPines(prev => prev.map(p => String(p.id) === String(padActivo) ? { ...p, nombre: e.target.value.replace(/ /g, '_') } : p))
                  }
                  placeholder="Nombre_de_linea"
                  style={{ background: '#000', color: 'white', border: '1px solid #333', padding: '6px 10px', borderRadius: '5px', width: '130px', outline: 'none', fontSize: '0.85rem' }}
                />

                <SelectorTipoLinea
                  valor={padActualInfo.tipo || 'DATA'}
                  onChange={(val) => {
                    setPines(prev =>
                      prev.map(p =>
                        String(p.id) === String(padActivo) ? {
                          ...p,
                          tipo: val,
                          nombre: val === 'GND' || val === 'NC' ? val : p.nombre
                        } : p
                      )
                    );
                  }}
                  tiposCustom={tiposCustom}
                  onAgregarTipo={manejarAgregarTipo}
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
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: padActualInfo.colorCustom || '#d4af37' }}></span>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {padActualInfo.nombre || 'Línea sin nombre'}
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#374151', color: 'white', fontWeight: 'bold' }}>
                  {padActualInfo.tipo || 'DATA'}
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
                  if (escala === 'diodo') return (padActualInfo.valorSanoDiodo !== undefined ? padActualInfo.valorSanoDiodo : padActualInfo.valorSano) || '---';
                  if (escala === 'ua') return padActualInfo.valorSanoUa || '---';
                  if (escala === 'voltio') return padActualInfo.valorSanoVoltio || '---';
                  if (escala === 'ohmio') return padActualInfo.valorSanoOhmio || '---';
                  if (escala === 'amperio') return padActualInfo.valorSanoAmperio || '---';
                  return '---';
                })()}{' '}
                {escala === 'diodo' ? 'V' : escala === 'ua' ? 'uA' : escala === 'voltio' ? 'V' : escala === 'ohmio' ? 'Ω' : 'A'}
              </strong>
            </span>
            <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
              Actual:{' '}
              <strong style={{ color: '#fff', fontSize: '1.3rem' }}>
                {String(padActivo) === String(padActualInfo.id) && lecturaEnVivo !== '----'
                  ? lecturaEnVivo
                  : (() => {
                      if (escala === 'diodo') return (padActualInfo.valorActualDiodo !== undefined ? padActualInfo.valorActualDiodo : padActualInfo.valorActual) || '---';
                      if (escala === 'ua') return padActualInfo.valorActualUa || '---';
                      if (escala === 'voltio') return padActualInfo.valorActualVoltio || '---';
                      if (escala === 'ohmio') return padActualInfo.valorActualOhmio || '---';
                      if (escala === 'amperio') return padActualInfo.valorActualAmperio || '---';
                      return '---';
                    })()}{' '}
                {escala === 'diodo' ? 'V' : escala === 'ua' ? 'uA' : escala === 'voltio' ? 'V' : escala === 'ohmio' ? 'Ω' : 'A'}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
