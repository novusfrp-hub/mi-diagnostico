import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldAlert, LogOut, MessageCircle, RefreshCw, Cpu } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function ModalEstadoUsuario({ perfil, onRecargarPerfil }) {
  if (!perfil) return null;

  const esPendiente = perfil.estado === 'pendiente';
  const esBloqueado = perfil.estado === 'bloqueado';

  if (!esPendiente && !esBloqueado) return null;

  const handleCerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const mensajeWhatsApp = encodeURIComponent(
    `Hola Marshall Cell! Acabo de registrarme en Marshall Hardware Suite™ (MHS Pro) con el correo ${perfil.email} del taller "${perfil.taller || 'Taller'}". Solicito la activación de mi cuenta técnica.`
  );

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      backgroundColor: 'rgba(10, 15, 29, 0.94)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#111827',
          border: esPendiente ? '1px solid #f59e0b' : '1px solid #ef4444',
          borderRadius: '1.5rem',
          padding: '28px',
          boxShadow: esPendiente ? '0 0 40px rgba(245, 158, 11, 0.2)' : '0 0 40px rgba(239, 68, 68, 0.2)',
          color: '#f3f4f6',
          textAlign: 'center'
        }}
      >
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          backgroundColor: esPendiente ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: esPendiente ? '#f59e0b' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          border: esPendiente ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)'
        }}>
          {esPendiente ? <Clock size={32} /> : <ShieldAlert size={32} />}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', backgroundColor: '#1f2937', marginBottom: '10px' }}>
          <Cpu size={14} color="#8b5cf6" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa' }}>
            MARSHALL HARDWARE SUITE™
          </span>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 10px 0', color: '#ffffff' }}>
          {esPendiente ? 'Cuenta en Espera de Activación' : 'Acceso Suspendido'}
        </h2>

        <p style={{ fontSize: '0.86rem', color: '#9ca3af', lineHeight: 1.6, margin: '0 0 20px 0' }}>
          {esPendiente ? (
            <>
              Hola <strong style={{ color: '#ffffff' }}>{perfil.nombre || 'Técnico'}</strong>. Tu solicitud de registro para el taller <strong style={{ color: '#ffffff' }}>{perfil.taller || 'Laboratorio'}</strong> ha sido recibida y se encuentra pendiente de aprobación por <strong>Marshall Cell</strong>.
            </>
          ) : (
            <>
              El acceso para esta cuenta ha sido temporalmente restringido. Para reactivación, comunícate con el administrador.
            </>
          )}
        </p>

        <div style={{
          backgroundColor: '#0d131f',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #1f2937',
          textAlign: 'left',
          fontSize: '0.8rem',
          color: '#cbd5e1',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div><strong>Correo:</strong> {perfil.email}</div>
          {perfil.taller && <div><strong>Taller:</strong> {perfil.taller}</div>}
          <div><strong>Estado:</strong> {esPendiente ? '🟡 Pendiente de activación' : '🔴 Bloqueado'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {esPendiente && (
            <a
              href={`https://wa.me/51987654321?text=${mensajeWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: '#25d366',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
              }}
            >
              <MessageCircle size={18} />
              <span>Contactar a Marshall Cell por WhatsApp</span>
            </a>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onRecargarPerfil}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
              <span>Verificar Activación</span>
            </button>

            <button
              onClick={handleCerrarSesion}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
