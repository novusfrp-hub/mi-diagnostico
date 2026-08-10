import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Save, Trash2, Plus, Move, ZoomIn, ZoomOut, Layers, Maximize2, 
  Settings, Edit, Play, HelpCircle, Activity, Check, AlertTriangle, 
  Map, Eye, EyeOff, Clipboard, RefreshCw, ChevronRight, CheckCircle2,
  Image as ImageIcon, Upload, RotateCcw, X, Link
} from 'lucide-react';

const TIPOS_COMPONENTE = ['Capacitor', 'Resistencia', 'Diodo'];
const TIPOS_LINEA = ['DATA', 'GND', 'VCC', 'NC'];

const TIPO_ABREVIATURAS = {
  Capacitor: 'C',
  Resistencia: 'R',
  Diodo: 'D'
};

// Sugerencias comunes de Net Names
const NET_NAMES_SUGERIDOS = [
  'PP_VDD_MAIN', 'GND', 'PP1V8_S2', 'PP3V0_LDO', 'VBUS_USB', 'PP_BATT_VCC',
  'AP_TO_I2C_SDA', 'AP_TO_I2C_SCL', 'SPI_AP_MOSI', 'SPI_AP_MISO', 'SPI_AP_CLK',
  'PMIC_TO_CPU_RESET', 'VREG_L6A_0P6', 'USB_HS_DP', 'USB_HS_DN', 'NC'
];

const IMAGEN_PREDETERMINADA = '/pcb_motherboard_bg.png';

// Componentes de ejemplo (solo se usan si no se pasa una lista inicial)
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
    }
];

export default function VisorMapeoPCB({
  lecturaEnVivo = '----',
  escala = 'diodo', // 'diodo' | 'voltio' | 'ua' | 'ohmio'
  onGuardar,
  cambiosPendientes = false,
  guardando = false,
  ultimaSincronizacion = null,
  componentesIniciales = null, // lista previa de componentes (persistencia)
  onCambios = null,            // callback ligero al cambiar componentes (auto-persistencia)
  fullscreen = false,          // modo pantalla completa
  onCerrar = null              // botón de cierre en modo fullscreen
}) {
  // --- Estados locales del Boardview ---
  const [componentes, setComponentes] = useState(() => {
    if (Array.isArray(componentesIniciales)) return componentesIniciales;
    return COMPONENTES_DEFECTO;
  });

  const [activeScale, setActiveScale] = useState(escala); // diodo, voltio, ua, ohmio
  const [selectedCompId, setSelectedCompId] = useState(() => {
    const base = Array.isArray(componentesIniciales) ? componentesIniciales : COMPONENTES_DEFECTO;
    return base[0]?.id ?? null;
  });
  const [selectedPadId, setSelectedPadId] = useState('1'); // '1' | '2'

  // Configuración de visualización y capas (Layers)
  const [showBgImage, setShowBgImage] = useState(true);
  const [bgOpacity, setBgOpacity] = useState(0.65);
  const [showHitbox, setShowHitbox] = useState(true);
  const [showComponentNames, setShowComponentNames] = useState(true);
  const [bgImageUrl, setBgImageUrl] = useState(IMAGEN_PREDETERMINADA);

  // Dimensiones naturales de la imagen de fondo (para dibujarla 1:1 y proporcionada)
  const [bgImageSize, setBgImageSize] = useState({ w: 1024, h: 1024 });

  // Herramientas: 'select' | 'pan' | 'drawSMD'
  const [tool, setTool] = useState('select');
  const [tipoDrawing, setTipoDrawing] = useState('Capacitor');

  // Navegación (Zoom & Pan) — refs espejo para evitar closures obsoletos
  const [zoom, setZoom] = useState(1);
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const posicionRef = useRef(posicion);
  const bgImageSizeRef = useRef(bgImageSize);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);

  // Lógica de dibujo (Pad Espejo)
  const [drawingStep, setDrawingStep] = useState(0); // 0: libre, 1: arrastrando pad 1, 2: posicionando pad 2
  const [pad1Temp, setPad1Temp] = useState(null); // { x, y, w, h }
  const [pad2Temp, setPad2Temp] = useState(null); // { x, y, w, h } (w y h bloqueados de pad1)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  // Lógica de matriz
  const [matrizActiva, setMatrizActiva] = useState(false);
  const [matrizRows, setMatrizRows] = useState(1);
  const [matrizCols, setMatrizCols] = useState(5);
  const [isMatrixDragging, setIsMatrixDragging] = useState(false);
  const [matrixStartPos, setMatrixStartPos] = useState({ x: 0, y: 0 });
  const [matrixClonesPreview, setMatrixClonesPreview] = useState([]);

  // Modales y Tooltips
  const [hoveredComp, setHoveredComp] = useState(null);
  const [hoveredCoords, setHoveredCoords] = useState({ x: 0, y: 0 });
  const [editingComp, setEditingComp] = useState(null); // componente en edición (para modal de doble click)

  // Referencia al contenedor SVG
  const svgRef = useRef(null);
  const svgContainerRef = useRef(null);

  // Sincronizar escala activa con props
  useEffect(() => {
    setActiveScale(escala);
  }, [escala]);

  // Mantener refs espejo siempre actualizadas
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { posicionRef.current = posicion; }, [posicion]);
  useEffect(() => { bgImageSizeRef.current = bgImageSize; }, [bgImageSize]);

  // --- Auto-persistencia ligera de componentes (sin alertas) ---
  const onCambiosRef = useRef(onCambios);
  useEffect(() => { onCambiosRef.current = onCambios; }, [onCambios]);
  useEffect(() => {
    if (!onCambiosRef.current) return;
    const t = setTimeout(() => onCambiosRef.current(componentes), 400);
    return () => clearTimeout(t);
  }, [componentes]);

  // --- Ajustar imagen centrada y proporcionada a la vista (Fit to View) ---
  const fitToView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cw = rect.width || 800;
    const ch = rect.height || 600;
    const pad = 50; // margen alrededor de la imagen
    const iw = bgImageSizeRef.current.w || 1024;
    const ih = bgImageSizeRef.current.h || 1024;
    const scale = Math.min((cw - pad) / iw, (ch - pad) / ih);
    const z = Math.max(0.15, Math.min(4, scale));
    setZoom(z);
    setPosicion({ x: (cw - iw * z) / 2, y: (ch - ih * z) / 2 });
  }, []);

  // --- Cargar dimensiones naturales de la imagen y ajustar la vista ---
  useEffect(() => {
    if (!bgImageUrl) return;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width || 1024;
      const h = img.naturalHeight || img.height || 1024;
      setBgImageSize({ w, h });
      requestAnimationFrame(() => fitToView());
    };
    img.onerror = () => {
      setBgImageSize({ w: 1024, h: 1024 });
    };
    img.src = bgImageUrl;
  }, [bgImageUrl, fitToView]);

  // --- Zoom hacia el cursor con la rueda (proporcional a la rotación) ---
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
      // Factor exponencial: sensible a la magnitud del scroll, no al número de eventos
      const factor = Math.exp(-e.deltaY * 0.0015);
      const newZoom = Math.max(0.15, Math.min(10, oldZoom * factor));

      // Mantener fijo el punto que está bajo el cursor
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
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // --- Zoom desde el centro de la vista (botones + / -) ---
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

  // --- Carga de imagen de referencia (archivo local → base64) ---
  const manejarArchivoImagen = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBgImageUrl(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const pedirUrlImagen = () => {
    const nuevaUrl = window.prompt('Ingresa el enlace (URL) de la imagen de la placa:', bgImageUrl === IMAGEN_PREDETERMINADA ? '' : bgImageUrl || '');
    if (nuevaUrl !== null && nuevaUrl.trim()) {
      setBgImageUrl(nuevaUrl.trim());
    }
  };

  // Convertir coordenadas cliente a coordenadas locales del lienzo SVG
  const getCanvasCoords = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Deshacer el efecto de zoom y paneo (usando refs siempre actuales)
    const x = (clientX - posicionRef.current.x) / zoomRef.current;
    const y = (clientY - posicionRef.current.y) / zoomRef.current;
    return { x, y };
  };

  // --- Lógica de Eventos de Ratón (Lienzo SVG) ---
  const handleMouseDown = (e) => {
    // Evitar disparar si se hace clic en botones interactivos dentro del SVG
    if (e.target.closest('.interactive-handle')) return;

    const coords = getCanvasCoords(e);

    // Herramienta de Paneo (o clic central / clic derecho)
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
        // Iniciar dibujo de Pad 1
        setDrawingStep(1);
        setStartPoint({ x: coords.x, y: coords.y });
        setPad1Temp({ x: coords.x, y: coords.y, w: 0, h: 0 });
      } else if (drawingStep === 2) {
        // Confirmar posicionamiento de Pad 2
        confirmComponentCreation();
      }
      return;
    }
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoords(e);

    // Acción: Paneo
    if (isPanning) {
      setPosicion({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // Acción: Dibujar Pad 1 (Arrastrando)
    if (tool === 'drawSMD' && drawingStep === 1) {
      const w = Math.abs(coords.x - startPoint.x);
      const h = Math.abs(coords.y - startPoint.y);
      const x = Math.min(startPoint.x, coords.x);
      const y = Math.min(startPoint.y, coords.y);
      setPad1Temp({ x, y, w, h });
      return;
    }

    // Acción: Previsualizar Pad 2 (Espejo locked dimensions)
    if (tool === 'drawSMD' && drawingStep === 2 && pad1Temp) {
      // Pad 2 centrado en cursor, manteniendo w y h del Pad 1
      const x = coords.x - pad1Temp.w / 2;
      const y = coords.y - pad1Temp.h / 2;
      setPad2Temp({ x, y, w: pad1Temp.w, h: pad1Temp.h });
      return;
    }

    // Acción: Arrastrar Nodo de Matriz
    if (isMatrixDragging && selectedCompId) {
      const compPiloto = componentes.find(c => c.id === selectedCompId);
      if (!compPiloto) return;

      const deltaX = coords.x - matrixStartPos.x;
      const deltaY = coords.y - matrixStartPos.y;

      // Bloqueo de Ejes inteligente
      let lockedDeltaX = deltaX;
      let lockedDeltaY = deltaY;

      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        lockedDeltaY = 0; // Congelar eje Y (Movimiento horizontal)
      } else if (Math.abs(deltaY) > Math.abs(deltaX) * 1.3) {
        lockedDeltaX = 0; // Congelar eje X (Movimiento vertical)
      }

      const rows = parseInt(matrizRows) || 1;
      const cols = parseInt(matrizCols) || 1;

      // Calcular equidistancia
      const stepX = cols > 1 ? lockedDeltaX / (cols - 1) : 0;
      const stepY = rows > 1 ? lockedDeltaY / (rows - 1) : 0;

      const previews = [];
      let cloneIndex = 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 && c === 0) continue; // Saltar el piloto

          const offsetX = c * stepX;
          const offsetY = r * stepY;

          previews.push({
            id: `clone_temp_${r}_${c}`,
            nombre: `${compPiloto.nombre}_M${cloneIndex++}`,
            tipo: compPiloto.tipo,
            x: compPiloto.x + offsetX,
            y: compPiloto.y + offsetY,
            w: compPiloto.w,
            h: compPiloto.h,
            pads: compPiloto.pads.map(p => ({
              ...p,
              // Mantener las coordenadas relativas intactas
            }))
          });
        }
      }
      setMatrixClonesPreview(previews);
    }
  };

  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // Terminar definición de Pad 1 y pasar a ubicar Pad 2
    if (tool === 'drawSMD' && drawingStep === 1 && pad1Temp) {
      if (pad1Temp.w < 3 || pad1Temp.h < 3) {
        // Evitar clics accidentales pequeños
        setDrawingStep(0);
        setPad1Temp(null);
      } else {
        setDrawingStep(2);
      }
      return;
    }

    // Terminar arrastre de matriz y consolidar los clones
    if (isMatrixDragging) {
      setIsMatrixDragging(false);
      if (matrixClonesPreview.length > 0) {
        // Consolidar en estado real de componentes
        const consolidados = matrixClonesPreview.map(clone => ({
          ...clone,
          id: `smd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        }));
        setComponentes(prev => [...prev, ...consolidados]);
        setMatrixClonesPreview([]);
      }
    }
  };

  // --- Confirmación y Unificación de Componente SMD ---
  const confirmComponentCreation = () => {
    if (!pad1Temp || !pad2Temp) return;

    // Calcular límites exteriores combinados para el Hitbox Blanco
    const minX = Math.min(pad1Temp.x, pad2Temp.x);
    const minY = Math.min(pad1Temp.y, pad2Temp.y);
    const maxX = Math.max(pad1Temp.x + pad1Temp.w, pad2Temp.x + pad2Temp.w);
    const maxY = Math.max(pad1Temp.y + pad1Temp.h, pad2Temp.y + pad2Temp.h);

    const compW = maxX - minX;
    const compH = maxY - minY;

    // Abreviatura según tipo
    const prefix = TIPO_ABREVIATURAS[tipoDrawing] || 'C';
    const numComp = componentes.filter(c => c.tipo === tipoDrawing).length + 1401;
    const nombreSugerido = `${prefix}${numComp}`;

    // Pads relativos
    const pad1RelX = pad1Temp.x - minX;
    const pad1RelY = pad1Temp.y - minY;
    const pad2RelX = pad2Temp.x - minX;
    const pad2RelY = pad2Temp.y - minY;

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
          x_rel: pad1RelX,
          y_rel: pad1RelY,
          w: pad1Temp.w,
          h: pad1Temp.h,
          valorSanoDiodo: '0.350',
          valorSanoVoltio: '1.800',
          valorSanoUa: '180',
          valorSanoOhmio: '10000',
          valorActualDiodo: '---',
          valorActualVoltio: '---',
          valorActualUa: '---',
          valorActualOhmio: '---'
        },
        {
          id: '2',
          netName: 'GND',
          tipo: 'GND',
          x_rel: pad2RelX,
          y_rel: pad2RelY,
          w: pad2Temp.w,
          h: pad2Temp.h,
          valorSanoDiodo: '0.000',
          valorSanoVoltio: '0.000',
          valorSanoUa: '0',
          valorSanoOhmio: '0',
          valorActualDiodo: '0.000',
          valorActualVoltio: '0.000',
          valorActualUa: '0',
          valorActualOhmio: '0'
        }
      ]
    };

    setComponentes(prev => [...prev, nuevoComp]);
    setSelectedCompId(nuevoComp.id);
    setSelectedPadId('1');

    // Limpiar dibujo temporal
    setPad1Temp(null);
    setPad2Temp(null);
    setDrawingStep(0);
    setTool('select'); // volver a puntero
  };

  // --- Lógica del Multímetro, Grabado e Inteligencia en Vivo ---
  const compActivo = componentes.find(c => c.id === selectedCompId);
  const padActivo = compActivo?.pads.find(p => p.id === selectedPadId);

  // Evaluar color de un pad específico según mediciones
  const obtenerColorDePad = (pad, compId) => {
    // Si es el pad seleccionado actualmente y estamos dibujando/creando
    if (selectedCompId === compId && selectedPadId === pad.id) {
      return '#00ffff'; // Cyan brillante indicador de selección
    }

    if (pad.tipo === 'GND') return '#4b5563'; // Gris GND
    if (pad.tipo === 'NC') return '#1e3a8a'; // Azul NC

    const colorBase = '#d4af37'; // Dorado base DATA

    // Obtener valores según escala
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
    if (valAct === 'OL' && valSano !== 'OL') return '#f97316'; // Naranja (Abierto)

    const vAct = parseFloat(valAct);
    const vSano = parseFloat(valSano);

    if (isNaN(vAct) || isNaN(vSano)) return colorBase;

    // Lógica milimétrica de rangos (replicado de FPC/IC)
    if (activeScale === 'diodo') {
      if (vAct < 0.050) return '#ef4444'; // Rojo (Corto)
      if (Math.abs(vAct - vSano) <= 0.040) return '#10b981'; // Verde (Sano)
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

    return '#f97316'; // Naranja (Alterado)
  };

  // Guardar medición en el pad activo
  const grabarMedicionActual = (valorEntrada) => {
    if (!selectedCompId || !selectedPadId) return;

    setComponentes(prev => prev.map(comp => {
      if (comp.id !== selectedCompId) return comp;
      return {
        ...comp,
        pads: comp.pads.map(pad => {
          if (pad.id !== selectedPadId) return pad;
          
          // Grabar la lectura actual en la escala correspondiente
          const actualizaciones = {};
          if (activeScale === 'diodo') actualizaciones.valorActualDiodo = valorEntrada;
          if (activeScale === 'voltio') actualizaciones.valorActualVoltio = valorEntrada;
          if (activeScale === 'ua') actualizaciones.valorActualUa = valorEntrada;
          if (activeScale === 'ohmio') actualizaciones.valorActualOhmio = valorEntrada;

          return { ...pad, ...actualizaciones };
        })
      };
    }));

    // Auto-avanzar al siguiente pad ("Pin Mágico")
    avanzarSiguientePad();
  };

  const avanzarSiguientePad = () => {
    if (!selectedCompId) return;
    const indexComp = componentes.findIndex(c => c.id === selectedCompId);
    if (indexComp === -1) return;

    if (selectedPadId === '1') {
      setSelectedPadId('2');
    } else {
      // Avanzar al primer pad del siguiente componente
      const nextIndex = (indexComp + 1) % componentes.length;
      setSelectedCompId(componentes[nextIndex].id);
      setSelectedPadId('1');
    }
  };

  // Asignación rápida de Net Name o Tipo de pad
  const actualizarPropiedadPad = (padId, prop, valor) => {
    setComponentes(prev => prev.map(comp => {
      if (comp.id !== selectedCompId) return comp;
      return {
        ...comp,
        pads: comp.pads.map(p => {
          if (p.id !== padId) return p;
          
          let actualizacion = { [prop]: valor };
          // Si cambiamos tipo a GND, reiniciamos valores a 0 automáticamente
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

  // --- Lógica del Tooltip en Hover ---
  const handlePadMouseEnter = (e, comp, pad) => {
    if (tool !== 'select') return;
    setHoveredComp({ comp, pad });
    
    // Obtener coordenadas de cliente para el tooltip
    const rect = svgContainerRef.current.getBoundingClientRect();
    setHoveredCoords({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15
    });
  };

  const handlePadMouseMove = (e) => {
    if (!hoveredComp) return;
    const rect = svgContainerRef.current.getBoundingClientRect();
    setHoveredCoords({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15
    });
  };

  const handlePadMouseLeave = () => {
    setHoveredComp(null);
  };

  // --- Edición Detallada por Doble Clic ---
  const handleComponentDoubleClick = (comp) => {
    setEditingComp(JSON.parse(JSON.stringify(comp))); // clonar objeto para edición local
  };

  const guardarEdicionModal = () => {
    if (!editingComp) return;
    setComponentes(prev => prev.map(c => c.id === editingComp.id ? editingComp : c));
    setEditingComp(null);
  };

  // --- Eliminación de Componente ---
  const borrarComponente = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este componente SMD del Boardview?')) {
      setComponentes(prev => prev.filter(c => c.id !== id));
      if (selectedCompId === id) {
        setSelectedCompId(null);
        setSelectedPadId(null);
      }
    }
  };

  // Formato para unidades en HUD
  const getSimboloUnidad = () => {
    if (activeScale === 'diodo') return 'V';
    if (activeScale === 'voltio') return 'V';
    if (activeScale === 'ua') return 'uA';
    if (activeScale === 'ohmio') return 'Ω';
    return '';
  };

  // --- Renderizado Inteligente de Textos SVG ---
  const renderTextosInteligentes = (comp) => {
    const pad1 = comp.pads.find(p => p.id === '1');
    const pad2 = comp.pads.find(p => p.id === '2');
    if (!pad1 || !pad2) return null;

    const xCenter = comp.x + comp.w / 2;
    const yCenter = comp.y + comp.h / 2;

    const monoStyle = {
      fontFamily: 'Consolas, monospace',
      fontSize: '9px',
      fontWeight: 'bold',
      fill: '#ffffff',
      userSelect: 'none',
      pointerEvents: 'none'
    };

    // Caso A: Alto > Ancho (Componente Vertical) -> APILACIÓN VERTICAL, caracteres horizontales
    if (comp.h > comp.w) {
      return (
        <g opacity={showComponentNames ? 1 : 0} style={{ transition: 'opacity 0.2s' }}>
          {/* Pin 1 arriba */}
          <text x={xCenter} y={comp.y + pad1.y_rel + pad1.h / 2 + 3} textAnchor="middle" style={{ ...monoStyle, fill: '#aaaaaa' }}>1</text>
          {/* Nombre en el centro */}
          <text x={xCenter} y={yCenter + 3} textAnchor="middle" style={{ ...monoStyle, fill: '#ffffff', fontSize: '9px' }}>{comp.nombre}</text>
          {/* Pin 2 abajo */}
          <text x={xCenter} y={comp.y + pad2.y_rel + pad2.h / 2 + 3} textAnchor="middle" style={{ ...monoStyle, fill: '#aaaaaa' }}>2</text>
        </g>
      );
    }

    // Caso B: Ancho >= Alto (Componente Horizontal o Cuadrado) -> ALINEADO HORIZONTAL
    return (
      <g opacity={showComponentNames ? 1 : 0} style={{ transition: 'opacity 0.2s' }}>
        {/* Pin 1 izquierda */}
        <text x={comp.x + pad1.x_rel + pad1.w / 2} y={yCenter + 3} textAnchor="middle" style={{ ...monoStyle, fill: '#aaaaaa' }}>1</text>
        {/* Nombre en el centro */}
        <text x={xCenter} y={yCenter + 3} textAnchor="middle" style={monoStyle}>{comp.nombre}</text>
        {/* Pin 2 derecha */}
        <text x={comp.x + pad2.x_rel + pad2.w / 2} y={yCenter + 3} textAnchor="middle" style={{ ...monoStyle, fill: '#aaaaaa' }}>2</text>
      </g>
    );
  };

  return (
    <div style={{ ...styles.container, ...(fullscreen ? { borderRadius: 0, border: 'none' } : {}) }}>
      {/* 1. BARRA DE HERRAMIENTAS SUPERIOR */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Map size={18} /> BOARDVIEW PRO (ZXW-STYLE)
          </span>

          <div style={styles.divider} />

          {/* Botones de Herramientas */}
          <div style={{ display: 'flex', background: '#111827', padding: '3px', borderRadius: '8px', border: '1px solid #374151' }}>
            <button 
              onClick={() => { setTool('select'); setDrawingStep(0); }} 
              style={{ ...styles.toolBtn, ...(tool === 'select' && styles.toolBtnActive) }}
              title="Puntero de selección"
            >
              Puntero
            </button>
            <button 
              onClick={() => { setTool('drawSMD'); setDrawingStep(0); }} 
              style={{ ...styles.toolBtn, ...(tool === 'drawSMD' && styles.toolBtnActive) }}
              title="Dibujar Componente SMD"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Componente:</span>
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
        </div>

        {/* Guardado en Firebase y Sincronización */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {ultimaSincronizacion && (
            <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} /> Sincronizado
            </span>
          )}
          {onGuardar && (
            <button 
              onClick={() => onGuardar(componentes)} 
              disabled={guardando}
              style={{
                ...styles.btn, 
                backgroundColor: cambiosPendientes ? '#d97706' : '#10b981',
                color: '#fff',
                boxShadow: cambiosPendientes ? '0 0 10px rgba(217,119,6,0.3)' : 'none'
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar en Nube'}
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

      {/* 2. BARRA DE CAPAS Y MATRIZ */}
      <div style={styles.layerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Control Capas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={styles.checkboxLabel} title="Ver u ocultar la imagen de PCB de fondo">
              <input 
                type="checkbox" 
                checked={showBgImage} 
                onChange={(e) => setShowBgImage(e.target.checked)} 
              />
              Fondo
            </label>

            {showBgImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Opacidad:</span>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  value={bgOpacity} 
                  onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                  style={{ width: '60px', accentColor: '#3b82f6' }}
                />
              </div>
            )}

            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={showHitbox} 
                onChange={(e) => setShowHitbox(e.target.checked)} 
              />
              Hitbox (Líneas)
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

          {/* Panel Matriz Flotante */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={styles.checkboxLabel} title="Habilita el nodo cyan para clonar componentes en cuadrícula">
              <input 
                type="checkbox" 
                checked={matrizActiva} 
                onChange={(e) => setMatrizActiva(e.target.checked)} 
              />
              <span style={{ color: matrizActiva ? '#00ffff' : '#aaa', fontWeight: 'bold' }}>Clonar en Matriz</span>
            </label>

            {matrizActiva && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.3s' }}>
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

        {/* Imagen de Referencia (Placa) — carga funcional */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ImageIcon size={13} /> Placa:
          </span>
          <button 
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={styles.imgBtn}
            title="Subir imagen de la placa desde tu dispositivo"
          >
            <Upload size={13} /> Subir
          </button>
          <button 
            onClick={pedirUrlImagen}
            style={styles.imgBtn}
            title="Ingresar URL de la imagen de la placa"
          >
            <Link size={13} /> URL
          </button>
          <button 
            onClick={() => setBgImageUrl(IMAGEN_PREDETERMINADA)}
            style={styles.imgBtn}
            title="Restaurar la imagen predeterminada de referencia"
          >
            <RotateCcw size={13} /> Predet.
          </button>
          {bgImageSize.w && (
            <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>
              {bgImageSize.w}×{bgImageSize.h}px
            </span>
          )}
          {/* Input de archivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={manejarArchivoImagen}
          />
        </div>
      </div>

      {/* 3. AREA CENTRAL: LIENZO SVG + SIDEBAR DETALLES */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: '500px' }}>
        
        {/* LIENZO SVG */}
        <div 
          ref={svgContainerRef}
          style={{ 
            ...styles.canvasContainer, 
            cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default' 
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setIsPanning(false); handlePadMouseLeave(); }}
          onContextMenu={(e) => e.preventDefault()} // deshabilitar menu contextual
        >
          {/* HUD de Medición del Multímetro en el Canvas */}
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
                {getSimboloUnidad()}
              </span>
            </div>
            {padActivo && (
              <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '4px' }}>
                Pad Objetivo: <strong style={{ color: '#00ffff' }}>{compActivo?.nombre} / Pin {padActivo.id}</strong>
              </div>
            )}
          </div>

          {/* Zoom Controls Overlay */}
          <div style={styles.zoomControls}>
            <button onClick={() => zoomCentro(1.25)} style={styles.zoomBtn} title="Acercar"><ZoomIn size={16} /></button>
            <button onClick={() => zoomCentro(1 / 1.25)} style={styles.zoomBtn} title="Alejar"><ZoomOut size={16} /></button>
            <button onClick={() => fitToView()} style={styles.zoomBtn} title="Ajustar imagen a la vista (centrada y proporcionada)"><Maximize2 size={15} /></button>
          </div>

          <svg
            id="svg-boardview"
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ display: 'block', backgroundColor: '#0d1117' }}
          >
            {/* Patrón de Cuadrícula de Fondo */}
            <defs>
              <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1f2937" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPattern)" />

            {/* Grupo con Transformaciones de Zoom y Paneo */}
            <g transform={`translate(${posicion.x}, ${posicion.y}) scale(${zoom})`}>
              
              {/* IMAGEN DE PCB DE FONDO (1:1 proporcional, tamaño natural) */}
              {showBgImage && bgImageUrl && (
                <g>
                  {/* Límite del área de la imagen (guía visual) */}
                  <rect
                    x="0"
                    y="0"
                    width={bgImageSize.w}
                    height={bgImageSize.h}
                    fill="none"
                    stroke="#4b5563"
                    strokeWidth="1"
                    strokeDasharray="8, 6"
                    opacity="0.6"
                    style={{ pointerEvents: 'none' }}
                  />
                  <image
                    href={bgImageUrl}
                    x="0"
                    y="0"
                    width={bgImageSize.w}
                    height={bgImageSize.h}
                    opacity={bgOpacity}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  />
                </g>
              )}

              {/* RENDERIZADO DE COMPONENTES SMD REALES */}
              {componentes.map((comp) => {
                const isSelected = selectedCompId === comp.id;
                
                return (
                  <g 
                    key={comp.id}
                    onDoubleClick={() => handleComponentDoubleClick(comp)}
                  >
                    {/* Hitbox / Rectángulo exterior blanco */}
                    {showHitbox && (
                      <rect
                        x={comp.x}
                        y={comp.y}
                        width={comp.w}
                        height={comp.h}
                        fill="transparent"
                        stroke={isSelected ? '#00ffff' : '#ffffff'}
                        strokeWidth={isSelected ? '2' : '1.5'}
                        strokeDasharray={isSelected ? '3, 3' : 'none'}
                        style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (tool === 'select') {
                            setSelectedCompId(comp.id);
                            setSelectedPadId('1'); // seleccionar pin 1 por defecto
                          }
                        }}
                      />
                    )}

                    {/* Pads Internos del Componente */}
                    {comp.pads.map((pad) => {
                      const padX = comp.x + pad.x_rel;
                      const padY = comp.y + pad.y_rel;
                      const isPadSelected = selectedCompId === comp.id && selectedPadId === pad.id;
                      
                      return (
                        <rect
                          key={pad.id}
                          x={padX}
                          y={padY}
                          width={pad.w}
                          height={pad.h}
                          rx="2"
                          ry="2"
                          fill={obtenerColorDePad(pad, comp.id)}
                          stroke={isPadSelected ? '#ffffff' : '#000000'}
                          strokeWidth={isPadSelected ? '1.5' : '0.5'}
                          style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (tool === 'select') {
                              setSelectedCompId(comp.id);
                              setSelectedPadId(pad.id);
                            }
                          }}
                          onMouseEnter={(e) => handlePadMouseEnter(e, comp, pad)}
                          onMouseMove={handlePadMouseMove}
                          onMouseLeave={handlePadMouseLeave}
                        />
                      );
                    })}

                    {/* Textos del Componente (Smart Alignment) */}
                    {renderTextosInteligentes(comp)}

                    {/* NODO DE EXTENSIÓN PARA CLONACIÓN EN MATRIZ (Sólo si está seleccionado y modo Matriz activo) */}
                    {isSelected && matrizActiva && (
                      <circle
                        className="interactive-handle"
                        cx={comp.x + comp.w}
                        cy={comp.y + comp.h / 2}
                        r="6"
                        fill="#00ffff"
                        stroke="#ffffff"
                        strokeWidth="1.5"
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

              {/* RENDERIZADO DE PREVISUALIZACIONES DE CLONES TEMPORALES (Matriz arrastrando) */}
              {isMatrixDragging && matrixClonesPreview.map((clone) => (
                <g key={clone.id} opacity="0.5" style={{ pointerEvents: 'none' }}>
                  {/* Contorno del clon */}
                  <rect
                    x={clone.x}
                    y={clone.y}
                    width={clone.w}
                    height={clone.h}
                    fill="transparent"
                    stroke="#00ffff"
                    strokeWidth="1"
                    strokeDasharray="4, 4"
                  />
                  {/* Pads del clon */}
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
                    />
                  ))}
                  {/* Nombre temporal */}
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

              {/* DIBUJO TEMPORAL (Durante herramienta de dibujo de componentes) */}
              {tool === 'drawSMD' && (
                <g style={{ pointerEvents: 'none' }}>
                  {/* Pad 1 Temporal */}
                  {pad1Temp && (
                    <rect
                      x={pad1Temp.x}
                      y={pad1Temp.y}
                      width={pad1Temp.w}
                      height={pad1Temp.h}
                      fill="rgba(212, 175, 55, 0.4)"
                      stroke="#d4af37"
                      strokeWidth="1"
                      strokeDasharray="2, 2"
                    />
                  )}
                  {/* Pad 2 Temporal (Espejo locked sizes) */}
                  {pad2Temp && (
                    <rect
                      x={pad2Temp.x}
                      y={pad2Temp.y}
                      width={pad2Temp.w}
                      height={pad2Temp.h}
                      fill="rgba(212, 175, 55, 0.4)"
                      stroke="#00ffff"
                      strokeWidth="1.2"
                      strokeDasharray="2, 2"
                    />
                  )}
                  {/* Caja delimitadora (Hitbox blanco proyectado) */}
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
                    />
                  )}
                </g>
              )}

            </g>
          </svg>

          {/* 4. TOOLTIP FLOTANTE (HOVER DE PADS) */}
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
                <div><strong>Footprint:</strong> {hoveredComp.pad.w}x{hoveredComp.pad.h} SMD</div>
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

          {/* Indicaciones para Dibujo */}
          {tool === 'drawSMD' && (
            <div style={styles.drawingBanner}>
              {drawingStep === 0 && '⚡ PASO 1: Mantén presionado y arrastra para dibujar el PAD 1'}
              {drawingStep === 1 && '📏 Ajustando dimensiones del Pad 1...'}
              {drawingStep === 2 && '📍 PASO 2: Mueve el mouse y haz clic para posicionar el PAD 2 (Espejo)'}
            </div>
          )}
        </div>

        {/* SIDEBAR DERECHO DE DETALLES Y EDICIÓN */}
        <div style={styles.sidebar}>
          <div>
            <h3 style={styles.sidebarTitle}>Detalles de Selección</h3>
            
            {compActivo && padActivo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Info General Componente */}
                <div style={styles.infoCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>{compActivo.nombre}</span>
                    <span style={styles.badge}>{compActivo.tipo}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
                    Dimensiones: {compActivo.w}x{compActivo.h} px
                  </div>
                  <button 
                    onClick={() => borrarComponente(compActivo.id)} 
                    style={{ ...styles.btn, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '8px', width: '100%', justifyContent: 'center' }}
                  >
                    <Trash2 size={14} /> Eliminar Componente
                  </button>
                </div>

                {/* Info del Pad Seleccionado */}
                <div style={styles.editSection}>
                  <h4 style={styles.sectionTitle}>Edición de Pin / Pad {padActivo.id}</h4>

                  {/* Asignación de Net Name (Línea) */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Net Name (Línea)</label>
                    <input 
                      type="text" 
                      list="netname-sugerencias"
                      value={padActivo.netName} 
                      onChange={(e) => actualizarPropiedadPad(padActivo.id, 'netName', e.target.value)}
                      style={styles.inputDark}
                    />
                    <datalist id="netname-sugerencias">
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

                  {/* Edición de Valores Sanos (Referencia) */}
                  <div style={{ marginTop: '10px' }}>
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

                  {/* Visualización de Medición Registrada */}
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
                Haz clic en un componente o pad para ver y editar sus propiedades de ingeniería inversa.
              </div>
            )}
          </div>

          {/* Tabla Resumen de Componentes */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #374151', paddingTop: '15px' }}>
            <h4 style={{ ...styles.sectionTitle, marginBottom: '8px' }}>Lista de Componentes ({componentes.length})</h4>
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

      {/* MODAL SOBREPUESTO PARA DOBLE CLIC (EDICIÓN AVANZADA) */}
      {editingComp && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} color="#60a5fa" /> Editar Componente SMD Avanzado
              </h3>
              <button onClick={() => setEditingComp(null)} style={styles.closeBtn}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                <div>
                  <label style={styles.label}>Nombre</label>
                  <input 
                    type="text" 
                    value={editingComp.nombre}
                    onChange={(e) => setEditingComp({ ...editingComp, nombre: e.target.value.trim() })}
                    style={styles.inputDark}
                  />
                </div>
                <div>
                  <label style={styles.label}>Tipo de SMD</label>
                  <select 
                    value={editingComp.tipo}
                    onChange={(e) => setEditingComp({ ...editingComp, tipo: e.target.value })}
                    style={styles.selectDark}
                  >
                    {TIPOS_COMPONENTE.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editar Pads */}
              {editingComp.pads.map((pad, idx) => (
                <div key={pad.id} style={styles.modalPadRow}>
                  <div style={{ fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px', fontSize: '0.8rem', borderBottom: '1px solid #2d3748', paddingBottom: '4px' }}>
                    PIN / PAD {pad.id} ({pad.tipo})
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <label style={styles.subLabel}>Net Name</label>
                      <input 
                        type="text" 
                        value={pad.netName}
                        onChange={(e) => {
                          const newPads = [...editingComp.pads];
                          newPads[idx].netName = e.target.value;
                          setEditingComp({ ...editingComp, pads: newPads });
                        }}
                        style={styles.inputDark}
                      />
                    </div>
                    <div>
                      <label style={styles.subLabel}>Tipo de Pad</label>
                      <select 
                        value={pad.tipo}
                        onChange={(e) => {
                          const newPads = [...editingComp.pads];
                          newPads[idx].tipo = e.target.value;
                          if (e.target.value === 'GND') {
                            newPads[idx].netName = 'GND';
                            newPads[idx].valorSanoDiodo = '0.000';
                            newPads[idx].valorSanoVoltio = '0.000';
                            newPads[idx].valorSanoUa = '0';
                            newPads[idx].valorSanoOhmio = '0';
                          }
                          setEditingComp({ ...editingComp, pads: newPads });
                        }}
                        style={styles.selectDark}
                      >
                        {TIPOS_LINEA.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <div>
                      <label style={styles.subLabel}>Sano Diodo</label>
                      <input 
                        type="text" 
                        value={pad.valorSanoDiodo}
                        onChange={(e) => {
                          const newPads = [...editingComp.pads];
                          newPads[idx].valorSanoDiodo = e.target.value;
                          setEditingComp({ ...editingComp, pads: newPads });
                        }}
                        style={styles.smallInput}
                      />
                    </div>
                    <div>
                      <label style={styles.subLabel}>Sano Volts</label>
                      <input 
                        type="text" 
                        value={pad.valorSanoVoltio}
                        onChange={(e) => {
                          const newPads = [...editingComp.pads];
                          newPads[idx].valorSanoVoltio = e.target.value;
                          setEditingComp({ ...editingComp, pads: newPads });
                        }}
                        style={styles.smallInput}
                      />
                    </div>
                    <div>
                      <label style={styles.subLabel}>Sano uA</label>
                      <input 
                        type="text" 
                        value={pad.valorSanoUa}
                        onChange={(e) => {
                          const newPads = [...editingComp.pads];
                          newPads[idx].valorSanoUa = e.target.value;
                          setEditingComp({ ...editingComp, pads: newPads });
                        }}
                        style={styles.smallInput}
                      />
                    </div>
                    <div>
                      <label style={styles.subLabel}>Sano Ohm</label>
                      <input 
                        type="text" 
                        value={pad.valorSanoOhmio}
                        onChange={(e) => {
                          const newPads = [...editingComp.pads];
                          newPads[idx].valorSanoOhmio = e.target.value;
                          setEditingComp({ ...editingComp, pads: newPads });
                        }}
                        style={styles.smallInput}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setEditingComp(null)} style={{ ...styles.btn, backgroundColor: '#374151', color: '#fff' }}>
                Cancelar
              </button>
              <button onClick={guardarEdicionModal} style={{ ...styles.btn, backgroundColor: '#10b981', color: '#fff' }}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ESTILOS EN JAVASCRIPT INLINE (Fondo Oscuro y Premium) ---
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
    padding: '10px 15px',
    backgroundColor: '#1f2937',
    borderBottom: '2px solid #374151',
    flexWrap: 'wrap',
    gap: '8px'
  },
  layerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 15px',
    backgroundColor: '#111827',
    borderBottom: '1.5px solid #1f2937',
    flexWrap: 'wrap',
    gap: '8px'
  },
  divider: {
    width: '1px',
    height: '24px',
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
    width: '40px',
    textAlign: 'center',
    fontSize: '0.75rem',
    outline: 'none'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: '#d1d5db',
    cursor: 'pointer',
    userSelect: 'none'
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
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #374151',
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    cursor: 'pointer',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    transition: 'all 0.15s',
    outline: 'none'
  },
  closeFullscreenBtn: {
    width: '34px',
    height: '34px',
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
    padding: '12px 16px',
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
    border: '1px solid #f59e0b'
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
    width: '300px',
    minWidth: '300px',
    borderLeft: '2px solid #374151',
    backgroundColor: '#1f2937',
    padding: '15px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    boxSizing: 'border-box'
  },
  sidebarTitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 10px 0',
    borderBottom: '1px solid #374151',
    paddingBottom: '5px'
  },
  infoCard: {
    backgroundColor: '#111827',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #374151'
  },
  badge: {
    fontSize: '0.65rem',
    fontWeight: 'bold',
    backgroundColor: '#1e3a8a',
    color: '#60a5fa',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  editSection: {
    backgroundColor: '#111827',
    padding: '12px',
    borderRadius: '8px',
    border: '1.5px solid #374151',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  sectionTitle: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#60a5fa',
    margin: '0 0 4px 0'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
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
    padding: '6px 10px',
    outline: 'none',
    fontSize: '0.8rem',
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
    padding: '10px',
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
    marginTop: '10px',
    borderTop: '1px dashed #374151',
    paddingTop: '10px'
  },
  gridRegistros: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    rowGap: '4px',
    fontSize: '0.75rem',
    color: '#9ca3af'
  },
  compListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '180px',
    overflowY: 'auto',
    border: '1px solid #374151',
    borderRadius: '6px',
    padding: '4px'
  },
  compListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'all 0.1s'
  },
  // Modal doble clic
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  modalContent: {
    backgroundColor: '#1f2937',
    border: '2px solid #4b5563',
    borderRadius: '12px',
    width: '480px',
    maxWidth: '90%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '12px 15px',
    backgroundColor: '#111827',
    borderBottom: '1px solid #374151',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '1.1rem',
    cursor: 'pointer',
    outline: 'none'
  },
  modalBody: {
    padding: '15px',
    overflowY: 'auto',
    maxHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  modalPadRow: {
    backgroundColor: '#111827',
    padding: '12px',
    borderRadius: '8px',
    border: '1.5px solid #374151',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  modalFooter: {
    padding: '12px 15px',
    backgroundColor: '#111827',
    borderTop: '1px solid #374151',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  }
};
