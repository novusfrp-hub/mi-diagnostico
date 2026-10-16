import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

/**
 * Componente Portal para Ventana Pop-out Nativa del Sistema Operativo.
 * Abre una ventana externa independiente mediante `window.open` para que OBS Studio
 * la reconozca directamente en su lista desplegable de "Captura de Ventana".
 *
 * Diseñado con ciclo de vida inmutable (monta una sola vez, sin bucles de re-render).
 */
export default function MCMeterPopoutWindow({
  children,
  onClose,
  title = 'Marshall MC-Meter Pro — Mini HUD (OBS)'
}) {
  const [targetNode, setTargetNode] = useState(null);
  const popupRef = useRef(null);

  // Mantener referencia actualizada de onClose sin provocar re-ejecución del effect
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dimensiones iniciales: ancho más holgado (450px) y altura inicial compacta (150px)
    const ancho = 450;
    const alto = 150;
    const left = window.screen.availWidth ? Math.max(10, window.screen.availWidth - ancho - 80) : 120;
    const top = 120;

    let popup = null;
    try {
      popup = window.open(
        '',
        'MarshallMCMeterPopout',
        `width=${ancho},height=${alto},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
      );
    } catch (e) {
      console.error('Error al abrir ventana emergente:', e);
    }

    if (!popup) {
      alert(
        'El navegador bloqueó la ventana emergente.\nPor favor habilita las "Ventanas Emergentes (Pop-ups)" en la barra de direcciones para usar la ventana independiente de OBS.'
      );
      onCloseRef.current?.();
      return;
    }

    // Forzar redimensionamiento inicial inmediato en caso de que Chrome haya recordado un alto previo
    try {
      popup.resizeTo(ancho, alto);
    } catch (e) {}

    popupRef.current = popup;

    // Configurar documento de la ventana externa
    popup.document.title = title;
    popup.document.body.style.margin = '0';
    popup.document.body.style.padding = '0';
    popup.document.body.style.height = 'auto';
    popup.document.body.style.minHeight = 'auto';
    popup.document.body.style.backgroundColor = '#070b12';
    popup.document.body.style.overflow = 'hidden';

    // Inyectar estilos base e iconos limpios
    const styleEl = popup.document.createElement('style');
    styleEl.textContent = `
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: auto;
        min-height: auto;
        background-color: #070b12;
        font-family: Consolas, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
        color: #ffffff;
        user-select: none;
        overflow: hidden;
      }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
      ::-webkit-scrollbar-track { background: #070b12; }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `;
    popup.document.head.appendChild(styleEl);

    // Clonar hojas de estilo para mantener fuentes y utilidades visuales
    Array.from(document.styleSheets).forEach((styleSheet) => {
      try {
        if (styleSheet.href) {
          const newLink = popup.document.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = styleSheet.href;
          popup.document.head.appendChild(newLink);
        } else if (styleSheet.cssRules) {
          const newStyle = popup.document.createElement('style');
          Array.from(styleSheet.cssRules).forEach((rule) => {
            newStyle.appendChild(popup.document.createTextNode(rule.cssText));
          });
          popup.document.head.appendChild(newStyle);
        }
      } catch (e) {
        // Ignorar restricciones CORS de estilos externos
      }
    });

    // Crear el nodo contenedor DENTRO del documento de la ventana externa (auto-ajustable al contenido)
    const container = popup.document.createElement('div');
    container.id = 'marshall-popout-mount';
    container.style.width = '100%';
    container.style.height = 'auto';
    container.style.minHeight = 'auto';
    popup.document.body.appendChild(container);

    setTargetNode(container);

    // Monitoreo estándar con intervalo para detectar cuando el usuario cierra la ventana nativa
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        onCloseRef.current?.();
      }
    }, 350);

    return () => {
      clearInterval(timer);
      if (popup && !popup.closed) {
        popup.close();
      }
    };
  }, []); // Dependencias vacías: abre la ventana UNA SOLA VEZ y nunca entra en bucle

  if (!targetNode) return null;

  return ReactDOM.createPortal(children, targetNode);
}
