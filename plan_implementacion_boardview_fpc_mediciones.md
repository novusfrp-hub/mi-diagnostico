# Plan de Implementación Integral: Mapeo Visual FPC ➔ Boardview, Propagación de Redes y Medición Secuencial Robusta

**Proyecto:** `mi-diagnostico` (Marshall Cell / Boardview Pro)  
**Fecha:** Noviembre 2026  
**Estado:** Propuesta Técnica y Plan de Arquitectura para Revisión  
**Destinatarios:** Equipo de Desarrollo / Contraste con Modelos de Inteligencia Artificial  

---

## 1. Resumen Ejecutivo y Objetivos

Este plan aborda cuatro necesidades críticas detectadas en el flujo de diagnóstico de placas electrónicas (smartphones y placas multicapa), enfocadas en el visor de Boardview (`VisorMapeoPCB.js`) y su relación con el módulo de conectores FPC (`FPCInteligente.js`):

1. **Protección física de puntos de prueba sensibles y entrada manual de valores:** Posibilidad de registrar mediciones por teclado en lugar de forzar el uso de la sonda del multímetro físico, evitando la rotura o levantamiento de pistas delicadas.
2. **Propagación en la misma red eléctrica (`netName`):** Sincronización instantánea de mediciones entre todos los pines, pads y test points unidos a un mismo nodo o pista de cobre.
3. **Flujo de medición secuencial ("Medir en Orden") tolerante a fallos:** Corrección del reinicio forzado al pad inicial (índice 0), prevención de deselección accidental por clics en el lienzo, reanudación inteligente en el primer pad pendiente y capacidad de rectificación inmediata (`◀ Anterior` / `Siguiente ▶`).
4. **Mapeo y transferencia visual de mediciones desde FPC hacia Boardview:** Una interfaz gráfica, práctica y no redundante para enlazar pines previamente medidos en la sección FPC con los pads correspondientes en el Boardview (incluso si solo se mapea una porción específica de la placa, ej. líneas de Backlight/LCD).

---

## 2. Diagnóstico Técnico de los Problemas Actuales

### 2.1. Bloqueo de Entrada Manual en "Medición Actual"
* **Ubicación:** `components/VisorMapeoPCB.js` (Líneas ~4880 - 4930).
* **Causa:** El campo `Valor Sano` cuenta con un `<input type="text">` editable, pero `Medición Actual` es un elemento `<div>` estático que solo se actualiza mediante eventos de la sonda USB (`grabarMedicionActual(lecturaEnVivo)`) o el botón `OL`.
* **Impacto:** Si un técnico ya conoce el valor, o si la pista de cobre está debilitada por corrosión o raspado, no tiene forma de ingresar el valor numérico manualmente sin arriesgarse a dañar el pad con la punta del multímetro.

### 2.2. Aislamiento de Pads en la Misma Red
* **Ubicación:** `components/VisorMapeoPCB.js` (Función `actualizarPropiedadPad`, Líneas ~1994 - 2040).
* **Causa:** Al modificar una propiedad de medición (`valorSanoDiodo`, `valorActualDiodo`, etc.), la función filtra estrictamente por `comp.id === selectedCompId && p.id === padId`.
* **Impacto:** Si una línea eléctrica (ej. red `1`, `PP_VDD_MAIN` o `VBUS`) conecta 1 pin FPC, 2 condensadores y 2 test points, el usuario debe medir o editar los 5 puntos individualmente, a pesar de que físicamente comparten la misma caída de tensión y voltaje.

### 2.3. Fallas en el Flujo "Medir en Orden" (Medición Guiada)
* **Ubicación:** `components/VisorMapeoPCB.js` (Líneas ~1890 - 1985 y Líneas ~1374 - 1378).
* **Causas identificadas:**
  1. **Reinicio ciego a índice 0:** `iniciarMedicionGuiada` ejecuta un bucle `for (let i = 0; i < componentes.length; i++)` que toma incondicionalmente el primer componente creado. No comprueba si ya había un pad seleccionado ni evalúa si los primeros pads ya fueron medidos.
  2. **Deselección por clic en lienzo:** En `handleMouseDown`, cualquier clic sobre el área vacía del lienzo SVG ejecuta `setSelectedCompId(null); setSelectedPadId(null);`. Cuando esto ocurre, `grabarMedicionActual` no hace nada al tocar con la sonda. Al notar que no graba, el técnico presiona de nuevo "Medir en orden" y el sistema lo regresa al pad 1.
  3. **Ausencia de navegación de reversa:** `avanzarSiguientePadMedicion` solo avanza hacia adelante. Si la punta resbala o se registra un falso contacto, no existe un botón `◀ Anterior` para rectificar el pad previo sin desarmar la secuencia.

### 2.4. Desconexión de Datos entre FPC y Boardview
* **Ubicación:** `pages/index.js` (Líneas ~4778 - 4820).
* **Causa:** El componente `<VisorMapeoPCB />` no recibe la prop `fpcs={modeloActivo.fpcs}`. Los datos medidos en el módulo `FPCInteligente.js` permanecen inaccesibles para el Boardview.

---

## 3. Análisis de la Idea: Mapeo Visual FPC ➔ Boardview

El usuario planteó la idea de representar visualmente los pines del FPC ya medidos y conectarlos mediante líneas gráficas con los pads o componentes del Boardview, considerando que en el Boardview a menudo solo se dibuja una fracción de los pines (por ejemplo, 6 pines de backlight de un conector de 40 pines).

### 3.1. Evaluación de Alternativas de Diseño

| Criterio | Enfoque A: Diagrama de Nodos y Cables Flotantes (Node Graph) | Enfoque B: Paleta Visual "Bandeja FPC" (Stamp / Pin Picker) | Enfoque C: Auto-Match Inteligente por Nombre + Confirmación |
| :--- | :--- | :--- | :--- |
| **Concepto** | Pantalla dividida con nodos de pines a la izquierda y pads a la derecha, uniendo cables interactivos tipo SVG Bézier. | Cajón lateral retráctil que muestra los pines del FPC con sus mediciones. Clic en el pin FPC y clic en el pad de la placa para estampar. | Algoritmo que empareja automáticamente nombres idénticos (`LEDA` ➔ `LEDA`, `1` ➔ `1`) con botón de aprobación. |
| **Pros** | Muy llamativo visualmente; metáfora clara de "cableado". | **Máxima ergonomía y velocidad:** No satura la pantalla, ideal para pantallas táctiles o ratón; permite mapear solo los 4 o 6 pines deseados sin ruido visual. | Instantáneo para lotes grandes donde los nombres coinciden exactamente. |
| **Contras** | Ocupa mucho espacio visual; trazar líneas largas sobre un Boardview complejo con zoom y pan causa fatiga visual y alta carga de renderizado SVG. | Requiere un par de clics por pin si no tienen el mismo nombre. | No sirve si el usuario nombró el pin en FPC como "Pin 1" y en Boardview como "LEDA". |

### 3.2. Solución Recomendada: "Bandeja Visual de Pines FPC con Enlace Directo y Auto-Match"
Se adopta una solución híbrida altamente profesional:
1. **Bandeja Visual de Pines FPC:** Un panel lateral o flotante plegable que dibuja el conector FPC en miniatura con sus pines enumerados, nombres de línea y valores de diodo guardados.
2. **Modo Estampado / Asignación en 1 Clic:** El usuario hace clic en el Pin FPC (ej. `Pin 1: LEDA - 0.540V`) y luego toca el pad del Boardview. El pad hereda automáticamente el nombre de la red, su categoría y el valor de medición.
3. **Indicador de Estado de Pines:** Los pines del FPC ya asignados se marcan con un check verde `✓` en la bandeja, permitiendo identificar rápidamente cuáles faltan por transferir.
4. **Auto-Match en 1 Clic:** Si los nombres o números de red coinciden, un botón `⚡ Enlazar Coincidencias` transfiere todas las mediciones existentes en un solo clic.

---

## 4. Garantía de Cuotas e Infraestructura (Vercel y Firebase)

* **Vercel (Hobby / Free Tier):**  
  * Vercel solo compila y entrega el bundle JavaScript.
  * Todas las operaciones de propagación de redes, enlace de pines, cálculo de rutas y edición manual ocurren **en la memoria local del navegador del cliente (React State)**.
  * Consumo de funciones serverless de Vercel: **0 llamadas**.
  * Consumo de ancho de banda por edición/propagación: **0 KB**.

* **Firebase Firestore (Spark Plan / Free Tier):**  
  * Firestore almacena el modelo de hardware completo bajo el documento `hardware_db/{modeloId}`.
  * La actualización de 1 pad o de 50 pads en la misma red se consolida en una sola escritura al guardar (`setDoc` / `updateDoc`).
  * Consumo de cuota de escritura de Firestore: **1 sola escritura por sesión de guardado**.

---

## 5. Arquitectura de Módulos y Cambios Propuestos

```
pages/index.js
  │
  ├── Pasa fpcs={modeloActivo.fpcs} y fpcBateria={modeloActivo.fpcBateria}
  │
  └── <VisorMapeoPCB />
        │
        ├── [Módulo 1: Entrada Manual y Propagación de Red]
        │     ├── Toggle Switch: "Propagar a la red (N puntos)"
        │     ├── Input editable: "Medición Actual" (con atajos OL / GND)
        │     └── Actualizador de estado con broadcast a pads con mismo netName
        │
        ├── [Módulo 2: Medición Guiada Robusta]
        │     ├── Escaneo inteligente de primer pad pendiente (---)
        │     ├── Bloqueo de deselección accidental en lienzo SVG
        │     └── Mini HUD de Control: [ ◀ Anterior ] Pad X de Y [ Siguiente ▶ ]
        │
        └── [Módulo 3: Bandeja Visual FPC (FPC Data Bridge)]
              ├── Renderizado visual de pines FPC y sus valores en diodo
              ├── Asignación por clic/selección hacia pads de Boardview
              └── Auto-emparejamiento por coincidencia de netName
```

---

## 6. Especificación Detallada de Archivos y Código a Modificar

### 6.1. Archivo: `pages/index.js`
* **Líneas a intervenir:** ~4778 - 4820 (Invocación de `<VisorMapeoPCB />`).
* **Modificación:** Inyectar las colecciones de conectores FPC del modelo activo:
  ```jsx
  <VisorMapeoPCB
    fullscreen
    nombreModelo={`${modeloActivo.marca || ''} ${modeloActivo.nombre || ''}`.trim()}
    modeloId={modeloActivo.id}
    puedeEditar={puedeEditarHardware}
    onCerrar={() => setModalBoardviewAbierto(false)}
    sectoresIniciales={modeloActivo.boardviewSectores || null}
    componentesIniciales={modeloActivo.boardviewComponentes || []}
    imagenPlacaInicial={modeloActivo.boardviewImagenPlacaCaraA || modeloActivo.boardviewImagenPlaca || modeloActivo.imgPlaca}
    imagenPlacaCaraBInicial={modeloActivo.boardviewImagenPlacaCaraB || ''}
    sectorInicial={modeloActivo.boardviewSector || 'Placa Completa'}
    imagenEsquemaInicial={modeloActivo.boardviewImagenEsquema || modeloActivo.imgEsquema}
    fpcs={modeloActivo.fpcs || []}                      // <--- NUEVA PROP
    fpcBateria={modeloActivo.fpcBateria || null}        // <--- NUEVA PROP
    onCambios={(payload) => { ... }}
    ...
  />
  ```

---

### 6.2. Archivo: `components/VisorMapeoPCB.js`

#### A. Nuevos Estados en el Componente
```javascript
// Props extendidas
export default function VisorMapeoPCB({
  ...,
  fpcs = [],
  fpcBateria = null
}) {
  // 1. Toggle de propagación de mediciones en la misma red
  const [propagarRed, setPropagarRed] = useState(true);

  // 2. Control de flujo de medición guiada
  const [modoMedicionGuiada, setModoMedicionGuiada] = useState(false);
  const [soloPadsPendientes, setSoloPadsPendientes] = useState(true);

  // 3. Bandeja visual de FPC
  const [drawerFpcAbierto, setDrawerFpcAbierto] = useState(false);
  const [fpcSeleccionadoId, setFpcSeleccionadoId] = useState(fpcs[0]?.id || null);
  const [pinFpcActivoParaVincular, setPinFpcActivoParaVincular] = useState(null);
```

#### B. Corrección de Deselección Accidental (`handleMouseDown`)
* **Ubicación:** Líneas ~1374 - 1378.
* **Modificación:** Condicionar la deselección al estado de medición guiada:
  ```javascript
  if (tool === 'select') {
    // Si la medición guiada está activa, NO desmarcar el pad al hacer clic en área vacía
    if (!modoMedicionGuiada) {
      setSelectedCompId(null);
      setSelectedPadId(null);
    }
  }
  ```

#### C. Lógica Inteligente de Medición Guiada (`iniciarMedicionGuiada`, `avanzar`, `retroceder`)
* **Ubicación:** Líneas ~1890 - 1985.
* **Lógica propuesta:**
  ```javascript
  // Obtener lista lineal ordenada de pads válidos para medir en la cara actual (excluyendo GND y NC)
  const padsMediblesCaraActual = useMemo(() => {
    const lista = [];
    componentes
      .filter(c => (c.cara || 'A') === caraPlaca)
      .forEach(comp => {
        comp.pads.forEach(pad => {
          if (pad.tipo !== 'GND' && pad.netName !== 'GND' && pad.tipo !== 'NC' && pad.netName !== 'NC') {
            const propActual = activeScale === 'diodo' ? 'valorActualDiodo' 
              : activeScale === 'voltio' ? 'valorActualVoltio' 
              : activeScale === 'ua' ? 'valorActualUa' : 'valorActualOhmio';
            const medido = pad[propActual] && pad[propActual] !== '---';
            lista.push({ compId: comp.id, padId: pad.id, comp, pad, medido });
          }
        });
      });
    return lista;
  }, [componentes, caraPlaca, activeScale]);

  // Iniciar o Reanudar Medición Guiada
  const iniciarMedicionGuiada = () => {
    if (padsMediblesCaraActual.length === 0) {
      alert('No hay pads medibles registrados en esta cara de la placa.');
      return;
    }

    setModoMedicionGuiada(true);
    setAutoHoldActivo(true);

    // 1. Si ya hay un pad medible seleccionado, quedarse en él
    const indexActual = padsMediblesCaraActual.findIndex(item => item.compId === selectedCompId && item.padId === selectedPadId);
    if (indexActual !== -1) {
      centrarEnComponente(padsMediblesCaraActual[indexActual].comp);
      return;
    }

    // 2. Si no hay pad seleccionado o no es medible, buscar el PRIMER PAD PENDIENTE (no medido)
    const primerPendiente = padsMediblesCaraActual.find(item => !item.medido);
    if (primerPendiente) {
      setSelectedCompId(primerPendiente.compId);
      setSelectedPadId(primerPendiente.padId);
      centrarEnComponente(primerPendiente.comp);
      return;
    }

    // 3. Si todos ya están medidos, avisar y seleccionar el primero
    if (window.confirm('¡Todos los componentes ya tienen mediciones registradas en esta escala! ¿Deseas iniciar una revisión desde el primer pad?')) {
      setSelectedCompId(padsMediblesCaraActual[0].compId);
      setSelectedPadId(padsMediblesCaraActual[0].padId);
      centrarEnComponente(padsMediblesCaraActual[0].comp);
    } else {
      setModoMedicionGuiada(false);
    }
  };

  // Avanzar al siguiente pad
  const avanzarSiguientePadMedicion = useCallback(() => {
    if (padsMediblesCaraActual.length === 0) return;
    const indexActual = padsMediblesCaraActual.findIndex(item => item.compId === selectedCompId && item.padId === selectedPadId);

    // Buscar el siguiente (preferentemente no medido si soloPadsPendientes está activo)
    let siguiente = null;
    if (indexActual !== -1 && indexActual < padsMediblesCaraActual.length - 1) {
      siguiente = padsMediblesCaraActual[indexActual + 1];
    } else {
      // Fin del recorrido
      alert('✅ ¡Has alcanzado el último punto de medición de esta sección!');
      setModoMedicionGuiada(false);
      return;
    }

    if (siguiente) {
      setSelectedCompId(siguiente.compId);
      setSelectedPadId(siguiente.padId);
      centrarEnComponente(siguiente.comp);
    }
  }, [padsMediblesCaraActual, selectedCompId, selectedPadId]);

  // Retroceder al pad anterior (para rectificar lecturas erróneas)
  const retrocederPadMedicion = useCallback(() => {
    if (padsMediblesCaraActual.length === 0) return;
    const indexActual = padsMediblesCaraActual.findIndex(item => item.compId === selectedCompId && item.padId === selectedPadId);
    if (indexActual > 0) {
      const anterior = padsMediblesCaraActual[indexActual - 1];
      setSelectedCompId(anterior.compId);
      setSelectedPadId(anterior.padId);
      centrarEnComponente(anterior.comp);
    }
  }, [padsMediblesCaraActual, selectedCompId, selectedPadId]);
  ```

#### D. Propagación de Medición en Toda la Red (`actualizarPropiedadPad` y `grabarMedicionActual`)
* Modificar la grabación para que, si `propagarRed` está activo, actualice simultáneamente todos los pads con el mismo `netName`:
  ```javascript
  const aplicarMedicionAPadYRed = (propiedad, valor) => {
    if (!selectedCompId || !selectedPadId) return;
    guardarSnapshotHistorial();

    const compActual = componentes.find(c => c.id === selectedCompId);
    const padActual = compActual?.pads.find(p => p.id === selectedPadId);
    const netActual = padActual?.netName;

    setComponentes(prev => prev.map(comp => ({
      ...comp,
      pads: comp.pads.map(pad => {
        const esMismoPad = comp.id === selectedCompId && pad.id === selectedPadId;
        const comparteRed = propagarRed && netActual && netActual !== 'NC' && pad.netName === netActual;

        if (esMismoPad || comparteRed) {
          return { ...pad, [propiedad]: valor };
        }
        return pad;
      })
    })));
  };
  ```

#### E. Rediseño del Panel de Valores (Edición Manual + Toggle de Red)
* **Ubicación:** Líneas ~4880 - 4930.
* Reemplazar el `<div>` estático de "Medición Actual" por un `<input type="text">` con estilo consistente, e incorporar el interruptor de red:
  ```jsx
  {/* Header de Red y Toggle de Propagación */}
  {activeNetName && (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#111827', borderRadius: '6px', marginBottom: '8px', border: '1px solid #1f2937' }}>
      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
        Red: <strong style={{ color: '#00ffff' }}>{activeNetName}</strong> ({padsMismaRed.length} puntos)
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: propagarRed ? '#10b981' : '#6b7280', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={propagarRed}
          onChange={(e) => setPropagarRed(e.target.checked)}
        />
        Sincronizar Red
      </label>
    </div>
  )}

  {/* Cuadrícula de Valores: Valor Sano y Medición Actual Editable */}
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
    {/* Valor Sano */}
    <div>
      <label style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
        Valor Sano ({cfgEscalaActiva.unidad}):
      </label>
      <input
        type="text"
        placeholder="---"
        value={valSano !== undefined && valSano !== '---' ? valSano : ''}
        onChange={(e) => aplicarMedicionAPadYRed(propSanoActivo, e.target.value)}
        style={styles.inputEditable}
      />
    </div>

    {/* Medición Actual Editable Manualmente */}
    <div>
      <label style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
        Medición Actual:
      </label>
      <input
        type="text"
        placeholder="---"
        value={valActual !== undefined && valActual !== '---' ? valActual : ''}
        onChange={(e) => aplicarMedicionAPadYRed(propActualActivo, e.target.value)}
        style={{
          ...styles.inputEditable,
          color: obtenerColorDePad(padActivo, compActivo.id),
          border: '1px solid #3b82f6'
        }}
      />
    </div>
  </div>
  ```

#### F. Barra de Control Flotante de Medición Guiada (Mini HUD de Secuencia)
* Mostrar cuando `modoMedicionGuiada` esté activo:
  ```jsx
  {modoMedicionGuiada && (
    <div style={styles.hudSecuenciaFlotante}>
      <button onClick={retrocederPadMedicion} title="Retroceder al pad anterior">
        <ChevronLeft size={16} /> Anterior
      </button>

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#fff' }}>
          Pad {posicionActual + 1} de {padsMediblesCaraActual.length}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>
          {padActivo?.netName || 'Sin Net'} ({compActivo?.nombre})
        </span>
      </div>

      <button onClick={avanzarSiguientePadMedicion} title="Saltar al siguiente pad">
        Siguiente <ChevronRight size={16} />
      </button>

      <button onClick={() => setModoMedicionGuiada(false)} style={{ color: '#ef4444' }} title="Salir de medición guiada">
        <X size={16} />
      </button>
    </div>
  )}
  ```

#### G. Componente Cajón: "Bandeja Visual de Pines FPC" (`BandejaPinesFPC.jsx`)
* Panel lateral retráctil que permite:
  1. Seleccionar el conector FPC disponible en el modelo (`fpcs.map(...)`).
  2. Visualizar cada pin con su número, etiqueta (ej. `LEDA`, `VBUS`, `GND`) y medición en diodo ya tomada.
  3. Indicar si el pin ya fue transferido a algún pad del Boardview (`✓`).
  4. Botón `⚡ Auto-Enlazar Coincidencias`: detecta si el `netName` de algún pad coincide con el pin del FPC y transfiere la medición en bloque.
  5. Modo Estampado: al hacer clic en un pin de la lista, queda en estado "Cargado en memoria"; al tocar cualquier pad en el Boardview, se transfiere el valor al instante.

---

## 7. Matriz de Casos Borde y Pruebas

| Escenario de Prueba | Comportamiento Esperado | Resultado Técnico |
| :--- | :--- | :--- |
| **Clic accidental en fondo de placa durante medición guiada** | El pad permanece seleccionado; no se pierde el foco ni se cancela la captura del multímetro. | Superado (guardia en `handleMouseDown`). |
| **Medición errónea por resbalón de punta** | El usuario pulsa `◀ Anterior`, el visor retrocede el foco al pad previo, se toma la lectura correcta y continúa. | Superado (control de secuencia bidireccional). |
| **Componentes en Cara A vs Cara B** | La medición guiada solo itera sobre los componentes visibles de la cara activa (`caraPlaca`). No salta a componentes ocultos. | Superado (filtro memoizado por `caraPlaca`). |
| **Pines GND / NC** | Se omiten automáticamente de la secuencia secuencial para no perder tiempo en tierras o pines sin conexión. | Superado (filtro `p.tipo !== 'GND' && p.netName !== 'GND'`). |
| **FPC con 40 pines, Boardview con solo 6 pines de Backlight** | La Bandeja FPC permite transferir únicamente los 6 pines deseados sin obligar a mapear los 34 restantes. | Superado (asignación selectiva / desacoplada). |
| **Impacto de rendimiento / Lag** | La propagación de red usa mutación inmutable optimizada en React (`setComponentes`). No genera re-renders masivos ni llamadas a servidor. | Superado (0 impacto en CPU/Red). |

---

## 8. Conclusiones y Próximos Pasos

Este plan resuelve de raíz la causa del comportamiento errático del visor:
- Elimina el reinicio al pad 1.
- Otorga control total al técnico para rectificar lecturas con un clic o con el teclado.
- Evita romper pistas delicadas mediante la entrada manual.
- Conecta el trabajo ya invertido en el módulo FPC con el visor de Boardview de forma visual, elegante y práctica.

**Estado para el usuario:** Listo para someter a contraste y revisión. Una vez aprobado, se procederá con la implementación modular en el repositorio.
