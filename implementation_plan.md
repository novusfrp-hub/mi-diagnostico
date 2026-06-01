# Plan de Implementación Actualizado: Escalas de Medición y Oscilograma en Tiempo Real en la Web

Este plan actualizado incorpora las escalas de **Ohmios ($\Omega$)**, **Voltios (V)**, **Amperios (A)** y la creación de un **Oscilograma en tiempo real (gráfico de consumo)** dentro de la aplicación web de Marshall Cell, replicando e incluso superando la experiencia visual del script de Python (`oscilograma .py`).

---

## Nuevas Escalas a Implementar
1. **Ohmios ($\Omega$):** Resistencia estática de la línea.
2. **Voltios (V):** Tensiones de alimentación activa (VBUS, LDO, PMIC).
3. **Amperios (A):** Corrientes de consumo elevadas (medición en serie de consumos de placa y carga).

---

## 1. El Oscilograma en Tiempo Real (Web canvas)
Diseñaremos e implementaremos un componente de **Oscilograma** dinámico de alto rendimiento usando la API **HTML5 Canvas** (para soportar actualizaciones fluidas a 20Hz sin sobrecargar el navegador con dependencias pesadas).

### Características del Oscilograma Web:
* **Diseño Premium:** Fondo oscuro `#1a1a1a`, rejilla de fondo en `#333333`, y línea de trazo en **Cian brillante (`#00ffff`)** con efecto de resplandor (glow CSS/canvas).
* **Buffer Desplazable (Rolling Buffer):** Mantiene las últimas 150 lecturas en un arreglo circular de tipo cola de tamaño fijo (igual a `max_puntos = 150` en Python).
* **Auto-Escala Inteligente:** Escala automáticamente el eje Y de la gráfica dinámicamente según la amplitud de los consumos o voltajes recibidos.
* **Barra de Herramientas Integrada:**
  * **⏸️ Pausar / Reanudar:** Detiene el flujo de la gráfica para analizar transitorios.
  * **📷 Capturar Foto:** Permite guardar el gráfico actual como una imagen PNG para adjuntar a reportes.
  * **Estadísticas Dinámicas:** Muestra en tiempo real los valores **MÍNIMO** y **MÁXIMO** de la sesión actual.

---

## 2. Cambios en el Parser USB y Auto-Hold (`pages/index.js`)

#### [MODIFY] [index.js](file:///d:/programacion/mi-diagnostico/pages/index.js)
* **Actualización del Parser USB (`conectarMultimetroUSB`):**
  * Si la escala activa es `'amperio'`, se forzará la unidad a `"A"`.
  * Los nuevos valores de corriente se irán inyectando de forma paralela en el buffer de datos del gráfico en tiempo real si el oscilograma está visible.
* **Auto-Hold para Amperios:**
  * Tolerancia de `0.05`A (50mA) y desactivación por debajo de `0.01`A (10mA).
* **Integración del Componente `OscilogramaPanel`:**
  * Insertar un panel colapsable o modal elegante debajo del Visor HUD principal en la web que renderice el lienzo canvas del gráfico.

---

## 3. Actualización de Base de Datos y Componentes

#### [MODIFY] [FPCInteligente.js](file:///d:/programacion/mi-diagnostico/components/FPCInteligente.js)
#### [MODIFY] [ICInteligente.js](file:///d:/programacion/mi-diagnostico/components/ICInteligente.js)
* **Soporte para 5 Escalas:** Añadir botones en el panel y selectores para Diodo, uA, Ohmios, Voltios y Amperios.
* **Esquema extendido:**
  * `valorSanoAmperio`, `valorActualAmperio` para pines y pads.
  * `docktestAmperio` para Docktest.
* **Fórmula de Diagnóstico de Color para Amperios:**
  * **Corto:** Lecturas superiores a `1.5`A en líneas no preparadas para alta potencia.
  * **Sano:** Diferencias menores o iguales a `0.05`A respecto a la referencia sana.

---

## Plan de Verificación

1. **Prueba de Renderizado del Canvas:** Comprobar la fluidez de la línea cian brillante de consumo al variar el consumo del multímetro.
2. **Prueba de Captura y Botón Foto:** Guardar el oscilograma en PNG y verificar que la imagen del diagnóstico de consumo se descargue correctamente en el PC.
3. **Prueba de Multiescala Amperios (A):** Validar que al medir corrientes grandes de carga se capturen y muestren correctamente como `0.85 A`, `1.20 A` sin activar la advertencia de escala incorrecta.
