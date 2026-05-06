import React, { useState } from 'react';
import { Cpu, Database, Plus, CheckCircle2, XCircle, Trash2, Save, ChevronRight } from 'lucide-react';

const EscanerRFFE = ({ modeloActivo, setModeloActivo, modo = 'diagnostico', lecturaRffe = '0x00' }) => {
  const [icSeleccionado, setIcSeleccionado] = useState(null);
  const [nuevoIc, setNuevoIc] = useState({ nombre: '', nomenclatura: '', mfgIdSano: '', prodIdSano: '' });

  const rffeIcs = modeloActivo?.rffe_ics || [];

  const handleAgregarIC = () => {
    if (!nuevoIc.nombre || !nuevoIc.mfgIdSano) return;
    const icFinal = {
      ...nuevoIc,
      id: Date.now().toString(),
      mfgIdActual: '---',
      prodIdActual: '---'
    };

    const nuevoModelo = {
      ...modeloActivo,
      rffe_ics: [...rffeIcs, icFinal]
    };
    setModeloActivo(nuevoModelo);
    setNuevoIc({ nombre: '', nomenclatura: '', mfgIdSano: '', prodIdSano: '' });
  };

  const eliminarIC = (id) => {
    if (!window.confirm('¿Eliminar este Integrado del protocolo RFFE?')) return;
    const nuevoModelo = {
      ...modeloActivo,
      rffe_ics: rffeIcs.filter(ic => ic.id !== id)
    };
    setModeloActivo(nuevoModelo);
    if (icSeleccionado?.id === id) setIcSeleccionado(null);
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

      <div style={{ display: 'grid', gridTemplateColumns: modo === 'crear' ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Lado Izquierdo: Formulario (Solo modo crear) */}
        {modo === 'crear' && (
          <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
              <Plus size={18} /> REGISTRAR NUEVO IC
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Nombre (ej. Transceptor)" value={nuevoIc.nombre} onChange={e => setNuevoIc({...nuevoIc, nombre: e.target.value})} style={{ backgroundColor: '#111827', border: '1px solid #374151', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }} />
              <input type="text" placeholder="Nomenclatura (ej. U3001)" value={nuevoIc.nomenclatura} onChange={e => setNuevoIc({...nuevoIc, nomenclatura: e.target.value})} style={{ backgroundColor: '#111827', border: '1px solid #374151', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="mfgId Sano (0x00)" value={nuevoIc.mfgIdSano} onChange={e => setNuevoIc({...nuevoIc, mfgIdSano: e.target.value})} style={{ backgroundColor: '#111827', border: '1px solid #374151', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }} />
                <input type="text" placeholder="prodId Sano (0x00)" value={nuevoIc.prodIdSano} onChange={e => setNuevoIc({...nuevoIc, prodIdSano: e.target.value})} style={{ backgroundColor: '#111827', border: '1px solid #374151', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }} />
              </div>
              <button onClick={handleAgregarIC} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={16} /> GUARDAR EN MODELO
              </button>
            </div>
          </div>
        )}

        {/* Lado Derecho/Principal: Lista de ICs */}
        <div>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
            <Database size={18} /> MAPA RFFE DEL DISPOSITIVO
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {rffeIcs.map(ic => {
              const coincide = ic.mfgIdActual === ic.mfgIdSano && ic.mfgIdActual !== '---';
              const error = ic.mfgIdActual !== ic.mfgIdSano && ic.mfgIdActual !== '---';

              return (
                <div
                  key={ic.id}
                  onClick={() => setIcSeleccionado(ic)}
                  style={{
                    backgroundColor: icSeleccionado?.id === ic.id ? '#1e293b' : '#1a1a1a',
                    border: '1px solid',
                    borderColor: coincide ? '#10b981' : (error ? '#ef4444' : '#333'),
                    padding: '12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    boxShadow: coincide ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 'bold', marginBottom: '4px' }}>{ic.nomenclatura}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ic.nombre}</div>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>ID: <span style={{ color: coincide ? '#10b981' : (error ? '#ef4444' : 'white'), fontFamily: 'monospace' }}>{ic.mfgIdActual}</span></div>
                    {modo === 'crear' && <Trash2 size={14} color="#ef4444" onClick={(e) => { e.stopPropagation(); eliminarIC(ic.id); }} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel de Detalles (Solo si hay selección) */}
          {icSeleccionado && (
            <div style={{ marginTop: '20px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#00ffff', display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={18}/> DETALLE DEL COMPONENTE</h4>
                <button onClick={() => setIcSeleccionado(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ backgroundColor: '#111827', padding: '10px', borderRadius: '8px', border: '1px solid #374151' }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '5px' }}>VALOR REFERENCIA (SANO)</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>MFG: <strong style={{ color: '#10b981' }}>{icSeleccionado.mfgIdSano}</strong></span>
                    <span>PROD: <strong style={{ color: '#10b981' }}>{icSeleccionado.prodIdSano}</strong></span>
                  </div>
                </div>
                <div style={{ backgroundColor: '#111827', padding: '10px', borderRadius: '8px', border: icSeleccionado.mfgIdActual === icSeleccionado.mfgIdSano ? '1px solid #10b981' : '1px solid #ef4444' }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '5px' }}>VALOR LEÍDO (ACTUAL)</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>MFG: <strong style={{ color: icSeleccionado.mfgIdActual === icSeleccionado.mfgIdSano ? '#10b981' : '#ef4444' }}>{icSeleccionado.mfgIdActual}</strong></span>
                    <span>PROD: <strong style={{ color: icSeleccionado.prodIdActual === icSeleccionado.prodIdSano ? '#10b981' : '#ef4444' }}>{icSeleccionado.prodIdActual}</strong></span>
                  </div>
                </div>
              </div>
              {icSeleccionado.mfgIdActual !== '---' && (
                <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', backgroundColor: icSeleccionado.mfgIdActual === icSeleccionado.mfgIdSano ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                  {icSeleccionado.mfgIdActual === icSeleccionado.mfgIdSano ? <CheckCircle2 color="#10b981" /> : <XCircle color="#ef4444" />}
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: icSeleccionado.mfgIdActual === icSeleccionado.mfgIdSano ? '#10b981' : '#ef4444' }}>
                    {icSeleccionado.mfgIdActual === icSeleccionado.mfgIdSano ? 'PROTOCOLO MIPI CORRECTO' : 'ERROR: IC NO RESPONDE O DATOS INCORRECTOS'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EscanerRFFE;
