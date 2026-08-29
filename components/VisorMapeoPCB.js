import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Save, Trash2, Plus, Move, ZoomIn, ZoomOut, Layers, Maximize2, 
  Settings, Edit, Play, HelpCircle, Activity, Check, AlertTriangle, 
  Map, Eye, EyeOff, Clipboard, RefreshCw, ChevronRight, CheckCircle2,
  Image as ImageIcon, Upload, RotateCcw, X, Link, Search, RotateCw, Lock
} from 'lucide-react';

const TIPOS_COMPONENTE = ['Capacitor', 'Resistencia', 'Diodo', 'Bobina'];
const TIPOS_LINEA = ['DATA', 'GND', 'VCC', 'NC'];

const TIPO_ABREVIATURAS = {
  Capacitor: 'C',
  Resistencia: 'R',
  Diodo: 'D',
  Bobina: 'L'
};

// Sugerencias comunes de Net Names
const NET_NAMES_SUGERIDOS = [
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
  escala = 'diodo', // 'diodo' | 'voltio' | 'ua' | 'ohmio'
  onGuardar,
  cambiosPendientes = false,
  guardando = false,
  ultimaSincronizacion = null,
  componentesIniciales = null,       // lista previa de componentes (persistencia)
  imagenPlacaInicial = null,          // URL foto de placa (persistencia)
  imagenEsquemaInicial = null,        // URL diagrama esquemático (persistencia)
  onCambios = null,                  // callback ({ componentes, imagenPlaca, imagenEsquema })
  fullscreen = false,                // modo pantalla completa
  onCerrar = null                    // botón de cierre en modo fullscreen
}) {
  // --- Estados locales del Boardview ---
  const [componentes, setComponentes] = useState(() => {
    if (Array.isArray(componentesIniciales) && componentesIniciales.length > 0) return componentesIniciales;
    return COMPONENTES_DEFECTO;
  });

  const [activeScale, setActiveScale] = useState(escala);
  const [selectedCompId, setSelectedCompId] = useState(() => {
    const base = Array.isArray(componentesIniciales) && componentesIniciales.length > 0 ? componentesIniciales : COMPONENTES_DEFECTO;
    return base[0]?.id ?? null;
  });
  const [selectedPadId, setSelectedPadId] = useState('1'); // '1' | '2'

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

  // Sincronizar props de imágenes si cambian desde el modelo
  useEffect(() => {
    if (imagenPlacaInicial) setImgPlacaUrl(imagenPlacaInicial);
  }, [imagenPlacaInicial]);
  useEffect(() => {
    if (imagenEsquemaInicial) setImgEsquemaUrl(imagenEsquemaInicial);
  }, [imagenEsquemaInicial]);

  // Configuración de visualización de vectores
  const [showHitbox, setShowHitbox] = useState(true);
  const [showComponentNames, setShowComponentNames] = useState(true);

  // Herramientas: 'select' | 'pan' | 'drawSMD'
  const [tool, setTool] = useState('select');
  const [tipoDrawing, setTipoDrawing] = useState('Capacitor');

  // Navegación (Zoom & Pan) — refs espejo
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
  const [drawingStep, setDrawingStep] = useState(0); // 0: libre, 1: arrastrando pad 1, 2: posicionando pad 2
  const [pad1Temp, setPad1Temp] = useState(null); // { x, y, w, h }
  const [pad2Temp, setPad2Temp] = useState(null); // { x, y, w, h, lockedAxis }
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

  // Sincronizar escala activa con props
  useEffect(() => {
    setActiveScale(escala);
  }, [escala]);

  // Mantener refs espejo siempre actualizadas
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { posicionRef.current = posicion; }, [posicion]);
  useEffect(() => { placaSizeRef.current = placaSize; }, [placaSize]);
  useEffect(() => { esquemaSizeRef.current = esquemaSize; }, [esquemaSize]);

  // Listener para tecla Shift / Ctrl y atajos (R = rotar, Escape = reset)
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

  // --- Auto-persistencia de componentes e imágenes hacia el modelo ---
  const onCambiosRef = useRef(onCambios);
  useEffect(() => { onCambiosRef.current = onCambios; }, [onCambios]);
  useEffect(() => {
    if (!onCambiosRef.current) return;
    const t = setTimeout(() => {
      onCambiosRef.current(componentes, imgPlacaUrl, imgEsquemaUrl);
    }, 400);
    return () => clearTimeout(t);
  }, [componentes, imgPlacaUrl, imgEsquemaUrl]);

  // --- Ajustar imagen centrada y proporcionada a la vista (Fit to View) ---
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

  // Cargar dimensiones de la imagen de Placa
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

  // Cargar dimensiones de la imagen de Esquemático
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

  // --- Zoom al Cursor con la Rueda del Mouse ---
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

  // Zoom desde el centro
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

  // --- Subida y enlace de imágenes (Placa / Esquema) ---
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

  // Convertir coordenadas del cliente a coordenadas SVG del lienzo
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

  // --- Rotación de Componente (90°) ---
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

  // --- Centrar Cámara en Componente Buscado ---
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

  // --- Manejo de Eventos del Mouse ---
  const handleMouseDown = (e) => {
    if (e.target.closest('.interactive-handle')) return;
    const coords = getCanvasCoords(e);

    // Herramienta de Paneo (o clic central / secundario)
    if (tool === 'pan' || e.button === 1 || e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - posicionRef.current.x, y: e.clientY - posicionRef.current.y });
      return;
    }

    // Herramienta de Dibujo SMD
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

    // Paneo
    if (isPanning) {
      setPosicion({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // Arrastrar Componente en modo Selección
    if (isDraggingComp && dragCompId) {
      const newX = Math.round(coords.x - dragOffset.x);
      const newY = Math.round(coords.y - dragOffset.y);
      setComponentes(prev => prev.map(c => c.id === dragCompId ? { ...c, x: newX, y: newY } : c));
      return;
    }

    // Dibujar Pad 1 (Arrastrando)
    if (tool === 'drawSMD' && drawingStep === 1) {
      const w = Math.abs(coords.x - startPoint.x);
      const h = Math.abs(coords.y - startPoint.y);
      const x = Math.min(startPoint.x, coords.x);
      const y = Math.min(startPoint.y, coords.y);
      setPad1Temp({ x, y, w, h });
      return;
    }

    // Posicionar Pad 2 (Modo Espejo + Bloqueo Ortogonal con Shift/Ctrl)
    if (tool === 'drawSMD' && drawingStep === 2 && pad1Temp) {
      const p1CenterX = pad1Temp.x + pad1Temp.w / 2;
      const p1CenterY = pad1Temp.y + pad1Temp.h / 2;

      let targetCenterX = coords.x;
      let targetCenterY = coords.y;

      const dx = coords.x - p1CenterX;
      const dy = coords.y - p1CenterY;

      // Bloqueo ortogonal si Shift o Ctrl están presionados
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

    // Arrastrar Nodo de Matriz
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

  // --- Confirmación de Componente SMD ---
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
          valorSanoDiodo: tipoDrawing === 'Bobina' ? '0.400' : '0.350',
          valorSanoVoltio: '1.800',
          valorSanoUa: tipoDrawing === 'Bobina' ? '100' : '180',
          valorSanoOhmio: tipoDrawing === 'Bobina' ? '0.5' : (tipoDrawing === 'Resistencia' ? '1000' : '10000'),
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
          valorSanoDiodo: isGndDefault ? '0.000' : (tipoDrawing === 'Bobina' ? '0.400' : '0.350'),
          valorSanoVoltio: isGndDefault ? '0.000' : '1.800',
          valorSanoUa: isGndDefault ? '0' : (tipoDrawing === 'Bobina' ? '100' : '180'),
          valorSanoOhmio: isGndDefault ? '0' : (tipoDrawing === 'Bobina' ? '0.5' : (tipoDrawing === 'Resistencia' ? '1000' : '10000')),
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

  // --- Lógica del Multímetro y Resaltado de Net Name ---
  const compActivo = componentes.find(c => c.id === selectedCompId);
  const padActivo = compActivo?.pads.find(p => p.id === selectedPadId);

  // Net Name activo para iluminar todas las pistas conectadas (Estilo ZXW)
  const activeNetName = (padActivo && padActivo.netName && padActivo.netName !== 'NC') ? padActivo.netName : null;

  // Evaluar color de un pad
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

  // Guardar medición en pad activo y auto-avanzar ("Pin Mágico")
  const grabarMedicionActual = (valorEntrada) => {
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

    avanzarSiguientePad();
  };

  const avanzarSiguientePad = () => {
    if (!selectedCompId) return;
    const indexComp = componentes.findIndex(c => c.id === selectedCompId);
    if (indexComp === -1) return;

    if (selectedPadId === '1') {
      setSelectedPadId('2');
    } else {
      const nextIndex = (indexComp + 1) % componentes.length;
      setSelectedCompId(componentes[nextIndex].id);
      setSelectedPadId('1');
    }
  };

  // Actualizar propiedad del pad
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

  // Eliminación de componente
  const borrarComponente = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este componente SMD del Boardview?')) {
      setComponentes(prev => prev.filter(c => c.id !== id));
      if (selectedCompId === id) {
        setSelectedCompId(null);
        setSelectedPadId(null);
      }
    }
  };

  // Resultados de Búsqueda
  const resultadosBusqueda = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.trim().toLowerCase();
    return componentes.filter(c => 
      c.nombre.toLowerCase().includes(q) || 
      c.tipo.toLowerCase().includes(q) ||
      c.pads.some(p => p.netName.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [componentes, busqueda]);

  // Renderizado Inteligente de Textos
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
      {/* 1. BARRA SUPERIOR DE HERRAMIENTAS Y BÚSQUEDA */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Map size={18} /> BOARDVIEW PRO
          </span>

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

          {/* Selector de Tipo a Dibujar */}
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

          {/* Buscador Rápido de Componentes y Líneas */}
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
          
          {/* Selector de Capa Activa */}
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

          {/* Configuración de la Capa de Placa */}
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

          {/* Configuración de la Capa de Esquemático */}
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
          {/* HUD de Medición del Multímetro */}
          <div style={styles.hudContainer}>
            <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Multímetro USB ({activeScale})
            </div>
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
              <span style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: 'bold' }}>
                {activeScale === 'diodo' || activeScale === 'voltio' ? 'V' : (activeScale === 'ua' ? 'uA' : 'Ω')}
              </span>
            </div>
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

          <svg
            id="svg-boardview"
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ display: 'block', backgroundColor: '#0a0d16' }}
          >
            {/* Patrón de Cuadrícula */}
            <defs>
              <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1f2937" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPattern)" />

            {/* Grupo Transformado con Zoom y Paneo */}
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
                    {/* Hitbox Exterior Blanco / Cyan */}
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

                    {/* Pads Internos del Componente */}
                    {comp.pads.map((pad) => {
                      const padX = comp.x + pad.x_rel;
                      const padY = comp.y + pad.y_rel;
                      const isPadSelected = selectedCompId === comp.id && selectedPadId === pad.id;
                      
                      // Resaltado si comparte la misma red (Net Name)
                      const isNetMatch = activeNetName && pad.netName === activeNetName;

                      return (
                        <g key={pad.id}>
                          {/* Anillo de resalte de Net compartida (ZXW Style) */}
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

                    {/* Textos Inteligentes */}
                    {renderTextosInteligentes(comp)}

                    {/* NODO DE EXTENSIÓN PARA MATRIZ */}
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

              {/* DIBUJO TEMPORAL (Pad 1 + Pad 2 con Bloqueo de Eje y Guía Visual) */}
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

                  {/* Línea Guía de Alineación Recta entre Pad 1 y Pad 2 */}
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

          {/* TOOLTIP EN HOVER DE PADS */}
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
                  <span>Diodo:</span> <strong style={{ color: '#10b981' }}>{hoveredComp.pad.valorSanoDiodo} V</strong>
                  <span>Voltio:</span> <strong style={{ color: '#3b82f6' }}>{hoveredComp.pad.valorSanoVoltio} V</strong>
                  <span>Consumo:</span> <strong style={{ color: '#eab308' }}>{hoveredComp.pad.valorSanoUa} uA</strong>
                  <span>Resist:</span> <strong style={{ color: '#a855f7' }}>{hoveredComp.pad.valorSanoOhmio} Ω</strong>
                </div>
              </div>
            </div>
          )}

          {/* Banner de Indicaciones de Dibujo con Bloqueo Shift */}
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

        {/* SIDEBAR DERECHO: DETALLES, EDICIÓN Y ROTACIÓN */}
        <div style={styles.sidebar}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '6px', marginBottom: '10px' }}>
              <h3 style={styles.sidebarTitle}>Detalles de Selección</h3>
              {compActivo && (
                <button 
                  onClick={() => rotarComponente(compActivo.id)}
                  style={styles.rotateBtn}
                  title="Rotar componente 90° (Tecla R)"
                >
                  <RotateCw size={13} /> Rotar 90°
                </button>
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
                    />
                    <select
                      value={compActivo.tipo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setComponentes(prev => prev.map(c => c.id === compActivo.id ? { ...c, tipo: val } : c));
                      }}
                      style={styles.selectDark}
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
                        Pin 1
                      </button>
                      <button 
                        onClick={() => setSelectedPadId('2')} 
                        style={{ ...styles.padSelectorBtn, ...(selectedPadId === '2' && styles.padSelectorBtnActive) }}
                      >
                        Pin 2
                      </button>
                    </div>
                  </div>

                  {/* Net Name */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Net Name (Línea)</label>
                    <input 
                      type="text" 
                      list="netname-sugerencias-main"
                      value={padActivo.netName} 
                      onChange={(e) => actualizarPropiedadPad(padActivo.id, 'netName', e.target.value)}
                      style={styles.inputDark}
                    />
                    <datalist id="netname-sugerencias-main">
                      {NET_NAMES_SUGERIDOS.map(n => <option key={n} value={n} />)}
                    </datalist>
                  </div>

                  {/* Tipo de Pin */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Tipo de Línea</label>
                    <select
                      value={padActivo.tipo}
                      onChange={(e) => actualizarPropiedadPad(padActivo.id, 'tipo', e.target.value)}
                      style={styles.selectDark}
                    >
                      {TIPOS_LINEA.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.divider} />

                  {/* Medición en vivo HUD Panel */}
                  <div style={styles.liveRecordBox}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px' }}>
                      Captura del Multímetro
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => grabarMedicionActual(lecturaEnVivo)} 
                        disabled={lecturaEnVivo === '----'}
                        style={{ ...styles.btn, flex: 1, backgroundColor: '#3b82f6', color: 'white' }}
                        title="Registrar valor de multímetro en vivo"
                      >
                        Grabar: {lecturaEnVivo}
                      </button>
                      
                      <button 
                        onClick={() => grabarMedicionActual('OL')} 
                        style={{ ...styles.btn, backgroundColor: '#f97316', color: 'white' }}
                      >
                        OL
                      </button>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: '6px', textAlign: 'center' }}>
                      * Al grabar, avanza automáticamente al siguiente pad.
                    </div>
                  </div>

                  {/* Edición de Valores Sanos */}
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                      Valores de Referencia Sanos
                    </div>
                    
                    <div style={styles.gridValoresSanos}>
                      <div>
                        <label style={styles.subLabel}>Diodo (V)</label>
                        <input 
                          type="text" 
                          value={padActivo.valorSanoDiodo} 
                          onChange={(e) => actualizarPropiedadPad(padActivo.id, 'valorSanoDiodo', e.target.value)}
                          style={styles.smallInput} 
                        />
                      </div>
                      <div>
                        <label style={styles.subLabel}>Voltios (V)</label>
                        <input 
                          type="text" 
                          value={padActivo.valorSanoVoltio} 
                          onChange={(e) => actualizarPropiedadPad(padActivo.id, 'valorSanoVoltio', e.target.value)}
                          style={styles.smallInput} 
                        />
                      </div>
                      <div>
                        <label style={styles.subLabel}>Consumo (uA)</label>
                        <input 
                          type="text" 
                          value={padActivo.valorSanoUa} 
                          onChange={(e) => actualizarPropiedadPad(padActivo.id, 'valorSanoUa', e.target.value)}
                          style={styles.smallInput} 
                        />
                      </div>
                      <div>
                        <label style={styles.subLabel}>Ohmios (Ω)</label>
                        <input 
                          type="text" 
                          value={padActivo.valorSanoOhmio} 
                          onChange={(e) => actualizarPropiedadPad(padActivo.id, 'valorSanoOhmio', e.target.value)}
                          style={styles.smallInput} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visualización de Mediciones Registradas */}
                  <div style={styles.registrosContainer}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                      Mediciones Registradas
                    </div>
                    <div style={styles.gridRegistros}>
                      <span>Diodo:</span> 
                      <strong style={{ color: obtenerColorDePad({ ...padActivo, valorActualDiodo: padActivo.valorActualDiodo }, compActivo.id) }}>
                        {padActivo.valorActualDiodo || '---'} V
                      </strong>

                      <span>Voltio:</span> 
                      <strong style={{ color: obtenerColorDePad({ ...padActivo, valorActualVoltio: padActivo.valorActualVoltio }, compActivo.id) }}>
                        {padActivo.valorActualVoltio || '---'} V
                      </strong>

                      <span>uA:</span> 
                      <strong style={{ color: obtenerColorDePad({ ...padActivo, valorActualUa: padActivo.valorActualUa }, compActivo.id) }}>
                        {padActivo.valorActualUa || '---'}
                      </strong>

                      <span>Ohmio:</span> 
                      <strong style={{ color: obtenerColorDePad({ ...padActivo, valorActualOhmio: padActivo.valorActualOhmio }, compActivo.id) }}>
                        {padActivo.valorActualOhmio || '---'} Ω
                      </strong>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center', marginTop: '40px' }}>
                <HelpCircle size={32} style={{ color: '#4b5563', margin: '0 auto 10px auto', display: 'block' }} />
                Haz clic en un componente o pad para ver y editar sus propiedades.
              </div>
            )}
          </div>

          {/* Lista Resumen de Componentes */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #374151', paddingTop: '12px' }}>
            <h4 style={{ ...styles.sectionTitle, marginBottom: '6px' }}>Componentes ({componentes.length})</h4>
            <div style={styles.compListContainer}>
              {componentes.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { setSelectedCompId(c.id); setSelectedPadId('1'); }}
                  style={{ 
                    ...styles.compListItem, 
                    backgroundColor: selectedCompId === c.id ? '#3b82f6' : '#111827',
                    color: selectedCompId === c.id ? '#fff' : '#d1d5db'
                  }}
                >
                  <span>{c.nombre}</span>
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
    width: '160px'
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
  rotateBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid #4b5563',
    backgroundColor: '#374151',
    color: '#00ffff',
    cursor: 'pointer',
    fontSize: '0.7rem',
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
    minWidth: '180px',
    pointerEvents: 'none'
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
    width: '310px',
    minWidth: '310px',
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
