import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * Componente Portal para Ventana Pop-out Nativa del Sistema Operativo.
 * Abre una ventana independiente mediante `window.open` para que OBS Studio
 * la reconozca directamente en su lista desplegable de "Captura de Ventana".
 */
export default function MCMeterPopoutWindow({
  children,
  onClose,
  title = 'Marshall MC-Meter Pro — Mini HUD (OBS)'
}) {
  const [containerEl] = useState(() => {
    if (typeof document !== 'undefined') {
      const el = document.createElement('div');
      el.id = 'marshall-popout-root';
      el.style.width = '100%';
      el.style.minHeight = '100vh';
      return el;
    }
    return null;
  });

  const [externalWindow, setExternalWindow] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dimensiones óptimas para overlay de streaming en OBS
    const ancho = 340;
    const alto = 540;
    const left = window.screen.availWidth ? window.screen.availWidth - ancho - 80 : 120;
    const top = 120;

    const popup = window.open(
      '',
      'MarshallMCMeterPopout',
      `width=${ancho},height=${alto},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );

    if (!popup) {
      alert(
        'El navegador bloqueó la ventana emergente.\nPor favor habilita las "Ventanas Emergentes (Pop-ups)" en la barra de direcciones para usar la ventana independiente de OBS.'
      );
      if (onClose) onClose();
      return;
    }

    // Configuración del documento de la ventana externa
    popup.document.title = title;
    popup.document.body.style.margin = '0';
    popup.document.body.style.padding = '0';
    popup.document.body.style.backgroundColor = '#070b12';
    popup.document.body.style.overflowX = 'hidden';

    // Inyectar estilos base e iconos
    const styleEl = popup.document.createElement('style');
    styleEl.textContent = `
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        background-color: #070b12;
        font-family: Consolas, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
        color: #ffffff;
        user-select: none;
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

    // Clonar hojas de estilo de la ventana principal para conservar fuentes y utilidades
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
        // Ignorar restricciones CORS de hojas de estilo externas
      }
    });

    popup.document.body.appendChild(containerEl);
    setExternalWindow(popup);

    // Manejador de cierre cuando el técnico cierra la ventana externa en Windows
    const handleClose = () => {
      if (onClose) onClose();
    };

    popup.addEventListener('beforeunload', handleClose);
    popup.addEventListener('pagehide', handleClose);

    return () => {
      popup.removeEventListener('beforeunload', handleClose);
      popup.removeEventListener('pagehide', handleClose);
      if (!popup.closed) {
        popup.close();
      }
    };
  }, [containerEl, onClose, title]);

  if (!externalWindow || !containerEl) return null;

  return ReactDOM.createPortal(children, containerEl);
}
