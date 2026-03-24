import { useState, useEffect } from 'react';
// 1. Importamos la herramienta de animaciones
import { motion, AnimatePresence } from 'framer-motion';

export default function AppDiagnostico() {
  const [pasoActual, setPasoActual] = useState(null);
  const [historial, setHistorial] = useState([]); 
  const [cargando, setCargando] = useState(true);

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

  useEffect(() => {
    cargarPaso('inicio');
  }, []);

  if (cargando || !pasoActual) {
    return (
      <div style={estilos.contenedor}>
        <motion.h2 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
          style={{color: 'white'}}
        >
          Cargando sistema...
        </motion.h2>
      </div>
    );
  }

  return (
    <div style={estilos.contenedor}>
      <motion.h1 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.5 }}
        style={estilos.titulo}
      >
        🛠️ Protocolo de Diagnóstico
      </motion.h1>
      
      {/* AnimatePresence permite animar elementos cuando cambian o desaparecen */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={pasoActual.id} // Esta clave hace que la tarjeta se re-anime cada vez que cambia la pregunta
          initial={{ x: 50, opacity: 0 }} // Empieza movido a la derecha e invisible
          animate={{ x: 0, opacity: 1 }}  // Termina en su lugar y visible
          exit={{ x: -50, opacity: 0 }}   // Cuando se va, sale hacia la izquierda
          transition={{ duration: 0.3 }}  // Dura 0.3 segundos
          style={estilos.tarjeta}
        >
          <h2 style={estilos.pregunta}>{pasoActual.pregunta}</h2>

          {pasoActual.esFinal ? (
            <motion.button 
              whileHover={{ scale: 1.05 }} // Efecto al pasar el ratón
              whileTap={{ scale: 0.95 }}   // Efecto al hacer clic
              style={estilos.botonReinicio} 
              onClick={() => { setHistorial([]); cargarPaso('inicio'); }}
            >
              ↻ Comenzar nuevo diagnóstico
            </motion.button>
          ) : (
            <div style={estilos.cajaOpciones}>
              {pasoActual.opciones?.map((opcion, index) => (
                <motion.button 
                  key={index} 
                  whileHover={{ scale: 1.02 }} // Crece un poquito al pasar el ratón
                  whileTap={{ scale: 0.98 }}
                  style={estilos.botonOpcion}
                  onClick={() => cargarPaso(opcion.siguientePaso)}
                >
                  {opcion.texto}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {historial.length > 0 && !pasoActual.esFinal && (
        <motion.button 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          style={estilos.botonAtras} 
          onClick={irAtras}
        >
          ⬅ Volver al paso anterior
        </motion.button>
      )}
    </div>
  );
}

// Estilos modernos (Modo oscuro / elegante)
const estilos = {
  contenedor: { padding: '5vh 20px', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  titulo: { color: '#f8fafc', marginBottom: '40px', fontSize: '2rem', fontWeight: 'bold', letterSpacing: '-0.5px' },
  tarjeta: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '500px', textAlign: 'center' },
  pregunta: { fontSize: '24px', color: '#1e293b', marginBottom: '30px', fontWeight: '600' },
  cajaOpciones: { display: 'flex', flexDirection: 'column', gap: '16px' },
  botonOpcion: { padding: '16px 24px', fontSize: '16px', fontWeight: '500', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' },
  botonReinicio: { padding: '16px 24px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '10px' },
  botonAtras: { marginTop: '30px', padding: '12px 24px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '12px', cursor: 'pointer', fontWeight: '500' }
};