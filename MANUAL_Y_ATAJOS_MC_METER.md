# Manual de Operación y Atajos de Teclado: Marshall MC-Meter Pro (KM003C)

**Instrumento:** Marshall MC-Meter Pro (USB HID Tester KM003C)  
**Plataforma:** `mi-diagnostico` (Marshall Cell Diagnostic Platform)  
**Tipo de Integración:** 100% Nativa en Navegador (`WebHID API` - Cero Python)  

---

## 1. Atajos de Teclado (Osciloscopio Pantalla Completa)

Cuando la ventana del **Analizador Oscilograma** está abierta, puedes usar los siguientes atajos rápidos desde el teclado:

| Tecla | Función | Descripción |
| :---: | :--- | :--- |
| <kbd>H</kbd> | **Alternar HUD Cursor (ON / OFF)** | Muestra u oculta el recuadro flotante cian con las lecturas en vivo que sigue el ratón. Al desactivarlo, la pantalla queda 100% limpia para ver las trazas sin obstáculos. Aplica en **todos los perfiles** (*Power*, *Carga USB-C*, *Buck*). |
| <kbd>Espacio</kbd> | **Pausar / Reanudar en Vivo** | Congela la señal en pantalla instantáneamente para inspección minuciosa sin perder datos en memoria. Al volver a pulsar reanuda la transmisión en tiempo real. |
| <kbd>R</kbd> | **Resetear Zoom (Escala Original)** | Restaura inmediatamente el zoom horizontal y vertical a la escala automática completa calculada por el tester. |
| <kbd>S</kbd> | **Conmutar Split View (2 Carriles)** | Alterna entre vista de trazos superpuestos y **2 carriles separados**: Carril superior para Voltaje (`MAIN` / `VBUS` en rojo) y Carril inferior para Corriente (`IBUS` en amarillo). |

> [!TIP]
> Los atajos funcionan en cualquier momento, siempre que no tengas el cursor dentro de una caja de texto o formulario.

---

## 2. Controles y Acciones con el Ratón

| Acción del Ratón | Resultado en Pantalla |
| :--- | :--- |
| **Clic Izquierdo y Arrastrar (Box-Zoom)** | Dibuja un recuadro rectangular punteado cian sobre cualquier pico o transitorio. Al soltar, el oscilograma aísla y amplía ese fragmento exacto en tiempo y amplitud. |
| **Clic Izquierdo Simple** | Fija el **Cursor / Marca A** (`#22d3ee`). |
| **Clic Derecho Simple** | Fija el **Cursor / Marca B** (`#e879f9`). |
| **Medición Delta Automática (A - B)** | Con ambas marcas colocadas, la barra superior calcula en tiempo real:<br>• $\Delta t$: Intervalo de tiempo transcurrido en milisegundos.<br>• $I_{\text{prom}}$: Corriente promedio en ese lapso.<br>• $I_{\text{pico}}$: Corriente máxima alcanzada. |
| **Rueda del Ratón (Scroll Wheel)** | Amplía o reduce el zoom horizontal temporalmente, centrado en el punto del puntero. |
| **Doble Clic (Izquierdo o Derecho)** | Restablece el zoom original por defecto (equivalente a pulsar <kbd>R</kbd> o el botón `🔄 Reset Zoom`). |

---

## 3. Modos Oficiales de Muestreo de Hardware (SPS)

El hardware físico del tester **KM003C** cuenta con un botón en su lateral que conmuta el convertidor ADC interno entre exactamente **4 velocidades oficiales**:

```
[ Botón Físico KM003C ] ──> ( 2 SPS  ──>  10 SPS  ──>  50 SPS  ──>  1Ksps )
```

| Modo SPS | Muestras / Seg | Uso Recomendado en Taller |
| :---: | :---: | :--- |
| **`2 SPS`** | 2 muestras/s | Monitoreo de reposo prolongado y consumo ultra bajo sin generar gran volumen de datos. |
| **`10 SPS`** | 10 muestras/s | Lectura estable de cargadores y consumos en estado estacionario. |
| **`50 SPS`** | 50 muestras/s | Detección de protocolos de carga rápida (QC, PD) y transitorios moderados. |
| **`1Ksps`** | 1000 muestras/s | **Modo Diagnóstico de Microelectrónica:** Permite capturar secuencias de arranque (**Power 1s**), picos de inicialización del PMIC, líneas Buck de CPU y elevadores de Backlight a 1 milisegundo de resolución temporal. |

*La plataforma en el navegador detecta automáticamente cuál de estos 4 modos está seleccionado en el aparato y lo indica en la insignia superior de telemetría.*

---

## 4. Perfiles de Diagnóstico Especializados

En la barra superior del oscilograma puedes alternar entre 3 perfiles con un clic:

### A. 🚀 Power (1s / Arranque)
* **Objetivo:** Diagnóstico de encendido en placas móviles y fallas de PMIC.
* **Nomenclatura de Voltaje:** **`MAIN`** (representa de forma universal VBAT, VPH_PWR, VDD_MAIN o entrada de batería).
* **Nomenclatura de Corriente:** **`CORRIENTE ARRANQUE (A / mA)`**.
* **Disparador Automático ($t = 0$):** Al pulsar `⚡ Auto-Trigger Power (>15mA)`, el oscilograma espera en silencio y dispara la captura en cuanto se presiona el botón Power del móvil, anclando el inicio a $t = 0.000\text{ s}$.

### B. ⚡ Carga USB-C
* **Objetivo:** Análisis de potencia y protocolos en el puerto Type-C.
* **Nomenclatura de Voltaje:** **`VBUS`** (5V, 9V, 12V, 15V, 20V EPR).
* **Pines Activos:** Monitor de `D+` (verde), `D-` (amarillo), `CC1` (azul) y `CC2` (morado). El pin de orientación activo ($>0.25\text{V}$) se enmarca con borde esmeralda.

### C. 💡 Buck / Backlight
* **Objetivo:** Inyección de tensión en rieles secundarios y diagnóstico de circuitos booster de pantalla.
* **Nomenclatura de Voltaje:** **`BUCK / MAIN`** (permite verificar si la línea está en su tensión nominal de 0.8V, 1.2V, 1.8V, o si el circuito elevador de Backlight alcanza 18V–35V).
* **Nomenclatura de Corriente:** **`CONSUMO (A / mA)`**.

---

## 5. Recuadro Flotante del Cursor (HUD Cursor)

Al mover el ratón sobre el gráfico, se proyecta una línea vertical y un recuadro de telemetría con los valores instantáneos de ese milisegundo.

* **Cómo activarlo o desactivarlo:**
  * **Método 1:** Presionar la tecla <kbd>H</kbd>.
  * **Método 2:** Clic en el botón **`🎯 HUD Cursor: ON [H]`** ubicado en la barra superior secundaria (junto a Delta).
  * **Método 3:** Clic en el botón **`🎯 HUD Cursor: ON`** de la barra inferior de controles.
* **Alcance:** Funciona y se desactiva exactamente igual en los 3 perfiles (*Power*, *Carga USB-C*, *Buck*).

---

## 6. Acoplamiento Simétrico (50% / 50%) en MARSHALL HARDWARE SUITE

Dentro de cada modelo de la librería (`nivelDb === 'mediciones'`):
* **Lado Izquierdo (50%):** Multímetro UNI-T UT61E+ (Diodo, uA, Avance Mágico, Voz).
* **Lado Derecho (50%):** Marshall MC-Meter Pro (`MCMeterDockPanel.jsx`).
* **Botón `🗗 Desacoplar`:** Convierte el panel en un Mini-HUD flotante arrastrable para poder navegar por Planos FPC o Boardview PCB mientras mides.
* **Bahía de Re-acoplamiento:** Su espacio original no queda vacío; muestra una tarjeta cian con telemetría en vivo y el botón **`🔗 Re-Acoplar Instrumento Aquí`**.
* **Auto-Restauración:** Si cierras el Mini-HUD flotante con la `✕` o cierras el oscilograma grande, el instrumento **vuelve automáticamente a su posición original del 50%**.

---

## 7. Banco de Muestras Golden (Comparador de Curvas)

* **¿Qué es una Curva Golden?** Es el oscilograma de encendido grabado de un equipo sano idéntico.
* **Cómo guardarla:** Con el equipo sano encendiendo en pantalla, pulsa **`💾 Guardar Curva Golden`**. Se optimiza a 250 puntos y se almacena en la nube (Firestore) vinculada al modelo.
* **Cómo comparar:** Al diagnosticar un equipo averiado del mismo modelo, abre el desplegable **`COMPARADOR GOLDEN`** y elige la curva sana: aparecerá la silueta cian translúcida (`rgba(0, 255, 255, 0.40)`) en el fondo. La curva viva amarilla del teléfono roto se dibujará encima, haciendo evidente cualquier consumo excesivo, fuga previa o caída prematura de PMIC.
