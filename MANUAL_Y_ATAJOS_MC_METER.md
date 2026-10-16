# Manual de Operación y Referencia de Funciones: Marshall MC-Meter Pro (KM003C)

**Instrumento:** Marshall MC-Meter Pro (USB HID Tester KM003C)  
**Plataforma:** `mi-diagnostico` (Marshall Cell Diagnostic Platform)  
**Tipo de Integración:** 100% Nativa en Navegador (`WebHID API` - Cero dependencias de Python)  

---

## 1. Atajos de Teclado (Osciloscopio Pantalla Completa)

Cuando la ventana del **Analizador Oscilograma** está abierta, puedes utilizar los siguientes atajos rápidos directamente desde el teclado:

| Tecla | Función | Descripción |
| :---: | :--- | :--- |
| <kbd>H</kbd> | **Alternar HUD Cursor (ON / OFF)** | Muestra u oculta el recuadro flotante con lecturas en vivo que acompaña al ratón. Al desactivarlo, la pantalla queda 100% limpia para inspeccionar trazas y anomalías sin obstáculos. Aplica en **todos los perfiles** (*Power*, *Carga USB-C*, *Buck*). |
| <kbd>Espacio</kbd> | **Pausar / Reanudar en Vivo** | Congela la señal en pantalla instantáneamente para inspección minuciosa sin perder datos en memoria. Al volver a pulsar reanuda la transmisión en tiempo real. |
| <kbd>R</kbd> | **Resetear Zoom (Escala Original)** | Restaura inmediatamente el zoom horizontal y vertical a la escala automática completa calculada por el tester. |
| <kbd>S</kbd> | **Conmutar Split View (2 Carriles)** | Alterna entre vista de trazos superpuestos y **2 carriles separados**: Carril superior para Voltaje (`MAIN` / `VBUS` en rojo) y Carril inferior para Corriente (`IBUS` / `CONSUMO` en amarillo). |

> [!TIP]
> Los atajos funcionan en cualquier momento, siempre que el foco no esté dentro de un campo de texto o menú desplegable.

---

## 2. Controles y Acciones con el Ratón

| Acción del Ratón | Resultado en Pantalla |
| :--- | :--- |
| **Clic Izquierdo y Arrastrar (Box-Zoom)** | Dibuja un recuadro rectangular punteado cian sobre cualquier pico o transitorio. Al soltar, el oscilograma aísla y amplía ese fragmento exacto en tiempo (eje X) y amplitud (eje Y). |
| **Clic Izquierdo Simple** | Fija el **Cursor / Marca A** (`#22d3ee` cian). |
| **Clic Derecho Simple** | Fija el **Cursor / Marca B** (`#e879f9` magenta). |
| **Medición Delta Automática (A - B)** | Con ambas marcas colocadas, la barra superior calcula en tiempo real:<br>• $\Delta t$: Intervalo de tiempo transcurrido en milisegundos.<br>• $I_{\text{prom}}$: Corriente promedio en ese lapso exacto.<br>• $I_{\text{pico}}$: Corriente máxima alcanzada dentro del tramo delimitado. |
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

*La plataforma en el navegador detecta automáticamente cuál de estos 4 modos está seleccionado en el aparato mediante el análisis de cambios en los registros de tensión y corriente del ADC, indicándolo en la insignia superior de telemetría sin retrasos.*

---

## 4. Guía Exhaustiva de Botones y Funciones por Vista

### A. Panel Acoplado (`MCMeterDockPanel.jsx`) — 50% en Marshall Hardware Suite
Ubicado junto al multímetro UT61E+ en la vista de mediciones del modelo:

1. **`● Indicador LED de Conexión`**:
   * **Verde brillante:** Conectado mediante WebHID nativo y transmitiendo datos activamente.
   * **Rojo:** Desconectado o en espera de conexión.
2. **`Insignia SPS`**: Muestra la frecuencia física real del ADC (`2 SPS`, `10 SPS`, `50 SPS`, `1Ksps`).
3. **`CONECTAR USB / DESCONECTAR`**: Abre el selector de dispositivos USB WebHID del navegador filtrando por Vendor ID `0x5FC9` y Product ID `0x0063`.
4. **`🔬 6 DIG / 3 DIG` (Modo Avanzado)**: Alterna entre resolución estándar de 3 decimales y resolución de laboratorio de 6 decimales (con micro-dígitos en subíndice visual).
5. **`📈 OSCILOGRAMA`**: Despliega la ventana de pantalla completa del osciloscopio analizador con motor gráfico Canvas a 60 FPS.
6. **`🗗 DESACOPLAR (OBS)`**: Abre una **Ventana Pop-out Nativa del Sistema Operativo** (`window.open`). Esta ventana cuenta con su propio identificador de ventana (`HWND`) en Windows, permitiendo que **OBS Studio la reconozca directamente en la lista desplegable de "Captura de Ventana"**.
7. **`Cajas Principales VBUS e IBUS`**: Números de gran escala (2.2rem) para visualización clara a distancia en el banco de trabajo.
8. **`Fila de Potencia y Pines USB-C`**:
   * **`PWR`**: Potencia instantánea calculada en Watts ($P = V \times I$).
   * **`PEAK`**: Corriente máxima absoluta registrada durante la sesión.
   * **Botón `RST` (flecha circular)**: Restablece el valor de pico a `0.000A`.
   * **`D+ / D- / CC1 / CC2`**: Monitoreo de tensión en líneas de datos y canales de configuración Type-C. El pin de orientación activo ($>0.25\text{V}$) se enmarca con borde verde esmeralda.

---

### B. Ventana Pop-out / Mini-HUD para OBS Studio (`MCMeterPopoutWindow.jsx` + `MCMeterMiniHUD.jsx`)
Ventana externa independiente del Sistema Operativo especialmente diseñada para streaming y grabación de reparaciones con microscopio en OBS Studio:

1. **Reconocimiento y Dimensiones Adaptables**:
   * **Ancho holgado de 450px:** Brinda espacio cómodo a todos los controles e indicadores sin recortes.
   * **Auto-Ajuste Dinámico al Contenido (Sin espacio negro vacío):** La ventana externa ajusta su altura automáticamente al milímetro según lo que tengas activado:
     - **Modo Compacto (Dígitos VBUS/IBUS):** Altura ultracompacta (~150px) para ocupar el mínimo espacio en tu monitor.
     - **Con Mini-Gráfico Activo:** La ventana se expande automáticamente hacia abajo para alojar el oscilograma Canvas de 430px de resolución.
     - **Con Panel Expandido (Pines y Potencia):** La ventana se expande hacia abajo para mostrar los pines Type-C.
     - Al desactivarlos, la ventana se contrae de inmediato hacia su tamaño compacto original.
2. **Consejos para Captura Sin Bordes ("Borderless") en OBS**:
   * Por políticas de seguridad de Chromium/Windows (anti-phishing), las ventanas emergentes del navegador conservan la barra superior del SO (`_ □ ✕`). Para eliminarla en OBS:
     - **Opción A (Recomendada en OBS):** En las propiedades de la fuente *Captura de Ventana* en OBS, marca la casilla **`Área del cliente` (Client Area)**. OBS recortará automáticamente la barra de Windows y capturará exclusivamente el interior de la herramienta.
     - **Opción B (Recorte rápido en OBS):** En el lienzo de OBS, mantén presionada la tecla <kbd>Alt</kbd> y arrastra el borde superior rojo de la fuente unos píxeles hacia abajo para ocultar la barra de título.
     - **Opción C (Modo 100% Borderless Nativo):** Si deseas tener el widget flotando sobre tu pantalla sin ninguna barra de Windows, presiona el botón **`🗗 FLOTANTE`** en lugar de `🎥 OBS`. Es un widget arrastrable 100% sin bordes.
3. **Modo Limpio OBS (`👁️ Ocultar Barra`)**:
   * En la ventana externa dispones del botón **`👁️`** que colapsa la barra superior de herramientas en una tira mínima, dejando únicamente los dígitos de telemetría y el gráfico para una estética ultra-limpia en tus transmisiones.
4. **Selector de Fondo para Transparencia en OBS (`🎨 Fondo`)**:
   * **`DARK` (`#070b12`):** Fondo oscuro premium para mostrar la tarjeta flotante completa con bordes estilizados.
   * **`NEGRO` (`#000000`):** Fondo negro puro. En OBS puedes aplicar el modo de fusión *Pantalla (Screen)* o el filtro *Color Key* en negro para que el fondo se vuelva 100% transparente y los dígitos de tensión y corriente queden flotando directamente sobre la imagen de la placa bajo el microscopio.
   * **`CHROMA` (`#00ff00`):** Fondo verde croma para eliminar con el filtro *Chroma Key* estándar de OBS.
5. **`📈 Mini-Gráfico Sparkline`**: Oscilograma en tiempo real de 180 muestras a resolución 430px para ver picos y fluctuaciones de corriente en vivo.
6. **`▾ / ▴ Expandir / Colapsar`**: Muestra u oculta la fila de potencia (W) y los pines USB-C.
7. **`🔬 Modo Avanzado`**: Conmuta entre 3 y 6 decimales de precisión.
8. **`🗗 ABRIR GRANDE`**: Maximiza inmediatamente hacia el osciloscopio completo de pantalla completa en la ventana principal.
9. **`🔗 Acoplar`**: Devuelve de inmediato el instrumento a su panel acoplado dentro de Marshall Hardware Suite.

---

### C. Osciloscopio Analizador Grande (`MCMeterOsciloscopio.jsx`)

#### 1. Barra Superior (Telemetría, Perfiles y Exportación)
* **`🗕 Mini-HUD`**: Cierra la pantalla completa y regresa al panel acoplado o mini-HUD sin interrumpir la adquisición de datos.
* **Selector de Perfiles**:
  * **`🚀 Power (1s / Arranque)`**: Diagnóstico de secuencias de encendido y arranque PMIC.
  * **`⚡ Carga USB-C`**: Diagnóstico de negociación de potencia y líneas Type-C.
  * **`💡 Buck / Backlight`**: Supervisión de líneas secundarias, inyección de tensión y bobinas de luz.
* **Lecturas Vivas en Negrita**: Muestra la tensión del perfil activo (`MAIN`, `VBUS`, `BUCK/MAIN`), la corriente (`IBUS`, `CONSUMO`), la potencia en Watts y el pico registrado.
* **`PICO: X.XXXA` + Botón `RST`**: Botón dedicado para reiniciar el pico de corriente instantáneamente durante pruebas de arranque repetidas.
* **Insignia `SPS`**: Indicador de la tasa física del hardware.
* **`💾 Guardar Curva Golden`**: *(Exclusivo del perfil Power)* Captura el oscilograma del arranque, lo normaliza a 250 puntos y lo guarda en Firestore como curva de referencia del modelo.
* **`📸 PNG`**: Descarga inmediata de una captura gráfica en resolución 1300x680 con fondo oscuro y calibración de ejes.
* **`🎥 10s / 🎥 30s / 🎥 Libre`**: Grabación nativa de video `.webm` a 30 FPS generada directamente desde el Canvas sin requerir software externo de grabación de pantalla.
* **`📊 CSV`**: Descarga un volcado en formato tabular de todas las muestras almacenadas en el buffer de memoria.

#### 2. Barra Secundaria Contextual (Comparador Golden y Delta)
* **`COMPARADOR GOLDEN:`** *(Exclusivo del perfil 🚀 Power)*:
  * Menú desplegable con las curvas de encendido grabadas de equipos sanos guardadas para el modelo activo.
  * Al seleccionar una curva, se dibuja su silueta translúcida en color cian (`rgba(0, 229, 255, 0.40)`) en el fondo del gráfico.
  * Botón **`Quitar`**: Remueve la curva de referencia de la pantalla.
  * **Comportamiento automático:** Al cambiar a *Carga USB-C* o *Buck / Backlight*, este comparador y la curva de fondo se ocultan automáticamente para mantener la pantalla despejada.
* **`⚡ PROTOCOLO USB-C:`** *(Exclusivo del perfil Carga USB-C)*: Muestra en tiempo real las tensiones de los 4 pines auxiliares (`D+`, `D-`, `CC1`, `CC2`).
* **`💡 DIAGNÓSTICO BUCK / BACKLIGHT:`** *(Exclusivo del perfil Buck)*: Mensaje informativo de supervisión de rieles secundarios y bobinas.
* **`🎯 HUD Cursor: ON / OFF [H]`**: Botón con acceso directo para ocultar o mostrar el recuadro interactivo del puntero.
* **Medición Delta `📏 Delta (A - B)`**: Lectura viva de $\Delta t$, corriente promedio y corriente máxima entre los cursores A y B fijados en el gráfico.

#### 3. Barra Inferior de Controles del Gráfico
* **`⏸ PAUSAR Y ANALIZAR / ▶ REANUDAR EN VIVO`** (<kbd>Espacio</kbd>): Congela el oscilograma y transfiere los datos a la memoria de inspección sin detener la adquisición en segundo plano.
* **`⚡ Auto-Trigger Power (>15mA)` / `⚡ Auto-Trigger (>15mA)`**: Arma el disparador automático. El gráfico entra en pausa esperando a que la corriente supere los 15mA (presión del botón de encendido o conexión de carga). Al dispararse, ancla el inicio exactamente en $t = 0.000\text{ s}$.
* **`🔀 Vista: 2 Carriles (V / I) / Superpuesta`** (<kbd>S</kbd>):
  * **2 Carriles:** Divide el área de dibujo horizontalmente con una línea central. El carril superior grafica exclusivamente Voltaje (`MAIN` / `VBUS`) y el carril inferior grafica Corriente (`IBUS` / `CONSUMO`).
  * **Superpuesta:** Ambos trazos comparten la altura total con escalas independientes a la izquierda y derecha.
* **`🔬 Modo Avanzado: ON / OFF`**: Conmuta la precisión numérica entre 3 y 6 decimales.
* **`📏 Escala: Auto (Tester) / Completa (Desde 0)`**:
  * **Auto (Tester):** Ajusta los techos y pisos automáticamente según los escalones redondos oficiales del instrumento (0.02V, 0.05V, 0.10V, 0.50V, 1.00V, etc.).
  * **Completa:** Fija el piso en 0.00V / 0.00A para ver la amplitud absoluta desde el reposo.
* **`🔍+ / 🔍-`**: Modifica la cantidad de muestras visibles en el ancho de la pantalla (desde 15 muestras para ver transitorios milimétricos hasta 20,000 muestras para ver minutos de encendido).
* **`🔄 Reset Zoom`** (<kbd>R</kbd> o Doble Clic): Restablece la vista a 400 muestras y devuelve las escalas verticales a automático.
* **`🧹 Limpiar`**: Vacía el buffer de memoria y reinicia el oscilograma a $t = 0$.
* **Casillas de Canales (`VBUS`/`MAIN`, `IBUS`/`CONSUMO`, `D+`, `D-`, `CC`)**: Permiten encender o apagar trazas individuales para concentrarse en una señal específica.
* **Línea de Tiempo (Timeline Scrubber Slider)**: Control deslizante horizontal inferior que permite recorrer el tiempo grabado de extremo a extremo mientras la señal está pausada.

---

## 5. Perfiles de Diagnóstico Especializados

| Perfil | Nomenclatura Voltaje | Nomenclatura Corriente | Herramientas Activas | Objetivo Técnico |
| :--- | :--- | :--- | :--- | :--- |
| **🚀 Power (1s / Arranque)** | **`MAIN`** (VBAT / VPH_PWR / VDD_MAIN) | **`CORRIENTE ARRANQUE (A)`** | Auto-Trigger en $t=0$, **Comparador Golden Sample**, Guardar Curva Golden. | Diagnosticar consumo de encendido, fallas de PMIC primario/secundario, cortos en rieles de arranque y reinicios cíclicos (boot loop). |
| **⚡ Carga USB-C** | **`VBUS`** (5V, 9V, 12V, 15V, 20V) | **`IBUS`** | Monitor de pines `D+`, `D-`, `CC1`, `CC2` con detección de orientación. | Verificar negociaciones de Power Delivery (PD), Quick Charge (QC), cables tipo C dañados o fallas en controladores de carga (Tristar / Hydra / Tigris / OVP). |
| **💡 Buck / Backlight** | **`BUCK / MAIN`** | **`CONSUMO (A)`** | Supervisión de tensión con protección visual y auto-escala micro-cuantizada (hasta 35V). | Inyección de tensión en rieles de baja impedancia (0.8V–1.8V en CPU/GPU) y medición de circuitos elevadores de alta tensión de pantalla (18V–35V en Backlight/OLED). |

---

## 6. Banco de Muestras Golden (Comparador de Curvas)

* **¿Qué es una Curva Golden?** Es el oscilograma de encendido grabado de un equipo sano idéntico del mismo modelo.
* **Ámbito de uso:** Es **exclusiva del perfil 🚀 Power (1s / Arranque)**. Al cambiar a *Carga USB-C* o *Buck*, el selector y la curva de fondo se ocultan automáticamente.
* **Cómo guardarla:**
  1. Selecciona el perfil **`🚀 Power`**.
  2. Pulsa **`⚡ Auto-Trigger Power (>15mA)`**.
  3. Enciende el equipo sano con el botón Power: la señal se registrará y pausará en pantalla con el arranque completo.
  4. Pulsa **`💾 Guardar Curva Golden`**, asigna un título (ejemplo: *Arranque Normal iOS 17*) y guarda. La curva queda almacenada en Firestore vinculada permanentemente al modelo.
* **Cómo comparar:**
  1. Al conectar un equipo con falla del mismo modelo en el perfil **`🚀 Power`**, abre el desplegable **`COMPARADOR GOLDEN:`** y elige la curva guardada.
  2. Aparecerá en el fondo la silueta cian translúcida (`rgba(0, 229, 255, 0.40)`).
  3. La curva amarilla en vivo del equipo averiado se graficará encima. Cualquier pico anormal, sobreconsumo en una fase de encendido o caída a cero por apagado del PMIC resaltará de forma inmediata por contraste visual.
