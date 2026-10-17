# 🎥 Guía de Integración con OBS Studio: Overlays HUD con Transparencia Real 100% (Browser Source)

Esta guía detalla la implementación y el uso del sistema de **Fuentes Navegador (Browser Source)** para transmitir en vivo mediciones de hardware (Multímetro UNI-T UT61E+ y Marshall MC-Meter Pro KM003C) directamente sobre escenas de microscopía, reparación de placas base y transmisiones técnicas en OBS Studio.

---

## 🌟 ¿Por qué usar Fuente Navegador en lugar de Captura de Ventana?

Tradicionalmente, para mostrar un multímetro en OBS se utilizaba la *Captura de Ventana*, la cual presenta múltiples desventajas:
* Bordes grises o marcos de ventana del sistema operativo.
* Necesidad de aplicar filtros de color (*Chroma Key* o *Color Key*), los cuales degradan el texto, producen bordes verdosos/dentados y borran partes claras de los dígitos.
* Si minimizas la ventana capturada en Windows, la imagen en OBS se congela o desaparece.

### ✅ La Solución: Fuente Navegador con Parámetro Web
Al configurar una **Fuente Navegador** en OBS apuntando a la URL con parámetro `?obs=...`:
1. **Transparencia Nativa Real (Canal Alfa 32-bit):** El fondo es 100% transparente a nivel de píxel directamente desde el motor Chromium embebido (CEF) de OBS. Cero filtros, cero bordes grises y tipografía vectorial anti-aliased ultra nítida.
2. **Independiente de la Ventana:** No depende de ventanas visibles ni de que estén al frente en tu pantalla.
3. **Aceleración por GPU:** Renderizado fluido a 60 FPS sin ralentizar tu software de microscopio o esquemáticos.

---

## 📡 Tabla de Rutas y Parámetros Disponibles

Puedes seleccionar qué vista mostrar en OBS cambiando el parámetro `?obs=` en la URL:

| URL del Parámetro | Vista que Renderiza | Resolución Sugerida en OBS | Contenido Visual |
| :--- | :--- | :--- | :--- |
| **`/?obs=hud`** *(o `?obs=dual`)* | **Marshall Suite Dual** | **`720` × `240`** | Multímetro Digital + MC-Meter Pro integrados en una sola barra unificada (~1/3 de pantalla). |
| **`/?obs=multimetro`** *(o `?obs=dmm`)* | **Multímetro Mini-HUD** | **`420` × `200`** | Visor numérico, Bargraph analógico de 46 segmentos fluorescentes, selector de escala, MAX/MIN y AutoHold. |
| **`/?obs=mcmeter`** *(o `?obs=km003c`)* | **Marshall MC-Meter Pro** | **`380` × `220`** | Telemetría USB-C PD: VBUS, IBUS, Watts, CC1, CC2, SPS y gráfica Sparkline en vivo. |

> [!TIP]
> **En Entorno Local:** Usa `http://localhost:3000/?obs=hud`  
> **En Producción (Vercel):** Usa `https://mi-diagnostico.vercel.app/?obs=hud` *(reemplaza por tu dominio real)*.

---

## 🛠️ Paso a Paso: Cómo Agregar la Fuente en OBS Studio

### Paso 1: Copiar la URL desde la Plataforma
En la barra de herramientas de cualquier instrumento en la plataforma web (o en sus ventanas flotantes), haz clic en el botón:
* **`📋 OBS URL (HUD)`** o **`OBS URL`**  
El enlace exacto se copiará instantáneamente al portapapeles.

### Paso 2: Crear la Fuente Navegador en OBS
1. Abre **OBS Studio**.
2. En el panel **Fuentes (Sources)** de tu escena (por ejemplo, tu escena con la cámara del microscopio), haz clic en el botón **`+`**.
3. Selecciona **`Navegador`** *(Browser Source)*.
4. Asígnale un nombre descriptivo, por ejemplo: `HUD Multímetro Marshall` o `HUD Suite Dual`.
5. Haz clic en **Aceptar**.

### Paso 3: Configurar las Propiedades de la Fuente
En la ventana de configuración que se abre, ingresa estos parámetros:

* **URL:** Pega la dirección copiada, por ejemplo:  
  `http://localhost:3000/?obs=hud`
* **Ancho (Width):** `720` *(o `420` si es multímetro individual)*.
* **Alto (Height):** `240` *(o `200` si es multímetro individual)*.
* **FPS:** `60` *(para máxima fluidez del bargraph y oscilogramas)*.
* **CSS personalizado:** Puedes dejarlo en blanco o por defecto; la plataforma ya inyecta `background: transparent !important;` automáticamente.
* **Apagar fuente cuando no sea visible:** **Desmarcar** *(recomendado para evitar desconexiones si cambias de escena)*.
* **Actualizar el navegador cuando la escena se active:** **Marcar**.
* Haz clic en **Aceptar**.

### Paso 4: Posicionar en la Escena
Arrastra el HUD con el mouse al rincón de tu pantalla que prefieras (por ejemplo, sobre la esquina superior derecha o inferior de la toma de tu microscopio). Puedes redimensionarlo manteniendo pulsada la tecla `Shift` o arrastrando las esquinas rojas en OBS.

---

## ⚡ ¿Cómo Funciona la Sincronización en Vivo? (BroadcastChannel API)

Una limitación habitual de WebHID en OBS es que las fuentes Navegador no tienen acceso a dispositivos USB físicos ni cuadros de diálogo para conectar hardware.

Para resolver esto de forma transparente:
1. Conectas tus instrumentos USB (UNI-T UT61E+ y Marshall MC-Meter Pro) en tu **pestaña principal del navegador** (Chrome o Edge) donde trabajas normalmente con tus planos o esquemáticos.
2. La aplicación utiliza la **API nativa de `BroadcastChannel`** (`marshall_hardware_stream`).
3. Cada lectura recibida por WebHID se envía por este bus inter-procesos directamente a la fuente Navegador de OBS.
4. **Ventajas:**
   * **Latencia 0 ms:** La comunicación es 100% en memoria RAM local dentro de tu propia máquina.
   * **Cero consumo de red:** No pasa por servidores en la nube ni requiere internet.
   * Si cambias de escala en la web (Diodo, Voltios, Ohmios, µA), el HUD en OBS se actualiza automáticamente al instante.

---

## ❓ Preguntas Frecuentes y Solución de Problemas (Troubleshooting)

### 1. ¿Por qué en OBS aparece `----` o valores en cero?
* **Causa:** La pestaña principal con la plataforma web aún no está abierta o el instrumento no está conectado por USB.
* **Solución:** Abre la plataforma web en tu navegador, haz clic en **`CONECTAR USB`**, y de inmediato OBS comenzará a reflejar las lecturas en vivo.

### 2. ¿Cómo recargo la vista si actualicé el código o la versión?
* En OBS Studio, haz clic derecho sobre la fuente Navegador en la lista de fuentes y selecciona:  
  **`Actualizar caché de esta página`** *(Refresh cache of current page)*.

### 3. ¿El fondo se ve con bordes negros o grises?
* Verifica que en las propiedades de la fuente en OBS el campo **CSS** no tenga ninguna regla como `background-color: black;`. Si está limpio, el fondo será 100% cristalino.
