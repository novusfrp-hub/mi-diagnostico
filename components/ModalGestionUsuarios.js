import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ShieldCheck, CheckCircle2, XCircle, Search, RefreshCw, 
  X, AlertTriangle, Building2, Mail, Phone, Clock, UserCheck, ShieldAlert,
  UserPlus, Plus, Key, Lock, Copy, Check, Send, Sparkles
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from '../firebase';

export default function ModalGestionUsuarios({ visible, onCerrar, usuarioActualUid }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');

  // Estados para formulario "Crear Nuevo Usuario Directamente"
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTaller, setNuevoTaller] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState('tecnico'); // 'tecnico' | 'editor' | 'super_admin'
  const [creandoUser, setCreandoUser] = useState(false);
  const [errorNuevoUser, setErrorNuevoUser] = useState('');
  const [usuarioRecienCreado, setUsuarioRecienCreado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, 'usuarios'));
      const lista = [];
      snap.forEach(d => {
        lista.push({ id: d.id, ...d.data() });
      });
      // Ordenar: pendientes primero, luego por fecha descendente
      lista.sort((a, b) => {
        if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
        if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1;
        return new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0);
      });
      setUsuarios(lista);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (visible) {
      cargarUsuarios();
      setUsuarioRecienCreado(null);
    }
  }, [visible]);

  if (!visible) return null;

  const notificar = (msg) => {
    setMensajeAccion(msg);
    setTimeout(() => setMensajeAccion(''), 3500);
  };

  const cambiarEstado = async (uid, nuevoEstado) => {
    try {
      await updateDoc(doc(db, 'usuarios', uid), { estado: nuevoEstado });
      setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, estado: nuevoEstado } : u));
      notificar(`✅ Estado actualizado a: ${nuevoEstado.toUpperCase()}`);
    } catch (err) {
      notificar('❌ Error al actualizar estado');
    }
  };

  const cambiarRol = async (uid, nuevoRol) => {
    try {
      await updateDoc(doc(db, 'usuarios', uid), { rol: nuevoRol });
      setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, rol: nuevoRol } : u));
      notificar(`✅ Rol actualizado a: ${nuevoRol.toUpperCase()}`);
    } catch (err) {
      notificar('❌ Error al actualizar rol');
    }
  };

  const eliminarUsuario = async (uid, email) => {
    if (uid === usuarioActualUid) {
      alert('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el registro de ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'usuarios', uid));
        setUsuarios(prev => prev.filter(u => u.id !== uid));
        notificar('🗑️ Usuario eliminado de la base de datos.');
      } catch (err) {
        notificar('❌ Error al eliminar');
      }
    }
  };

  // Creación directa de nuevo usuario con instancia secundaria de Firebase
  const handleCrearUsuarioDirecto = async (e) => {
    e.preventDefault();
    setErrorNuevoUser('');

    if (!nuevoNombre.trim()) {
      setErrorNuevoUser('Ingresa el nombre del técnico.');
      return;
    }
    if (!nuevoEmail.trim() || !nuevoPassword) {
      setErrorNuevoUser('Ingresa correo y contraseña.');
      return;
    }
    if (nuevoPassword.length < 6) {
      setErrorNuevoUser('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreandoUser(true);
    try {
      // Instancia secundaria para NO desconectar la sesión actual del Super Admin
      const secondaryAppName = 'MHSProSecondaryCreator';
      const secondaryApp = getApps().find(a => a.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const cred = await createUserWithEmailAndPassword(secondaryAuth, nuevoEmail.trim(), nuevoPassword);
      await signOut(secondaryAuth);

      const nuevoPerfil = {
        uid: cred.user.uid,
        nombre: nuevoNombre.trim(),
        taller: nuevoTaller.trim() || 'Taller Técnico',
        telefono: nuevoTelefono.trim() || '',
        email: nuevoEmail.trim().toLowerCase(),
        rol: nuevoRol,
        estado: 'activo', // Activo de inmediato porque lo crea el Super Admin
        creadoPor: 'super_admin_directo',
        fechaRegistro: new Date().toISOString()
      };

      await setDoc(doc(db, 'usuarios', cred.user.uid), nuevoPerfil);

      setUsuarioRecienCreado({
        ...nuevoPerfil,
        password: nuevoPassword
      });

      // Limpiar campos
      setNuevoNombre('');
      setNuevoTaller('');
      setNuevoTelefono('');
      setNuevoEmail('');
      setNuevoPassword('');
      setNuevoRol('tecnico');
      setMostrarFormNuevo(false);

      await cargarUsuarios();
      notificar(`✅ ¡Técnico ${nuevoPerfil.nombre} creado con rol ${nuevoPerfil.rol.toUpperCase()}!`);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorNuevoUser('Este correo ya está registrado en el sistema.');
      } else {
        setErrorNuevoUser(err.message || 'Error al crear la cuenta.');
      }
    } finally {
      setCreandoUser(false);
    }
  };

  const copiarCredenciales = (u) => {
    const texto = `📱 *MARSHALL HARDWARE SUITE™ (MHS PRO)*\n\nHola ${u.nombre}, tu cuenta ha sido creada:\n📧 *Correo:* ${u.email}\n🔑 *Contraseña:* ${u.password}\n🛡️ *Rol:* ${u.rol.toUpperCase()}\n\n🔗 Acceso: ${window.location.origin}`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const q = filtro.toLowerCase();
    return (
      (u.nombre || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.taller || '').toLowerCase().includes(q) ||
      (u.rol || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          width: '100%',
          maxWidth: '940px',
          height: '88vh',
          backgroundColor: '#111827',
          border: '1px solid #374151',
          borderRadius: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.2)',
          color: '#f3f4f6'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.12) 0%, rgba(17, 24, 39, 0) 100%)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
            }}>
              <Users size={20} color="#000000" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
                PANEL SUPER ADMIN • GESTIÓN DE USUARIOS
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600 }}>
                Marshall Hardware Suite™ (MHS Pro) • Control de Accesos y Roles
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setMostrarFormNuevo(!mostrarFormNuevo);
                setErrorNuevoUser('');
              }}
              style={{
                background: mostrarFormNuevo ? '#374151' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
              }}
            >
              <UserPlus size={15} />
              <span>{mostrarFormNuevo ? 'Cerrar Formulario' : '+ Crear Usuario'}</span>
            </button>

            <button
              onClick={cargarUsuarios}
              style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#9ca3af',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Recargar usuarios"
            >
              <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={onCerrar}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Notificación de Usuario Recién Creado con Botón para Compartir */}
        {usuarioRecienCreado && (
          <div style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span>
                ¡Cuenta creada para <strong>{usuarioRecienCreado.nombre}</strong>! Correo: <code>{usuarioRecienCreado.email}</code> | Clave: <code>{usuarioRecienCreado.password}</code> | Rol: <strong>{usuarioRecienCreado.rol.toUpperCase()}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => copiarCredenciales(usuarioRecienCreado)}
                style={{
                  backgroundColor: '#10b981',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {copiado ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiado ? '¡Copiado!' : 'Copiar Credenciales'}</span>
              </button>
              <button
                onClick={() => setUsuarioRecienCreado(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Formulario Desplegable: CREAR NUEVO USUARIO DIRECTAMENTE */}
        <AnimatePresence>
          {mostrarFormNuevo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                backgroundColor: '#0f172a',
                borderBottom: '1px solid #374151',
                padding: '18px 24px',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={16} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                  Crear y Activar Nuevo Técnico / Editor
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  (Tú defines sus credenciales y rol de inmediato)
                </span>
              </div>

              {errorNuevoUser && (
                <div style={{
                  padding: '8px 12px',
                  marginBottom: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  fontSize: '0.8rem'
                }}>
                  {errorNuevoUser}
                </div>
              )}

              <form onSubmit={handleCrearUsuarioDirecto} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                      NOMBRE DEL TÉCNICO *
                    </label>
                    <input
                      type="text"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Ej. Mario Flores"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                      TALLER / LAB
                    </label>
                    <input
                      type="text"
                      value={nuevoTaller}
                      onChange={(e) => setNuevoTaller(e.target.value)}
                      placeholder="Ej. ElectroCell Pro"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                      TELÉFONO / WHATSAPP
                    </label>
                    <input
                      type="tel"
                      value={nuevoTelefono}
                      onChange={(e) => setNuevoTelefono(e.target.value)}
                      placeholder="+51 987 654 321"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                      CORREO ELECTRÓNICO *
                    </label>
                    <input
                      type="email"
                      value={nuevoEmail}
                      onChange={(e) => setNuevoEmail(e.target.value)}
                      placeholder="mario@electrocell.com"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                      CONTRASEÑA ASIGNADA *
                    </label>
                    <input
                      type="text"
                      value={nuevoPassword}
                      onChange={(e) => setNuevoPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                      ROL DE ACCESO
                    </label>
                    <select
                      value={nuevoRol}
                      onChange={(e) => setNuevoRol(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: nuevoRol === 'super_admin' ? '#f59e0b' : (nuevoRol === 'editor' ? '#c084fc' : '#38bdf8'),
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="tecnico">⚡ Técnico (Diagnóstico y Medición)</option>
                      <option value="editor">🛠️ Editor (Modelos y Boardviews)</option>
                      <option value="super_admin">👑 Super Admin (Control Total)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setMostrarFormNuevo(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#9ca3af',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={creandoUser}
                    style={{
                      padding: '8px 18px',
                      backgroundColor: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: creandoUser ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    {creandoUser ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>{creandoUser ? 'Creando...' : 'Crear y Activar Usuario'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra de Filtro y Resumen */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#0d131f',
          borderBottom: '1px solid #1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nombre, taller, email o rol..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: '#9ca3af' }}>
            <span>Total: <strong style={{ color: '#ffffff' }}>{usuarios.length}</strong></span>
            <span>Pendientes: <strong style={{ color: '#f59e0b' }}>{usuarios.filter(u => u.estado === 'pendiente').length}</strong></span>
            <span>Activos: <strong style={{ color: '#10b981' }}>{usuarios.filter(u => u.estado === 'activo').length}</strong></span>
          </div>
        </div>

        {mensajeAccion && (
          <div style={{
            padding: '8px 24px',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.4)',
            color: '#c4b5fd',
            fontSize: '0.82rem',
            textAlign: 'center',
            fontWeight: 600
          }}>
            {mensajeAccion}
          </div>
        )}

        {/* Lista de Usuarios */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <p>Cargando lista de técnicos y usuarios...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <p>No se encontraron usuarios coincidentes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {usuariosFiltrados.map((u) => {
                const esPendiente = u.estado === 'pendiente';
                const esBloqueado = u.estado === 'bloqueado';
                const esActivo = u.estado === 'activo';
                const esSuperAdminUser = u.rol === 'super_admin';

                return (
                  <div
                    key={u.id}
                    style={{
                      padding: '14px 18px',
                      backgroundColor: '#1a2234',
                      borderRadius: '10px',
                      border: esPendiente ? '1px solid #f59e0b' : (esSuperAdminUser ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #2d3748'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    {/* Información Básica */}
                    <div style={{ minWidth: '220px', flex: '1 1 200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                          {u.nombre || 'Sin nombre'}
                        </span>
                        {/* Estado Badge */}
                        {esPendiente && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 700, border: '1px solid #f59e0b' }}>
                            🟡 PENDIENTE DE ACTIVACIÓN
                          </span>
                        )}
                        {esActivo && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 700, border: '1px solid #10b981' }}>
                            🟢 ACTIVO
                          </span>
                        )}
                        {esBloqueado && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 700, border: '1px solid #ef4444' }}>
                            🔴 BLOQUEADO
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '4px', fontSize: '0.78rem', color: '#9ca3af' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={13} /> {u.email}
                        </span>
                        {u.taller && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
                            <Building2 size={13} /> {u.taller}
                          </span>
                        )}
                        {u.telefono && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={13} /> {u.telefono}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selector de Rol */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>ROL:</span>
                      <select
                        value={u.rol || 'tecnico'}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        style={{
                          backgroundColor: '#111827',
                          color: u.rol === 'super_admin' ? '#f59e0b' : (u.rol === 'editor' ? '#a78bfa' : '#38bdf8'),
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="super_admin">👑 Super Admin</option>
                        <option value="editor">🛠️ Editor</option>
                        <option value="tecnico">⚡ Técnico</option>
                      </select>
                    </div>

                    {/* Acciones de Estado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {esPendiente && (
                        <button
                          onClick={() => cambiarEstado(u.id, 'activo')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                          }}
                        >
                          <CheckCircle2 size={14} /> Aprobar
                        </button>
                      )}

                      {esActivo && (
                        <button
                          onClick={() => cambiarEstado(u.id, 'bloqueado')}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          Bloquear
                        </button>
                      )}

                      {esBloqueado && (
                        <button
                          onClick={() => cambiarEstado(u.id, 'activo')}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          Reactivar
                        </button>
                      )}

                      <button
                        onClick={() => eliminarUsuario(u.id, u.email)}
                        title="Eliminar usuario"
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: '#6b7280',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
