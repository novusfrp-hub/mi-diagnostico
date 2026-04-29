/* eslint-disable */
import useAutoSave from '../hooks/useAutoSave';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, addDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Sun, Moon, ArrowLeft, RefreshCcw, Zap, Smartphone, AlertTriangle, ChevronRight, Home, ShieldCheck, Camera, CheckCircle2, XCircle, Settings, Plus, Save, X, Trash2, Edit, ChevronDown, CornerDownRight, LogOut, Lightbulb, Usb, Map, Play, Flame, ClipboardList, History, Printer, FileText, MessageCircle, Link, Monitor, Mic, MicOff, Cpu, Image as ImageIcon } from 'lucide-react';

import FPCInteligente from '../components/FPCInteligente.js';

const obtenerUrlVideo = (url) => { if (!url) return ''; let v = ''; if (url.includes('youtu.be/')) v = url.split('youtu.be/')[1].split('?')[0]; else if (url.includes('youtube.com/watch')) v = new URLSearchParams(url.split('?')[1]).get('v'); else if (url.includes('youtube.com/embed/')) return url; return v ? `https://www.youtube.com/embed/${v}` : url; };

const VisorHUD = ({ valor, unidad, conectado, conectarFn, desconectarFn, vozActiva, toggleVozFn, autoHoldActivo, toggleAutoHoldFn }) => (
  <div style={{ backgroundColor: '#1a1a1a', border: '2px solid #333333', borderRadius: '15px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px', position: 'relative', overflow: 'hidden', boxShadow: conectado ? '0 0 20px rgba(0, 255, 255, 0.2)' : 'none' }}>
    <div className="tools-row" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
      <span style={{ color: '#555', fontSize: '0.8rem', fontWeight: 'bold' }} className="hide-on-mobile">UT61E+ ANALYZER</span>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <button onClick={conectado ? desconectarFn : conectarFn} style={{ background: conectado ? 'rgba(239, 68, 68, 0.2)' : '#333', color: conectado ? '#ef4444' : 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Link size={14} /> {conectado ? 'DESCONECTAR' : 'CONECTAR USB'}</button>
        <button onClick={toggleVozFn} style={{ background: vozActiva ? 'rgba(234, 179, 8, 0.2)' : '#333', color: vozActiva ? '#eab308' : 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: vozActiva ? '0 0 10px rgba(234,179,8,0.5)' : 'none' }}>{vozActiva ? <Mic size={14} /> : <MicOff size={14} />} VOZ</button>
        <button onClick={toggleAutoHoldFn} style={{ background: autoHoldActivo ? 'rgba(16, 185, 129, 0.2)' : '#333', color: autoHoldActivo ? '#10b981' : 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: autoHoldActivo ? '0 0 10px rgba(16,185,129,0.5)' : 'none' }}><Zap size={14} /> {autoHoldActivo ? 'HOLD ON' : 'HOLD'}</button>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
      <span className="hud-valor-text" style={{ color: valor === 'OL' ? '#ff0000' : '#00ffff', fontSize: '4rem', fontWeight: 'bold', fontFamily: 'Consolas, monospace', textShadow: valor === 'OL' ? '0 0 15px rgba(255,0,0,0.5)' : '0 0 15px rgba(0,255,255,0.4)', lineHeight: '1' }}>{valor}</span>
      <span style={{ color: 'gray', fontSize: '1.2rem', fontWeight: 'bold' }}>{unidad}</span>
    </div>
  </div>
);

export default function AppDiagnostico() {
  const [pasoActual, setPasoActual] = useState(null); const [historial, setHistorial] = useState([]); const [cargando, setCargando] = useState(true); const [tema, setTema] = useState('light');

  // MODALES GLOBALES
  const [mostrarAdmin, setMostrarAdmin] = useState(false); const [vistaAdmin, setVistaAdmin] = useState('login');
  const [estaAutenticado, setEstaAutenticado] = useState(false); const [emailAdmin, setEmailAdmin] = useState(''); const [passAdmin, setPassAdmin] = useState(''); const [errorLogin, setErrorLogin] = useState('');
  const [listaPasos, setListaPasos] = useState([]); const [pasosExpandidos, setPasosExpandidos] = useState({});
  const [notaVisible, setNotaVisible] = useState(false); const [tipTabActiva, setTipTabActiva] = useState(0);
  const [imgModalVisible, setImgModalVisible] = useState(false); const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [fallasEnSerie, setFallasEnSerie] = useState([]);
  const [bitacoraVisible, setBitacoraVisible] = useState(false); const [historialCasosVisible, setHistorialCasosVisible] = useState(false); const [casosGuardados, setCasosGuardados] = useState([]); const [casoEditando, setCasoEditando] = useState(null); const [formCaso, setFormCaso] = useState({ marca: '', modelo: '', sintomas: '', protocolo: '', imgUrl: '' }); const [mensajeCaso, setMensajeCaso] = useState('');
  const [reporteVisible, setReporteVisible] = useState(false); const [casoReporte, setCasoReporte] = useState(null);

  // ESTADOS LIBRERÍA
  const [libreriaVisible, setLibreriaVisible] = useState(false); const [modelosLibreria, setModelosLibreria] = useState([]); const [modeloActivo, setModeloActivo] = useState(null); const [fpcActivo, setFpcActivo] = useState(null); const [formNuevoModelo, setFormNuevoModelo] = useState({ marca: '', nombre: '' }); const [formNuevoFpc, setFormNuevoFpc] = useState({ nombre: '', pines: 40 }); const [seccionLibreria, setSeccionLibreria] = useState('fpc'); 
  const [imagenFpcVisible, setImagenFpcVisible] = useState(false); 
  const [tipoImagenViendo, setTipoImagenViendo] = useState('placa');
  const [modalFpcAbierto, setModalFpcAbierto] = useState(false);

  // ESTADOS MULTÍMETRO
  const [usbConectado, setUsbConectado] = useState(false); const [lecturaUsb, setLecturaUsb] = useState({ valor: '----', unidad: '---' }); const [dispositivoUsb, setDispositivoUsb] = useState(null); const ordenCamposDock = ['vbus', 'dp', 'dm', 'cc1', 'cc2']; const [campoActivoDock, setCampoActivoDock] = useState('vbus'); const [pinActivoFpc, setPinActivoFpc] = useState(1); const [modoFpc, setModoFpc] = useState('crear'); const [escalaFpc, setEscalaFpc] = useState('diodo');
export default function AppDiagnostico() {
  const [pasoActual, setPasoActual] = useState(null);
  // ... todos tus otros useState ...

  // ==========================================
  // AUTO-SAVE HÍBRIDO (localStorage + Firebase)
  // ==========================================
  const {
    cambiosPendientes: cambiosPendientesFpc,
    guardando: guardandoFpc,
    ultimaSincronizacion: ultimaSincFpc,
    sincronizarAhora: sincronizarFpcAhora
  } = useAutoSave(
    fpcActivo ? `fpc_borrador_${modeloActivo?.id}_${fpcActivo.id}` : null,
    fpcActivo,
    guardarModeloActualDB
  );
  // ESTADOS ADMIN
  const [formId, setFormId] = useState(''); const [formPregunta, setFormPregunta] = useState(''); const [formTabsNota, setFormTabsNota] = useState([{ titulo: 'General', contenido: '' }]); const [formEsFinal, setFormEsFinal] = useState(false); const [formOpciones, setFormOpciones] = useState([{ texto: '', siguientePaso: '' }]); const [formImgUrl, setFormImgUrl] = useState(''); const [formImgTipo, setFormImgTipo] = useState('microscopio'); const [formVideoUrl, setFormVideoUrl] = useState(''); const [formEsFallaSerie, setFormEsFallaSerie] = useState(false); const [formTituloSerie, setFormTituloSerie] = useState(''); const [formDescSerie, setFormDescSerie] = useState(''); const [mensajeAdmin, setMensajeAdmin] = useState('');

  // REFERENCIAS INMUTABLES
  const lecturaUsbRef = useRef(lecturaUsb); useEffect(() => { lecturaUsbRef.current = lecturaUsb; }, [lecturaUsb]);
  const libreriaVisibleRef = useRef(libreriaVisible); useEffect(() => { libreriaVisibleRef.current = libreriaVisible; }, [libreriaVisible]);
  const modeloActivoRef = useRef(modeloActivo); useEffect(() => { modeloActivoRef.current = modeloActivo; }, [modeloActivo]);
  const seccionLibreriaRef = useRef(seccionLibreria); useEffect(() => { seccionLibreriaRef.current = seccionLibreria; }, [seccionLibreria]);
  const fpcActivoRef = useRef(fpcActivo); useEffect(() => { fpcActivoRef.current = fpcActivo; }, [fpcActivo]);
  const escalaFpcRef = useRef(escalaFpc); useEffect(() => { escalaFpcRef.current = escalaFpc; }, [escalaFpc]);
  const campoActivoRef = useRef(campoActivoDock); useEffect(() => { campoActivoRef.current = campoActivoDock; }, [campoActivoDock]);
  const pinActivoFpcRef = useRef(pinActivoFpc); useEffect(() => { pinActivoFpcRef.current = pinActivoFpc; }, [pinActivoFpc]);
  const modoFpcRef = useRef(modoFpc); useEffect(() => { modoFpcRef.current = modoFpc; }, [modoFpc]);
  const [autoHoldActivo, setAutoHoldActivo] = useState(false); const autoHoldActivoRef = useRef(autoHoldActivo); useEffect(() => { autoHoldActivoRef.current = autoHoldActivo; }, [autoHoldActivo]);
  const autoHoldValueRef = useRef(null); const autoHoldStartTimeRef = useRef(0); const autoHoldTriggeredRef = useRef(false);

  const reproducirBip = () => { try { const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); const oscillator = audioCtx.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); oscillator.connect(audioCtx.destination); oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.1); } catch (e) { } };

  // GUARDADO UNIVERSAL
  const avanzarPinMagico = (valorForzado = null) => {
    const valVivo = valorForzado || lecturaUsbRef.current.valor; const campoActual = campoActivoRef.current; const mFpc = modoFpcRef.current; const pinAct = pinActivoFpcRef.current;
    if (libreriaVisibleRef.current) {
      const modAct = modeloActivoRef.current; if (!modAct) return;
      let modeloActualizado = { ...modAct }; const seccion = seccionLibreriaRef.current;
      if (seccion === 'docktest') {
        const escala = escalaFpcRef.current; const key = escala === 'diodo' ? 'docktestDiodo' : 'docktestUa';
        if (!modeloActualizado[key]) modeloActualizado[key] = { vbus: '---', dp: '---', dm: '---', cc1: '---', cc2: '---' };
        modeloActualizado[key][campoActual] = valVivo; setModeloActivo(modeloActualizado);
        setCampoActivoDock(prev => { const idx = ordenCamposDock.indexOf(prev); return (idx >= 0 && idx < ordenCamposDock.length - 1) ? ordenCamposDock[idx + 1] : prev; });
      } else if (seccion === 'fpc' && fpcActivoRef.current) {
        const fpcAct = fpcActivoRef.current;
        const nuevosFpcs = modeloActualizado.fpcs.map(fpc => {
          if (fpc.id === fpcAct.id) {
            const nuevosPines = fpc.pines.map(p => { if (p.id === pinAct) return mFpc === 'crear' ? { ...p, valorSano: valVivo } : { ...p, valorActual: valVivo }; return p; });
            const fpcMod = { ...fpc, pines: nuevosPines }; setFpcActivo(fpcMod); return fpcMod;
          } return fpc;
        });
        modeloActualizado.fpcs = nuevosFpcs; setModeloActivo(modeloActualizado);
        setPinActivoFpc(prev => {
          let nextPin = prev + 1;
          while (nextPin <= fpcAct.pines.length) {
            const pinInfo = fpcAct.pines.find(p => p.id === nextPin);
            if (pinInfo && (pinInfo.tipo === 'GND' || pinInfo.tipo === 'NC')) { nextPin++; } else { break; }
          } return nextPin <= fpcAct.pines.length ? nextPin : prev;
        });
      }
    }
  };

  // WEBHID
  const conectarMultimetroUSB = async () => {
    if (typeof navigator === 'undefined' || !navigator.hid) { alert("Navegador no compatible."); return; }
    try {
      const devices = await navigator.hid.requestDevice({ filters: [{ vendorId: 0x1A86, productId: 0xE429 }] });
      if (devices.length === 0) return; const device = devices[0]; await device.open(); setDispositivoUsb(device); setUsbConectado(true);
      device.addEventListener("inputreport", event => {
        const text = new TextDecoder().decode(event.data); let valStr = "---"; let uniStr = "---";
        if (text.includes("OL") || text.includes("?0")) { valStr = "OL"; }
        else {
          const match = text.match(/([-+]?\d+\.\d+)/);
          if (match) { valStr = parseFloat(match[1]).toFixed(3); if (text.includes("V")) uniStr = "V"; else if (text.includes("Ohm") || text.includes("kOhm")) uniStr = "Ω"; else if (text.includes("A") || text.includes("uA")) uniStr = "A"; else uniStr = "Diod"; }
        }
        setLecturaUsb({ valor: valStr, unidad: uniStr });
        if (autoHoldActivoRef.current) {
          const valNum = parseFloat(valStr);
          if (!isNaN(valNum)) {
            if (autoHoldValueRef.current !== null && Math.abs(valNum - autoHoldValueRef.current) <= 0.003) {
              if (!autoHoldTriggeredRef.current && Date.now() - autoHoldStartTimeRef.current >= 1500) { autoHoldTriggeredRef.current = true; reproducirBip(); avanzarPinMagico(valStr); }
            } else { autoHoldValueRef.current = valNum; autoHoldStartTimeRef.current = Date.now(); autoHoldTriggeredRef.current = false; }
          } else { autoHoldValueRef.current = null; autoHoldTriggeredRef.current = false; }
        }
      });
    } catch (error) { alert("Error USB."); }
  };
  const desconectarMultimetroUSB = async () => { if (dispositivoUsb) { try { await dispositivoUsb.close(); } catch (e) { } setDispositivoUsb(null); } setUsbConectado(false); setLecturaUsb({ valor: '----', unidad: '---' }); };

  useEffect(() => { const handleKeyDown = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; if ((e.code === 'Space' || e.key === 'Enter') && libreriaVisible) { e.preventDefault(); avanzarPinMagico(); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [libreriaVisible]);

  // VOZ
  const [vozActiva, setVozActiva] = useState(false); const recognitionRef = useRef(null); const vozActivaRef = useRef(vozActiva); useEffect(() => { vozActivaRef.current = vozActiva; }, [vozActiva]);
  const toggleVoz = () => {
    if (typeof window === 'undefined') return; const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) { alert("Navegador no soporta voz."); return; }
    if (vozActiva) { if (recognitionRef.current) { recognitionRef.current.onend = null; recognitionRef.current.stop(); } setVozActiva(false); }
    else {
      const recognition = new SpeechRecognition(); recognition.continuous = true; recognition.lang = 'es-PE'; recognition.interimResults = false;
      recognition.onresult = (event) => { const transcript = event.results[event.resultIndex][0].transcript.toLowerCase().trim(); if (transcript.includes('ok') || transcript.includes('okay') || transcript.includes('siguiente') || transcript.includes('listo') || transcript.includes('ya')) { reproducirBip(); avanzarPinMagico(); } };
      recognition.onend = () => { if (vozActivaRef.current) try { recognition.start() } catch (e) { } }; recognition.start(); recognitionRef.current = recognition; setVozActiva(true);
    }
  };

  // PWA INSTALL
  const [deferredPrompt, setDeferredPrompt] = useState(null); const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  useEffect(() => {
    const handleBip = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallPrompt(true); };
    window.addEventListener('beforeinstallprompt', handleBip);
    return () => window.removeEventListener('beforeinstallprompt', handleBip);
  }, []);
  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => { setDeferredPrompt(null); setShowInstallPrompt(false); });
    }
  };

  // LIBRERÍA CRUD
  const cargarLibreriaDB = async () => { try { const qs = await getDocs(collection(db, "hardware_db")); const arr = []; qs.forEach(doc => arr.push({ id: doc.id, ...doc.data() })); setModelosLibreria(arr); } catch (error) { } };
  const crearNuevoModeloDB = async (e) => { e.preventDefault(); if (!formNuevoModelo.marca || !formNuevoModelo.nombre) return; const idUnico = `${formNuevoModelo.marca}_${formNuevoModelo.nombre}`.toLowerCase().replace(/\s+/g, '_'); const nuevoObj = { marca: formNuevoModelo.marca, nombre: formNuevoModelo.nombre, fpcs: [], docktestDiodo: { vbus: '---', dp: '---', dm: '---', cc1: '---', cc2: '---' }, docktestUa: { vbus: '---', dp: '---', dm: '---', cc1: '---', cc2: '---' } }; await setDoc(doc(db, "hardware_db", idUnico), nuevoObj); setFormNuevoModelo({ marca: '', nombre: '' }); cargarLibreriaDB(); setModeloActivo({ ...nuevoObj, id: idUnico }); };
  const guardarModeloActualDB = async () => { if (!modeloActivo) return; await setDoc(doc(db, "hardware_db", modeloActivo.id), modeloActivo); alert("¡Placa guardada en la nube de Marshall Cell!"); cargarLibreriaDB(); };
  
  const crearNuevoFpcEnModelo = () => { if (!formNuevoFpc.nombre || formNuevoFpc.pines <= 0) return; const pinesArray = Array.from({ length: parseInt(formNuevoFpc.pines) }, (_, i) => ({ id: i + 1, nombre: `Linea_${i + 1}`, valorSano: '---', valorActual: '---', tipo: 'DATA' })); const nuevoFpc = { id: Date.now().toString(), nombre: formNuevoFpc.nombre.replace(/ /g, '_'), pines: pinesArray, imgPlaca: '', imgEsquema: '' }; const modActualizado = { ...modeloActivo, fpcs: [...modeloActivo.fpcs, nuevoFpc] }; setModeloActivo(modActualizado); setFpcActivo(nuevoFpc); setFormNuevoFpc({ nombre: '', pines: 40 }); setPinActivoFpc(1); };
  
  const eliminarFpcActivo = () => { if (!fpcActivo || !window.confirm(`¿Seguro de eliminar el FPC ${fpcActivo.nombre}?`)) return; const modActualizado = { ...modeloActivo, fpcs: modeloActivo.fpcs.filter(f => f.id !== fpcActivo.id) }; setModeloActivo(modActualizado); setFpcActivo(null); setPinActivoFpc(1); };
  const editarPinesFpcActivo = () => { if (!fpcActivo) return; const newCount = window.prompt("Ingresa el nuevo número total de pines:", fpcActivo.pines.length); if (!newCount || isNaN(newCount) || parseInt(newCount) <= 0) return; const count = parseInt(newCount); let nuevosPines = [...fpcActivo.pines]; if (count > nuevosPines.length) { for (let i = nuevosPines.length + 1; i <= count; i++) { nuevosPines.push({ id: i, nombre: `Linea_${i}`, valorSano: '---', valorActual: '---', tipo: 'DATA' }); } } else if (count < nuevosPines.length) { if (!window.confirm(`Se eliminarán ${nuevosPines.length - count} pines del final. ¿Continuar?`)) return; nuevosPines = nuevosPines.slice(0, count); } const fpcMod = { ...fpcActivo, pines: nuevosPines }; setFpcActivo(fpcMod); setModeloActivo(prev => ({ ...prev, fpcs: prev.fpcs.map(f => f.id === fpcMod.id ? fpcMod : f) })); if (pinActivoFpc > count) setPinActivoFpc(1); };
  
  const editarUbicacionFpc = (tipo) => { 
    if (!fpcActivo) return; 
    const actual = tipo === 'placa' ? fpcActivo.imgPlaca : fpcActivo.imgEsquema;
    const nuevaUrl = window.prompt(`Ingresa el enlace de la imagen (${tipo}):`, actual || ""); 
    if (nuevaUrl !== null) { 
        const fpcMod = { ...fpcActivo, [tipo === 'placa' ? 'imgPlaca' : 'imgEsquema']: nuevaUrl }; 
        setFpcActivo(fpcMod); 
        setModeloActivo(prev => ({ ...prev, fpcs: prev.fpcs.map(f => f.id === fpcMod.id ? fpcMod : f) })); 
    } 
  };

  const abrirLibreria = () => { setLibreriaVisible(true); cargarLibreriaDB(); };

  // DIAGNÓSTICO BÁSICO (Flujos)
  const cargarFallasEnSerie = async () => { try { const qs = await getDocs(collection(db, "pasos")); const fallas = []; qs.forEach((doc) => { if (doc.data().esFallaEnSerie) fallas.push({ id: doc.id, ...doc.data() }); }); setFallasEnSerie(fallas); } catch (e) { } };
  const cargarPaso = async (idPaso, esRetroceso = false) => { setCargando(true); try { const respuesta = await fetch(`/api/diagnostico?paso=${idPaso}`); const datos = await respuesta.json(); setPasoActual((prev) => { if (!esRetroceso && prev) setHistorial(prevHist => [...prevHist, prev.id]); return datos; }); setNotaVisible(false); setImgModalVisible(false); setVideoModalVisible(false); } catch (error) { } setCargando(false); };
  const irAtras = () => { setHistorial(prev => { if (prev.length === 0) return prev; const nuevo = [...prev]; const anterior = nuevo.pop(); cargarPaso(anterior, true); return nuevo; }); };
  const toggleTema = () => setTema(tema === 'light' ? 'dark' : 'light');
  useEffect(() => { cargarPaso('inicio'); cargarFallasEnSerie(); }, []);

  // AUTH Y ADMIN
  const iniciarSesion = async (e) => { e.preventDefault(); setErrorLogin(''); try { await signInWithEmailAndPassword(auth, emailAdmin, passAdmin); setEstaAutenticado(true); setVistaAdmin('lista'); cargarTodosLosPasos(); } catch (error) { setErrorLogin('❌ Error.'); } };
  const cerrarSesion = async () => { await signOut(auth); setEstaAutenticado(false); setMostrarAdmin(false); };
  const cargarTodosLosPasos = async () => { try { const qs = await getDocs(collection(db, "pasos")); const arr = []; qs.forEach((doc) => arr.push({ id: doc.id, ...doc.data() })); setListaPasos(arr); } catch (e) { } };
  const abrirAdmin = () => { setMostrarAdmin(true); if (estaAutenticado) { setVistaAdmin('lista'); cargarTodosLosPasos(); } else { setVistaAdmin('login'); } };

  const prepararNuevoPaso = () => { setFormId(''); setFormPregunta(''); setFormTabsNota([{ titulo: 'General', contenido: '' }]); setFormEsFinal(false); setFormOpciones([{ texto: '', siguientePaso: '' }]); setFormImgUrl(''); setFormImgTipo('microscopio'); setFormVideoUrl(''); setFormEsFallaSerie(false); setFormTituloSerie(''); setFormDescSerie(''); setMensajeAdmin(''); setVistaAdmin('formulario'); };
  const editarPaso = (paso) => { setFormId(paso.id); setFormPregunta(paso.pregunta || ''); if (paso.tabsNota && paso.tabsNota.length > 0) setFormTabsNota(paso.tabsNota); else setFormTabsNota([{ titulo: 'General', contenido: '' }]); setFormEsFinal(!!paso.esFinal); setFormOpciones(paso.opciones || [{ texto: '', siguientePaso: '' }]); setFormImgUrl(paso.imgUrl || ''); setFormImgTipo(paso.imgTipo || 'microscopio'); setFormVideoUrl(paso.videoUrl || ''); setFormEsFallaSerie(!!paso.esFallaEnSerie); setFormTituloSerie(paso.tituloFallaSerie || ''); setFormDescSerie(paso.descFallaSerie || ''); setMensajeAdmin(''); setVistaAdmin('formulario'); };
  const eliminarPaso = async (id) => { if (id === 'inicio') return; if (window.confirm(`¿Eliminar "${id}"?`)) { try { await deleteDoc(doc(db, "pasos", id)); cargarTodosLosPasos(); cargarFallasEnSerie(); } catch (error) { alert("Error"); } } };
  const handleAgregarOpcion = () => setFormOpciones([...formOpciones, { texto: '', siguientePaso: '' }]); const handleQuitarOpcion = (index) => { const nuevas = [...formOpciones]; nuevas.splice(index, 1); setFormOpciones(nuevas); }; const handleCambioOpcion = (index, campo, valor) => { const nuevas = [...formOpciones]; nuevas[index][campo] = valor; setFormOpciones(nuevas); };
  const guardarPasoFirebase = async () => { if (!formId || !formPregunta) { setMensajeAdmin('⚠️ ID y pregunta obligatorios.'); return; } setMensajeAdmin('Guardando...'); try { const datosAGuardar = { pregunta: formPregunta, esFinal: formEsFinal, opciones: formEsFinal ? [] : formOpciones, imgUrl: formImgUrl, imgTipo: formImgTipo, videoUrl: formVideoUrl, tabsNota: formTabsNota.filter(t => t.titulo.trim() !== '' && t.contenido.trim() !== ''), esFallaEnSerie: formEsFallaSerie, tituloFallaSerie: formEsFallaSerie ? formTituloSerie : null, descFallaSerie: formEsFallaSerie ? formDescSerie : null }; await setDoc(doc(db, "pasos", formId), datosAGuardar); setMensajeAdmin('✅ ¡Guardado!'); cargarFallasEnSerie(); setTimeout(() => { setVistaAdmin('lista'); cargarTodosLosPasos(); }, 1000); } catch (e) { setMensajeAdmin('❌ Error: ' + e.message); } };

  // HISTORIAL Y BITÁCORA
  const cargarHistorialCasos = async () => { try { const qs = await getDocs(collection(db, "historial_reparaciones")); const arr = []; qs.forEach((doc) => arr.push({ id: doc.id, ...doc.data() })); arr.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); setCasosGuardados(arr); } catch (e) { } };
  const abrirHistorial = () => { setHistorialCasosVisible(true); cargarHistorialCasos(); };
  const prepararNuevoCaso = () => { setFormCaso({ marca: '', modelo: '', sintomas: '', protocolo: '', imgUrl: '' }); setCasoEditando(null); setMensajeCaso(''); setBitacoraVisible(true); };
  const guardarBitacora = async (e) => { e.preventDefault(); setMensajeCaso('Guardando...'); try { if (casoEditando) { await updateDoc(doc(db, "historial_reparaciones", casoEditando), { ...formCaso }); } else { await addDoc(collection(db, "historial_reparaciones"), { ...formCaso, fecha: new Date().toISOString() }); } setMensajeCaso('✅ ¡Registrado!'); setTimeout(() => { setBitacoraVisible(false); cargarHistorialCasos(); }, 1000); } catch (e) { setMensajeCaso('❌ Error.'); } };
  const eliminarCaso = async (id) => { if (window.confirm('¿Seguro de eliminar este caso?')) { try { await deleteDoc(doc(db, "historial_reparaciones", id)); cargarHistorialCasos(); } catch (error) { } } };
  const abrirReporte = (caso) => { setCasoReporte(caso); setReporteVisible(true); setHistorialCasosVisible(false); };
  const imprimirReporte = async () => { if (!casoReporte) return; try { const { pdf } = await import('@react-pdf/renderer'); const ReportePDF = (await import('../components/pdfx/ReportePDF')).default; const blob = await pdf(<ReportePDF caso={casoReporte} />).toBlob(); window.open(URL.createObjectURL(blob), '_blank'); } catch (error) { alert("Error generando PDF."); } };
  const enviarWhatsApp = () => { if (!casoReporte) return; const texto = `📱 *MARSHALL CELL - REPORTE TÉCNICO*\n\n*Equipo:* ${casoReporte.marca} ${casoReporte.modelo}\n*ID:* #${casoReporte.id.substring(0, 6).toUpperCase()}\n*Fecha:* ${new Date(casoReporte.fecha).toLocaleDateString()}\n\n⚠️ *Síntoma:* ${casoReporte.sintomas}\n\n🛠️ *Diagnóstico:* ${casoReporte.protocolo || 'Pendiente.'}\n\n👨‍🔧 *Técnico:* Marshall\n📍 *Laboratorio:* Oropesa, Cusco`; window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank'); };

  if (!pasoActual) return <div style={{ height: '100vh', backgroundColor: '#111827', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2 style={{ color: '#0ff' }}>Iniciando Marshall Cell...</h2></div>;
  const t = estilos[tema]; const tieneTips = pasoActual.tabsNota && pasoActual.tabsNota.length > 0;

  // Componente renderizador de botones de imagen para FPC (reutilizable)
  const BotonesImagenFPC = ({ compacto = false }) => {
    if (!fpcActivo) return null;
    return (
      <div style={{ display: 'flex', gap: '5px' }}>
        {fpcActivo.imgPlaca ? (
          <button onClick={() => { setTipoImagenViendo('placa'); setImagenFpcVisible(true); }} 
            style={{ padding: compacto ? '4px 8px' : '6px 10px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: compacto ? '0.65rem' : '0.75rem' }}>
            <ImageIcon size={compacto ? 12 : 14} /> {compacto ? '' : 'Placa'}
          </button>
        ) : (
          <button onClick={() => editarUbicacionFpc('placa')} 
            style={{ padding: compacto ? '4px 8px' : '6px 10px', borderRadius: '6px', border: '1px dashed #4b5563', background: 'transparent', color: '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: compacto ? '0.6rem' : '0.7rem' }}>
            + Placa
          </button>
        )}
        {fpcActivo.imgEsquema ? (
          <button onClick={() => { setTipoImagenViendo('esquema'); setImagenFpcVisible(true); }} 
            style={{ padding: compacto ? '4px 8px' : '6px 10px', borderRadius: '6px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: compacto ? '0.65rem' : '0.75rem' }}>
            <Map size={compacto ? 12 : 14} /> {compacto ? '' : 'Esquema'}
          </button>
        ) : (
          <button onClick={() => editarUbicacionFpc('esquema')} 
            style={{ padding: compacto ? '4px 8px' : '6px 10px', borderRadius: '6px', border: '1px dashed #4b5563', background: 'transparent', color: '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: compacto ? '0.6rem' : '0.7rem' }}>
            + Esquema
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ ...estilos.contenedor, ...t.fondoPrincipal }}>
      <style>{`
        .modal-lib { flex-direction: row; } .modal-lib-side { width: 300px; border-right: 1px solid #374151; } .fpc-tools { display: flex; gap: 10px; margin-bottom: 15px; justify-content: flex-end; }
        ::-webkit-scrollbar { height: 8px; width: 8px; } ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
        @media (max-width: 850px) { .modal-lib { flex-direction: column !important; border-radius: 0 !important; width: 100vw !important; height: 100vh !important; } .modal-lib-side { width: 100% !important; border-right: none !important; border-bottom: 1px solid #374151; max-height: 250px; } .fpc-tools { flex-wrap: wrap; justify-content: center !important; } .hide-on-mobile { display: none !important; } .hud-valor-text { font-size: 3rem !important; } .grid-dock { grid-template-columns: repeat(3, 1fr) !important; } }
      `}</style>

      <header className="no-print" style={{ ...estilos.header, ...t.bordeFantasmaBottom }}>
        <div style={estilos.headerInner}>
          <h1 style={{ ...estilos.logoTexto, ...t.textoPrincipal }} className="hide-on-mobile">MARSHALL CELL</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            {showInstallPrompt && (
              <button onClick={handleInstallClick} style={{ ...estilos.btnHeader, backgroundColor: '#f97316', color: 'white', border: 'none', boxShadow: '0 0 10px rgba(249, 115, 22, 0.4)' }}><Smartphone size={16} /> <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }} className="hide-on-mobile">INSTALAR APP</span></button>
            )}
            {!mostrarAdmin && !libreriaVisible && (
              <div onClick={usbConectado ? desconectarMultimetroUSB : conectarMultimetroUSB} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', backgroundColor: '#0a0a0a', borderRadius: '10px', border: `2px solid ${usbConectado ? 'rgba(239, 68, 68, 0.4)' : '#374151'}`, cursor: 'pointer' }}>
                <Link size={16} color={usbConectado ? '#ef4444' : '#6b7280'} />
                <span style={{ color: lecturaUsb.valor === 'OL' ? '#ff0000' : (usbConectado ? '#00ffff' : '#6b7280'), fontFamily: 'Consolas, monospace', fontWeight: 'bold', fontSize: '1.2rem' }}>{usbConectado ? lecturaUsb.valor : 'USB'}</span>
              </div>
            )}
            <button onClick={abrirLibreria} style={{ ...estilos.btnHeader, backgroundColor: '#8b5cf6', color: 'white', border: 'none' }}><Cpu size={16} /> <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>LIBRERÍA MODELOS</span></button>
            <button onClick={abrirHistorial} style={{ ...estilos.btnHeader, backgroundColor: t.cristalBgItem.backgroundColor, color: t.textoPrincipal.color, border: t.bordeFantasma.border }}><History size={16} /> <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>HISTORIAL</span></button>
            <button onClick={prepararNuevoCaso} style={{ ...estilos.btnHeader, backgroundColor: '#10b981', color: 'white', border: 'none' }}><ClipboardList size={16} /> <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>INGRESO</span></button>
            <button onClick={toggleTema} style={{ ...estilos.btnTema, ...t.textoSutil, marginLeft: '5px' }}>{tema === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
          </div>
        </div>
      </header>

      <main className="no-print" style={estilos.main}>
        <AnimatePresence>
          {pasoActual.id === 'inicio' && fallasEnSerie.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} style={{ width: '100%', marginBottom: '30px' }}>
              <h3 style={{ ...t.textoPrincipal, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0' }}><Flame size={20} color="#f97316" /> FALLAS CRÓNICAS (ACCESO RÁPIDO)</h3>
              <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'thin' }}>
                {fallasEnSerie.map(falla => (
                  <motion.button key={falla.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ minWidth: '220px', padding: '15px', borderRadius: '1rem', border: '1px solid rgba(249, 115, 22, 0.3)', cursor: 'pointer', display: 'flex', flexDirection: 'column', textAlign: 'left', borderLeft: '4px solid #f97316', ...t.cristalBgItem, ...t.bordeFantasma }} onClick={() => cargarPaso(falla.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><AlertTriangle size={18} color="#ef4444" /><span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: t.textoPrincipal.color }}>{falla.tituloFallaSerie || 'Falla Crónica'}</span></div>
                    <p style={{ fontSize: '0.75rem', margin: 0, lineHeight: '1.3', color: t.textoSutil.color }}>{falla.descFallaSerie || falla.pregunta}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div key={pasoActual.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ ...estilos.tarjetaCristal, ...t.cristalBg, ...t.bordeFantasma }}>
            <div style={estilos.seccionTitulo}>
              <span style={{ ...estilos.etiquetaPaso, color: '#0058bc' }}>
                PASO {String(historial.length + 1).padStart(2, '0')}
                {tieneTips && (<button onClick={() => { setNotaVisible(true); setTipTabActiva(0); }} style={{ backgroundColor: '#fef08a', border: '1px solid #eab308', borderRadius: '20px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: '10px' }}><Lightbulb size={16} color="#a16207" /> <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#a16207' }}>TIPS ({pasoActual.tabsNota.length})</span></button>)}
                {pasoActual.imgUrl && (<button onClick={() => setImgModalVisible(true)} style={{ background: '#8b5cf6', border: 'none', borderRadius: '20px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: '10px' }}><Camera size={16} color="white" /> <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'white' }}>{pasoActual.imgTipo === 'microscopio' ? 'FOTO' : 'PLANO'}</span></button>)}
                {pasoActual.videoUrl && (<button onClick={() => setVideoModalVisible(true)} style={{ background: '#ef4444', border: 'none', borderRadius: '20px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: '10px' }}><Play size={16} color="white" /> <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'white' }}>VIDEO</span></button>)}
              </span>
              <h2 style={{ ...estilos.tituloPregunta, ...t.textoPrincipal }}>{pasoActual.pregunta}</h2>
            </div>
            {pasoActual.esFinal ? (
              <div style={estilos.estadoFinal}><ShieldCheck size={48} color="#0058bc" /><h3 style={{ ...t.textoPrincipal }}>Diagnóstico Completado</h3><button style={estilos.btnPrimario} onClick={() => { setHistorial([]); cargarPaso('inicio'); }}>Reiniciar</button></div>
            ) : (
              <div style={estilos.gridOpciones}>
                {pasoActual.opciones?.map((op, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.02, backgroundColor: t.hoverBg }} whileTap={{ scale: 0.98 }} style={{ ...estilos.btnOpcion, ...t.bordeFantasma, ...t.cristalBgItem }} onClick={() => cargarPaso(op.siguientePaso)}>
                    <div style={estilos.opcionContenido}><span style={{ ...estilos.tituloOpcion, ...t.textoPrincipal }}>{op.texto}</span></div><ChevronRight size={20} style={{ color: '#0058bc', opacity: 0.5 }} />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="no-print" style={{ ...estilos.navInferior, ...t.cristalBgNav, ...t.bordeFantasmaTop }}><div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>{historial.length > 0 && <button style={{ ...estilos.navBtn, ...t.textoSutil }} onClick={irAtras}><ArrowLeft size={24} /> <span style={estilos.navLabel}>BACK</span></button>}</div><button style={estilos.navBtnCentro} onClick={() => { setHistorial([]); cargarPaso('inicio'); }}><Home size={24} color="white" /></button><div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}><button style={{ ...estilos.navBtn, ...t.textoSutil }} onClick={abrirAdmin}><Settings size={24} /> <span style={estilos.navLabel}>ADMIN</span></button></div></nav>

      {/* --- MODAL 1: LIBRERÍA MODELOS --- */}
      <AnimatePresence>
        {libreriaVisible && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay}>
            <motion.div className="modal-lib" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ width: '95vw', maxWidth: '1600px', height: '95vh', backgroundColor: '#111827', borderRadius: '1.5rem', display: 'flex', overflow: 'hidden', border: '1px solid #374151' }}>
              <div className="modal-lib-side" style={{ backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #374151' }}>
                  <h3 style={{ color: '#8b5cf6', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><Cpu size={24} /> HARDWARE DB</h3>
                  <form onSubmit={crearNuevoModeloDB} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input required placeholder="Marca (Ej: Xiaomi)" value={formNuevoModelo.marca} onChange={e => setFormNuevoModelo({ ...formNuevoModelo, marca: e.target.value })} style={estilos.inputDark} />
                    <input required placeholder="Modelo (Ej: POCO X3)" value={formNuevoModelo.nombre} onChange={e => setFormNuevoModelo({ ...formNuevoModelo, nombre: e.target.value })} style={estilos.inputDark} />
                    <button type="submit" style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Añadir Teléfono</button>
                  </form>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                  {modelosLibreria.map(mod => (
                    <button key={mod.id} onClick={() => { setModeloActivo(mod); setFpcActivo(mod.fpcs[0] || null); }} style={{ width: '100%', padding: '12px', textAlign: 'left', backgroundColor: modeloActivo?.id === mod.id ? '#1f2937' : 'transparent', border: 'none', color: modeloActivo?.id === mod.id ? '#00ffff' : '#9ca3af', borderLeft: modeloActivo?.id === mod.id ? '4px solid #00ffff' : '4px solid transparent', cursor: 'pointer', borderRadius: '0 8px 8px 0', marginBottom: '5px', fontWeight: 'bold' }}>
                      {mod.marca} {mod.nombre}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#111827' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>{modeloActivo ? `${modeloActivo.marca} ${modeloActivo.nombre}` : 'Selecciona Modelo'}</h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {modeloActivo && <button onClick={guardarModeloActualDB} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Save size={16} /> Guardar</button>}
                    <button onClick={() => setLibreriaVisible(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}><X size={16} /></button>
                  </div>
                </div>
                {modeloActivo ? (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      <button onClick={() => setSeccionLibreria('docktest')} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: seccionLibreria === 'docktest' ? '#3b82f6' : '#1f2937', color: 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Docktest</button>
                      <button onClick={() => setSeccionLibreria('fpc')} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: seccionLibreria === 'fpc' ? '#8b5cf6' : '#1f2937', color: 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Planos FPC</button>
                    </div>
                    <VisorHUD valor={lecturaUsb.valor} unidad={lecturaUsb.unidad} conectado={usbConectado} conectarFn={conectarMultimetroUSB} desconectarFn={desconectarMultimetroUSB} vozActiva={vozActiva} toggleVozFn={toggleVoz} autoHoldActivo={autoHoldActivo} toggleAutoHoldFn={() => setAutoHoldActivo(!autoHoldActivo)} />

                    {seccionLibreria === 'docktest' && (
                      <div style={{ backgroundColor: '#000', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                          <h3 style={{ color: '#3b82f6', margin: 0 }}>Captura de Docktest</h3>
                          <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px' }}>
                            <button onClick={() => setEscalaFpc('diodo')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'diodo' ? '#3b82f6' : 'transparent', color: escalaFpc === 'diodo' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Diodo</button>
                            <button onClick={() => setEscalaFpc('ua')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'ua' ? '#10b981' : 'transparent', color: escalaFpc === 'ua' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>uA</button>
                          </div>
                        </div>
                        <div className="grid-dock" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
                          {ordenCamposDock.map(c => {
                            const valuesObj = escalaFpc === 'diodo' ? modeloActivo.docktestDiodo : modeloActivo.docktestUa;
                            const valActual = valuesObj ? valuesObj[c] : '---';
                            return (
                              <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: campoActivoDock === c ? '#00ffff' : 'gray', marginBottom: '8px', textTransform: 'uppercase' }}>{c}</span>
                                <input readOnly onClick={() => setCampoActivoDock(c)} value={valActual} style={{ width: '100%', padding: '15px', textAlign: 'center', fontFamily: 'Consolas', fontWeight: 'bold', fontSize: '1.2rem', border: campoActivoDock === c ? '2px solid #00ffff' : '1px solid #333', backgroundColor: campoActivoDock === c ? 'rgba(0, 255, 255, 0.1)' : '#1a1a1a', color: campoActivoDock === c ? '#00ffff' : 'white', borderRadius: '8px', cursor: 'pointer', outline: 'none' }} />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {seccionLibreria === 'fpc' && (
                      <div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', flex: 1, paddingBottom: '5px', scrollbarWidth: 'thin' }}>
                            {modeloActivo.fpcs.map(f => (
                              <button key={f.id} onClick={() => { setFpcActivo(f); setPinActivoFpc(1); setModalFpcAbierto(true); }} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', background: fpcActivo?.id === f.id ? '#8b5cf6' : '#1f2937', color: 'white', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>{f.nombre} ({f.pines.length})</button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '5px', background: '#1a1a1a', padding: '5px', borderRadius: '10px', border: '1px solid #333' }}>
                            <input placeholder="Nuevo FPC..." value={formNuevoFpc.nombre} onChange={e => setFormNuevoFpc({ ...formNuevoFpc, nombre: e.target.value.replace(/ /g, '_') })} style={{ ...estilos.inputDark, width: '100px', padding: '5px' }} />
                            <input type="number" placeholder="#" value={formNuevoFpc.pines} onChange={e => setFormNuevoFpc({ ...formNuevoFpc, pines: e.target.value })} style={{ ...estilos.inputDark, width: '50px', padding: '5px', textAlign: 'center' }} />
                            <button onClick={crearNuevoFpcEnModelo} style={{ background: '#10b981', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', padding: '0 10px', cursor: 'pointer' }}>+</button>
                          </div>
                        </div>
                        {fpcActivo ? (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                              <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{fpcActivo.nombre}</span> 
                              <span style={{ fontSize: '0.75rem' }}>seleccionado — haz click en el nombre arriba para abrir el visor.</span>
                              <BotonesImagenFPC compacto={true} />
                            </div>
                          </div>
                        ) : (<div style={{ textAlign: 'center', padding: '50px', color: 'gray' }}><Map size={48} style={{ opacity: 0.3, marginBottom: '10px' }} /><p>Crea un FPC arriba para empezar a mapear.</p></div>)}
                      </div>
                    )}
                  </div>
                ) : (<div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'gray' }}><Smartphone size={64} style={{ opacity: 0.2, marginBottom: '15px' }} /><h3>Selecciona un teléfono</h3></div>)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL FULLSCREEN: VISOR DE PINES FPC --- */}
      <AnimatePresence>
        {modalFpcAbierto && fpcActivo && modeloActivo && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0b0f', zIndex: 2500, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', flexShrink: 0, flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setModalFpcAbierto(false)} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}><ArrowLeft size={22} /></button>
                <Cpu size={20} color="#8b5cf6" />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{fpcActivo.nombre}</span>
                <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '12px', background: '#1f2937', color: '#9ca3af', fontWeight: 'bold' }}>{fpcActivo.pines.length} PINES</span>
              </div>
              <div className="fpc-tools" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                
                {/* Botones de imagen Placa/Esquema + herramientas */}
                <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px', alignItems: 'center' }}>
                  <BotonesImagenFPC />
                  
                  <button onClick={editarPinesFpcActivo} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#eab308', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }}>✏️ Pines</button>
                  <button onClick={() => { eliminarFpcActivo(); setModalFpcAbierto(false); }} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>🗑️</button>
                </div>

                <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px' }}>
                  <button onClick={() => setEscalaFpc('diodo')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'diodo' ? '#8b5cf6' : 'transparent', color: escalaFpc === 'diodo' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Diodo</button>
                  <button onClick={() => setEscalaFpc('ua')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'ua' ? '#10b981' : 'transparent', color: escalaFpc === 'ua' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>uA</button>
                </div>
                <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px' }}>
                  <button onClick={() => setModoFpc('crear')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: modoFpc === 'crear' ? '#8b5cf6' : 'transparent', color: modoFpc === 'crear' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Grabar</button>
                  <button onClick={() => setModoFpc('diagnostico')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: modoFpc === 'diagnostico' ? '#ef4444' : 'transparent', color: modoFpc === 'diagnostico' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Diagnóstico</button>
                </div>
                <button onClick={() => setModalFpcAbierto(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '10px 20px', flexShrink: 0 }}>
              <VisorHUD valor={lecturaUsb.valor} unidad={lecturaUsb.unidad} conectado={usbConectado} conectarFn={conectarMultimetroUSB} desconectarFn={desconectarMultimetroUSB} vozActiva={vozActiva} toggleVozFn={toggleVoz} autoHoldActivo={autoHoldActivo} toggleAutoHoldFn={() => setAutoHoldActivo(!autoHoldActivo)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 20px 20px' }}>
              <FPCInteligente pines={fpcActivo.pines} setPines={(updater) => {
                const arrNuevo = typeof updater === 'function' ? updater(fpcActivo.pines) : updater;
                const fpcMod = { ...fpcActivo, pines: arrNuevo }; setFpcActivo(fpcMod);
                setModeloActivo(prev => ({ ...prev, fpcs: prev.fpcs.map(f => f.id === fpcMod.id ? fpcMod : f) }));
              }} pinActivo={pinActivoFpc} setPinActivo={setPinActivoFpc} modo={modoFpc} escala={escalaFpc} lecturaEnVivo={lecturaUsb.valor}  onGuardar={guardarModeloActualDB} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- VISUALIZADOR DE IMAGENES (PLACA O ESQUEMA) --- */}
      <AnimatePresence>
        {imagenFpcVisible && fpcActivo && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setImagenFpcVisible(false)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ width: '95vw', maxWidth: '1000px', height: '80vh', backgroundColor: '#111827', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `2px solid ${tipoImagenViendo === 'placa' ? '#3b82f6' : '#8b5cf6'}` }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {tipoImagenViendo === 'placa' ? <ImageIcon size={20} color="#3b82f6" /> : <Map size={20} color="#8b5cf6" />}
                  <span style={{ color: 'white', fontWeight: 'bold' }}>Vista: {tipoImagenViendo === 'placa' ? 'Placa Base' : 'Esquemático'} ({fpcActivo.nombre})</span>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  {/* Toggle entre Placa y Esquema si ambas existen */}
                  {fpcActivo.imgPlaca && fpcActivo.imgEsquema && (
                    <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px' }}>
                      <button onClick={() => setTipoImagenViendo('placa')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: tipoImagenViendo === 'placa' ? '#3b82f6' : 'transparent', color: tipoImagenViendo === 'placa' ? 'white' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><ImageIcon size={14} /> Placa</button>
                      <button onClick={() => setTipoImagenViendo('esquema')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: tipoImagenViendo === 'esquema' ? '#8b5cf6' : 'transparent', color: tipoImagenViendo === 'esquema' ? 'white' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Map size={14} /> Esquema</button>
                    </div>
                  )}
                  <button onClick={() => { setImagenFpcVisible(false); setTimeout(() => editarUbicacionFpc(tipoImagenViendo), 300); }} style={{ background: 'transparent', border: 'none', color: '#eab308', cursor: 'pointer', fontWeight: 'bold' }}>Cambiar Foto</button>
                  <button onClick={() => setImagenFpcVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="white" /></button>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '10px', backgroundColor: '#000' }}>
                <img src={tipoImagenViendo === 'placa' ? fpcActivo.imgPlaca : fpcActivo.imgEsquema} alt={`Vista ${tipoImagenViendo}`} referrerPolicy="no-referrer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALES DE DIAGNÓSTICO EXISTENTES (Tips, Imagen, Video, Bitácora, Historial, Reporte) --- */}
      {/* ... (mantener los modales existentes sin cambios) ... */}

      <AnimatePresence>
        {mostrarAdmin && !libreriaVisible && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma, width: '100%', maxWidth: '800px' }}>
              <div style={estilos.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {vistaAdmin === 'formulario' && <button onClick={() => setVistaAdmin('lista')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0058bc' }}><ArrowLeft size={20} /></button>}
                  <h3 style={{ margin: 0, ...t.textoPrincipal }}>⚙️ Editor de Flujos (Admin)</h3>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {estaAutenticado && <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><LogOut size={20} /></button>}
                  <button onClick={() => setMostrarAdmin(false)} style={estilos.btnCerrar}><X size={24} /></button>
                </div>
              </div>

              {vistaAdmin === 'login' && (
                <div style={estilos.modalBody}>
                  <form onSubmit={iniciarSesion} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto', marginTop: '40px' }}>
                    <h2 style={{ textAlign: 'center', ...t.textoPrincipal }}>Acceso Privado</h2>
                    <div><label style={estilos.labelForm}>Correo</label><input required type="email" style={estilos.inputLigero} value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)} /></div>
                    <div><label style={estilos.labelForm}>Contraseña</label><input required type="password" style={estilos.inputLigero} value={passAdmin} onChange={(e) => setPassAdmin(e.target.value)} /></div>
                    {errorLogin && <p style={{ color: '#ef4444', fontWeight: 'bold', textAlign: 'center' }}>{errorLogin}</p>}
                    <button type="submit" style={{ ...estilos.btnPrimarioGuardar, justifyContent: 'center', padding: '15px' }}>Entrar al Sistema</button>
                  </form>
                </div>
              )}

              {vistaAdmin === 'lista' && (
                <div style={estilos.modalBody}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button onClick={prepararNuevoPaso} style={estilos.btnPrimarioGuardar}>+ Nueva Pregunta / Paso</button>
                  </div>
                  <div style={estilos.listaContainer}>
                    {listaPasos.length > 0 ? (
                      listaPasos.map(paso => (
                        <div key={paso.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: t.bordeFantasma.border }}>
                          <div><strong style={{ color: '#0058bc' }}>{paso.id}</strong><br /><span style={{ fontSize: '0.8rem', color: t.textoSutil.color }}>{paso.pregunta}</span></div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => editarPaso(paso)} style={{ background: 'transparent', border: 'none', color: '#eab308', cursor: 'pointer' }}><Edit size={18} /></button>
                            <button onClick={() => eliminarPaso(paso.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                          </div>
                        </div>
                      ))
                    ) : <p>Cargando pasos...</p>}
                  </div>
                </div>
              )}

              {vistaAdmin === 'formulario' && (
                <div style={estilos.modalBody}>
                  <label style={estilos.labelForm}>ID Único</label>
                  <input style={estilos.inputLigero} value={formId} onChange={(e) => setFormId(e.target.value.toLowerCase().replace(/\s+/g, '_'))} readOnly={formId === 'inicio'} />
                  <label style={{ ...estilos.labelForm, marginTop: '15px', display: 'block' }}>Pregunta Principal</label>
                  <textarea style={{ ...estilos.inputLigero, minHeight: '60px' }} value={formPregunta} onChange={(e) => setFormPregunta(e.target.value)} />

                  <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <h4 style={{ ...t.textoPrincipal, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6' }}><Camera size={18} /> Imagen / Plano</h4>
                    <input style={estilos.inputLigero} type="text" placeholder="URL de la imagen..." value={formImgUrl} onChange={(e) => setFormImgUrl(e.target.value)} />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={(e) => { e.preventDefault(); setFormImgTipo('microscopio') }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: formImgTipo === 'microscopio' ? '#8b5cf6' : 'rgba(0,0,0,0.05)', color: formImgTipo === 'microscopio' ? 'white' : t.textoSutil.color, cursor: 'pointer' }}>📸 Foto</button>
                      <button onClick={(e) => { e.preventDefault(); setFormImgTipo('esquema') }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: formImgTipo === 'esquema' ? '#8b5cf6' : 'rgba(0,0,0,0.05)', color: formImgTipo === 'esquema' ? 'white' : t.textoSutil.color, cursor: 'pointer' }}>🗺️ Plano</button>
                    </div>
                  </div>

                  <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <h4 style={{ ...t.textoPrincipal, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}><Monitor size={18} /> Video de YouTube</h4>
                    <input style={estilos.inputLigero} type="text" placeholder="Enlace del video..." value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} />
                  </div>

                  <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                    <h4 style={{ ...t.textoPrincipal, margin: '0 0 10px 0', color: '#eab308', display: 'flex', alignItems: 'center', gap: '6px' }}><Lightbulb size={18} /> Wiki Técnica (Tips)</h4>
                    {formTabsNota.map((tab, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input style={{ ...estilos.inputLigero, flex: 1, fontWeight: 'bold' }} placeholder="Título (Ej: Teoría, Precaución)" value={tab.titulo} onChange={(e) => { const n = [...formTabsNota]; n[index].titulo = e.target.value; setFormTabsNota(n); }} />
                          <button onClick={(e) => { e.preventDefault(); const n = [...formTabsNota]; n.splice(index, 1); setFormTabsNota(n); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        </div>
                        <textarea style={{ ...estilos.inputLigero, minHeight: '60px' }} placeholder="Contenido del tip..." value={tab.contenido} onChange={(e) => { const n = [...formTabsNota]; n[index].contenido = e.target.value; setFormTabsNota(n); }} />
                      </div>
                    ))}
                    <button onClick={(e) => { e.preventDefault(); setFormTabsNota([...formTabsNota, { titulo: 'Nueva Pestaña', contenido: '' }]); }} style={{ background: 'transparent', border: 'none', color: '#0058bc', fontWeight: 'bold', cursor: 'pointer' }}>+ Agregar Tip</button>
                  </div>

                  <div style={{ ...estilos.opcionesContainer, backgroundColor: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" id="esFallaSerie" checked={formEsFallaSerie} onChange={(e) => setFormEsFallaSerie(e.target.checked)} />
                      <label htmlFor="esFallaSerie" style={{ ...t.textoPrincipal, fontWeight: 'bold', color: '#f97316', display: 'flex', alignItems: 'center', gap: '5px' }}><Flame size={18} /> Mostrar en Menú Principal (Falla Crónica)</label>
                    </div>
                    {formEsFallaSerie && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        <input style={estilos.inputLigero} type="text" placeholder="Título corto (Ej: POCO X3 Pro)" value={formTituloSerie} onChange={(e) => setFormTituloSerie(e.target.value)} />
                        <input style={estilos.inputLigero} type="text" placeholder="Descripción breve" value={formDescSerie} onChange={(e) => setFormDescSerie(e.target.value)} />
                      </div>
                    )}
                  </div>

                  <div style={estilos.checkboxGroup}>
                    <input type="checkbox" id="esFinal" checked={formEsFinal} onChange={(e) => setFormEsFinal(e.target.checked)} />
                    <label htmlFor="esFinal" style={{ fontWeight: 'bold', ...t.textoPrincipal }}>¿Este paso es el final del diagnóstico?</label>
                  </div>

                  {!formEsFinal && (
                    <div style={{ marginTop: '15px' }}>
                      <h4 style={t.textoPrincipal}>Botones de Respuesta (Rutas):</h4>
                      {formOpciones.map((op, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <input style={estilos.inputLigero} placeholder="Texto del botón (Ej: Sí)" value={op.texto} onChange={e => handleCambioOpcion(i, 'texto', e.target.value)} />
                          <input style={estilos.inputLigero} placeholder="ID Siguiente (Ej: revisar_bateria)" value={op.siguientePaso} onChange={e => handleCambioOpcion(i, 'siguientePaso', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
                          <button onClick={() => handleQuitarOpcion(i)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        </div>
                      ))}
                      <button onClick={handleAgregarOpcion} style={{ color: '#0058bc', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>+ Agregar ruta</button>
                    </div>
                  )}

                  {mensajeAdmin && <p style={{ color: mensajeAdmin.includes('❌') ? 'red' : 'green', textAlign: 'center', fontWeight: 'bold', marginTop: '15px' }}>{mensajeAdmin}</p>}

                  <button onClick={guardarPasoFirebase} style={{ ...estilos.btnPrimarioGuardar, width: '100%', marginTop: '20px', padding: '15px', justifyContent: 'center' }}>Guardar Paso en la Nube</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const estilos = {
  contenedor: { minHeight: '100vh', paddingBottom: '100px', display: 'flex', flexDirection: 'column' }, header: { padding: '16px 0' }, headerInner: { display: 'flex', justifyContent: 'space-between', padding: '0 24px', alignItems: 'center' }, logoTexto: { fontSize: '0.8rem', fontWeight: '800' }, main: { flex: 1, padding: '20px', maxWidth: '900px', margin: '0 auto', width: '100%' }, tarjetaCristal: { width: '100%', borderRadius: '2rem', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }, seccionTitulo: { textAlign: 'center', marginBottom: '30px' }, etiquetaPaso: { fontSize: '0.7rem', fontWeight: '800', marginBottom: '10px', display: 'block' }, tituloPregunta: { fontSize: '1.8rem', fontWeight: '800' }, gridOpciones: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', width: '100%' }, btnOpcion: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderRadius: '1.2rem', cursor: 'pointer', border: 'none', textAlign: 'left' }, opcionContenido: { display: 'flex', alignItems: 'center', gap: '12px' }, tituloOpcion: { fontSize: '1rem', fontWeight: '700' }, navInferior: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 }, navBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }, navLabel: { fontSize: '0.6rem', fontWeight: '700' }, navBtnCentro: { width: '50px', height: '50px', borderRadius: '50%', background: '#0058bc', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transform: 'translateY(-10px)' }, modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }, modalCard: { width: '100%', maxWidth: '600px', maxHeight: '90vh', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, modalHeader: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)' }, btnCerrar: { background: 'none', border: 'none', cursor: 'pointer', color: 'gray' }, modalBody: { padding: '20px', overflowY: 'auto', flex: 1 }, btnPrimarioGuardar: { background: '#0058bc', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }, btnHeader: { padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', outline: 'none' }, inputDark: { width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white', outline: 'none' }, inputLigero: { width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', outline: 'none', marginTop: '5px' }, checkboxGroup: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', marginTop: '10px' }, opcionesContainer: { padding: '15px', borderRadius: '12px', marginTop: '10px' }, labelForm: { fontSize: '0.8rem', fontWeight: 'bold' },
  dark: { fondoPrincipal: { backgroundColor: '#2f3034' }, cristalBg: { backgroundColor: 'rgba(47, 48, 52, 0.7)' }, cristalBgItem: { backgroundColor: 'rgba(255, 255, 255, 0.03)' }, cristalBgNav: { backgroundColor: 'rgba(47, 48, 52, 0.85)' }, textoPrincipal: { color: '#ffffff' }, textoSutil: { color: '#9ca3af' }, bordeFantasma: { border: '1px solid rgba(255, 255, 255, 0.08)' }, bordeFantasmaBottom: { borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }, bordeFantasmaTop: { borderTop: '1px solid rgba(255, 255, 255, 0.08)' }, hoverBg: 'rgba(255, 255, 255, 0.06)' },
  light: { fondoPrincipal: { backgroundColor: '#faf9fe' }, cristalBg: { backgroundColor: 'rgba(255, 255, 255, 0.8)' }, cristalBgItem: { backgroundColor: 'rgba(255, 255, 255, 1)' }, cristalBgNav: { backgroundColor: 'rgba(250, 249, 254, 0.85)' }, textoPrincipal: { color: '#111827' }, textoSutil: { color: '#6b7280' }, bordeFantasma: { border: '1px solid rgba(0, 0, 0, 0.05)' }, bordeFantasmaBottom: { borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }, bordeFantasmaTop: { borderTop: '1px solid rgba(0, 0, 0, 0.05)' }, hoverBg: 'rgba(0, 88, 188, 0.02)' }
};