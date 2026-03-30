import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Agregamos nuevas funciones de Firebase (collection, getDocs, deleteDoc)
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Sun, Moon, ArrowLeft, RefreshCcw, Zap, Smartphone, Battery, Power, Wrench, AlertTriangle, ChevronRight, Home, LifeBuoy, ShieldCheck, Camera, Fingerprint, Volume2, Wifi, Signal, CheckCircle2, XCircle, Cpu, Settings, Activity, Monitor, Sparkles, Plus, Save, X, Trash2, Edit, Search, List } from 'lucide-react';

export default function AppDiagnostico() {
  const [pasoActual, setPasoActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tema, setTema] = useState('light');

  // Estados para el Panel Administrador
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const [vistaAdmin, setVistaAdmin] = useState('lista'); // 'lista' o 'formulario'
  const [listaPasos, setListaPasos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Estados del Formulario
  const [formId, setFormId] = useState('');
  const [formPregunta, setFormPregunta] = useState('');
  const [formEsFinal, setFormEsFinal] = useState(false);
  const [formOpciones, setFormOpciones] = useState([{ texto: '', siguientePaso: '' }]);
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  const cargarPaso = async (idPaso, esRetroceso = false) => {
    setCargando(true);
    try {
      const respuesta = await fetch(`/api/diagnostico?paso=${idPaso}`);
      const datos = await respuesta.json();

      if (!esRetroceso && pasoActual) {
        setHistorial([...historial, pasoActual.id]);
      }
      setPasoActual(datos);
    } catch (error) {
      alert("Hubo un error al cargar el diagnóstico");
    }
    setCargando(false);
  };

  const irAtras = () => {
    if (historial.length === 0) return;
    const pasoAnterior = historial[historial.length - 1];
    const nuevoHistorial = [...historial];
    nuevoHistorial.pop();
    setHistorial(nuevoHistorial);
    cargarPaso(pasoAnterior, true);
  };

  const toggleTema = () => setTema(tema === 'light' ? 'dark' : 'light');

  useEffect(() => { cargarPaso('inicio'); }, []);

  const limpiarTexto = (texto) => texto.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B50}]/gu, '').trim();

  const obtenerIconoDinamico = (texto) => {
    const txt = texto.toLowerCase();
    if (txt.includes('apple') || txt.includes('iphone')) return <Smartphone size={24} color="#0058bc" />;
    if (txt.includes('android')) return <Smartphone size={24} color="#0058bc" />;
    if (txt.includes('carga')) return <Zap size={24} color="#0058bc" />;
    if (txt.includes('encendido') || txt.includes('no enciende')) return <Power size={24} color="#0058bc" />;
    if (txt.includes('pantalla') || txt.includes('imagen')) return <Smartphone size={24} color="#0058bc" />;
    if (txt.includes('batería') || txt.includes('consumo')) return <Battery size={24} color="#0058bc" />;
    if (txt.includes('audio')) return <Volume2 size={24} color="#0058bc" />;
    if (txt.includes('wifi') || txt.includes('bluetooth')) return <Wifi size={24} color="#0058bc" />;
    if (txt.includes('cámara')) return <Camera size={24} color="#0058bc" />;
    if (txt.includes('huella')) return <Fingerprint size={24} color="#0058bc" />;
    if (txt.includes('señal') || txt.includes('red')) return <Signal size={24} color="#0058bc" />;
    if (txt.includes('software')) return <Wrench size={24} color="#0058bc" />;
    if (txt.includes('básico')) return <CheckCircle2 size={24} color="#22c55e" />;
    if (txt.includes('medio')) return <Settings size={24} color="#eab308" />;
    if (txt.includes('avanzado')) return <Cpu size={24} color="#ef4444" />;
    if (txt.startsWith('sí') || txt.includes('si,') || txt.includes('resolvemos')) return <CheckCircle2 size={24} color="#22c55e" />;
    if (txt.startsWith('no') || txt.includes('error') || txt.includes('sigue igual')) return <XCircle size={24} color="#ef4444" />;
    if (txt.includes('pc') || txt.includes('itunes') || txt.includes('dfu')) return <Monitor size={24} color="#8b5cf6" />;
    if (txt.includes('limpia') || txt.includes('sucio')) return <Sparkles size={24} color="#3b82f6" />;
    if (txt.includes('corto') || txt.includes('0.00a') || txt.includes('amperaje')) return <Activity size={24} color="#f97316" />;
    return <ChevronRight size={24} color="#9ca3af" />;
  };

  // --- LÓGICA DEL EXPLORADOR ADMINISTRADOR ---

  // Descargar todos los pasos de Firebase
  const cargarTodosLosPasos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pasos"));
      const pasosArray = [];
      querySnapshot.forEach((doc) => {
        pasosArray.push({ id: doc.id, ...doc.data() });
      });
      setListaPasos(pasosArray);
    } catch (error) {
      console.error("Error al cargar lista:", error);
    }
  };

  // Abrir el modal y cargar la lista
  const abrirAdmin = () => {
    setMostrarAdmin(true);
    setVistaAdmin('lista');
    cargarTodosLosPasos();
  };

  // Preparar formulario para crear uno nuevo
  const prepararNuevoPaso = () => {
    setFormId(''); setFormPregunta(''); setFormEsFinal(false); setFormOpciones([{ texto: '', siguientePaso: '' }]);
    setMensajeAdmin('');
    setVistaAdmin('formulario');
  };

  // Preparar formulario para editar uno existente
  const editarPaso = (paso) => {
    setFormId(paso.id);
    setFormPregunta(paso.pregunta || '');
    setFormEsFinal(!!paso.esFinal);
    setFormOpciones(paso.opciones && paso.opciones.length > 0 ? paso.opciones : [{ texto: '', siguientePaso: '' }]);
    setMensajeAdmin('');
    setVistaAdmin('formulario');
  };

  // Eliminar un paso de Firebase
  const eliminarPaso = async (id) => {
    const confirmar = window.confirm(`¿Estás súper seguro de eliminar el paso "${id}"? Esta acción no se puede deshacer.`);
    if (confirmar) {
      try {
        await deleteDoc(doc(db, "pasos", id));
        cargarTodosLosPasos(); // Recargar la lista
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  // Lógica del Formulario
  const handleAgregarOpcion = () => setFormOpciones([...formOpciones, { texto: '', siguientePaso: '' }]);
  const handleQuitarOpcion = (index) => { const nuevas = [...formOpciones]; nuevas.splice(index, 1); setFormOpciones(nuevas); };
  const handleCambioOpcion = (index, campo, valor) => { const nuevas = [...formOpciones]; nuevas[index][campo] = valor; setFormOpciones(nuevas); };

  const guardarPasoFirebase = async () => {
    if (!formId || !formPregunta) { setMensajeAdmin('⚠️ El ID y la pregunta son obligatorios.'); return; }
    setMensajeAdmin('Guardando en la nube...');
    try {
      const datosAGuardar = { pregunta: formPregunta, esFinal: formEsFinal };
      if (!formEsFinal) datosAGuardar.opciones = formOpciones;

      await setDoc(doc(db, "pasos", formId), datosAGuardar);
      setMensajeAdmin('✅ ¡Guardado con éxito!');

      setTimeout(() => {
        cargarTodosLosPasos();
        setVistaAdmin('lista');
        if (pasoActual.id === formId) cargarPaso(formId); // Actualizar pantalla si editamos el actual
      }, 1500);
    } catch (error) {
      setMensajeAdmin('❌ Error: ' + error.message);
    }
  };

  // Filtrar lista por búsqueda
  const pasosFiltrados = listaPasos.filter(p => p.id.toLowerCase().includes(busqueda.toLowerCase()) || (p.pregunta && p.pregunta.toLowerCase().includes(busqueda.toLowerCase())));

  if (!pasoActual) return null;
  const t = estilos[tema];

  return (
    <div style={{ ...estilos.contenedor, ...t.fondoPrincipal }}>
      <header style={{ ...estilos.header, ...t.bordeFantasmaBottom }}>
        <div style={estilos.headerInner}>
          <h1 style={{ ...estilos.logoTexto, ...t.textoPrincipal }}>MARSHALL CELL DIAGNOSTICS</h1>
          <button onClick={toggleTema} style={{ ...estilos.btnTema, ...t.textoSutil }}>
            {tema === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        <div style={estilos.lineaAcento}></div>
      </header>

      <main style={estilos.main}>
        <AnimatePresence mode="wait">
          <motion.div key={pasoActual.id} initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -10 }} transition={{ duration: 0.4 }} style={{ ...estilos.tarjetaCristal, ...t.cristalBg, ...t.bordeFantasma }}>
            <div style={estilos.seccionTitulo}>
              <span style={{ ...estilos.etiquetaPaso, color: '#0058bc' }}>PASO {String(historial.length + 1).padStart(2, '0')}</span>
              <h2 style={{ ...estilos.tituloPregunta, ...t.textoPrincipal }}>{pasoActual.pregunta}</h2>
            </div>

            {pasoActual.esFinal ? (
              <div style={estilos.estadoFinal}>
                <div style={estilos.iconoFinalBg}><ShieldCheck size={48} color="#0058bc" /></div>
                <h3 style={{ ...estilos.textoFinal, ...t.textoPrincipal }}>Diagnóstico Completado</h3>
                <button style={estilos.btnPrimario} onClick={() => { setHistorial([]); cargarPaso('inicio'); }}>
                  <RefreshCcw size={18} style={{ marginRight: '8px' }} /> Iniciar Nueva Evaluación
                </button>
              </div>
            ) : (
              <div style={estilos.gridOpciones}>
                {pasoActual.opciones?.map((opcion, index) => (
                  <motion.button key={index} whileHover={{ scale: 1.02, backgroundColor: t.hoverBg }} whileTap={{ scale: 0.98 }} style={{ ...estilos.btnOpcion, ...t.bordeFantasma, ...t.cristalBgItem }} onClick={() => cargarPaso(opcion.siguientePaso)}>
                    <div style={estilos.opcionContenido}>
                      <div style={estilos.iconoCirculo}>{obtenerIconoDinamico(opcion.texto)}</div>
                      <div style={estilos.textosOpcion}>
                        <span style={{ ...estilos.tituloOpcion, ...t.textoPrincipal }}>{limpiarTexto(opcion.texto)}</span>
                        <span style={{ ...estilos.descOpcion, ...t.textoSutil }}>Toque para continuar</span>
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: '#0058bc', opacity: 0.5 }} />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav style={{ ...estilos.navInferior, ...t.cristalBgNav, ...t.bordeFantasmaTop }}>
        <div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
          {historial.length > 0 && (
            <button style={{ ...estilos.navBtn, ...t.textoSutil }} onClick={irAtras}>
              <ArrowLeft size={24} /> <span style={estilos.navLabel}>BACK</span>
            </button>
          )}
        </div>
        <button style={estilos.navBtnCentro} onClick={() => { setHistorial([]); cargarPaso('inicio'); }}>
          <Home size={24} color="white" />
        </button>
        <div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
          <button style={{ ...estilos.navBtn, ...t.textoSutil }} onClick={abrirAdmin}>
            <Settings size={24} /> <span style={estilos.navLabel}>ADMIN</span>
          </button>
        </div>
      </nav>

      {/* MODAL DEL PANEL ADMINISTRADOR MEJORADO */}
      <AnimatePresence>
        {mostrarAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma }}>

              <div style={estilos.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {vistaAdmin === 'formulario' && (
                    <button onClick={() => setVistaAdmin('lista')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0058bc', display: 'flex', alignItems: 'center' }} title="Volver a la lista">
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <h3 style={{ ...estilos.modalTitulo, ...t.textoPrincipal }}>
                    {vistaAdmin === 'lista' ? '📂 Explorador de Diagnósticos' : '⚙️ Editar Paso'}
                  </h3>
                </div>
                <button onClick={() => setMostrarAdmin(false)} style={{ ...estilos.btnCerrar, ...t.textoSutil }}><X size={24} /></button>
              </div>

              {/* VISTA 1: EXPLORADOR (LISTA) */}
              {vistaAdmin === 'lista' && (
                <div style={estilos.modalBody}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: '#9ca3af' }} />
                      <input style={{ ...estilos.inputForm, paddingLeft: '35px', ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} type="text" placeholder="Buscar por ID o pregunta..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>
                    <button onClick={prepararNuevoPaso} style={estilos.btnPrimarioGuardar} title="Crear nuevo paso"><Plus size={20} /></button>
                  </div>

                  <div style={estilos.listaContainer}>
                    {pasosFiltrados.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>No se encontraron pasos.</p>
                    ) : (
                      pasosFiltrados.map((paso) => (
                        <div key={paso.id} style={{ ...estilos.listaItem, ...t.bordeFantasma, ...t.cristalBgItem }}>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#0058bc', fontWeight: 'bold' }}>{paso.id}</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', ...t.textoPrincipal, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{paso.pregunta}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => editarPaso(paso)} style={estilos.btnAccionLista}><Edit size={18} color="#eab308" /></button>
                            <button onClick={() => eliminarPaso(paso.id)} style={estilos.btnAccionLista}><Trash2 size={18} color="#ef4444" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* VISTA 2: FORMULARIO */}
              {vistaAdmin === 'formulario' && (
                <>
                  <div style={estilos.modalBody}>
                    <label style={{ ...estilos.labelForm, ...t.textoPrincipal }}>ID del Paso</label>
                    <input style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} type="text" value={formId} onChange={(e) => setFormId(e.target.value.replace(/\s+/g, '_').toLowerCase())} placeholder="ej. ip_pantalla_rota" readOnly={formId === 'inicio'} />

                    <label style={{ ...estilos.labelForm, ...t.textoPrincipal }}>Pregunta o Diagnóstico a mostrar</label>
                    <textarea style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma, minHeight: '80px' }} value={formPregunta} onChange={(e) => setFormPregunta(e.target.value)} placeholder="¿Qué revisamos ahora?" />

                    <div style={estilos.checkboxGroup}>
                      <input type="checkbox" id="esFinal" checked={formEsFinal} onChange={(e) => setFormEsFinal(e.target.checked)} />
                      <label htmlFor="esFinal" style={{ ...t.textoPrincipal, fontWeight: '600' }}>¿Es un diagnóstico final?</label>
                    </div>

                    {!formEsFinal && (
                      <div style={estilos.opcionesContainer}>
                        <h4 style={{ ...t.textoPrincipal, marginBottom: '10px' }}>Opciones de Respuesta:</h4>
                        {formOpciones.map((op, index) => (
                          <div key={index} style={estilos.opcionRow}>
                            <div style={{ flex: 1 }}>
                              <input style={{ ...estilos.inputFormPequeño, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} type="text" placeholder="Texto (ej. Sí, funciona)" value={op.texto} onChange={(e) => handleCambioOpcion(index, 'texto', e.target.value)} />
                              <input style={{ ...estilos.inputFormPequeño, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma, marginTop: '8px' }} type="text" placeholder="ID Siguiente (ej. ip_siguiente)" value={op.siguientePaso} onChange={(e) => handleCambioOpcion(index, 'siguientePaso', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
                            </div>
                            <button onClick={() => handleQuitarOpcion(index)} style={estilos.btnBorrarOp}><Trash2 size={20} color="#ef4444" /></button>
                          </div>
                        ))}
                        <button onClick={handleAgregarOpcion} style={estilos.btnAgregarOp}><Plus size={18} /> Agregar otra opción</button>
                      </div>
                    )}

                    {mensajeAdmin && <p style={{ color: mensajeAdmin.includes('❌') ? '#ef4444' : '#22c55e', fontWeight: 'bold', textAlign: 'center', marginTop: '15px' }}>{mensajeAdmin}</p>}
                  </div>

                  <div style={estilos.modalFooter}>
                    <button onClick={guardarPasoFirebase} style={estilos.btnPrimarioGuardar}><Save size={18} style={{ marginRight: '8px' }} /> Guardar Paso</button>
                  </div>
                </>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Estilos
const estilos = {
  contenedor: { minHeight: '100vh', fontFamily: '"Inter", system-ui, -apple-system, sans-serif', paddingBottom: '100px', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s' },
  header: { paddingTop: '16px', paddingBottom: '16px', position: 'relative' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  logoTexto: { fontSize: '0.875rem', fontWeight: '800', letterSpacing: '0.05em', margin: 0 },
  btnTema: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px' },
  lineaAcento: { height: '3px', width: '30%', background: 'linear-gradient(135deg, #0058bc 0%, #0070eb 100%)', position: 'absolute', bottom: 0, left: 0 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' },
  tarjetaCristal: { width: '100%', borderRadius: '2.5rem', padding: '50px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0, 88, 188, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  seccionTitulo: { textAlign: 'center', marginBottom: '40px', maxWidth: '600px' },
  etiquetaPaso: { fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' },
  tituloPregunta: { fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.2', margin: '0 0 16px 0' },
  gridOpciones: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', width: '100%' },
  btnOpcion: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: '1.5rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease' },
  opcionContenido: { display: 'flex', alignItems: 'center', gap: '16px' },
  iconoCirculo: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(0, 88, 188, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textosOpcion: { display: 'flex', flexDirection: 'column', gap: '4px' },
  tituloOpcion: { fontSize: '1.05rem', fontWeight: '700' },
  descOpcion: { fontSize: '0.8rem' },
  estadoFinal: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', textAlign: 'center' },
  iconoFinalBg: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(0, 88, 188, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' },
  textoFinal: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '32px' },
  btnPrimario: { background: 'linear-gradient(135deg, #0058bc 0%, #0070eb 100%)', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '1.5rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 10px 20px rgba(0, 88, 188, 0.2)' },
  navInferior: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 20px', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)', zIndex: 1000 },
  navBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '80px' },
  navLabel: { fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em' },
  navBtnCentro: { width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #0058bc 0%, #0070eb 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0, 88, 188, 0.3)', transform: 'translateY(-15px)' },

  // MODAL ADMIN MEJORADO
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  modalCard: { width: '100%', maxWidth: '600px', maxHeight: '90vh', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
  modalHeader: { padding: '20px 30px', borderBottom: '1px solid rgba(150,150,150,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitulo: { margin: 0, fontSize: '1.2rem', fontWeight: 'bold' },
  btnCerrar: { background: 'none', border: 'none', cursor: 'pointer' },
  modalBody: { padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 },
  listaContainer: { display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '400px', paddingRight: '5px' },
  listaItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '12px' },
  btnAccionLista: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  labelForm: { fontSize: '0.9rem', fontWeight: '600', marginBottom: '-5px' },
  inputForm: { width: '100%', padding: '12px 15px', borderRadius: '10px', fontSize: '1rem', outline: 'none' },
  inputFormPequeño: { width: '100%', padding: '10px 15px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' },
  checkboxGroup: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' },
  opcionesContainer: { backgroundColor: 'rgba(0,0,0,0.03)', padding: '20px', borderRadius: '12px', marginTop: '10px' },
  opcionRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
  btnBorrarOp: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
  btnAgregarOp: { background: 'none', border: 'none', color: '#0058bc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '10px 0' },
  modalFooter: { padding: '20px 30px', borderTop: '1px solid rgba(150,150,150,0.2)', display: 'flex', justifyContent: 'flex-end' },
  btnPrimarioGuardar: { background: 'linear-gradient(135deg, #0058bc 0%, #0070eb 100%)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center' },

  dark: {
    fondoPrincipal: { backgroundColor: '#2f3034' }, cristalBg: { backgroundColor: 'rgba(47, 48, 52, 0.7)' }, cristalBgItem: { backgroundColor: 'rgba(255, 255, 255, 0.03)' }, cristalBgNav: { backgroundColor: 'rgba(47, 48, 52, 0.85)' },
    textoPrincipal: { color: '#ffffff' }, textoSutil: { color: '#9ca3af' }, bordeFantasma: { border: '1px solid rgba(255, 255, 255, 0.08)' }, bordeFantasmaBottom: { borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }, bordeFantasmaTop: { borderTop: '1px solid rgba(255, 255, 255, 0.08)' }, hoverBg: 'rgba(255, 255, 255, 0.06)'
  },
  light: {
    fondoPrincipal: { backgroundColor: '#faf9fe' }, cristalBg: { backgroundColor: 'rgba(255, 255, 255, 0.8)' }, cristalBgItem: { backgroundColor: 'rgba(255, 255, 255, 1)' }, cristalBgNav: { backgroundColor: 'rgba(250, 249, 254, 0.85)' },
    textoPrincipal: { color: '#111827' }, textoSutil: { color: '#6b7280' }, bordeFantasma: { border: '1px solid rgba(0, 0, 0, 0.05)' }, bordeFantasmaBottom: { borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }, bordeFantasmaTop: { borderTop: '1px solid rgba(0, 0, 0, 0.05)' }, hoverBg: 'rgba(0, 88, 188, 0.02)'
  }
};