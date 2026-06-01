/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, addDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Sun, Moon, ArrowLeft, RefreshCcw, Zap, Smartphone, AlertTriangle, ChevronRight, Home, ShieldCheck, Camera, CheckCircle2, XCircle, Settings, Plus, Save, X, Trash2, Edit, ChevronDown, CornerDownRight, LogOut, Lightbulb, Usb, Map, Play, Flame, ClipboardList, History, Printer, FileText, MessageCircle, Link, Monitor, Mic, MicOff, Cpu, Image as ImageIcon } from 'lucide-react';

import FPCInteligente from '../components/FPCInteligente.js';
import ICInteligente from '../components/ICInteligente.js';
import EscanerRFFE from '../components/EscanerRFFE.js';
import FormularioIngresoAvanzado from '../components/FormularioIngresoAvanzado.js';
import VisorReporteAvanzado from '../components/VisorReporteAvanzado.js';
import { toPng } from 'html-to-image';
import useAutoSave from '../hooks/useAutoSave';

const LETRAS_FILAS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'T', 'U', 'V', 'W', 'Y',
  'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AP', 'AR', 'AT', 'AU', 'AV', 'AW', 'AY'
];


const obtenerUrlVideo = (url) => { if (!url) return ''; let v = ''; if (url.includes('youtu.be/')) v = url.split('youtu.be/')[1].split('?')[0]; else if (url.includes('youtube.com/watch')) v = new URLSearchParams(url.split('?')[1]).get('v'); else if (url.includes('youtube.com/embed/')) return url; return v ? `https://www.youtube.com/embed/${v}` : url; };

const VisorHUD = ({ valor, unidad, conectado, conectarFn, desconectarFn, vozActiva, toggleVozFn, autoHoldActivo, toggleAutoHoldFn, capturarFn, escalaActiva }) => {
  const esIncorrecta = conectado && (
    (escalaActiva === 'diodo' && (unidad === 'uA' || unidad === 'mA' || unidad === 'A')) ||
    (escalaActiva === 'ua' && (unidad === 'V' || unidad === 'Diod' || unidad === 'Ω'))
  );

  return (
    <div style={{ 
      backgroundColor: '#1a1a1a', 
      border: esIncorrecta ? '2px solid #ef4444' : '2px solid #333333', 
      borderRadius: '15px', 
      padding: '15px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      marginBottom: '15px', 
      position: 'relative', 
      overflow: 'hidden', 
      boxShadow: esIncorrecta ? '0 0 25px rgba(239, 68, 68, 0.8)' : (conectado ? '0 0 20px rgba(0, 255, 255, 0.2)' : 'none') 
    }}>
      <div className="tools-row" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ color: '#555', fontSize: '0.8rem', fontWeight: 'bold' }} className="hide-on-mobile">UT61E+ ANALYZER</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          <button onClick={conectado ? desconectarFn : conectarFn} style={{ background: conectado ? 'rgba(239, 68, 68, 0.2)' : '#333', color: conectado ? '#ef4444' : 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Link size={14} /> {conectado ? 'DESCONECTAR' : 'CONECTAR USB'}</button>
          <button onClick={toggleVozFn} style={{ background: vozActiva ? 'rgba(234, 179, 8, 0.2)' : '#333', color: vozActiva ? '#eab308' : 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: vozActiva ? '0 0 10px rgba(234,179,8,0.5)' : 'none' }}>{vozActiva ? <Mic size={14} /> : <MicOff size={14} />} VOZ</button>
          <button onClick={toggleAutoHoldFn} style={{ background: autoHoldActivo ? 'rgba(16, 185, 129, 0.2)' : '#333', color: autoHoldActivo ? '#10b981' : 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: autoHoldActivo ? '0 0 10px rgba(16,185,129,0.5)' : 'none' }}><Zap size={14} /> {autoHoldActivo ? 'HOLD ON' : 'HOLD'}</button>
          {conectado && capturarFn && (
            <button 
              onClick={esIncorrecta ? null : capturarFn} 
              disabled={esIncorrecta}
              style={{ 
                background: esIncorrecta ? '#4b5563' : '#3b82f6', 
                color: esIncorrecta ? '#9ca3af' : 'white', 
                border: 'none', 
                padding: '8px 15px', 
                borderRadius: '20px', 
                fontSize: '0.7rem', 
                fontWeight: 'bold', 
                cursor: esIncorrecta ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                boxShadow: esIncorrecta ? 'none' : '0 0 12px rgba(59,130,246,0.6)', 
                transition: 'transform 0.1s' 
              }} 
              onMouseDown={(e) => !esIncorrecta && (e.currentTarget.style.transform = 'scale(0.95)')} 
              onMouseUp={(e) => !esIncorrecta && (e.currentTarget.style.transform = 'scale(1)')}
            >
              <ChevronRight size={14} /> CAPTURAR / SIGUIENTE
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
        <span className="hud-valor-text" style={{ color: valor === 'OL' ? '#ff0000' : '#00ffff', fontSize: '4rem', fontWeight: 'bold', fontFamily: 'Consolas, monospace', textShadow: valor === 'OL' ? '0 0 15px rgba(255,0,0,0.5)' : '0 0 15px rgba(0,255,255,0.4)', lineHeight: '1' }}>{valor}</span>
        <span style={{ color: 'gray', fontSize: '1.2rem', fontWeight: 'bold' }}>{unidad}</span>
      </div>
      {esIncorrecta && (
        <div style={{ 
          width: '100%', 
          background: 'rgba(239, 68, 68, 0.2)', 
          border: '1px solid #ef4444', 
          color: '#ff6b6b', 
          padding: '8px 12px', 
          borderRadius: '8px', 
          fontSize: '0.8rem', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px', 
          marginTop: '10px', 
          textAlign: 'center',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)'
        }}>
          <AlertTriangle size={16} color="#ef4444" />
          ⚠️ ESCALA INCORRECTA: CONFIGURA EL DIAL FÍSICO O LA APP A LA MISMA FUNCIÓN
        </div>
      )}
    </div>
  );
};

const OscilogramaPanel = ({ valor, unidad, escalaActiva }) => {
  const [activo, setActivo] = useState(true);
  const [pausado, setPausado] = useState(false);
  const canvasRef = useRef(null);
  const puntosRef = useRef([]);
  const [minVal, setMinVal] = useState(null);
  const [maxVal, setMaxVal] = useState(null);

  useEffect(() => {
    puntosRef.current = [];
    setMinVal(null);
    setMaxVal(null);
  }, [escalaActiva]);

  useEffect(() => {
    if (pausado || valor === '----' || valor === '---' || !valor || valor === 'OL') return;
    
    let valNum = parseFloat(valor);
    if (isNaN(valNum)) return;

    const puntos = puntosRef.current;
    puntos.push(valNum);
    if (puntos.length > 150) {
      puntos.shift();
    }

    let currentMin = puntos[0];
    let currentMax = puntos[0];
    for (let i = 1; i < puntos.length; i++) {
      if (puntos[i] < currentMin) currentMin = puntos[i];
      if (puntos[i] > currentMax) currentMax = puntos[i];
    }
    setMinVal(currentMin);
    setMaxVal(currentMax);

    dibujarGrafico();
  }, [valor, pausado]);

  useEffect(() => {
    dibujarGrafico();
  }, [pausado, activo]);

  const dibujarGrafico = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activo) return;
    const ctx = canvas.getContext("2d");
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const puntos = puntosRef.current;
    if (puntos.length === 0) {
      ctx.fillStyle = "gray";
      ctx.font = "12px Consolas";
      ctx.textAlign = "center";
      ctx.fillText("Esperando lecturas...", W / 2, H / 2);
      return;
    }

    let min = puntos[0];
    let max = puntos[0];
    for (let i = 1; i < puntos.length; i++) {
      if (puntos[i] < min) min = puntos[i];
      if (puntos[i] > max) max = puntos[i];
    }
    
    let range = max - min;
    if (range < 0.1) {
      min -= 0.5;
      max += 0.5;
      range = max - min;
    } else {
      min -= range * 0.1;
      max += range * 0.1;
      range = max - min;
    }

    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    const len = puntos.length;
    for (let i = 0; i < len; i++) {
      const x = (i / 150) * (W - 80) + 15;
      const y = H - ((puntos[i] - min) / range) * (H - 40) - 20;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(156, 163, 175, 0.8)";
    ctx.font = "10px Consolas";
    ctx.textAlign = "right";
    ctx.fillText(`${max.toFixed(3)} ${unidad}`, W - 10, 20);
    ctx.fillText(`${((min + max) / 2).toFixed(3)} ${unidad}`, W - 10, H / 2);
    ctx.fillText(`${min.toFixed(3)} ${unidad}`, W - 10, H - 10);
  };

  const guardarFoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `Oscilograma_${escalaActiva.toUpperCase()}_${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.png`;
    link.href = url;
    link.click();
  };

  if (!activo) {
    return (
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "5px" }} className="no-print">
        <button onClick={() => setActivo(true)} style={{ background: "#1f2937", border: "1px solid #374151", color: "white", padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          📈 VER OSCILOGRAMA
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "15px", padding: "12px", marginTop: "10px", width: "100%" }} className="no-print">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#00ffff" }}>📈 OSCILOGRAMA DE CONSUMO ({escalaActiva.toUpperCase()})</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setPausado(!pausado)} style={{ background: pausado ? "#10b981" : "#d97706", border: "none", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>
            {pausado ? "▶ REANUDAR" : "⏸ PAUSAR"}
          </button>
          <button onClick={guardarFoto} style={{ background: "#2563eb", border: "none", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>
            📷 FOTO
          </button>
          <button onClick={() => setActivo(false)} style={{ background: "transparent", border: "none", color: "gray", padding: "4px 6px", cursor: "pointer" }}>
            ✕ Ocultar
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", height: "110px", backgroundColor: "#111827", borderRadius: "8px", border: "1px solid #222", display: "block" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.7rem", color: "gray" }}>
        <span>MIN: <strong style={{ color: "#ff5555" }}>{minVal !== null ? `${minVal.toFixed(3)} ${unidad}` : "----"}</strong></span>
        <span>MAX: <strong style={{ color: "#55ff55" }}>{maxVal !== null ? `${maxVal.toFixed(3)} ${unidad}` : "----"}</strong></span>
      </div>
    </div>
  );
};

export default function AppDiagnostico() {
  const [pasoActual, setPasoActual] = useState(null); const [historial, setHistorial] = useState([]); const [cargando, setCargando] = useState(true); const [tema, setTema] = useState('light');

  // MODALES GLOBALES
  const [mostrarAdmin, setMostrarAdmin] = useState(false); const [vistaAdmin, setVistaAdmin] = useState('login');
  const [estaAutenticado, setEstaAutenticado] = useState(false); const [emailAdmin, setEmailAdmin] = useState(''); const [passAdmin, setPassAdmin] = useState(''); const [errorLogin, setErrorLogin] = useState('');
  const [listaPasos, setListaPasos] = useState([]); const [pasosExpandidos, setPasosExpandidos] = useState({});
  const [notaVisible, setNotaVisible] = useState(false); const [tipTabActiva, setTipTabActiva] = useState(0);
  const [imgModalVisible, setImgModalVisible] = useState(false); const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [fallasEnSerie, setFallasEnSerie] = useState([]);
  const [bitacoraVisible, setBitacoraVisible] = useState(false); const [historialCasosVisible, setHistorialCasosVisible] = useState(false);  const [casosGuardados, setCasosGuardados] = useState([]); const [casoEditando, setCasoEditando] = useState(null); const [formCaso, setFormCaso] = useState({ marca: '', modelo: '', tecnico: 'Marshall Cell', sintomas: '', protocolo: '', solucionEmpleada: '', imgUrl: '', estadoReparacion: 'Pendiente', hardware: { cpu: '', memoria: '', pmic: '' }, consumoUsb: { voltaje: '', corriente: '', comportamiento: '', conBateria: '', sinBateria: '' }, consumoFuente: { inicial: '', postPower: '', comportamiento: '' }, lineasAfectadas: [] }); const [mensajeCaso, setMensajeCaso] = useState('');
  const [reporteVisible, setReporteVisible] = useState(false); const [casoReporte, setCasoReporte] = useState(null);

  // ESTADOS LIBRERÍA
  const [libreriaVisible, setLibreriaVisible] = useState(false); const [modelosLibreria, setModelosLibreria] = useState([]); const [modeloActivo, setModeloActivo] = useState(null); const [fpcActivo, setFpcActivo] = useState(null); const [formNuevoModelo, setFormNuevoModelo] = useState({ marca: '', nombre: '' }); const [formNuevoFpc, setFormNuevoFpc] = useState({ nombre: '', pines: 40 }); const [seccionLibreria, setSeccionLibreria] = useState('fpc'); 
  const [imagenFpcVisible, setImagenFpcVisible] = useState(false); 
  const [tipoImagenViendo, setTipoImagenViendo] = useState('placa');
  const [modalFpcAbierto, setModalFpcAbierto] = useState(false);

  // ESTADOS LIBRERÍA IC
  const [icActivo, setIcActivo] = useState(null);
  const [modalIcAbierto, setModalIcAbierto] = useState(false);
  const [formNuevoIc, setFormNuevoIc] = useState({ nombre: '', filas: 5, columnas: 5, esquinaGuia: 'top-left' });
  const [padActivoIc, setPadActivoIc] = useState('A1');
  const [modoIc, setModoIc] = useState('crear');
  const [escalaIc, setEscalaIc] = useState('diodo');


  // ESTADOS MULTÍMETRO
  const [usbConectado, setUsbConectado] = useState(false); const [lecturaUsb, setLecturaUsb] = useState({ valor: '----', unidad: '---' }); const [dispositivoUsb, setDispositivoUsb] = useState(null); const ordenCamposDock = ['vbus', 'dp', 'dm', 'cc1', 'cc2']; const [campoActivoDock, setCampoActivoDock] = useState('vbus'); const [pinActivoFpc, setPinActivoFpc] = useState(1); const [modoFpc, setModoFpc] = useState('crear'); const [escalaFpc, setEscalaFpc] = useState('diodo');

  // ESTADOS RFFE
  const [lecturaRffe, setLecturaRffe] = useState('0x00'); const [dispositivoSerial, setDispositivoSerial] = useState(null);

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
  
  const icActivoRef = useRef(icActivo); useEffect(() => { icActivoRef.current = icActivo; }, [icActivo]);
  const padActivoIcRef = useRef(padActivoIc); useEffect(() => { padActivoIcRef.current = padActivoIc; }, [padActivoIc]);
  const modoIcRef = useRef(modoIc); useEffect(() => { modoIcRef.current = modoIc; }, [modoIc]);
  const escalaIcRef = useRef(escalaIc); useEffect(() => { escalaIcRef.current = escalaIc; }, [escalaIc]);

  const [autoHoldActivo, setAutoHoldActivo] = useState(false); const autoHoldActivoRef = useRef(autoHoldActivo); useEffect(() => { autoHoldActivoRef.current = autoHoldActivo; }, [autoHoldActivo]);
  const lecturaRffeRef = useRef(lecturaRffe); useEffect(() => { lecturaRffeRef.current = lecturaRffe; }, [lecturaRffe]);
  const autoHoldValueRef = useRef(null); const autoHoldStartTimeRef = useRef(0); const autoHoldTriggeredRef = useRef(false);


  const cambiarSeccionLibreria = (nuevaSeccion) => {
    setSeccionLibreria(nuevaSeccion);
    setPinActivoFpc(1);
    setPadActivoIc('A1');
    setCampoActivoDock('vbus');
    setModoFpc('crear');
    setModoIc('crear');
  };

  const reproducirBip = () => { try { const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); const oscillator = audioCtx.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); oscillator.connect(audioCtx.destination); oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.1); } catch (e) { } };

  // GUARDADO UNIVERSAL
  const avanzarPinMagico = (valorForzado = null) => {
    const escalaActiva = seccionLibreriaRef.current === 'ic' ? escalaIcRef.current : escalaFpcRef.current;
    const escalaMultimetro = lecturaUsbRef.current.unidad;
    const esIncorrecta = usbConectado && (
      (escalaActiva === 'diodo' && (escalaMultimetro === 'uA' || escalaMultimetro === 'mA' || escalaMultimetro === 'A')) ||
      (escalaActiva === 'ua' && (escalaMultimetro === 'V' || escalaMultimetro === 'Diod' || escalaMultimetro === 'Ω')) ||
      (escalaActiva === 'amperio' && (escalaMultimetro === 'V' || escalaMultimetro === 'Diod' || escalaMultimetro === 'Ω')) ||
      (escalaActiva === 'voltio' && (escalaMultimetro === 'uA' || escalaMultimetro === 'mA' || escalaMultimetro === 'A')) ||
      (escalaActiva === 'ohmio' && (escalaMultimetro === 'uA' || escalaMultimetro === 'mA' || escalaMultimetro === 'A'))
    );
    if (esIncorrecta) return;
    
    reproducirBip();
    const valVivo = valorForzado || lecturaUsbRef.current.valor; const campoActual = campoActivoRef.current; const mFpc = modoFpcRef.current; const pinAct = pinActivoFpcRef.current;
    const mIc = modoIcRef.current; const padAct = padActivoIcRef.current;
    if (libreriaVisibleRef.current) {
      const modAct = modeloActivoRef.current; if (!modAct) return;
      let modeloActualizado = { ...modAct }; const seccion = seccionLibreriaRef.current;
      if (seccion === 'docktest') {
        const escala = escalaFpcRef.current;
        let key = 'docktestDiodo';
        if (escala === 'ua') key = 'docktestUa';
        else if (escala === 'voltio') key = 'docktestVoltio';
        else if (escala === 'ohmio') key = 'docktestOhmio';
        else if (escala === 'amperio') key = 'docktestAmperio';
        
        if (!modeloActualizado[key]) {
          modeloActualizado[key] = { vbus: '---', dp: '---', dm: '---', cc1: '---', cc2: '---' };
        }
        modeloActualizado[key][campoActual] = valVivo; setModeloActivo(modeloActualizado);
        setCampoActivoDock(prev => { const idx = ordenCamposDock.indexOf(prev); return (idx >= 0 && idx < ordenCamposDock.length - 1) ? ordenCamposDock[idx + 1] : prev; });
      } else if (seccion === 'fpc' && fpcActivoRef.current) {
        const fpcAct = fpcActivoRef.current;
        const escala = escalaFpcRef.current;
        const nuevosFpcs = modeloActualizado.fpcs.map(fpc => {
          if (fpc.id === fpcAct.id) {
            const nuevosPines = fpc.pines.map(p => {
               if (p.id === pinAct) {
                  return { 
                    ...p, 
                    valorSanoDiodo: (mFpc === 'crear' && escala === 'diodo' ? valVivo : p.valorSanoDiodo), 
                    valorSanoUa: (mFpc === 'crear' && escala === 'ua' ? valVivo : p.valorSanoUa),
                    valorSanoVoltio: (mFpc === 'crear' && escala === 'voltio' ? valVivo : p.valorSanoVoltio),
                    valorSanoOhmio: (mFpc === 'crear' && escala === 'ohmio' ? valVivo : p.valorSanoOhmio),
                    valorSanoAmperio: (mFpc === 'crear' && escala === 'amperio' ? valVivo : p.valorSanoAmperio),
                    valorSano: (mFpc === 'crear' ? valVivo : p.valorSano),
                    valorActual: (mFpc !== 'crear' ? valVivo : p.valorActual),
                    valorActualDiodo: (mFpc !== 'crear' && escala === 'diodo' ? valVivo : p.valorActualDiodo), 
                    valorActualUa: (mFpc !== 'crear' && escala === 'ua' ? valVivo : p.valorActualUa),
                    valorActualVoltio: (mFpc !== 'crear' && escala === 'voltio' ? valVivo : p.valorActualVoltio),
                    valorActualOhmio: (mFpc !== 'crear' && escala === 'ohmio' ? valVivo : p.valorActualOhmio),
                    valorActualAmperio: (mFpc !== 'crear' && escala === 'amperio' ? valVivo : p.valorActualAmperio)
                  };
               }
               return p;
            });
            const fpcMod = { ...fpc, pines: nuevosPines }; setFpcActivo(fpcMod); return fpcMod;
          } return fpc;
        });
        modeloActualizado.fpcs = nuevosFpcs; setModeloActualivo(modeloActualizado);
        setPinActivoFpc(prev => {
          let nextPin = prev + 1;
          while (nextPin <= fpcAct.pines.length) {
            const pinInfo = fpcAct.pines.find(p => p.id === nextPin);
            if (pinInfo && (pinInfo.tipo === 'GND' || pinInfo.tipo === 'NC')) { nextPin++; } else { break; }
          } return nextPin <= fpcAct.pines.length ? nextPin : prev;
        });
      } else if (seccion === 'ic' && icActivoRef.current) {
        const icAct = icActivoRef.current;
        const escala = escalaIcRef.current;
        const nuevosIcs = (modeloActualizado.ics || []).map(ic => {
          if (ic.id === icAct.id) {
            const nuevosPines = ic.pines.map(p => {
               if (p.id === padAct) {
                  return { 
                     ...p, 
                     valorSanoDiodo: (mIc === 'crear' && escala === 'diodo' ? valVivo : p.valorSanoDiodo), 
                     valorSanoUa: (mIc === 'crear' && escala === 'ua' ? valVivo : p.valorSanoUa),
                     valorSanoVoltio: (mIc === 'crear' && escala === 'voltio' ? valVivo : p.valorSanoVoltio),
                     valorSanoOhmio: (mIc === 'crear' && escala === 'ohmio' ? valVivo : p.valorSanoOhmio),
                     valorSanoAmperio: (mIc === 'crear' && escala === 'amperio' ? valVivo : p.valorSanoAmperio),
                     valorSano: (mIc === 'crear' ? valVivo : p.valorSano),
                     valorActual: (mIc !== 'crear' ? valVivo : p.valorActual),
                     valorActualDiodo: (mIc !== 'crear' && escala === 'diodo' ? valVivo : p.valorActualDiodo), 
                     valorActualUa: (mIc !== 'crear' && escala === 'ua' ? valVivo : p.valorActualUa),
                     valorActualVoltio: (mIc !== 'crear' && escala === 'voltio' ? valVivo : p.valorActualVoltio),
                     valorActualOhmio: (mIc !== 'crear' && escala === 'ohmio' ? valVivo : p.valorActualOhmio),
                     valorActualAmperio: (mIc !== 'crear' && escala === 'amperio' ? valVivo : p.valorActualAmperio)
                  };
               }
               return p;
            });
            const icMod = { ...ic, pines: nuevosPines }; setIcActivo(icMod); return icMod;
          } return ic;
        });
        modeloActualizado.ics = nuevosIcs; setModeloActivo(modeloActualizado);
        setPadActivoIc(prev => {
          const idx = icAct.pines.findIndex(p => p.id === prev);
          if (idx === -1) return prev;
          let nextIdx = idx + 1;
          while (nextIdx < icAct.pines.length) {
            const pinInfo = icAct.pines[nextIdx];
            if (pinInfo && (pinInfo.tipo === 'GND' || pinInfo.tipo === 'NC')) { nextIdx++; } else { break; }
          }
          return nextIdx < icAct.pines.length ? icAct.pines[nextIdx].id : prev;
        });
      }
    }
  };

  // WEBHID
  const conectarMultimetroUSB = async () => {
    if (typeof navigator === 'undefined' || !navigator.hid) { alert("Navegador no compatible."); return; }
    try {
      const devices = await navigator.hid.requestDevice({ filters: [{ vendorId: 0x1A86, productId: 0xE429 }] });
      if (devices.length === 0) return; const device = devices[0]; await device.open(); setDispositivoUsb(device); setUsbConect      device.addEventListener("inputreport", event => {
        const text = new TextDecoder("latin1").decode(event.data);
        let parsedVal = null;
        let parsedUni = null;
        const escalaActiva = seccionLibreriaRef.current === 'ic' ? escalaIcRef.current : escalaFpcRef.current;
        
        if (text.includes("OL") || text.includes("?0")) {
          parsedVal = "OL";
          if (escalaActiva === 'ua') {
            parsedUni = "uA";
          } else if (escalaActiva === 'amperio') {
            parsedUni = "A";
          } else if (escalaActiva === 'voltio') {
            parsedUni = "V";
          } else if (escalaActiva === 'ohmio') {
            parsedUni = "Ω";
          } else if (escalaActiva === 'diodo') {
            parsedUni = "Diod";
          } else {
            const textLower = text.toLowerCase();
            if (text.includes("V")) { parsedUni = "V"; }
            else if (textLower.includes("ohm") || text.includes("Ω")) { parsedUni = "Ω"; }
            else if (textLower.includes("ua") || text.includes("µ") || text.includes("μ") || textLower.includes("micro")) { parsedUni = "uA"; }
            else if (textLower.includes("ma")) { parsedUni = "mA"; }
            else if (text.includes("A") || textLower.includes("amp")) { parsedUni = "A"; }
            else { parsedUni = "Diod"; }
          }
        } else {
          const match = text.match(/([-+]?\d+\.\d+)/);
          if (match) {
            const rawVal = match[1];
            if (escalaActiva === 'ua') {
              parsedUni = "uA";
              parsedVal = rawVal;
            } else if (escalaActiva === 'amperio') {
              parsedUni = "A";
              parsedVal = rawVal;
            } else if (escalaActiva === 'voltio') {
              parsedUni = "V";
              parsedVal = parseFloat(rawVal).toFixed(3);
            } else if (escalaActiva === 'ohmio') {
              parsedUni = "Ω";
              parsedVal = rawVal;
            } else if (escalaActiva === 'diodo') {
              parsedUni = "Diod";
              parsedVal = parseFloat(rawVal).toFixed(3);
            } else {
              const textLower = text.toLowerCase();
              if (text.includes("V")) { parsedUni = "V"; }
              else if (textLower.includes("ohm") || text.includes("Ω")) { parsedUni = "Ω"; }
              else if (textLower.includes("ua") || text.includes("µ") || text.includes("μ") || textLower.includes("micro")) { parsedUni = "uA"; }
              else if (textLower.includes("ma")) { parsedUni = "mA"; }
              else if (text.includes("A") || textLower.includes("amp")) { parsedUni = "A"; }
              else { parsedUni = "Diod"; }
              
              if (parsedUni === "V" || parsedUni === "Diod") { parsedVal = parseFloat(rawVal).toFixed(3); }
              else { parsedVal = rawVal; }
            }
          }
        }
        
        if (parsedVal !== null && parsedUni !== null) {
          setLecturaUsb({ valor: parsedVal, unidad: parsedUni });
          if (autoHoldActivoRef.current) {
            const valNum = parseFloat(parsedVal);
            const esIncorrecta = (escalaActiva === 'diodo' && (parsedUni !== 'Diod' && parsedUni !== 'V')) ||
                                 (escalaActiva === 'ua' && parsedUni !== 'uA') ||
                                 (escalaActiva === 'amperio' && parsedUni !== 'A') ||
                                 (escalaActiva === 'voltio' && parsedUni !== 'V') ||
                                 (escalaActiva === 'ohmio' && parsedUni !== 'Ω');
            if (esIncorrecta) {
              autoHoldValueRef.current = null;
              autoHoldTriggeredRef.current = false;
            } else {
              let tol = 0.003;
              let esCeroInactivo = false;
              if (escalaActiva === 'ua') {
                tol = 1.5;
                esCeroInactivo = valNum < 1.0;
              } else if (escalaActiva === 'amperio') {
                tol = 0.05;
                esCeroInactivo = valNum < 0.01;
              } else if (escalaActiva === 'voltio') {
                tol = 0.05;
                esCeroInactivo = valNum < 0.1;
              } else if (escalaActiva === 'ohmio') {
                tol = 5.0;
                esCeroInactivo = valNum < 1.0;
              }
              
              if (!isNaN(valNum) && !esCeroInactivo) {
                if (autoHoldValueRef.current !== null && Math.abs(valNum - autoHoldValueRef.current) <= tol) {
                  if (!autoHoldTriggeredRef.current && Date.now() - autoHoldStartTimeRef.current >= 1500) { autoHoldTriggeredRef.current = true; avanzarPinMagico(parsedVal); }
                } else { autoHoldValueRef.current = valNum; autoHoldStartTimeRef.current = Date.now(); autoHoldTriggeredRef.current = false; }
              } else { autoHoldValueRef.current = null; autoHoldTriggeredRef.current = false; }
            }
          }
        }
      });
        }
      });
    } catch (error) { alert("Error USB."); }
  };
  const desconectarMultimetroUSB = async () => { if (dispositivoUsb) { try { await dispositivoUsb.close(); } catch (e) { } setDispositivoUsb(null); } setUsbConectado(false); setLecturaUsb({ valor: '----', unidad: '---' }); };

  // WEBSERIAL RFFE (RP2040)
  const conectarEscanerRFFE = async () => {
    if (typeof navigator === 'undefined' || !navigator.serial) { alert("Navegador no soporta Serial."); return; }
    try {
      const port = await navigator.serial.requestPort(); await port.open({ baudRate: 115200 }); setDispositivoSerial(port);
      const reader = port.readable.getReader();
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        const text = new TextDecoder().decode(value).trim();
        if (text.startsWith('0x')) setLecturaRffe(text);
      }
    } catch (e) { alert("Error Serial."); }
  };

  useEffect(() => {
    if (!lecturaRffe || lecturaRffe === '0x00') return;
    const timeout = setTimeout(() => {
      reproducirBip();
      setModeloActivo(prev => {
        if (!prev || !prev.rffe_ics) return prev;
        const nuevosIcs = prev.rffe_ics.map(ic => {
          return { ...ic, mfgIdActual: lecturaRffe };
        });
        return { ...prev, rffe_ics: nuevosIcs };
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [lecturaRffe]);

  useEffect(() => { const handleKeyDown = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; if ((e.code === 'Space' || e.key === 'Enter') && libreriaVisible) { e.preventDefault(); avanzarPinMagico(); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [libreriaVisible]);

  // VOZ
  const [vozActiva, setVozActiva] = useState(false); const recognitionRef = useRef(null); const vozActivaRef = useRef(vozActiva); useEffect(() => { vozActivaRef.current = vozActiva; }, [vozActiva]);
  const toggleVoz = () => {
    if (typeof window === 'undefined') return; const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) { alert("Navegador no soporta voz."); return; }
    if (vozActiva) { if (recognitionRef.current) { recognitionRef.current.onend = null; recognitionRef.current.stop(); } setVozActiva(false); }
    else {
      const recognition = new SpeechRecognition(); recognition.continuous = true; recognition.lang = 'es-PE'; recognition.interimResults = false;
      recognition.onresult = (event) => { const transcript = event.results[event.resultIndex][0].transcript.toLowerCase().trim(); if (transcript.includes('ok') || transcript.includes('okay') || transcript.includes('siguiente') || transcript.includes('listo') || transcript.includes('ya')) { avanzarPinMagico(); } };
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
  const crearNuevoModeloDB = async (e) => { e.preventDefault(); if (!formNuevoModelo.marca || !formNuevoModelo.nombre) return; const idUnico = `${formNuevoModelo.marca}_${formNuevoModelo.nombre}`.toLowerCase().replace(/\s+/g, '_'); const nuevoObj = { marca: formNuevoModelo.marca, nombre: formNuevoModelo.nombre, fpcs: [], ics: [], rffe_ics: [], docktestDiodo: { vbus: '---', dp: '---', dm: '---', cc1: '---', cc2: '---' }, docktestUa: { vbus: '---', dp: '---', dm: '---', cc1: '---', cc2: '---' }, docktestVoltio: { vbus: '---', dp: '---', dm: '---', cc1: '---', cc2: '---' }, docktestOhmio: { vbus: '---', dp: '---', dm: '---', cc1: '---', cc2: '---' }, docktestAmperio: { vbus: '---', dp: '---', dm: '---', cc1: '---', cc2: '---' } }; await setDoc(doc(db, "hardware_db", idUnico), nuevoObj); setFormNuevoModelo({ marca: '', nombre: '' }); cargarLibreriaDB(); setModeloActivo({ ...nuevoObj, id: idUnico }); };
  const guardarModeloActualDB = async () => { if (!modeloActivo) return; await setDoc(doc(db, "hardware_db", modeloActivo.id), modeloActivo); alert("¡Placa guardada en la nube de Marshall Cell!"); cargarLibreriaDB(); };
  
  const crearNuevoIcEnModelo = () => {
    if (!formNuevoIc.nombre || formNuevoIc.filas <= 0 || formNuevoIc.columnas <= 0) return;
    const filasCount = parseInt(formNuevoIc.filas);
    const columnasCount = parseInt(formNuevoIc.columnas);
    const pinesArray = [];
    const filasLetras = LETRAS_FILAS.slice(0, filasCount);
    for (let r = 0; r < filasCount; r++) {
      const letra = filasLetras[r];
      for (let c = 1; c <= columnasCount; c++) {
        pinesArray.push({
          id: `${letra}${c}`,
          nombre: `Linea_${letra}${c}`,
          tipo: 'DATA',
          valorSano: '---',
          valorActual: '---'
        });
      }
    }
    const nuevoIc = {
      id: Date.now().toString(),
      nombre: formNuevoIc.nombre.replace(/ /g, '_'),
      filas: filasCount,
      columnas: columnasCount,
      esquinaGuia: formNuevoIc.esquinaGuia || 'top-left',
      pines: pinesArray
    };
    const modActualizado = { ...modeloActivo, ics: [...(modeloActivo.ics || []), nuevoIc] };
    setModeloActivo(modActualizado);
    setIcActivo(nuevoIc);
    setFormNuevoIc({ nombre: '', filas: 5, columnas: 5, esquinaGuia: 'top-left' });
    setPadActivoIc('A1');
  };

  const eliminarIcActivo = () => {
    if (!icActivo || !window.confirm(`¿Seguro de eliminar el IC ${icActivo.nombre}?`)) return;
    const modActualizado = { ...modeloActivo, ics: (modeloActivo.ics || []).filter(i => i.id !== icActivo.id) };
    setModeloActivo(modActualizado);
    setIcActivo(null);
    setPadActivoIc('A1');
  };

  const cambiarEsquinaGuiaIc = (nuevaEsquina) => {
    if (!icActivo) return;
    const icMod = { ...icActivo, esquinaGuia: nuevaEsquina };
    setIcActivo(icMod);
    setModeloActivo(prev => ({ ...prev, ics: (prev.ics || []).map(i => i.id === icMod.id ? icMod : i) }));
  };

  
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

  const editarUbicacionIc = (tipo) => { 
    if (!icActivo) return; 
    const actual = tipo === 'placa' ? icActivo.imgPlaca : icActivo.imgEsquema;
    const nuevaUrl = window.prompt(`Ingresa el enlace de la imagen (${tipo}):`, actual || ""); 
    if (nuevaUrl !== null) { 
        const icMod = { ...icActivo, [tipo === 'placa' ? 'imgPlaca' : 'imgEsquema']: nuevaUrl }; 
        setIcActivo(icMod); 
        setModeloActivo(prev => ({ ...prev, ics: (prev.ics || []).map(i => i.id === icMod.id ? icMod : i) })); 
    } 
  };

  // AUTO-SAVE HÍBRIDO (localStorage + Firebase) - AHORA DESPUÉS DE guardarModeloActualDB
  const {
    cambiosPendientes: cambiosPendientesFpc,
    guardando: guardandoFpc,
    ultimaSincronizacion: ultimaSincFpc,
    sincronizarAhora: sincronizarFpcAhora,
    descartarCambios: descartarCambiosFpc
  } = useAutoSave(
    fpcActivo ? `fpc_borrador_${modeloActivo?.id}_${fpcActivo.id}` : null,
    fpcActivo,
    guardarModeloActualDB
  );

  const {
    cambiosPendientes: cambiosPendientesIc,
    guardando: guardandoIc,
    ultimaSincronizacion: ultimaSincIc,
    sincronizarAhora: sincronizarIcAhora,
    descartarCambios: descartarCambiosIc
  } = useAutoSave(
    icActivo ? `ic_borrador_${modeloActivo?.id}_${icActivo.id}` : null,
    icActivo,
    guardarModeloActualDB
  );

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
  const prepararNuevoCaso = () => { setFormCaso({ marca: '', modelo: '', tecnico: 'Marshall Cell', sintomas: '', protocolo: '', solucionEmpleada: '', imgUrl: '', estadoReparacion: 'Pendiente', hardware: { cpu: '', memoria: '', pmic: '' }, consumoUsb: { voltaje: '', corriente: '', comportamiento: '', conBateria: '', sinBateria: '' }, consumoFuente: { inicial: '', postPower: '', comportamiento: '' }, lineasAfectadas: [] }); setCasoEditando(null); setMensajeCaso(''); setBitacoraVisible(true); };
  const guardarBitacora = async (e) => { e.preventDefault(); setMensajeCaso('Guardando...'); try { if (casoEditando) { await updateDoc(doc(db, "historial_reparaciones", casoEditando), { ...formCaso }); } else { await addDoc(collection(db, "historial_reparaciones"), { ...formCaso, fecha: new Date().toISOString() }); } setMensajeCaso('✅ ¡Registrado!'); setTimeout(() => { setBitacoraVisible(false); cargarHistorialCasos(); }, 1000); } catch (e) { setMensajeCaso('❌ Error.'); } };
  const eliminarCaso = async (id) => { if (window.confirm('¿Seguro de eliminar este caso?')) { try { await deleteDoc(doc(db, "historial_reparaciones", id)); cargarHistorialCasos(); } catch (error) { } } };
  const abrirReporte = (caso) => { setCasoReporte(caso); setReporteVisible(true); setHistorialCasosVisible(false); };
  const imprimirReporte = async () => { if (!casoReporte) return; try { const { pdf } = await import('@react-pdf/renderer'); const ReportePDF = (await import('../components/pdfx/ReportePDF')).default; const blob = await pdf(<ReportePDF caso={casoReporte} />).toBlob(); window.open(URL.createObjectURL(blob), '_blank'); } catch (error) { alert("Error generando PDF."); } };
  const enviarWhatsApp = () => {
    if (!casoReporte) return;
    const solucion = casoReporte.solucionEmpleada ? `\n\n✅ *SOLUCIÓN:* ${casoReporte.solucionEmpleada}` : '';
    const texto = `📱 *MARSHALL CELL - REPORTE TÉCNICO*\n\n*Equipo:* ${casoReporte.marca} ${casoReporte.modelo}\n*ID:* #${casoReporte.id.substring(0, 6).toUpperCase()}\n*Fecha:* ${new Date(casoReporte.fecha).toLocaleDateString()}\n\n⚠️ *Síntoma:* ${casoReporte.sintomas}\n\n🛠️ *Diagnóstico:* ${casoReporte.protocolo || 'Pendiente.'}${solucion}\n\n👨‍🔧 *Técnico:* ${casoReporte.tecnico || 'Marshall'}\n📍 *Laboratorio:* Oropesa, Cusco`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };
  const reporteRef = useRef(null);
  const exportarComoImagen = async () => {
    if (!reporteRef.current) return;
    try {
      const dataUrl = await toPng(reporteRef.current, {
        backgroundColor: '#111827',
        pixelRatio: 3,
        style: {
          borderRadius: '0',
          margin: '0',
          padding: '20px'
        }
      });
      const link = document.createElement('a');
      link.download = `reporte_${casoReporte?.marca || 'marshall'}_${casoReporte?.modelo || 'cell'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      alert("Error exportando imagen.");
    }
  };

  if (!pasoActual) return <div style={{ height: '100vh', backgroundColor: '#111827', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2 style={{ color: '#0ff' }}>Iniciando Marshall Cell...</h2></div>;
  const t = estilos[tema]; const tieneTips = pasoActual.tabsNota && pasoActual.tabsNota.length > 0;

  // Componente renderizador de botones de imagen para FPC
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

  const BotonesImagenIC = ({ compacto = false }) => {
    if (!icActivo) return null;
    return (
      <div style={{ display: 'flex', gap: '5px' }}>
        {icActivo.imgPlaca ? (
          <button onClick={() => { setTipoImagenViendo('placa_ic'); setImagenFpcVisible(true); }} 
            style={{ padding: compacto ? '4px 8px' : '6px 10px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: compacto ? '0.65rem' : '0.75rem' }}>
            <ImageIcon size={compacto ? 12 : 14} /> {compacto ? '' : 'Placa'}
          </button>
        ) : (
          <button onClick={() => editarUbicacionIc('placa')} 
            style={{ padding: compacto ? '4px 8px' : '6px 10px', borderRadius: '6px', border: '1px dashed #4b5563', background: 'transparent', color: '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: compacto ? '0.6rem' : '0.7rem' }}>
            + Placa
          </button>
        )}
        {icActivo.imgEsquema ? (
          <button onClick={() => { setTipoImagenViendo('esquema_ic'); setImagenFpcVisible(true); }} 
            style={{ padding: compacto ? '4px 8px' : '6px 10px', borderRadius: '6px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: compacto ? '0.65rem' : '0.75rem' }}>
            <Map size={compacto ? 12 : 14} /> {compacto ? '' : 'Datasheet'}
          </button>
        ) : (
          <button onClick={() => editarUbicacionIc('esquema')} 
            style={{ padding: compacto ? '4px 8px' : '6px 10px', borderRadius: '6px', border: '1px dashed #4b5563', background: 'transparent', color: '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: compacto ? '0.6rem' : '0.7rem' }}>
            + Datasheet
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
                    <button key={mod.id} onClick={() => { setModeloActivo(mod); setFpcActivo(mod.fpcs[0] || null); setIcActivo(mod.ics?.[0] || null); }} style={{ width: '100%', padding: '12px', textAlign: 'left', backgroundColor: modeloActivo?.id === mod.id ? '#1f2937' : 'transparent', border: 'none', color: modeloActivo?.id === mod.id ? '#00ffff' : '#9ca3af', borderLeft: modeloActivo?.id === mod.id ? '4px solid #00ffff' : '4px solid transparent', cursor: 'pointer', borderRadius: '0 8px 8px 0', marginBottom: '5px', fontWeight: 'bold' }}>
                      {mod.marca} {mod.nombre}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#111827' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>{modeloActivo ? `${modeloActivo.marca} ${modeloActivo.nombre}` : 'Selecciona Modelo'}</h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {modeloActivo && (
                      <button 
                        onClick={seccionLibreria === 'ic' ? sincronizarIcAhora : sincronizarFpcAhora} 
                        style={{ 
                          background: (seccionLibreria === 'ic' ? cambiosPendientesIc : cambiosPendientesFpc) ? '#f59e0b' : '#10b981', 
                          color: 'white', 
                          border: 'none', 
                          padding: '8px 15px', 
                          borderRadius: '8px', 
                          fontWeight: 'bold', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '5px' 
                        }}
                      >
                        <Save size={16} /> 
                        {seccionLibreria === 'ic' 
                          ? (guardandoIc ? 'Guardando...' : 'Guardar IC') 
                          : seccionLibreria === 'fpc'
                            ? (guardandoFpc ? 'Guardando...' : 'Guardar FPC')
                            : seccionLibreria === 'docktest'
                              ? (guardandoFpc ? 'Guardando...' : 'Guardar Docktest')
                              : (guardandoFpc ? 'Guardando...' : 'Guardar RFFE')
                        }
                      </button>
                    )}
                    <button onClick={() => setLibreriaVisible(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}><X size={16} /></button>
                  </div>
                </div>
                {modeloActivo ? (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      <button onClick={() => cambiarSeccionLibreria('docktest')} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: seccionLibreria === 'docktest' ? '#3b82f6' : '#1f2937', color: 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Docktest</button>
                      <button onClick={() => cambiarSeccionLibreria('fpc')} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: seccionLibreria === 'fpc' ? '#8b5cf6' : '#1f2937', color: 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Planos FPC</button>
                      <button onClick={() => cambiarSeccionLibreria('ic')} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: seccionLibreria === 'ic' ? '#ec4899' : '#1f2937', color: 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Planos IC / BGA</button>
                      <button onClick={() => cambiarSeccionLibreria('rffe')} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: seccionLibreria === 'rffe' ? '#10b981' : '#1f2937', color: 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Módulo RFFE</button>
                    </div>
                    <VisorHUD valor={lecturaUsb.valor} unidad={lecturaUsb.unidad} conectado={usbConectado} conectarFn={conectarMultimetroUSB} desconectarFn={desconectarMultimetroUSB} vozActiva={vozActiva} toggleVozFn={toggleVoz} autoHoldActivo={autoHoldActivo} toggleAutoHoldFn={() => setAutoHoldActivo(!autoHoldActivo)} capturarFn={avanzarPinMagico} escalaActiva={seccionLibreria === 'ic' ? escalaIc : escalaFpc} />

                    {seccionLibreria === 'docktest' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ backgroundColor: '#000', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ color: '#3b82f6', margin: 0 }}>Captura de Docktest</h3>
                            <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px', flexWrap: 'wrap' }}>
                              <button onClick={() => setEscalaFpc('diodo')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'diodo' ? '#3b82f6' : 'transparent', color: escalaFpc === 'diodo' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Diodo</button>
                              <button onClick={() => setEscalaFpc('ua')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'ua' ? '#10b981' : 'transparent', color: escalaFpc === 'ua' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>uA</button>
                              <button onClick={() => setEscalaFpc('amperio')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'amperio' ? '#f59e0b' : 'transparent', color: escalaFpc === 'amperio' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Amperios</button>
                              <button onClick={() => setEscalaFpc('voltio')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'voltio' ? '#ef4444' : 'transparent', color: escalaFpc === 'voltio' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Voltios</button>
                              <button onClick={() => setEscalaFpc('ohmio')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'ohmio' ? '#a855f7' : 'transparent', color: escalaFpc === 'ohmio' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Ohmios</button>
                            </div>
                          </div>
                          <div className="grid-dock" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
                            {ordenCamposDock.map(c => {
                              let valuesObj = modeloActivo.docktestDiodo;
                              if (escalaFpc === 'ua') valuesObj = modeloActivo.docktestUa;
                              else if (escalaFpc === 'voltio') valuesObj = modeloActivo.docktestVoltio;
                              else if (escalaFpc === 'ohmio') valuesObj = modeloActivo.docktestOhmio;
                              else if (escalaFpc === 'amperio') valuesObj = modeloActivo.docktestAmperio;
                              
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
                        <OscilogramaPanel valor={lecturaUsb.valor} unidad={lecturaUsb.unidad} escalaActiva={escalaFpc} />
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

                    {seccionLibreria === 'ic' && (
                      <div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', flex: 1, paddingBottom: '5px', scrollbarWidth: 'thin' }}>
                            {(modeloActivo.ics || []).map(ic => (
                              <button key={ic.id} onClick={() => { setIcActivo(ic); setPadActivoIc('A1'); setModalIcAbierto(true); }} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', background: icActivo?.id === ic.id ? '#ec4899' : '#1f2937', color: 'white', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>{ic.nombre} ({ic.filas}x{ic.columnas})</button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '5px', background: '#1a1a1a', padding: '5px', borderRadius: '10px', border: '1px solid #333', flexWrap: 'wrap', alignItems: 'center' }}>
                            <input placeholder="Nombre IC..." value={formNuevoIc.nombre} onChange={e => setFormNuevoIc({ ...formNuevoIc, nombre: e.target.value.replace(/ /g, '_') })} style={{ ...estilos.inputDark, width: '100px', padding: '5px', fontSize: '0.8rem' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span style={{ color: 'gray', fontSize: '0.75rem' }}>Fil:</span>
                              <input type="number" placeholder="Filas" min="1" max="40" value={formNuevoIc.filas} onChange={e => setFormNuevoIc({ ...formNuevoIc, filas: e.target.value })} style={{ ...estilos.inputDark, width: '40px', padding: '5px', textAlign: 'center', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span style={{ color: 'gray', fontSize: '0.75rem' }}>Col:</span>
                              <input type="number" placeholder="Col" min="1" max="40" value={formNuevoIc.columnas} onChange={e => setFormNuevoIc({ ...formNuevoIc, columnas: e.target.value })} style={{ ...estilos.inputDark, width: '40px', padding: '5px', textAlign: 'center', fontSize: '0.8rem' }} />
                            </div>
                            <select value={formNuevoIc.esquinaGuia} onChange={e => setFormNuevoIc({ ...formNuevoIc, esquinaGuia: e.target.value })} style={{ background: '#1f2937', color: 'white', border: '1px solid #333', padding: '5px', borderRadius: '5px', outline: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                              <option value="top-left">↖ Top-Left</option>
                              <option value="top-right">↗ Top-Right</option>
                              <option value="bottom-left">↙ Bottom-Left</option>
                              <option value="bottom-right">↘ Bottom-Right</option>
                            </select>
                            <button onClick={crearNuevoIcEnModelo} style={{ background: '#10b981', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>+</button>
                          </div>
                        </div>
                        {icActivo ? (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                              <span style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '1rem' }}>{icActivo.nombre} ({icActivo.filas}x{icActivo.columnas})</span> 
                              <span style={{ fontSize: '0.75rem' }}>seleccionado — haz click en el nombre arriba para abrir el visor del IC.</span>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Cambiar Guía:</span>
                                <select value={icActivo.esquinaGuia || 'top-left'} onChange={e => cambiarEsquinaGuiaIc(e.target.value)} style={{ background: '#1f2937', color: 'white', border: '1px solid #333', padding: '4px 8px', borderRadius: '5px', outline: 'none', fontSize: '0.75rem', cursor: 'pointer' }}>
                                  <option value="top-left">↖ Top-Left</option>
                                  <option value="top-right">↗ Top-Right</option>
                                  <option value="bottom-left">↙ Bottom-Left</option>
                                  <option value="bottom-right">↘ Bottom-Right</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ) : (<div style={{ textAlign: 'center', padding: '50px', color: 'gray' }}><Cpu size={48} style={{ opacity: 0.3, marginBottom: '10px' }} /><p>Crea un IC arriba para empezar a mapear.</p></div>)}
                      </div>
                    )}

                    {seccionLibreria === 'rffe' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ backgroundColor: '#000', padding: '15px', borderRadius: '12px', border: '1px solid #333', display: 'flex', justifyContent: 'center' }}>
                           <button onClick={conectarEscanerRFFE} style={{ background: dispositivoSerial ? 'rgba(16, 185, 129, 0.2)' : '#333', color: dispositivoSerial ? '#10b981' : 'white', border: 'none', padding: '10px 20px', borderRadius: '25px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <Link size={18} /> {dispositivoSerial ? 'ESCÁNER RFFE CONECTADO' : 'CONECTAR ESCÁNER RP2040'}
                           </button>
                        </div>
                        <EscanerRFFE
                          modeloActivo={modeloActivo}
                          setModeloActivo={setModeloActivo}
                          modo={'crear'}
                          lecturaRffe={lecturaRffe}
                        />
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
                <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px', alignItems: 'center' }}>
                  <BotonesImagenFPC />
                  <button onClick={editarPinesFpcActivo} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#eab308', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }}>✏️ Pines</button>
                  {cambiosPendientesFpc && (
                    <button onClick={() => { descartarCambiosFpc(); setFpcActivo(prev => prev ? {...prev} : null); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px dashed #6b7280', background: 'transparent', color: '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.65rem' }}>↩ Descartar</button>
                  )}
                  <button onClick={() => { eliminarFpcActivo(); setModalFpcAbierto(false); }} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>🗑️</button>
                </div>
                <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => setEscalaFpc('diodo')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'diodo' ? '#8b5cf6' : 'transparent', color: escalaFpc === 'diodo' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Diodo</button>
                  <button onClick={() => setEscalaFpc('ua')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'ua' ? '#10b981' : 'transparent', color: escalaFpc === 'ua' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>uA</button>
                  <button onClick={() => setEscalaFpc('amperio')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'amperio' ? '#f59e0b' : 'transparent', color: escalaFpc === 'amperio' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Amperios</button>
                  <button onClick={() => setEscalaFpc('voltio')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'voltio' ? '#ef4444' : 'transparent', color: escalaFpc === 'voltio' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Voltios</button>
                  <button onClick={() => setEscalaFpc('ohmio')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaFpc === 'ohmio' ? '#a855f7' : 'transparent', color: escalaFpc === 'ohmio' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Ohmios</button>
                </div>
                <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px' }}>
                  <button onClick={() => setModoFpc('crear')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: modoFpc === 'crear' ? '#8b5cf6' : 'transparent', color: modoFpc === 'crear' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Grabar</button>
                  <button onClick={() => setModoFpc('diagnostico')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: modoFpc === 'diagnostico' ? '#ef4444' : 'transparent', color: modoFpc === 'diagnostico' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Diagnóstico</button>
                </div>
                <button onClick={() => setModalFpcAbierto(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '10px 20px', flexShrink: 0 }}>
              <VisorHUD valor={lecturaUsb.valor} unidad={lecturaUsb.unidad} conectado={usbConectado} conectarFn={conectarMultimetroUSB} desconectarFn={desconectarMultimetroUSB} vozActiva={vozActiva} toggleVozFn={toggleVoz} autoHoldActivo={autoHoldActivo} toggleAutoHoldFn={() => setAutoHoldActivo(!autoHoldActivo)} capturarFn={avanzarPinMagico} escalaActiva={escalaFpc} />
              <OscilogramaPanel valor={lecturaUsb.valor} unidad={lecturaUsb.unidad} escalaActiva={escalaFpc} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 20px 20px' }}>
              <FPCInteligente 
                pines={fpcActivo.pines} 
                setPines={(updater) => {
                  const arrNuevo = typeof updater === 'function' ? updater(fpcActivo.pines) : updater;
                  const fpcMod = { ...fpcActivo, pines: arrNuevo }; setFpcActivo(fpcMod);
                  setModeloActivo(prev => ({ ...prev, fpcs: prev.fpcs.map(f => f.id === fpcMod.id ? fpcMod : f) }));
                }} 
                pinActivo={pinActivoFpc} 
                setPinActivo={setPinActivoFpc} 
                modo={modoFpc} 
                escala={escalaFpc} 
                lecturaEnVivo={lecturaUsb.valor}
                onGuardar={sincronizarFpcAhora}
                cambiosPendientes={cambiosPendientesFpc}
                guardando={guardandoFpc}
                ultimaSincronizacion={ultimaSincFpc}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL FULLSCREEN: VISOR DE PINES IC / BGA --- */}
      <AnimatePresence>
        {modalIcAbierto && icActivo && modeloActivo && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0b0f', zIndex: 2500, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', flexShrink: 0, flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setModalIcAbierto(false)} style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}><ArrowLeft size={22} /></button>
                <Cpu size={20} color="#ec4899" />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{icActivo.nombre}</span>
                <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '12px', background: '#1f2937', color: '#9ca3af', fontWeight: 'bold' }}>{icActivo.filas}x{icActivo.columnas} PADS</span>
              </div>
              <div className="fpc-tools" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px', alignItems: 'center' }}>
                  <BotonesImagenIC />
                  {cambiosPendientesIc && (
                    <button onClick={() => { descartarCambiosIc(); setIcActivo(prev => prev ? {...prev} : null); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px dashed #6b7280', background: 'transparent', color: '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.65rem' }}>↩ Descartar</button>
                  )}
                  <button onClick={() => { eliminarIcActivo(); setModalIcAbierto(false); }} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Eliminar IC</button>
                </div>
                <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => setEscalaIc('diodo')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaIc === 'diodo' ? '#ec4899' : 'transparent', color: escalaIc === 'diodo' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Diodo</button>
                  <button onClick={() => setEscalaIc('ua')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaIc === 'ua' ? '#10b981' : 'transparent', color: escalaIc === 'ua' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>uA</button>
                  <button onClick={() => setEscalaIc('amperio')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaIc === 'amperio' ? '#f59e0b' : 'transparent', color: escalaIc === 'amperio' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Amperios</button>
                  <button onClick={() => setEscalaIc('voltio')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaIc === 'voltio' ? '#ef4444' : 'transparent', color: escalaIc === 'voltio' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Voltios</button>
                  <button onClick={() => setEscalaIc('ohmio')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: escalaIc === 'ohmio' ? '#a855f7' : 'transparent', color: escalaIc === 'ohmio' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Ohmios</button>
                </div>
                <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px' }}>
                  <button onClick={() => setModoIc('crear')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: modoIc === 'crear' ? '#ec4899' : 'transparent', color: modoIc === 'crear' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Grabar</button>
                  <button onClick={() => setModoIc('diagnostico')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: modoIc === 'diagnostico' ? '#ef4444' : 'transparent', color: modoIc === 'diagnostico' ? 'white' : 'gray', fontWeight: 'bold', cursor: 'pointer' }}>Diagnóstico</button>
                </div>
                <button onClick={() => setModalIcAbierto(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '10px 20px', flexShrink: 0 }}>
              <VisorHUD valor={lecturaUsb.valor} unidad={lecturaUsb.unidad} conectado={usbConectado} conectarFn={conectarMultimetroUSB} desconectarFn={desconectarMultimetroUSB} vozActiva={vozActiva} toggleVozFn={toggleVoz} autoHoldActivo={autoHoldActivo} toggleAutoHoldFn={() => setAutoHoldActivo(!autoHoldActivo)} capturarFn={avanzarPinMagico} escalaActiva={escalaIc} />
              <OscilogramaPanel valor={lecturaUsb.valor} unidad={lecturaUsb.unidad} escalaActiva={escalaIc} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 20px 20px' }}>
              <ICInteligente 
                ic={icActivo} 
                setPines={(updater) => {
                  const arrNuevo = typeof updater === 'function' ? updater(icActivo.pines) : updater;
                  const icMod = { ...icActivo, pines: arrNuevo }; setIcActivo(icMod);
                  setModeloActivo(prev => ({ ...prev, ics: (prev.ics || []).map(i => i.id === icMod.id ? icMod : i) }));
                }} 
                padActivo={padActivoIc} 
                setPadActivo={setPadActivoIc} 
                modo={modoIc} 
                escala={escalaIc} 
                lecturaEnVivo={lecturaUsb.valor}
                onGuardar={sincronizarIcAhora}
                cambiosPendientes={cambiosPendientesIc}
                guardando={guardandoIc}
                ultimaSincronizacion={ultimaSincIc}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- VISUALIZADOR DE IMAGENES (PLACA O ESQUEMA) --- */}
      <AnimatePresence>
        {imagenFpcVisible && (fpcActivo || icActivo) && (
          (() => {
            const esIc = tipoImagenViendo.endsWith('_ic');
            const itemActivo = esIc ? icActivo : fpcActivo;
            if (!itemActivo) return null;
            const tipoLimpio = esIc ? tipoImagenViendo.replace('_ic', '') : tipoImagenViendo;
            const imgPlaca = itemActivo.imgPlaca || '';
            const imgEsquema = itemActivo.imgEsquema || '';
            const urlImg = tipoLimpio === 'placa' ? imgPlaca : imgEsquema;
            const colorBorde = tipoLimpio === 'placa' ? '#3b82f6' : '#8b5cf6';
            const tituloText = `Vista: ${tipoLimpio === 'placa' ? (esIc ? 'Ubicación IC en Placa' : 'Placa Base') : (esIc ? 'Datasheet del IC' : 'Esquemático')} (${itemActivo.nombre})`;
            
            return (
              <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setImagenFpcVisible(false)}>
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ width: '95vw', maxWidth: '1000px', height: '80vh', backgroundColor: '#111827', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `2px solid ${colorBorde}` }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ padding: '15px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {tipoLimpio === 'placa' ? <ImageIcon size={20} color="#3b82f6" /> : <Map size={20} color="#8b5cf6" />}
                      <span style={{ color: 'white', fontWeight: 'bold' }}>{tituloText}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      {imgPlaca && imgEsquema && (
                        <div style={{ display: 'flex', gap: '5px', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px' }}>
                          <button onClick={() => setTipoImagenViendo(esIc ? 'placa_ic' : 'placa')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: tipoLimpio === 'placa' ? '#3b82f6' : 'transparent', color: tipoLimpio === 'placa' ? 'white' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><ImageIcon size={14} /> Placa</button>
                          <button onClick={() => setTipoImagenViendo(esIc ? 'esquema_ic' : 'esquema')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: tipoLimpio === 'esquema' ? '#8b5cf6' : 'transparent', color: tipoLimpio === 'esquema' ? 'white' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Map size={14} /> Datasheet</button>
                        </div>
                      )}
                      <button onClick={() => { setImagenFpcVisible(false); setTimeout(() => { if (esIc) { editarUbicacionIc(tipoLimpio); } else { editarUbicacionFpc(tipoLimpio); } }, 300); }} style={{ background: 'transparent', border: 'none', color: '#eab308', cursor: 'pointer', fontWeight: 'bold' }}>Cambiar Foto</button>
                      <button onClick={() => setImagenFpcVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="white" /></button>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '10px', backgroundColor: '#000' }}>
                    <img src={urlImg} alt={`Vista ${tipoLimpio}`} referrerPolicy="no-referrer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                </motion.div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

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

      {/* --- MODAL 7: TIPS / WIKI TÉCNICA --- */}
      <AnimatePresence>
        {notaVisible && pasoActual?.tabsNota?.length > 0 && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay} onClick={() => setNotaVisible(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma, width: '100%', maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
              <div style={estilos.modalHeader}>
                <h3 style={{ margin: 0, ...t.textoPrincipal, display: 'flex', alignItems: 'center', gap: '8px' }}><Lightbulb size={20} color="#eab308" /> Wiki Técnica</h3>
                <button onClick={() => setNotaVisible(false)} style={estilos.btnCerrar}><X size={24} /></button>
              </div>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {pasoActual.tabsNota.map((tab, i) => (
                  <button key={i} onClick={() => setTipTabActiva(i)} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', background: tipTabActiva === i ? '#eab308' : 'rgba(0,0,0,0.05)', color: tipTabActiva === i ? 'white' : t.textoSutil.color, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {tab.titulo}
                  </button>
                ))}
              </div>
              <div style={{ ...estilos.modalBody, maxHeight: '50vh' }}>
                {pasoActual.tabsNota[tipTabActiva] && (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.9rem', ...t.textoPrincipal }}>
                    {pasoActual.tabsNota[tipTabActiva].contenido}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL 8: VISOR DE IMAGEN (FOTO / PLANO) --- */}
      <AnimatePresence>
        {imgModalVisible && pasoActual?.imgUrl && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setImgModalVisible(false)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ width: '95vw', maxWidth: '1000px', height: '80vh', backgroundColor: '#111827', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #8b5cf6' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pasoActual.imgTipo === 'microscopio' ? <Camera size={18} color="#8b5cf6" /> : <Map size={18} color="#8b5cf6" />}
                  {pasoActual.imgTipo === 'microscopio' ? 'Foto de Microscopio' : 'Plano / Esquemático'}
                </span>
                <button onClick={() => setImgModalVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}><X size={24} /></button>
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '10px', backgroundColor: '#000' }}>
                <img src={pasoActual.imgUrl} alt="Imagen de referencia" referrerPolicy="no-referrer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL 9: VISOR DE VIDEO --- */}
      <AnimatePresence>
        {videoModalVisible && pasoActual?.videoUrl && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setVideoModalVisible(false)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ width: '90vw', maxWidth: '960px', height: '80vh', backgroundColor: '#000', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #ef4444' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827' }}>
                <span style={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={18} color="#ef4444" /> Video Tutorial
                </span>
                <button onClick={() => setVideoModalVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}><X size={24} /></button>
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <iframe src={obtenerUrlVideo(pasoActual.videoUrl)} title="Video tutorial" style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL 10: BITÁCORA (INGRESO DE CASO AVANZADO) --- */}
      <AnimatePresence>
        {bitacoraVisible && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay} onClick={() => setBitacoraVisible(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma, width: '100%', maxWidth: '800px', padding: 0, border: 'none', backgroundColor: '#111827' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setBitacoraVisible(false)} style={{ position: 'absolute', top: '16px', right: '20px', zIndex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', padding: '6px 8px' }}><X size={20} /></button>
                <FormularioIngresoAvanzado formCaso={formCaso} setFormCaso={setFormCaso} guardarBitacora={guardarBitacora} casoEditando={casoEditando} mensajeCaso={mensajeCaso} casosGuardados={casosGuardados} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL 11: HISTORIAL DE CASOS --- */}
      <AnimatePresence>
        {historialCasosVisible && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay} onClick={() => setHistorialCasosVisible(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma, width: '100%', maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
              <div style={estilos.modalHeader}>
                <h3 style={{ margin: 0, ...t.textoPrincipal, display: 'flex', alignItems: 'center', gap: '8px' }}><History size={20} color="#0058bc" /> Historial de Reparaciones</h3>
                <button onClick={() => setHistorialCasosVisible(false)} style={estilos.btnCerrar}><X size={24} /></button>
              </div>
              <div style={estilos.modalBody}>
                {casosGuardados.length === 0 ? (
                  <p style={{ textAlign: 'center', color: t.textoSutil.color, padding: '40px' }}>Aún no hay casos registrados. Usa el botón <strong>INGRESO</strong> para añadir el primero.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {casosGuardados.map(caso => {
                      const tieneUsb = caso.consumoUsb && (caso.consumoUsb.voltaje || caso.consumoUsb.corriente || caso.consumoUsb.comportamiento);
                      const tieneFuente = caso.consumoFuente && (caso.consumoFuente.inicial || caso.consumoFuente.postPower || caso.consumoFuente.comportamiento);
                      const numLineas = (caso.lineasAfectadas || []).length;
                      const numComponentes = (caso.lineasAfectadas || []).reduce((acc, l) => acc + (l.componentes || []).length, 0);
                      const numImagenes = (caso.lineasAfectadas || []).reduce((acc, l) => acc + (l.imagenes || []).length, 0);
                      return (
                      <div key={caso.id} style={{ padding: '14px', borderRadius: '12px', border: t.bordeFantasma.border, ...t.cristalBgItem }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', ...t.textoPrincipal }}>{caso.marca} {caso.modelo}</span>
                              <span style={{ fontSize: '0.6rem', color: '#6b7280', backgroundColor: '#1f2937', padding: '2px 8px', borderRadius: '10px' }}>#{caso.id.substring(0, 6).toUpperCase()}</span>
                              <span style={{ fontSize: '0.65rem', color: t.textoSutil.color }}>{new Date(caso.fecha).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: t.textoSutil.color, margin: '4px 0 8px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{caso.sintomas}</p>
                            {/* Badges de campos avanzados */}
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {tieneUsb && (
                                <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Usb size={10} /> USB: {caso.consumoUsb.corriente || caso.consumoUsb.voltaje || '✓'}
                                </span>
                              )}
                              {tieneFuente && (
                                <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '8px', backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Zap size={10} /> Fuente: {caso.consumoFuente.inicial || caso.consumoFuente.postPower || '✓'}
                                </span>
                              )}
                              {numLineas > 0 && (
                                <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 'bold' }}>
                                  ⚡ {numLineas} línea{numLineas !== 1 ? 's' : ''}
                                </span>
                              )}
                              {numComponentes > 0 && (
                                <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '8px', backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontWeight: 'bold' }}>
                                  🔧 {numComponentes} comp.
                                </span>
                              )}
                              {numImagenes > 0 && (
                                <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '8px', backgroundColor: 'rgba(236,72,153,0.15)', color: '#ec4899', fontWeight: 'bold' }}>
                                  📸 {numImagenes} img.
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button onClick={() => { setFormCaso({ marca: caso.marca, modelo: caso.modelo, tecnico: caso.tecnico || 'Marshall Cell', sintomas: caso.sintomas, protocolo: caso.protocolo || '', solucionEmpleada: caso.solucionEmpleada || '', imgUrl: caso.imgUrl || '', estadoReparacion: caso.estadoReparacion || 'Pendiente', hardware: caso.hardware || { cpu: '', memoria: '', pmic: '' }, consumoUsb: caso.consumoUsb || { voltaje: '', corriente: '', comportamiento: '', conBateria: '', sinBateria: '' }, consumoFuente: caso.consumoFuente || { inicial: '', postPower: '', comportamiento: '' }, lineasAfectadas: caso.lineasAfectadas || [] }); setCasoEditando(caso.id); setHistorialCasosVisible(false); setBitacoraVisible(true); }} style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#eab308', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Editar"><Edit size={14} /></button>
                            <button onClick={() => abrirReporte(caso)} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Ver reporte"><FileText size={14} /></button>
                            <button onClick={() => eliminarCaso(caso.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Eliminar"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL 12: REPORTE DE CASO (VISOR COMPLETO + EXPORT) --- */}
      <AnimatePresence>
        {reporteVisible && casoReporte && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay} onClick={() => setReporteVisible(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma, width: '100%', maxWidth: '860px' }} onClick={(e) => e.stopPropagation()}>
              <div style={estilos.modalHeader}>
                <h3 style={{ margin: 0, ...t.textoPrincipal, display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} color="#0058bc" /> Reporte Técnico Completo</h3>
                <button onClick={() => setReporteVisible(false)} style={estilos.btnCerrar}><X size={24} /></button>
              </div>
              <div style={{ ...estilos.modalBody, padding: '0' }}>
                <div style={{ padding: '10px', overflowY: 'auto', maxHeight: '65vh' }}>
                  <VisorReporteAvanzado ref={reporteRef} caso={casoReporte} />
                </div>
                <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={imprimirReporte} style={{ flex: 1, backgroundColor: '#0058bc', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', minWidth: '140px' }}>
                    <Printer size={18} /> PDF
                  </button>
                  <button onClick={exportarComoImagen} style={{ flex: 1, backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', minWidth: '140px' }}>
                    <ImageIcon size={18} /> Imagen PNG
                  </button>
                  <button onClick={enviarWhatsApp} style={{ flex: 1, backgroundColor: '#25D366', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', minWidth: '140px' }}>
                    <MessageCircle size={18} /> WhatsApp
                  </button>
                </div>
              </div>
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