import React, { useState } from 'react';
import { Cpu, Database, Plus, CheckCircle2, XCircle, Trash2, Save, Edit, X, ChevronRight, Image as ImageIcon, Map } from 'lucide-react';

const COLORES_LINEA = [
  '#00ffff', '#ff6b6b', '#fbbf24', '#10b981', '#a78bfa',
  '#f472b6', '#38bdf8', '#fb923c', '#34d399', '#e879f9'
];

const lineaVacia = () => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  nombre: 'SDA',
  color: '#00ffff',
  pullUp: false,
  nota: ''
});

const icVacio = () => ({
  nombre: '',
  nomenclatura: '',
  slaveId: '',
  mfgIdSano: '',
  prodIdSano: '',
  imgPlaca: '',
  imgEsquema: '',
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
  const [imagenModal, setImagenModal] = useState({ visible: false, url: '', titulo: '' });

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
      slaveId: ic.slaveId || '',
      mfgIdSano: ic.mfgIdSano || '',
      prodIdSano: ic.prodIdSano || '',
      imgPlaca: ic.imgPlaca || '',
      imgEsquema: ic.imgEsquema || '',
      lineas: ic.lineas || []
    });
    setEditandoId(ic.id);
    setBuilderAbierto(true);
  };

  const guardarIC = () => {
    if (!builderData.nombre || !builderData.mfgIdSano || !builderData.slaveId) return;

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

  // --- Helpers imágenes ---
  const solicitarImagen = (ic, tipo) => {
    const actual = tipo === 'placa' ? ic.imgPlaca : ic.imgEsquema;
    const url = window.prompt(`Ingresa la URL para ${tipo === 'placa' ? 'Placa' : 'Esquemático'}:`, actual || '');
    if (url !== null) {
      const campo = tipo === 'placa' ? 'imgPlaca' : 'imgEsquema';
      const nuevosIcs = rffeIcs.map(item => item.id === ic.id ? { ...item, [campo]: url } : item);
      setModeloActivo({ ...modeloActivo, rffe_ics: nuevosIcs });
      if (icSeleccionado?.id === ic.id) {
        setIcSeleccionado({ ...icSeleccionado, [campo]: url });
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#111827', color: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #374151', minHeight: '500px' }}>
      
      {/* Modal de Imagen */}
      {imagenModal.visible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setImagenModal({ visible: false, url: '', titulo: '' })}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{imagenModal.titulo}</span>
              <button onClick={() => setImagenModal({ visible: false, url: '', titulo: '' })} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="white" /></button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={imagenModal.url} alt={imagenModal.titulo} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

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

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
            
            {/* Controles Principales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', width: '100%' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>NOMBRE DEL IC</label>
                <input type="text" placeholder="Transceptor" value={builderData.nombre} onChange={e => setBuilderData({ ...builderData, nombre: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>NOMENCLATURA</label>
                <input type="text" placeholder="U3001" value={builderData.nomenclatura} onChange={e => setBuilderData({ ...builderData, nomenclatura: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>SLAVE ID (BUS ADDR)</label>
                <input type="text" placeholder="0xF" value={builderData.slaveId} onChange={e => setBuilderData({ ...builderData, slaveId: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} />
              </div>
            </div>

            {/* IDs de protocolo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%', maxWidth: '600px' }}>
              <div style={{ backgroundColor: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
                <label style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>MFG ID ESPERADO</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="0x20" value={builderData.mfgIdSano} onChange={e => setBuilderData({ ...builderData, mfgIdSano: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '1px' }} />
                  {lecturaRffe !== '0x00' && (
                    <button onClick={() => setBuilderData({...builderData, mfgIdSano: lecturaRffe})} style={{ backgroundColor: 'rgba(0, 255, 255, 0.1)', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, fontSize: '0.75rem' }}>
                      📡 Capturar
                    </button>
                  )}
                </div>
              </div>
              <div style={{ backgroundColor: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
                <label style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>PROD ID ESPERADO</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="0x1B" value={builderData.prodIdSano} onChange={e => setBuilderData({ ...builderData, prodIdSano: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '1px' }} />
                  {lecturaRffe !== '0x00' && (
                    <button onClick={() => setBuilderData({...builderData, prodIdSano: lecturaRffe})} style={{ backgroundColor: 'rgba(0, 255, 255, 0.1)', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, fontSize: '0.75rem' }}>
                      📡 Capturar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Esquemático Interactivo */}
            <div style={{ width: '100%', borderTop: '1px dashed #30363d', paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h5 style={{ color: '#9ca3af', margin: '0 0 20px 0', fontSize: '0.8rem', letterSpacing: '1px' }}>ESQUEMÁTICO DE CONEXIÓN</h5>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', overflowX: 'auto', paddingBottom: '15px' }}>
                
                {/* Controles de líneas (Izquierda) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginRight: '0' }}>
                  {builderData.lineas.map(linea => (
                    <div key={linea.id} style={{ display: 'flex', alignItems: 'center', height: '36px', gap: '8px' }}>
                      <button onClick={() => eliminarLinea(linea.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={14} />
                      </button>
                      <input type="color" value={linea.color} onChange={e => actualizarLinea(linea.id, 'color', e.target.value)} style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent', padding: 0 }} />
                      <input type="text" placeholder="Pin" value={linea.nombre} onChange={e => actualizarLinea(linea.id, 'nombre', e.target.value)} style={{ ...inputStyle, width: '70px', padding: '4px 8px' }} />
                      <input type="text" placeholder="Nota" value={linea.nota} onChange={e => actualizarLinea(linea.id, 'nota', e.target.value)} style={{ ...inputStyle, width: '100px', padding: '4px 8px' }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px', marginRight: '8px' }}>
                        <input type="checkbox" checked={linea.pullUp} onChange={e => actualizarLinea(linea.id, 'pullUp', e.target.checked)} /> R-Pull
                      </label>
                      {/* Trazo CSS */}
                      <div style={{ width: '60px', height: '2px', backgroundColor: linea.color, boxShadow: `0 0 4px ${linea.color}` }}></div>
                    </div>
                  ))}
                  <button onClick={agregarLinea} style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed #30363d', color: '#9ca3af', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                    <Plus size={14} /> Línea
                  </button>
                </div>

                {/* Bloque IC Central */}
                <div style={{
                  width: '160px',
                  minHeight: `${Math.max(4, builderData.lineas.length) * 36}px`,
                  backgroundColor: '#0d1117',
                  border: '2px solid #30363d',
                  borderRadius: '4px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  position: 'relative', padding: '15px 10px',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}>
                  {/* Muesca */}
                  <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px', backgroundColor: '#1a1a1a', borderRadius: '0 0 6px 6px', border: '2px solid #30363d', borderTop: 'none' }}></div>
                  
                  {/* Dots */}
                  {builderData.lineas.map((linea, i) => (
                    <div key={linea.id} style={{ position: 'absolute', left: '-5px', top: `${(i * 46) + 18 - 4}px`, width: '8px', height: '8px', borderRadius: '50%', backgroundColor: linea.color, boxShadow: `0 0 6px ${linea.color}`, border: '1px solid #0d1117' }}></div>
                  ))}
                  
                  <span style={{ color: '#6b7280', fontSize: '0.65rem', marginBottom: '2px', textAlign: 'center' }}>{builderData.nomenclatura || 'U?'}</span>
                  <span style={{ color: '#e6edf3', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', wordBreak: 'break-word' }}>{builderData.nombre || 'Chip Name'}</span>
                  <span style={{ color: '#00ffff', fontSize: '0.7rem', fontFamily: 'monospace', marginTop: '4px' }}>[{builderData.slaveId || '0x?'}]</span>
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <button
              onClick={guardarIC}
              disabled={!builderData.nombre || !builderData.mfgIdSano || !builderData.slaveId}
              style={{
                backgroundColor: !builderData.nombre || !builderData.mfgIdSano || !builderData.slaveId ? '#1f2937' : '#10b981',
                color: !builderData.nombre || !builderData.mfgIdSano || !builderData.slaveId ? '#4b5563' : 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '10px',
                cursor: !builderData.nombre || !builderData.mfgIdSano || !builderData.slaveId ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: builderData.nombre && builderData.mfgIdSano && builderData.slaveId ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.2s',
                width: '100%',
                justifyContent: 'center'
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
          const coincide = lecturaRffe === ic.mfgIdSano && lecturaRffe !== '0x00';
          const errorRffe = lecturaRffe !== ic.mfgIdSano && lecturaRffe !== '0x00';
          
          const borderColor = modo === 'diagnostico' || icSeleccionado?.id === ic.id ? 
            (coincide ? '#10b981' : (errorRffe ? '#ef4444' : '#30363d')) : '#30363d';
            
          const boxGlow = modo === 'diagnostico' || icSeleccionado?.id === ic.id ? 
            (coincide ? '0 0 15px rgba(16,185,129,0.2)' : (errorRffe ? '0 0 15px rgba(239,68,68,0.2)' : 'none')) : 'none';

          const estaExpandido = icSeleccionado?.id === ic.id;
          const lineas = ic.lineas || [];

          return (
            <div key={ic.id} style={{ backgroundColor: '#1a1a1a', border: '1px solid', borderColor: borderColor, borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s', boxShadow: boxGlow }}>
              {/* Header de la tarjeta */}
              <div
                onClick={() => setIcSeleccionado(estaExpandido ? null : ic)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '8px',
                    backgroundColor: coincide ? 'rgba(16,185,129,0.12)' : (errorRffe ? 'rgba(239,68,68,0.12)' : '#0d1117'),
                    border: `1px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Cpu size={20} color={coincide ? '#10b981' : (errorRffe ? '#ef4444' : '#6b7280')} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#e6edf3', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {ic.nombre} <span style={{ fontSize: '0.65rem', color: '#00ffff', backgroundColor: 'rgba(0,255,255,0.1)', padding: '1px 4px', borderRadius: '4px', border: '1px solid rgba(0,255,255,0.2)' }}>{ic.slaveId}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', display: 'flex', gap: '10px', marginTop: '2px' }}>
                      <span>{ic.nomenclatura || '---'}</span>
                      <span>•</span>
                      <span>MFG: <span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{ic.mfgIdSano}</span></span>
                      {lineas.length > 0 && <><span>•</span><span>{lineas.length} líneas</span></>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Status badge en modo diagnostico */}
                  {(modo === 'diagnostico' && lecturaRffe !== '0x00') && (
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
                  
                  {/* Visualización Esquemática y Detalles */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px 0', width: '100%', overflowX: 'auto' }}>
                      
                      {/* Líneas a la izquierda */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                        {lineas.map(linea => (
                          <div key={linea.id} style={{ display: 'flex', alignItems: 'center', height: '36px' }}>
                            {linea.nota && (
                              <span style={{ color: '#6b7280', fontSize: '0.6rem', marginRight: '8px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {linea.nota}
                              </span>
                            )}
                            <span style={{ color: linea.color, fontSize: '0.75rem', fontWeight: 'bold', width: '40px', textAlign: 'right', marginRight: '8px' }}>
                              {linea.nombre}
                            </span>
                            {linea.pullUp && (
                              <span style={{ fontSize: '0.6rem', color: '#fbbf24', marginRight: '6px', padding: '1px 4px', border: '1px solid #fbbf24', borderRadius: '3px', fontWeight: 'bold' }}>
                                R↑
                              </span>
                            )}
                            <div style={{ width: '50px', height: '2px', backgroundColor: linea.color, boxShadow: `0 0 4px ${linea.color}` }}></div>
                          </div>
                        ))}
                      </div>

                      {/* Bloque Central IC */}
                      <div style={{
                        width: '140px',
                        minHeight: `${Math.max(3, lineas.length) * 36}px`,
                        backgroundColor: '#0d1117',
                        border: '2px solid',
                        borderColor: borderColor,
                        borderRadius: '4px',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        position: 'relative', padding: '15px 10px',
                        boxShadow: boxGlow
                      }}>
                        <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '5px', backgroundColor: '#1a1a1a', borderRadius: '0 0 4px 4px', border: `2px solid ${borderColor}`, borderTop: 'none' }}></div>
                        
                        {lineas.map((linea, i) => (
                          <div key={linea.id} style={{ position: 'absolute', left: '-5px', top: `${(i * 36) + 18 - 4}px`, width: '8px', height: '8px', borderRadius: '50%', backgroundColor: linea.color, boxShadow: `0 0 6px ${linea.color}`, border: '1px solid #0d1117' }}></div>
                        ))}

                        <span style={{ color: '#6b7280', fontSize: '0.6rem' }}>{ic.nomenclatura}</span>
                        <span style={{ color: '#e6edf3', fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'center' }}>{ic.nombre}</span>
                        <span style={{ color: '#00ffff', fontSize: '0.65rem', fontFamily: 'monospace', marginTop: '4px' }}>[{ic.slaveId}]</span>
                      </div>
                    </div>
                  </div>

                  {/* Comparación de IDs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: '#0d1117', padding: '12px', borderRadius: '8px', border: '1px solid #30363d' }}>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>REFERENCIA (SANO)</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem' }}>MFG: <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{ic.mfgIdSano}</strong></span>
                        <span style={{ fontSize: '0.8rem' }}>PROD: <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{ic.prodIdSano || '---'}</strong></span>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#0d1117', padding: '12px', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>LECTURA EN VIVO</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem' }}>MFG: <strong style={{ color: coincide ? '#10b981' : (errorRffe ? '#ef4444' : '#9ca3af'), fontFamily: 'monospace' }}>{modo === 'diagnostico' ? lecturaRffe : ic.mfgIdActual}</strong></span>
                        <span style={{ fontSize: '0.8rem' }}>PROD: <strong style={{ color: '#9ca3af', fontFamily: 'monospace' }}>{modo === 'diagnostico' ? '---' : ic.prodIdActual}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Imágenes de Placa / Esquemático */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {ic.imgPlaca ? (
                      <button onClick={() => setImagenModal({ visible: true, url: ic.imgPlaca, titulo: \`Placa: \${ic.nombre}\` })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem' }}>
                        <ImageIcon size={14} /> Ver Placa
                      </button>
                    ) : modo === 'crear' ? (
                      <button onClick={() => solicitarImagen(ic, 'placa')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px dashed #30363d', backgroundColor: 'transparent', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem' }}>
                        <ImageIcon size={14} /> + Foto Placa
                      </button>
                    ) : null}

                    {ic.imgEsquema ? (
                      <button onClick={() => setImagenModal({ visible: true, url: ic.imgEsquema, titulo: \`Esquema: \${ic.nombre}\` })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem' }}>
                        <Map size={14} /> Ver Esquema
                      </button>
                    ) : modo === 'crear' ? (
                      <button onClick={() => solicitarImagen(ic, 'esquema')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px dashed #30363d', backgroundColor: 'transparent', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem' }}>
                        <Map size={14} /> + Foto Esquema
                      </button>
                    ) : null}
                  </div>

                  {/* Veredicto en modo diagnóstico */}
                  {(modo === 'diagnostico' && lecturaRffe !== '0x00') && (
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', backgroundColor: coincide ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${coincide ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
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
