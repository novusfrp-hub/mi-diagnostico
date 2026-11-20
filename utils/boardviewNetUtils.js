// utils/boardviewNetUtils.js
// Utilidades puras para normalización de redes, propagación de mediciones y enlace FPC <-> Boardview

/**
 * Normaliza un nombre de red para comparación consistente
 * Convierte a mayúsculas, recorta espacios y reemplaza secuencias de espacios por guión bajo.
 */
export function normalizarNetName(netName) {
  if (!netName || typeof netName !== 'string') return '';
  return netName.trim().toUpperCase().replace(/\s+/g, '_');
}

/**
 * Determina si una red eléctrica es apta para propagación masiva a otros pads.
 * Excluye tierras, neutros, sin conexión, valores por defecto o vacíos.
 */
export function esRedPropagable(netName) {
  if (!netName || typeof netName !== 'string') return false;
  const n = netName.trim().toUpperCase();
  if (
    !n ||
    n === '---' ||
    n === 'SIN NET' ||
    n === 'SIN_NET' ||
    n === 'GND' ||
    n === 'GROUND' ||
    n === 'AGND' ||
    n === 'DGND' ||
    n.startsWith('GND_') ||
    n.endsWith('_GND') ||
    n === 'NC' ||
    n === 'NO_CONNECT' ||
    n === 'NONE' ||
    n === 'NULL'
  ) {
    return false;
  }
  return true;
}

/**
 * Normaliza un valor numérico de medición ingresado manualmente.
 * Convierte comas en puntos decimales y conserva 'OL' o '---'.
 */
export function normalizarValorMedicion(valor) {
  if (valor === undefined || valor === null) return '---';
  const v = String(valor).trim();
  if (!v || v === '---') return '---';
  if (v.toUpperCase() === 'OL') return 'OL';

  // Normalizar coma a punto decimal
  const conPunto = v.replace(',', '.');
  return conPunto;
}

/**
 * Devuelve el nombre de la propiedad del pad para Valor Sano según la escala activa
 */
export function getPropSano(escalaId) {
  switch (escalaId) {
    case 'diodo': return 'valorSanoDiodo';
    case 'voltio': return 'valorSanoVoltio';
    case 'ua': return 'valorSanoUa';
    case 'ohmio': return 'valorSanoOhmio';
    case 'amperio': return 'valorSanoAmperio';
    default: return 'valorSanoDiodo';
  }
}

/**
 * Devuelve el nombre de la propiedad del pad para Medición Actual según la escala activa
 */
export function getPropActual(escalaId) {
  switch (escalaId) {
    case 'diodo': return 'valorActualDiodo';
    case 'voltio': return 'valorActualVoltio';
    case 'ua': return 'valorActualUa';
    case 'ohmio': return 'valorActualOhmio';
    case 'amperio': return 'valorActualAmperio';
    default: return 'valorActualDiodo';
  }
}

/**
 * Extrae el valor de un pad (sano o actual) según la escala activa con soporte de fallback
 */
export function extraerValorPad(pad, escala = 'diodo', tipo = 'actual') {
  if (!pad) return '---';
  const prop = tipo === 'sano' ? getPropSano(escala) : getPropActual(escala);
  const val = pad[prop];
  if (val !== undefined && val !== null && val !== '' && val !== '---') {
    return String(val);
  }
  if (escala === 'diodo') {
    const fallback = tipo === 'sano' ? pad.valorSano : pad.valorActual;
    if (fallback !== undefined && fallback !== null && fallback !== '' && fallback !== '---') {
      return String(fallback);
    }
  }
  return '---';
}

/**
 * Unifica la lista de FPCs generales y el FPC de Batería en una estructura homogénea
 */
export function normalizarConectoresFpc(fpcs = [], fpcBateria = null) {
  const lista = [];

  if (Array.isArray(fpcs)) {
    fpcs.forEach(f => {
      if (f && f.id) {
        lista.push({
          id: String(f.id),
          nombre: f.nombre || `FPC_${f.id}`,
          pines: Array.isArray(f.pines) ? f.pines : [],
          tipoOrigen: 'fpc_general'
        });
      }
    });
  }

  if (fpcBateria && fpcBateria.pines && fpcBateria.pines.length > 0) {
    lista.push({
      id: String(fpcBateria.id || 'bateria'),
      nombre: fpcBateria.nombre || 'FPC Batería',
      pines: fpcBateria.pines,
      tipoOrigen: 'fpc_bateria',
      esIPhone: !!fpcBateria.esIPhone,
      estiloLayout: fpcBateria.estiloLayout || 'hibrido'
    });
  }

  return lista;
}

/**
 * Extrae los valores de un pin de FPC en la escala activa, soportando fallbacks históricos
 */
export function obtenerValoresPinFpc(pin, escala = 'diodo') {
  if (!pin) {
    return { valorSano: '---', valorActual: '---', nombre: '', tipo: 'PIN' };
  }

  let valorSano = '---';
  let valorActual = '---';

  if (escala === 'diodo') {
    valorSano = pin.valorSanoDiodo !== undefined ? pin.valorSanoDiodo : (pin.valorSano ?? '---');
    valorActual = pin.valorActualDiodo !== undefined ? pin.valorActualDiodo : (pin.valorActual ?? '---');
  } else if (escala === 'voltio') {
    valorSano = pin.valorSanoVoltio ?? '---';
    valorActual = pin.valorActualVoltio ?? '---';
  } else if (escala === 'ua') {
    valorSano = pin.valorSanoUa ?? '---';
    valorActual = pin.valorActualUa ?? '---';
  } else if (escala === 'ohmio') {
    valorSano = pin.valorSanoOhmio ?? '---';
    valorActual = pin.valorActualOhmio ?? '---';
  } else if (escala === 'amperio') {
    valorSano = pin.valorSanoAmperio ?? '---';
    valorActual = pin.valorActualAmperio ?? '---';
  } else {
    valorSano = pin.valorSano ?? '---';
    valorActual = pin.valorActual ?? '---';
  }

  return {
    id: pin.id,
    nombre: pin.nombre || `Pin_${pin.id}`,
    tipo: pin.tipo || 'PIN',
    categoria: pin.categoria || null,
    colorCustom: pin.colorCustom || null,
    valorSano: valorSano !== undefined && valorSano !== null ? String(valorSano) : '---',
    valorActual: valorActual !== undefined && valorActual !== null ? String(valorActual) : '---'
  };
}

/**
 * Algoritmo de emparejamiento automático (Auto-Match) entre Pines FPC y Pads de Boardview
 */
export function autoMatchFpcBoardview({
  conectoresFpc = [],
  componentes = [],
  fpcId = null,
  escala = 'diodo',
  destino = 'valorSano', // 'valorSano' | 'valorActual' | 'ambos'
  soloVacios = true
}) {
  if (!conectoresFpc || conectoresFpc.length === 0 || !componentes || componentes.length === 0) {
    return { componentesActualizados: componentes, coincidenciasCount: 0, detalles: [] };
  }

  const conector = fpcId
    ? conectoresFpc.find(c => String(c.id) === String(fpcId))
    : conectoresFpc[0];

  if (!conector || !conector.pines || conector.pines.length === 0) {
    return { componentesActualizados: componentes, coincidenciasCount: 0, detalles: [] };
  }

  const propSano = getPropSano(escala);
  const propActual = getPropActual(escala);
  let coincidenciasCount = 0;
  const detalles = [];

  // Diccionarios de búsqueda rápida de pines
  const pinPorNombre = new Map();
  const pinPorId = new Map();

  conector.pines.forEach(pin => {
    const nomNorm = normalizarNetName(pin.nombre);
    if (nomNorm) pinPorNombre.set(nomNorm, pin);
    pinPorId.set(String(pin.id), pin);
    pinPorNombre.set(`PIN_${pin.id}`, pin);
  });

  const componentesActualizados = componentes.map(comp => {
    if (!comp || !Array.isArray(comp.pads)) return comp;
    let huboCambioComp = false;

    const nuevosPads = comp.pads.map(pad => {
      const padNetNorm = normalizarNetName(pad.netName);
      if (!padNetNorm || padNetNorm === 'GND' || padNetNorm === 'NC') {
        return pad;
      }

      // 1. Coincidencia por fpcRef explícito si ya estaba vinculado previamente
      let pinEncontrado = null;
      if (pad.fpcRef && String(pad.fpcRef.fpcId) === String(conector.id)) {
        pinEncontrado = conector.pines.find(p => String(p.id) === String(pad.fpcRef.pinId));
      }

      // 2. Coincidencia por nombre de red idéntico
      if (!pinEncontrado && pinPorNombre.has(padNetNorm)) {
        pinEncontrado = pinPorNombre.get(padNetNorm);
      }

      // 3. Coincidencia por número directo (ej: padNet = "1" y pinId = 1)
      if (!pinEncontrado && pinPorId.has(padNetNorm)) {
        pinEncontrado = pinPorId.get(padNetNorm);
      }

      if (pinEncontrado) {
        const valoresPin = obtenerValoresPinFpc(pinEncontrado, escala);
        const actualizaciones = {};
        let actualizado = false;

        // Evaluar destino Sano
        if (destino === 'valorSano' || destino === 'ambos') {
          const valorActualEnPad = pad[propSano];
          const estaVacio = !valorActualEnPad || valorActualEnPad === '---';
          if (!soloVacios || estaVacio) {
            if (valoresPin.valorSano && valoresPin.valorSano !== '---') {
              actualizaciones[propSano] = valoresPin.valorSano;
              actualizado = true;
            }
          }
        }

        // Evaluar destino Actual
        if (destino === 'valorActual' || destino === 'ambos') {
          const valorActualEnPad = pad[propActual];
          const estaVacio = !valorActualEnPad || valorActualEnPad === '---';
          if (!soloVacios || estaVacio) {
            if (valoresPin.valorActual && valoresPin.valorActual !== '---') {
              actualizaciones[propActual] = valoresPin.valorActual;
              actualizado = true;
            }
          }
        }

        if (actualizado) {
          coincidenciasCount++;
          huboCambioComp = true;
          detalles.push({
            compNombre: comp.nombre,
            padId: pad.id,
            netName: pad.netName,
            pinId: pinEncontrado.id,
            pinNombre: pinEncontrado.nombre
          });

          return {
            ...pad,
            ...actualizaciones,
            fpcRef: {
              fpcId: String(conector.id),
              pinId: pinEncontrado.id,
              fpcNombre: conector.nombre,
              pinNombre: pinEncontrado.nombre
            }
          };
        }
      }

      return pad;
    });

    return huboCambioComp ? { ...comp, pads: nuevosPads } : comp;
  });

  return { componentesActualizados, coincidenciasCount, detalles };
}

/**
 * Función centralizada para actualizar un pad con soporte de propagación selectiva en la red.
 * - extraProps (fpcRef, etc.) solo se aplican al pad físico seleccionado.
 * - Los demás pads de la red propagable solo reciben la medición [propiedad]: valor.
 */
export function actualizarPadConPropagacion({
  componentes = [],
  compId,
  padId,
  propiedad,
  valor,
  propagarRedSano = true,
  propagarRedActual = false,
  extraProps = {},
  deducirCategoriaDeNet = null
}) {
  if (!componentes || !compId || !padId || !propiedad) return componentes;

  const compObjetivo = componentes.find(c => c && c.id === compId);
  if (!compObjetivo || !Array.isArray(compObjetivo.pads)) return componentes;
  const padObjetivo = compObjetivo.pads.find(p => p && p.id === padId);
  if (!padObjetivo) return componentes;

  const netObjetivo = padObjetivo.netName;
  const netObjetivoNorm = normalizarNetName(netObjetivo);
  const esPropagable = esRedPropagable(netObjetivoNorm);

  const esSano = propiedad.startsWith('valorSano');
  const esActual = propiedad.startsWith('valorActual');
  const debePropagar = esPropagable && (
    (esSano && propagarRedSano) ||
    (esActual && propagarRedActual)
  );

  return componentes.map(comp => {
    if (!comp || !Array.isArray(comp.pads)) return comp;
    const esCompActivo = comp.id === compId;
    const tienePadMismaRed = debePropagar && comp.pads.some(
      p => p && normalizarNetName(p.netName) === netObjetivoNorm
    );

    if (!esCompActivo && !tienePadMismaRed) {
      return comp;
    }

    const nuevosPads = comp.pads.map(p => {
      const esMismoPad = esCompActivo && p.id === padId;
      const coincideRed = debePropagar && normalizarNetName(p.netName) === netObjetivoNorm;

      if (esMismoPad) {
        return {
          ...p,
          [propiedad]: valor,
          ...extraProps
        };
      }

      if (coincideRed) {
        // En pads remotos de la misma red eléctrica SOLO se propaga la medición,
        // no las propiedades exclusivas del pad físico (como fpcRef)
        return {
          ...p,
          [propiedad]: valor
        };
      }

      return p;
    });

    return {
      ...comp,
      pads: nuevosPads
    };
  });
}
