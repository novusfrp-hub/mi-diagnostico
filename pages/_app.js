import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { RefreshCw, Zap } from "lucide-react";

export default function App({ Component, pageProps }) {
  const [hayNuevaVersion, setHayNuevaVersion] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let registrationRef = null;

    const registrarSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        registrationRef = registration;
        console.log("[SW] Registrado con éxito:", registration.scope);

        // Si ya hay un worker esperando
        if (registration.waiting) {
          setHayNuevaVersion(true);
        }

        // Escuchar si se encuentra una nueva versión instalándose
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setHayNuevaVersion(true);
              }
            });
          }
        });
      } catch (err) {
        console.log("[SW] Falló el registro:", err);
      }
    };

    window.addEventListener("load", registrarSW);

    // Revisar si hay nuevo commit cada vez que el usuario regresa a la ventana
    const checkUpdate = () => {
      if (registrationRef) {
        registrationRef.update().catch(() => {});
      }
    };
    window.addEventListener("focus", checkUpdate);
    window.addEventListener("online", checkUpdate);

    return () => {
      window.removeEventListener("load", registrarSW);
      window.removeEventListener("focus", checkUpdate);
      window.removeEventListener("online", checkUpdate);
    };
  }, []);

  // Función para forzar recarga limpia y actualizar al último commit
  const aplicarActualizacion = async () => {
    setActualizando(true);
    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      }
    } catch (e) {
      console.error("[SW] Error al limpiar caché:", e);
    }
    // Forzar recarga desde el servidor
    window.location.reload(true);
  };

  return (
    <>
      {/* Notificación flotante de nueva versión detectada */}
      {hayNuevaVersion && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 99999,
            backgroundColor: "#0f172a",
            border: "2px solid #3b82f6",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(59, 130, 246, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            animation: "fadeIn 0.3s ease-out",
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}
        >
          <div>
            <div style={{ color: "#60a5fa", fontWeight: "bold", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <Zap size={15} /> ¡Nueva actualización disponible!
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "2px" }}>
              Se ha desplegado un nuevo cambio en Vercel.
            </div>
          </div>
          <button
            onClick={aplicarActualizacion}
            disabled={actualizando}
            style={{
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontWeight: "bold",
              fontSize: "0.75rem",
              cursor: actualizando ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.5)",
              transition: "background 0.2s"
            }}
          >
            <RefreshCw size={13} style={{ animation: actualizando ? "spin 0.8s linear infinite" : "none" }} />
            {actualizando ? "Actualizando..." : "Actualizar ahora"}
          </button>
        </div>
      )}

      <Component {...pageProps} onForzarActualizacion={aplicarActualizacion} />
    </>
  );
}
