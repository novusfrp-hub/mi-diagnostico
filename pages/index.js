import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, ArrowLeft, RefreshCcw, Zap, Smartphone, Battery, Power, Wrench, AlertTriangle, ChevronRight, Home, LifeBuoy, ShieldCheck } from 'lucide-react';

export default function AppDiagnostico() {
  const [pasoActual, setPasoActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tema, setTema] = useState('light');

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
      alert("Hubo un error al cargar el diagnóstico");
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

  const toggleTema = () => {
    setTema(tema === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    cargarPaso('inicio');
  }, []);

  const obtenerIconoDinamico = (texto) => {
    const txt = texto.toLowerCase();
    if (txt.includes('apple') || txt.includes('iphone')) return <Smartphone size={24} color="#0058bc" />;
    if (txt.includes('android')) return <Smartphone size={24} color="#0058bc" />;
    if (txt.includes('carga')) return <Zap size={24} color="#0058bc" />;
    if (txt.includes('encendido') || txt.includes('no enciende')) return <Power size={24} color="#0058bc" />;
    if (txt.includes('pantalla') || txt.includes('imagen')) return <Smartphone size={24} color="#0058bc" />;
    if (txt.includes('batería')) return <Battery size={24} color="#0058bc" />;
    if (txt.includes('software')) return <Wrench size={24} color="#0058bc" />;
    return <AlertTriangle size={24} color="#0058bc" />;
  };

  if (!pasoActual) return null;

  const t = estilos[tema];

  return (
    <div style={{ ...estilos.contenedor, ...t.fondoPrincipal }}>
      
      {/* HEADER SUPERIOR (Estilo Asimétrico) */}
      <header style={{ ...estilos.header, ...t.bordeFantasmaBottom }}>
        <div style={estilos.headerInner}>
          <h1 style={{ ...estilos.logoTexto, ...t.textoPrincipal }}>MARSHALL CELL DIAGNOSTICS</h1>
          <button onClick={toggleTema} style={{ ...estilos.btnTema, ...t.textoSutil }}>
            {tema === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        <div style={estilos.lineaAcento}></div>
      </header>

      {/* ÁREA CENTRAL DE DIAGNÓSTICO */}
      <main style={estilos.main}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pasoActual.id}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ ...estilos.tarjetaCristal, ...t.cristalBg, ...t.bordeFantasma }}
          >
            
            {/* Encabezado de la Pregunta */}
            <div style={estilos.seccionTitulo}>
              <span style={{ ...estilos.etiquetaPaso, color: '#0058bc' }}>
                PASO {String(historial.length + 1).padStart(2, '0')}
              </span>
              <h2 style={{ ...estilos.tituloPregunta, ...t.textoPrincipal }}>
                {pasoActual.pregunta}
              </h2>
              {!pasoActual.esFinal && (
                <p style={{ ...estilos.subtituloPregunta, ...t.textoSutil }}>
                  Seleccione la categoría que mejor describa el comportamiento inusual de su equipo para una evaluación precisa.
                </p>
              )}
            </div>

            {/* Opciones (Grid) o Pantalla Final */}
            {pasoActual.esFinal ? (
              <div style={estilos.estadoFinal}>
                <div style={estilos.iconoFinalBg}>
                  <ShieldCheck size={48} color="#0058bc" />
                </div>
                <h3 style={{ ...estilos.textoFinal, ...t.textoPrincipal }}>Diagnóstico Completado</h3>
                <button
                  style={estilos.btnPrimario}
                  onClick={() => { setHistorial([]); cargarPaso('inicio'); }}
                >
                  <RefreshCcw size={18} style={{ marginRight: '8px' }} />
                  Iniciar Nueva Evaluación
                </button>
              </div>
            ) : (
              <div style={estilos.gridOpciones}>
                {pasoActual.opciones?.map((opcion, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02, backgroundColor: t.hoverBg }}
                    whileTap={{ scale: 0.98 }}
                    style={{ ...estilos.btnOpcion, ...t.bordeFantasma, ...t.cristalBgItem }}
                    onClick={() => cargarPaso(opcion.siguientePaso)}
                  >
                    <div style={estilos.opcionContenido}>
                      <div style={estilos.iconoCirculo}>
                        {obtenerIconoDinamico(opcion.texto)}
                      </div>
                      <div style={estilos.textosOpcion}>
                        <span style={{ ...estilos.tituloOpcion, ...t.textoPrincipal }}>{opcion.texto}</span>
                        <span style={{ ...estilos.descOpcion, ...t.textoSutil }}>Toque para continuar</span>
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: '#0058bc', opacity: 0.5 }} />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* COMPROMISO MARSHALL */}
        <div style={estilos.compromisoSec}>
          <div style={estilos.avatarPlaceholder}>
            <Wrench size={24} color="#0058bc" />
          </div>
          <div>
            <h4 style={{ ...estilos.compromisoTitulo, color: '#0058bc' }}>COMPROMISO MARSHALL</h4>
            <p style={{ ...estilos.compromisoTexto, ...t.textoSutil }}>
              Utilizamos componentes de grado OEM y diagnósticos certificados por software para garantizar que su dispositivo recupere su rendimiento de fábrica.
            </p>
          </div>
        </div>
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR FLOAT */}
      <nav style={{ ...estilos.navInferior, ...t.cristalBgNav, ...t.bordeFantasmaTop }}>
        <button 
          style={{ ...estilos.navBtn, ...t.textoSutil, opacity: historial.length > 0 ? 1 : 0.3 }} 
          onClick={historial.length > 0 ? irAtras : undefined}
          disabled={historial.length === 0}
        >
          <ArrowLeft size={24} />
          <span style={estilos.navLabel}>BACK</span>
        </button>

        <button 
          style={estilos.navBtnCentro}
          onClick={() => { setHistorial([]); cargarPaso('inicio'); }}
        >
          <Home size={24} color="white" />
        </button>

        <button style={{ ...estilos.navBtn, ...t.textoSutil }}>
          <LifeBuoy size={24} />
          <span style={estilos.navLabel}>HELP</span>
        </button>
      </nav>

    </div>
  );
}

// --- SISTEMA DE DISEÑO: THE DIGITAL SURGEON ---
const estilos = {
  contenedor: { minHeight: '100vh', fontFamily: '"Inter", system-ui, -apple-system, sans-serif', paddingBottom: '100px', display: 'flex', flexDirection: 'column' },
  
  // Header
  header: { paddingTop: '16px', paddingBottom: '16px', position: 'relative' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  logoTexto: { fontSize: '0.875rem', fontWeight: '800', letterSpacing: '0.05em', margin: 0 },
  btnTema: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px' },
  lineaAcento: { height: '3px', width: '30%', background: 'linear-gradient(135deg, #0058bc 0%, #0070eb 100%)', position: 'absolute', bottom: 0, left: 0 },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' },
  
  // Tarjeta Principal (Volumetric Depth)
  tarjetaCristal: { width: '100%', borderRadius: '2.5rem', padding: '50px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0, 88, 188, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  
  seccionTitulo: { textAlign: 'center', marginBottom: '40px', maxWidth: '600px' },
  etiquetaPaso: { fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' },
  tituloPregunta: { fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.2', margin: '0 0 16px 0' },
  subtituloPregunta: { fontSize: '0.95rem', lineHeight: '1.5', margin: 0 },

  // Grid
  gridOpciones: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', width: '100%' },
  btnOpcion: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: '1.5rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease' },
  opcionContenido: { display: 'flex', alignItems: 'center', gap: '16px' },
  iconoCirculo: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(0, 88, 188, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textosOpcion: { display: 'flex', flexDirection: 'column', gap: '4px' },
  tituloOpcion: { fontSize: '1.05rem', fontWeight: '700' },
  descOpcion: { fontSize: '0.8rem' },

  // Estado Final
  estadoFinal: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', textAlign: 'center' },
  iconoFinalBg: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(0, 88, 188, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' },
  textoFinal: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '32px' },
  btnPrimario: { background: 'linear-gradient(135deg, #0058bc 0%, #0070eb 100%)', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '1.5rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 10px 20px rgba(0, 88, 188, 0.2)' },

  // Compromiso
  compromisoSec: { display: 'flex', alignItems: 'center', gap: '20px', marginTop: '60px', maxWidth: '700px', padding: '0 20px' },
  avatarPlaceholder: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0, 88, 188, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  compromisoTitulo: { fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', margin: '0 0 8px 0' },
  compromisoTexto: { fontSize: '0.85rem', lineHeight: '1.6', margin: 0 },

  // Navegación Inferior
  navInferior: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 20px', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)', zIndex: 1000 },
  navBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '80px' },
  navLabel: { fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em' },
  navBtnCentro: { width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #0058bc 0%, #0070eb 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0, 88, 188, 0.3)', transform: 'translateY(-15px)' },

  // Temas (Graphite / Light)
  dark: {
    fondoPrincipal: { backgroundColor: '#2f3034' },
    cristalBg: { backgroundColor: 'rgba(47, 48, 52, 0.7)' },
    cristalBgItem: { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
    cristalBgNav: { backgroundColor: 'rgba(47, 48, 52, 0.85)' },
    textoPrincipal: { color: '#ffffff' },
    textoSutil: { color: '#9ca3af' },
    bordeFantasma: { border: '1px solid rgba(255, 255, 255, 0.08)' },
    bordeFantasmaBottom: { borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
    bordeFantasmaTop: { borderTop: '1px solid rgba(255, 255, 255, 0.08)' },
    hoverBg: 'rgba(255, 255, 255, 0.06)'
  },
  light: {
    fondoPrincipal: { backgroundColor: '#faf9fe' },
    cristalBg: { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
    cristalBgItem: { backgroundColor: 'rgba(255, 255, 255, 1)' },
    cristalBgNav: { backgroundColor: 'rgba(250, 249, 254, 0.85)' },
    textoPrincipal: { color: '#111827' },
    textoSutil: { color: '#6b7280' },
    bordeFantasma: { border: '1px solid rgba(0, 0, 0, 0.05)' },
    bordeFantasmaBottom: { borderBottom: '1px solid rgba(0, 0, 0, 0.05)' },
    bordeFantasmaTop: { borderTop: '1px solid rgba(0, 0, 0, 0.05)' },
    hoverBg: 'rgba(0, 88, 188, 0.02)'
  }
};