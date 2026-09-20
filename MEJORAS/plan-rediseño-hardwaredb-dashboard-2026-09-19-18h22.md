# Plan de Implementación: Rediseño de Hardware DB - Dashboard Visual por Niveles (Opción A)

**Fecha y Hora:** 19/09/2026 18:22  
**Proyecto:** mi-diagnostico (Marshall Cell)

---

## 1. Descripción del Objetivo
Eliminar la barra lateral izquierda redundante de la **Hardware DB**, transformando la interfaz en un **Dashboard visual limpio a pantalla completa** estructurado en niveles ergonómicos. Reemplazar los campos de texto fijos de creación por un botón de acción superior `[ + Añadir Teléfono ]` que despliega un modal profesional centrado con selector inteligente de marcas.

---

## 2. Diagnóstico y Problemas a Resolver
1. **Redundancia visual (Doble Menú):** Actualmente, las marcas se muestran dos veces en pantalla de manera simultánea: una lista vertical a la izquierda y tarjetas con las mismas marcas en el centro.
2. **Formulario fijo estorboso en el sidebar:** Los campos de texto `Marca` y `Modelo` ocupan espacio vertical continuo sin necesidad.
3. **Falta de buscador unificado:** No existe un filtro en tiempo real para encontrar marcas o modelos rápidamente cuando la base de datos crece.

---

## 3. Cambios Propuestos

### Componente: `pages/index.js`

#### A. Eliminación de la Barra Lateral Duplicada (`modal-lib-side`)
- Retirar el contenedor `modal-lib-side` (líneas 1953-2025).
- El área principal ahora ocupa el **100% del ancho del modal** (`width: 95vw`, `max-width: 1600px`, `height: 95vh`).

#### B. Barra Superior Unificada con Buscador y Acción Principal
- **Lado izquierdo:**
  - Botones de navegación contextual: `← Volver a Marcas` (en Nivel 2) y `← Volver a Modelos` (en Nivel 3).
  - Migas de pan (*breadcrumbs*): `HARDWARE DB` / `[MARCA]` / `[MODELO]`.
- **Centro:**
  - Buscador rápido con filtro reactivo en tiempo real (`🔍 Buscar marca o modelo...`).
- **Lado derecho:**
  - Botón principal de acción: `[ + Añadir Teléfono ]` (color violeta `#8b5cf6` con icono).
  - Botón `[ Guardar ]` (solo visible en Nivel 3 cuando se están editando mediciones).
  - Botón de cierre `[ X ]`.

#### C. Nuevo Modal Profesional: "Añadir Teléfono" (`modalNuevoDispositivoAbierto`)
- Modal emergente enfocado y centrado:
  - **Selector de Marca:** Menú desplegable con las marcas existentes en la base de datos (`Samsung`, `Redmi`, `ZTE`, etc.) para evitar marcas duplicadas por errores ortográficos.
  - **Opción "+ Nueva Marca":** Permite escribir una marca que aún no existe. Si el usuario ya está navegando dentro de una marca (Nivel 2), esta se preselecciona automáticamente.
  - **Campo de Modelo:** Input limpio para el nombre del modelo (ej: `Galaxy A12`, `Redmi Note 11`).
  - **Botones:** `Cancelar` y `Guardar y Abrir`.
  - Al guardar, crea el modelo en Firestore y navega automáticamente al espacio de trabajo de dicho modelo.

#### D. Vistas Principales a Pantalla Completa
- **Nivel 1 (Marcas):**
  - Grilla responsiva de tarjetas de marcas con icono de dispositivo, contador de modelos y efecto hover brillante.
  - Barra de estadísticas: Total de marcas y total de modelos registrados.
- **Nivel 2 (Modelos de la Marca Seleccionada):**
  - Encabezado con el nombre de la marca, botón `← Volver a Marcas` y botón secundario `[ + Añadir Modelo a esta Marca ]`.
  - Grilla de modelos con sus etiquetas de contenido: `🗺️ BOARDVIEW`, `FPC`, `Batería`, `IC`.
- **Nivel 3 (Mediciones):**
  - Espacio de trabajo técnico con HUD del multímetro y pestañas completas (`Docktest`, `Planos FPC`, `FPC Batería`, `Planos IC / BGA`, `Módulo RFFE`, `Boardview PCB`).

---

## 4. Plan de Verificación
1. **Verificación de Cero Redundancia:**
   - Confirmar que al abrir Hardware DB no existe barra lateral izquierda duplicada y las marcas ocupan toda la pantalla.
2. **Prueba del Botón y Modal "+ Añadir Teléfono":**
   - Abrir el modal desde la barra superior.
   - Seleccionar una marca existente y escribir un nuevo modelo; verificar que se cree y se abra de inmediato.
   - Probar la opción de "+ Nueva Marca" y confirmar que se agregue a la lista de marcas disponibles.
3. **Prueba de Navegación por Niveles:**
   - Hacer clic en una marca (ej: Samsung) → verificar que cargue los modelos y muestre `← Volver a Marcas`.
   - Hacer clic en un modelo (ej: Samsung A12) → verificar que abra el HUD y las herramientas de medición.
   - Pulsar `← Volver a Modelos` y verificar que retorne correctamente a la lista de modelos de Samsung.
