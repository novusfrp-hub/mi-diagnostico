import React, { useState, useEffect, useRef } from 'react';

const CATEGORIAS_LINEAS = {
  alimentacion: {
    lbl: '⚡ Alimentación (Power / Voltajes)',
    color: '#ef4444',
    bgPill: '#7f1d1d',
    items: [
      'VPH_PWR',
      'PP_VDD_MAIN',
      'VBAT',
      'VBUS',
      'PP_BATT',
      'PP1V8_S2',
      'PP3V0_LDO',
      'PP0V8_CORE',
      'VREG_L6A_0P6',
      'VCC',
      'VCC_IO',
      'VDD_MEM',
      'LCM_LEDA',
      'LCM_LED_A',
      'LCM_LEDK',
      'LCM_LEDK1',
      'LCM_LEDK2',
      'BL_LED_A',
      'BL_ANODE',
      'VBOOST',
      'VLED',
      'AVDD',
      'ELVDD',
      'ELVSS',
      'VSP',
      'VSN'
    ]
  },
  comunicacion: {
    lbl: '📡 Comunicación (Datos / Buses)',
    color: '#eab308',
    bgPill: '#854d0e',
    items: [
      'DATA',
      'AP_TO_I2C_SDA',
      'AP_TO_I2C_SCL',
      'I2C',
      'SPI',
      'SPI_MOSI',
      'SPI_MISO',
      'SPI_CLK',
      'RFFE',
      'SWI',
      'UART_TX',
      'UART_RX',
      'USB_DP',
      'USB_DN',
      'MIPI_DSI'
    ]
  },
  control: {
    lbl: '⚙️ Control y Sincronización',
    color: '#10b981',
    bgPill: '#065f46',
    items: [
      'RESET',
      'ENABLE',
      'INT',
      'NTC',
      'ID',
      'CLK_32K',
      'SYS_CLK',
      'POWER_KEY',
      'VOL_UP',
      'VOL_DOWN',
      'EN_BL',
      'PWM_BL'
    ]
  },
  tierra: {
    lbl: '🛡️ Tierra y Neutro (GND / NC)',
    color: '#6b7280',
    bgPill: '#374151',
    items: ['GND', 'NC']
  },
  custom: {
    lbl: '⭐ Redes Personalizadas',
    color: '#8b5cf6',
    bgPill: '#5b21b6',
    items: []
  }
};

export default function SelectorTipoLinea({
  valor = 'DATA',
  onChange,
  tiposCustom = [],
  onAgregarTipo,
  onEliminarTipo,
  nombreComponente = '',
  idPad = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState('alimentacion');
  const [nuevaRedInput, setNuevaRedInput] = useState('');
  const [catalogoLocal, setCatalogoLocal] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('catalogo_redes_personalizadas');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return { alimentacion: [], comunicacion: [], control: [], custom: [] };
  });

  const containerRef = useRef(null);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Guardar en localStorage de forma reactiva sin costo de Firebase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('catalogo_redes_personalizadas', JSON.stringify(catalogoLocal));
      } catch (e) {}
    }
  }, [catalogoLocal]);

  // Si el valor actual coincide con una categoría específica, abrirla por defecto
  useEffect(() => {
    if (isOpen) {
      const v = String(valor || '').toUpperCase().trim();
      if (v === 'GND' || v === 'NC') {
        setCategoriaActiva('tierra');
      } else if (
        CATEGORIAS_LINEAS.alimentacion.items.includes(v) || 
        (catalogoLocal.alimentacion || []).includes(v) ||
        /(LEDA|LED_A|LEDK|LED_K|ANODE|ANODO|CATODO|CATHODE|VBOOST|BOOST|VBAT|VPH|VDD|VBUS|VREG|VCC|CHARGER|CHG|BATT|VLED|AVDD|ELVDD|ELVSS|VSP|VSN|VIO|VBIAS|HV_|PP_|_PWR|POWER|VOLT|VOUT|VIN)/i.test(v)
      ) {
        setCategoriaActiva('alimentacion');
      } else if (
        CATEGORIAS_LINEAS.control.items.includes(v) || 
        (catalogoLocal.control || []).includes(v) ||
        /(RESET|RST|ENABLE|_EN$|^EN_|INT|IRQ|CLK|CLOCK|PWM|NTC|THERM|^ID$|_ID$|SENSE|POWER_KEY|VOL_UP|VOL_DOWN)/i.test(v)
      ) {
        setCategoriaActiva('control');
      } else if (CATEGORIAS_LINEAS.comunicacion.items.includes(v) || (catalogoLocal.comunicacion || []).includes(v)) {
        setCategoriaActiva('comunicacion');
      } else if (tiposCustom.includes(v) || (catalogoLocal.custom || []).includes(v)) {
        setCategoriaActiva('custom');
      }
    }
  }, [isOpen, valor]);

  const obtenerItemsCategoria = (cat) => {
    const base = CATEGORIAS_LINEAS[cat]?.items || [];
    const local = catalogoLocal[cat] || [];
    const customGlobal = cat === 'custom' ? tiposCustom : [];
    return Array.from(new Set([...base, ...local, ...customGlobal]));
  };

  const handleSelect = (tipo) => {
    if (onChange) {
      let cat = categoriaActiva;
      const t = String(tipo || '').toUpperCase().trim();
      if (t === 'GND' || t === 'NC') {
        cat = 'tierra';
      } else if (
        obtenerItemsCategoria('alimentacion').includes(t) || 
        /(LEDA|LED_A|LEDK|LED_K|ANODE|ANODO|CATODO|CATHODE|VBOOST|BOOST|VBAT|VPH|VDD|VBUS|VREG|VCC|CHARGER|CHG|BATT|VLED|AVDD|ELVDD|ELVSS|VSP|VSN|VIO|VBIAS|HV_|PP_|_PWR|POWER|VOLT|VOUT|VIN)/i.test(t)
      ) {
        cat = 'alimentacion';
      } else if (
        obtenerItemsCategoria('control').includes(t) ||
        /(RESET|RST|ENABLE|_EN$|^EN_|INT|IRQ|CLK|CLOCK|PWM|NTC|THERM|^ID$|_ID$|SENSE|POWER_KEY|VOL_UP|VOL_DOWN)/i.test(t)
      ) {
        cat = 'control';
      } else if (obtenerItemsCategoria('comunicacion').includes(t)) {
        cat = 'comunicacion';
      }
      onChange(tipo, cat);
    }
    setIsOpen(false);
  };

  const guardarNuevaRed = (e) => {
    if (e) e.preventDefault();
    const limpia = nuevaRedInput.trim().toUpperCase().replace(/\s+/g, '_');
    if (!limpia) return;

    // Guardar en categoría activa localmente
    setCatalogoLocal(prev => {
      const arr = prev[categoriaActiva] || [];
      if (!arr.includes(limpia)) {
        return { ...prev, [categoriaActiva]: [...arr, limpia] };
      }
      return prev;
    });

    if (onAgregarTipo) {
      onAgregarTipo(limpia, categoriaActiva);
    }

    setNuevaRedInput('');
    handleSelect(limpia);
  };

  const eliminarRedLocal = (cat, red) => {
    setCatalogoLocal(prev => ({
      ...prev,
      [cat]: (prev[cat] || []).filter(item => item !== red)
    }));
    if (onEliminarTipo) {
      onEliminarTipo(red);
    }
  };

  const getPillColor = (tipo) => {
    if (!tipo) return '#854d0e';
    const t = String(tipo).toUpperCase().trim();
    if (t === 'GND') return '#4b5563';
    if (t === 'NC') return '#1e3a8a';
    if (
      obtenerItemsCategoria('alimentacion').includes(t) ||
      /(LEDA|LED_A|LEDK|LED_K|ANODE|ANODO|CATODO|CATHODE|VBOOST|BOOST|VBAT|VPH|VDD|VBUS|VREG|VCC|CHARGER|CHG|BATT|VLED|AVDD|ELVDD|ELVSS|VSP|VSN|VIO|VBIAS|HV_|PP_|_PWR|POWER|VOLT|VOUT|VIN)/i.test(t)
    ) return '#7f1d1d';
    if (
      obtenerItemsCategoria('control').includes(t) ||
      /(RESET|RST|ENABLE|_EN$|^EN_|INT|IRQ|CLK|CLOCK|PWM|NTC|THERM|^ID$|_ID$|SENSE|POWER_KEY|VOL_UP|VOL_DOWN)/i.test(t)
    ) return '#065f46';
    if (obtenerItemsCategoria('comunicacion').includes(t)) return '#854d0e';
    return '#5b21b6'; // Custom
  };

  const itemsVisibles = obtenerItemsCategoria(categoriaActiva);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {/* Botón disparador principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#1f2937',
          color: 'white',
          border: '1px solid #374151',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          outline: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.15s',
          width: '100%',
          justifyContent: 'space-between'
        }}
        title="Clic para seleccionar o crear un tipo/nombre de red"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: getPillColor(valor),
              flexShrink: 0
            }}
          />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{valor}</span>
        </div>
        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▼</span>
      </button>

      {/* Menú desplegable flotante */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '310px',
            maxWidth: '92vw',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.9), 0 0 1px rgba(255,255,255,0.2)',
            zIndex: 99999,
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Cabecera de Contexto: Indica claramente a qué componente y pin pertenece */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '8px',
            borderBottom: '1px solid #1e293b',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.95rem' }}>📍</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#38bdf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nombreComponente ? `${nombreComponente} — ` : ''}Pin {idPad || ''}
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', background: '#1e293b', border: '1px solid #334155', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              Red: <strong style={{ color: '#00ffff' }}>{valor}</strong>
            </span>
          </div>
          {/* Fila superior: GND y NC con acceso inmediato */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleSelect('GND')}
              style={{
                flex: 1,
                padding: '7px',
                background: valor === 'GND' ? '#4b5563' : '#1e293b',
                color: 'white',
                border: valor === 'GND' ? '2px solid #00ffff' : '1px solid #334155',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9ca3af' }} />
              GND (Tierra)
            </button>
            <button
              type="button"
              onClick={() => handleSelect('NC')}
              style={{
                flex: 1,
                padding: '7px',
                background: valor === 'NC' ? '#1e3a8a' : '#1e293b',
                color: 'white',
                border: valor === 'NC' ? '2px solid #00ffff' : '1px solid #334155',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#60a5fa' }} />
              NC (No Conectado)
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: '#334155' }} />

          {/* 1. COMBOBOX DESPLEGABLE DE CATEGORÍA (Reemplaza las pestañas horizontales) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>
              Grupo / Categoría de Redes:
            </label>
            <select
              value={categoriaActiva}
              onChange={(e) => setCategoriaActiva(e.target.value)}
              style={{
                width: '100%',
                background: '#1e293b',
                color: '#f8fafc',
                border: `1px solid ${CATEGORIAS_LINEAS[categoriaActiva]?.color || '#475569'}`,
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {Object.keys(CATEGORIAS_LINEAS).map((key) => {
                const count = obtenerItemsCategoria(key).length;
                return (
                  <option key={key} value={key}>
                    {CATEGORIAS_LINEAS[key].lbl} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. LISTA VERTICAL DE REDES (1 columna vertical con scroll, sin recortes horizontales) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 'bold' }}>
              Redes disponibles en esta categoría ({itemsVisibles.length}):
            </span>
            <div
              style={{
                maxHeight: '170px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                paddingRight: '4px',
                scrollbarWidth: 'thin'
              }}
            >
              {itemsVisibles.length > 0 ? (
                itemsVisibles.map((tipo) => {
                  const isSelected = valor === tipo;
                  const esCustom = (catalogoLocal[categoriaActiva] || []).includes(tipo) || tiposCustom.includes(tipo);

                  return (
                    <div
                      key={tipo}
                      onClick={() => handleSelect(tipo)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isSelected ? 'rgba(0, 255, 255, 0.15)' : '#1e293b',
                        border: isSelected ? '1px solid #00ffff' : '1px solid #334155',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#334155';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#1e293b';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getPillColor(tipo),
                            flexShrink: 0
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            color: isSelected ? '#00ffff' : '#f8fafc',
                            letterSpacing: '0.3px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={tipo}
                        >
                          {tipo}
                        </span>
                      </div>

                      {/* Botón eliminar si es red creada localmente */}
                      {esCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Eliminar la red personalizada "${tipo}"?`)) {
                              eliminarRedLocal(categoriaActiva, tipo);
                            }
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginLeft: '6px'
                          }}
                          title="Eliminar esta red personalizada"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
                  No hay redes registradas en esta categoría.
                </div>
              )}
            </div>
          </div>

          {/* 3. FORMULARIO INTEGRADO "+ GUARDAR NUEVA RED" (Persistencia local sin peticiones Firebase extra) */}
          <div style={{ paddingTop: '6px', borderTop: '1px solid #334155' }}>
            <form onSubmit={guardarNuevaRed} style={{ display: 'flex', gap: '5px' }}>
              <input
                type="text"
                placeholder={`Nueva red en ${CATEGORIAS_LINEAS[categoriaActiva]?.lbl.split(' ')[1] || 'grupo'}...`}
                value={nuevaRedInput}
                onChange={(e) => setNuevaRedInput(e.target.value)}
                style={{
                  flex: 1,
                  background: '#1e293b',
                  color: '#00ffff',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!nuevaRedInput.trim()}
                style={{
                  background: nuevaRedInput.trim() ? '#0284c7' : '#334155',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: nuevaRedInput.trim() ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s'
                }}
                title="Guardar esta red en la categoría activa para usarla siempre"
              >
                💾 Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
