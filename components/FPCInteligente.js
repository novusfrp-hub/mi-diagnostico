import React from 'react';

export default function FPCInteligente({ pines, setPines, pinActivo, setPinActivo, modo = 'diagnostico', escala = 'diodo', lecturaEnVivo }) {
  const mitad = Math.ceil(pines.length / 2); 
  const filaSup = pines.slice(0, mitad); 
  const filaInf = pines.slice(mitad);
  
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

  const renderPin = (pin, esArr, isExtremo) => (
    <div key={pin.id} onClick={() => setPinActivo(pin.id)} style={{ width: isExtremo ? '70px' : '45px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
      {esArr && <span style={{ fontSize: '0.55rem', color: 'gray', marginBottom: '2px' }}>{pin.id}</span>}
      <div style={{ width: '100%', height: '30px', backgroundColor: obtenerColorPin(pin), border: pinActivo === pin.id ? '2px solid #fff' : '1px solid #222', borderRadius: '4px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
         <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: pin.tipo === 'GND' || pin.tipo === 'NC' ? '#cbd5e1' : '#000', textShadow: pin.tipo !== 'GND' && pin.tipo !== 'NC' ? 'none' : '1px 1px 2px #000' }}>{modo === 'crear' ? formNum(pin.valorSano, pin.tipo) : formNum(pin.valorActual, pin.tipo)}</span>
      </div>
      {!esArr && <span style={{ fontSize: '0.55rem', color: 'gray', marginTop: '2px' }}>{pin.id}</span>}
    </div>
  );

  return (
    <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '15px', border: '2px solid #374151', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#000', padding: '10px', borderRadius: '10px', minWidth: 'max-content' }}>
          <div style={{ display: 'flex', gap: '3px', minWidth: 'max-content' }}>{filaSup.map((pin, i) => renderPin(pin, true, i === 0 || i === filaSup.length - 1))}</div>
          <div style={{ height: '8px', backgroundColor: '#1a1a1a', borderRadius: '2px', width: '100%', minWidth: 'max-content' }} />
          <div style={{ display: 'flex', gap: '3px', minWidth: 'max-content' }}>{filaInf.map((pin, i) => renderPin(pin, false, i === 0 || i === filaInf.length - 1))}</div>
        </div>
      </div>
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '10px', borderLeft: `4px solid ${obtenerColorPin(pines.find(p => p.id === pinActivo) || {})}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ flex: '1 1 auto' }}>
              <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '1.1rem' }}>PIN {pinActivo}</span>
              {modo === 'crear' ? ( 
                <div style={{display:'flex', gap:'8px', marginTop:'8px', flexWrap:'wrap', alignItems: 'center'}}>
                    <input value={pines.find(p => p.id === pinActivo)?.nombre || ''} onChange={(e) => setPines(prev => prev.map(p => p.id === pinActivo ? { ...p, nombre: e.target.value.replace(/ /g, '_') } : p))} placeholder="Nombre_de_linea" style={{ background: '#000', color: 'white', border: '1px solid #333', padding: '6px 10px', borderRadius: '5px', width: '140px', outline:'none', fontSize:'0.85rem' }} />
                    <select value={pines.find(p => p.id === pinActivo)?.tipo || 'DATA'} onChange={(e) => {
                        const val = e.target.value;
                        setPines(prev => prev.map(p => p.id === pinActivo ? { ...p, tipo: val, ...(val === 'GND' ? {nombre: 'GND'} : val === 'NC' ? {nombre: 'NC'} : {}) } : p));
                    }} style={{ background: '#1f2937', color: 'white', border: '1px solid #333', padding: '6px 10px', borderRadius: '5px', outline:'none', fontSize:'0.85rem', cursor:'pointer' }}>
                        <option value="DATA">DATA</option><option value="VCC">VCC</option><option value="GND">GND</option><option value="NC">NC</option>
                    </select>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <span style={{color: 'gray', fontSize: '0.7rem', display: 'flex', alignItems: 'center', marginRight: '5px'}}>Insertar:</span>
                        <button onClick={() => {
                            setPines(prev => {
                                const idx = prev.findIndex(p => p.id === pinActivo);
                                const nuevoPin = { id: Date.now(), nombre: `Linea_${prev.length + 1}`, valorSano: '---', valorActual: '---', tipo: 'DATA' };
                                const nuevosPines = [...prev];
                                nuevosPines.splice(idx + 1, 0, nuevoPin);
                                return nuevosPines.map((p, i) => ({ ...p, id: i + 1 }));
                            });
                        }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>+ DATA</button>
                        <button onClick={() => {
                            setPines(prev => {
                                const idx = prev.findIndex(p => p.id === pinActivo);
                                const nuevoPin = { id: Date.now(), nombre: `GND`, valorSano: '---', valorActual: '---', tipo: 'GND' };
                                const nuevosPines = [...prev];
                                nuevosPines.splice(idx + 1, 0, nuevoPin);
                                return nuevosPines.map((p, i) => ({ ...p, id: i + 1 }));
                            });
                        }} style={{ background: '#4b5563', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>+ GND</button>
                        <button onClick={() => {
                            setPines(prev => {
                                const idx = prev.findIndex(p => p.id === pinActivo);
                                const nuevoPin = { id: Date.now(), nombre: `VCC`, valorSano: '---', valorActual: '---', tipo: 'VCC' };
                                const nuevosPines = [...prev];
                                nuevosPines.splice(idx + 1, 0, nuevoPin);
                                return nuevosPines.map((p, i) => ({ ...p, id: i + 1 }));
                            });
                        }} style={{ background: '#7f1d1d', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>+ VCC</button>
                        <button onClick={() => {
                            setPines(prev => {
                                const idx = prev.findIndex(p => p.id === pinActivo);
                                const nuevoPin = { id: Date.now(), nombre: `NC`, valorSano: '---', valorActual: '---', tipo: 'NC' };
                                const nuevosPines = [...prev];
                                nuevosPines.splice(idx + 1, 0, nuevoPin);
                                return nuevosPines.map((p, i) => ({ ...p, id: i + 1 }));
                            });
                        }} style={{ background: '#1e3a8a', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>+ NC</button>
                        
                        <button onClick={() => {
                            if (pines.length <= 1) return alert("No puedes eliminar el último pin.");
                            if (!window.confirm("¿Seguro de eliminar esta línea?")) return;
                            setPines(prev => {
                                const nuevosPines = prev.filter(p => p.id !== pinActivo);
                                return nuevosPines.map((p, i) => ({ ...p, id: i + 1 }));
                            });
                            setPinActivo(1);
                        }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '5px' }}>- Quitar</button>
                    </div>
                </div>
              ) : ( 
                  <div style={{marginTop:'5px'}}>
                    <span style={{ display: 'inline-block', color: '#fff', fontSize: '0.85rem' }}>{pines.find(p => p.id === pinActivo)?.nombre || 'Línea sin nombre'}</span>
                    <span style={{ marginLeft:'8px', fontSize:'0.7rem', padding:'2px 6px', borderRadius:'4px', background:'#374151', color:'white', fontWeight:'bold' }}>{pines.find(p => p.id === pinActivo)?.tipo || 'DATA'}</span>
                  </div>
              )}
          </div>
          <div style={{ textAlign: 'right', flex: '0 1 auto' }}>
              <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block' }}>Valor Sano: <strong style={{color:'#fff'}}>{pines.find(p => p.id === pinActivo)?.valorSano || '---'} {escala==='diodo'?'V':'uA'}</strong></span>
              <span style={{ color: 'gray', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>Actual: <strong style={{color: '#fff', fontSize: '1.3rem'}}>{(pinActivo === pines.find(p => p.id === pinActivo)?.id && lecturaEnVivo !== '----') ? lecturaEnVivo : (pines.find(p => p.id === pinActivo)?.valorActual || '---')} {escala==='diodo'?'V':'uA'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}