import React, { useState, useEffect, useRef } from 'react';

export default function SelectorTipoLinea({
  valor = 'DATA',
  onChange,
  tiposCustom = [],
  onAgregarTipo
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('alimentacion');
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const grupos = {
    alimentacion: {
      lbl: '⚡ Alimentación',
      color: '#ef4444',
      items: ['VCC', 'VBAT', 'VBUS', 'PP_BATT']
    },
    comunicacion: {
      lbl: '📡 Comunicación',
      color: '#eab308',
      items: ['DATA', 'I2C', 'SPI', 'RFFE', 'SWI', 'UART', 'SDA', 'SCL', 'CLK']
    },
    control: {
      lbl: '⚙️ Control',
      color: '#10b981',
      items: ['RESET', 'ENABLE', 'INT', 'NTC', 'ID']
    },
    custom: {
      lbl: '⭐ Custom',
      color: '#8b5cf6',
      items: tiposCustom
    }
  };

  const handleSelect = (tipo) => {
    if (onChange) {
      onChange(tipo);
    }
    setIsOpen(false);
  };

  const getPillColor = (tipo) => {
    if (tipo === 'GND') return '#4b5563';
    if (tipo === 'NC') return '#1e3a8a';
    if (grupos.alimentacion.items.includes(tipo)) return '#7f1d1d';
    if (grupos.comunicacion.items.includes(tipo)) return '#854d0e';
    if (grupos.control.items.includes(tipo)) return '#065f46';
    return '#5b21b6'; // Custom color
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Botón disparador */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#1f2937',
          color: 'white',
          border: '1px solid #374151',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          outline: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.2s'
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getPillColor(valor)
          }}
        />
        {valor}
        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>▼</span>
      </button>

      {/* Menú desplegable flotante */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '8px',
            width: '280px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Fila superior: GND y NC destacados */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleSelect('GND')}
              style={{
                flex: 1,
                padding: '8px',
                background: valor === 'GND' ? '#4b5563' : '#1e293b',
                color: 'white',
                border: valor === 'GND' ? '2px solid #fff' : '1px solid #334155',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4b5563' }} />
              GND
            </button>
            <button
              type="button"
              onClick={() => handleSelect('NC')}
              style={{
                flex: 1,
                padding: '8px',
                background: valor === 'NC' ? '#1e3a8a' : '#1e293b',
                color: 'white',
                border: valor === 'NC' ? '2px solid #fff' : '1px solid #334155',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1e3a8a' }} />
              NC
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: '#334155' }} />

          {/* Selector de Pestañas */}
          <div style={{ display: 'flex', overflowX: 'auto', gap: '4px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {Object.keys(grupos).map((key) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: active ? '#1e293b' : 'transparent',
                    color: active ? '#fff' : '#64748b',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {grupos[key].lbl}
                </button>
              );
            })}
          </div>

          {/* Rejilla de Opciones */}
          <div
            style={{
              maxHeight: '130px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              padding: '2px'
            }}
          >
            {grupos[activeTab].items.length > 0 ? (
              grupos[activeTab].items.map((tipo) => {
                const isSelected = valor === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleSelect(tipo)}
                    style={{
                      padding: '6px 8px',
                      background: getPillColor(tipo),
                      color: 'white',
                      border: isSelected ? '2px solid #fff' : '1px solid transparent',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: 'inset 0 -1px 3px rgba(0,0,0,0.3)',
                      transition: 'all 0.15s'
                    }}
                    title={tipo}
                  >
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }} />
                    {tipo}
                  </button>
                );
              })
            ) : (
              <span style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '10px 0' }}>
                Sin elementos en esta pestaña.
              </span>
            )}
          </div>

          {/* Botón inferior + Tipo */}
          {onAgregarTipo && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAgregarTipo();
              }}
              style={{
                marginTop: '4px',
                padding: '6px',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#0369a1'}
              onMouseLeave={(e) => e.target.style.background = '#0284c7'}
            >
              + Añadir Nuevo Tipo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
