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
  ArrowLeft, 
  RefreshCcw,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  Home
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
      <div className="flex items-center justify-center min-vh-100" style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-accent"
        >
          <Smartphone size={100} strokeWidth={1} />
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
        {tema === 'light' ? <Moon size={22} /> : <Sun size={22} />}
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
                  <CheckCircle2 size={72} color="#10b981" />
                </motion.div>
                <h2 className="final-message">{pasoActual.pregunta}</h2>
                <button 
                  className="btn-restart" 
                  onClick={() => { setHistorial([]); cargarPaso('inicio'); }}
                >
                  <RefreshCcw size={20} />
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
                          <Icono size={28} className="option-icon" />
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

        <div className="nav-buttons">
          {historial.length > 0 && !pasoActual.esFinal && (
            <motion.button 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="btn-back"
              onClick={irAtras}
            >
              <ArrowLeft size={22} />
              Volver al paso anterior
            </motion.button>
          )}

          {pasoActual.id !== 'inicio' && (
            <motion.button 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="btn-home"
              onClick={() => { setHistorial([]); cargarPaso('inicio'); }}
            >
              <Home size={22} />
              Inicio
            </motion.button>
          )}
        </div>
      </div>

      <footer>
        Marshall Cell Diagnostics todos los derechos resevados 2026
      </footer>

      <style jsx>{`
        .main-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 140px 20px 40px;
        }
        .content-wrapper {
          width: 100%;
          max-width: 680px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .app-title {
          font-size: 2.4rem;
          font-weight: 800;
          margin-bottom: 60px;
          text-align: center;
          letter-spacing: -1.5px;
        }
        .card {
          background: var(--bg-card);
          padding: 60px 50px;
          border-radius: 36px;
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
          width: 100%;
        }
        .question-text {
          font-size: 1.8rem;
          margin-bottom: 40px;
          font-weight: 700;
          line-height: 1.3;
          text-align: center;
        }
        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: stretch;
        }
        .option-button {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 28px 36px;
          border-radius: 24px;
          cursor: pointer;
          text-align: left;
          font-size: 1.2rem;
          font-weight: 600;
          width: 100%;
          max-width: 500px;
        }
        .option-button:hover {
          border-color: var(--accent);
          background: rgba(59, 130, 246, 0.05);
        }
        .option-content {
          display: flex;
          align-items: center;
          gap: 20px;
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
          margin-bottom: 30px;
        }
        .final-message {
          font-size: 2rem;
          margin-bottom: 50px;
          font-weight: 700;
        }
        .btn-restart {
          background: var(--accent);
          color: white;
          border: none;
          padding: 20px 40px;
          border-radius: 20px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.15rem;
        }
        .nav-buttons {
          margin-top: 80px;
          display: flex;
          gap: 40px;
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-back, .btn-home {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 14px 28px;
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .btn-back:hover, .btn-home:hover {
          color: var(--text-primary);
          border-color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}