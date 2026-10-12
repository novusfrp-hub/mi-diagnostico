import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check, Plus, Trash2, Zap, Shield, Radio, Cpu, Star } from 'lucide-react';

const CATEGORIAS_LINEAS = {
  alimentacion: {
    lbl: 'Alimentación (Voltajes / Power)',
    shortLbl: 'Alimentación',
    color: '#ef4444',
    bgPill: '#7f1d1d',
    icon: Zap,
    items: [
      'VBAT',
      'VBUS',
      'PP_BATT',
      'VPH_PWR',
      'PP_VDD_MAIN',
      'VCC',
      'VCC_IO',
      'VDD_MEM',
      'PP1V8_S2',
      'PP3V0_LDO',
      'PP0V8_CORE',
      'VREG_L6A_0P6',
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
      'VSN',
      'CHG_IN',
      'BATT_THERM_PWR'
    ]
  },
  comunicacion: {
    lbl: 'Comunicación (Buses / Datos)',
    shortLbl: 'Comunicación',
    color: '#eab308',
    bgPill: '#854d0e',
    icon: Radio,
    items: [
      'DATA',
      'I2C_SDA',
      'I2C_SCL',
      'SMB_SDA',
      'SMB_SCL',
      'AP_TO_I2C_SDA',
      'AP_TO_I2C_SCL',
      'I2C',
      'SPI',
      'SPI_MOSI',
      'SPI_MISO',
      'SPI_CLK',
      'RFFE',
      'SWI',
      'BATT_SWI',
      'UART_TX',
      'UART_RX',
      'USB_DP',
      'USB_DN',
      'MIPI_DSI'
    ]
  },
  control: {
    lbl: 'Control & Sensores (ID / Temp)',
    shortLbl: 'Control',
    color: '#10b981',
    bgPill: '#065f46',
    icon: Cpu,
    items: [
      'BATT_ID',
      'ID',
      'BATT_NTC',
      'NTC',
      'BATT_THERM',
      'BATT_DET',
      'CELL_BAL',
      'FAST_ID',
      'RESET',
      'ENABLE',
      'INT',
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
    lbl: 'Tierra & Neutro (GND / NC)',
    shortLbl: 'Tierra / NC',
    color: '#6b7280',
    bgPill: '#374151',
    icon: Shield,
    items: ['GND', 'NC']
  },
  custom: {
    lbl: 'Personalizadas',
    shortLbl: 'Personalizadas',
    color: '#8b5cf6',
    bgPill: '#5b21b6',
    icon: Star,
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
  const [mounted, setMounted] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState('alimentacion');
  const [busqueda, setBusqueda] = useState('');
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

  const searchInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guardar en localStorage de forma reactiva
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('catalogo_redes_personalizadas', JSON.stringify(catalogoLocal));
      } catch (e) {}
    }
  }, [catalogoLocal]);

  // Si el valor actual coincide con una categoría específica, preseleccionarla al abrir
  useEffect(() => {
    if (isOpen) {
      setBusqueda('');
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
        /(RESET|RST|ENABLE|_EN$|^EN_|INT|IRQ|CLK|CLOCK|PWM|NTC|THERM|^ID$|_ID$|SENSE|POWER_KEY|VOL_UP|VOL_DOWN|CELL_BAL|DET)/i.test(v)
      ) {
        setCategoriaActiva('control');
      } else if (CATEGORIAS_LINEAS.comunicacion.items.includes(v) || (catalogoLocal.comunicacion || []).includes(v)) {
        setCategoriaActiva('comunicacion');
      } else if (tiposCustom.includes(v) || (catalogoLocal.custom || []).includes(v)) {
        setCategoriaActiva('custom');
      }

      // Enfocar input de búsqueda tras montar
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, valor]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
        /(RESET|RST|ENABLE|_EN$|^EN_|INT|IRQ|CLK|CLOCK|PWM|NTC|THERM|^ID$|_ID$|SENSE|POWER_KEY|VOL_UP|VOL_DOWN|CELL_BAL|DET)/i.test(t)
      ) {
        cat = 'control';
      } else if (obtenerItemsCategoria('comunicacion').includes(t)) {
        cat = 'comunicacion';
      }
      onChange(t, cat);
    }
    setIsOpen(false);
  };

  const guardarNuevaRed = (e) => {
    if (e) e.preventDefault();
    const limpia = nuevaRedInput.trim().toUpperCase().replace(/\s+/g, '_');
    if (!limpia) return;

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
    ) return '#ef4444';
    if (
      obtenerItemsCategoria('control').includes(t) ||
      /(RESET|RST|ENABLE|_EN$|^EN_|INT|IRQ|CLK|CLOCK|PWM|NTC|THERM|^ID$|_ID$|SENSE|POWER_KEY|VOL_UP|VOL_DOWN|CELL_BAL|DET)/i.test(t)
    ) return '#10b981';
    if (obtenerItemsCategoria('comunicacion').includes(t)) return '#eab308';
    return '#8b5cf6';
  };

  // Filtrado por búsqueda en todo el catálogo o por categoría
  const query = busqueda.trim().toUpperCase();
  let itemsAMostrar = [];

  if (query) {
    // Buscar en todas las categorías
    const todos = [];
    Object.keys(CATEGORIAS_LINEAS).forEach(cat => {
      obtenerItemsCategoria(cat).forEach(item => {
        if (item.toUpperCase().includes(query) && !todos.some(x => x.item === item)) {
          todos.push({ item, cat });
        }
      });
    });
    itemsAMostrar = todos;
  } else {
    itemsAMostrar = obtenerItemsCategoria(categoriaActiva).map(item => ({ item, cat: categoriaActiva }));
  }

  const renderModalContent = () => (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(5px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#111827'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f8fafc' }}>
                Seleccionar Tipo y Nombre de Línea
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                {nombreComponente ? `${nombreComponente} — ` : ''}Pin {idPad || ''} • Actual: <strong style={{ color: '#00ffff' }}>{valor}</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Cerrar (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Acceso Ultrarrápido a GND y NC */}
        <div style={{ padding: '12px 20px', backgroundColor: '#090d16', borderBottom: '1px solid #1e293b', display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleSelect('GND')}
            style={{
              flex: 1,
              padding: '10px',
              background: valor === 'GND' ? '#374151' : '#1e293b',
              color: 'white',
              border: valor === 'GND' ? '2px solid #00ffff' : '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: valor === 'GND' ? '0 0 12px rgba(0,255,255,0.2)' : 'none'
            }}
          >
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#9ca3af' }} />
            🛡️ GND (Tierra / Masa)
          </button>
          <button
            type="button"
            onClick={() => handleSelect('NC')}
            style={{
              flex: 1,
              padding: '10px',
              background: valor === 'NC' ? '#1e3a8a' : '#1e293b',
              color: 'white',
              border: valor === 'NC' ? '2px solid #00ffff' : '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: valor === 'NC' ? '0 0 12px rgba(59,130,246,0.3)' : 'none'
            }}
          >
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#60a5fa' }} />
            🔵 NC (No Conectado)
          </button>
        </div>

        {/* Buscador en Vivo */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 12px'
          }}>
            <Search size={16} color="#38bdf8" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Escribe para buscar... (ej: NTC, ID, SDA, VBAT, DET)"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                fontWeight: 'bold'
              }}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Pestañas de Categoría (visibles cuando no hay texto de búsqueda activo) */}
        {!query && (
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 20px',
            overflowX: 'auto',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#090d16'
          }}>
            {Object.keys(CATEGORIAS_LINEAS).map((key) => {
              const cat = CATEGORIAS_LINEAS[key];
              const IconComp = cat.icon;
              const isSelected = categoriaActiva === key;
              const count = obtenerItemsCategoria(key).length;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategoriaActiva(key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isSelected ? `1px solid ${cat.color}` : '1px solid #1e293b',
                    background: isSelected ? 'rgba(255,255,255,0.08)' : '#111827',
                    color: isSelected ? '#fff' : '#94a3b8',
                    fontSize: '0.74rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  <IconComp size={13} color={cat.color} />
                  <span>{cat.shortLbl}</span>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    background: isSelected ? cat.color : '#334155',
                    color: isSelected ? '#000' : '#fff'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Lista de Líneas con Scroll */}
        <div style={{
          padding: '14px 20px',
          overflowY: 'auto',
          maxHeight: '340px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '8px'
        }}>
          {itemsAMostrar.length > 0 ? (
            itemsAMostrar.map(({ item, cat }) => {
              const isSelected = valor === item;
              const pillColor = getPillColor(item);
              const esCustom = (catalogoLocal[cat] || []).includes(item) || tiposCustom.includes(item);

              return (
                <div
                  key={`${cat}_${item}`}
                  onClick={() => handleSelect(item)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(0, 255, 255, 0.15)' : '#1e293b',
                    border: isSelected ? '1px solid #00ffff' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 0 10px rgba(0, 255, 255, 0.2)' : 'none'
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
                        backgroundColor: pillColor,
                        flexShrink: 0
                      }}
                    />
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      color: isSelected ? '#00ffff' : '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item}
                    </span>
                  </div>

                  {esCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Eliminar la red personalizada "${item}"?`)) {
                          eliminarRedLocal(cat, item);
                        }
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      title="Eliminar red personalizada"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '0.85rem' }}>
              No se encontraron líneas con "{busqueda}". Puedes crearla abajo 👇
            </div>
          )}
        </div>

        {/* Pie: Crear Nueva Red Personalizada */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#090d16'
        }}>
          <form onSubmit={guardarNuevaRed} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={`Crear nueva red (ej: BATT_ALERT, DET)...`}
              value={nuevaRedInput}
              onChange={(e) => setNuevaRedInput(e.target.value)}
              style={{
                flex: 1,
                background: '#1e293b',
                color: '#00ffff',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.8rem',
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
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: nuevaRedInput.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={14} />
              Agregar
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {/* Botón disparador principal en el formulario */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
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
        title="Clic para seleccionar o buscar un tipo/nombre de red"
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

      {/* Renderizado mediante Portal en document.body para evitar recortes */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        renderModalContent(),
        document.body
      )}
    </div>
  );
}
