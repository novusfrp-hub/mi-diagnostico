// components/BandejaPinesFPC.jsx
import React, { useState, useMemo } from 'react';
import {
  X, Layers, Zap, Check, CheckCircle2, Search, ArrowRight,
  Filter, HelpCircle, AlertCircle, RefreshCw, Sparkles, Tag
} from 'lucide-react';
import {
  normalizarNetName,
  obtenerValoresPinFpc,
  autoMatchFpcBoardview
} from '../utils/boardviewNetUtils';

export default function BandejaPinesFPC({
  abierto = false,
  onCerrar,
  conectoresFpc = [],
  fpcSeleccionadoId,
  onCambiarFpcSeleccionado,
  componentes = [],
  escala = 'diodo',
  destinoTransferencia = 'valorSano', // 'valorSano' | 'valorActual' | 'ambos'
  onCambiarDestinoTransferencia,
  pinFpcActivoParaVincular = null,
  onSeleccionarPinParaVincular,
  onAplicarAutoMatch,
  onHoverPin,
  onLeavePin
}) {
  const [busquedaPin, setBusquedaPin] = useState('');
  const [soloSinVincular, setSoloSinVincular] = useState(false);
  const [confirmandoAutoMatch, setConfirmandoAutoMatch] = useState(false);
  const [modalidadSobrescribir, setModalidadSobrescribir] = useState(false); // false = solo vacíos, true = sobrescribir

  // Conector actualmente seleccionado en la bandeja
  const conectorActivo = useMemo(() => {
    if (!conectoresFpc || conectoresFpc.length === 0) return null;
    return conectoresFpc.find(c => String(c.id) === String(fpcSeleccionadoId)) || conectoresFpc[0];
  }, [conectoresFpc, fpcSeleccionadoId]);

  // Mapa de pads de la placa para saber qué pines ya están vinculados o coinciden
  const estadoVinculacionPads = useMemo(() => {
    const mapaPadsPorPin = new Map(); // pinId -> Array de { compNombre, padId, netName }
    const mapaPadsPorNet = new Map(); // netNameNorm -> Array de { compNombre, padId, netName }

    componentes.forEach(comp => {
      comp.pads.forEach(pad => {
        const netNorm = normalizarNetName(pad.netName);
        if (netNorm && netNorm !== 'GND' && netNorm !== 'NC') {
          if (!mapaPadsPorNet.has(netNorm)) {
            mapaPadsPorNet.set(netNorm, []);
          }
          mapaPadsPorNet.get(netNorm).push({ compNombre: comp.nombre, padId: pad.id, netName: pad.netName });
        }

        if (pad.fpcRef && conectorActivo && String(pad.fpcRef.fpcId) === String(conectorActivo.id)) {
          const pinKey = String(pad.fpcRef.pinId);
          if (!mapaPadsPorPin.has(pinKey)) {
            mapaPadsPorPin.set(pinKey, []);
          }
          mapaPadsPorPin.get(pinKey).push({ compNombre: comp.nombre, padId: pad.id, netName: pad.netName });
        }
      });
    });

    return { mapaPadsPorPin, mapaPadsPorNet };
  }, [componentes, conectorActivo]);

  // Lista procesada de pines del conector activo
  const pinesConEstado = useMemo(() => {
    if (!conectorActivo || !conectorActivo.pines) return [];

    return conectorActivo.pines.map(pin => {
      const valores = obtenerValoresPinFpc(pin, escala);
      const pinIdStr = String(pin.id);
      const pinNomNorm = normalizarNetName(pin.nombre);

      const padsPorRef = estadoVinculacionPads.mapaPadsPorPin.get(pinIdStr) || [];
      const padsPorNet = (pinNomNorm && estadoVinculacionPads.mapaPadsPorNet.get(pinNomNorm)) || [];

      // Consolidar pads asociados evitando duplicados
      const padsAsociadosMap = new Map();
      [...padsPorRef, ...padsPorNet].forEach(p => {
        padsAsociadosMap.set(`${p.compNombre}_${p.padId}`, p);
      });
      const padsAsociados = Array.from(padsAsociadosMap.values());
      const estaVinculado = padsAsociados.length > 0;

      return {
        ...pin,
        ...valores,
        padsAsociados,
        estaVinculado
      };
    });
  }, [conectorActivo, escala, estadoVinculacionPads]);

  // Filtro de búsqueda y pendientes
  const pinesFiltrados = useMemo(() => {
    let res = pinesConEstado;
    if (soloSinVincular) {
      res = res.filter(p => !p.estaVinculado);
    }
    if (busquedaPin.trim()) {
      const q = busquedaPin.trim().toLowerCase();
      res = res.filter(p =>
        String(p.id).includes(q) ||
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        (p.valorSano && p.valorSano.toLowerCase().includes(q)) ||
        (p.valorActual && p.valorActual.toLowerCase().includes(q))
      );
    }
    return res;
  }, [pinesConEstado, soloSinVincular, busquedaPin]);

  // Resumen de auto-match previo para mostrar en el botón
  const resumenAutoMatch = useMemo(() => {
    if (!conectorActivo) return { coincidenciasCount: 0 };
    return autoMatchFpcBoardview({
      conectoresFpc,
      componentes,
      fpcId: conectorActivo.id,
      escala,
      destino: destinoTransferencia,
      soloVacios: true
    });
  }, [conectoresFpc, componentes, conectorActivo, escala, destinoTransferencia]);

  if (!abierto) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '380px',
        maxWidth: '90vw',
        backgroundColor: '#0c0f18',
        borderLeft: '1px solid #1f2937',
        boxShadow: '-8px 0 25px rgba(0,0,0,0.6)',
        zIndex: 120,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#e5e7eb',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* 1. CABECERA PRINCIPAL */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1f2937', backgroundColor: '#111827' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={17} color="#00ffff" />
            <strong style={{ fontSize: '0.85rem', color: '#fff' }}>Bandeja de Pines FPC</strong>
          </div>
          <button
            onClick={onCerrar}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '3px' }}
            title="Cerrar bandeja (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selector de Conector FPC */}
        {conectoresFpc.length > 0 ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select
              value={conectorActivo?.id || ''}
              onChange={(e) => onCambiarFpcSeleccionado && onCambiarFpcSeleccionado(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#090d16',
                color: '#38bdf8',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                outline: 'none'
              }}
            >
              {conectoresFpc.map(c => (
                <option key={c.id} value={c.id}>
                  {c.tipoOrigen === 'fpc_bateria' ? '🔋' : '🔌'} {c.nombre} ({c.pines?.length || 0} pines)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', padding: '6px', backgroundColor: '#1f2937', borderRadius: '4px' }}>
            No hay conectores FPC guardados en este modelo.
          </div>
        )}
      </div>

      {/* 2. SELECTOR DE DESTINO Y MODO AUTO-MATCH */}
      {conectorActivo && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #1f2937', backgroundColor: '#0f1422' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 'bold' }}>Destino de Transferencia:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'valorSano', label: 'Valor Sano' },
                { id: 'valorActual', label: 'Med. Actual' },
                { id: 'ambos', label: 'Ambos' }
              ].map(dest => (
                <button
                  key={dest.id}
                  onClick={() => onCambiarDestinoTransferencia && onCambiarDestinoTransferencia(dest.id)}
                  style={{
                    padding: '2px 7px',
                    borderRadius: '4px',
                    border: destinoTransferencia === dest.id ? '1px solid #3b82f6' : '1px solid #374151',
                    backgroundColor: destinoTransferencia === dest.id ? '#1e3a8a' : '#1f2937',
                    color: destinoTransferencia === dest.id ? '#93c5fd' : '#9ca3af',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    fontWeight: destinoTransferencia === dest.id ? 'bold' : 'normal'
                  }}
                >
                  {dest.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botón Auto-Match */}
          {!confirmandoAutoMatch ? (
            <button
              onClick={() => setConfirmandoAutoMatch(true)}
              style={{
                width: '100%',
                padding: '7px 10px',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #0284c7',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                marginTop: '6px'
              }}
              title="Vincular automáticamente pines FPC con pads que compartan el mismo Net Name"
            >
              <Zap size={14} color="#38bdf8" />
              ⚡ Enlazar Coincidencias ({resumenAutoMatch.coincidenciasCount} listas)
            </button>
          ) : (
            <div style={{ marginTop: '6px', padding: '8px', backgroundColor: '#131d2e', border: '1px solid #1e3a8a', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.72rem', color: '#93c5fd', marginBottom: '6px' }}>
                ¿Cómo deseas aplicar las <strong>{resumenAutoMatch.coincidenciasCount}</strong> coincidencias encontradas?
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <button
                  onClick={() => {
                    if (onAplicarAutoMatch) onAplicarAutoMatch({ soloVacios: true });
                    setConfirmandoAutoMatch(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Solo Vacíos (---)
                </button>
                <button
                  onClick={() => {
                    if (onAplicarAutoMatch) onAplicarAutoMatch({ soloVacios: false });
                    setConfirmandoAutoMatch(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Sobrescribir Todo
                </button>
              </div>
              <button
                onClick={() => setConfirmandoAutoMatch(false)}
                style={{ width: '100%', padding: '3px', background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.65rem', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. BARRA DE BUSQUEDA Y FILTROS DENTRO DE LA BANDEJA */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', backgroundColor: '#090d16', border: '1px solid #374151', borderRadius: '5px', padding: '3px 8px' }}>
          <Search size={13} color="#9ca3af" />
          <input
            type="text"
            placeholder="Filtrar por pin o nombre..."
            value={busquedaPin}
            onChange={(e) => setBusquedaPin(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '0.72rem',
              marginLeft: '6px'
            }}
          />
          {busquedaPin && (
            <button onClick={() => setBusquedaPin('')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>

        <button
          onClick={() => setSoloSinVincular(!soloSinVincular)}
          style={{
            padding: '4px 8px',
            backgroundColor: soloSinVincular ? '#0369a1' : '#1f2937',
            color: soloSinVincular ? '#fff' : '#9ca3af',
            border: '1px solid #374151',
            borderRadius: '5px',
            fontSize: '0.68rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
          title="Mostrar solo pines que aún no han sido ubicados en el Boardview"
        >
          {soloSinVincular ? 'Sin Vincular' : 'Todos'}
        </button>
      </div>

      {/* 4. MODO ESTAMPADO: INSTRUCCIONES */}
      <div style={{ padding: '6px 14px', backgroundColor: pinFpcActivoParaVincular ? '#042f2e' : '#080c14', borderBottom: '1px solid #1f2937' }}>
        <div style={{ fontSize: '0.68rem', color: pinFpcActivoParaVincular ? '#2dd4bf' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {pinFpcActivoParaVincular ? (
            <span>
              📍 <strong>Estampando Pin {pinFpcActivoParaVincular.id} ({pinFpcActivoParaVincular.nombre})</strong>. Haz clic en un pad de la placa para asignarlo.
            </span>
          ) : (
            <span>💡 <em>Toca un pin para activarlo y estamparlo directamente sobre un pad del Boardview.</em></span>
          )}
          {pinFpcActivoParaVincular && (
            <button
              onClick={() => onSeleccionarPinParaVincular && onSeleccionarPinParaVincular(null)}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 'bold' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* 5. LISTA DE PINES DISPONIBLES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
        {pinesFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.75rem', marginTop: '30px' }}>
            No se encontraron pines con los filtros seleccionados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pinesFiltrados.map(pin => {
              const esActivoParaEstampar = pinFpcActivoParaVincular && String(pinFpcActivoParaVincular.id) === String(pin.id);
              const valorAMostrar = destinoTransferencia === 'valorActual'
                ? pin.valorActual
                : (destinoTransferencia === 'ambos'
                    ? `${pin.valorSano !== '---' ? pin.valorSano : '---'} / ${pin.valorActual !== '---' ? pin.valorActual : '---'}`
                    : pin.valorSano);

              return (
                <div
                  key={pin.id}
                  onClick={() => {
                    if (esActivoParaEstampar) {
                      onSeleccionarPinParaVincular && onSeleccionarPinParaVincular(null);
                    } else {
                      onSeleccionarPinParaVincular && onSeleccionarPinParaVincular({
                        ...pin,
                        conectorId: conectorActivo.id,
                        conectorNombre: conectorActivo.nombre,
                        destinoTransferencia
                      });
                    }
                  }}
                  onMouseEnter={() => onHoverPin && onHoverPin(pin)}
                  onMouseLeave={() => onLeavePin && onLeavePin()}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: esActivoParaEstampar ? '#064e3b' : (pin.estaVinculado ? '#111827' : '#0c101a'),
                    border: esActivoParaEstampar
                      ? '1px solid #10b981'
                      : (pin.estaVinculado ? '1px solid #10b98144' : '1px solid #1f2937'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title="Haz clic para activar el estampado en la placa"
                >
                  {/* Pin ID y Nombre */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: pin.tipo === 'GND' ? '#374151' : (pin.tipo === 'NC' ? '#1e3a8a' : '#1e293b'),
                      color: pin.tipo === 'GND' ? '#fff' : '#38bdf8',
                      fontSize: '0.72rem',
                      fontWeight: 'bold'
                    }}>
                      {pin.id}
                    </span>

                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {pin.nombre}
                        {pin.estaVinculado && (
                          <span style={{ color: '#10b981', fontSize: '0.65rem' }} title={`Vinculado a ${pin.padsAsociados.length} pad(s)`}>
                            ✓ ({pin.padsAsociados.length})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
                        Tipo: {pin.tipo}
                      </div>
                    </div>
                  </div>

                  {/* Valor de Medición y Botón Estampar */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: valorAMostrar && valorAMostrar !== '---' ? '#10b981' : '#6b7280'
                    }}>
                      {valorAMostrar || '---'}
                    </div>
                    <span style={{
                      fontSize: '0.62rem',
                      color: esActivoParaEstampar ? '#34d399' : '#38bdf8',
                      textDecoration: 'underline'
                    }}>
                      {esActivoParaEstampar ? 'Listo para tocar pad' : 'Estampar'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. PIE DE BANDEJA */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid #1f2937', backgroundColor: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
          Pines vinculados: <strong style={{ color: '#10b981' }}>{pinesConEstado.filter(p => p.estaVinculado).length}</strong> de {pinesConEstado.length}
        </span>
        <button
          onClick={onCerrar}
          style={{
            padding: '4px 10px',
            backgroundColor: '#1f2937',
            color: '#e5e7eb',
            border: '1px solid #374151',
            borderRadius: '4px',
            fontSize: '0.72rem',
            cursor: 'pointer'
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
