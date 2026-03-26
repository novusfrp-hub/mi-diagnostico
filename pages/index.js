import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Zap, 
  Power, 
  UserCheck, 
  Volume2, 
  Wifi, 
  Battery, 
  Signal, 
  Camera, 
  Fingerprint, 
  ChevronLeft, 
  RefreshCcw,
  Sun,
  Moon,
  Monitor,
  CheckCircle2
} from 'lucide-react';

// Mapeo de iconos para las categorías
const ICONOS_CATEGORIAS = {
  "⚡ Falla de Carga": Zap,
  "🔌 Falla de Encendido": Power,
  "📱 Pantalla / Imagen": Monitor,
  "👤 Face ID / Touch ID": UserCheck,
  "🔊 Audio (Codec/Speaker)": Volume2,
  "📶 WiFi / Bluetooth": Wifi,
  "🔋 Batería / Consumo": Battery,
  "📡 Señal / Red / Baseband": Signal,
  "📷 Cámara": Camera,
  "☝️ Sensor de Huella": Fingerprint
};

export default function AppDiagnostico() {
  const [pasoActual, setPasoActual] = useState(null);
  const [historial, setHistorial] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const [tema, setTema] = useState('dark');

  // Cargar tema guardado
  useEffect(() => {
    const temaGuardado = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTema(temaGuardado);
    document.documentElement.setAttribute('data-theme', temaGuardado);
  }, []);

  const toggleTema = () => {
    const nuevoTema = tema === 'light' ? 'dark' : 'light';
    setTema(nuevoTema);
    localStorage.setItem('theme', nuevoTema);
    document.documentElement.setAttribute('data-theme', nuevoTema);
  };

  const cargarPaso = async (idPaso, esRetroceso = false) => {
    setCargando(true);
    try {
      const respuesta = await fetch(`/api/diagnostico?paso=${idPaso}`);
      const datos = await respuesta.json();
      
      if (!esRetroceso && pasoActual) {
        setHistorial([...historial, pasoActual.id]);
      }
      setPasoActual(datos);
    } catch (error) {
      console.error(error);
    }
    setCargando(false);
  };

  const irAtras = () => {
    if (historial.length === 0) return;
    const pasoAnterior = historial[historial.length - 1];
    const nuevoHistorial = [...historial];
    nuevoHistorial.pop();
    setHistorial(nuevoHistorial);
    cargarPaso(pasoAnterior, true);
  };

  useEffect(() => {
    cargarPaso('inicio');
  }, []);

  // Calcular progreso (estimado)
  const progreso = pasoActual?.esFinal ? 100 : Math.min((historial.length * 15), 90);

  if (cargando || !pasoActual) {
    return (
      <div className="flex items-center justify-center min-vh-100">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <RefreshCcw className="animate-spin text-accent" size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Barra de Progreso */}
      <div className="progress-bar-container">
        <motion.div 
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progreso}%` }}
          transition={{ type: 'spring', stiffness: 50 }}
        />
      </div>

      {/* Logo */}
      <div className="logo-container">
        <img src="/logo.png" alt="Logo" className="logo-img" />
      </div>

      {/* Toggle de Tema */}
      <button className="theme-toggle" onClick={toggleTema}>
        {tema === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="content-wrapper">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className="app-title"
        >
          Protocolo de Diagnóstico
        </motion.h1>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={pasoActual.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            {pasoActual.esFinal ? (
              <div className="final-screen">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="success-icon"
                >
                  <CheckCircle2 size={64} color="#10b981" />
                </motion.div>
                <h2 className="final-message">{pasoActual.pregunta}</h2>
                <button 
                  className="btn-restart" 
                  onClick={() => { setHistorial([]); cargarPaso('inicio'); }}
                >
                  <RefreshCcw size={18} />
                  Comenzar nuevo diagnóstico
                </button>
              </div>
            ) : (
              <>
                <h2 className="question-text">{pasoActual.pregunta}</h2>
                <div className="options-grid">
                  {pasoActual.opciones?.map((opcion, index) => {
                    const Icono = ICONOS_CATEGORIAS[opcion.texto] || Smartphone;
                    return (
                      <motion.button 
                        key={index} 
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="option-button"
                        onClick={() => cargarPaso(opcion.siguientePaso)}
                      >
                        <div className="option-content">
                          <Icono size={22} className="option-icon" />
                          <span>{opcion.texto}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {historial.length > 0 && !pasoActual.esFinal && (
          <motion.button 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="btn-back"
            onClick={irAtras}
          >
            <ChevronLeft size={18} />
            Volver al paso anterior
          </motion.button>
        )}
      </div>

      <style jsx>{`
        .main-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 100px 20px 40px;
        }
        .content-wrapper {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .app-title {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 40px;
          text-align: center;
          letter-spacing: -1px;
        }
        .card {
          background: var(--bg-card);
          padding: 40px;
          border-radius: 28px;
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
          width: 100%;
        }
        .question-text {
          font-size: 1.5rem;
          margin-bottom: 30px;
          font-weight: 700;
          line-height: 1.3;
        }
        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .option-button {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 18px 24px;
          border-radius: 16px;
          cursor: pointer;
          text-align: left;
          font-size: 1.05rem;
          font-weight: 600;
        }
        .option-button:hover {
          border-color: var(--accent);
          background: rgba(59, 130, 246, 0.05);
        }
        .option-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .option-icon {
          color: var(--accent);
        }
        .final-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .success-icon {
          margin-bottom: 20px;
        }
        .final-message {
          font-size: 1.6rem;
          margin-bottom: 30px;
        }
        .btn-restart {
          background: var(--accent);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-back {
          margin-top: 30px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
        }
        .btn-back:hover {
          color: var(--text-primary);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}