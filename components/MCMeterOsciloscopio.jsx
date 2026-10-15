import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Video,
  FileSpreadsheet,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Zap,
  Split,
  BookmarkPlus,
  Compass,
  Layers,
  X
} from 'lucide-react';

function calcularEscalaTipoTester(valores, canal = 'vbus', modoDinamico = true) {
  if (!valores || valores.length === 0) {
    return canal === 'vbus' ? [0.0, 5.4] : [0.0, 0.3];
  }

  let vmin = valores[0];
  let vmax = valores[0];
  for (let i = 1; i < valores.length; i++) {
    if (valores[i] < vmin) vmin = valores[i];
    if (valores[i] > vmax) vmax = valores[i];
  }

  if (!modoDinamico) {
    const tope = Math.max(0.3, Math.ceil(vmax * 10.0) / 10.0 + 0.1);
    return [0.0, tope];
  }

  const span = vmax - vmin;
  const pasosValidos = [0.02, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0, 10.0];
  let paso = 0.1;
  for (const p of pasosValidos) {
    if (p * 2.4 >= span) {
      paso = p;
      break;
    }
  }

  const ventanaTotal = paso * 3.0;

  let piso, techo;
  if (canal === 'vbus') {
    techo = Math.ceil((vmax + paso * 0.15) / paso) * paso;
    piso = techo - ventanaTotal;
    if (piso < 0.0) {
      piso = 0.0;
      techo = ventanaTotal;
    }
  } else {
    piso = Math.floor((vmin - paso * 0.15) / paso) * paso;
    if (piso < 0.0) piso = 0.0;
    techo = piso + ventanaTotal;
    if (techo < vmax + paso * 0.1) {
      techo = Math.ceil((vmax + paso * 0.1) / paso) * paso;
      piso = Math.max(0.0, techo - ventanaTotal);
    }
  }

  return [parseFloat(piso.toFixed(3)), parseFloat(techo.toFixed(3))];
}

export default function MCMeterOsciloscopio({
  mcMeter,
  onCerrarYVolverMini,
  modoAvanzado,
  setModoAvanzado,
  modeloActivo,
  onGuardarCurvaGolden
}) {
  const {
    conectado,
    sps,
    vbus,
    ibus,
    watts,
    peakIbus,
    dp,
    dm,
    cc1,
    cc2,
    pausado,
    autoTriggerArmed,
    historyBufferRef,
    pausedSnapshotRef,
    togglePausa,
    limpiarHistorial,
    toggleAutoTrigger
  } = mcMeter;

  // 1. Perfil de Medición Especializado
  // 'power': Secuencias de encendido (solo corriente IBUS a alta resolución temporal, t=0 al pulsar power)
  // 'carga': Carga y negociación USB-C (Dual VBUS + IBUS + Pines D/CC)
  // 'buck': Líneas Buck / Backlight / Consumos en placa
  const [perfilMedicion, setPerfilMedicion] = useState('power');

  // 2. Curva Golden de Referencia (Comparador Equipo Bueno vs. Equipo en Falla)
  const [curvaGoldenSeleccionada, setCurvaGoldenSeleccionada] = useState(null);
  const [modalGuardarGolden, setModalGuardarGolden] = useState(false);
  const [formTituloGolden, setFormTituloGolden] = useState('');
  const [formNotasGolden, setFormNotasGolden] = useState('');

  // Estados visuales y de interacción
  const [splitTracks, setSplitTracks] = useState(false);
  const [escalaDinamica, setEscalaDinamica] = useState(true);
  const [zoomSamples, setZoomSamples] = useState(400);
  const [viewEndIdx, setViewEndIdx] = useState(0);

  // Canales visibles (se auto-ajustan según perfil de medición)
  const [showVbus, setShowVbus] = useState(perfilMedicion === 'carga');
  const [showIbus, setShowIbus] = useState(true);
  const [showDp, setShowDp] = useState(false);
  const [showDm, setShowDm] = useState(false);
  const [showCc, setShowCc] = useState(false);

  // Auto-ajuste de canales al cambiar de perfil
  useEffect(() => {
    if (perfilMedicion === 'power' || perfilMedicion === 'buck') {
      setShowVbus(false);
      setShowDp(false);
      setShowDm(false);
      setShowCc(false);
      setShowIbus(true);
      setSplitTracks(false);
    } else {
      setShowVbus(true);
      setShowIbus(true);
    }
  }, [perfilMedicion]);

  // Box-Zoom y Cursores Delta A-B
  const [markerAIdx, setMarkerAIdx] = useState(null);
  const [markerBIdx, setMarkerBIdx] = useState(null);
  const [customVRange, setCustomVRange] = useState(null);
  const [customIRange, setCustomIRange] = useState(null);

  // Grabación de video nativa WebM
  const [grabandoVideo, setGrabandoVideo] = useState(false);
  const [tiempoRestanteVideo, setTiempoRestanteVideo] = useState(null);
  const [tiempoTranscurridoVideo, setTiempoTranscurridoVideo] = useState(0);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const videoTimerRef = useRef(null);

  // Referencias Canvas e interacción del ratón
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const scaleBoundsRef = useRef(null);

  const hoverPosRef = useRef({ x: null, y: null });
  const boxSelectionRef = useRef({
    dragging: false,
    startX: null,
    startY: null,
    currX: null,
    currY: null
  });

  // Al pausar, posicionar el cursor de tiempo al final
  useEffect(() => {
    if (pausado) {
      const snap = pausedSnapshotRef.current || [];
      setViewEndIdx(snap.length);
    } else {
      setMarkerAIdx(null);
      setMarkerBIdx(null);
      setCustomVRange(null);
      setCustomIRange(null);
    }
  }, [pausado, pausedSnapshotRef]);

  // Formateadores numéricos
  const fmtVbus = (val) => {
    const s = val.toFixed(6).split('.');
    if (modoAvanzado) {
      return `${s[0]}.${s[1].slice(0, 3)} ${s[1].slice(3)}V`;
    }
    return `${val.toFixed(3)}V`;
  };

  const fmtIbus = (val) => {
    const s = val.toFixed(6).split('.');
    if (modoAvanzado) {
      return `${s[0]}.${s[1].slice(0, 3)} ${s[1].slice(3)}A`;
    }
    return `${val.toFixed(3)}A`;
  };

  const fmtWatts = (val) => {
    const s = val.toFixed(5).split('.');
    if (modoAvanzado) {
      return `${s[0]}.${s[1].slice(0, 3)} ${s[1].slice(3)}W`;
    }
    return `${val.toFixed(3)}W`;
  };

  const fmtPin = (val) => (modoAvanzado ? `${val.toFixed(3)}V` : `${val.toFixed(2)}V`);

  // Extraer ventana activa de datos del buffer
  const obtenerVentanaDatos = useCallback(() => {
    const data = pausado
      ? pausedSnapshotRef.current || []
      : historyBufferRef.current.toArray();
    const total = data.length;
    if (total === 0) return { ventana: [], startIdx: 0, total: 0 };

    const end = pausado ? Math.max(1, Math.min(total, viewEndIdx || total)) : total;
    const start = Math.max(0, end - zoomSamples);
    return {
      ventana: data.slice(start, end),
      startIdx: start,
      total
    };
  }, [pausado, pausedSnapshotRef, historyBufferRef, viewEndIdx, zoomSamples]);

  // Conversión de píxel X a índice global en el buffer
  const pixelXToGlobalIdx = useCallback(
    (pixelX) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const padL = 76;
      const padR = 80;
      const plotW = canvas.width - padL - padR;
      if (pixelX < padL || pixelX > canvas.width - padR) return null;

      const { ventana, startIdx } = obtenerVentanaDatos();
      if (ventana.length < 2) return null;

      const frac = (pixelX - padL) / plotW;
      const localIdx = Math.max(0, Math.min(ventana.length - 1, Math.round(frac * (ventana.length - 1))));
      return startIdx + localIdx;
    },
    [obtenerVentanaDatos]
  );

  // Reset Zoom
  const resetearZoom = useCallback(() => {
    setZoomSamples(400);
    setCustomVRange(null);
    setCustomIRange(null);
    if (pausado) {
      const snap = pausedSnapshotRef.current || [];
      setViewEndIdx(snap.length);
    }
  }, [pausado, pausedSnapshotRef]);

  // Ajustar Zoom (+ / -)
  const ajustarZoom = useCallback((factor) => {
    setZoomSamples((prev) => Math.max(15, Math.min(20000, Math.round(prev * factor))));
  }, []);

  // Aplicar Box-Zoom al soltar el ratón
  const aplicarBoxZoom = useCallback(
    (x1, y1, x2, y2) => {
      if (!pausado) {
        togglePausa();
      }

      const { ventana, startIdx } = obtenerVentanaDatos();
      const n = ventana.length;
      const b = scaleBoundsRef.current;
      if (n < 4 || !b) return;

      const { padL, padT, plotW, plotH, minV, maxV, minI, maxI } = b;
      const xa = Math.max(padL, Math.min(padL + plotW, Math.min(x1, x2)));
      const xb = Math.max(padL, Math.min(padL + plotW, Math.max(x1, x2)));
      const ya = Math.max(padT, Math.min(padT + plotH, Math.min(y1, y2)));
      const yb = Math.max(padT, Math.min(padT + plotH, Math.max(y1, y2)));

      if (xb - xa < 8 || yb - ya < 8) return;

      // 1. Zoom en Tiempo (X)
      const fX1 = (xa - padL) / plotW;
      const fX2 = (xb - padL) / plotW;
      const newStart = startIdx + Math.round(fX1 * (n - 1));
      const newEnd = startIdx + Math.round(fX2 * (n - 1));

      if (newEnd - newStart >= 6) {
        setZoomSamples(newEnd - newStart);
        setViewEndIdx(newEnd);
      }

      // 2. Zoom en Voltaje / Corriente (Y)
      if (!splitTracks) {
        const fracTop = 1.0 - (ya - padT) / plotH;
        const fracBot = 1.0 - (yb - padT) / plotH;
        const spanV = maxV - minV;
        const spanI = maxI - minI;
        setCustomVRange([
          parseFloat((minV + fracBot * spanV).toFixed(4)),
          parseFloat((minV + fracTop * spanV).toFixed(4))
        ]);
        setCustomIRange([
          parseFloat((minI + fracBot * spanI).toFixed(4)),
          parseFloat((minI + fracTop * spanI).toFixed(4))
        ]);
      } else {
        const midY = padT + Math.floor(plotH / 2);
        const topH = Math.floor(plotH / 2) - 8;
        const botTop = midY + 8;
        const botH = padT + plotH - botTop;

        if (yb <= midY + 6 && topH > 10) {
          const ft = 1.0 - (Math.max(padT, ya) - padT) / topH;
          const fb = 1.0 - (Math.min(padT + topH, yb) - padT) / topH;
          const sv = maxV - minV;
          setCustomVRange([
            parseFloat((minV + fb * sv).toFixed(4)),
            parseFloat((minV + ft * sv).toFixed(4))
          ]);
        } else if (ya >= midY - 6 && botH > 10) {
          const ft = 1.0 - (Math.max(botTop, ya) - botTop) / botH;
          const fb = 1.0 - (Math.min(botTop + botH, yb) - botTop) / botH;
          const si = maxI - minI;
          setCustomIRange([
            parseFloat((minI + fb * si).toFixed(4)),
            parseFloat((minI + ft * si).toFixed(4))
          ]);
        }
      }
    },
    [pausado, togglePausa, obtenerVentanaDatos, splitTracks]
  );

  // Manejadores del Ratón en el Canvas
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
      const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
      boxSelectionRef.current = {
        dragging: true,
        startX: x,
        startY: y,
        currX: x,
        currY: y
      };
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    hoverPosRef.current = { x, y };

    if (boxSelectionRef.current.dragging) {
      boxSelectionRef.current.currX = x;
      boxSelectionRef.current.currY = y;
    }
  };

  const handleMouseUp = (e) => {
    if (e.button === 0 && boxSelectionRef.current.dragging) {
      const { startX, startY } = boxSelectionRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const endX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
      const endY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

      boxSelectionRef.current.dragging = false;

      const dx = Math.abs(endX - startX);
      const dy = Math.abs(endY - startY);

      if (dx > 10 && dy > 10) {
        aplicarBoxZoom(startX, startY, endX, endY);
      } else {
        const idx = pixelXToGlobalIdx(endX);
        if (idx !== null) {
          setMarkerAIdx(idx);
        }
      }
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const idx = pixelXToGlobalIdx(x);
    if (idx !== null) {
      setMarkerBIdx(idx);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.75 : 1.35;
    ajustarZoom(factor);
  };

  // Cálculo de información Delta (A - B)
  const calcularInfoDelta = () => {
    const data = pausado
      ? pausedSnapshotRef.current || []
      : historyBufferRef.current.toArray();

    if (markerAIdx !== null && markerBIdx !== null) {
      const i1 = Math.min(markerAIdx, markerBIdx);
      const i2 = Math.max(markerAIdx, markerBIdx);
      if (i1 >= 0 && i2 < data.length && i2 > i1) {
        const dtMs = (data[i2][0] - data[i1][0]) * 1000.0;
        const tramo = data.slice(i1, i2 + 1);
        const avgI = tramo.reduce((acc, pt) => acc + pt[2], 0) / tramo.length;
        const maxI = Math.max(...tramo.map((pt) => pt[2]));
        return `📏 Δt: ${dtMs.toFixed(1)} ms | I_prom: ${(avgI * 1000).toFixed(1)} mA | I_pico: ${maxI.toFixed(3)} A`;
      }
    }
    return '📏 Delta (A-B): Clic Izq = Marca A | Clic Der = Marca B';
  };

  // Bucle Principal de Renderizado Canvas (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Limpiar fondo oscuro del instrumento
      ctx.fillStyle = '#04070d';
      ctx.fillRect(0, 0, w, h);

      const padL = 76;
      const padR = 80;
      const padT = 24;
      const padB = 34;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, padT, plotW, plotH);

      const { ventana, startIdx } = obtenerVentanaDatos();
      const n = ventana.length;

      let vVals = n > 0 ? ventana.map((pt) => pt[1]) : [0.0, 5.0];
      let iVals = n > 0 ? ventana.map((pt) => pt[2]) : [0.0, 0.3];

      let [minV, maxV] = customVRange
        ? customVRange
        : calcularEscalaTipoTester(vVals, 'vbus', escalaDinamica);
      let [minI, maxI] = customIRange
        ? customIRange
        : calcularEscalaTipoTester(iVals, 'ibus', escalaDinamica);

      const spanV = Math.max(1e-6, maxV - minV);
      const spanI = Math.max(1e-6, maxI - minI);

      scaleBoundsRef.current = {
        padL,
        padR,
        padT,
        padB,
        plotW,
        plotH,
        minV,
        maxV,
        minI,
        maxI
      };

      // 2. Geometría de carriles
      let vTop, vBot, iTop, iBot;
      if (!splitTracks || perfilMedicion === 'power') {
        vTop = padT;
        vBot = h - padB;
        iTop = padT;
        iBot = h - padB;

        const divisiones = 3;
        ctx.font = 'bold 10px Consolas, monospace';
        for (let step = 0; step <= divisiones; step++) {
          const frac = step / divisiones;
          const y = vBot - frac * plotH;
          ctx.strokeStyle = '#16253f';
          ctx.beginPath();
          ctx.moveTo(padL, y);
          ctx.lineTo(w - padR, y);
          ctx.stroke();

          // En modo power solo mostramos escala de corriente
          if (showVbus) {
            ctx.fillStyle = '#ff4444';
            ctx.textAlign = 'right';
            ctx.fillText((minV + frac * spanV).toFixed(2), padL - 8, y + 4);
          }

          ctx.fillStyle = '#facc15';
          ctx.textAlign = showVbus ? 'left' : 'right';
          const xText = showVbus ? w - padR + 8 : padL - 8;
          ctx.fillText(`${(minI + frac * spanI).toFixed(3)}A`, xText, y + 4);
        }
      } else {
        const midY = padT + Math.floor(plotH / 2);
        vTop = padT;
        vBot = midY - 8;
        iTop = midY + 8;
        iBot = h - padB;
        const vH = Math.max(10, vBot - vTop);
        const iH = Math.max(10, iBot - iTop);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padL, midY);
        ctx.lineTo(w - padR, midY);
        ctx.stroke();

        ctx.font = 'bold 9px Consolas, monospace';
        for (let step = 0; step < 3; step++) {
          const frac = step / 2.0;
          const yv = vBot - frac * vH;
          const yi = iBot - frac * iH;

          ctx.strokeStyle = '#16253f';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(padL, yv);
          ctx.lineTo(w - padR, yv);
          ctx.moveTo(padL, yi);
          ctx.lineTo(w - padR, yi);
          ctx.stroke();

          ctx.fillStyle = '#ff4444';
          ctx.textAlign = 'right';
          ctx.fillText(`${(minV + frac * spanV).toFixed(2)}V`, padL - 8, yv + 3);

          ctx.fillStyle = '#facc15';
          ctx.textAlign = 'left';
          ctx.fillText(`${(minI + frac * spanI).toFixed(2)}A`, w - padR + 8, yi + 3);
        }
      }

      // Encabezados de ejes
      ctx.font = 'bold 8px Consolas, monospace';
      if (showVbus) {
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'right';
        ctx.fillText('━ VBUS (V)', padL - 8, padT - 10);
      }
      ctx.fillStyle = '#facc15';
      ctx.textAlign = showVbus ? 'left' : 'right';
      ctx.fillText(perfilMedicion === 'power' ? '━ CORRIENTE ARRANQUE (A)' : '━ IBUS (A)', showVbus ? w - padR + 8 : padL - 8, padT - 10);

      // 3. CAPA DE FONDO: CURVA GOLDEN DE REFERENCIA (CIAN OPACO 38%)
      if (curvaGoldenSeleccionada && curvaGoldenSeleccionada.curvaPuntos?.length >= 2) {
        const gPts = curvaGoldenSeleccionada.curvaPuntos;
        const nG = gPts.length;
        const iTrackH = iBot - iTop;

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.40)';
        ctx.lineWidth = 2.8;
        ctx.lineJoin = 'round';
        ctx.setLineDash([4, 2]);
        ctx.beginPath();

        for (let idx = 0; idx < nG; idx++) {
          const x = padL + (idx / (nG - 1)) * plotW;
          const valG = gPts[idx];
          const yG = Math.max(iTop, Math.min(iBot, iBot - ((valG - minI) / spanI) * iTrackH));
          if (idx === 0) ctx.moveTo(x, yG);
          else ctx.lineTo(x, yG);
        }
        ctx.stroke();
        ctx.restore();

        // Insignia Golden en la esquina superior
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 10px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`★ GOLDEN REFERENCIA: ${curvaGoldenSeleccionada.titulo} (Fondo Cian Opaco)`, padL + 12, padT + 18);
      }

      if (n < 2) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(perfilMedicion === 'power' ? '⚡ Esperando pulso de arranque (>15mA)...' : 'Esperando lecturas en vivo...', w / 2, h / 2);
      } else {
        const tIni = ventana[0][0];
        const tFin = ventana[n - 1][0];
        const duracion = Math.max(0.001, tFin - tIni);

        // Rejilla vertical de tiempo
        const colsTiempo = 6;
        ctx.font = 'bold 9px Consolas, monospace';
        ctx.textAlign = 'center';
        for (let step = 0; step <= colsTiempo; step++) {
          const frac = step / colsTiempo;
          const x = padL + frac * plotW;
          ctx.strokeStyle = '#16253f';
          ctx.beginPath();
          ctx.moveTo(x, padT);
          ctx.lineTo(x, h - padB);
          ctx.stroke();

          const tRelBack = (1.0 - frac) * duracion;
          const etiquetaT = step === colsTiempo ? '0s' : `-${tRelBack.toFixed(2)}s`;
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(etiquetaT, x, h - padB + 14);
        }

        const vTrackH = vBot - vTop;
        const iTrackH = iBot - iTop;

        const renderizarLinea = (puntos, color, ancho) => {
          if (puntos.length < 2) return;
          ctx.strokeStyle = color;
          ctx.lineWidth = ancho;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let i = 0; i < puntos.length; i++) {
            if (i === 0) ctx.moveTo(puntos[i].x, puntos[i].y);
            else ctx.lineTo(puntos[i].x, puntos[i].y);
          }
          ctx.stroke();
        };

        const ptsV = [];
        const ptsI = [];
        const ptsDp = [];
        const ptsDm = [];
        const ptsCc = [];

        for (let idx = 0; idx < n; idx++) {
          const pt = ventana[idx];
          const x = padL + (idx / (n - 1)) * plotW;
          const yv = Math.max(vTop, Math.min(vBot, vBot - ((pt[1] - minV) / spanV) * vTrackH));
          const yi = Math.max(iTop, Math.min(iBot, iBot - ((pt[2] - minI) / spanI) * iTrackH));

          ptsV.push({ x, y: yv });
          ptsI.push({ x, y: yi });

          if (showDp) ptsDp.push({ x, y: h - padB - (pt[3] / 4.0) * plotH });
          if (showDm) ptsDm.push({ x, y: h - padB - (pt[4] / 4.0) * plotH });
          if (showCc) ptsCc.push({ x, y: h - padB - (Math.max(pt[5], pt[6]) / 4.0) * plotH });
        }

        if (showDp) renderizarLinea(ptsDp, '#10b981', 1.5);
        if (showDm) renderizarLinea(ptsDm, '#38bdf8', 1.5);
        if (showCc) renderizarLinea(ptsCc, '#c084fc', 1.5);
        if (showVbus) renderizarLinea(ptsV, '#ff3b3b', 2.2);

        // Curva en vivo de corriente en amarillo neón brillante
        if (showIbus) renderizarLinea(ptsI, '#facc15', 2.6);

        // Marcas Delta A y B
        const dibujarMarca = (mIdx, color, nombre) => {
          if (mIdx !== null && mIdx >= startIdx && mIdx < startIdx + n) {
            const localI = mIdx - startIdx;
            const mx = padL + (localI / (n - 1)) * plotW;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.moveTo(mx, padT);
            ctx.lineTo(mx, h - padB);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = color;
            ctx.font = 'bold 9px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`[${nombre}]`, mx, padT - 6);
          }
        };

        dibujarMarca(markerAIdx, '#22d3ee', 'A');
        dibujarMarca(markerBIdx, '#e879f9', 'B');

        // Rectángulo de selección Box-Zoom activo
        const box = boxSelectionRef.current;
        if (box.dragging && box.startX !== null && box.currX !== null) {
          const rx = Math.min(box.startX, box.currX);
          const ry = Math.min(box.startY, box.currY);
          const rw = Math.abs(box.currX - box.startX);
          const rh = Math.abs(box.currY - box.startY);
          if (rw > 6 && rh > 6) {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 1.8;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(rx, ry, rw, rh);
            ctx.setLineDash([]);
          }
        }

        // Tooltip Dual / Comparativo al pasar el puntero
        const hover = hoverPosRef.current;
        if (hover.x !== null && hover.x >= padL && hover.x <= w - padR) {
          const fracX = (hover.x - padL) / plotW;
          const idxH = Math.max(0, Math.min(n - 1, Math.round(fracX * (n - 1))));
          const ptH = ventana[idxH];

          const cx = padL + (idxH / (n - 1)) * plotW;
          const cyV = Math.max(vTop, Math.min(vBot, vBot - ((ptH[1] - minV) / spanV) * vTrackH));
          const cyI = Math.max(iTop, Math.min(iBot, iBot - ((ptH[2] - minI) / spanI) * iTrackH));

          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(cx, padT);
          ctx.lineTo(cx, h - padB);
          ctx.stroke();
          ctx.setLineDash([]);

          if (showVbus) {
            ctx.fillStyle = '#ff3b3b';
            ctx.beginPath();
            ctx.arc(cx, cyV, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          if (showIbus) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(cx, cyI, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          const [tS, vS, iS, dpS, dmS, cc1S, cc2S] = ptH;
          const pwrS = vS * iS;
          const tBackCursor = tFin - tS;

          // Datos Golden en este punto X si existe curva activa
          let valGoldenAtX = null;
          if (curvaGoldenSeleccionada && curvaGoldenSeleccionada.curvaPuntos?.length > 0) {
            const gIdx = Math.min(curvaGoldenSeleccionada.curvaPuntos.length - 1, Math.round(fracX * (curvaGoldenSeleccionada.curvaPuntos.length - 1)));
            valGoldenAtX = curvaGoldenSeleccionada.curvaPuntos[gIdx];
          }

          const boxW = 240;
          const boxH = valGoldenAtX !== null ? 105 : (showVbus ? 92 : 65);
          let tx = cx + 14 + boxW < w - padR ? cx + 14 : cx - boxW - 14;
          let ty = Math.max(padT + 6, Math.min(h - padB - boxH - 6, (hover.y || h / 2) - boxH / 2));

          ctx.fillStyle = 'rgba(11, 19, 36, 0.95)';
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.2;
          ctx.fillRect(tx, ty, boxW, boxH);
          ctx.strokeRect(tx, ty, boxW, boxH);

          ctx.textAlign = 'left';
          ctx.font = 'bold 8px Consolas, monospace';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(`⏱ t = -${tBackCursor.toFixed(3)}s (${tS.toFixed(2)}s)`, tx + 8, ty + 14);

          ctx.font = 'bold 9px Consolas, monospace';
          if (showVbus) {
            ctx.fillStyle = '#ff4444';
            ctx.fillText(`🔴 VBUS: ${fmtVbus(vS)}`, tx + 8, ty + 30);
          }

          ctx.fillStyle = '#facc15';
          const yPosIbus = showVbus ? ty + 46 : ty + 30;
          ctx.fillText(`🟡 EN VIVO (I): ${fmtIbus(iS)} (${(iS * 1000).toFixed(0)}mA)`, tx + 8, yPosIbus);

          if (valGoldenAtX !== null) {
            const diffA = iS - valGoldenAtX;
            ctx.fillStyle = '#00e5ff';
            ctx.fillText(`★ GOLDEN (I) : ${valGoldenAtX.toFixed(3)}A (${(valGoldenAtX * 1000).toFixed(0)}mA)`, tx + 8, yPosIbus + 16);
            ctx.fillStyle = Math.abs(diffA) > 0.1 ? '#ef4444' : '#10b981';
            ctx.fillText(`Δ DIFERENCIA : ${diffA >= 0 ? '+' : ''}${(diffA * 1000).toFixed(0)} mA`, tx + 8, yPosIbus + 32);
          } else if (showVbus) {
            ctx.font = 'bold 8px Consolas, monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText(`🔵 PWR: ${fmtWatts(pwrS)} | D+:${dpS.toFixed(2)}V CC:${Math.max(cc1S, cc2S).toFixed(2)}V`, tx + 8, ty + 64);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [
    obtenerVentanaDatos,
    customVRange,
    customIRange,
    escalaDinamica,
    splitTracks,
    showVbus,
    showIbus,
    showDp,
    showDm,
    showCc,
    markerAIdx,
    markerBIdx,
    modoAvanzado,
    perfilMedicion,
    curvaGoldenSeleccionada
  ]);

  // Exportar Captura PNG 100% en el Navegador
  const guardarCapturaPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Marshall_Oscilograma_${perfilMedicion.toUpperCase()}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Grabación de Video 100% en el Navegador con MediaRecorder
  const iniciarGrabacionVideo = (segundosLimite = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (grabandoVideo) {
      detenerGrabacionVideo();
      return;
    }

    try {
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });

      videoChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Marshall_Video_${perfilMedicion.toUpperCase()}_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setGrabandoVideo(false);
        setTiempoRestanteVideo(null);
        setTiempoTranscurridoVideo(0);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setGrabandoVideo(true);

      const startTime = performance.now();
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);

      videoTimerRef.current = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000.0;
        setTiempoTranscurridoVideo(elapsed);

        if (segundosLimite !== null) {
          const rest = Math.max(0, segundosLimite - elapsed);
          setTiempoRestanteVideo(rest);
          if (elapsed >= segundosLimite) {
            detenerGrabacionVideo();
          }
        }
      }, 100);
    } catch (err) {
      alert(`No se pudo iniciar la grabación de video: ${err.message || err}`);
      setGrabandoVideo(false);
    }
  };

  const detenerGrabacionVideo = () => {
    if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Exportar Archivo CSV
  const exportarCSV = () => {
    const data = pausado
      ? pausedSnapshotRef.current || []
      : historyBufferRef.current.toArray();

    if (data.length === 0) {
      alert('No hay datos en memoria para exportar.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,tiempo_s,vbus_v,ibus_a,watts_w,dp_v,dm_v,cc1_v,cc2_v\n';
    data.forEach((row) => {
      const t = row[0].toFixed(4);
      const v = row[1].toFixed(6);
      const i = row[2].toFixed(6);
      const w = (row[1] * row[2]).toFixed(5);
      const dpV = row[3].toFixed(4);
      const dmV = row[4].toFixed(4);
      const cc1V = row[5].toFixed(4);
      const cc2V = row[6].toFixed(4);
      csvContent += `${t},${v},${i},${w},${dpV},${dmV},${cc1V},${cc2V}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Marshall_MCMeter_${perfilMedicion.toUpperCase()}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Guardar Curva de Referencia Golden
  const handleGuardarCurvaGolden = () => {
    const { ventana } = obtenerVentanaDatos();
    if (ventana.length < 10) {
      alert('No hay suficientes muestras en pantalla para capturar una curva de referencia.');
      return;
    }

    // Downsample a 250 puntos para optimizar almacenamiento en Firestore
    const targetPoints = 250;
    const step = Math.max(1, Math.floor(ventana.length / targetPoints));
    const puntosDownsampled = [];
    for (let i = 0; i < ventana.length; i += step) {
      puntosDownsampled.push(parseFloat(ventana[i][2].toFixed(4)));
    }

    const tIni = ventana[0][0];
    const tFin = ventana[ventana.length - 1][0];
    const durMs = Math.round((tFin - tIni) * 1000);
    const maxA = Math.max(...ventana.map((pt) => pt[2]));
    const avgA = ventana.reduce((acc, pt) => acc + pt[2], 0) / ventana.length;

    const nuevaCurva = {
      id: `golden_${Date.now()}`,
      titulo: formTituloGolden || `Secuencia ${perfilMedicion.toUpperCase()} (${new Date().toLocaleDateString()})`,
      perfil: perfilMedicion,
      fecha: new Date().toISOString(),
      duracionMs: durMs,
      picoMaxA: parseFloat(maxA.toFixed(4)),
      iPromedioA: parseFloat(avgA.toFixed(4)),
      notas: formNotasGolden || '',
      curvaPuntos: puntosDownsampled
    };

    if (onGuardarCurvaGolden) {
      onGuardarCurvaGolden(nuevaCurva);
    }

    setCurvaGoldenSeleccionada(nuevaCurva);
    setModalGuardarGolden(false);
    setFormTituloGolden('');
    setFormNotasGolden('');
    alert(`¡Curva de referencia "${nuevaCurva.titulo}" guardada para ${modeloActivo?.nombre || 'el modelo'}!`);
  };

  const snapTotal = pausado
    ? (pausedSnapshotRef.current || []).length
    : historyBufferRef.current.size;

  const curvasDisponibles = modeloActivo?.oscilogramasReferencia || [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#060a12',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Consolas, monospace',
        userSelect: 'none'
      }}
    >
      {/* 1. BARRA SUPERIOR: TELEMETRÍA, SELECTOR DE PERFILES Y EXPORTACIÓN */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          padding: '8px 16px',
          borderBottom: '1px solid #1e293b',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Botón Volver al Mini-HUD (Exclusión Mutua) */}
          <button
            onClick={onCerrarYVolverMini}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              color: '#00e5ff',
              border: '1px solid #00e5ff',
              borderRadius: '6px',
              padding: '6px 12px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Minimize2 size={15} /> 🗕 Mini-HUD
          </button>

          {/* SELECTOR DE PERFIL DE ANÁLISIS */}
          <div style={{ display: 'flex', backgroundColor: '#070b12', padding: '3px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <button
              onClick={() => setPerfilMedicion('power')}
              style={{
                backgroundColor: perfilMedicion === 'power' ? '#eab308' : 'transparent',
                color: perfilMedicion === 'power' ? '#000000' : '#cbd5e1',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🚀 Power (1s / Arranque)
            </button>
            <button
              onClick={() => setPerfilMedicion('carga')}
              style={{
                backgroundColor: perfilMedicion === 'carga' ? '#0284c7' : 'transparent',
                color: perfilMedicion === 'carga' ? '#ffffff' : '#cbd5e1',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ⚡ Carga USB-C
            </button>
            <button
              onClick={() => setPerfilMedicion('buck')}
              style={{
                backgroundColor: perfilMedicion === 'buck' ? '#8b5cf6' : 'transparent',
                color: perfilMedicion === 'buck' ? '#ffffff' : '#cbd5e1',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              💡 Buck / Backlight
            </button>
          </div>

          {/* Lecturas Vivas */}
          {showVbus && (
            <span style={{ color: '#ff4444', fontWeight: 800, fontSize: '1rem' }}>
              VBUS: {fmtVbus(vbus)}
            </span>
          )}
          <span style={{ color: '#facc15', fontWeight: 800, fontSize: '1.05rem' }}>
            IBUS: {fmtIbus(ibus)} ({(ibus * 1000).toFixed(0)}mA)
          </span>
          <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem' }}>
            PICO: {peakIbus.toFixed(3)}A
          </span>
          <span
            style={{
              backgroundColor: '#172554',
              color: '#fbbf24',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '0.75rem'
            }}
          >
            {sps}
          </span>
        </div>

        {/* Botones de Captura PNG, Video WebM y CSV */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {grabandoVideo && (
            <span
              style={{
                color: '#ef4444',
                fontWeight: 800,
                fontSize: '0.85rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ef4444'
              }}
            >
              🔴 {tiempoRestanteVideo !== null ? `REC: ${tiempoRestanteVideo.toFixed(1)}s` : `REC LIBRE: ${tiempoTranscurridoVideo.toFixed(1)}s`}
            </span>
          )}

          <button
            onClick={() => setModalGuardarGolden(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            <BookmarkPlus size={14} /> 💾 Guardar Curva Golden
          </button>

          <button
            onClick={guardarCapturaPNG}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            <Camera size={14} /> PNG
          </button>

          <button
            onClick={() => iniciarGrabacionVideo(10)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: '#1e293b',
              color: '#fca5a5',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 9px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.78rem'
            }}
          >
            <Video size={13} /> 10s
          </button>

          <button
            onClick={() => (grabandoVideo ? detenerGrabacionVideo() : iniciarGrabacionVideo(null))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: grabandoVideo ? '#ef4444' : '#1e293b',
              color: grabandoVideo ? '#ffffff' : '#fca5a5',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 9px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.78rem'
            }}
          >
            <Video size={13} /> {grabandoVideo ? '⏹ Parar' : '🎥 Libre'}
          </button>

          <button
            onClick={exportarCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: '#1e293b',
              color: '#10b981',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 9px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.78rem'
            }}
          >
            <FileSpreadsheet size={13} /> CSV
          </button>
        </div>
      </div>

      {/* 2. BARRA DE COMPARACIÓN GOLDEN SAMPLE Y PROTOCOLOS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0b1324',
          padding: '6px 16px',
          borderBottom: '1px solid #19253d',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {/* Selector de Curva de Referencia Golden Sample */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Layers size={14} color="#00ffff" />
          <span style={{ color: '#00ffff', fontWeight: 800, fontSize: '0.8rem' }}>
            COMPARADOR GOLDEN:
          </span>
          <select
            value={curvaGoldenSeleccionada?.id || ''}
            onChange={(e) => {
              const encontrada = curvasDisponibles.find((c) => c.id === e.target.value);
              setCurvaGoldenSeleccionada(encontrada || null);
            }}
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: '1px solid #00e5ff',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.75rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Sin Curva de Referencia --</option>
            {curvasDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                ★ {c.titulo} ({c.duracionMs}ms | Pico: {c.picoMaxA}A)
              </option>
            ))}
          </select>

          {curvaGoldenSeleccionada && (
            <button
              onClick={() => setCurvaGoldenSeleccionada(null)}
              title="Quitar Curva de Referencia"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: 'none',
                color: '#ef4444',
                padding: '2px 6px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              Quitar
            </button>
          )}

          {perfilMedicion === 'carga' && (
            <div style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}>D+: {fmtPin(dp)}</span>
              <span style={{ color: '#eab308', fontSize: '0.8rem', fontWeight: 'bold' }}>D-: {fmtPin(dm)}</span>
              <span style={{ color: cc1 > 0.25 ? '#10b981' : '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold' }}>
                CC1: {fmtPin(cc1)}
              </span>
              <span style={{ color: cc2 > 0.25 ? '#10b981' : '#c084fc', fontSize: '0.8rem', fontWeight: 'bold' }}>
                CC2: {fmtPin(cc2)}
              </span>
            </div>
          )}
        </div>

        <span style={{ color: '#c084fc', fontWeight: 800, fontSize: '0.82rem' }}>
          {calcularInfoDelta()}
        </span>
      </div>

      {/* 3. LIENZO HTML5 CANVAS PRINCIPAL */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={1300}
          height={680}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
          onDoubleClick={resetearZoom}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: 'crosshair'
          }}
        />
      </div>

      {/* 4. BARRA INFERIOR DE CONTROLES */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          padding: '8px 16px',
          borderTop: '1px solid #1e293b',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Pausa / Reanudar */}
          <button
            onClick={togglePausa}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: pausado ? '#d97706' : '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {pausado ? <Play size={14} /> : <Pause size={14} />}
            {pausado ? '▶ REANUDAR EN VIVO' : '⏸ PAUSAR Y ANALIZAR'}
          </button>

          {/* Auto-Trigger (>15 mA) para arranque exacto en t=0 */}
          <button
            onClick={toggleAutoTrigger}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: autoTriggerArmed ? '#eab308' : '#1e293b',
              color: autoTriggerArmed ? '#000000' : '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 10px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            <Zap size={14} />
            {autoTriggerArmed ? '⚡ ESPERANDO BOTÓN POWER (>15mA)...' : '⚡ Auto-Trigger Power (>15mA)'}
          </button>

          {/* Split View (Solo activo en Carga) */}
          {perfilMedicion === 'carga' && (
            <button
              onClick={() => setSplitTracks(!splitTracks)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: splitTracks ? '#7c3aed' : '#1e293b',
                color: '#ffffff',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px 10px',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              <Split size={14} />
              {splitTracks ? '2 Carriles (V / I)' : 'Superpuesta'}
            </button>
          )}

          {/* Modo Avanzado 🔬 */}
          <button
            onClick={() => setModoAvanzado(!modoAvanzado)}
            style={{
              backgroundColor: modoAvanzado ? '#1e3a8a' : '#1e293b',
              color: modoAvanzado ? '#00e5ff' : '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 10px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            🔬 {modoAvanzado ? '6 Dígitos' : '3 Dígitos'}
          </button>

          {/* Zoom Controles */}
          <button
            onClick={() => ajustarZoom(0.65)}
            title="Aumentar Zoom Horizontal"
            style={{
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 10px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <ZoomIn size={14} />
          </button>

          <button
            onClick={() => ajustarZoom(1.5)}
            title="Disminuir Zoom Horizontal"
            style={{
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 10px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <ZoomOut size={14} />
          </button>

          <button
            onClick={resetearZoom}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            🔄 Reset Zoom
          </button>

          <button
            onClick={limpiarHistorial}
            style={{
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 10px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            🧹 Limpiar
          </button>
        </div>

        {/* Toggles de Canales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {perfilMedicion === 'carga' && (
            <label style={{ color: '#ff4444', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showVbus} onChange={(e) => setShowVbus(e.target.checked)} />
              VBUS
            </label>
          )}
          <label style={{ color: '#facc15', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showIbus} onChange={(e) => setShowIbus(e.target.checked)} />
            CORRIENTE (IBUS)
          </label>
          {perfilMedicion === 'carga' && (
            <>
              <label style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showDp} onChange={(e) => setShowDp(e.target.checked)} />
                D+
              </label>
              <label style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showDm} onChange={(e) => setShowDm(e.target.checked)} />
                D-
              </label>
              <label style={{ color: '#c084fc', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showCc} onChange={(e) => setShowCc(e.target.checked)} />
                CC
              </label>
            </>
          )}
        </div>
      </div>

      {/* 5. SLIDER DE LÍNEA DE TIEMPO (BUFFER DE 60,000 MUESTRAS) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#090f1d',
          padding: '6px 16px',
          borderTop: '1px solid #19253d',
          gap: '12px'
        }}
      >
        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
          ⏪ LÍNEA DE TIEMPO ({snapTotal.toLocaleString()} PTS):
        </span>
        <input
          type="range"
          min={1}
          max={Math.max(1, snapTotal)}
          value={viewEndIdx || snapTotal}
          onChange={(e) => {
            if (!pausado) togglePausa();
            setViewEndIdx(parseInt(e.target.value));
          }}
          style={{
            flex: 1,
            cursor: 'pointer',
            accentColor: '#00e5ff'
          }}
        />
        <span style={{ color: '#00e5ff', fontSize: '0.75rem', fontWeight: 800, minWidth: '70px', textAlign: 'right' }}>
          {viewEndIdx || snapTotal} / {snapTotal}
        </span>
      </div>

      {/* MODAL PARA GUARDAR CURVA GOLDEN DE REFERENCIA */}
      {modalGuardarGolden && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '2px solid #00e5ff',
              borderRadius: '14px',
              padding: '24px',
              width: '90%',
              maxWidth: '460px',
              boxShadow: '0 0 30px rgba(0, 229, 255, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#00e5ff', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                ★ Guardar Curva Golden de Referencia
              </h3>
              <button
                onClick={() => setModalGuardarGolden(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '14px' }}>
              Se guardará la ventana activa del oscilograma para el modelo{' '}
              <strong style={{ color: '#ffffff' }}>{modeloActivo?.nombre || 'actual'}</strong>. Esta curva se proyectará
              de fondo en cian opaco para comparar futuros equipos en falla.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Título de la Secuencia:
              </label>
              <input
                type="text"
                value={formTituloGolden}
                onChange={(e) => setFormTituloGolden(e.target.value)}
                placeholder="Ej. Encendido Normal Power 1s (Placa Sana)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Notas Técnicas (Opcional):
              </label>
              <textarea
                value={formNotasGolden}
                onChange={(e) => setFormNotasGolden(e.target.value)}
                placeholder="Ej. Pico máximo 850mA, estabiliza en 420mA a los 2.2 segundos..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setModalGuardarGolden(false)}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCurvaGolden}
                style={{
                  backgroundColor: '#00e5ff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              >
                Guardar en Firestore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
