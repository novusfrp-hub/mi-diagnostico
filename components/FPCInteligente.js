import React, { useState } from 'react';

export default function FPCInteligente({ pines, setPines, pinActivo, setPinActivo, modo = 'diagnostico', escala = 'diodo', lecturaEnVivo, tiposDisponibles: tiposProp = ['DATA', 'VCC', 'GND', 'NC'], setTiposDisponibles }) {
  // Manejo de la lista de tipos en el menú desplegable
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
      } else {
        alert('Este tipo ya existe en la lista.');
      }
    }
  };

  const obtenerColorPin = (pin) => {
    if (pin.tipo === 'GND') return '#4b5563';
    if (pin.tipo === 'NC') return '#1e3a8a';

    const doradoPcb = '#d4af37';

    if (modo === 'crear') {
      if (pinActivo === pin.id) return '#00ffff';
      if (pin.tipo === 'VCC') return '#7f1d1d';
      return doradoPcb;
    }

    if (!pin.valorActual || pin.valorActual === '---') return doradoPcb;
    if (pin.valorActual === 'OL' && pin.valorSano !== 'OL') return '#f97316';

    const vAct = parseFloat(pin.valorActual);
    const vSano = parseFloat(pin.valorSano);

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

  const renderPin = (pin, esArriba, isExtremo) => (
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
          {modo === 'crear' ? formNum(pin.valorSano, pin.tipo) : formNum(pin.valorActual, pin.tipo)}
        </span>
      </div>
      {!esArriba && <span style={{ fontSize: '0.55rem', color: 'gray', marginTop: '2px' }}>{pin.id}</span>}
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: '#111827',
        padding: '15px',
        borderRadius: '15px',
        border: '2px solid #374151',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden' // <-- EL CANDADO MAGICO QUE FALTABA
      }}
    >
      {/* INYECTAMOS CSS PARA NAVEGADORES WEBKIT (Chrome/Brave) */}
      <style>{`
        .fpc-scroll-container::-webkit-scrollbar { height: 8px; }
        .fpc-scroll-container::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 4px; }
        .fpc-scroll-container::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; }
        .fpc-scroll-container::-webkit-scrollbar-thumb:hover { background: #2563eb; }
      `}</style>

      {/* CONTENEDOR PADRE CON LÍMITE Y SCROLL ACTIVO */}
      {(() => {
        // Calculamos el ancho EXACTO que necesitan los pines para forzar el scroll
        const n = filaSup.length;
        const anchoContenido = n <= 1
          ? 70 + 24
          : (n === 2 ? 140 + 3 + 24 : 140 + (n - 2) * 45 + (n - 1) * 3 + 24);
        return (
          <div 
            className="fpc-scroll-container"
            style={{ 
              width: '100%', 
              overflowX: 'auto', 
              overflowY: 'hidden',
              paddingBottom: '12px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'auto',
              scrollbarColor: '#3b82f6 #1a1a1a'
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
                minWidth: anchoContenido + 'px'
              }}
            >
              {/* FILA SUPERIOR */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {filaSup.map((pin, i) => renderPin(pin, true, i === 0 || i === filaSup.length - 1))}
              </div>

              {/* SEPARADOR DEL MEDIO */}
              <div style={{ height: '8px', backgroundColor: '#1a1a1a', borderRadius: '2px' }} />

              {/* FILA INFERIOR */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {filaInf.map((pin, i) => renderPin(pin, false, i === 0 || i === filaInf.length - 1))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* PANEL INFERIOR DE DETALLES Y COMBO BOX */}
      <div
        style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#1a1a1a',
          borderRadius: '10px',
          borderLeft: `4px solid ${obtenerColorPin(pines.find(p => p.id === pinActivo) || {})}`
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ flex: '1 1 auto' }}>
            <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '1.1rem' }}>
              PIN {pinActivo}
            </span>
            {modo === 'crear' ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  value={pines.find(p => p.id === pinActivo)?.nombre || ''}
                  onChange={(e) =>
                    setPines(prev =>
                      prev.map(p =>
                        p.id === pinActivo ? { ...p, nombre: e.target.value.replace(/ /g, '_') } : p
                      )
                    )
                  }
                  placeholder="Nombre_de_linea"
                  style={{
                    background: '#000',
                    color: 'white',
                    border: '1px solid #333',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    width: '140px',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                />

                <select
                  value={pines.find(p => p.id === pinActivo)?.tipo || 'DATA'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPines(prev =>
                      prev.map(p =>
                        p.id === pinActivo
                          ? {
                              ...p,
                              tipo: val,
                              ...(val === 'GND' ? { nombre: 'GND' } : val === 'NC' ? { nombre: 'NC' } : {})
                            }
                          : p
                      )
                    );
                  }}
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
                  {tipos.map(tipo => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>

                <button
                  onClick={manejarAgregarTipo}
                  style={{
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
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
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  - Quitar Pin
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '5px' }}>
                <span style={{ display: 'inline-block', color: '#fff', fontSize: '0.85rem' }}>
                  {pines.find(p => p.id === pinActivo)?.nombre || 'Línea sin nombre'}
                </span>
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#374151',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {pines.find(p => p.id === pinActivo)?.tipo || 'DATA'}
                </span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flex: '0 1 auto' }}>
            <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block' }}>
              Valor Sano:{' '}
              <strong style={{ color: '#fff' }}>
                {pines.find(p => p.id === pinActivo)?.valorSano || '---'} {escala === 'diodo' ? 'V' : 'uA'}
              </strong>
            </span>
            <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
              Actual:{' '}
              <strong style={{ color: '#fff', fontSize: '1.3rem' }}>
                {pinActivo === pines.find(p => p.id === pinActivo)?.id && lecturaEnVivo !== '----'
                  ? lecturaEnVivo
                  : pines.find(p => p.id === pinActivo)?.valorActual || '---'}{' '}
                {escala === 'diodo' ? 'V' : 'uA'}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}