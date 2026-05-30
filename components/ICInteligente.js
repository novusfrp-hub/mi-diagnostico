import React, { useState, useEffect } from 'react';
import { Save, Cloud, CloudOff, Check, AlertCircle } from 'lucide-react';

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
  tiposDisponibles: tiposProp = ['DATA', 'VCC', 'GND', 'NC'],
  setTiposDisponibles,
  onGuardar,
  cambiosPendientes = false,
  guardando = false,
  ultimaSincronizacion = null
}) {
  const [tiposInternos, setTiposInternos] = useState(tiposProp);
  const tipos = setTiposDisponibles ? tiposProp : tiposInternos;
  const setTipos = setTiposDisponibles || setTiposInternos;

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
      if (!tipos.includes(tipoLimpio)) {
        setTipos([...tipos, tipoLimpio]);
        setPines(prev => prev.map(p =>
          p.id === padActivo ? { ...p, tipo: tipoLimpio, nombre: tipoLimpio } : p
        ));
      } else {
        alert('Este tipo ya existe en la lista.');
      }
    }
  };

  const obtenerColorPad = (pad) => {
    if (!pad) return '#374151'; // color por defecto si no existe
    const colorBase = pad.colorCustom || '#d4af37';

    if (modo === 'crear') {
      if (padActivo === pad.id) return '#00ffff';
      if (pad.tipo === 'GND') return '#4b5563';
      if (pad.tipo === 'NC') return '#1e3a8a';
      if (pad.tipo === 'VCC') return '#7f1d1d';
      return colorBase;
    }

    if (pad.tipo === 'GND') return '#4b5563';
    if (pad.tipo === 'NC') return '#1e3a8a';

    if (!pad.valorActual || pad.valorActual === '---') return colorBase;
    if (pad.valorActual === 'OL' && pad.valorSano !== 'OL') return '#f97316';

    const vAct = parseFloat(pad.valorActual);
    const vSano = parseFloat(pad.valorSano);

    if (escala === 'diodo') {
      if (vAct < 0.050) return '#ef4444'; // Corto
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 0.040) return '#10b981'; // Sano
    } else {
      if (vAct > 2000) return '#ef4444'; // Exceso consumo
      if (!isNaN(vAct) && !isNaN(vSano) && Math.abs(vAct - vSano) <= 50) return '#10b981'; // Sano
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

  const padActualInfo = pines.find(p => p.id === padActivo) || {};

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

                const esActivo = padActivo === idPad;
                const colorPad = obtenerColorPad(pad);
                const valorTexto = modo === 'crear' ? formNum(pad.valorSano, pad.tipo) : formNum(pad.valorActual, pad.tipo);

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
                      padding: '5px 2px 7px 2px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    title={`Pad ${idPad}: ${pad.nombre || 'Sin nombre'} (${pad.tipo})`}
                  >
                    <span
                      style={{
                        fontSize: '0.5rem',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        opacity: 0.6,
                        textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                        lineHeight: '1'
                      }}
                    >
                      {idPad}
                    </span>
                    <span
                      style={{
                        fontSize: getValorFontSize(valorTexto),
                        color: pad.tipo === 'GND' || pad.tipo === 'NC' ? '#cbd5e1' : '#000000',
                        textShadow: pad.tipo !== 'GND' && pad.tipo !== 'NC' ? 'none' : '1px 1px 2px #000',
                        fontWeight: 'extrabold',
                        lineHeight: '1'
                      }}
                    >
                      {valorTexto}
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
          borderLeft: `4px solid ${obtenerColorPad(pines.find(p => p.id === padActivo) || { id: padActivo })}`
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
                  onChange={(e) => setPines(prev => prev.map(p => p.id === padActivo ? { ...p, colorCustom: e.target.value } : p))}
                  style={{ padding: '0', border: 'none', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', background: 'transparent' }}
                  title="Color personalizado"
                />

                <input
                  value={padActualInfo.nombre || ''}
                  onChange={(e) =>
                    setPines(prev => prev.map(p => p.id === padActivo ? { ...p, nombre: e.target.value.replace(/ /g, '_') } : p))
                  }
                  placeholder="Nombre_de_linea"
                  style={{ background: '#000', color: 'white', border: '1px solid #333', padding: '6px 10px', borderRadius: '5px', width: '130px', outline: 'none', fontSize: '0.85rem' }}
                />

                <select
                  value={padActualInfo.tipo || 'DATA'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPines(prev =>
                      prev.map(p =>
                        p.id === padActivo ? {
                          ...p,
                          tipo: val,
                          nombre: val === 'GND' || val === 'NC' ? val : p.nombre
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
                  + Tipo
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: padActualInfo.colorCustom || '#d4af37', marginRight: '8px' }}></span>
                <span style={{ display: 'inline-block', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {padActualInfo.nombre || 'Línea sin nombre'}
                </span>
                <span style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#374151', color: 'white', fontWeight: 'bold' }}>
                  {padActualInfo.tipo || 'DATA'}
                </span>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', flex: '0 1 auto' }}>
            <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block' }}>
              Valor Sano:{' '}
              <strong style={{ color: '#fff' }}>
                {padActualInfo.valorSano || '---'} {escala === 'diodo' ? 'V' : 'uA'}
              </strong>
            </span>
            <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
              Actual:{' '}
              <strong style={{ color: '#fff', fontSize: '1.3rem' }}>
                {padActivo === padActualInfo.id && lecturaEnVivo !== '----'
                  ? lecturaEnVivo
                  : padActualInfo.valorActual || '---'}{' '}
                {escala === 'diodo' ? 'V' : 'uA'}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
