# Plan de Optimización: Densidad Visual Compacta, Botón Inicio Directo y Reset de Navegación en Hardware DB

**Fecha:** 2026-09-19 19:25  
**Archivo afectado:** `pages/index.js`  
**Objetivo:** Adaptar la Base de Datos de Hardware a gran escala reduciendo el tamaño visual de las tarjetas/botones a ~1/4 del tamaño actual (modo catálogo de alta densidad), agregando un botón directo `[ 🏠 Inicio ]` para evitar clics repetitivos de retroceso, y garantizando que el modal siempre se abra desde la raíz (Marcas).

---

## 1. Problemas Identificados y Solución Propuesta

1. **Tamaño excesivo de tarjetas (Escalabilidad de catálogo):**
   - *Problema:* Las tarjetas de Marcas (`minmax(250px, 1fr)`) y Modelos (`minmax(280px, 1fr)`) consumían entre 170px y 190px de alto con rellenos y tipografías gigantes, impidiendo visualizar un catálogo amplio de dispositivos sin hacer scroll infinito.
   - *Solución:* Rediseñar las tarjetas a estilo botones/tiles horizontales y compactos (~1/4 del volumen actual):
     - **Marcas:** Rejilla `minmax(130px, 1fr)` con altura ~50px, mini-icono de 16px, nombre de marca claro y badge con cantidad de modelos. Permite entre 8 y 10 marcas por fila.
     - **Modelos:** Rejilla `minmax(160px, 1fr)` con altura ~70px, nombre de modelo en negrita, micro-badges de estado (`BV`, `FPC:n`, `🔋`, `IC:n`). Permite decenas de modelos en pantalla simultáneamente.

2. **Falta de Botón de Inicio Directo:**
   - *Problema:* Estando en Nivel 3 (Mediciones), el usuario debía hacer clic en varios botones de retroceso para volver al listado general de marcas.
   - *Solución:* Incorporar un botón fijo y visible `[ 🏠 Inicio ]` en la barra superior que resetea a Nivel 1 en un solo clic desde cualquier pantalla.

3. **Comportamiento de memoria indeseado al abrir:**
   - *Problema:* `abrirLibreria()` comprobaba `if (modeloActivo)` y abría directamente en mediciones del último modelo abierto en vez de iniciar en la vista principal.
   - *Solución:* Garantizar que `abrirLibreria()` siempre inicialice `nivelDb = 'marcas'`, `marcaDbSeleccionada = null` y limpie la búsqueda `busquedaHardwareDb = ''`.

---

## 2. Detalle de Cambios en `pages/index.js`

1. **`abrirLibreria()`:**
   - Remover la condición que retenía `modeloActivo`.
   - Establecer incondicionalmente:
     ```javascript
     setNivelDb('marcas');
     setMarcaDbSeleccionada(null);
     setBusquedaHardwareDb('');
     ```

2. **Barra Superior:**
   - Añadir botón `[ 🏠 Inicio ]` con icono `Home` cuando `nivelDb !== 'marcas'`.
   - Mantener botón contextual `[ ← Atrás ]` (`← Volver a Marcas` en Nivel 2, `← Volver a {Marca}` en Nivel 3).
   - Breadcrumbs interactivos `HARDWARE DB / MARCA / MODELO`.

3. **Nivel 1 (Marcas):**
   - Rejilla densa `repeat(auto-fill, minmax(130px, 1fr))` con `gap: 10px`.
   - Padding compacto `10px 14px`.
   - Mini badge violeta con icono `Smartphone` de 16px.
   - Conteo de modelos en micro badge cyan.

4. **Nivel 2 (Modelos):**
   - Rejilla densa `repeat(auto-fill, minmax(160px, 1fr))` con `gap: 10px`.
   - Altura compacta ~70px.
   - Badges funcionales compactos (`BV`, `FPC:n`, `🔋`, `IC:n`).

---

## 3. Plan de Verificación
- Verificar apertura de la librería asegurando que siempre entra a Nivel 1 (Marcas).
- Comprobar que en Nivel 2 y Nivel 3 el botón `[ 🏠 Inicio ]` regresa inmediatamente a Nivel 1.
- Verificar la densidad visual de las tarjetas permitiendo ver muchas marcas y modelos en un solo vistazo.
- Asegurar que el buscador en tiempo real y la creación de dispositivos sigan funcionando fluidamente.
