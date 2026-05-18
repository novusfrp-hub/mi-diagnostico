import React, { forwardRef, useState } from 'react';
import { ClipboardList, Zap, Usb, Cpu, Camera, AlertTriangle, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';

const ESTADOS_COMPORTAMIENTO_DESCRIPCION = {
  'Estático': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  'Cíclico': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  'Corto total': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  'Fuga inicial': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  'Congelado': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  'Sube y cae': { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
};

const ESTADOS_COMPONENTE_COLOR = {
  'Corto': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'CORTO' },
  'Fuga': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', label: 'FUGA' },
  'Abierto': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'ABIERTO' },
  'Daño Físico': { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', label: 'DAÑO FÍSICO' }
};

const TIPO_IMAGEN_LABEL = {
  'placa': { icon: '📸', label: 'Placa' },
  'esquema': { icon: '🗺️', label: 'Esquema' },
  'solucion': { icon: '✅', label: 'Solución' }
};

/**
 * VisorReporteAvanzado
 * Muestra TODOS los campos de un caso de forma ordenada y elegante.
 * Recibe `caso` (objeto completo) y `ref` para captura de imagen.
 */
const VisorReporteAvanzado = forwardRef(function VisorReporteAvanzado({ caso }, ref) {
  const [imgAmpliada, setImgAmpliada] = useState(null);

  if (!caso) return null;

  const consumoUsb = caso.consumoUsb || {};
  const consumoFuente = caso.consumoFuente || {};
  const lineas = caso.lineasAfectadas || [];
  const tieneConsumos = consumoUsb.voltaje || consumoUsb.corriente || consumoUsb.comportamiento ||
    consumoUsb.conBateria || consumoUsb.sinBateria ||
    consumoFuente.inicial || consumoFuente.postPower || consumoFuente.comportamiento;

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: '#111827',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '28px',
        borderRadius: '16px',
        maxWidth: '800px',
        margin: '0 auto',
        border: '1px solid #374151'
      }}
    >
      {/* --- HEADER --- */}
      <div style={{
        textAlign: 'center',
        borderBottom: '2px solid #0058bc',
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#0058bc', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: 1 }}>
          MARSHALL CELL
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: 0 }}>
          Reporte Técnico de Diagnóstico
        </p>
      </div>

      {/* --- DATOS GENERALES --- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <MiniCaja label="FECHA" valor={new Date(caso.fecha).toLocaleDateString()} />
        <MiniCaja label="ID CASO" valor={`#${(caso.id || '').substring(0, 8).toUpperCase()}`} />
        <MiniCaja label="MARCA" valor={caso.marca} />
        <MiniCaja label="MODELO" valor={caso.modelo} />
        <MiniCaja label="TÉCNICO" valor={caso.tecnico || 'Marshall Cell'} />
      </div>

      {/* --- SÍNTOMAS --- */}
      <Seccion icon={<AlertTriangle size={16} color="#ef4444" />} titulo="SÍNTOMAS" color="#ef4444">
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {caso.sintomas}
        </p>
      </Seccion>

      {/* --- PROTOCOLO --- */}
      <Seccion icon={<ClipboardList size={16} color="#0058bc" />} titulo="PROTOCOLO / DIAGNÓSTICO" color="#0058bc">
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {caso.protocolo || 'Pendiente de evaluación técnica profunda.'}
        </p>
      </Seccion>

      {/* --- IMAGEN PRINCIPAL --- */}
      {caso.imgUrl && (
        <Seccion icon={<Camera size={16} color="#8b5cf6" />} titulo="EVIDENCIA PRINCIPAL" color="#8b5cf6">
          <div
            onClick={() => setImgAmpliada(caso.imgUrl)}
            style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#000', borderRadius: '8px', padding: '10px', cursor: 'zoom-in' }}
          >
            <img src={caso.imgUrl} alt="Evidencia" referrerPolicy="no-referrer"
              style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </Seccion>
      )}

      {/* --- CONSUMOS --- */}
      {tieneConsumos && (
        <Seccion icon={<Zap size={16} color="#f59e0b" />} titulo="MEDICIONES DE CONSUMO" color="#f59e0b">
          {/* USB */}
          {(consumoUsb.voltaje || consumoUsb.corriente || consumoUsb.comportamiento) && (
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '10px'
            }}>
              <h5 style={{ color: '#3b82f6', margin: '0 0 10px 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Usb size={14} /> Consumo USB
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {consumoUsb.voltaje && <MiniCaja label="VOLTAJE" valor={consumoUsb.voltaje + 'V'} />}
                {consumoUsb.corriente && <MiniCaja label="CORRIENTE" valor={consumoUsb.corriente + 'A'} />}
                {consumoUsb.comportamiento && (
                  <BadgeEstado texto={consumoUsb.comportamiento} mapa={ESTADOS_COMPORTAMIENTO_DESCRIPCION} />
                )}
                {consumoUsb.conBateria && <MiniCaja label="CON BATERÍA" valor={consumoUsb.conBateria + 'A'} />}
                {consumoUsb.sinBateria && <MiniCaja label="SIN BATERÍA" valor={consumoUsb.sinBateria + 'A'} />}
              </div>
            </div>
          )}
          {/* Fuente */}
          {(consumoFuente.inicial || consumoFuente.postPower || consumoFuente.comportamiento) && (
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '10px',
              padding: '14px'
            }}>
              <h5 style={{ color: '#f97316', margin: '0 0 10px 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> Consumo Fuente
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {consumoFuente.inicial && <MiniCaja label="INICIAL" valor={consumoFuente.inicial + 'A'} />}
                {consumoFuente.postPower && <MiniCaja label="POST-POWER" valor={consumoFuente.postPower + 'A'} />}
                {consumoFuente.comportamiento && (
                  <BadgeEstado texto={consumoFuente.comportamiento} mapa={ESTADOS_COMPORTAMIENTO_DESCRIPCION} />
                )}
              </div>
            </div>
          )}
        </Seccion>
      )}

      {/* --- TOPOLOGÍA --- */}
      {lineas.length > 0 && (
        <Seccion icon={<Cpu size={16} color="#10b981" />} titulo="TOPOLOGÍA AFECTADA" color="#10b981">
          {lineas.map((linea, iLinea) => (
            <div key={linea.id || iLinea} style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '12px'
            }}>
              {/* Nombre de línea */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid #374151'
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: '#3b82f6', flexShrink: 0
                }} />
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#3b82f6' }}>
                  {linea.nombre || `Línea #${iLinea + 1}`}
                </span>
              </div>

              {/* Componentes */}
              {(linea.componentes || []).length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                    COMPONENTES AFECTADOS
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(linea.componentes || []).map((comp, iComp) => {
                      const estadoStyle = ESTADOS_COMPONENTE_COLOR[comp.estado] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
                      return (
                        <div key={comp.id || iComp} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#0a0a0a',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '0.75rem'
                        }}>
                          <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{comp.tipo}</span>
                          <span style={{ color: 'white' }}>{comp.nomenclatura || '?'}</span>
                          <span style={{
                            color: estadoStyle.color,
                            backgroundColor: estadoStyle.bg,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold'
                          }}>
                            {estadoStyle.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Imágenes de la línea */}
              {(linea.imagenes || []).length > 0 && (
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                    IMÁGENES
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(linea.imagenes || []).map((img, iImg) => {
                      const tipoInfo = TIPO_IMAGEN_LABEL[img.tipo] || TIPO_IMAGEN_LABEL.placa;
                      return img.url ? (
                        <div key={img.id || iImg}
                          onClick={() => setImgAmpliada(img.url)}
                          style={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            width: '200px',
                            cursor: 'zoom-in'
                          }}
                        >
                          <img src={img.url} alt={tipoInfo.label} referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '150px', objectFit: 'contain', backgroundColor: '#000' }} />
                          <div style={{ padding: '4px 6px', fontSize: '0.6rem', color: '#9ca3af', textAlign: 'center' }}>
                            {tipoInfo.icon} {tipoInfo.label}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </Seccion>
      )}

      {/* --- FOOTER --- */}
      <div style={{
        marginTop: '24px',
        paddingTop: '14px',
        borderTop: '1px solid #374151',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: '#6b7280'
      }}>
        Marshall Cell — Laboratorio de Microelectrónica, Oropesa, Cusco
      </div>

      {/* --- MODAL ZOOM (PANTALLA COMPLETA) --- */}
      {imgAmpliada && (
        <div
          className="no-print"
          onClick={() => setImgAmpliada(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}
        >
          <button
            onClick={() => setImgAmpliada(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '10px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
          >
            <X size={24} />
          </button>

          <img
            src={imgAmpliada}
            alt="Zoom"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '95vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 0 30px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}
    </div>
  );
});

// --- Componentes internos ---

function MiniCaja({ label, valor }) {
  if (!valor) return null;
  return (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '8px',
      padding: '10px 12px'
    }}>
      <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '3px' }}>
        {label}
      </span>
      <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
        {valor}
      </span>
    </div>
  );
}

function Seccion({ icon, titulo, color, children }) {
  return (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: `1px solid ${color}22`
      }}>
        {icon}
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: color, letterSpacing: 0.5 }}>
          {titulo}
        </span>
      </div>
      {children}
    </div>
  );
}

function BadgeEstado({ texto, mapa }) {
  const info = mapa[texto] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
  return (
    <div style={{
      backgroundColor: info.bg,
      border: `1px solid ${info.color}44`,
      borderRadius: '6px',
      padding: '6px 10px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      color: info.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {texto}
    </div>
  );
}

export default VisorReporteAvanzado;
