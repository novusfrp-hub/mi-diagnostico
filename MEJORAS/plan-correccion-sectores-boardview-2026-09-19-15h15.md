# Plan de Corrección: Distinción entre Caras (A/B), Placa Completa y Sectores Específicos en Boardview Pro

**Fecha y Hora:** 19/09/2026 15:15  
**Proyecto:** mi-diagnostico (Marshall Cell)

---

## 1. Contexto y Diagnóstico del Problema

El usuario subió una imagen y mapeó un componente SMD (C1401) para un **Samsung A12**, correspondiente a la sección de **Backlight / Pantalla LCD en la Cara A**. Sin embargo, la interfaz de Boardview Pro muestra repetidamente:
- `📍 SECTOR: Placa Completa`
- `[ CARA A • PLACA COMPLETA (🟢 Mapeado) ]`
- `Cara A · Placa Completa (1)`

Esto generó la confusión de que el sistema asume que por estar en la "Cara A", la foto es obligatoriamente de la placa completa entera. El usuario explica que:
1. Una placa tiene dos lados físicos: **Cara A** y **Cara B**.
2. Una foto puede ser de la **Placa Completa** (macro de toda la placa) O de una **Sección / Sector específico** (ej: Backlight, PMIC, CPU, FPC) perteneciente a la Cara A o Cara B.
3. El usuario subió una sección pequeña (Backlight LCD en Cara A), pero quedó guardada bajo el nombre por defecto `Placa Completa` sin forma de reasignarla o renombrarla sin perder la foto y el componente dibujado.
4. Cuando se elija Placa Completa, debe quedar claro que es la vista general macro; y cuando se elija una sección (Backlight), debe mostrarse como Cara A · Backlight, sin mezclarlo con "Placa Completa".

---

## 2. Cambios Técnicos a Implementar

### A. Sistema de Reasignación y Renombrado de Sectores en `components/VisorMapeoPCB.js`
- **Función `reasignarSectorActivo(nuevoNombreSector)`:**
  - Toma los datos del sector actual (`imgPlacaCaraAUrl`, `imgPlacaCaraBUrl`, `imgEsquemaUrl`, `componentes`).
  - Los traslada en el diccionario `sectores` bajo la nueva clave `nuevoNombreSector`.
  - Limpia o reemplaza la clave anterior si era un sector temporal.
  - Actualiza el estado reactivo `sectorPlaca` a `nuevoNombreSector`.
  - Notifica a la aplicación mediante `onCambios` y guarda inmediatamente.
- **Botón `✏️ Reasignar / Renombrar Sector`:**
  - Ubicado en la barra superior junto al selector de sector y en el Explorador de Sectores.
  - Abre un modal con opciones predeterminadas (`💡 Backlight / Pantalla LCD`, `⚡ Área Carga / PMIC`, `🧠 Área CPU / Memoria UFS`, etc.) y campo para nombre personalizado.
- **Banner / Asistente inteligente:**
  - Si el sector actual es `Placa Completa` y contiene componentes o fotos, muestra una barra de acción contextual:
    `"💡 ¿Esta foto es de una sección específica (ej: Backlight LCD)? [ Reasignar a Backlight / Pantalla LCD ]"`
    Permitiendo corregir el Samsung A12 con un solo clic.

### B. Separación Conceptual Clara: Placa Completa vs Secciones Específicas
- **Selector de Sector con grupos semánticos:**
  - 📐 **PLACA COMPLETA (VISTA GENERAL MACRO)**: Toda la placa general (Cara A / Cara B).
  - 🔍 **SECCIONES / SECTORES ESPECÍFICOS (MICROSCOPIO)**: Backlight / Pantalla LCD, Área Carga / PMIC, etc.
- **Eliminación del badge confuso `CARA A • PLACA COMPLETA`:**
  - Si el sector es `Placa Completa`: Muestra `📐 Placa Completa · Cara A/B`.
  - Si el sector es una sección: Muestra `🔍 Cara A · Backlight / Pantalla LCD`.
  - En la lista inferior derecha: `Cara A · Backlight / Pantalla LCD (1)`.

### C. Detección Inteligente al Cambiar de Sector
- Si el usuario está en un sector con datos (ej: `Placa Completa`) y selecciona en el menú desplegable un sector nuevo/vacío (ej: `Backlight / Pantalla LCD`), el sistema le consulta:
  - **Mover y Reasignar todo:** Traslada la foto y componentes al nuevo sector.
  - **Abrir sector nuevo y vacío:** Para iniciar un mapeo independiente.

### D. Sincronización en `pages/index.js`
- Incluir `sectores` en el hook `useEffect` de `onCambios` en `VisorMapeoPCB.js` para asegurar que `boardviewSectores` y `boardviewSector` se sincronicen continuamente con Firestore y localStorage.

---

## 3. Verificación
1. Probar en el Samsung A12 que al pulsar "Reasignar a Backlight / Pantalla LCD", la foto y el capacitor C1401 se preservan intactos y el sector cambia inmediatamente a `Backlight / Pantalla LCD`.
2. Verificar que los textos digan `Cara A · Backlight / Pantalla LCD` sin mencionar "Placa Completa".
3. Probar la creación de nuevos sectores sin interferir con los existentes.
