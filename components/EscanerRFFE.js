import React, { useState } from 'react';
import { Cpu, Database, Plus, CheckCircle2, XCircle, Trash2, Save, Edit, X, ChevronRight } from 'lucide-react';

const COLORES_LINEA = [
  '#00ffff', '#ff6b6b', '#fbbf24', '#10b981', '#a78bfa',
  '#f472b6', '#38bdf8', '#fb923c', '#34d399', '#e879f9'
];

const lineaVacia = () => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  nombre: '',
  color: '#00ffff',
  resistencia: '',
  nota: ''
});

const icVacio = () => ({
  nombre: '',
  nomenclatura: '',
  mfgIdSano: '',
  prodIdSano: '',
  lineas: []
});

const inputStyle = {
  backgroundColor: '#0d1117',
  border: '1px solid #30363d',
  color: '#e6edf3',
  padding: '8px 10px',
  borderRadius: '6px',
  fontSize: '0.8rem',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s'
};

const EscanerRFFE = ({ modeloActivo, setModeloActivo, modo = 'diagnostico', lecturaRffe = '0x00' }) => {
  const [icSeleccionado, setIcSeleccionado] = useState(null);
  const [builderAbierto, setBuilderAbierto] = useState(false);
  const [builderData, setBuilderData] = useState(icVacio());
  const [editandoId, setEditandoId] = useState(null);

  const rffeIcs = modeloActivo?.rffe_ics || [];

  // --- CRUD ---
  const abrirBuilderNuevo = () => {
    setBuilderData(icVacio());
    setEditandoId(null);
    setBuilderAbierto(true);
  };

  const abrirBuilderEditar = (ic) => {
    setBuilderData({
      nombre: ic.nombre || '',
      nomenclatura: ic.nomenclatura || '',
      mfgIdSano: ic.mfgIdSano || '',
      prodIdSano: ic.prodIdSano || '',
      lineas: ic.lineas || []
    });
    setEditandoId(ic.id);
    setBuilderAbierto(true);
  };

  const guardarIC = () => {
    if (!builderData.nombre || !builderData.mfgIdSano) return;

    let nuevosIcs;
    if (editandoId) {
      nuevosIcs = rffeIcs.map(ic =>
        ic.id === editandoId
          ? { ...ic, ...builderData }
          : ic
      );
    } else {
      const icFinal = {
        ...builderData,
        id: Date.now().toString(),
        mfgIdActual: '---',
        prodIdActual: '---'
      };
      nuevosIcs = [...rffeIcs, icFinal];
    }

    setModeloActivo({ ...modeloActivo, rffe_ics: nuevosIcs });
    setBuilderAbierto(false);
    setBuilderData(icVacio());
    setEditandoId(null);
  };

  const eliminarIC = (id) => {
    if (!window.confirm('¿Eliminar este IC del protocolo RFFE?')) return;
    setModeloActivo({
      ...modeloActivo,
      rffe_ics: rffeIcs.filter(ic => ic.id !== id)
    });
    if (icSeleccionado?.id === id) setIcSeleccionado(null);
  };

  const cerrarBuilder = () => {
    setBuilderAbierto(false);
    setBuilderData(icVacio());
    setEditandoId(null);
  };

  // --- Líneas helpers ---
  const agregarLinea = () => {
    setBuilderData(prev => ({
      ...prev,
      lineas: [...prev.lineas, lineaVacia()]
    }));
  };

  const actualizarLinea = (lineaId, campo, valor) => {
    setBuilderData(prev => ({
      ...prev,
      lineas: prev.lineas.map(l =>
        l.id === lineaId ? { ...l, [campo]: valor } : l
      )
    }));
  };

  const eliminarLinea = (lineaId) => {
    setBuilderData(prev => ({
      ...prev,
      lineas: prev.lineas.filter(l => l.id !== lineaId)
    }));
  };

  return (
    <div style={{ backgroundColor: '#111827', color: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #374151', minHeight: '500px' }}>
      {/* Dashboard Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: lecturaRffe !== '0x00' ? '#10b981' : '#4b5563', boxShadow: lecturaRffe !== '0x00' ? '0 0 10px #10b981' : 'none' }}></div>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#9ca3af' }}>RFFE STATUS:</span>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>{lecturaRffe !== '0x00' ? 'CONECTADO' : 'ESPERANDO...'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>LIVE HEX READING</span>
          <span style={{ fontSize: '2rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.3)' }}>{lecturaRffe}</span>
        </div>
      </div>

      {/* Título + Botón Añadir */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
          <Database size={18} /> MAPA RFFE DEL DISPOSITIVO
        </h3>
        {modo === 'crear' && !builderAbierto && (
          <button
            onClick={abrirBuilderNuevo}
            style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', transition: 'all 0.2s', boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)' }}
          >
            <Plus size={16} /> Añadir IC RFFE
          </button>
        )}
      </div>

      {/* ====== IC BUILDER VISUAL ====== */}
      {builderAbierto && (
        <div style={{ backgroundColor: '#0d1117', border: '1px solid #3b82f6', borderRadius: '12px', padding: '20px', marginBottom: '25px', boxShadow: '0 0 25px rgba(59, 130, 246, 0.15)' }}>
          {/* Header del Builder */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <Cpu size={18} /> {editandoId ? '✏️ EDITANDO IC' : '🔧 IC BUILDER'}
            </h4>
            <button onClick={cerrarBuilder} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <X size={14} /> Cerrar
            </button>
          </div>

          {/* Zona visual: IC chip + líneas */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

            {/* IC Chip Visual */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
              {/* El chip */}
              <div style={{
                width: '180px',
                height: '180px',
                backgroundColor: '#1a1a2e',
                border: '2px solid #30363d',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(59,130,246,0.05)'
              }}>
                {/* Muesca del IC */}
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '8px', backgroundColor: '#0d1117', borderRadius: '0 0 8px 8px', border: '2px solid #30363d', borderTop: 'none' }}></div>
                {/* Nombre en el chip */}
                <input
                  type="text"
                  placeholder="IC Name"
                  value={builderData.nombre}
                  onChange={e => setBuilderData({ ...builderData, nombre: e.target.value })}
                  style={{ ...inputStyle, textAlign: 'center', width: '140px', fontWeight: 'bold', fontSize: '0.85rem', backgroundColor: 'transparent', border: 'none', color: '#e6edf3' }}
                />
                <input
                  type="text"
                  placeholder="U3001"
                  value={builderData.nomenclatura}
                  onChange={e => setBuilderData({ ...builderData, nomenclatura: e.target.value })}
                  style={{ ...inputStyle, textAlign: 'center', width: '120px', fontSize: '0.7rem', backgroundColor: 'transparent', border: 'none', color: '#6b7280', marginTop: '2px' }}
                />
                {/* Dot pattern */}
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#30363d' }}></div>
              </div>

              {/* Líneas/pines conectados al chip */}
              {builderData.lineas.length > 0 && (
                <div style={{ marginTop: '15px', width: '100%' }}>
                  {builderData.lineas.map((linea, idx) => {
                    const lado = idx % 2 === 0 ? 'left' : 'right';
                    return (
                      <div
                        key={linea.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          marginBottom: '6px',
                          backgroundColor: '#161b22',
                          borderRadius: '8px',
                          borderLeft: `3px solid ${linea.color}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Color picker */}
                        <input
                          type="color"
                          value={linea.color}
                          onChange={e => actualizarLinea(linea.id, 'color', e.target.value)}
                          style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent', padding: 0 }}
                        />
                        {/* Nombre del pin */}
                        <input
                          type="text"
                          placeholder="SDA, SCL, VIO..."
                          value={linea.nombre}
                          onChange={e => actualizarLinea(linea.id, 'nombre', e.target.value)}
                          style={{ ...inputStyle, flex: 1, minWidth: '80px' }}
                        />
                        {/* Resistencia */}
                        <input
                          type="text"
                          placeholder="Pull-up / R"
                          value={linea.resistencia}
                          onChange={e => actualizarLinea(linea.id, 'resistencia', e.target.value)}
                          style={{ ...inputStyle, width: '100px' }}
                        />
                        {/* Nota */}
                        <input
                          type="text"
                          placeholder="Nota..."
                          value={linea.nota}
                          onChange={e => actualizarLinea(linea.id, 'nota', e.target.value)}
                          style={{ ...inputStyle, width: '100px' }}
                        />
                        {/* Eliminar */}
                        <button
                          onClick={() => eliminarLinea(linea.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botón agregar línea */}
              <button
                onClick={agregarLinea}
                style={{
                  marginTop: '10px',
                  backgroundColor: 'transparent',
                  border: '1px dashed #30363d',
                  color: '#6b7280',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <Plus size={14} /> Añadir Línea (Test Point)
              </button>
            </div>

            {/* IDs del protocolo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '500px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>MFG ID ESPERADO</label>
                <input
                  type="text"
                  placeholder="0x20"
                  value={builderData.mfgIdSano}
                  onChange={e => setBuilderData({ ...builderData, mfgIdSano: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '1rem', textAlign: 'center', letterSpacing: '1px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>PROD ID ESPERADO</label>
                <input
                  type="text"
                  placeholder="0x1B"
                  value={builderData.prodIdSano}
                  onChange={e => setBuilderData({ ...builderData, prodIdSano: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '1rem', textAlign: 'center', letterSpacing: '1px' }}
                />
              </div>
            </div>

            {/* Botón guardar */}
            <button
              onClick={guardarIC}
              disabled={!builderData.nombre || !builderData.mfgIdSano}
              style={{
                backgroundColor: !builderData.nombre || !builderData.mfgIdSano ? '#1f2937' : '#10b981',
                color: !builderData.nombre || !builderData.mfgIdSano ? '#4b5563' : 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '10px',
                cursor: !builderData.nombre || !builderData.mfgIdSano ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: builderData.nombre && builderData.mfgIdSano ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Save size={18} /> {editandoId ? 'Actualizar IC' : 'Guardar IC en Modelo'}
            </button>
          </div>
        </div>
      )}

      {/* ====== LISTADO DE ICs GUARDADOS ====== */}
      {rffeIcs.length === 0 && !builderAbierto && (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#4b5563' }}>
          <Cpu size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>No hay integrados RFFE registrados.</p>
          {modo === 'crear' && <p style={{ margin: '5px 0 0', fontSize: '0.75rem', color: '#374151' }}>Usa el botón "Añadir IC RFFE" para empezar.</p>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rffeIcs.map(ic => {
          const coincide = ic.mfgIdActual === ic.mfgIdSano && ic.mfgIdActual !== '---';
          const error = ic.mfgIdActual !== ic.mfgIdSano && ic.mfgIdActual !== '---';
          const estaExpandido = icSeleccionado?.id === ic.id;
          const lineas = ic.lineas || [];

          return (
            <div key={ic.id} style={{ backgroundColor: '#1a1a1a', border: '1px solid', borderColor: coincide ? '#10b981' : (error ? '#ef4444' : '#30363d'), borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s', boxShadow: coincide ? '0 0 12px rgba(16,185,129,0.15)' : (error ? '0 0 12px rgba(239,68,68,0.1)' : 'none') }}>
              {/* Header de la tarjeta */}
              <div
                onClick={() => setIcSeleccionado(estaExpandido ? null : ic)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Chip icon visual */}
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '8px',
                    backgroundColor: coincide ? 'rgba(16,185,129,0.12)' : (error ? 'rgba(239,68,68,0.12)' : '#0d1117'),
                    border: `1px solid ${coincide ? '#10b981' : (error ? '#ef4444' : '#30363d')}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Cpu size={20} color={coincide ? '#10b981' : (error ? '#ef4444' : '#6b7280')} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#e6edf3' }}>{ic.nombre}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', display: 'flex', gap: '10px', marginTop: '2px' }}>
                      <span>{ic.nomenclatura || '---'}</span>
                      <span>•</span>
                      <span>MFG: <span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{ic.mfgIdSano}</span></span>
                      {lineas.length > 0 && <><span>•</span><span>{lineas.length} líneas</span></>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Status badge */}
                  {ic.mfgIdActual !== '---' && (
                    coincide
                      ? <CheckCircle2 size={18} color="#10b981" />
                      : <XCircle size={18} color="#ef4444" />
                  )}
                  {modo === 'crear' && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); abrirBuilderEditar(ic); }} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', cursor: 'pointer', padding: '5px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        <Edit size={12} /> Editar
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); eliminarIC(ic.id); }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: '5px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                  <ChevronRight size={16} color="#4b5563" style={{ transform: estaExpandido ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </div>

              {/* Panel expandido */}
              {estaExpandido && (
                <div style={{ borderTop: '1px solid #30363d', padding: '16px' }}>
                  {/* Comparación de IDs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: lineas.length > 0 ? '16px' : '0' }}>
                    <div style={{ backgroundColor: '#0d1117', padding: '12px', borderRadius: '8px', border: '1px solid #30363d' }}>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>REFERENCIA (SANO)</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem' }}>MFG: <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{ic.mfgIdSano}</strong></span>
                        <span style={{ fontSize: '0.8rem' }}>PROD: <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{ic.prodIdSano || '---'}</strong></span>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#0d1117', padding: '12px', borderRadius: '8px', border: `1px solid ${coincide ? '#10b981' : (error ? '#ef4444' : '#30363d')}` }}>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>LECTURA ACTUAL</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem' }}>MFG: <strong style={{ color: coincide ? '#10b981' : (error ? '#ef4444' : '#9ca3af'), fontFamily: 'monospace' }}>{ic.mfgIdActual}</strong></span>
                        <span style={{ fontSize: '0.8rem' }}>PROD: <strong style={{ color: (ic.prodIdActual === ic.prodIdSano && ic.prodIdActual !== '---') ? '#10b981' : (ic.prodIdActual !== '---' ? '#ef4444' : '#9ca3af'), fontFamily: 'monospace' }}>{ic.prodIdActual || '---'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Líneas del IC */}
                  {lineas.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '8px' }}>LÍNEAS / TEST POINTS</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                        {lineas.map(linea => (
                          <div key={linea.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', backgroundColor: '#0d1117', borderRadius: '6px', borderLeft: `3px solid ${linea.color}` }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: linea.color, flexShrink: 0, boxShadow: `0 0 6px ${linea.color}` }}></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#e6edf3' }}>{linea.nombre || '---'}</div>
                              {(linea.resistencia || linea.nota) && (
                                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {linea.resistencia && <span>R: {linea.resistencia}</span>}
                                  {linea.resistencia && linea.nota && ' · '}
                                  {linea.nota && <span>{linea.nota}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Veredicto */}
                  {ic.mfgIdActual !== '---' && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', backgroundColor: coincide ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${coincide ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      {coincide ? <CheckCircle2 size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: coincide ? '#10b981' : '#ef4444' }}>
                        {coincide ? 'PROTOCOLO MIPI CORRECTO' : 'ERROR: IC NO RESPONDE O DATOS INCORRECTOS'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EscanerRFFE;
