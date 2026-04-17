/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, addDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Sun, Moon, ArrowLeft, RefreshCcw, Zap, Smartphone, AlertTriangle, ChevronRight, Home, ShieldCheck, Camera, CheckCircle2, XCircle, Settings, Plus, Save, X, Trash2, Edit, ChevronDown, CornerDownRight, LogOut, Lightbulb, Usb, Map, Play, Flame, ClipboardList, History, Printer, FileText, MessageCircle, Youtube } from 'lucide-react';

// NOTA: Ya no importamos el PDF aquí arriba para evitar el error de pantalla blanca.
// Lo importaremos dinámicamente solo cuando el usuario haga clic en imprimir.

const obtenerUrlVideo = (url) => {
  if (!url) return '';
  let videoId = '';
  if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
  else if (url.includes('youtube.com/watch')) videoId = new URLSearchParams(url.split('?')[1]).get('v');
  else if (url.includes('youtube.com/embed/')) return url;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

const SimuladorFuente = ({ voltaje, amperaje }) => {
  const [ampVisible, setAmpVisible] = useState('0.000');
  useEffect(() => {
    if (!amperaje) return;
    const valores = amperaje.split(',').map(v => v.trim());
    if (valores.length === 1) { setAmpVisible(valores[0]); return; }
    let index = 0;
    setAmpVisible(valores[0]);
    const intervalo = setInterval(() => { index = (index + 1) % valores.length; setAmpVisible(valores[index]); }, 800);
    return () => clearInterval(intervalo);
  }, [amperaje]);

  return (
    <div style={{ backgroundColor: '#111827', padding: '15px 25px', borderRadius: '15px', border: '2px solid #374151', display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '25px', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5), 0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: '"Courier New", Courier, monospace', width: '100%', maxWidth: '400px', margin: '0 auto 25px auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '5px' }}>VOLTAGE</span><div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}><span style={{ color: '#ef4444', fontSize: '2.5rem', fontWeight: 'bold', textShadow: '0 0 10px rgba(239,68,68,0.5)' }}>{voltaje || '0.0'}</span><span style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 'bold' }}>V</span></div></div>
      <div style={{ width: '2px', height: '50px', backgroundColor: '#374151' }}></div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '5px' }}>CURRENT</span><div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}><span style={{ color: '#10b981', fontSize: '2.5rem', fontWeight: 'bold', textShadow: '0 0 10px rgba(16,185,129,0.5)' }}>{ampVisible}</span><span style={{ color: '#10b981', fontSize: '1rem', fontWeight: 'bold' }}>A</span></div></div>
    </div>
  );
};

export default function AppDiagnostico() {
  const [pasoActual, setPasoActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tema, setTema] = useState('light');
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const [vistaAdmin, setVistaAdmin] = useState('login');
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passAdmin, setPassAdmin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [listaPasos, setListaPasos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [pasosExpandidos, setPasosExpandidos] = useState({});

  // ESTADOS DEL TIP EXPERTO
  const [notaVisible, setNotaVisible] = useState(false);
  const [tipVisto, setTipVisto] = useState(false);
  const [tipTabActiva, setTipTabActiva] = useState(0);

  const [mostrarTablaConsumos, setMostrarTablaConsumos] = useState(false);
  const [panelMedicionVisible, setPanelMedicionVisible] = useState(false);
  const [dockViewTab, setDockViewTab] = useState('diodo');
  const [imgModalVisible, setImgModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [fallasEnSerie, setFallasEnSerie] = useState([]);

  // ESTADOS BITÁCORA / HISTORIAL
  const [bitacoraVisible, setBitacoraVisible] = useState(false);
  const [historialCasosVisible, setHistorialCasosVisible] = useState(false);
  const [casosGuardados, setCasosGuardados] = useState([]);
  const [casoEditando, setCasoEditando] = useState(null);
  const [formCaso, setFormCaso] = useState({ marca: '', modelo: '', sintomas: '', protocolo: '', imgUrl: '' });
  const [mensajeCaso, setMensajeCaso] = useState('');

  // ESTADOS REPORTE PDF/WHATSAPP
  const [reporteVisible, setReporteVisible] = useState(false);
  const [casoReporte, setCasoReporte] = useState(null);

  const [formId, setFormId] = useState('');
  const [formPregunta, setFormPregunta] = useState('');
  const [formTabsNota, setFormTabsNota] = useState([{ titulo: 'General', contenido: '' }]);
  const [formEsFinal, setFormEsFinal] = useState(false);
  const [formOpciones, setFormOpciones] = useState([{ texto: '', siguientePaso: '' }]);
  const [formTabla, setFormTabla] = useState([]);
  const [formSimV, setFormSimV] = useState('');
  const [formSimA, setFormSimA] = useState('');
  const [dockAdminTab, setDockAdminTab] = useState('diodo');
  const [formDockDiodo, setFormDockDiodo] = useState({ vbus: '', dp: '', dm: '', cc1: '', cc2: '' });
  const [formDockUa, setFormDockUa] = useState({ vbus: '', dp: '', dm: '', cc1: '', cc2: '' });
  const [formImgUrl, setFormImgUrl] = useState('');
  const [formImgTipo, setFormImgTipo] = useState('microscopio');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formEsFallaSerie, setFormEsFallaSerie] = useState(false);
  const [formTituloSerie, setFormTituloSerie] = useState('');
  const [formDescSerie, setFormDescSerie] = useState('');
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  const cargarFallasEnSerie = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pasos"));
      const fallas = [];
      querySnapshot.forEach((doc) => { if (doc.data().esFallaEnSerie) fallas.push({ id: doc.id, ...doc.data() }); });
      setFallasEnSerie(fallas);
    } catch (error) { console.error(error); }
  };

  const cargarPaso = async (idPaso, esRetroceso = false) => {
    setCargando(true);
    try {
      const respuesta = await fetch(`/api/diagnostico?paso=${idPaso}`);
      const datos = await respuesta.json();

      setPasoActual((prevPaso) => {
        if (!esRetroceso && prevPaso) {
          setHistorial(prevHistorial => [...prevHistorial, prevPaso.id]);
        }
        return datos;
      });

      setNotaVisible(false); setTipVisto(false); setTipTabActiva(0); setMostrarTablaConsumos(false); setPanelMedicionVisible(false); setImgModalVisible(false); setVideoModalVisible(false);
      if (datos.docktestDiodo) setDockViewTab('diodo'); else if (datos.docktestUa) setDockViewTab('ua');
    } catch (error) { alert("Hubo un error al cargar el diagnóstico"); }
    setCargando(false);
  };

  const irAtras = () => {
    setHistorial(prev => {
      if (prev.length === 0) return prev;
      const nuevo = [...prev];
      const anterior = nuevo.pop();
      cargarPaso(anterior, true);
      return nuevo;
    });
  };

  const toggleTema = () => setTema(tema === 'light' ? 'dark' : 'light');

  useEffect(() => { cargarPaso('inicio'); cargarFallasEnSerie(); }, []);

  const limpiarTexto = (texto) => texto.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B50}]/gu, '').trim();

  const obtenerIconoDinamico = (texto) => {
    const txt = texto.toLowerCase();
    if (txt.includes('apple') || txt.includes('iphone')) return <Smartphone size={24} color="#0058bc" />;
    if (txt.includes('carga')) return <Zap size={24} color="#0058bc" />;
    if (txt.includes('básico') || txt.startsWith('sí')) return <CheckCircle2 size={24} color="#22c55e" />;
    if (txt.includes('avanzado') || txt.startsWith('no')) return <XCircle size={24} color="#ef4444" />;
    return <ChevronRight size={24} color="#9ca3af" />;
  };

  const iniciarSesion = async (e) => { e.preventDefault(); setErrorLogin(''); try { await signInWithEmailAndPassword(auth, emailAdmin, passAdmin); setEstaAutenticado(true); setEmailAdmin(''); setPassAdmin(''); setVistaAdmin('lista'); cargarTodosLosPasos(); } catch (error) { setErrorLogin('❌ Credenciales incorrectas.'); } };
  const cerrarSesion = async () => { await signOut(auth); setEstaAutenticado(false); setMostrarAdmin(false); };
  const cargarTodosLosPasos = async () => { try { const querySnapshot = await getDocs(collection(db, "pasos")); const pasosArray = []; querySnapshot.forEach((doc) => pasosArray.push({ id: doc.id, ...doc.data() })); setListaPasos(pasosArray); setPasosExpandidos({ inicio: true }); } catch (error) { console.error(error); } };
  const abrirAdmin = () => { setMostrarAdmin(true); if (estaAutenticado) { setVistaAdmin('lista'); cargarTodosLosPasos(); } else { setVistaAdmin('login'); } };

  // --- FUNCIONES DE LA BITÁCORA ---
  const cargarHistorialCasos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "historial_reparaciones"));
      const casosArray = [];
      querySnapshot.forEach((doc) => casosArray.push({ id: doc.id, ...doc.data() }));
      casosArray.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setCasosGuardados(casosArray);
    } catch (error) { console.error("Error al cargar casos:", error); }
  };

  const abrirHistorial = () => { setHistorialCasosVisible(true); cargarHistorialCasos(); };
  const prepararNuevoCaso = () => { setFormCaso({ marca: '', modelo: '', sintomas: '', protocolo: '', imgUrl: '' }); setCasoEditando(null); setMensajeCaso(''); setBitacoraVisible(true); };
  const editarCasoExistente = (caso) => { setFormCaso({ marca: caso.marca, modelo: caso.modelo, sintomas: caso.sintomas, protocolo: caso.protocolo || '', imgUrl: caso.imgUrl || '' }); setCasoEditando(caso.id); setMensajeCaso(''); setBitacoraVisible(true); };

  const guardarBitacora = async (e) => {
    e.preventDefault();
    if (!formCaso.marca || !formCaso.modelo || !formCaso.sintomas) { setMensajeCaso('⚠️ Llena Marca, Modelo y Síntomas.'); return; }
    setMensajeCaso('Guardando...');
    try {
      if (casoEditando) {
        await updateDoc(doc(db, "historial_reparaciones", casoEditando), { ...formCaso, ultimaModificacion: new Date().toISOString() });
        setMensajeCaso('✅ ¡Caso actualizado!');
      } else {
        await addDoc(collection(db, "historial_reparaciones"), { ...formCaso, fecha: new Date().toISOString(), estado: 'Registrado' });
        setMensajeCaso('✅ ¡Caso registrado!');
      }
      setTimeout(() => { setBitacoraVisible(false); setMensajeCaso(''); cargarHistorialCasos(); }, 1500);
    } catch (error) { setMensajeCaso('❌ Error al guardar.'); }
  };

  const eliminarCaso = async (id) => { if (window.confirm('¿Seguro de eliminar este caso del historial?')) { try { await deleteDoc(doc(db, "historial_reparaciones", id)); cargarHistorialCasos(); } catch (error) { alert("Error: " + error.message); } } };

  // --- FUNCIONES DEL REPORTE (PDF / WHATSAPP) ---
  const abrirReporte = (caso) => {
    setCasoReporte(caso);
    setReporteVisible(true);
    setHistorialCasosVisible(false);
  };

  // IMPRESIÓN DINÁMICA DE PDF
  const imprimirReporte = async () => {
    if (!casoReporte) return;
    try {
      // Importamos la librería y la plantilla SOLO cuando hacemos clic
      const { pdf } = await import('@react-pdf/renderer');
      const ReportePDF = (await import('../components/pdfx/ReportePDF')).default;

      const blob = await pdf(<ReportePDF caso={casoReporte} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un problema generando el PDF. Asegúrate de tener los componentes instalados.");
    }
  };

  const enviarWhatsApp = () => {
    if (!casoReporte) return;
    const texto = `📱 *MARSHALL CELL - REPORTE TÉCNICO*\n\n` +
      `*Equipo:* ${casoReporte.marca} ${casoReporte.modelo}\n` +
      `*ID:* #${casoReporte.id.substring(0, 6).toUpperCase()}\n` +
      `*Fecha:* ${new Date(casoReporte.fecha).toLocaleDateString()}\n\n` +
      `⚠️ *Síntoma reportado:*\n${casoReporte.sintomas}\n\n` +
      `🛠️ *Diagnóstico / Protocolo:*\n${casoReporte.protocolo || 'Pendiente de evaluación profunda.'}\n\n` +
      `👨‍🔧 *Técnico:* Marshall\n📍 *Laboratorio:* Oropesa, Cusco`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const prepararNuevoPaso = () => { setFormId(''); setFormPregunta(''); setFormTabsNota([{ titulo: 'General', contenido: '' }]); setFormEsFinal(false); setFormOpciones([{ texto: '', siguientePaso: '' }]); setFormTabla([]); setFormSimV(''); setFormSimA(''); setFormImgUrl(''); setFormImgTipo('microscopio'); setFormVideoUrl(''); setFormDockDiodo({ vbus: '', dp: '', dm: '', cc1: '', cc2: '' }); setFormDockUa({ vbus: '', dp: '', dm: '', cc1: '', cc2: '' }); setDockAdminTab('diodo'); setFormEsFallaSerie(false); setFormTituloSerie(''); setFormDescSerie(''); setMensajeAdmin(''); setVistaAdmin('formulario'); };

  const editarPaso = (paso) => {
    setFormId(paso.id);
    setFormPregunta(paso.pregunta || '');
    // Adaptador para notas antiguas vs nuevas tabs
    if (paso.tabsNota && paso.tabsNota.length > 0) {
      setFormTabsNota(paso.tabsNota);
    } else if (paso.notaExperta) {
      setFormTabsNota([{ titulo: 'General', contenido: paso.notaExperta }]);
    } else {
      setFormTabsNota([{ titulo: 'General', contenido: '' }]);
    }
    setFormEsFinal(!!paso.esFinal);
    setFormOpciones(paso.opciones && paso.opciones.length > 0 ? paso.opciones : [{ texto: '', siguientePaso: '' }]);
    setFormTabla(paso.tablaReferencia || []); setFormSimV(paso.simVoltaje || ''); setFormSimA(paso.simAmperaje || ''); setFormImgUrl(paso.imgUrl || ''); setFormImgTipo(paso.imgTipo || 'microscopio'); setFormVideoUrl(paso.videoUrl || ''); setFormDockDiodo(paso.docktestDiodo || { vbus: '', dp: '', dm: '', cc1: '', cc2: '' }); setFormDockUa(paso.docktestUa || { vbus: '', dp: '', dm: '', cc1: '', cc2: '' }); setDockAdminTab('diodo'); setFormEsFallaSerie(!!paso.esFallaEnSerie); setFormTituloSerie(paso.tituloFallaSerie || ''); setFormDescSerie(paso.descFallaSerie || ''); setMensajeAdmin(''); setVistaAdmin('formulario');
  };

  const eliminarPaso = async (id) => { if (id === 'inicio') { alert("No puedes eliminar la raíz."); return; } if (window.confirm(`¿Seguro de eliminar "${id}"?`)) { try { await deleteDoc(doc(db, "pasos", id)); cargarTodosLosPasos(); cargarFallasEnSerie(); } catch (error) { alert("Error al eliminar: " + error.message); } } };
  const handleAgregarOpcion = () => setFormOpciones([...formOpciones, { texto: '', siguientePaso: '' }]); const handleQuitarOpcion = (index) => { const nuevas = [...formOpciones]; nuevas.splice(index, 1); setFormOpciones(nuevas); }; const handleCambioOpcion = (index, campo, valor) => { const nuevas = [...formOpciones]; nuevas[index][campo] = valor; setFormOpciones(nuevas); }; const handleAgregarFilaTabla = () => setFormTabla([...formTabla, { valor: '', descripcion: '' }]); const handleQuitarFilaTabla = (index) => { const nuevas = [...formTabla]; nuevas.splice(index, 1); setFormTabla(nuevas); }; const handleCambioFilaTabla = (index, campo, valor) => { const nuevas = [...formTabla]; nuevas[index][campo] = valor; setFormTabla(nuevas); }; const handleDockChange = (campo, valor) => { if (dockAdminTab === 'diodo') setFormDockDiodo({ ...formDockDiodo, [campo]: valor }); else setFormDockUa({ ...formDockUa, [campo]: valor }); };

  const guardarPasoFirebase = async () => {
    if (!formId || !formPregunta) { setMensajeAdmin('⚠️ ID y pregunta obligatorios.'); return; }
    setMensajeAdmin('Guardando...');
    try {
      const datosAGuardar = { pregunta: formPregunta, esFinal: formEsFinal };

      const tabsValidas = formTabsNota.filter(t => t.titulo.trim() !== '' && t.contenido.trim() !== '');
      if (tabsValidas.length > 0) {
        datosAGuardar.tabsNota = tabsValidas;
        datosAGuardar.notaExperta = null;
      } else {
        datosAGuardar.tabsNota = [];
        datosAGuardar.notaExperta = null;
      }

      if (formSimV.trim() !== '') datosAGuardar.simVoltaje = formSimV;
      if (formSimA.trim() !== '') datosAGuardar.simAmperaje = formSimA;
      if (formImgUrl.trim() !== '') { datosAGuardar.imgUrl = formImgUrl; datosAGuardar.imgTipo = formImgTipo; } else { datosAGuardar.imgUrl = null; }
      if (formVideoUrl.trim() !== '') { datosAGuardar.videoUrl = formVideoUrl; } else { datosAGuardar.videoUrl = null; }
      if (!formEsFinal) datosAGuardar.opciones = formOpciones;

      const tablaValida = formTabla.filter(fila => fila.valor.trim() !== '' || fila.descripcion.trim() !== '');
      if (tablaValida.length > 0) datosAGuardar.tablaReferencia = tablaValida; else datosAGuardar.tablaReferencia = [];
      const hasDiodo = Object.values(formDockDiodo).some(v => v.trim() !== ''); const hasUa = Object.values(formDockUa).some(v => v.trim() !== '');
      if (hasDiodo) datosAGuardar.docktestDiodo = formDockDiodo; else datosAGuardar.docktestDiodo = null;
      if (hasUa) datosAGuardar.docktestUa = formDockUa; else datosAGuardar.docktestUa = null;

      if (formEsFallaSerie) { datosAGuardar.esFallaEnSerie = true; datosAGuardar.tituloFallaSerie = formTituloSerie; datosAGuardar.descFallaSerie = formDescSerie; }
      else { datosAGuardar.esFallaEnSerie = false; datosAGuardar.tituloFallaSerie = null; datosAGuardar.descFallaSerie = null; }

      await setDoc(doc(db, "pasos", formId), datosAGuardar);
      setMensajeAdmin('✅ ¡Guardado!'); cargarFallasEnSerie();
      setTimeout(() => { cargarTodosLosPasos(); setVistaAdmin('lista'); if (pasoActual.id === formId) cargarPaso(formId); }, 1500);
    } catch (error) { setMensajeAdmin('❌ Error: ' + error.message); }
  };

  const pasosMap = listaPasos.reduce((acc, paso) => { acc[paso.id] = paso; return acc; }, {});
  const pasosFiltrados = listaPasos.filter(p => p.id.toLowerCase().includes(busqueda.toLowerCase()) || (p.pregunta && p.pregunta.toLowerCase().includes(busqueda.toLowerCase())));
  const toggleExpandir = (id) => setPasosExpandidos(prev => ({ ...prev, [id]: !prev[id] }));

  const renderArbol = (idPaso, nivel = 0, visitados = new Set()) => {
    const paso = pasosMap[idPaso];
    const t = estilos[tema];
    if (!paso || visitados.has(idPaso)) return null;
    const tieneHijos = !paso.esFinal && paso.opciones && paso.opciones.length > 0;
    const expandido = pasosExpandidos[idPaso];
    const nuevosVisitados = new Set(visitados).add(idPaso);

    return (
      <div key={`${idPaso}-${nivel}`} style={{ marginLeft: nivel > 0 ? '20px' : '0', borderLeft: nivel > 0 ? `2px solid ${tema === 'light' ? '#e5e7eb' : '#374151'}` : 'none', paddingLeft: nivel > 0 ? '15px' : '0', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', backgroundColor: t.cristalBgItem.backgroundColor, border: t.bordeFantasma.border }}>
          <div onClick={() => tieneHijos && toggleExpandir(idPaso)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: tieneHijos ? 'pointer' : 'default', flex: 1 }}>
            {tieneHijos ? (expandido ? <ChevronDown size={18} color="#0058bc" /> : <ChevronRight size={18} color="#0058bc" />) : (<ShieldCheck size={14} color="#22c55e" />)}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', color: '#0058bc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>{paso.id} {paso.imgUrl && (paso.imgTipo === 'microscopio' ? <Camera size={12} color="#8b5cf6" /> : <Map size={12} color="#8b5cf6" />)} {paso.videoUrl && <Play size={12} color="#ef4444" />} {paso.esFallaEnSerie && <Flame size={12} color="#f97316" />}</span>
              <span style={{ fontSize: '0.8rem', color: t.textoPrincipal.color, opacity: 0.8 }}>{paso.pregunta}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}><button onClick={() => editarPaso(paso)} style={estilos.btnAccionLista}><Edit size={16} color="#eab308" /></button><button onClick={() => eliminarPaso(paso.id)} style={estilos.btnAccionLista}><Trash2 size={16} color="#ef4444" /></button></div>
        </div>
        <AnimatePresence>{expandido && tieneHijos && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>{paso.opciones.map((op, idx) => (<div key={idx} style={{ marginTop: '5px' }}><div style={{ fontSize: '0.75rem', color: t.textoSutil.color, marginLeft: '35px', marginTop: '8px', marginBottom: '-5px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}><CornerDownRight size={14} /> "{op.texto}" ➡️</div>{renderArbol(op.siguientePaso, nivel + 1, nuevosVisitados)}</div>))}</motion.div>)}</AnimatePresence>
      </div>
    );
  };

  if (!pasoActual) return null;
  const t = estilos[tema];
  const tieneDocktest = pasoActual.docktestDiodo || pasoActual.docktestUa;
  const currentDockData = dockViewTab === 'diodo' ? pasoActual.docktestDiodo : pasoActual.docktestUa;
  const currentDockInputs = dockAdminTab === 'diodo' ? formDockDiodo : formDockUa;

  const arrayTips = pasoActual.tabsNota && pasoActual.tabsNota.length > 0
    ? pasoActual.tabsNota
    : (pasoActual.notaExperta ? [{ titulo: 'General', contenido: pasoActual.notaExperta }] : []);
  const tieneTips = arrayTips.length > 0;

  return (
    <div style={{ ...estilos.contenedor, ...t.fondoPrincipal }}>

      <header className="no-print" style={{ ...estilos.header, ...t.bordeFantasmaBottom }}>
        <div style={estilos.headerInner}>
          <h1 style={{ ...estilos.logoTexto, ...t.textoPrincipal }}>MARSHALL CELL CRM</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={abrirHistorial} style={{ ...estilos.btnHeader, backgroundColor: t.cristalBgItem.backgroundColor, color: t.textoPrincipal.color, border: t.bordeFantasma.border }} title="Ver Historial">
              <History size={16} /> <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>HISTORIAL</span>
            </button>
            <button onClick={prepararNuevoCaso} style={{ ...estilos.btnHeader, backgroundColor: '#10b981', color: 'white', border: 'none' }} title="Registrar Nuevo Caso">
              <ClipboardList size={16} /> <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>NUEVO INGRESO</span>
            </button>
            <button onClick={toggleTema} style={{ ...estilos.btnTema, ...t.textoSutil, marginLeft: '5px' }}>{tema === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
          </div>
        </div>
        <div style={estilos.lineaAcento}></div>
      </header>

      <main className="no-print" style={estilos.main}>
        <AnimatePresence>
          {pasoActual.id === 'inicio' && fallasEnSerie.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} style={{ width: '100%', marginBottom: '30px' }}>
              <h3 style={{ ...t.textoPrincipal, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0' }}><Flame size={20} color="#f97316" /> FALLAS CRÓNICAS (ACCESO RÁPIDO)</h3>
              <div style={estilos.carruselFallas}>
                {fallasEnSerie.map(falla => (
                  <motion.button key={falla.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ ...estilos.tarjetaFallaSerie, ...t.cristalBgItem, ...t.bordeFantasma }} onClick={() => cargarPaso(falla.id)}>
                    <div style={estilos.fallaSerieHeader}><AlertTriangle size={18} color="#ef4444" /><span style={{ ...estilos.fallaSerieTitulo, color: t.textoPrincipal.color }}>{falla.tituloFallaSerie || 'Falla Crónica'}</span></div>
                    <p style={{ ...estilos.fallaSerieDesc, color: t.textoSutil.color }}>{falla.descFallaSerie || falla.pregunta}</p>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>{falla.imgUrl && <Camera size={14} color="#8b5cf6" />}{falla.videoUrl && <Play size={14} color="#ef4444" />}{(falla.docktestDiodo || falla.docktestUa) && <Usb size={14} color="#3b82f6" />}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div key={pasoActual.id} initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -10 }} transition={{ duration: 0.4 }} style={{ ...estilos.tarjetaCristal, ...t.cristalBg, ...t.bordeFantasma }}>
            <div style={estilos.seccionTitulo}>
              <span style={{ ...estilos.etiquetaPaso, color: '#0058bc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                PASO {String(historial.length + 1).padStart(2, '0')}
                {tieneTips && (<motion.button onClick={() => { setNotaVisible(true); setTipVisto(true); setTipTabActiva(0); }} animate={!tipVisto ? { scale: [1, 1.1, 1], boxShadow: ["0px 0px 0px rgba(234, 179, 8, 0)", "0px 0px 15px rgba(234, 179, 8, 0.7)", "0px 0px 0px rgba(234, 179, 8, 0)"] } : { scale: 1, boxShadow: "none" }} transition={!tipVisto ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }} style={estilos.btnBombillo} title="Wiki Técnica"><Lightbulb size={16} color="#a16207" /> <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#a16207' }}>TIPS ({arrayTips.length})</span></motion.button>)}
                {pasoActual.imgUrl && (<button onClick={() => setImgModalVisible(true)} style={estilos.btnImgFlotante} title="Ver Imagen"><Camera size={16} color="white" /> <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'white' }}>{pasoActual.imgTipo === 'microscopio' ? 'FOTO' : 'PLANO'}</span></button>)}
                {pasoActual.videoUrl && (<button onClick={() => setVideoModalVisible(true)} style={{ ...estilos.btnImgFlotante, background: '#ef4444', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }} title="Ver Video"><Play size={16} color="white" /> <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'white' }}>VIDEO</span></button>)}
              </span>
              <h2 style={{ ...estilos.tituloPregunta, ...t.textoPrincipal }}>{pasoActual.pregunta}</h2>
            </div>

            {(pasoActual.simVoltaje || pasoActual.simAmperaje) && (<SimuladorFuente voltaje={pasoActual.simVoltaje} amperaje={pasoActual.simAmperaje} />)}

            {pasoActual.esFinal ? (
              <div style={estilos.estadoFinal}><div style={estilos.iconoFinalBg}><ShieldCheck size={48} color="#0058bc" /></div><h3 style={{ ...estilos.textoFinal, ...t.textoPrincipal }}>Diagnóstico Completado</h3><button style={estilos.btnPrimario} onClick={() => { setHistorial([]); cargarPaso('inicio'); }}><RefreshCcw size={18} style={{ marginRight: '8px' }} /> Iniciar Nueva Evaluación</button></div>
            ) : (
              <div style={estilos.gridOpciones}>
                {pasoActual.opciones?.map((opcion, index) => (
                  <motion.button key={index} whileHover={{ scale: 1.02, backgroundColor: t.hoverBg }} whileTap={{ scale: 0.98 }} style={{ ...estilos.btnOpcion, ...t.bordeFantasma, ...t.cristalBgItem }} onClick={() => cargarPaso(opcion.siguientePaso)}>
                    <div style={estilos.opcionContenido}><div style={estilos.iconoCirculo}>{obtenerIconoDinamico(opcion.texto)}</div><div style={estilos.textosOpcion}><span style={{ ...estilos.tituloOpcion, ...t.textoPrincipal }}>{limpiarTexto(opcion.texto)}</span><span style={{ ...estilos.descOpcion, ...t.textoSutil }}>Toque para continuar</span></div></div><ChevronRight size={20} style={{ color: '#0058bc', opacity: 0.5 }} />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* WIKI TÉCNICA (TIPS CON PESTAÑAS) */}
      <AnimatePresence>
        {notaVisible && tieneTips && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma, maxWidth: '700px' }}>
              <div style={{ ...estilos.modalHeader, backgroundColor: '#fef08a', borderBottom: '1px solid #fde047' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#854d0e' }}>
                  <Lightbulb size={24} />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Wiki Técnica</h3>
                </div>
                <button onClick={() => setNotaVisible(false)} style={{ ...estilos.btnCerrar, color: '#854d0e' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
                <div style={{ display: 'flex', overflowX: 'auto', borderBottom: t.bordeFantasma.border, backgroundColor: 'rgba(0,0,0,0.03)', scrollbarWidth: 'none' }}>
                  {arrayTips.map((tab, index) => (
                    <button
                      key={index}
                      onClick={() => setTipTabActiva(index)}
                      style={{
                        padding: '14px 24px',
                        border: 'none',
                        background: 'none',
                        borderBottom: tipTabActiva === index ? '3px solid #eab308' : '3px solid transparent',
                        color: tipTabActiva === index ? '#ca8a04' : t.textoSutil.color,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}>
                      {tab.titulo}
                    </button>
                  ))}
                </div>
                <div style={{ padding: '25px', overflowY: 'auto', flex: 1, color: t.textoPrincipal.color, lineHeight: '1.6', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                  {arrayTips[tipTabActiva]?.contenido}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: BITÁCORA */}
      <AnimatePresence>
        {bitacoraVisible && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma }}>
              <div style={estilos.modalHeader}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ClipboardList size={24} color="#10b981" /><h3 style={{ margin: 0, ...t.textoPrincipal, fontSize: '1.2rem' }}>{casoEditando ? 'Editar Caso' : 'Nueva Bitácora'}</h3></div><button onClick={() => setBitacoraVisible(false)} style={estilos.btnCerrar}><X size={24} color={t.textoSutil.color} /></button></div>
              <div style={estilos.modalBody}>
                <form onSubmit={guardarBitacora} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}><div style={{ flex: 1 }}><label style={{ ...estilos.labelForm, ...t.textoPrincipal }}>Marca *</label><input required type="text" placeholder="Ej: Samsung" style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} value={formCaso.marca} onChange={(e) => setFormCaso({ ...formCaso, marca: e.target.value })} /></div><div style={{ flex: 1 }}><label style={{ ...estilos.labelForm, ...t.textoPrincipal }}>Modelo *</label><input required type="text" placeholder="Ej: Galaxy A54" style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} value={formCaso.modelo} onChange={(e) => setFormCaso({ ...formCaso, modelo: e.target.value })} /></div></div>
                  <div><label style={{ ...estilos.labelForm, ...t.textoPrincipal }}>Síntomas *</label><textarea required style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma, minHeight: '60px' }} value={formCaso.sintomas} onChange={(e) => setFormCaso({ ...formCaso, sintomas: e.target.value })} /></div>
                  <div><label style={{ ...estilos.labelForm, ...t.textoPrincipal }}>Protocolo / Diagnóstico</label><textarea style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma, minHeight: '60px' }} value={formCaso.protocolo} onChange={(e) => setFormCaso({ ...formCaso, protocolo: e.target.value })} /></div>
                  <div>
                    <label style={{ ...estilos.labelForm, ...t.textoPrincipal }}>Enlace Imagen (Opcional - Recomendado Postimages)</label>
                    <input type="text" placeholder="https://i.postimg.cc/..." style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} value={formCaso.imgUrl} onChange={(e) => setFormCaso({ ...formCaso, imgUrl: e.target.value })} />
                  </div>
                  {mensajeCaso && <p style={{ color: mensajeCaso.includes('❌') || mensajeCaso.includes('⚠️') ? '#ef4444' : '#10b981', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>{mensajeCaso}</p>}
                  <button type="submit" style={{ ...estilos.btnPrimarioGuardar, background: '#10b981', justifyContent: 'center', padding: '15px' }}><Save size={20} style={{ marginRight: '8px' }} /> {casoEditando ? 'Actualizar Caso' : 'Guardar Caso en Historial'}</button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: HISTORIAL */}
      <AnimatePresence>
        {historialCasosVisible && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, maxWidth: '800px', ...t.fondoPrincipal, ...t.bordeFantasma }}>
              <div style={estilos.modalHeader}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><History size={24} color="#0058bc" /><h3 style={{ margin: 0, ...t.textoPrincipal, fontSize: '1.2rem' }}>Historial</h3></div><button onClick={() => setHistorialCasosVisible(false)} style={estilos.btnCerrar}><X size={24} color={t.textoSutil.color} /></button></div>
              <div style={{ ...estilos.modalBody, padding: '15px' }}>
                {casosGuardados.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px', color: t.textoSutil.color }}><FileText size={48} style={{ opacity: 0.5, marginBottom: '10px' }} /><p>No hay casos registrados aún.</p></div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>{casosGuardados.map(caso => (<div key={caso.id} style={{ backgroundColor: t.cristalBgItem.backgroundColor, border: t.bordeFantasma.border, borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><h4 style={{ margin: '0 0 5px 0', ...t.textoPrincipal, fontSize: '1.1rem' }}>{caso.marca} {caso.modelo}</h4><span style={{ fontSize: '0.75rem', color: t.textoSutil.color }}>Ingreso: {new Date(caso.fecha).toLocaleDateString()}</span></div><div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => abrirReporte(caso)} style={{ ...estilos.btnAccionLista, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '5px 12px', display: 'flex', gap: '5px', alignItems: 'center' }} title="Ver Reporte"><FileText size={16} /> <span>Reporte</span></button>
                  <button onClick={() => { setHistorialCasosVisible(false); editarCasoExistente(caso); }} style={{ ...estilos.btnAccionLista, backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }} title="Editar"><Edit size={18} /></button><button onClick={() => eliminarCaso(caso.id)} style={{ ...estilos.btnAccionLista, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} title="Eliminar"><Trash2 size={18} /></button></div></div><div style={{ fontSize: '0.85rem', ...t.textoPrincipal, backgroundColor: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '8px' }}><strong>Síntoma:</strong> {caso.sintomas}</div>{caso.protocolo && <div style={{ fontSize: '0.85rem', ...t.textoPrincipal }}><strong>Diagnóstico:</strong> {caso.protocolo}</div>}</div>))}</div>)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reporteVisible && casoReporte && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ ...estilos.modalOverlay, backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', height: '90vh' }}>
              <div className="no-print" style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'flex-end', padding: '10px 0' }}>
                <button onClick={enviarWhatsApp} style={{ background: '#25D366', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)' }}><MessageCircle size={20} /> WhatsApp</button>
                <button onClick={imprimirReporte} style={{ background: '#0058bc', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0, 88, 188, 0.3)' }}><Printer size={20} /> Imprimir / PDF nativo</button>
                <button onClick={() => setReporteVisible(false)} style={{ background: '#374151', color: 'white', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, width: '100%', overflowY: 'auto', borderRadius: '8px' }}>
                <div id="seccion-reporte" style={{ backgroundColor: 'white', width: '100%', maxWidth: '210mm', minHeight: '297mm', margin: '0 auto', padding: '40px', boxSizing: 'border-box', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', color: '#111827', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ textAlign: 'center', borderBottom: '3px solid #0058bc', paddingBottom: '20px', marginBottom: '30px' }}><h1 style={{ color: '#0058bc', margin: 0, fontSize: '28px', textTransform: 'uppercase', letterSpacing: '2px' }}>MARSHALL CELL</h1><h2 style={{ color: '#4b5563', margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'normal' }}>Reporte Técnico Oficial de Diagnóstico</h2></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}><div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><strong style={{ color: '#111827', display: 'block', marginBottom: '5px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Fecha de Ingreso</strong><p style={{ margin: 0, fontSize: '15px' }}>{new Date(casoReporte.fecha).toLocaleDateString()}</p></div><div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><strong style={{ color: '#111827', display: 'block', marginBottom: '5px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>ID de Caso</strong><p style={{ margin: 0, fontSize: '15px' }}>#{casoReporte.id.substring(0, 8).toUpperCase()}</p></div><div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><strong style={{ color: '#111827', display: 'block', marginBottom: '5px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Marca</strong><p style={{ margin: 0, fontSize: '15px' }}>{casoReporte.marca}</p></div><div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><strong style={{ color: '#111827', display: 'block', marginBottom: '5px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Modelo</strong><p style={{ margin: 0, fontSize: '15px' }}>{casoReporte.modelo}</p></div></div>
                  <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}><strong style={{ color: '#111827', display: 'block', marginBottom: '5px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Síntomas Reportados</strong><p style={{ margin: 0, fontSize: '15px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{casoReporte.sintomas}</p></div>
                  <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><strong style={{ color: '#111827', display: 'block', marginBottom: '5px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Protocolo de Reparación / Diagnóstico</strong><p style={{ margin: 0, fontSize: '15px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{casoReporte.protocolo || 'Pendiente de evaluación técnica profunda.'}</p></div>
                  {casoReporte.imgUrl && (<div style={{ marginTop: '30px', textAlign: 'center', background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><strong style={{ color: '#111827', display: 'block', marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Evidencia Técnica Adjunta</strong><img src={casoReporte.imgUrl} alt="Evidencia" referrerPolicy="no-referrer" style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', objectFit: 'contain' }} /></div>)}
                  <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>Generado por Marshall Cell CRM<br />Laboratorio de Microelectrónica - Oropesa, Cusco, Perú</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{imgModalVisible && pasoActual.imgUrl && (<motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay} onClick={() => setImgModalVisible(false)}><motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={estilos.visualizadorContenedor} onClick={(e) => e.stopPropagation()}><div style={estilos.visualizadorHeader}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{pasoActual.imgTipo === 'microscopio' ? <Camera size={20} color="white" /> : <Map size={20} color="white" />}<span style={{ color: 'white', fontWeight: 'bold' }}>{pasoActual.imgTipo === 'microscopio' ? 'Vista' : 'Plano'}</span></div><button onClick={() => setImgModalVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="white" /></button></div><div style={estilos.visualizadorCuerpo}><img src={pasoActual.imgUrl} alt="Visualización técnica" referrerPolicy="no-referrer" style={estilos.imagenTecnica} /></div><div style={estilos.visualizadorFooter}>Tip: Usa el zoom de tu pantalla para ver detalles.</div></motion.div></motion.div>)}</AnimatePresence>
      <AnimatePresence>{videoModalVisible && pasoActual.videoUrl && (<motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay} onClick={() => setVideoModalVisible(false)}><motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ ...estilos.visualizadorContenedor, maxWidth: '800px', height: 'auto', aspectRatio: '16/9' }} onClick={(e) => e.stopPropagation()}><div style={{ ...estilos.visualizadorHeader, borderBottom: 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Play size={20} color="white" /><span style={{ color: 'white', fontWeight: 'bold' }}>Video</span></div><button onClick={() => setVideoModalVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="white" /></button></div><div style={{ flex: 1, backgroundColor: '#000', width: '100%', height: '100%' }}><iframe width="100%" height="100%" src={obtenerUrlVideo(pasoActual.videoUrl)} title="YouTube" frameBorder="0" allowFullScreen style={{ display: 'block' }}></iframe></div></motion.div></motion.div>)}</AnimatePresence>
      <AnimatePresence>{tieneDocktest && (<motion.button className="no-print" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} onClick={() => setPanelMedicionVisible(true)} style={{ position: 'fixed', right: 0, top: '40%', transform: 'translateY(-50%)', backgroundColor: dockViewTab === 'diodo' ? '#3b82f6' : '#10b981', color: 'white', border: 'none', padding: '15px 10px 15px 15px', borderRadius: '15px 0 0 15px', cursor: 'pointer', zIndex: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', boxShadow: `-5px 0 15px ${dockViewTab === 'diodo' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)'}` }}><motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Usb size={24} /></motion.div><span style={{ fontSize: '0.7rem', fontWeight: 'bold', writingMode: 'vertical-rl', transform: 'rotate(180deg)', marginTop: '5px' }}>DOCKTEST</span></motion.button>)}</AnimatePresence>
      <AnimatePresence>{panelMedicionVisible && tieneDocktest && (<><motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1999 }} onClick={() => setPanelMedicionVisible(false)} /><motion.div className="no-print" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '320px', backgroundColor: t.fondoPrincipal.backgroundColor, borderLeft: t.bordeFantasma.border, zIndex: 2000, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.2)' }}><div style={{ padding: '20px', borderBottom: t.bordeFantasma.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: dockViewTab === 'diodo' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Usb size={24} color={dockViewTab === 'diodo' ? '#3b82f6' : '#10b981'} /><h3 style={{ margin: 0, ...t.textoPrincipal, fontSize: '1.1rem' }}>Valores</h3></div><button onClick={() => setPanelMedicionVisible(false)} style={estilos.btnCerrar}><X size={20} color={t.textoSutil.color} /></button></div><div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}><div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '20px', padding: '4px', marginBottom: '20px' }}><button onClick={() => setDockViewTab('diodo')} disabled={!pasoActual.docktestDiodo} style={{ flex: 1, padding: '8px', borderRadius: '16px', border: 'none', backgroundColor: dockViewTab === 'diodo' ? '#3b82f6' : 'transparent', color: dockViewTab === 'diodo' ? 'white' : (pasoActual.docktestDiodo ? t.textoSutil.color : 'rgba(0,0,0,0.2)'), fontWeight: 'bold', cursor: pasoActual.docktestDiodo ? 'pointer' : 'not-allowed' }}>Diodo</button><button onClick={() => setDockViewTab('ua')} disabled={!pasoActual.docktestUa} style={{ flex: 1, padding: '8px', borderRadius: '16px', border: 'none', backgroundColor: dockViewTab === 'ua' ? '#10b981' : 'transparent', color: dockViewTab === 'ua' ? 'white' : (pasoActual.docktestUa ? t.textoSutil.color : 'rgba(0,0,0,0.2)'), fontWeight: 'bold', cursor: pasoActual.docktestUa ? 'pointer' : 'not-allowed' }}>uA</button></div>{currentDockData ? (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{[{ label: 'VBUS', value: currentDockData.vbus, color: '#ef4444' }, { label: 'D-', value: currentDockData.dm, color: dockViewTab === 'diodo' ? '#3b82f6' : '#10b981' }, { label: 'D+', value: currentDockData.dp, color: dockViewTab === 'diodo' ? '#3b82f6' : '#10b981' }, { label: 'CC1', value: currentDockData.cc1, color: '#eab308' }, { label: 'CC2', value: currentDockData.cc2, color: '#eab308' }, { label: 'GND', value: '0.000', color: '#6b7280' }].map((pin, i) => pin.value ? (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', backgroundColor: t.cristalBgItem.backgroundColor, borderRadius: '10px', border: t.bordeFantasma.border }}><span style={{ fontWeight: 'bold', color: pin.color, fontSize: '1.1rem' }}>{pin.label}</span><span style={{ fontWeight: '600', ...t.textoPrincipal, fontSize: '1.1rem' }}>{pin.value} {dockViewTab === 'ua' && pin.label !== 'GND' ? 'uA' : ''}</span></div>) : null)}</div>) : (<p style={{ textAlign: 'center', color: t.textoSutil.color }}>Sin datos.</p>)}</div></motion.div></>)}</AnimatePresence>

      <nav className="no-print" style={{ ...estilos.navInferior, ...t.cristalBgNav, ...t.bordeFantasmaTop }}><div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>{historial.length > 0 && <button style={{ ...estilos.navBtn, ...t.textoSutil }} onClick={irAtras}><ArrowLeft size={24} /> <span style={estilos.navLabel}>BACK</span></button>}</div><button style={estilos.navBtnCentro} onClick={() => { setHistorial([]); cargarPaso('inicio'); }}><Home size={24} color="white" /></button><div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}><button style={{ ...estilos.navBtn, ...t.textoSutil }} onClick={abrirAdmin}><Settings size={24} /> <span style={estilos.navLabel}>ADMIN</span></button></div></nav>

      {/* MODAL ADMIN */}
      <AnimatePresence>
        {mostrarAdmin && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma }}>
              <div style={estilos.modalHeader}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{vistaAdmin === 'formulario' && <button onClick={() => setVistaAdmin('lista')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0058bc' }}><ArrowLeft size={20} /></button>}<h3 style={{ ...estilos.modalTitulo, ...t.textoPrincipal }}>{vistaAdmin === 'login' ? '🔐 Acceso' : vistaAdmin === 'lista' ? '📂 Flujos' : '⚙️ Editar'}</h3></div><div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>{estaAutenticado && vistaAdmin !== 'login' && <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: '#ef4444' }}><LogOut size={20} /></button>}<button onClick={() => setMostrarAdmin(false)} style={{ ...estilos.btnCerrar, ...t.textoSutil }}><X size={24} /></button></div></div>

              {vistaAdmin === 'login' && (<div style={estilos.modalBody}><form onSubmit={iniciarSesion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}><div><label style={estilos.labelForm}>Correo</label><input required type="email" style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)} /></div><div><label style={estilos.labelForm}>Clave</label><input required type="password" style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} value={passAdmin} onChange={(e) => setPassAdmin(e.target.value)} /></div><button type="submit" style={estilos.btnPrimarioGuardar}>Entrar</button></form></div>)}

              {vistaAdmin === 'lista' && (<div style={estilos.modalBody}><div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}><input style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /><button onClick={prepararNuevoPaso} style={estilos.btnPrimarioGuardar}><Plus size={20} /></button></div><div style={estilos.listaContainer}>{listaPasos.length > 0 ? renderArbol('inicio') : <p>Cargando...</p>}</div></div>)}

              {vistaAdmin === 'formulario' && (
                <>
                  <div style={estilos.modalBody}>
                    <label style={estilos.labelForm}>ID y Pregunta</label>
                    <input style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} type="text" value={formId} onChange={(e) => setFormId(e.target.value)} readOnly={formId === 'inicio'} />
                    <textarea style={{ ...estilos.inputForm, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma, minHeight: '60px', marginTop: '5px' }} value={formPregunta} onChange={(e) => setFormPregunta(e.target.value)} />

                    <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.2)', paddingBottom: '10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: formEsFallaSerie ? '10px' : '0' }}><input type="checkbox" id="esFallaSerie" checked={formEsFallaSerie} onChange={(e) => setFormEsFallaSerie(e.target.checked)} /><label htmlFor="esFallaSerie" style={{ ...t.textoPrincipal, fontWeight: 'bold', color: '#f97316', display: 'flex', alignItems: 'center', gap: '5px' }}><Flame size={18} /> ¿Falla en Serie / Crónica?</label></div>{formEsFallaSerie && (<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><input style={estilos.inputFormPequeño} type="text" placeholder="Título corto (Ej: POCO X3 Pro)" value={formTituloSerie} onChange={(e) => setFormTituloSerie(e.target.value)} /><input style={estilos.inputFormPequeño} type="text" placeholder="Descripción breve" value={formDescSerie} onChange={(e) => setFormDescSerie(e.target.value)} /></div>)}</div>
                    <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}><h4 style={{ ...t.textoPrincipal, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6' }}><Camera size={18} /> Imagen / Plano</h4><input style={{ ...estilos.inputFormPequeño, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} type="text" placeholder="URL..." value={formImgUrl} onChange={(e) => setFormImgUrl(e.target.value)} /><div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}><button onClick={(e) => { e.preventDefault(); setFormImgTipo('microscopio') }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: formImgTipo === 'microscopio' ? '#8b5cf6' : 'rgba(0,0,0,0.05)', color: formImgTipo === 'microscopio' ? 'white' : t.textoSutil.color, cursor: 'pointer' }}>📸 Foto</button><button onClick={(e) => { e.preventDefault(); setFormImgTipo('esquema') }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: formImgTipo === 'esquema' ? '#8b5cf6' : 'rgba(0,0,0,0.05)', color: formImgTipo === 'esquema' ? 'white' : t.textoSutil.color, cursor: 'pointer' }}>🗺️ Plano</button></div></div>
                    <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}><h4 style={{ ...t.textoPrincipal, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}><Youtube size={18} /> Video de YouTube</h4><input style={{ ...estilos.inputFormPequeño, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} type="text" placeholder="Enlace..." value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} /></div>
                    <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><h4 style={{ ...t.textoPrincipal, margin: 0, color: '#3b82f6' }}>Docktest</h4><div style={{ display: 'flex', gap: '5px' }}><button onClick={(e) => { e.preventDefault(); setDockAdminTab('diodo') }} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: dockAdminTab === 'diodo' ? '#3b82f6' : 'transparent', color: dockAdminTab === 'diodo' ? 'white' : t.textoSutil.color }}>Diodo</button><button onClick={(e) => { e.preventDefault(); setDockAdminTab('ua') }} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: dockAdminTab === 'ua' ? '#10b981' : 'transparent', color: dockAdminTab === 'ua' ? 'white' : t.textoSutil.color }}>uA</button></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}><input style={estilos.inputFormPequeño} placeholder="VBUS" value={currentDockInputs.vbus} onChange={(e) => handleDockChange('vbus', e.target.value)} /><input style={estilos.inputFormPequeño} placeholder="D+" value={currentDockInputs.dp} onChange={(e) => handleDockChange('dp', e.target.value)} /><input style={estilos.inputFormPequeño} placeholder="D-" value={currentDockInputs.dm} onChange={(e) => handleDockChange('dm', e.target.value)} /><input style={estilos.inputFormPequeño} placeholder="CC1" value={currentDockInputs.cc1} onChange={(e) => handleDockChange('cc1', e.target.value)} /><input style={estilos.inputFormPequeño} placeholder="CC2" value={currentDockInputs.cc2} onChange={(e) => handleDockChange('cc2', e.target.value)} /></div></div>
                    <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}><h4 style={{ ...t.textoPrincipal, margin: '0 0 10px 0', color: '#ef4444' }}>Simulador Fuente</h4><div style={{ display: 'flex', gap: '10px' }}><input style={{ ...estilos.inputFormPequeño, flex: 1 }} type="text" placeholder="Voltaje" value={formSimV} onChange={(e) => setFormSimV(e.target.value)} /><input style={{ ...estilos.inputFormPequeño, flex: 2 }} type="text" placeholder="Amperaje" value={formSimA} onChange={(e) => setFormSimA(e.target.value)} /></div></div>
                    <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}><h4 style={{ ...t.textoPrincipal, margin: '0 0 10px 0', color: '#10b981' }}>Tabla</h4>{formTabla.map((fila, index) => (<div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><input style={{ ...estilos.inputFormPequeño, flex: 0.35 }} type="text" placeholder="Valor" value={fila.valor} onChange={(e) => handleCambioFilaTabla(index, 'valor', e.target.value)} /><input style={{ ...estilos.inputFormPequeño, flex: 0.65 }} type="text" placeholder="Diagnóstico" value={fila.descripcion} onChange={(e) => handleCambioFilaTabla(index, 'descripcion', e.target.value)} /><button onClick={(e) => { e.preventDefault(); handleQuitarFilaTabla(index) }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button></div>))}<button onClick={(e) => { e.preventDefault(); handleAgregarFilaTabla() }} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 'bold', cursor: 'pointer' }}>+ Fila</button></div>

                    <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                      <h4 style={{ ...t.textoPrincipal, margin: '0 0 10px 0', color: '#eab308', display: 'flex', alignItems: 'center', gap: '6px' }}><Lightbulb size={18} /> Wiki Técnica (Tips)</h4>
                      {formTabsNota.map((tab, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input style={{ ...estilos.inputFormPequeño, flex: 1, fontWeight: 'bold' }} placeholder="Título (Ej: Teoría, Precaución)" value={tab.titulo} onChange={(e) => { const n = [...formTabsNota]; n[index].titulo = e.target.value; setFormTabsNota(n); }} />
                            <button onClick={(e) => { e.preventDefault(); const n = [...formTabsNota]; n.splice(index, 1); setFormTabsNota(n); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                          </div>
                          <textarea style={{ ...estilos.inputForm, minHeight: '60px' }} placeholder="Contenido del tip..." value={tab.contenido} onChange={(e) => { const n = [...formTabsNota]; n[index].contenido = e.target.value; setFormTabsNota(n); }} />
                        </div>
                      ))}
                      <button onClick={(e) => { e.preventDefault(); setFormTabsNota([...formTabsNota, { titulo: 'Nueva Pestaña', contenido: '' }]); }} style={estilos.btnAgregarOp}><Plus size={18} /> Agregar Pestaña</button>
                    </div>

                    <div style={estilos.checkboxGroup}><input type="checkbox" id="esFinal" checked={formEsFinal} onChange={(e) => setFormEsFinal(e.target.checked)} /><label htmlFor="esFinal" style={{ ...t.textoPrincipal, fontWeight: '600' }}>¿Final?</label></div>
                    {!formEsFinal && (<div style={estilos.opcionesContainer}><h4 style={{ ...t.textoPrincipal, marginBottom: '10px' }}>Opciones:</h4>{formOpciones.map((op, index) => (<div key={index} style={estilos.opcionRow}><div style={{ flex: 1 }}><input style={{ ...estilos.inputFormPequeño, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma }} type="text" placeholder="Texto" value={op.texto} onChange={(e) => handleCambioOpcion(index, 'texto', e.target.value)} /><input style={{ ...estilos.inputFormPequeño, ...t.cristalBgItem, ...t.textoPrincipal, ...t.bordeFantasma, marginTop: '4px' }} type="text" placeholder="ID Sig." value={op.siguientePaso} onChange={(e) => handleCambioOpcion(index, 'siguientePaso', e.target.value.replace(/\s+/g, '_').toLowerCase())} /></div><button onClick={(e) => { e.preventDefault(); handleQuitarOpcion(index) }} style={estilos.btnBorrarOp}><Trash2 size={20} color="#ef4444" /></button></div>))}<button onClick={(e) => { e.preventDefault(); handleAgregarOpcion() }} style={estilos.btnAgregarOp}><Plus size={18} /> Agregar</button></div>)}
                    {mensajeAdmin && <p style={{ color: mensajeAdmin.includes('❌') ? '#ef4444' : '#22c55e', fontWeight: 'bold', textAlign: 'center' }}>{mensajeAdmin}</p>}
                  </div>
                  <div style={estilos.modalFooter}><button onClick={guardarPasoFirebase} style={estilos.btnPrimarioGuardar}><Save size={18} /> Guardar</button></div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const estilos = {
  contenedor: { minHeight: '100vh', paddingBottom: '100px', display: 'flex', flexDirection: 'column' },
  header: { padding: '16px 0' }, headerInner: { display: 'flex', justifyContent: 'space-between', padding: '0 24px', alignItems: 'center' }, logoTexto: { fontSize: '0.8rem', fontWeight: '800' }, lineaAcento: { height: '3px', width: '30%', background: '#0058bc' },
  main: { flex: 1, padding: '40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }, tarjetaCristal: { width: '100%', borderRadius: '2rem', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  seccionTitulo: { textAlign: 'center', marginBottom: '30px', position: 'relative' }, etiquetaPaso: { fontSize: '0.7rem', fontWeight: '800', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }, tituloPregunta: { fontSize: '1.8rem', fontWeight: '800' },
  gridOpciones: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', width: '100%' }, btnOpcion: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderRadius: '1.2rem', cursor: 'pointer' }, opcionContenido: { display: 'flex', alignItems: 'center', gap: '12px' }, iconoCirculo: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }, tituloOpcion: { fontSize: '1rem', fontWeight: '700' }, descOpcion: { fontSize: '0.75rem' },
  btnPrimario: { background: '#0058bc', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  navInferior: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 }, navBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }, navLabel: { fontSize: '0.6rem', fontWeight: '700' }, navBtnCentro: { width: '50px', height: '50px', borderRadius: '50%', background: '#0058bc', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transform: 'translateY(-10px)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }, modalCard: { width: '100%', maxWidth: '600px', maxHeight: '90vh', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, modalHeader: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, modalTitulo: { margin: 0, fontSize: '1rem' }, btnCerrar: { background: 'none', border: 'none', cursor: 'pointer' }, modalBody: { padding: '20px', overflowY: 'auto', flex: 1 }, listaContainer: { display: 'flex', flexDirection: 'column', gap: '10px' }, listaItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '10px' }, btnAccionLista: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '8px' }, labelForm: { fontSize: '0.8rem', fontWeight: '600' }, inputForm: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid transparent', outline: 'none' }, inputFormPequeño: { width: '100%', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }, opcionesContainer: { padding: '15px', borderRadius: '12px', marginTop: '10px' }, modalFooter: { padding: '15px', display: 'flex', justifyContent: 'flex-end' }, btnPrimarioGuardar: { background: '#0058bc', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  btnBombillo: { backgroundColor: '#fef08a', border: '1px solid #eab308', borderRadius: '20px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }, checkboxGroup: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', marginTop: '10px' }, opcionRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }, btnBorrarOp: { background: 'none', border: 'none', cursor: 'pointer' }, btnAgregarOp: { background: 'none', border: 'none', color: '#0058bc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }, btnImgFlotante: { background: '#8b5cf6', border: 'none', borderRadius: '20px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)' }, visualizadorContenedor: { width: '95vw', maxWidth: '1000px', height: '80vh', backgroundColor: '#111827', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #374151' }, visualizadorHeader: { padding: '15px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, visualizadorCuerpo: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '10px', backgroundColor: '#000' }, imagenTecnica: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }, visualizadorFooter: { padding: '10px', textAlign: 'center', color: '#6b7280', fontSize: '0.8rem', borderTop: '1px solid #374151' }, carruselFallas: { display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'thin' }, tarjetaFallaSerie: { minWidth: '220px', padding: '15px', borderRadius: '1rem', border: '1px solid rgba(249, 115, 22, 0.3)', cursor: 'pointer', display: 'flex', flexDirection: 'column', textAlign: 'left', borderLeft: '4px solid #f97316' }, fallaSerieHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }, fallaSerieTitulo: { fontWeight: 'bold', fontSize: '0.9rem' }, fallaSerieDesc: { fontSize: '0.75rem', margin: 0, lineHeight: '1.3' },
  btnHeader: { padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', outline: 'none' },

  dark: { fondoPrincipal: { backgroundColor: '#2f3034' }, cristalBg: { backgroundColor: 'rgba(47, 48, 52, 0.7)' }, cristalBgItem: { backgroundColor: 'rgba(255, 255, 255, 0.03)' }, cristalBgNav: { backgroundColor: 'rgba(47, 48, 52, 0.85)' }, textoPrincipal: { color: '#ffffff' }, textoSutil: { color: '#9ca3af' }, bordeFantasma: { border: '1px solid rgba(255, 255, 255, 0.08)' }, bordeFantasmaBottom: { borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }, bordeFantasmaTop: { borderTop: '1px solid rgba(255, 255, 255, 0.08)' }, hoverBg: 'rgba(255, 255, 255, 0.06)' },
  light: { fondoPrincipal: { backgroundColor: '#faf9fe' }, cristalBg: { backgroundColor: 'rgba(255, 255, 255, 0.8)' }, cristalBgItem: { backgroundColor: 'rgba(255, 255, 255, 1)' }, cristalBgNav: { backgroundColor: 'rgba(250, 249, 254, 0.85)' }, textoPrincipal: { color: '#111827' }, textoSutil: { color: '#6b7280' }, bordeFantasma: { border: '1px solid rgba(0, 0, 0, 0.05)' }, bordeFantasmaBottom: { borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }, bordeFantasmaTop: { borderTop: '1px solid rgba(0, 0, 0, 0.05)' }, hoverBg: 'rgba(0, 88, 188, 0.02)' }
};