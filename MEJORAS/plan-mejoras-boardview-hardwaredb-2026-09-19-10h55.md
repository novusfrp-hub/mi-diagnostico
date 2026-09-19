# Plan de Implementación: Optimización Visual de Boardview Pro y Navegación Jerárquica en Hardware DB
**Fecha de Creación:** 19 de Septiembre de 2026 - 10:55 AM
**Ubicación:** `MEJORAS/plan-mejoras-boardview-hardwaredb-2026-09-19-10h55.md`

Este plan aborda las correcciones y mejoras solicitadas en el entorno de trabajo:
1. **Eliminación de barras y textos redundantes en Boardview Pro.**
2. **Lógica de deselección al hacer clic afuera en Modo Puntero.**
3. **Panel derecho "Detalles de Selección" colapsable, auto-apertura y eliminación de coordenadas irrelevantes.**
4. **Reestructuración de navegación en "Hardware DB" (Marcas ➔ Modelos ➔ Mediciones).**
5. **Registro persistente de planes en la carpeta `MEJORAS/` con fecha y hora.**

---

## 1. Verificación del Archivo de Mejoras del 18/09/2026

- **Diagnóstico realizado:** Se inspeccionó la carpeta `MEJORAS/`, el archivo `mejoras .txt` y el registro de Git.
- **Resultado:** Ayer viernes 18/09/2026 se realizaron 3 commits directamente en código (`F1.2`, `F1.3`, `F1.4` en `components/VisorMapeoPCB.js` y `pages/index.js`), pero **no se guardó un archivo de texto o markdown** en la carpeta `MEJORAS/`.
- **Acción adoptada:** Para asegurar que ningún plan se pierda si se cierra el navegador o la sesión, cada plan quedará guardado permanentemente en `MEJORAS/` con su fecha y hora exacta.

---

## 2. Diagnóstico Técnico de los Puntos Solicitados

### A. Redundancia de Barras en Boardview Pro
- **Causa raíz:** En `pages/index.js` (L2548-L2569), el contenedor del modal `modalBoardviewAbierto` renderiza una barra superior propia (`BOARDVIEW PRO`, marca, modelo, sector y botón de cerrar). Inmediatamente dentro, el componente `components/VisorMapeoPCB.js` (L1411-L1782) renderiza **otra cabecera completa** con los mismos datos, herramientas, selector de sector y cara, buscador y botón de cerrar.
- Además, en la barra inferior de capas, se repite cuatro veces seguidas la etiqueta `[ Cara A · Placa Completa ]` en los botones de "Placa", "Ver Foto", "Subir Foto" y "URL".

### B. Deselección al hacer clic afuera (Modo Puntero)
- **Explicación:** En la versión actual, el evento `onMouseDown` del contenedor no contempla limpiar la selección cuando la herramienta activa es `'select'` y se hace clic sobre un espacio vacío de la placa. Por ello, el pin o componente previamente seleccionado se quedaba fijado.
- **Comportamiento correcto:** Al estar en modo `Puntero`, hacer clic sobre el fondo o área libre debe desmarcar el pin y componente activo (`selectedCompId = null`, `selectedPadId = null`).

### C. Panel Lateral Derecho ("Detalles de Selección")
- **Coordenadas innecesarias:** Se removerá la línea `Posición: (...)` y `Tamaño: (...)` que mostraba decimales irrelevantes para el técnico reparador.
- **Colapso manual:** Añadir botón discreto de colapso/cierre (`ChevronRight` / `X`) en la esquina superior del panel.
- **Botón flotante de reapertura:** Cuando el panel esté cerrado, se muestra una pestaña delgada en el borde derecho para abrirlo manualmente.
- **Apertura automática inteligente:** Cuando el técnico haga clic sobre cualquier pin o componente en la placa, el panel lateral se desplegará automáticamente si estaba oculto.

### D. Flujo de Navegación en Hardware DB (Marcas ➔ Modelos ➔ Mediciones)
- **Problema actual:** Al abrir Hardware DB, se muestran simultáneamente en la misma pantalla el multímetro, los analizadores (Docktest, Planos FPC, Boardview, etc.) y una lista plana de todos los teléfonos mezclados.
- **Nuevo flujo escalonado:**
  1. **Nivel 1 (Marcas):** Vista inicial que agrupa los equipos por marca (Xiaomi, Samsung, Motorola, Apple, etc.) en tarjetas visuales limpias. Tapa u oculta los módulos de medición complejos para no saturar.
  2. **Nivel 2 (Modelos):** Al seleccionar una marca, se presenta la lista/grilla de modelos pertenecientes a esa marca (ej. Samsung A12, Samsung A32, etc.) con opción de agregar un nuevo modelo para esa marca.
  3. **Nivel 3 (Mediciones):** Al elegir el modelo, se habilitan y despliegan los tipos de medición disponibles (Boardview PCB, Docktest, Planos FPC, Batería, IC/BGA, RFFE) junto con el HUD del multímetro.
  4. **Navegación:** Botón de retroceso (`← Volver a Marcas` / `← Volver a Modelos`) o migas de pan para cambiar de equipo fluidamente.

---

## 3. Propuesta de Cambios Detallada

### Componente: Boardview Pro

#### `pages/index.js`
- Eliminar la barra de cabecera redundante en el modal de Boardview (`modalBoardviewAbierto`), permitiendo que `VisorMapeoPCB.js` gobierne al 100% la pantalla completa de forma unificada.

#### `components/VisorMapeoPCB.js`
1. **Cabecera y Barra de Capas:**
   - Limpiar etiquetas repetitivas en la barra de capas: sustituir `Ver Foto [ Cara A · Placa Completa ]` por `Ver Foto`, `Subir Foto`, `Pegar URL`, etc.
2. **Deselección en Modo Puntero:**
   - En `handleMouseDown`, si `tool === 'select'` y el clic no ocurrió dentro de un componente/pad, invocar `setSelectedCompId(null)` y `setSelectedPadId(null)`.
3. **Panel "Detalles de Selección":**
   - Estado `sidebarAbierto` (por defecto `true` o condicional a selección).
   - Eliminar los campos de texto `Posición` y `Tamaño`.
   - Botón en la cabecera del sidebar para colapsar (`setSidebarAbierto(false)`).
   - Pestaña lateral flotante para reabrir si está colapsado.
   - En el evento de clic de selección de un pad o componente, asegurar `setSidebarAbierto(true)`.

---

### Componente: Hardware DB

#### `pages/index.js`
1. **Estados de navegación:**
   - `marcaSeleccionadaDb` (null por defecto).
   - `vistaDbNivel`: `'marcas'` | `'modelos'` | `'mediciones'`.
2. **Agrupación dinámica:**
   - Agrupar `modelosLibreria` por su campo `marca` (con conteo de modelos por marca).
3. **Pantalla Nivel 1 (Marcas):**
   - Grilla elegante con tarjetas de marcas (logo/icono, nombre de marca, cantidad de modelos guardados).
   - Botón para registrar nueva marca o nuevo modelo.
4. **Pantalla Nivel 2 (Modelos de la marca):**
   - Encabezado con `← Volver a Marcas` y el título de la marca activa.
   - Grilla/lista de modelos de esa marca (ej. A12, A32, Poco X3...).
   - Botón rápido `+ Añadir Modelo a {marca}`.
5. **Pantalla Nivel 3 (Mediciones del modelo):**
   - Al seleccionar el modelo, se visualizan los módulos de diagnóstico (Boardview PCB, Docktest, Planos FPC, etc.) y el HUD del multímetro.
   - Barra superior con botón `← Cambiar Modelo` o `← Cambiar Marca`.

---

## 4. Plan de Verificación

### Pruebas Manuales
1. **Boardview Pro - Verificación Visual de Cabeceras:**
   - Abrir Boardview Pro y confirmar que solo existe **una única barra superior**, sin duplicados de títulos ni información repetida.
   - Verificar que la barra de capas de foto tenga nombres concisos (`Ver Foto`, `Subir Foto`, `URL`).
2. **Boardview Pro - Deselección:**
   - Seleccionar un pin de cualquier componente en modo puntero.
   - Hacer clic en un área vacía de la placa y comprobar que el pin y el componente se desmarcan inmediatamente.
3. **Boardview Pro - Panel Lateral:**
   - Confirmar que ya no aparecen la posición ni el tamaño numéricos.
   - Hacer clic en el botón para colapsar el panel lateral.
   - Hacer clic en un pin de la placa y verificar que el panel se abre automáticamente.
4. **Hardware DB - Flujo Escalonado:**
   - Abrir Hardware DB desde el menú principal.
   - Verificar que primero se presentan las marcas sin abrir visores innecesarios.
   - Seleccionar una marca (ej. Samsung o Xiaomi) y verificar que aparecen únicamente sus modelos.
   - Seleccionar un modelo y confirmar que ahora sí se presentan las mediciones (Boardview, Docktest, Planos) y el multímetro.
   - Usar el botón de retroceso para volver a modelos o marcas sin recargar la página.
