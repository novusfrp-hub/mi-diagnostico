import React, { useState, useMemo, useCallback } from 'react';
import { ClipboardList, Save, Plus, Trash2, Zap, Usb, ChevronDown, Image, Eye, Cpu, HardDrive, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';

const ESTADOS_COMPORTAMIENTO = ['Estático', 'Cíclico', 'Corto total', 'Fuga inicial', 'Congelado', 'Sube y cae'];

const TIPOS_COMPONENTE = ['IC', 'Capacitor', 'Resistencia', 'Diodo', 'Bobina'];
const ESTADOS_COMPONENTE = ['Corto', 'Fuga', 'Abierto', 'Daño Físico'];

const OPERACIONES_SOLUCION = [
  'Reballing',
  'Puente (Jumper)',
  'Limpieza Ultrasónica',
  'Cambio de Componente',
  'Línea Cortada/Interrumpida'
];

const DESTINOS_ESTATICOS = [
  'CPU',
  'PMIC',
  'Codec de Audio',
  'Transceiver',
  'IC de Carga (IF-PMIC)',
  'Baseband',
  'Memoria RAM/ROM'
];

const ESTADOS_REPARACION = [
  { id: 'Pendiente', label: 'Pendiente', color: '#eab308', icon: Clock },
  { id: 'Reparado', label: 'Reparado', color: '#10b981', icon: CheckCircle },
  { id: 'Sin Solucion', label: 'Sin Solución', color: '#ef4444', icon: XCircle },
  { id: 'Entregado', label: 'Entregado', color: '#3b82f6', icon: Save }
];

const generarId = () => Date.now().toString() + Math.random().toString(36).slice(2, 6);

const inputDark = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '8px',
  color: 'white',
  outline: 'none',
  fontSize: '0.85rem',
  boxSizing: 'border-box'
};

const selectDark = {
  ...inputDark,
  appearance: 'auto',
  cursor: 'pointer'
};

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 'bold',
  color: '#9ca3af',
  display: 'block',
  marginBottom: '4px'
};

export default function FormularioIngresoAvanzado({
  formCaso,
  setFormCaso,
  guardarBitacora,
  casoEditando,
  mensajeCaso,
  casosGuardados
}) {
  const [tabActiva, setTabActiva] = useState(0);
  const [solucionTemp, setSolucionTemp] = useState({ operacion: '', destino: '' });

  // Extraer nombres únicos de líneas del historial para autocompletado
  const nombresLineasHistorial = useMemo(() => {
    const nombres = new Set();
    (casosGuardados || []).forEach(caso => {
      (caso.lineasAfectadas || []).forEach(linea => {
        if (linea.nombre && linea.nombre.trim()) {
          nombres.add(linea.nombre.trim());
        }
      });
    });
    return Array.from(nombres).sort();
  }, [casosGuardados]);

  // Autocompletado Hardware
  const hardwareHistorial = useMemo(() => {
    const cpus = new Set();
    const mems = new Set();
    const pmics = new Set();
    (casosGuardados || []).forEach(caso => {
      const hw = caso.hardware || {};
      if (hw.cpu) cpus.add(hw.cpu.trim());
      if (hw.memoria) mems.add(hw.memoria.trim());
      if (hw.pmic) pmics.add(hw.pmic.trim());
    });
    return {
      cpus: Array.from(cpus).sort(),
      mems: Array.from(mems).sort(),
      pmics: Array.from(pmics).sort()
    };
  }, [casosGuardados]);

  // Destinos Dinámicos para la Matriz
  const destinosDinamicos = useMemo(() => {
    const componentes = [];
    (formCaso.lineasAfectadas || []).forEach(linea => {
      (linea.componentes || []).forEach(comp => {
        if (comp.nomenclatura) {
          componentes.push(`${comp.nomenclatura} (${linea.nombre || 'Línea s/n'})`);
        }
      });
    });
    return [...DESTINOS_ESTATICOS, ...componentes];
  }, [formCaso.lineasAfectadas]);

  // Handlers genéricos
  const handleChange = useCallback((campo, valor) => {
    setFormCaso(prev => ({ ...prev, [campo]: valor }));
  }, [setFormCaso]);

  const handleHardwareChange = useCallback((campo, valor) => {
    setFormCaso(prev => ({
      ...prev,
      hardware: { ...(prev.hardware || { cpu: '', memoria: '', pmic: '' }), [campo]: valor }
    }));
  }, [setFormCaso]);

  const aplicarSolucion = () => {
    if (!solucionTemp.operacion || !solucionTemp.destino) return;
    const nuevaFrase = `Se realizó ${solucionTemp.operacion} en ${solucionTemp.destino}.`;
    const protocoloActual = formCaso.protocolo || '';
    const separador = protocoloActual.trim() ? '\n' : '';
    setFormCaso(prev => ({
      ...prev,
      protocolo: protocoloActual + separador + nuevaFrase
    }));
  };

  const handleConsumoUsbChange = useCallback((campo, valor) => {
    setFormCaso(prev => ({
      ...prev,
      consumoUsb: { ...prev.consumoUsb, [campo]: valor }
    }));
  }, [setFormCaso]);

  const handleConsumoFuenteChange = useCallback((campo, valor) => {
    setFormCaso(prev => ({
      ...prev,
      consumoFuente: { ...prev.consumoFuente, [campo]: valor }
    }));
  }, [setFormCaso]);

  // CRUD Líneas
  const agregarLinea = useCallback(() => {
    setFormCaso(prev => ({
      ...prev,
      lineasAfectadas: [
        ...prev.lineasAfectadas,
        { id: generarId(), nombre: '', componentes: [], imagenes: [] }
      ]
    }));
  }, [setFormCaso]);

  const eliminarLinea = useCallback((idLinea) => {
    setFormCaso(prev => ({
      ...prev,
      lineasAfectadas: prev.lineasAfectadas.filter(l => l.id !== idLinea)
    }));
  }, [setFormCaso]);

  const actualizarLinea = useCallback((idLinea, campo, valor) => {
    setFormCaso(prev => ({
      ...prev,
      lineasAfectadas: prev.lineasAfectadas.map(l =>
        l.id === idLinea ? { ...l, [campo]: valor } : l
      )
    }));
  }, [setFormCaso]);

  // CRUD Componentes dentro de una línea
  const agregarComponente = useCallback((idLinea) => {
    setFormCaso(prev => ({
      ...prev,
      lineasAfectadas: prev.lineasAfectadas.map(l =>
        l.id === idLinea
          ? {
              ...l,
              componentes: [
                ...l.componentes,
                { id: generarId(), tipo: 'IC', nomenclatura: '', estado: 'Corto' }
              ]
            }
          : l
      )
    }));
  }, [setFormCaso]);

  const eliminarComponente = useCallback((idLinea, idComponente) => {
    setFormCaso(prev => ({
      ...prev,
      lineasAfectadas: prev.lineasAfectadas.map(l =>
        l.id === idLinea
          ? { ...l, componentes: l.componentes.filter(c => c.id !== idComponente) }
          : l
      )
    }));
  }, [setFormCaso]);

  const actualizarComponente = useCallback((idLinea, idComponente, campo, valor) => {
    setFormCaso(prev => ({
      ...prev,
      lineasAfectadas: prev.lineasAfectadas.map(l =>
        l.id === idLinea
          ? {
              ...l,
              componentes: l.componentes.map(c =>
                c.id === idComponente ? { ...c, [campo]: valor } : c
              )
            }
          : l
      )
    }));
  }, [setFormCaso]);

  // CRUD Imágenes dentro de una línea
  const agregarImagen = useCallback((idLinea) => {
    setFormCaso(prev => ({
      ...prev,
      lineasAfectadas: prev.lineasAfectadas.map(l =>
        l.id === idLinea
          ? {
              ...l,
              imagenes: [
                ...(l.imagenes || []),
                { id: generarId(), url: '', tipo: 'placa' }
              ]
            }
          : l
      )
    }));
  }, [setFormCaso]);

  const eliminarImagen = useCallback((idLinea, idImagen) => {
    setFormCaso(prev => ({
      ...prev,
      lineasAfectadas: prev.lineasAfectadas.map(l =>
        l.id === idLinea
          ? { ...l, imagenes: (l.imagenes || []).filter(img => img.id !== idImagen) }
          : l
      )
    }));
  }, [setFormCaso]);

  const actualizarImagen = useCallback((idLinea, idImagen, campo, valor) => {
    setFormCaso(prev => ({
      ...prev,
      lineasAfectadas: prev.lineasAfectadas.map(l =>
        l.id === idLinea
          ? {
              ...l,
              imagenes: (l.imagenes || []).map(img =>
                img.id === idImagen ? { ...img, [campo]: valor } : img
              )
            }
          : l
      )
    }));
  }, [setFormCaso]);

  // Tabs
  const tabs = [
    { label: '1. Datos Básicos', icon: ClipboardList },
    { label: '2. Consumos (USB/Fuente)', icon: Zap },
    { label: '3. Topología (Líneas/Componentes)', icon: ChevronDown }
  ];

  const renderTabDatosBasicos = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Marca</label>
          <input
            required
            list="marcas-sugeridas"
            type="text"
            style={inputDark}
            value={formCaso.marca}
            onChange={(e) => handleChange('marca', e.target.value)}
            placeholder="Ej: Xiaomi"
          />
          <datalist id="marcas-sugeridas">
            {Array.from(new Set((casosGuardados || []).map(c => c.marca))).sort().map(m => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div>
          <label style={labelStyle}>Modelo</label>
          <input
            required
            type="text"
            style={inputDark}
            value={formCaso.modelo}
            onChange={(e) => handleChange('modelo', e.target.value)}
            placeholder="Ej: POCO X3 Pro"
          />
        </div>
      </div>

      <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <label style={{ ...labelStyle, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={14} /> ESPECIFICACIONES DE HARDWARE
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <div>
            <label style={labelStyle}>Procesador (CPU)</label>
            <input
              list="cpus-sugeridas"
              type="text"
              style={inputDark}
              value={formCaso.hardware?.cpu || ''}
              onChange={(e) => handleHardwareChange('cpu', e.target.value)}
              placeholder="Ej: SM8250"
            />
            <datalist id="cpus-sugeridas">
              {hardwareHistorial.cpus.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label style={labelStyle}>PMIC Principal</label>
            <input
              list="pmics-sugeridas"
              type="text"
              style={inputDark}
              value={formCaso.hardware?.pmic || ''}
              onChange={(e) => handleHardwareChange('pmic', e.target.value)}
              placeholder="Ej: PM6150"
            />
            <datalist id="pmics-sugeridas">
              {hardwareHistorial.pmics.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div>
            <label style={labelStyle}>Memoria (ROM)</label>
            <input
              list="mems-sugeridas"
              type="text"
              style={inputDark}
              value={formCaso.hardware?.memoria || ''}
              onChange={(e) => handleHardwareChange('memoria', e.target.value)}
              placeholder="Ej: UFS 3.1"
            />
            <datalist id="mems-sugeridas">
              {hardwareHistorial.mems.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <label style={labelStyle}>Técnico Responsable</label>
        <input
          type="text"
          style={inputDark}
          value={formCaso.tecnico || ''}
          onChange={(e) => handleChange('tecnico', e.target.value)}
          placeholder="Nombre del técnico..."
        />
      </div>
      <div style={{ marginTop: '12px' }}>
        <label style={labelStyle}>Síntomas</label>
        <textarea
          required
          style={{ ...inputDark, minHeight: '60px', resize: 'vertical' }}
          value={formCaso.sintomas}
          onChange={(e) => handleChange('sintomas', e.target.value)}
          placeholder="Describe el problema reportado por el cliente..."
        />
      </div>
      <div style={{ marginTop: '12px' }}>
        <label style={labelStyle}>Protocolo / Diagnóstico</label>
        <textarea
          style={{ ...inputDark, minHeight: '80px', resize: 'vertical' }}
          value={formCaso.protocolo}
          onChange={(e) => handleChange('protocolo', e.target.value)}
          placeholder="Pasos realizados, mediciones, diagnóstico..."
        />
      </div>
      <div style={{ marginTop: '12px' }}>
        <label style={labelStyle}>URL de Imagen (opcional)</label>
        <input
          type="text"
          style={inputDark}
          value={formCaso.imgUrl}
          onChange={(e) => handleChange('imgUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>
    </>
  );

  const renderSelectComportamiento = (value, onChange) => (
    <select style={selectDark} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Seleccionar...</option>
      {ESTADOS_COMPORTAMIENTO.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );

  const renderTabConsumos = () => {
    const consumoUsb = formCaso.consumoUsb || {};
    const consumoFuente = formCaso.consumoFuente || {};

    return (
      <>
        {/* Sección USB */}
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <h4 style={{
            color: '#3b82f6',
            margin: '0 0 12px 0',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
          }}>
            <Usb size={16} /> Consumo USB
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Voltaje (V)</label>
              <input
                type="text"
                style={inputDark}
                value={consumoUsb.voltaje || ''}
                onChange={(e) => handleConsumoUsbChange('voltaje', e.target.value)}
                placeholder="Ej: 5.12"
              />
            </div>
            <div>
              <label style={labelStyle}>Corriente (A)</label>
              <input
                type="text"
                style={inputDark}
                value={consumoUsb.corriente || ''}
                onChange={(e) => handleConsumoUsbChange('corriente', e.target.value)}
                placeholder="Ej: 0.45"
              />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={labelStyle}>Comportamiento</label>
            {renderSelectComportamiento(
              consumoUsb.comportamiento || '',
              (val) => handleConsumoUsbChange('comportamiento', val)
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={labelStyle}>Con Batería</label>
              <input
                type="text"
                style={inputDark}
                value={consumoUsb.conBateria || ''}
                onChange={(e) => handleConsumoUsbChange('conBateria', e.target.value)}
                placeholder="Ej: 0.02A"
              />
            </div>
            <div>
              <label style={labelStyle}>Sin Batería</label>
              <input
                type="text"
                style={inputDark}
                value={consumoUsb.sinBateria || ''}
                onChange={(e) => handleConsumoUsbChange('sinBateria', e.target.value)}
                placeholder="Ej: 0.00A"
              />
            </div>
          </div>
        </div>

        {/* Sección Fuente */}
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <h4 style={{
            color: '#f97316',
            margin: '0 0 12px 0',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
          }}>
            <Zap size={16} /> Consumo Fuente
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Inicial (A)</label>
              <input
                type="text"
                style={inputDark}
                value={consumoFuente.inicial || ''}
                onChange={(e) => handleConsumoFuenteChange('inicial', e.target.value)}
                placeholder="Ej: 0.00"
              />
            </div>
            <div>
              <label style={labelStyle}>Post-Power (A)</label>
              <input
                type="text"
                style={inputDark}
                value={consumoFuente.postPower || ''}
                onChange={(e) => handleConsumoFuenteChange('postPower', e.target.value)}
                placeholder="Ej: 0.15"
              />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={labelStyle}>Comportamiento</label>
            {renderSelectComportamiento(
              consumoFuente.comportamiento || '',
              (val) => handleConsumoFuenteChange('comportamiento', val)
            )}
          </div>
        </div>
      </>
    );
  };

  const renderTabTopologia = () => (
    <div>
      {/* Matriz de Soluciones */}
      <div style={{
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '15px'
      }}>
        <h4 style={{ color: '#10b981', margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> MATRIZ DE SOLUCIONES TÉCNICAS
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Operación</label>
            <select
              style={selectDark}
              value={solucionTemp.operacion}
              onChange={(e) => setSolucionTemp(prev => ({ ...prev, operacion: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
              {OPERACIONES_SOLUCION.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Destino (IC o Componente)</label>
            <select
              style={selectDark}
              value={solucionTemp.destino}
              onChange={(e) => setSolucionTemp(prev => ({ ...prev, destino: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
              {destinosDinamicos.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={aplicarSolucion}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Aplicar
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={agregarLinea}
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '15px',
          fontSize: '0.85rem'
        }}
      >
        <Plus size={16} /> Añadir Línea Afectada
      </button>

      {formCaso.lineasAfectadas && formCaso.lineasAfectadas.length > 0 ? (
        formCaso.lineasAfectadas.map((linea) => (
          <div
            key={linea.id}
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '12px'
            }}
          >
            {/* Header de la línea */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                flexShrink: 0
              }} />
              <input
                list={`lineas-sugeridas-${linea.id}`}
                type="text"
                style={{ ...inputDark, flex: 1 }}
                value={linea.nombre}
                onChange={(e) => actualizarLinea(linea.id, 'nombre', e.target.value)}
                placeholder="Nombre de la línea (Ej: PP_VDD_MAIN)"
              />
              <datalist id={`lineas-sugeridas-${linea.id}`}>
                {nombresLineasHistorial.map(nombre => (
                  <option key={nombre} value={nombre} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => eliminarLinea(linea.id)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Eliminar línea"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Componentes de la línea */}
            <div style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '10px',
              marginTop: '10px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {linea.componentes && linea.componentes.length > 0 ? (
                  linea.componentes.map((comp) => (
                    <div
                      key={comp.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr auto',
                        gap: '8px',
                        alignItems: 'center'
                      }}
                    >
                      <select
                        style={selectDark}
                        value={comp.tipo}
                        onChange={(e) => actualizarComponente(linea.id, comp.id, 'tipo', e.target.value)}
                      >
                        {TIPOS_COMPONENTE.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        style={inputDark}
                        value={comp.nomenclatura}
                        onChange={(e) => actualizarComponente(linea.id, comp.id, 'nomenclatura', e.target.value)}
                        placeholder="Ej: C200"
                      />
                      <select
                        style={selectDark}
                        value={comp.estado}
                        onChange={(e) => actualizarComponente(linea.id, comp.id, 'estado', e.target.value)}
                      >
                        {ESTADOS_COMPONENTE.map(e => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => eliminarComponente(linea.id, comp.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Eliminar componente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : null}
                <button
                  type="button"
                  onClick={() => agregarComponente(linea.id)}
                  style={{
                    background: 'transparent',
                    border: '1px dashed #4b5563',
                    color: '#9ca3af',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    justifyContent: 'center',
                    marginTop: '4px'
                  }}
                >
                  <Plus size={14} /> Añadir Componente
                </button>
              </div>
            </div>

            {/* Imágenes de la línea (PostImage URLs) */}
            <div style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '10px',
              marginTop: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Image size={14} color="#8b5cf6" />
                <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 'bold' }}>IMÁGENES DE REFERENCIA</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(linea.imagenes || []).length > 0 ? (
                  (linea.imagenes || []).map((img) => (
                    <div
                      key={img.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        gap: '8px',
                        alignItems: 'center'
                      }}
                    >
                      <select
                        style={{ ...selectDark, width: '110px' }}
                        value={img.tipo}
                        onChange={(e) => actualizarImagen(linea.id, img.id, 'tipo', e.target.value)}
                      >
                        <option value="placa">📸 Placa</option>
                        <option value="esquema">🗺️ Esquema</option>
                        <option value="solucion">✅ Solución</option>
                      </select>
                      <input
                        type="text"
                        style={inputDark}
                        value={img.url}
                        onChange={(e) => actualizarImagen(linea.id, img.id, 'url', e.target.value)}
                        placeholder="URL de PostImage..."
                      />
                      {img.url && (
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: '#8b5cf6',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none'
                          }}
                          title="Ver imagen"
                        >
                          <Eye size={14} />
                        </a>
                      )}
                      {!img.url && <div style={{ width: '30px' }} />}
                      <button
                        type="button"
                        onClick={() => eliminarImagen(linea.id, img.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Eliminar imagen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : null}
                <button
                  type="button"
                  onClick={() => agregarImagen(linea.id)}
                  style={{
                    background: 'transparent',
                    border: '1px dashed #4b5563',
                    color: '#9ca3af',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    justifyContent: 'center',
                    marginTop: '4px'
                  }}
                >
                  <Image size={14} /> Añadir Imagen (PostImage)
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          padding: '30px',
          fontSize: '0.85rem'
        }}>
          Aún no hay líneas registradas. Haz clic en "Añadir Línea Afectada" para comenzar.
        </p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={guardarBitacora}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '85vh'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h3
            style={{
              margin: 0,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1.1rem'
            }}
          >
            <ClipboardList size={20} color="#10b981" />
            {casoEditando ? 'Editar Caso' : 'Nuevo Ingreso'}
          </h3>

          {/* Selector de Estado */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {ESTADOS_REPARACION.map(est => {
              const Icon = est.icon;
              const activo = formCaso.estadoReparacion === est.id;
              return (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => handleChange('estadoReparacion', est.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: activo ? `1px solid ${est.color}` : '1px solid transparent',
                    background: activo ? `${est.color}22` : 'transparent',
                    color: activo ? est.color : '#6b7280',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={12} />
                  {est.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* El botón cerrar (X) se maneja desde el AnimatePresence padre en index.js */}
      </div>

      {/* Navegación de Tabs */}
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
          overflowX: 'auto'
        }}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setTabActiva(index)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: tabActiva === index ? '#10b981' : '#1f2937',
                color: tabActiva === index ? 'white' : '#9ca3af',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido de Tabs */}
      <div
        style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1
        }}
      >
        {tabActiva === 0 && renderTabDatosBasicos()}
        {tabActiva === 1 && renderTabConsumos()}
        {tabActiva === 2 && renderTabTopologia()}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '15px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0
        }}
      >
        {mensajeCaso && (
          <p
            style={{
              color: mensajeCaso.includes('❌') ? '#ef4444' : '#10b981',
              textAlign: 'center',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              fontSize: '0.85rem'
            }}
          >
            {mensajeCaso}
          </p>
        )}
        <button
          type="submit"
          style={{
            background: '#0058bc',
            color: 'white',
            border: 'none',
            padding: '15px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            fontSize: '0.9rem',
            transition: 'opacity 0.2s'
          }}
        >
          <Save size={18} />
          {casoEditando ? 'Actualizar Caso' : 'Guardar en Bitácora'}
        </button>
      </div>
    </form>
  );
}
