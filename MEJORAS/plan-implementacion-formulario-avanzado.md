# PLAN DE IMPLEMENTACIÓN: Formulario de Diagnóstico Avanzado

## 📋 Resumen General

Transformar el formulario básico de "Nuevo Ingreso" (Bitácora) en `pages/index.js` en una herramienta de diagnóstico avanzado con 3 pestañas: Datos Básicos, Consumos (USB/Fuente) y Topología (Líneas/Componentes).

**REGLA CRÍTICA:** NO modificar `guardarBitacora`, `addDoc`, `updateDoc`, `deleteDoc` ni la estructura de Firebase. Los cambios en `index.js` son **mínimos**: solo actualizar el estado inicial de `formCaso` y reemplazar el `<form>` del modal por el nuevo componente.

---

## 📁 ARQUITECTURA DEL PROYECTO (Contexto)

```
mi-diagnostico/
├── pages/
│   └── index.js          ← Archivo principal. Contiene TODO: estado, lógica Firebase, modales, estilos.
├── components/
│   ├── EscanerRFFE.js
│   ├── FPCInteligente.js
│   └── pdfx/ReportePDF.js
├── firebase.js            ← Configuración Firebase (db, auth)
├── styles/
│   ├── globals.css        ← Variables CSS :root / [data-theme='dark']
│   └── Home.module.css
├── package.json           ← Dependencias: next 16, react 19, firebase 12, framer-motion 12, lucide-react 1.8
└── MEJORAS/
    └── mejoras .txt
```

### Stack Tecnológico
- **Next.js 16** (pages router, no app router)
- **React 19** con hooks
- **Firebase Firestore** (`historial_reparaciones` collection)
- **Framer Motion** para animaciones
- **Lucide React** para iconos
- **Estilos:** CSS-in-JS (objeto `estilos` en `index.js`) + `globals.css` con variables CSS. Tema dark/light con data-attribute.

### Patrones de Estilo del Proyecto (IMPORTANTE - replicar exactamente)
- Fondos oscuros: `#111827`, `#1a1a1a`, `#1f2937`, `#0a0b0f`
- Bordes sutiles: `1px solid #374151`, `1px solid #333`
- Colores de acento: `#00ffff` (cyan), `#8b5cf6` (violeta), `#10b981` (verde), `#3b82f6` (azul)
- Texto: `white` principal, `#9ca3af` secundario, `#6b7280` terciario
- Inputs: `estilos.inputDark` (bg `#1a1a1a`, border `#333`, color `white`)
- Los estilos se definen como objetos JS inline (no Tailwind classes), usando `estilos.inputDark`, `t.cristalBgItem`, etc.
- El tema se accede vía `const t = estilos[tema]` (light/dark)

---

## PASO 1: AMPLIAR EL ESTADO `formCaso` EN `pages/index.js`

### Ubicación actual (línea ~47)

```js
const [formCaso, setFormCaso] = useState({ 
  marca: '', modelo: '', sintomas: '', protocolo: '', imgUrl: '' 
});
```

### Cambio a realizar

```js
const [formCaso, setFormCaso] = useState({ 
  marca: '', modelo: '', sintomas: '', protocolo: '', imgUrl: '',
  consumoUsb: { voltaje: '', corriente: '', comportamiento: '', conBateria: '', sinBateria: '' },
  consumoFuente: { inicial: '', postPower: '', comportamiento: '' },
  lineasAfectadas: [] 
  // Cada elemento: { id: string, nombre: string, componentes: [{ id: string, tipo: string, nomenclatura: string, estado: string }] }
});
```

### También actualizar `prepararNuevoCaso` (línea ~255)

```js
const prepararNuevoCaso = () => { 
  setFormCaso({ 
    marca: '', modelo: '', sintomas: '', protocolo: '', imgUrl: '',
    consumoUsb: { voltaje: '', corriente: '', comportamiento: '', conBateria: '', sinBateria: '' },
    consumoFuente: { inicial: '', postPower: '', comportamiento: '' },
    lineasAfectadas: [] 
  }); 
  setCasoEditando(null); 
  setMensajeCaso(''); 
  setBitacoraVisible(true); 
};
```

### Actualizar el botón de editar en el historial (línea ~810)

Cuando se edita un caso existente, hay que preservar los campos nuevos si existen (backward compat con casos viejos que no tienen `consumoUsb`/`consumoFuente`/`lineasAfectadas`):

```js
onClick={() => { 
  setFormCaso({ 
    marca: caso.marca, 
    modelo: caso.modelo, 
    sintomas: caso.sintomas, 
    protocolo: caso.protocolo || '', 
    imgUrl: caso.imgUrl || '',
    consumoUsb: caso.consumoUsb || { voltaje: '', corriente: '', comportamiento: '', conBateria: '', sinBateria: '' },
    consumoFuente: caso.consumoFuente || { inicial: '', postPower: '', comportamiento: '' },
    lineasAfectadas: caso.lineasAfectadas || []
  }); 
  setCasoEditando(caso.id); 
  setHistorialCasosVisible(false); 
  setBitacoraVisible(true); 
}}
```

---

## PASO 2: CREAR `components/FormularioIngresoAvanzado.js`

### Props que recibe el componente

| Prop | Tipo | Descripción |
|------|------|-------------|
| `formCaso` | object | Estado completo del formulario |
| `setFormCaso` | function | Setter del estado |
| `guardarBitacora` | function | La función original de guardado de index.js (se pasa tal cual, recibe el evento `e`) |
| `casoEditando` | string \| null | ID si se está editando, null si es nuevo |
| `mensajeCaso` | string | Mensaje de feedback |
| `casosGuardados` | array | Lista completa de casos del historial (para extraer autocompletado de líneas) |

### Estructura del Componente

```
FormularioIngresoAvanzado
├── Header con título + botón cerrar
├── Navegación de Tabs (3 pestañas)
├── Contenido de Tab activa
│   ├── Tab 1: Datos Básicos (marca, modelo, síntomas, protocolo, imgUrl)
│   ├── Tab 2: Consumos (USB + Fuente)
│   └── Tab 3: Topología (Líneas + Componentes CRUD)
├── Mensaje de feedback
└── Botón Guardar
```

### Diseño de Tabs

Las tabs deben seguir el estilo del proyecto: botones con `border-radius: 20px`, fondo `#1f2937` inactivo, color de acento activo (`#10b981` para INGRESO).

```
┌────────────────────────────────────────────┐
│  [1. Datos Básicos] [2. Consumos] [3. Topología]  │
├────────────────────────────────────────────┤
│                                            │
│  (contenido de la pestaña activa)          │
│                                            │
├────────────────────────────────────────────┤
│  ✅ Guardado exitoso                       │
│  [💾 Guardar en Bitácora]                  │
└────────────────────────────────────────────┘
```

### Tab 1: Datos Básicos

Replica los campos actuales del formulario:
- **Marca** (input text, required)
- **Modelo** (input text, required)
- **Síntomas** (textarea, required)
- **Protocolo / Diagnóstico** (textarea)
- **URL de Imagen** (input text, opcional)

Usar `estilos.inputLigero` para mantener consistencia visual.

### Tab 2: Consumos (USB / Fuente)

Dividida en dos secciones visuales con fondo `#1a1a1a` y borde `#333`:

#### Sección USB
| Campo | Tipo | Opciones/Placeholder |
|-------|------|---------------------|
| Voltaje | input text | "Ej: 5.12V" |
| Corriente | input text | "Ej: 0.45A" |
| Comportamiento | `<select>` | Estático, Cíclico, Corto total, Fuga inicial, Congelado, Sube y cae |
| Con Batería | input text | "Ej: 0.02A" |
| Sin Batería | input text | "Ej: 0.00A" |

#### Sección Fuente
| Campo | Tipo | Opciones/Placeholder |
|-------|------|---------------------|
| Inicial | input text | "Ej: 0.00A" |
| Post-Power | input text | "Ej: 0.15A" |
| Comportamiento | `<select>` | Estático, Cíclico, Corto total, Fuga inicial, Congelado, Sube y cae |

### Tab 3: Topología (CRUD de Líneas y Componentes)

#### Botón principal
```
[+ Añadir Línea Afectada]
```

#### Estructura de cada Línea
```
┌─────────────────────────────────────────────┐
│ 🔵 Línea: [PP_VDD_MAIN ▾]    [🗑️ Eliminar] │
│                                             │
│  ┌── Componentes ──────────────────────────┐│
│  │ [IC ▾] [U2100    ] [Corto ▾] [🗑️]      ││
│  │ [Capacitor ▾] [C200    ] [Fuga ▾] [🗑️] ││
│  │ [+ Añadir Componente]                   ││
│  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

#### Lógica del Combobox Inteligente (Autocompletado de Líneas)

```js
// Extraer nombres únicos de líneas del historial
const nombresLineasHistorial = useMemo(() => {
  const nombres = new Set();
  (casosGuardados || []).forEach(caso => {
    (caso.lineasAfectadas || []).forEach(linea => {
      if (linea.nombre && linea.nombre.trim()) {
        nombres.add(linea.nombre.trim());
      }
    });
  });
  return Array.from(nombres).sort();
}, [casosGuardados]);
```

Este array se pasa a un `<datalist>` asociado al input de nombre de cada línea. **⚠️ IMPORTANTE: Cada línea debe renderizar su propio `<datalist>` con un `id` ÚNICO** (usando el `id` de la línea) para evitar duplicar IDs en el DOM cuando hay múltiples líneas:

```jsx
<input 
  list={`lineas-sugeridas-${linea.id}`}
  value={linea.nombre}
  onChange={...}
  placeholder="Ej: PP_VDD_MAIN"
/>
<datalist id={`lineas-sugeridas-${linea.id}`}>
  {nombresLineasHistorial.map(nombre => (
    <option key={nombre} value={nombre} />
  ))}
</datalist>
```

> 🚨 **ADVERTENCIA:** NO uses un `<datalist>` con un `id` fijo (ej. `id="lineas-sugeridas"`) fuera del `.map()`, porque si hay 5 líneas, los 5 inputs apuntarán al mismo `id`, y el navegador solo encontrará el primer `<datalist>` del DOM, ignorando los demás. **Cada línea debe generar su propio datalist con ID único basado en `linea.id`.**

#### IDs

Usar `Date.now().toString() + Math.random().toString(36).slice(2, 6)` para generar IDs únicos (mismo patrón que `EscanerRFFE.js`).

#### Componentes por línea

Cada componente tiene:
- **Tipo** (`<select>`): IC, Capacitor, Resistencia, Diodo, Bobina
- **Nomenclatura** (input text, ej: "C200", "U2100")
- **Estado** (`<select>`): Corto, Fuga, Abierto, Daño Físico
- **Botón eliminar** (ícono `Trash2` rojo)

> 🚨 **ADVERTENCIA — Deep Clone Obligatorio:** Al actualizar un campo de un componente anidado (ej. cambiar el Estado de "C200"), el setter de React debe clonar **inmutablemente** toda la jerarquía. NO hacer esto:
> ```js
> // ❌ MAL: muta el estado directamente
> formCaso.lineasAfectadas[0].componentes[0].estado = "Corto"
> ```
> Hacer esto:
> ```js
> // ✅ BIEN: deep clone con spreads y .map()
> setFormCaso(prev => ({
>   ...prev,
>   lineasAfectadas: prev.lineasAfectadas.map(linea =>
>     linea.id === idLinea
>       ? {
>           ...linea,
>           componentes: linea.componentes.map(comp =>
>             comp.id === idComponente
>               ? { ...comp, [campo]: valor }
>               : comp
>           )
>         }
>       : linea
>   )
> }));
> ```
> La clave es usar `.map()` para crear **nuevos arrays** y `...` (spread) para crear **nuevos objetos** en CADA nivel del anidamiento. Esto garantiza que React detecte el cambio y re-renderice correctamente.

### Botón Guardar

```jsx
<button 
  type="submit" 
  style={{ 
    ...estilos.btnPrimarioGuardar, 
    width: '100%', 
    padding: '15px', 
    justifyContent: 'center', 
    marginTop: '10px' 
  }}
>
  <Save size={18} /> {casoEditando ? 'Actualizar Caso' : 'Guardar en Bitácora'}
</button>
```

---

## PASO 3: INYECCIÓN EN `pages/index.js`

### Ubicación: Modal 10 - BITÁCORA (aproximadamente línea ~770-810)

#### Código ACTUAL a reemplazar:

```jsx
{bitacoraVisible && (
  <motion.div ...>
    <motion.div ...>
      <div style={estilos.modalHeader}>
        <h3 ...>... {casoEditando ? 'Editar Caso' : 'Nuevo Ingreso'}</h3>
        <button onClick={() => setBitacoraVisible(false)} ...><X size={24} /></button>
      </div>
      <div style={estilos.modalBody}>
        <form onSubmit={guardarBitacora} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          ... todos los inputs actuales ...
          {mensajeCaso && <p ...>{mensajeCaso}</p>}
          <button type="submit" ...>...</button>
        </form>
      </div>
    </motion.div>
  </motion.div>
)}
```

#### NUEVO código:

```jsx
{bitacoraVisible && (
  <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={estilos.modalOverlay} onClick={() => setBitacoraVisible(false)}>
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...estilos.modalCard, ...t.fondoPrincipal, ...t.bordeFantasma, width: '100%', maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
      <FormularioIngresoAvanzado 
        formCaso={formCaso} 
        setFormCaso={setFormCaso} 
        guardarBitacora={guardarBitacora} 
        casoEditando={casoEditando} 
        mensajeCaso={mensajeCaso} 
        casosGuardados={casosGuardados} 
      />
    </motion.div>
  </motion.div>
)}
```

### Import al inicio del archivo

Agregar en la sección de imports (después de `import EscanerRFFE from '../components/EscanerRFFE.js'`):

```js
import FormularioIngresoAvanzado from '../components/FormularioIngresoAvanzado.js';
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Modificaciones en `pages/index.js` (3 lugares exactos)

- [ ] **Línea ~47**: Expandir `useState` de `formCaso` con `consumoUsb`, `consumoFuente`, `lineasAfectadas`
- [ ] **Línea ~255**: Expandir `prepararNuevoCaso` con los mismos defaults
- [ ] **Línea ~810**: En el botón editar del historial, agregar backward compat para los campos nuevos
- [ ] **Línea ~15**: Agregar `import FormularioIngresoAvanzado from '../components/FormularioIngresoAvanzado.js'`
- [ ] **Línea ~770-810**: Reemplazar el `<form>...</form>` completo del modal bitácora por `<FormularioIngresoAvanzado ... />`

### Crear archivo nuevo

- [ ] **`components/FormularioIngresoAvanzado.js`** — Componente completo con 3 tabs

---

## 🎨 GUÍA DE ESTILOS (Tailwind-in-JS) PARA EL NUEVO COMPONENTE

### Colores a usar (consistente con el proyecto)

| Uso | Color |
|-----|-------|
| Fondo de tarjetas internas | `#1a1a1a` |
| Borde sutil | `1px solid #333` o `1px solid #374151` |
| Texto principal | `white` / `#ffffff` |
| Texto secundario | `#9ca3af` |
| Texto terciario | `#6b7280` |
| Acento primario (botones) | `#10b981` (verde, mismo que INGRESO) |
| Acento tabs activo | `#10b981` |
| Acento tabs inactivo | `#1f2937` |
| Botón peligro (eliminar) | `#ef4444` con fondo `rgba(239,68,68,0.1)` |
| Input fondo | `#1a1a1a` |
| Input borde | `#333` |
| Input texto | `white` |
| Label | `#9ca3af`, `fontSize: 0.7rem`, `fontWeight: bold` |

### Estilo de Inputs

```js
const inputDark = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '8px',
  color: 'white',
  outline: 'none',
  fontSize: '0.85rem'
};
```

### Estilo de Selects (mismo que inputs pero con apariencia nativa oscura)

```js
const selectDark = {
  ...inputDark,
  appearance: 'auto',
  cursor: 'pointer'
};
```

### Estilo de Botones de Tab

```js
// Activo
{ padding: '8px 16px', borderRadius: '20px', border: 'none', 
  background: '#10b981', color: 'white', fontWeight: 'bold', 
  cursor: 'pointer', fontSize: '0.75rem' }

// Inactivo
{ padding: '8px 16px', borderRadius: '20px', border: 'none', 
  background: '#1f2937', color: '#9ca3af', fontWeight: 'bold', 
  cursor: 'pointer', fontSize: '0.75rem' }
```

### Contenedor de Línea (en Tab 3)

```js
{
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '12px',
  padding: '15px',
  marginBottom: '12px'
}
```

### Contenedor de Componentes (dentro de cada línea)

```js
{
  backgroundColor: '#0d0d0d',
  border: '1px solid #374151',
  borderRadius: '8px',
  padding: '10px',
  marginTop: '10px'
}
```

---

## 🔥 COMPATIBILIDAD CON FIREBASE

### `guardarBitacora` NO SE MODIFICA

La función existente ya usa spread `{ ...formCaso }` y `addDoc`/`updateDoc`, por lo que automáticamente guardará los nuevos campos (`consumoUsb`, `consumoFuente`, `lineasAfectadas`) sin necesidad de cambiar nada en Firebase.

```js
// Se mantiene INTACTO:
const guardarBitacora = async (e) => { 
  e.preventDefault(); 
  setMensajeCaso('Guardando...'); 
  try { 
    if (casoEditando) { 
      await updateDoc(doc(db, "historial_reparaciones", casoEditando), { ...formCaso }); 
    } else { 
      await addDoc(collection(db, "historial_reparaciones"), { ...formCaso, fecha: new Date().toISOString() }); 
    } 
    setMensajeCaso('✅ ¡Registrado!'); 
    setTimeout(() => { setBitacoraVisible(false); cargarHistorialCasos(); }, 1000); 
  } catch (e) { 
    setMensajeCaso('❌ Error.'); 
  } 
};
```

### Estructura en Firestore tras la mejora

```json
{
  "marca": "Xiaomi",
  "modelo": "POCO X3 Pro",
  "sintomas": "No enciende, consume 0.45A",
  "protocolo": "Cortocircuito en línea PP_VDD_MAIN...",
  "imgUrl": "https://...",
  "fecha": "2026-05-16T...",
  "consumoUsb": {
    "voltaje": "5.12",
    "corriente": "0.45",
    "comportamiento": "Estático",
    "conBateria": "0.02",
    "sinBateria": "0.00"
  },
  "consumoFuente": {
    "inicial": "0.00",
    "postPower": "0.15",
    "comportamiento": "Cíclico"
  },
  "lineasAfectadas": [
    {
      "id": "abc123",
      "nombre": "PP_VDD_MAIN",
      "componentes": [
        { "id": "c1", "tipo": "Capacitor", "nomenclatura": "C200", "estado": "Corto" },
        { "id": "c2", "tipo": "IC", "nomenclatura": "U2100", "estado": "Fuga" }
      ]
    }
  ]
}
```

---

## 📦 DEPENDENCIAS

**No se requieren nuevas dependencias.** Todo se construye con:
- `react` (ya instalado)
- `lucide-react` (ya instalado) — iconos: `Save`, `X`, `Plus`, `Trash2`, `ChevronDown`, `Zap`, `Usb`

---

## ⚠️ PRECAUCIONES

1. **NO usar Tailwind classes** (ej. `className="bg-gray-800"`). Usar estilos inline como el resto del proyecto.
2. **NO crear nuevos archivos CSS**. Todo va inline en el objeto `estilos` o en `globals.css`.
3. **NO modificar `guardarBitacora`** ni ninguna función Firebase.
4. **NO cambiar el `maxWidth` del modal** — se amplía de `700px` a `800px` para acomodar las tabs (es un cambio aceptable en el contenedor del modal, no en el form).
5. **Mantener el `e.stopPropagation()`** en el `motion.div` interior para que no se cierre al hacer clic dentro.
6. **El botón de cerrar (X)** debe moverse DENTRO del componente `FormularioIngresoAvanzado`, o pasarse como prop `onClose`. Recomendación: pasar `setBitacoraVisible` como prop `onClose` para que el componente pueda cerrar el modal.
7. **Backward compatibility**: Al editar casos antiguos, si no tienen los campos nuevos, inicializar con defaults vacíos (ya cubierto en el plan).

---

## 🧪 PRUEBAS POST-IMPLEMENTACIÓN

- [ ] Crear un nuevo caso con datos en las 3 pestañas. Verificar que se guarda en Firestore.
- [ ] Editar un caso existente. Verificar que carga los datos de consumo y líneas.
- [ ] Editar un caso ANTIGUO (sin los campos nuevos). Verificar que no crashea (backward compat).
- [ ] Añadir/eliminar líneas en Tab 3. Verificar que el estado se actualiza correctamente.
- [ ] Añadir/eliminar componentes dentro de una línea.
- [ ] Probar el autocompletado de nombres de línea (escribir en el input y ver sugerencias del historial).
- [ ] Verificar que el guardado no rompe el PDF (si se usa `casoReporte` en ReportePDF, verificar que no crashea con los nuevos campos).
- [ ] Verificar que el tema dark/light sigue funcionando en el modal.
