import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Save, Trash2, Plus, Move, ZoomIn, ZoomOut, Layers, Maximize2, 
  Settings, Edit, Play, HelpCircle, Activity, Check, AlertTriangle, 
  Map, Eye, EyeOff, Clipboard, RefreshCw, ChevronRight, CheckCircle2,
  Image as ImageIcon, Upload, RotateCcw, X, Link, Search, RotateCw, Lock, Zap, ArrowLeftRight, Tag, Gauge
} from 'lucide-react';
import SelectorTipoLinea from './SelectorTipoLinea';

const TIPOS_COMPONENTE = ['Capacitor', 'Resistencia', 'Diodo', 'Bobina'];

const TIPO_ABREVIATURAS = {
  Capacitor: 'C',
  Resistencia: 'R',
  Diodo: 'D',
  Bobina: 'L'
};

const ESCALAS_CONFIG = [
  { id: 'diodo', label: '⚡ Diodo', unidad: 'V', color: '#3b82f6', border: '#60a5fa' },
  { id: 'voltio', label: '🔌 Voltios', unidad: 'V', color: '#ef4444', border: '#f87171' },
  { id: 'ua', label: '🔋 uA', unidad: 'uA', color: '#10b981', border: '#34d399' },
  { id: 'ohmio', label: '🟣 Ohmios', unidad: 'Ω', color: '#a855f7', border: '#c084fc' }
];

// Sugerencias iniciales comunes de Net Names
const NET_NAMES_BASE = [
  'PP_VDD_MAIN', 'GND', 'PP1V8_S2', 'PP3V0_LDO', 'VBUS_USB', 'PP_BATT_VCC',
  'AP_TO_I2C_SDA', 'AP_TO_I2C_SCL', 'SPI_AP_MOSI', 'SPI_AP_MISO', 'SPI_AP_CLK',
  'PMIC_TO_CPU_RESET', 'VREG_L6A_0P6', 'USB_HS_DP', 'USB_HS_DN', 'NC'
];

const IMAGEN_PREDETERMINADA = '/pcb_motherboard_bg.png';

// Componentes de ejemplo
const COMPONENTES_DEFECTO = [
  {
    id: 'smd_1',
    nombre: 'C1401',
    tipo: 'Capacitor',
    x: 180, y: 120, w: 50, h: 90,
    pads: [
      { id: '1', netName: 'PP_VDD_MAIN', tipo: 'DATA', x_rel: 5, y_rel: 5, w: 40, h: 25, valorSanoDiodo: '0.450', valorSanoVoltio: '4.200', valorSanoUa: '120', valorSanoOhmio: '15000', valorActualDiodo: '---', valorActualVoltio: '---', valorActualUa: '---', valorActualOhmio: '---' },
      { id: '2', netName: 'GND', tipo: 'GND', x_rel: 5, y_rel: 60, w: 40, h: 25, valorSanoDiodo: '0.000', valorSanoVoltio: '0.000', valorSanoUa: '0', valorSanoOhmio: '0', valorActualDiodo: '0.000', valorActualVoltio: '0.000', valorActualUa: '0', valorActualOhmio: '0' }
    ]
  },
  {
    id: 'smd_2',
    nombre: 'R1402',
    tipo: 'Resistencia',
    x: 320, y: 150, w: 90, h: 50,
    pads: [
      { id: '1', netName: 'AP_TO_I2C_SDA', tipo: 'DATA', x_rel: 5, y_rel: 5, w: 25, h: 40, valorSanoDiodo: '0.520', valorSanoVoltio: '1.800', valorSanoUa: '80', valorSanoOhmio: '2200', valorActualDiodo: '---', valorActualVoltio: '---', valorActualUa: '---', valorActualOhmio: '---' },
      { id: '2', netName: 'PP1V8_S2', tipo: 'DATA', x_rel: 60, y_rel: 5, w: 25, h: 40, valorSanoDiodo: '0.522', valorSanoVoltio: '1.800', valorSanoUa: '82', valorSanoOhmio: '2200', valorActualDiodo: '---', valorActualVoltio: '---', valorActualUa: '---', valorActualOhmio: '---' }
    ]
  },
  {
    id: 'smd_3',
    nombre: 'D1403',
    tipo: 'Diodo',
    x: 480, y: 200, w: 60, h: 100,
    pads: [
      { id: '1', netName: 'VREG_L6A_0P6', tipo: 'DATA', x_rel: 5, y_rel: 5, w: 50, h: 30, valorSanoDiodo: '0.155', valorSanoVoltio: '0.600', valorSanoUa: '450', valorSanoOhmio: '45000', valorActualDiodo: '---', valorActualVoltio: '---', valorActualUa: '---', valorActualOhmio: '---' },
      { id: '2', netName: 'GND', tipo: 'GND', x_rel: 5, y_rel: 65, w: 50, h: 30, valorSanoDiodo: '0.000', valorSanoVoltio: '0.000', valorSanoUa: '0', valorSanoOhmio: '0', valorActualDiodo: '0.000', valorActualVoltio: '0.000', valorActualUa: '0', valorActualOhmio: '0' }
    ]
  },
  {
    id: 'smd_4',
    nombre: 'L1404',
    tipo: 'Bobina',
    x: 620, y: 140, w: 80, h: 80,
    pads: [
      { id: '1', netName: 'PP_VDD_MAIN', tipo: 'DATA', x_rel: 8, y_rel: 8, w: 64, h: 28, valorSanoDiodo: '0.450', valorSanoVoltio: '4.200', valorSanoUa: '120', valorSanoOhmio: '0.5', valorActualDiodo: '---', valorActualVoltio: '---', valorActualUa: '---', valorActualOhmio: '---' },
      { id: '2', netName: 'PP_VDD_MAIN_SW', tipo: 'DATA', x_rel: 8, y_rel: 44, w: 64, h: 28, valorSanoDiodo: '0.450', valorSanoVoltio: '4.200', valorSanoUa: '120', valorSanoOhmio: '0.5', valorActualDiodo: '---', valorActualVoltio: '---', valorActualUa: '---', valorActualOhmio: '---' }
    ]
  }
];

export default function VisorMapeoPCB({
  lecturaEnVivo = '----',
  unidadLectura = '---',
  escala = 'diodo', // 'diodo' | 'voltio' | 'ua' | 'ohmio'
  onCambiarEscala = null,            // callback cuando el usuario cambia la escala en el visor
  onGuardar,
  cambiosPendientes = false,
  guardando = false,
  ultimaSincronizacion = null,
  componentesIniciales = null,       // lista previa de componentes (persistencia)
  imagenPlacaInicial = null,          // URL foto de placa (persistencia)
  imagenEsquemaInicial = null,        // URL diagrama esquemático (persistencia)
  onCambios = null,                  // callback ({ componentes, imagenPlaca, imagenEsquema })
  fullscreen = false,                // modo pantalla completa
  onCerrar = null,                   // botón de cierre en modo fullscreen
  tiposCustom = [],                  // lista global de tipos de línea personalizados
  setTiposCustom = null,             // setter de tipos de línea personalizados
  nombreModelo = ''                  // nombre del modelo activo (ej: Samsung Galaxy S22)
}) {
  // --- Estados locales del Boardview ---
  const [componentes, setComponentes] = useState(() => {
    if (Array.isArray(componentesIniciales)) return componentesIniciales;
    return [];
  });

  const [activeScale, setActiveScale] = useState(escala);
  const [selectedCompId, setSelectedCompId] = useState(() => {
    return Array.isArray(componentesIniciales) && componentesIniciales.length > 0 ? componentesIniciales[0]?.id : null;
  });
  const [selectedPadId, setSelectedPadId] = useState('1'); // '1' | '2'
  const [mostrarTodasEscalas, setMostrarTodasEscalas] = useState(false);

  // --- Capas de Imágenes de Fondo (Placa + Esquemático) ---
  const [capaActiva, setCapaActiva] = useState('placa'); // 'placa' | 'esquema'
  const [imgPlacaUrl, setImgPlacaUrl] = useState(imagenPlacaInicial || IMAGEN_PREDETERMINADA);
  const [imgEsquemaUrl, setImgEsquemaUrl] = useState(imagenEsquemaInicial || '');
  const [showPlaca, setShowPlaca] = useState(true);
  const [showEsquema, setShowEsquema] = useState(false);
  const [placaOpacity, setPlacaOpacity] = useState(0.85);
  const [esquemaOpacity, setEsquemaOpacity] = useState(0.70);
  const [placaSize, setPlacaSize] = useState({ w: 1024, h: 1024 });
  const [esquemaSize, setEsquemaSize] = useState({ w: 1024, h: 1024 });

  // --- Gestor Dinámico de Net Names (Nombres de Línea) con LocalStorage ---
  const [netNamesCustom, setNetNamesCustom] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('net_names_personalizados');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return NET_NAMES_BASE;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('net_names_personalizados', JSON.stringify(netNamesCustom));
    }
  }, [netNamesCustom]);

  const [nuevoNetInput, setNuevoNetInput] = useState('');
  const [mostrarGestorNets, setMostrarGestorNets] = useState(false);

  // --- Sistema de AutoHold Inteligente ---
  const [autoHoldActivo, setAutoHoldActivo] = useState(false);
  const autoHoldValueRef = useRef(null);
  const autoHoldStartTimeRef = useRef(0);
  const autoHoldTriggeredRef = useRef(false);

  // Sincronizar escala si cambia externamente
  useEffect(() => {
    setActiveScale(escala);
  }, [escala]);

  // Sincronizar props cuando cambia el modelo activo
  useEffect(() => {
    if (Array.isArray(componentesIniciales)) {
      setComponentes(componentesIniciales);
      setSelectedCompId(componentesIniciales[0]?.id || null);
      setSelectedPadId('1');
    } else {
      setComponentes([]);
      setSelectedCompId(null);
    }
  }, [componentesIniciales]);

  useEffect(() => {
    setImgPlacaUrl(imagenPlacaInicial || IMAGEN_PREDETERMINADA);
  }, [imagenPlacaInicial]);

  useEffect(() => {
    setImgEsquemaUrl(imagenEsquemaInicial || '');
  }, [imagenEsquemaInicial]);

  // Configuración de visualización de vectores
  const [showHitbox, setShowHitbox] = useState(true);
  const [showComponentNames, setShowComponentNames] = useState(true);

  // Herramientas: 'select' | 'pan' | 'drawSMD'
  const [tool, setTool] = useState('select');
  const [tipoDrawing, setTipoDrawing] = useState('Capacitor');

  // Navegación (Zoom & Pan)
  const [zoom, setZoom] = useState(1);
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const posicionRef = useRef(posicion);
  const placaSizeRef = useRef(placaSize);
  const esquemaSizeRef = useRef(esquemaSize);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const fileInputPlacaRef = useRef(null);
  const fileInputEsquemaRef = useRef(null);

  // Lógica de dibujo (Pad Espejo + Bloqueo Ortogonal)
  const [drawingStep, setDrawingStep] = useState(0);
  const [pad1Temp, setPad1Temp] = useState(null);
  const [pad2Temp, setPad2Temp] = useState(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [isShiftDown, setIsShiftDown] = useState(false);

  // Lógica de Arrastre de Componente en Modo Selección
  const [isDraggingComp, setIsDraggingComp] = useState(false);
  const [dragCompId, setDragCompId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Lógica de matriz de clonación
  const [matrizActiva, setMatrizActiva] = useState(false);
  const [matrizRows, setMatrizRows] = useState(1);
  const [matrizCols, setMatrizCols] = useState(5);
  const [isMatrixDragging, setIsMatrixDragging] = useState(false);
  const [matrixStartPos, setMatrixStartPos] = useState({ x: 0, y: 0 });
  const [matrixClonesPreview, setMatrixClonesPreview] = useState([]);

  // Búsqueda rápida de componentes y líneas
  const [busqueda, setBusqueda] = useState('');
  const [mostrarResultadosBusqueda, setMostrarResultadosBusqueda] = useState(false);

  // Tooltips en hover
  const [hoveredComp, setHoveredComp] = useState(null);
  const [hoveredCoords, setHoveredCoords] = useState({ x: 0, y: 0 });

  // Referencias al SVG y contenedor
  const svgRef = useRef(null);
  const svgContainerRef = useRef(null);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { posicionRef.current = posicion; }, [posicion]);
  useEffect(() => { placaSizeRef.current = placaSize; }, [placaSize]);
  useEffect(() => { esquemaSizeRef.current = esquemaSize; }, [esquemaSize]);

  // Listener para tecla Shift / Ctrl y atajos
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift' || e.key === 'Control') {
        setIsShiftDown(true);
      }
      if ((e.key === 'r' || e.key === 'R') && selectedCompId && document.activeElement.tagName !== 'INPUT') {
        rotarComponente(selectedCompId);
      }
      if (e.key === 'Escape') {
        setDrawingStep(0);
        setPad1Temp(null);
        setPad2Temp(null);
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift' || e.key === 'Control') {
        setIsShiftDown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedCompId]);

  // Auto-persistencia de componentes e imágenes hacia el modelo
  const onCambiosRef = useRef(onCambios);
  useEffect(() => { onCambiosRef.current = onCambios; }, [onCambios]);
  useEffect(() => {
    if (!onCambiosRef.current) return;
    const t = setTimeout(() => {
      onCambiosRef.current(componentes, imgPlacaUrl, imgEsquemaUrl);
    }, 400);
    return () => clearTimeout(t);
  }, [componentes, imgPlacaUrl, imgEsquemaUrl]);

  // Sonido Beep Sintetizado de Confirmación (Web Audio API)
  const playBeep = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }, []);

  // Fit to view
  const fitToView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cw = rect.width || 800;
    const ch = rect.height || 600;
    const pad = 50;

    const baseW = capaActiva === 'esquema' ? (esquemaSizeRef.current.w || 1024) : (placaSizeRef.current.w || 1024);
    const baseH = capaActiva === 'esquema' ? (esquemaSizeRef.current.h || 1024) : (placaSizeRef.current.h || 1024);

    const scale = Math.min((cw - pad) / baseW, (ch - pad) / baseH);
    const z = Math.max(0.15, Math.min(4, scale));
    setZoom(z);
    setPosicion({ x: (cw - baseW * z) / 2, y: (ch - baseH * z) / 2 });
  }, [capaActiva]);

  // Cargar dimensiones de imagen Placa
  useEffect(() => {
    if (!imgPlacaUrl) return;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width || 1024;
      const h = img.naturalHeight || img.height || 1024;
      setPlacaSize({ w, h });
      if (capaActiva === 'placa') requestAnimationFrame(() => fitToView());
    };
    img.onerror = () => setPlacaSize({ w: 1024, h: 1024 });
    img.src = imgPlacaUrl;
  }, [imgPlacaUrl, fitToView, capaActiva]);

  // Cargar dimensiones de imagen Esquemático
  useEffect(() => {
    if (!imgEsquemaUrl) return;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width || 1024;
      const h = img.naturalHeight || img.height || 1024;
      setEsquemaSize({ w, h });
      if (capaActiva === 'esquema') requestAnimationFrame(() => fitToView());
    };
    img.onerror = () => setEsquemaSize({ w: 1024, h: 1024 });
    img.src = imgEsquemaUrl;
  }, [imgEsquemaUrl, fitToView, capaActiva]);

  // Zoom al cursor
  useEffect(() => {
    const handleWheel = (e) => {
      if (!e.target.closest('#svg-boardview')) return;
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldZoom = zoomRef.current;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const newZoom = Math.max(0.15, Math.min(10, oldZoom * factor));

      const pX = (mouseX - posicionRef.current.x) / oldZoom;
      const pY = (mouseY - posicionRef.current.y) / oldZoom;

      setZoom(newZoom);
      setPosicion({ x: mouseX - pX * newZoom, y: mouseY - pY * newZoom });
    };

    const container = svgContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const zoomCentro = (factor) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = rect.width / 2;
    const mouseY = rect.height / 2;
    const oldZoom = zoomRef.current;
    const newZoom = Math.max(0.15, Math.min(10, oldZoom * factor));
    const pX = (mouseX - posicionRef.current.x) / oldZoom;
    const pY = (mouseY - posicionRef.current.y) / oldZoom;
    setZoom(newZoom);
    setPosicion({ x: mouseX - pX * newZoom, y: mouseY - pY * newZoom });
  };

  // Subida de imágenes
  const manejarArchivoImagenPlaca = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImgPlacaUrl(reader.result);
      setShowPlaca(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const manejarArchivoImagenEsquema = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImgEsquemaUrl(reader.result);
      setShowEsquema(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const pedirUrlPlaca = () => {
    const actual = imgPlacaUrl === IMAGEN_PREDETERMINADA ? '' : imgPlacaUrl;
    const nueva = window.prompt('Ingresa el enlace directo (URL) de la imagen de la placa (ej: PostImages):', actual);
    if (nueva !== null && nueva.trim()) {
      setImgPlacaUrl(nueva.trim());
      setShowPlaca(true);
    }
  };

  const pedirUrlEsquema = () => {
    const nueva = window.prompt('Ingresa el enlace directo (URL) del diagrama esquemático (ej: PostImages):', imgEsquemaUrl || '');
    if (nueva !== null && nueva.trim()) {
      setImgEsquemaUrl(nueva.trim());
      setShowEsquema(true);
    }
  };

  const getCanvasCoords = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const x = (clientX - posicionRef.current.x) / zoomRef.current;
    const y = (clientY - posicionRef.current.y) / zoomRef.current;
    return { x, y };
  };

  // Invertir Pines (1 ↔ 2)
  const invertirPinesComponente = (compId) => {
    setComponentes(prev => prev.map(comp => {
      if (comp.id !== compId) return comp;
      const pad1 = comp.pads.find(p => p.id === '1');
      const pad2 = comp.pads.find(p => p.id === '2');
      if (!pad1 || !pad2) return comp;

      const nuevoPad1 = {
        ...pad1,
        netName: pad2.netName,
        tipo: pad2.tipo,
        valorSanoDiodo: pad2.valorSanoDiodo,
        valorSanoVoltio: pad2.valorSanoVoltio,
        valorSanoUa: pad2.valorSanoUa,
        valorSanoOhmio: pad2.valorSanoOhmio,
        valorActualDiodo: pad2.valorActualDiodo,
        valorActualVoltio: pad2.valorActualVoltio,
        valorActualUa: pad2.valorActualUa,
        valorActualOhmio: pad2.valorActualOhmio
      };

      const nuevoPad2 = {
        ...pad2,
        netName: pad1.netName,
        tipo: pad1.tipo,
        valorSanoDiodo: pad1.valorSanoDiodo,
        valorSanoVoltio: pad1.valorSanoVoltio,
        valorSanoUa: pad1.valorSanoUa,
        valorSanoOhmio: pad1.valorSanoOhmio,
        valorActualDiodo: pad1.valorActualDiodo,
        valorActualVoltio: pad1.valorActualVoltio,
        valorActualUa: pad1.valorActualUa,
        valorActualOhmio: pad1.valorActualOhmio
      };

      return {
        ...comp,
        pads: [nuevoPad1, nuevoPad2]
      };
    }));
  };

  // Rotar Componente (90°)
  const rotarComponente = (id) => {
    setComponentes(prev => prev.map(comp => {
      if (comp.id !== id) return comp;
      const newW = comp.h;
      const newH = comp.w;
      const newPads = comp.pads.map(p => ({
        ...p,
        x_rel: p.y_rel,
        y_rel: p.x_rel,
        w: p.h,
        h: p.w
      }));
      return {
        ...comp,
        w: newW,
        h: newH,
        pads: newPads
      };
    }));
  };

  // Centrar en Componente
  const centrarEnComponente = (comp) => {
    setSelectedCompId(comp.id);
    setSelectedPadId('1');
    setMostrarResultadosBusqueda(false);
    setBusqueda('');

    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cw = rect.width || 800;
    const ch = rect.height || 600;
    const targetZoom = Math.max(1.8, zoomRef.current);
    setZoom(targetZoom);
    setPosicion({
      x: cw / 2 - (comp.x + comp.w / 2) * targetZoom,
      y: ch / 2 - (comp.y + comp.h / 2) * targetZoom
    });
  };

  // Manejo de Net Names dinámicos
  const agregarNetNamePersonalizado = (nuevo) => {
    if (!nuevo || !nuevo.trim()) return;
    const limpio = nuevo.trim().toUpperCase().replace(/\s+/g, '_');
    if (!netNamesCustom.includes(limpio)) {
      setNetNamesCustom(prev => [...prev, limpio]);
    }
    actualizarPropiedadPad(selectedPadId, 'netName', limpio);
    setNuevoNetInput('');
  };

  const eliminarNetNamePersonalizado = (nombreABorrar) => {
    if (window.confirm(`¿Eliminar "${nombreABorrar}" de la lista sugerida de Net Names?`)) {
      setNetNamesCustom(prev => prev.filter(n => n !== nombreABorrar));
    }
  };

  // Detección de coincidencia del Dial físico del Multímetro con la Escala Activa
  const dialMismatch = useMemo(() => {
    if (!unidadLectura || unidadLectura === '---') return null;
    const u = unidadLectura.trim();
    if (activeScale === 'diodo') {
      if (u !== 'Diod' && u !== 'V') return `Dial en ${u}`;
    } else if (activeScale === 'voltio') {
      if (u !== 'V' && u !== 'mV') return `Dial en ${u}`;
    } else if (activeScale === 'ua') {
      if (u !== 'uA' && u !== 'mA' && u !== 'A') return `Dial en ${u}`;
    } else if (activeScale === 'ohmio') {
      if (u !== 'Ω' && u !== 'kΩ' && u !== 'MΩ' && u !== 'Ohm') return `Dial en ${u}`;
    }
    return null;
  }, [activeScale, unidadLectura]);

  // Escala sugerida si el dial cambió
  const escalaDetectadaDial = useMemo(() => {
    if (!unidadLectura || unidadLectura === '---') return null;
    const u = unidadLectura.trim();
    if (u === 'Ω' || u === 'kΩ' || u === 'MΩ' || u === 'Ohm') return 'ohmio';
    if (u === 'uA' || u === 'mA' || u === 'A') return 'ua';
    if (u === 'Diod') return 'diodo';
    if (u === 'V' && activeScale === 'ohmio') return 'diodo';
    return null;
  }, [unidadLectura, activeScale]);

  // Cambiar escala activa
  const seleccionarEscala = (nuevaEscala) => {
    setActiveScale(nuevaEscala);
    if (onCambiarEscala) onCambiarEscala(nuevaEscala);
  };

  // Eventos del Mouse
  const handleMouseDown = (e) => {
    if (e.target.closest('.interactive-handle')) return;
    const coords = getCanvasCoords(e);

    if (tool === 'pan' || e.button === 1 || e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - posicionRef.current.x, y: e.clientY - posicionRef.current.y });
      return;
    }

    if (tool === 'drawSMD') {
      e.preventDefault();
      if (drawingStep === 0) {
        setDrawingStep(1);
        setStartPoint({ x: coords.x, y: coords.y });
        setPad1Temp({ x: coords.x, y: coords.y, w: 0, h: 0 });
      } else if (drawingStep === 2) {
        confirmComponentCreation();
      }
      return;
    }
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoords(e);

    if (isPanning) {
      setPosicion({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (isDraggingComp && dragCompId) {
      const newX = Math.round(coords.x - dragOffset.x);
      const newY = Math.round(coords.y - dragOffset.y);
      setComponentes(prev => prev.map(c => c.id === dragCompId ? { ...c, x: newX, y: newY } : c));
      return;
    }

    if (tool === 'drawSMD' && drawingStep === 1) {
      const w = Math.abs(coords.x - startPoint.x);
      const h = Math.abs(coords.y - startPoint.y);
      const x = Math.min(startPoint.x, coords.x);
      const y = Math.min(startPoint.y, coords.y);
      setPad1Temp({ x, y, w, h });
      return;
    }

    if (tool === 'drawSMD' && drawingStep === 2 && pad1Temp) {
      const p1CenterX = pad1Temp.x + pad1Temp.w / 2;
      const p1CenterY = pad1Temp.y + pad1Temp.h / 2;

      let targetCenterX = coords.x;
      let targetCenterY = coords.y;

      const dx = coords.x - p1CenterX;
      const dy = coords.y - p1CenterY;

      const shouldLock = e.shiftKey || e.ctrlKey || isShiftDown;
      let lockedAxis = null;

      if (shouldLock) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          targetCenterY = p1CenterY;
          lockedAxis = 'H';
        } else {
          targetCenterX = p1CenterX;
          lockedAxis = 'V';
        }
      }

      const x = targetCenterX - pad1Temp.w / 2;
      const y = targetCenterY - pad1Temp.h / 2;
      setPad2Temp({ x, y, w: pad1Temp.w, h: pad1Temp.h, lockedAxis });
      return;
    }

    if (isMatrixDragging && selectedCompId) {
      const compPiloto = componentes.find(c => c.id === selectedCompId);
      if (!compPiloto) return;

      const deltaX = coords.x - matrixStartPos.x;
      const deltaY = coords.y - matrixStartPos.y;

      let lockedDeltaX = deltaX;
      let lockedDeltaY = deltaY;

      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        lockedDeltaY = 0;
      } else if (Math.abs(deltaY) > Math.abs(deltaX) * 1.3) {
        lockedDeltaX = 0;
      }

      const rows = parseInt(matrizRows) || 1;
      const cols = parseInt(matrizCols) || 1;

      const stepX = cols > 1 ? lockedDeltaX / (cols - 1) : 0;
      const stepY = rows > 1 ? lockedDeltaY / (rows - 1) : 0;

      const previews = [];
      let cloneIndex = 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 && c === 0) continue;
          previews.push({
            id: `clone_temp_${r}_${c}`,
            nombre: `${compPiloto.nombre}_M${cloneIndex++}`,
            tipo: compPiloto.tipo,
            x: compPiloto.x + c * stepX,
            y: compPiloto.y + r * stepY,
            w: compPiloto.w,
            h: compPiloto.h,
            pads: compPiloto.pads.map(p => ({ ...p }))
          });
        }
      }
      setMatrixClonesPreview(previews);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingComp) {
      setIsDraggingComp(false);
      setDragCompId(null);
      return;
    }

    if (tool === 'drawSMD' && drawingStep === 1 && pad1Temp) {
      if (pad1Temp.w < 3 || pad1Temp.h < 3) {
        setDrawingStep(0);
        setPad1Temp(null);
      } else {
        setDrawingStep(2);
      }
      return;
    }

    if (isMatrixDragging) {
      setIsMatrixDragging(false);
      if (matrixClonesPreview.length > 0) {
        const consolidados = matrixClonesPreview.map(clone => ({
          ...clone,
          id: `smd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        }));
        setComponentes(prev => [...prev, ...consolidados]);
        setMatrixClonesPreview([]);
      }
    }
  };

  // Creación de Componente SMD
  const confirmComponentCreation = () => {
    if (!pad1Temp || !pad2Temp) return;

    const minX = Math.min(pad1Temp.x, pad2Temp.x);
    const minY = Math.min(pad1Temp.y, pad2Temp.y);
    const maxX = Math.max(pad1Temp.x + pad1Temp.w, pad2Temp.x + pad2Temp.w);
    const maxY = Math.max(pad1Temp.y + pad1Temp.h, pad2Temp.y + pad2Temp.h);

    const compW = maxX - minX;
    const compH = maxY - minY;

    const prefix = TIPO_ABREVIATURAS[tipoDrawing] || 'C';
    const numComp = componentes.filter(c => c.tipo === tipoDrawing).length + 1401;
    const nombreSugerido = `${prefix}${numComp}`;

    const isGndDefault = tipoDrawing === 'Capacitor';

    const nuevoComp = {
      id: `smd_${Date.now()}`,
      nombre: nombreSugerido,
      tipo: tipoDrawing,
      x: minX,
      y: minY,
      w: compW,
      h: compH,
      pads: [
        {
          id: '1',
          netName: `${nombreSugerido}_P1`,
          tipo: 'DATA',
          x_rel: pad1Temp.x - minX,
          y_rel: pad1Temp.y - minY,
          w: pad1Temp.w,
          h: pad1Temp.h,
          valorSanoDiodo: '---',
          valorSanoVoltio: '---',
          valorSanoUa: '---',
          valorSanoOhmio: '---',
          valorActualDiodo: '---',
          valorActualVoltio: '---',
          valorActualUa: '---',
          valorActualOhmio: '---'
        },
        {
          id: '2',
          netName: isGndDefault ? 'GND' : `${nombreSugerido}_P2`,
          tipo: isGndDefault ? 'GND' : 'DATA',
          x_rel: pad2Temp.x - minX,
          y_rel: pad2Temp.y - minY,
          w: pad2Temp.w,
          h: pad2Temp.h,
          valorSanoDiodo: isGndDefault ? '0.000' : '---',
          valorSanoVoltio: isGndDefault ? '0.000' : '---',
          valorSanoUa: isGndDefault ? '0' : '---',
          valorSanoOhmio: isGndDefault ? '0' : '---',
          valorActualDiodo: isGndDefault ? '0.000' : '---',
          valorActualVoltio: isGndDefault ? '0.000' : '---',
          valorActualUa: isGndDefault ? '0' : '---',
          valorActualOhmio: isGndDefault ? '0' : '---'
        }
      ]
    };

    setComponentes(prev => [...prev, nuevoComp]);
    setSelectedCompId(nuevoComp.id);
    setSelectedPadId('1');

    setPad1Temp(null);
    setPad2Temp(null);
    setDrawingStep(0);
    setTool('select');
  };

  const compActivo = componentes.find(c => c.id === selectedCompId);
  const padActivo = compActivo?.pads.find(p => p.id === selectedPadId);

  const activeNetName = (padActivo && padActivo.netName && padActivo.netName !== 'NC') ? padActivo.netName : null;

  // Evaluar color de pad
  const obtenerColorDePad = (pad, compId) => {
    if (selectedCompId === compId && selectedPadId === pad.id) {
      return '#00ffff';
    }

    if (pad.tipo === 'GND') return '#4b5563';
    if (pad.tipo === 'NC') return '#1e3a8a';

    const colorBase = '#d4af37';

    let valAct = '---';
    let valSano = '---';

    if (activeScale === 'diodo') {
      valAct = pad.valorActualDiodo;
      valSano = pad.valorSanoDiodo;
    } else if (activeScale === 'voltio') {
      valAct = pad.valorActualVoltio;
      valSano = pad.valorSanoVoltio;
    } else if (activeScale === 'ua') {
      valAct = pad.valorActualUa;
      valSano = pad.valorSanoUa;
    } else if (activeScale === 'ohmio') {
      valAct = pad.valorActualOhmio;
      valSano = pad.valorSanoOhmio;
    }

    if (!valAct || valAct === '---') return colorBase;
    if (valAct === 'OL' && valSano !== 'OL') return '#f97316';

    const vAct = parseFloat(valAct);
    const vSano = parseFloat(valSano);

    if (isNaN(vAct) || isNaN(vSano)) return colorBase;

    if (activeScale === 'diodo') {
      if (vAct < 0.050) return '#ef4444';
      if (Math.abs(vAct - vSano) <= 0.040) return '#10b981';
    } else if (activeScale === 'ua') {
      if (vAct > 2000) return '#ef4444';
      if (Math.abs(vAct - vSano) <= 50) return '#10b981';
    } else if (activeScale === 'voltio') {
      if (vAct < 0.1 && vSano >= 1.0) return '#ef4444';
      if (Math.abs(vAct - vSano) <= 0.1) return '#10b981';
    } else if (activeScale === 'ohmio') {
      if (vAct < 2.0 && vSano > 10.0) return '#ef4444';
      if (Math.abs(vAct - vSano) <= 5.0 || Math.abs(vAct - vSano) / vSano <= 0.1) return '#10b981';
    }

    return '#f97316';
  };

  // Guardar medición en pad activo en la columna de la escala seleccionada
  const grabarMedicionActual = useCallback((valorEntrada) => {
    if (!selectedCompId || !selectedPadId) return;

    setComponentes(prev => prev.map(comp => {
      if (comp.id !== selectedCompId) return comp;
      return {
        ...comp,
        pads: comp.pads.map(pad => {
          if (pad.id !== selectedPadId) return pad;
          const actualizaciones = {};
          if (activeScale === 'diodo') actualizaciones.valorActualDiodo = valorEntrada;
          if (activeScale === 'voltio') actualizaciones.valorActualVoltio = valorEntrada;
          if (activeScale === 'ua') actualizaciones.valorActualUa = valorEntrada;
          if (activeScale === 'ohmio') actualizaciones.valorActualOhmio = valorEntrada;
          return { ...pad, ...actualizaciones };
        })
      };
    }));

    playBeep();
    avanzarSiguientePadMedicion();
  }, [selectedCompId, selectedPadId, activeScale, playBeep]);

  // Auto-avance inteligente en orden de creación omitiendo GND
  const avanzarSiguientePadMedicion = useCallback(() => {
    if (!selectedCompId || componentes.length === 0) return;
    const indexComp = componentes.findIndex(c => c.id === selectedCompId);
    if (indexComp === -1) return;

    const compActual = componentes[indexComp];
    const pad1 = compActual.pads.find(p => p.id === '1');
    const pad2 = compActual.pads.find(p => p.id === '2');

    if (selectedPadId === '1' && pad2 && pad2.tipo !== 'GND') {
      setSelectedPadId('2');
      return;
    }

    for (let i = 1; i <= componentes.length; i++) {
      const nextIndex = (indexComp + i) % componentes.length;
      const nextComp = componentes[nextIndex];
      const nextP1 = nextComp.pads.find(p => p.id === '1');
      const nextP2 = nextComp.pads.find(p => p.id === '2');

      if (nextP1 && nextP1.tipo !== 'GND') {
        setSelectedCompId(nextComp.id);
        setSelectedPadId('1');
        return;
      } else if (nextP2 && nextP2.tipo !== 'GND') {
        setSelectedCompId(nextComp.id);
        setSelectedPadId('2');
        return;
      }
    }
  }, [selectedCompId, selectedPadId, componentes]);

  // AutoHold
  useEffect(() => {
    if (!autoHoldActivo || !lecturaEnVivo || lecturaEnVivo === '----' || lecturaEnVivo === 'OL') {
      autoHoldValueRef.current = null;
      autoHoldTriggeredRef.current = false;
      return;
    }

    const valNum = parseFloat(lecturaEnVivo);
    if (isNaN(valNum)) {
      autoHoldValueRef.current = null;
      autoHoldTriggeredRef.current = false;
      return;
    }

    let esInactivo = valNum < 0.040;
    let tol = 0.004;

    if (activeScale === 'ua') {
      tol = 1.5;
      esInactivo = valNum < 1.0;
    } else if (activeScale === 'voltio') {
      tol = 0.05;
      esInactivo = valNum < 0.1;
    } else if (activeScale === 'ohmio') {
      tol = 5.0;
      esInactivo = valNum < 1.0;
    }

    if (esInactivo) {
      autoHoldValueRef.current = null;
      autoHoldTriggeredRef.current = false;
      return;
    }

    if (autoHoldValueRef.current !== null && Math.abs(valNum - autoHoldValueRef.current) <= tol) {
      if (!autoHoldTriggeredRef.current && Date.now() - autoHoldStartTimeRef.current >= 1200) {
        autoHoldTriggeredRef.current = true;
        grabarMedicionActual(lecturaEnVivo);
      }
    } else {
      autoHoldValueRef.current = valNum;
      autoHoldStartTimeRef.current = Date.now();
      autoHoldTriggeredRef.current = false;
    }
  }, [lecturaEnVivo, autoHoldActivo, activeScale, grabarMedicionActual]);

  const iniciarMedicionGuiada = () => {
    if (componentes.length === 0) return;
    for (let i = 0; i < componentes.length; i++) {
      const comp = componentes[i];
      const p1 = comp.pads.find(p => p.id === '1');
      const p2 = comp.pads.find(p => p.id === '2');
      if (p1 && p1.tipo !== 'GND') {
        setSelectedCompId(comp.id);
        setSelectedPadId('1');
        setAutoHoldActivo(true);
        centrarEnComponente(comp);
        return;
      } else if (p2 && p2.tipo !== 'GND') {
        setSelectedCompId(comp.id);
        setSelectedPadId('2');
        setAutoHoldActivo(true);
        centrarEnComponente(comp);
        return;
      }
    }
  };

  const actualizarPropiedadPad = (padId, prop, valor) => {
    setComponentes(prev => prev.map(comp => {
      if (comp.id !== selectedCompId) return comp;
      return {
        ...comp,
        pads: comp.pads.map(p => {
          if (p.id !== padId) return p;
          let actualizacion = { [prop]: valor };
          if (prop === 'tipo' && valor === 'GND') {
            actualizacion = {
              ...actualizacion,
              netName: 'GND',
              valorSanoDiodo: '0.000',
              valorSanoVoltio: '0.000',
              valorSanoUa: '0',
              valorSanoOhmio: '0',
              valorActualDiodo: '0.000',
              valorActualVoltio: '0.000',
              valorActualUa: '0',
              valorActualOhmio: '0'
            };
          }
          return { ...p, ...actualizacion };
        })
      };
    }));
  };

  const borrarComponente = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este componente SMD del Boardview?')) {
      setComponentes(prev => prev.filter(c => c.id !== id));
      if (selectedCompId === id) {
        setSelectedCompId(null);
        setSelectedPadId(null);
      }
    }
  };

  const resultadosBusqueda = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.trim().toLowerCase();
    return componentes.filter(c => 
      c.nombre.toLowerCase().includes(q) || 
      c.tipo.toLowerCase().includes(q) ||
      c.pads.some(p => p.netName.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [componentes, busqueda]);

  const renderTextosInteligentes = (comp) => {
    const pad1 = comp.pads.find(p => p.id === '1');
    const pad2 = comp.pads.find(p => p.id === '2');
    if (!pad1 || !pad2) return null;

    const xCenter = comp.x + comp.w / 2;
    const yCenter = comp.y + comp.h / 2;

    const minDim = Math.min(comp.w, comp.h);
    const fontSizeComp = Math.max(3.5, Math.min(9, Math.round(minDim * 0.28)));
    const fontSizePad = Math.max(3, Math.min(8, Math.round(fontSizeComp * 0.85)));

    const monoStyle = {
      fontFamily: 'Consolas, monospace',
      fontSize: `${fontSizeComp}px`,
      fontWeight: 'bold',
      fill: '#ffffff',
      userSelect: 'none',
      pointerEvents: 'none'
    };

    if (comp.h > comp.w) {
      return (
        <g opacity={showComponentNames ? 1 : 0} style={{ transition: 'opacity 0.2s' }}>
          <text x={xCenter} y={comp.y + pad1.y_rel + pad1.h / 2 + fontSizePad / 3} textAnchor="middle" style={{ ...monoStyle, fontSize: `${fontSizePad}px`, fill: '#aaaaaa' }}>1</text>
          <text x={xCenter} y={yCenter + fontSizeComp / 3} textAnchor="middle" style={{ ...monoStyle, fill: '#ffffff', fontSize: `${fontSizeComp}px` }}>{comp.nombre}</text>
          <text x={xCenter} y={comp.y + pad2.y_rel + pad2.h / 2 + fontSizePad / 3} textAnchor="middle" style={{ ...monoStyle, fontSize: `${fontSizePad}px`, fill: '#aaaaaa' }}>2</text>
        </g>
      );
    }

    return (
      <g opacity={showComponentNames ? 1 : 0} style={{ transition: 'opacity 0.2s' }}>
        <text x={comp.x + pad1.x_rel + pad1.w / 2} y={yCenter + fontSizePad / 3} textAnchor="middle" style={{ ...monoStyle, fontSize: `${fontSizePad}px`, fill: '#aaaaaa' }}>1</text>
        <text x={xCenter} y={yCenter + fontSizeComp / 3} textAnchor="middle" style={{ ...monoStyle, fontSize: `${fontSizeComp}px` }}>{comp.nombre}</text>
        <text x={comp.x + pad2.x_rel + pad2.w / 2} y={yCenter + fontSizePad / 3} textAnchor="middle" style={{ ...monoStyle, fontSize: `${fontSizePad}px`, fill: '#aaaaaa' }}>2</text>
      </g>
    );
  };

  return (
    <div style={{ ...styles.container, ...(fullscreen ? { borderRadius: 0, border: 'none' } : {}) }}>
      {/* 1. BARRA SUPERIOR: HERRAMIENTAS, ESCALAS, AUTOHOLD Y BÚSQUEDA */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Map size={18} /> BOARDVIEW PRO
          </span>
          {nombreModelo && (
            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: '#111827', color: '#00ffff', fontWeight: 'bold', border: '1px solid #374151' }}>
              {nombreModelo.toUpperCase()}
            </span>
          )}

          <div style={styles.divider} />

          {/* Selector de Herramientas */}
          <div style={{ display: 'flex', background: '#111827', padding: '3px', borderRadius: '8px', border: '1px solid #374151' }}>
            <button 
              onClick={() => { setTool('select'); setDrawingStep(0); }} 
              style={{ ...styles.toolBtn, ...(tool === 'select' && styles.toolBtnActive) }}
              title="Puntero de selección y arrastre"
            >
              Puntero
            </button>
            <button 
              onClick={() => { setTool('drawSMD'); setDrawingStep(0); }} 
              style={{ ...styles.toolBtn, ...(tool === 'drawSMD' && styles.toolBtnActive) }}
              title="Dibujar Componente SMD (Shift para alinear recto)"
            >
              + Dibujar SMD
            </button>
            <button 
              onClick={() => { setTool('pan'); setDrawingStep(0); }} 
              style={{ ...styles.toolBtn, ...(tool === 'pan' && styles.toolBtnActive) }}
              title="Arrastrar / Panear lienzo"
            >
              Mover
            </button>
          </div>

          {tool === 'drawSMD' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.3s' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Tipo:</span>
              <select 
                value={tipoDrawing} 
                onChange={(e) => setTipoDrawing(e.target.value)}
                style={styles.selectDark}
              >
                {TIPOS_COMPONENTE.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.divider} />

          {/* Selector de Escalas de Medición (Diodo, Voltios, uA, Ohmios) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#111827', padding: '3px 4px', borderRadius: '8px', border: '1px solid #374151' }}>
            <span style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 'bold', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Gauge size={13} /> Escala:
            </span>
            {ESCALAS_CONFIG.map(esc => {
              const isSelected = activeScale === esc.id;
              return (
                <button
                  key={esc.id}
                  onClick={() => seleccionarEscala(esc.id)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '5px',
                    border: isSelected ? `1.5px solid ${esc.border}` : '1px solid transparent',
                    background: isSelected ? esc.color : 'transparent',
                    color: isSelected ? '#ffffff' : '#9ca3af',
                    fontWeight: 'bold',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? `0 0 8px ${esc.color}66` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title={`Gira el dial del multímetro a ${esc.label} y haz clic aquí`}
                >
                  {esc.label}
                </button>
              );
            })}
          </div>

          <div style={styles.divider} />

          {/* Botón de AutoHold */}
          <button 
            onClick={() => setAutoHoldActivo(!autoHoldActivo)} 
            style={{ 
              ...styles.btn, 
              backgroundColor: autoHoldActivo ? 'rgba(16, 185, 129, 0.2)' : '#1f2937', 
              color: autoHoldActivo ? '#10b981' : '#9ca3af',
              border: autoHoldActivo ? '1px solid #10b981' : '1px solid #374151',
              boxShadow: autoHoldActivo ? '0 0 10px rgba(16,185,129,0.4)' : 'none'
            }}
            title="Captura automática de multímetro al estabilizar y auto-avance"
          >
            <Zap size={14} /> {autoHoldActivo ? 'HOLD ON' : 'HOLD'}
          </button>

          {/* Botón de Iniciar Flujo de Medición Guiada */}
          <button 
            onClick={iniciarMedicionGuiada}
            style={{ 
              ...styles.btn, 
              backgroundColor: '#3b82f6', 
              color: '#ffffff'
            }}
            title="Recorrer componentes en el orden creado para medir"
          >
            <Play size={13} /> Medir en Orden
          </button>

          <div style={styles.divider} />

          {/* Buscador Rápido */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', padding: '2px 8px' }}>
              <Search size={14} color="#9ca3af" />
              <input 
                type="text" 
                placeholder="Buscar componente o net..." 
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setMostrarResultadosBusqueda(true); }}
                onFocus={() => setMostrarResultadosBusqueda(true)}
                style={styles.searchInput}
              />
              {busqueda && (
                <button onClick={() => { setBusqueda(''); setMostrarResultadosBusqueda(false); }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {mostrarResultadosBusqueda && resultadosBusqueda.length > 0 && (
              <div style={styles.searchResultsDropdown}>
                {resultadosBusqueda.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => centrarEnComponente(c)}
                    style={styles.searchResultItem}
                  >
                    <div>
                      <strong style={{ color: '#00ffff' }}>{c.nombre}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginLeft: '6px' }}>({c.tipo})</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                      {c.pads.map(p => p.netName).join(' · ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Acciones de Guardado y Cierre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {ultimaSincronizacion && (
            <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} /> Sincronizado
            </span>
          )}
          {onGuardar && (
            <button 
              onClick={() => onGuardar(componentes, imgPlacaUrl, imgEsquemaUrl)} 
              disabled={guardando}
              style={{
                ...styles.btn, 
                backgroundColor: cambiosPendientes ? '#d97706' : '#10b981',
                color: '#fff',
                boxShadow: cambiosPendientes ? '0 0 10px rgba(217,119,6,0.3)' : 'none'
              }}
            >
              <Save size={14} />
              {guardando ? 'Guardando...' : 'Guardar Boardview'}
            </button>
          )}
          {onCerrar && (
            <button
              onClick={onCerrar}
              style={styles.closeFullscreenBtn}
              title="Cerrar pantalla completa"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 2. BARRA DE CAPAS DE IMAGEN (PLACA / ESQUEMA) Y MATRIZ */}
      <div style={styles.layerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', background: '#111827', padding: '2px', borderRadius: '6px', border: '1px solid #374151' }}>
            <button 
              onClick={() => setCapaActiva('placa')} 
              style={{ ...styles.capaBtn, ...(capaActiva === 'placa' && styles.capaBtnActive) }}
            >
              📸 Capa Placa
            </button>
            <button 
              onClick={() => setCapaActiva('esquema')} 
              style={{ ...styles.capaBtn, ...(capaActiva === 'esquema' && styles.capaBtnActive) }}
            >
              🗺️ Capa Esquema
            </button>
          </div>

          {capaActiva === 'placa' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label style={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={showPlaca} 
                  onChange={(e) => setShowPlaca(e.target.checked)} 
                />
                Ver Placa
              </label>

              {showPlaca && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Opacidad:</span>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05"
                    value={placaOpacity} 
                    onChange={(e) => setPlacaOpacity(parseFloat(e.target.value))}
                    style={{ width: '55px', accentColor: '#3b82f6' }}
                  />
                </div>
              )}

              <button onClick={() => fileInputPlacaRef.current && fileInputPlacaRef.current.click()} style={styles.imgBtn} title="Subir foto de placa desde PC">
                <Upload size={12} /> Subir
              </button>
              <button onClick={pedirUrlPlaca} style={styles.imgBtn} title="Pegar URL de PostImages / postimg.cc">
                <Link size={12} /> URL
              </button>
              <button onClick={() => setImgPlacaUrl(IMAGEN_PREDETERMINADA)} style={styles.imgBtn} title="Restaurar imagen predeterminada">
                <RotateCcw size={12} /> Predet.
              </button>

              <input
                ref={fileInputPlacaRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={manejarArchivoImagenPlaca}
              />
            </div>
          )}

          {capaActiva === 'esquema' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label style={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={showEsquema} 
                  onChange={(e) => setShowEsquema(e.target.checked)} 
                />
                Ver Esquema
              </label>

              {showEsquema && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Opacidad:</span>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05"
                    value={esquemaOpacity} 
                    onChange={(e) => setEsquemaOpacity(parseFloat(e.target.value))}
                    style={{ width: '55px', accentColor: '#8b5cf6' }}
                  />
                </div>
              )}

              <button onClick={() => fileInputEsquemaRef.current && fileInputEsquemaRef.current.click()} style={styles.imgBtn} title="Subir esquema desde PC">
                <Upload size={12} /> Subir
              </button>
              <button onClick={pedirUrlEsquema} style={styles.imgBtn} title="Pegar URL de esquema (PostImages)">
                <Link size={12} /> URL
              </button>

              <input
                ref={fileInputEsquemaRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={manejarArchivoImagenEsquema}
              />
            </div>
          )}

          <div style={styles.divider} />

          {/* Filtros de Capas Vectoriales */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={showHitbox} 
                onChange={(e) => setShowHitbox(e.target.checked)} 
              />
              Hitbox
            </label>
            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={showComponentNames} 
                onChange={(e) => setShowComponentNames(e.target.checked)} 
              />
              Nombres
            </label>
          </div>

          <div style={styles.divider} />

          {/* Panel Matriz */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={styles.checkboxLabel} title="Clonar componentes en matriz (arrastrar el nodo cyan)">
              <input 
                type="checkbox" 
                checked={matrizActiva} 
                onChange={(e) => setMatrizActiva(e.target.checked)} 
              />
              <span style={{ color: matrizActiva ? '#00ffff' : '#aaa', fontWeight: 'bold' }}>Matriz</span>
            </label>

            {matrizActiva && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', animation: 'fadeIn 0.3s' }}>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={matrizRows} 
                  onChange={(e) => setMatrizRows(Math.max(1, parseInt(e.target.value) || 1))}
                  style={styles.numInput} 
                  title="Filas"
                  placeholder="F"
                />
                <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>x</span>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={matrizCols} 
                  onChange={(e) => setMatrizCols(Math.max(1, parseInt(e.target.value) || 1))}
                  style={styles.numInput} 
                  title="Columnas"
                  placeholder="C"
                />
              </div>
            )}
          </div>
        </div>

        {/* Indicador de Línea Activa */}
        {activeNetName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#00ffff' }}>
            <span>Línea Activa:</span>
            <strong style={{ background: 'rgba(0,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0,255,255,0.3)' }}>
              {activeNetName}
            </strong>
          </div>
        )}
      </div>

      {/* 3. AREA CENTRAL: LIENZO SVG + PANEL LATERAL */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: '500px', overflow: 'hidden' }}>
        
        {/* LIENZO SVG */}
        <div 
          ref={svgContainerRef}
          style={{ 
            ...styles.canvasContainer, 
            cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : (isDraggingComp ? 'move' : 'default') 
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setIsPanning(false); setIsDraggingComp(false); setHoveredComp(null); }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* HUD de Medición del Multímetro con Verificación de Coincidencia de Dial */}
          <div style={styles.hudContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ESCALAS_CONFIG.find(e => e.id === activeScale)?.color || '#3b82f6' }} />
                Escala: {activeScale.toUpperCase()}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: autoHoldActivo ? '#10b981' : '#6b7280' }}>
                {autoHoldActivo ? '● AUTO-HOLD' : '○ HOLD OFF'}
              </span>
            </div>

            {/* Lectura en vivo principal */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span 
                style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  fontFamily: 'Consolas, monospace',
                  color: lecturaEnVivo === 'OL' ? '#ef4444' : 
                         parseFloat(lecturaEnVivo) < 0.050 ? '#ef4444' : '#00ffff',
                  textShadow: '0 0 10px rgba(0,255,255,0.3)'
                }}
              >
                {lecturaEnVivo}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#9ca3af', fontWeight: 'bold' }}>
                {unidadLectura !== '---' ? unidadLectura : (activeScale === 'diodo' || activeScale === 'voltio' ? 'V' : (activeScale === 'ua' ? 'uA' : 'Ω'))}
              </span>
            </div>

            {/* Alerta de Desajuste de Dial vs Escala */}
            {dialMismatch && (
              <div style={styles.dialMismatchAlert}>
                <AlertTriangle size={11} color="#f59e0b" />
                <span>{dialMismatch}</span>
                {escalaDetectadaDial && (
                  <button
                    onClick={() => seleccionarEscala(escalaDetectadaDial)}
                    style={styles.syncDialBtn}
                    title="Sincronizar escala del visor con el dial del multímetro"
                  >
                    Sincronizar
                  </button>
                )}
              </div>
            )}

            {padActivo && (
              <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '4px' }}>
                Pad: <strong style={{ color: '#00ffff' }}>{compActivo?.nombre} / Pin {padActivo.id}</strong> ({padActivo.netName})
              </div>
            )}
          </div>

          {/* Zoom Controls Overlay */}
          <div style={styles.zoomControls}>
            <button onClick={() => zoomCentro(1.25)} style={styles.zoomBtn} title="Acercar"><ZoomIn size={16} /></button>
            <button onClick={() => zoomCentro(1 / 1.25)} style={styles.zoomBtn} title="Alejar"><ZoomOut size={16} /></button>
            <button onClick={() => fitToView()} style={styles.zoomBtn} title="Ajustar imagen a la vista"><Maximize2 size={15} /></button>
          </div>

          {/* Empty State Guidance Overlay */}
          {componentes.length === 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(17, 24, 39, 0.88)',
              border: '1px dashed #374151',
              borderRadius: '14px',
              padding: '24px 32px',
              textAlign: 'center',
              pointerEvents: 'none',
              maxWidth: '400px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
              zIndex: 10
            }}>
              <Map size={36} color="#00ffff" style={{ opacity: 0.85, margin: '0 auto 10px auto', display: 'block' }} />
              <h4 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 'bold' }}>Placa lista para mapeo</h4>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                Usa el botón <strong style={{ color: '#00ffff' }}>+ Dibujar SMD</strong> en la barra superior para trazar y mapear tus componentes en la placa.
              </p>
            </div>
          )}

          <svg
            id="svg-boardview"
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ display: 'block', backgroundColor: '#0a0d16' }}
          >
            <defs>
              <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1f2937" strokeWidth="0.5" />
              </pattern>
              <style>{`
                @keyframes pulseGlow {
                  0% { stroke-opacity: 1; stroke-width: 2.5px; }
                  50% { stroke-opacity: 0.3; stroke-width: 4.5px; }
                  100% { stroke-opacity: 1; stroke-width: 2.5px; }
                }
                .active-measuring-pad {
                  animation: pulseGlow 1.2s infinite ease-in-out;
                }
              `}</style>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPattern)" />

            <g transform={`translate(${posicion.x}, ${posicion.y}) scale(${zoom})`}>
              
              {/* CAPA 1: IMAGEN DE PLACA */}
              {showPlaca && imgPlacaUrl && (
                <g>
                  <rect
                    x="0"
                    y="0"
                    width={placaSize.w}
                    height={placaSize.h}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="8, 6"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.4"
                    style={{ pointerEvents: 'none' }}
                  />
                  <image
                    href={imgPlacaUrl}
                    x="0"
                    y="0"
                    width={placaSize.w}
                    height={placaSize.h}
                    opacity={placaOpacity}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  />
                </g>
              )}

              {/* CAPA 2: IMAGEN DE ESQUEMÁTICO */}
              {showEsquema && imgEsquemaUrl && (
                <g>
                  <rect
                    x="0"
                    y="0"
                    width={esquemaSize.w}
                    height={esquemaSize.h}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1"
                    strokeDasharray="8, 6"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.4"
                    style={{ pointerEvents: 'none' }}
                  />
                  <image
                    href={imgEsquemaUrl}
                    x="0"
                    y="0"
                    width={esquemaSize.w}
                    height={esquemaSize.h}
                    opacity={esquemaOpacity}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  />
                </g>
              )}

              {/* RENDERIZADO DE COMPONENTES SMD */}
              {componentes.map((comp) => {
                const isSelected = selectedCompId === comp.id;
                
                return (
                  <g 
                    key={comp.id}
                    onMouseDown={(e) => {
                      if (tool === 'select') {
                        setSelectedCompId(comp.id);
                        setIsDraggingComp(true);
                        setDragCompId(comp.id);
                        const coords = getCanvasCoords(e);
                        setDragOffset({ x: coords.x - comp.x, y: coords.y - comp.y });
                      }
                    }}
                  >
                    {showHitbox && (
                      <rect
                        x={comp.x}
                        y={comp.y}
                        width={comp.w}
                        height={comp.h}
                        fill={isSelected ? 'rgba(0, 255, 255, 0.05)' : 'transparent'}
                        stroke={isSelected ? '#00ffff' : '#ffffff'}
                        strokeWidth={isSelected ? '2' : '1.2'}
                        strokeDasharray={isSelected ? '3, 3' : 'none'}
                        vectorEffect="non-scaling-stroke"
                        style={{ cursor: tool === 'select' ? 'move' : 'default' }}
                      />
                    )}

                    {comp.pads.map((pad) => {
                      const padX = comp.x + pad.x_rel;
                      const padY = comp.y + pad.y_rel;
                      const isPadSelected = selectedCompId === comp.id && selectedPadId === pad.id;
                      const isNetMatch = activeNetName && pad.netName === activeNetName;

                      return (
                        <g key={pad.id}>
                          {isNetMatch && !isPadSelected && (
                            <rect
                              x={padX - 2}
                              y={padY - 2}
                              width={pad.w + 4}
                              height={pad.h + 4}
                              rx="3"
                              ry="3"
                              fill="none"
                              stroke="#00ffff"
                              strokeWidth="2"
                              strokeDasharray="2, 2"
                              vectorEffect="non-scaling-stroke"
                              style={{ pointerEvents: 'none' }}
                            />
                          )}

                          {isPadSelected && (
                            <rect
                              className="active-measuring-pad"
                              x={padX - 3}
                              y={padY - 3}
                              width={pad.w + 6}
                              height={pad.h + 6}
                              rx="4"
                              ry="4"
                              fill="none"
                              stroke="#00ffff"
                              strokeWidth="2.5"
                              vectorEffect="non-scaling-stroke"
                              style={{ pointerEvents: 'none' }}
                            />
                          )}

                          <rect
                            x={padX}
                            y={padY}
                            width={pad.w}
                            height={pad.h}
                            rx="2"
                            ry="2"
                            fill={obtenerColorDePad(pad, comp.id)}
                            stroke={isPadSelected ? '#ffffff' : (isNetMatch ? '#00ffff' : '#000000')}
                            strokeWidth={isPadSelected ? '2.5' : (isNetMatch ? '1.5' : '1')}
                            vectorEffect="non-scaling-stroke"
                            style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (tool === 'select') {
                                setSelectedCompId(comp.id);
                                setSelectedPadId(pad.id);
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (tool !== 'select') return;
                              setHoveredComp({ comp, pad });
                              const rect = svgContainerRef.current.getBoundingClientRect();
                              setHoveredCoords({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top + 15 });
                            }}
                            onMouseMove={(e) => {
                              if (!hoveredComp) return;
                              const rect = svgContainerRef.current.getBoundingClientRect();
                              setHoveredCoords({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top + 15 });
                            }}
                            onMouseLeave={() => setHoveredComp(null)}
                          />
                        </g>
                      );
                    })}

                    {renderTextosInteligentes(comp)}

                    {isSelected && matrizActiva && (
                      <circle
                        className="interactive-handle"
                        cx={comp.x + comp.w}
                        cy={comp.y + comp.h / 2}
                        r="6"
                        fill="#00ffff"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        style={{ cursor: 'ew-resize' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsMatrixDragging(true);
                          setMatrixStartPos(getCanvasCoords(e));
                          setMatrixClonesPreview([]);
                        }}
                      />
                    )}
                  </g>
                );
              })}

              {/* CLONES TEMPORALES DE MATRIZ */}
              {isMatrixDragging && matrixClonesPreview.map((clone) => (
                <g key={clone.id} opacity="0.5" style={{ pointerEvents: 'none' }}>
                  <rect
                    x={clone.x}
                    y={clone.y}
                    width={clone.w}
                    height={clone.h}
                    fill="transparent"
                    stroke="#00ffff"
                    strokeWidth="1"
                    strokeDasharray="4, 4"
                    vectorEffect="non-scaling-stroke"
                  />
                  {clone.pads.map((pad) => (
                    <rect
                      key={pad.id}
                      x={clone.x + pad.x_rel}
                      y={clone.y + pad.y_rel}
                      width={pad.w}
                      height={pad.h}
                      rx="2"
                      ry="2"
                      fill={pad.tipo === 'GND' ? '#4b5563' : '#d4af37'}
                      stroke="#000"
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  <text 
                    x={clone.x + clone.w / 2} 
                    y={clone.y + clone.h / 2 + 3} 
                    textAnchor="middle" 
                    style={{ fontFamily: 'Consolas, monospace', fontSize: '9px', fill: '#00ffff' }}
                  >
                    {clone.nombre}
                  </text>
                </g>
              ))}

              {/* DIBUJO TEMPORAL */}
              {tool === 'drawSMD' && (
                <g style={{ pointerEvents: 'none' }}>
                  {pad1Temp && (
                    <rect
                      x={pad1Temp.x}
                      y={pad1Temp.y}
                      width={pad1Temp.w}
                      height={pad1Temp.h}
                      fill="rgba(212, 175, 55, 0.4)"
                      stroke="#d4af37"
                      strokeWidth="1.5"
                      strokeDasharray="2, 2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {pad1Temp && pad2Temp && (
                    <line
                      x1={pad1Temp.x + pad1Temp.w / 2}
                      y1={pad1Temp.y + pad1Temp.h / 2}
                      x2={pad2Temp.x + pad2Temp.w / 2}
                      y2={pad2Temp.y + pad2Temp.h / 2}
                      stroke={pad2Temp.lockedAxis ? '#00ffff' : '#f59e0b'}
                      strokeWidth="1.5"
                      strokeDasharray="3, 3"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {pad2Temp && (
                    <rect
                      x={pad2Temp.x}
                      y={pad2Temp.y}
                      width={pad2Temp.w}
                      height={pad2Temp.h}
                      fill="rgba(212, 175, 55, 0.4)"
                      stroke={pad2Temp.lockedAxis ? '#00ffff' : '#d4af37'}
                      strokeWidth="1.5"
                      strokeDasharray="2, 2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {pad1Temp && pad2Temp && (
                    <rect
                      x={Math.min(pad1Temp.x, pad2Temp.x)}
                      y={Math.min(pad1Temp.y, pad2Temp.y)}
                      width={Math.max(pad1Temp.x + pad1Temp.w, pad2Temp.x + pad2Temp.w) - Math.min(pad1Temp.x, pad2Temp.x)}
                      height={Math.max(pad1Temp.y + pad1Temp.h, pad2Temp.y + pad2Temp.h) - Math.min(pad1Temp.y, pad2Temp.y)}
                      fill="transparent"
                      stroke="#ffffff"
                      strokeWidth="1"
                      strokeDasharray="4, 4"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              )}

            </g>
          </svg>

          {/* TOOLTIP EN HOVER */}
          {hoveredComp && (
            <div 
              style={{ 
                ...styles.tooltip, 
                left: `${hoveredCoords.x}px`, 
                top: `${hoveredCoords.y}px` 
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#60a5fa', borderBottom: '1px solid #374151', paddingBottom: '4px', marginBottom: '6px', fontSize: '0.8rem' }}>
                {hoveredComp.comp.nombre} ({hoveredComp.comp.tipo})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div><strong>Pin:</strong> {hoveredComp.pad.id} ({hoveredComp.pad.tipo})</div>
                <div><strong>Net Name:</strong> <span style={{ color: '#00ffff' }}>{hoveredComp.pad.netName}</span></div>
                <div><strong>Footprint:</strong> {hoveredComp.pad.w}x{hoveredComp.pad.h} px</div>
                <div style={{ marginTop: '4px', borderTop: '1px dashed #374151', paddingTop: '4px', color: '#9ca3af' }}>Valores Referencia:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                  <span style={{ color: activeScale === 'diodo' ? '#60a5fa' : '#9ca3af', fontWeight: activeScale === 'diodo' ? 'bold' : 'normal' }}>Diodo:</span> 
                  <strong style={{ color: '#10b981' }}>{hoveredComp.pad.valorSanoDiodo} V</strong>

                  <span style={{ color: activeScale === 'voltio' ? '#f87171' : '#9ca3af', fontWeight: activeScale === 'voltio' ? 'bold' : 'normal' }}>Voltio:</span> 
                  <strong style={{ color: '#3b82f6' }}>{hoveredComp.pad.valorSanoVoltio} V</strong>

                  <span style={{ color: activeScale === 'ua' ? '#34d399' : '#9ca3af', fontWeight: activeScale === 'ua' ? 'bold' : 'normal' }}>Consumo:</span> 
                  <strong style={{ color: '#eab308' }}>{hoveredComp.pad.valorSanoUa} uA</strong>

                  <span style={{ color: activeScale === 'ohmio' ? '#c084fc' : '#9ca3af', fontWeight: activeScale === 'ohmio' ? 'bold' : 'normal' }}>Resist:</span> 
                  <strong style={{ color: '#a855f7' }}>{hoveredComp.pad.valorSanoOhmio} Ω</strong>
                </div>
              </div>
            </div>
          )}

          {/* Banner Dibujo */}
          {tool === 'drawSMD' && (
            <div style={styles.drawingBanner}>
              {drawingStep === 0 && '⚡ PASO 1: Mantén presionado y arrastra para dibujar el PAD 1'}
              {drawingStep === 1 && '📏 Ajustando dimensiones del Pad 1...'}
              {drawingStep === 2 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍 PASO 2: Clic para fijar el PAD 2</span>
                  <span style={{ background: isShiftDown ? '#10b981' : 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> {isShiftDown ? '🔒 Eje Bloqueado (Recto)' : 'Mantén Shift para alinear recto'}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR DERECHO: DETALLES, EDICIÓN, TIPO DE LÍNEA Y NET NAMES */}
        <div style={styles.sidebar}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '6px', marginBottom: '10px' }}>
              <h3 style={styles.sidebarTitle}>Detalles de Selección</h3>
              {compActivo && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => invertirPinesComponente(compActivo.id)}
                    style={styles.actionSmallBtn}
                    title="Invertir Pin 1 y Pin 2 (GND ↔ DATA)"
                  >
                    <ArrowLeftRight size={12} /> Invertir (1↔2)
                  </button>
                  <button 
                    onClick={() => rotarComponente(compActivo.id)}
                    style={styles.actionSmallBtn}
                    title="Rotar componente 90° (Tecla R)"
                  >
                    <RotateCw size={12} /> Rotar 90°
                  </button>
                </div>
              )}
            </div>
            
            {compActivo && padActivo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Info General Componente */}
                <div style={styles.infoCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={compActivo.nombre}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setComponentes(prev => prev.map(c => c.id === compActivo.id ? { ...c, nombre: val } : c));
                      }}
                      style={{ ...styles.inputDark, width: '120px', fontWeight: 'bold', fontSize: '0.9rem', color: '#00ffff' }}
                      title="Editar nombre/número del componente"
                    />
                    <select
                      value={compActivo.tipo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setComponentes(prev => prev.map(c => c.id === compActivo.id ? { ...c, tipo: val } : c));
                      }}
                      style={styles.selectDark}
                      title="Cambiar tipo de componente"
                    >
                      {TIPOS_COMPONENTE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Posición: ({compActivo.x}, {compActivo.y})</span>
                    <span>Tamaño: {compActivo.w}×{compActivo.h}px</span>
                  </div>
                  <button 
                    onClick={() => borrarComponente(compActivo.id)} 
                    style={{ ...styles.btn, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '8px', width: '100%', justifyContent: 'center' }}
                  >
                    <Trash2 size={13} /> Eliminar Componente
                  </button>
                </div>

                {/* Info del Pad Seleccionado */}
                <div style={styles.editSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={styles.sectionTitle}>Edición de Pin / Pad {padActivo.id}</h4>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => setSelectedPadId('1')} 
                        style={{ ...styles.padSelectorBtn, ...(selectedPadId === '1' && styles.padSelectorBtnActive) }}
                      >
                        Pin 1 ({compActivo.pads.find(p => p.id === '1')?.tipo})
                      </button>
                      <button 
                        onClick={() => setSelectedPadId('2')} 
                        style={{ ...styles.padSelectorBtn, ...(selectedPadId === '2' && styles.padSelectorBtnActive) }}
                      >
                        Pin 2 ({compActivo.pads.find(p => p.id === '2')?.tipo})
                      </button>
                    </div>
                  </div>

                  {/* Selector Avanzado de Tipo de Línea */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Tipo de Línea (Categoría)</label>
                    <SelectorTipoLinea
                      valor={padActivo.tipo || 'DATA'}
                      onChange={(val) => {
                        actualizarPropiedadPad(padActivo.id, 'tipo', val);
                      }}
                      tiposCustom={tiposCustom}
                      onAgregarTipo={() => {
                        const nuevo = window.prompt('Ingrese el nombre del nuevo tipo de línea (Ej: I2C, RFFE):', '');
                        if (nuevo && nuevo.trim()) {
                          const limpio = nuevo.trim().toUpperCase().replace(/\s+/g, '_');
                          if (setTiposCustom && !tiposCustom.includes(limpio)) {
                            setTiposCustom([...tiposCustom, limpio]);
                          }
                          actualizarPropiedadPad(padActivo.id, 'tipo', limpio);
                        }
                      }}
                      onEliminarTipo={(tipoABorrar) => {
                        if (setTiposCustom) {
                          setTiposCustom(tiposCustom.filter(t => t !== tipoABorrar));
                        }
                      }}
                    />
                  </div>

                  {/* Net Name (Línea Específica) + Gestor de Nombres */}
                  <div style={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={styles.label}>Net Name (Nombre de Pista / Señal)</label>
                      <button 
                        type="button" 
                        onClick={() => setMostrarGestorNets(!mostrarGestorNets)}
                        style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Tag size={11} /> {mostrarGestorNets ? 'Cerrar Gestor' : 'Gestionar Nets'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="text" 
                        list="netname-sugerencias-main"
                        value={padActivo.netName} 
                        onChange={(e) => actualizarPropiedadPad(padActivo.id, 'netName', e.target.value)}
                        placeholder="Ej: PP_VDD_MAIN"
                        style={{ ...styles.inputDark, flex: 1, color: '#00ffff', fontWeight: 'bold' }}
                      />
                      <button
                        type="button"
                        onClick={() => agregarNetNamePersonalizado(padActivo.netName)}
                        style={{ ...styles.btn, backgroundColor: '#374151', color: '#00ffff', padding: '4px 8px', fontSize: '0.7rem' }}
                        title="Guardar este nombre en la lista de sugerencias de Net Names"
                      >
                        + Guardar Net
                      </button>
                    </div>

                    <datalist id="netname-sugerencias-main">
                      {netNamesCustom.map(n => <option key={n} value={n} />)}
                    </datalist>

                    {/* Popover / Desplegable del Gestor de Net Names */}
                    {mostrarGestorNets && (
                      <div style={styles.gestorNetsCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#60a5fa' }}>Lista de Net Names Sugeridos</span>
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{netNamesCustom.length} nombres</span>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          <input 
                            type="text" 
                            placeholder="Nuevo Net Name..." 
                            value={nuevoNetInput}
                            onChange={(e) => setNuevoNetInput(e.target.value)}
                            style={{ ...styles.inputDark, fontSize: '0.7rem', padding: '3px 6px' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                agregarNetNamePersonalizado(nuevoNetInput);
                              }
                            }}
                          />
                          <button 
                            type="button" 
                            onClick={() => agregarNetNamePersonalizado(nuevoNetInput)}
                            style={{ ...styles.btn, backgroundColor: '#0284c7', color: 'white', padding: '3px 8px', fontSize: '0.65rem' }}
                          >
                            + Añadir
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                          {netNamesCustom.map((net) => (
                            <div 
                              key={net} 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                background: padActivo.netName === net ? 'rgba(0,255,255,0.2)' : '#111827', 
                                border: padActivo.netName === net ? '1px solid #00ffff' : '1px solid #374151',
                                borderRadius: '4px', 
                                padding: '2px 6px',
                                fontSize: '0.65rem',
                                color: '#e5e7eb'
                              }}
                            >
                              <span 
                                onClick={() => actualizarPropiedadPad(padActivo.id, 'netName', net)} 
                                style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                title="Asignar este Net Name al pad actual"
                              >
                                {net}
                              </span>
                              <button
                                type="button"
                                onClick={() => eliminarNetNamePersonalizado(net)}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, fontSize: '0.65rem', fontWeight: 'bold' }}
                                title="Eliminar este Net Name de la lista"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={styles.divider} />

                  {/* Medición en vivo HUD Panel */}
                  <div style={styles.liveRecordBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: ESCALAS_CONFIG.find(e => e.id === activeScale)?.border || '#60a5fa' }}>
                        Captura ({activeScale.toUpperCase()})
                      </span>
                      <button 
                        onClick={() => setAutoHoldActivo(!autoHoldActivo)}
                        style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 'bold', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: autoHoldActivo ? '#10b981' : '#374151',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        {autoHoldActivo ? 'HOLD ACTIVO' : 'ACTIVAR HOLD'}
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => grabarMedicionActual(lecturaEnVivo)} 
                        disabled={lecturaEnVivo === '----'}
                        style={{ ...styles.btn, flex: 1, backgroundColor: ESCALAS_CONFIG.find(e => e.id === activeScale)?.color || '#3b82f6', color: 'white' }}
                        title={`Registrar valor en escala ${activeScale.toUpperCase()}`}
                      >
                        Grabar {activeScale.toUpperCase()}: {lecturaEnVivo}
                      </button>
                      
                      <button 
                        onClick={() => grabarMedicionActual('OL')} 
                        style={{ ...styles.btn, backgroundColor: '#f97316', color: 'white' }}
                      >
                        OL
                      </button>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: '6px', textAlign: 'center' }}>
                      * Al grabar (o con AutoHold), avanza automáticamente al siguiente componente (saltando pines GND).
                    </div>
                  </div>

                  {/* Panel de Valores: Enfocado en la Escala Activa */}
                  {(() => {
                    const cfgEscalaActiva = ESCALAS_CONFIG.find(e => e.id === activeScale) || ESCALAS_CONFIG[0];
                    const getPropSano = (id) => id === 'diodo' ? 'valorSanoDiodo' : id === 'voltio' ? 'valorSanoVoltio' : id === 'ua' ? 'valorSanoUa' : 'valorSanoOhmio';
                    const getPropActual = (id) => id === 'diodo' ? 'valorActualDiodo' : id === 'voltio' ? 'valorActualVoltio' : id === 'ua' ? 'valorActualUa' : 'valorActualOhmio';
                    const propSanoActivo = getPropSano(activeScale);
                    const propActualActivo = getPropActual(activeScale);
                    const valActual = padActivo[propActualActivo];
                    const valSano = padActivo[propSanoActivo];

                    return (
                      <div style={{ marginTop: '10px' }}>
                        {/* Tarjeta Principal de la Escala Seleccionada */}
                        <div style={{
                          backgroundColor: '#0c0f18',
                          border: `1px solid ${cfgEscalaActiva.color}55`,
                          borderRadius: '10px',
                          padding: '12px',
                          boxShadow: `0 0 15px ${cfgEscalaActiva.color}15`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: cfgEscalaActiva.border, display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {cfgEscalaActiva.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => setMostrarTodasEscalas(!mostrarTodasEscalas)}
                              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.68rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                              title="Ver o editar las demás escalas de este pad"
                            >
                              {mostrarTodasEscalas ? '▲ Ocultar otras' : '▼ Ver todas las escalas'}
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                            {/* Valor Sano Referencia */}
                            <div>
                              <label style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                                Valor Sano ({cfgEscalaActiva.unidad}):
                              </label>
                              <input
                                type="text"
                                placeholder="---"
                                value={valSano !== undefined && valSano !== '---' ? valSano : ''}
                                onChange={(e) => actualizarPropiedadPad(padActivo.id, propSanoActivo, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  backgroundColor: '#111827',
                                  border: `1px solid ${cfgEscalaActiva.border}`,
                                  borderRadius: '6px',
                                  color: '#fff',
                                  fontWeight: 'bold',
                                  fontSize: '0.95rem',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            {/* Medición Registrada Actual */}
                            <div>
                              <label style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                                Medición Actual:
                              </label>
                              <div style={{
                                padding: '8px',
                                backgroundColor: '#111827',
                                border: '1px solid #374151',
                                borderRadius: '6px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                color: obtenerColorDePad(padActivo, compActivo.id)
                              }}>
                                {valActual && valActual !== '---' ? `${valActual} ${cfgEscalaActiva.unidad}` : '---'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Vista Expandible de Todas las Escalas Secundarias */}
                        {mostrarTodasEscalas && (
                          <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#0c0f18', borderRadius: '8px', border: '1px solid #1f2937', animation: 'fadeIn 0.2s' }}>
                            <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 'bold', marginBottom: '6px' }}>
                              Otras Escalas Secundarias
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                              {ESCALAS_CONFIG.filter(e => e.id !== activeScale).map(esc => {
                                const propS = getPropSano(esc.id);
                                const propA = getPropActual(esc.id);
                                const vS = padActivo[propS];
                                const vA = padActivo[propA];

                                return (
                                  <div key={esc.id} style={{ backgroundColor: '#111827', padding: '6px', borderRadius: '6px', border: '1px solid #27303f' }}>
                                    <div style={{ fontSize: '0.65rem', color: esc.border, fontWeight: 'bold' }}>{esc.label}</div>
                                    <input
                                      type="text"
                                      placeholder="Ref Sano"
                                      value={vS !== undefined && vS !== '---' ? vS : ''}
                                      onChange={(e) => actualizarPropiedadPad(padActivo.id, propS, e.target.value)}
                                      style={{ ...styles.smallInput, width: '100%', fontSize: '0.75rem', padding: '2px 4px', margin: '3px 0', textAlign: 'center' }}
                                    />
                                    <div style={{ fontSize: '0.65rem', color: '#9ca3af', textAlign: 'center', marginTop: '2px' }}>
                                      Act: <strong style={{ color: vA && vA !== '---' ? esc.color : '#6b7280' }}>{vA || '---'}</strong>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>

              </div>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center', marginTop: '40px' }}>
                <HelpCircle size={32} style={{ color: '#4b5563', margin: '0 auto 10px auto', display: 'block' }} />
                Haz clic en un componente o pad para ver y editar sus propiedades.
              </div>
            )}
          </div>

          {/* Lista Resumen de Componentes en Orden de Creación */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #374151', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h4 style={{ ...styles.sectionTitle }}>Componentes ({componentes.length})</h4>
              <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Orden Creación</span>
            </div>
            <div style={styles.compListContainer}>
              {componentes.map((c, idx) => (
                <div 
                  key={c.id} 
                  onClick={() => { setSelectedCompId(c.id); setSelectedPadId('1'); }}
                  style={{ 
                    ...styles.compListItem, 
                    backgroundColor: selectedCompId === c.id ? '#3b82f6' : '#111827',
                    color: selectedCompId === c.id ? '#fff' : '#d1d5db'
                  }}
                >
                  <span>#{idx + 1} {c.nombre}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{c.tipo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- ESTILOS EN JAVASCRIPT INLINE (Dark High-Tech UI) ---
const styles = {
  container: {
    backgroundColor: '#111827',
    color: '#f3f4f6',
    fontFamily: 'Consolas, monospace, system-ui',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    borderRadius: '12px',
    border: '2px solid #374151',
    overflow: 'hidden',
    boxSizing: 'border-box',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 15px',
    backgroundColor: '#1f2937',
    borderBottom: '2px solid #374151',
    flexWrap: 'wrap',
    gap: '8px'
  },
  layerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 15px',
    backgroundColor: '#111827',
    borderBottom: '1.5px solid #1f2937',
    flexWrap: 'wrap',
    gap: '8px'
  },
  divider: {
    width: '1px',
    height: '22px',
    backgroundColor: '#374151',
    alignSelf: 'center'
  },
  btn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease-in-out',
    userSelect: 'none'
  },
  toolBtn: {
    padding: '5px 10px',
    borderRadius: '6px',
    border: 'none',
    color: '#9ca3af',
    background: 'transparent',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    transition: 'all 0.15s'
  },
  toolBtnActive: {
    color: '#00ffff',
    backgroundColor: '#1f2937',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
  },
  capaBtn: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    color: '#9ca3af',
    background: 'transparent',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.7rem',
    transition: 'all 0.15s'
  },
  capaBtnActive: {
    color: '#ffffff',
    backgroundColor: '#374151'
  },
  selectDark: {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    color: 'white',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    outline: 'none'
  },
  numInput: {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    color: '#00ffff',
    borderRadius: '6px',
    padding: '4px',
    width: '36px',
    textAlign: 'center',
    fontSize: '0.75rem',
    outline: 'none'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.75rem',
    color: '#d1d5db',
    cursor: 'pointer',
    userSelect: 'none'
  },
  searchInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    padding: '4px 6px',
    fontSize: '0.75rem',
    outline: 'none',
    width: '150px'
  },
  searchResultsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    width: '240px',
    backgroundColor: '#1f2937',
    border: '1.5px solid #374151',
    borderRadius: '6px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.6)',
    zIndex: 9999,
    maxHeight: '200px',
    overflowY: 'auto'
  },
  searchResultItem: {
    padding: '6px 10px',
    cursor: 'pointer',
    borderBottom: '1px solid #374151',
    transition: 'background-color 0.15s'
  },
  canvasContainer: {
    position: 'relative',
    flex: 1,
    height: '100%',
    minHeight: '500px',
    backgroundColor: '#0a0d16',
    overflow: 'hidden',
    userSelect: 'none'
  },
  imgBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 7px',
    borderRadius: '4px',
    border: '1px solid #374151',
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    cursor: 'pointer',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    transition: 'all 0.15s',
    outline: 'none'
  },
  actionSmallBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid #4b5563',
    backgroundColor: '#374151',
    color: '#00ffff',
    cursor: 'pointer',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    transition: 'all 0.15s',
    outline: 'none'
  },
  padSelectorBtn: {
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid #374151',
    backgroundColor: '#1f2937',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '0.65rem',
    fontWeight: 'bold'
  },
  padSelectorBtnActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#60a5fa'
  },
  closeFullscreenBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #374151',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
    outline: 'none'
  },
  zoomControls: {
    position: 'absolute',
    bottom: '15px',
    left: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    zIndex: 10
  },
  zoomBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #374151',
    backgroundColor: 'rgba(31, 41, 55, 0.85)',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
    outline: 'none'
  },
  hudContainer: {
    position: 'absolute',
    top: '15px',
    left: '15px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    border: '2px solid #374151',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
    zIndex: 10,
    minWidth: '200px',
    pointerEvents: 'none'
  },
  dialMismatchAlert: {
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    border: '1px solid #f59e0b',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '0.65rem',
    color: '#fef08a',
    pointerEvents: 'auto'
  },
  syncDialBtn: {
    marginLeft: 'auto',
    background: '#f59e0b',
    color: '#000',
    border: 'none',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '0.6rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  drawingBanner: {
    position: 'absolute',
    bottom: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: '#d97706',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)',
    zIndex: 10,
    pointerEvents: 'none',
    border: '1px solid #f59e0b',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  tooltip: {
    position: 'absolute',
    pointerEvents: 'none',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    border: '1.5px solid #4b5563',
    borderRadius: '8px',
    padding: '10px 12px',
    zIndex: 999,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    width: '230px',
    fontSize: '0.75rem',
    color: '#e5e7eb',
    lineHeight: '1.4'
  },
  sidebar: {
    width: '320px',
    minWidth: '320px',
    borderLeft: '2px solid #374151',
    backgroundColor: '#1f2937',
    padding: '12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxSizing: 'border-box'
  },
  sidebarTitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0
  },
  infoCard: {
    backgroundColor: '#111827',
    padding: '10px',
    borderRadius: '8px',
    border: '1.5px solid #374151'
  },
  editSection: {
    backgroundColor: '#111827',
    padding: '10px',
    borderRadius: '8px',
    border: '1.5px solid #374151',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sectionTitle: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#60a5fa',
    margin: 0
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  label: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    fontWeight: 'bold'
  },
  subLabel: {
    fontSize: '0.6rem',
    color: '#6b7280',
    fontWeight: 'bold',
    display: 'block'
  },
  inputDark: {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    color: 'white',
    borderRadius: '6px',
    padding: '5px 8px',
    outline: 'none',
    fontSize: '0.75rem',
    width: '100%',
    boxSizing: 'border-box'
  },
  smallInput: {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    color: '#10b981',
    borderRadius: '4px',
    padding: '4px',
    width: '100%',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textAlign: 'center',
    outline: 'none'
  },
  liveRecordBox: {
    backgroundColor: '#1f2937',
    padding: '8px',
    borderRadius: '6px',
    border: '1px dashed #4b5563'
  },
  gridValoresSanos: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    marginTop: '4px'
  },
  registrosContainer: {
    marginTop: '6px',
    borderTop: '1px dashed #374151',
    paddingTop: '6px'
  },
  gridRegistros: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    rowGap: '3px',
    fontSize: '0.75rem',
    color: '#9ca3af'
  },
  gestorNetsCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px',
    marginTop: '4px',
    animation: 'fadeIn 0.2s'
  },
  compListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    maxHeight: '160px',
    overflowY: 'auto',
    border: '1px solid #374151',
    borderRadius: '6px',
    padding: '4px'
  },
  compListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'all 0.1s'
  }
};
