# Plan de Implementación: Marshall MC-Meter Pro (KM003C USB HID 1Ksps) en Next.js 16 + React 19

Consulta el documento maestro exhaustivo en:
👉 [plan_implementacion_mc_meter_pro.md](file:///d:/programacion/mi-diagnostico/plan_implementacion_mc_meter_pro.md)

---

### Resumen de Fases:
1. **Fase 1: Servicio Bridge de Alta Velocidad (`mc_meter_bridge.py`)**  
   - Conexión USB HID (`VID: 0x5FC9`, `PID: 0x0063`, `Interface: 3`).
   - Polling a 1000 Hz, decodificación Little-Endian, filtro de mediana de 3 muestras y buffer de 60,000 pts.
   - Servidor WebSocket en `ws://127.0.0.1:8765` para streaming a 60 FPS hacia React.

2. **Fase 2: Hook React (`hooks/useMCMeter.js`)**  
   - Gestión de estado WebSocket con auto-reconexión y fallback a WebHID directo (`navigator.hid`).
   - Exposición reactiva de VBUS, IBUS, Watts, D+, D-, CC1, CC2, SPS y buffer circular.

3. **Fase 3: Widget en Header y Mini-HUD Flotante (`components/MCMeterMiniHUD.jsx`)**  
   - Indicador de estado junto al multímetro en el navbar superior.
   - Mini-HUD flotante compacto con modo avanzado 🔬 (6 decimales divididos), desplegable de pines CC/D (marco verde en activo) y botón 🗗 (exclusión mutua hacia la pantalla grande).

4. **Fase 4: Analizador Oscilograma X-Y Pantalla Grande (`components/MCMeterOsciloscopio.jsx`)**  
   - Canvas HTML5 a 60 FPS: VBUS Rojo (`#ff3b3b`) e IBUS Amarillo (`#facc15`).
   - Escala cuantizada tipo tester, Split View (2 carriles), Box-Zoom por arrastre de ratón.
   - Time-Scrubbing con slider, Pausa, Cursores Delta A-B, Auto-Trigger (>15 mA).
   - Exportación PNG, Video (WebM/MP4) y CSV.

5. **Fase 5: Integración Dock Test & Persistencia Firebase Firestore (`pages/index.js`)**  
   - Botón de auto-captura en 1 clic en la pestaña Dock Test para inyectar VBUS, D+, D-, CC1, CC2 e IBUS en el modelo activo.
   - Guardado directo en Firestore (`hardware_db`).
   - Preservación 100% íntegra de las funciones del multímetro UNI-T UT61E+ en FPC, IC, diodo, auto-hold y voz.
