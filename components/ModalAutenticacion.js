import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Mail, User, Phone, ShieldCheck, Eye, EyeOff, 
  CheckCircle2, AlertTriangle, X, Cpu, ArrowRight, RefreshCw, KeyRound
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function ModalAutenticacion({ visible, onCerrar, onLoginExitoso }) {
  const [tab, setTab] = useState('login'); // 'login' | 'registro' | 'recuperar'
  
  // Estados de formularios
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nombre, setNombre] = useState('');
  const [taller, setTaller] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // UI estados
  const [mostrarPass, setMostrarPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  if (!visible) return null;

  const limpiarAlertas = () => {
    setErrorMsg('');
    setExitoMsg('');
  };

  const cambiarTab = (nuevaTab) => {
    limpiarAlertas();
    setTab(nuevaTab);
  };

  const traducirErrorFirebase = (error) => {
    const code = error?.code || error?.message || '';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (code.includes('email-already-in-use')) {
      return 'Este correo ya se encuentra registrado. Intenta iniciar sesión.';
    }
    if (code.includes('weak-password')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (code.includes('invalid-email')) {
      return 'El formato de correo no es válido.';
    }
    if (code.includes('too-many-requests')) {
      return 'Demasiados intentos fallidos. Espera unos minutos o recupera tu contraseña.';
    }
    return error?.message || 'Ocurrió un error inesperado al procesar la solicitud.';
  };

  // 1. INICIAR SESIÓN
  const handleLogin = async (e) => {
    e.preventDefault();
    limpiarAlertas();

    if (!email.trim() || !password) {
      setErrorMsg('Por favor completa tu correo y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      // Verificar si existe perfil en Firestore
      const userDocRef = doc(db, 'usuarios', cred.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let perfil = null;
      if (userDocSnap.exists()) {
        perfil = userDocSnap.data();
      }

      setExitoMsg('¡Acceso concedido! Cargando perfil...');
      setTimeout(() => {
        if (onLoginExitoso) onLoginExitoso(cred.user, perfil);
        if (onCerrar) onCerrar();
      }, 500);
    } catch (err) {
      setErrorMsg(traducirErrorFirebase(err));
    } finally {
      setCargando(false);
    }
  };

  // 2. REGISTRO DE CUENTA
  const handleRegistro = async (e) => {
    e.preventDefault();
    limpiarAlertas();

    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!taller.trim()) {
      setErrorMsg('Indica el nombre de tu taller o laboratorio.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg('Completa tu correo y contraseña.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      // Crear usuario en Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      // Crear documento en colección 'usuarios'
      const datosPerfil = {
        uid: uid,
        nombre: nombre.trim(),
        taller: taller.trim(),
        telefono: telefono.trim(),
        email: email.trim().toLowerCase(),
        rol: 'tecnico',            // Rol predeterminado inicial
        estado: 'pendiente',       // Requiere activación de Marshall Cell
        fechaRegistro: new Date().toISOString(),
        ultimoAcceso: new Date().toISOString()
      };

      await setDoc(doc(db, 'usuarios', uid), datosPerfil);

      // Despachar notificación a Telegram
      try {
        await fetch('/api/notificar-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: datosPerfil.nombre,
            email: datosPerfil.email,
            taller: datosPerfil.taller,
            telefono: datosPerfil.telefono,
            uid: uid
          })
        });
      } catch (telErr) {
        console.warn('No se pudo enviar notificación telegram:', telErr);
      }

      setExitoMsg('¡Registro completado! Tu solicitud fue enviada a Marshall Cell para activación.');
      setTimeout(() => {
        if (onLoginExitoso) onLoginExitoso(cred.user, datosPerfil);
        if (onCerrar) onCerrar();
      }, 1800);
    } catch (err) {
      setErrorMsg(traducirErrorFirebase(err));
    } finally {
      setCargando(false);
    }
  };

  // 3. RECUPERAR CONTRASEÑA
  const handleRecuperar = async (e) => {
    e.preventDefault();
    limpiarAlertas();

    if (!email.trim()) {
      setErrorMsg('Ingresa el correo electrónico asociado a tu cuenta.');
      return;
    }

    setCargando(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setExitoMsg('Te hemos enviado un correo con el enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.');
    } catch (err) {
      setErrorMsg(traducirErrorFirebase(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#111827',
          border: '1px solid #374151',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(139, 92, 246, 0.15)',
          overflow: 'hidden',
          color: '#f3f4f6'
        }}
      >
        {/* Cabecera del Modal */}
        <div style={{
          padding: '20px 24px 16px 24px',
          borderBottom: '1px solid #1f2937',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(17, 24, 39, 0) 100%)',
          position: 'relative'
        }}>
          <button
            onClick={onCerrar}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
            }}>
              <Cpu size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.04em', color: '#ffffff' }}>
                MARSHALL HARDWARE SUITE™
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600, letterSpacing: '0.05em' }}>
                [ MHS PRO ] • CONTROL DE ACCESO RBAC
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #1f2937',
          backgroundColor: '#0d131f'
        }}>
          <button
            onClick={() => cambiarTab('login')}
            style={{
              flex: 1,
              padding: '12px 6px',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'login' ? '2px solid #8b5cf6' : '2px solid transparent',
              color: tab === 'login' ? '#ffffff' : '#9ca3af',
              fontWeight: tab === 'login' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => cambiarTab('registro')}
            style={{
              flex: 1,
              padding: '12px 6px',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'registro' ? '2px solid #8b5cf6' : '2px solid transparent',
              color: tab === 'registro' ? '#ffffff' : '#9ca3af',
              fontWeight: tab === 'registro' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Registrarse
          </button>
          <button
            onClick={() => cambiarTab('recuperar')}
            style={{
              flex: 1,
              padding: '12px 6px',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'recuperar' ? '2px solid #8b5cf6' : '2px solid transparent',
              color: tab === 'recuperar' ? '#ffffff' : '#9ca3af',
              fontWeight: tab === 'recuperar' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Recuperar
          </button>
        </div>

        {/* Mensajes de Estado */}
        <div style={{ padding: '0 24px' }}>
          {errorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {exitoMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{exitoMsg}</span>
            </div>
          )}
        </div>

        {/* Contenido de Cada Pestaña */}
        <div style={{ padding: '20px 24px 24px 24px' }}>
          {/* 1. LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>
                  CORREO ELECTRÓNICO
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tecnico@laboratorio.com"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
                    CONTRASEÑA
                  </label>
                  <button
                    type="button"
                    onClick={() => cambiarTab('recuperar')}
                    style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type={mostrarPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPass(!mostrarPass)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                  transition: 'background 0.2s ease'
                }}
              >
                {cargando ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Ingresar a MHS Pro</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: '#9ca3af' }}>
                ¿No tienes cuenta de técnico?{' '}
                <button
                  type="button"
                  onClick={() => cambiarTab('registro')}
                  style={{ background: 'none', border: 'none', color: '#06b6d4', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Regístrate aquí
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTRO */}
          {tab === 'registro' && (
            <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                  NOMBRE Y APELLIDO
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Carlos Gómez"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                    TALLER / LAB
                  </label>
                  <input
                    type="text"
                    value={taller}
                    onChange={(e) => setTaller(e.target.value)}
                    placeholder="Ej. Fix Mobile"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                    WHATSAPP / TEL
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+51 987 654 321"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                  CORREO ELECTRÓNICO
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@taller.com"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                    CONTRASEÑA
                  </label>
                  <input
                    type={mostrarPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                    CONFIRMAR
                  </label>
                  <input
                    type={mostrarPass ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Repetir clave"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                <input
                  type="checkbox"
                  id="mostrarPassReg"
                  checked={mostrarPass}
                  onChange={(e) => setMostrarPass(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="mostrarPassReg" style={{ fontSize: '0.76rem', color: '#9ca3af', cursor: 'pointer' }}>
                  Mostrar contraseñas
                </label>
              </div>

              <button
                type="submit"
                disabled={cargando}
                style={{
                  marginTop: '6px',
                  padding: '11px',
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                  transition: 'background 0.2s ease'
                }}
              >
                {cargando ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Registrando técnico...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    <span>Solicitar Registro Técnico</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9ca3af' }}>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => cambiarTab('login')}
                  style={{ background: 'none', border: 'none', color: '#8b5cf6', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Inicia sesión aquí
                </button>
              </div>
            </form>
          )}

          {/* 3. RECUPERAR CONTRASEÑA */}
          {tab === 'recuperar' && (
            <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5 }}>
                Ingresa el correo electrónico con el que te registraste. Te enviaremos un enlace oficial de Firebase para restablecer tu contraseña.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>
                  CORREO ELECTRÓNICO
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tecnico@laboratorio.com"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                  transition: 'background 0.2s ease'
                }}
              >
                {cargando ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Enviando correo...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={18} />
                    <span>Restablecer Contraseña</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: '#9ca3af' }}>
                <button
                  type="button"
                  onClick={() => cambiarTab('login')}
                  style={{ background: 'none', border: 'none', color: '#a78bfa', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
