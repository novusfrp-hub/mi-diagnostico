import { useState, useEffect, useCallback, useRef } from 'react';

export default function useAutoSave(claveLocalStorage, datosActuales, guardarEnNube) {
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(null);
  
  const datosPreviosRef = useRef(null);
  const guardandoRef = useRef(false);
  const prevClaveRef = useRef(null);

  // Cargar borrador si cambia la clave
  useEffect(() => {
    if (!claveLocalStorage) {
      setCambiosPendientes(false);
      datosPreviosRef.current = null;
      prevClaveRef.current = null;
      return;
    }

    if (prevClaveRef.current !== claveLocalStorage) {
      prevClaveRef.current = claveLocalStorage;
      const guardado = localStorage.getItem(claveLocalStorage);
      if (guardado) {
        try {
          const datos = JSON.parse(guardado);
          datosPreviosRef.current = datos;
          setCambiosPendientes(true);
          setUltimaSincronizacion(new Date(datos._timestamp || Date.now()));
          return;
        } catch (e) {
          console.warn('Error al leer localStorage:', e);
        }
      }
      // Si no hay borrador previo, usar el estado actual como base
      datosPreviosRef.current = datosActuales;
      setCambiosPendientes(false);
    }
  }, [claveLocalStorage, datosActuales]);

  // Guardar en localStorage si hay cambios reales (sin considerar _timestamp)
  useEffect(() => {
    if (!claveLocalStorage || prevClaveRef.current !== claveLocalStorage || guardandoRef.current || !datosActuales) return;

    const limpiarTimestamp = (obj) => {
      if (!obj) return null;
      const { _timestamp, ...resto } = obj;
      return resto;
    };

    const datosActualesLimpiosStr = JSON.stringify(limpiarTimestamp(datosActuales));
    const datosPreviosLimpiosStr = JSON.stringify(limpiarTimestamp(datosPreviosRef.current));
    
    if (datosPreviosLimpiosStr !== datosActualesLimpiosStr) {
      try {
        const datosParaGuardar = { ...datosActuales, _timestamp: Date.now() };
        localStorage.setItem(claveLocalStorage, JSON.stringify(datosParaGuardar));
        datosPreviosRef.current = datosParaGuardar;
        setCambiosPendientes(true);
      } catch (e) {
        console.warn('Error al guardar en localStorage:', e);
      }
    }
  }, [claveLocalStorage, datosActuales]);

  const sincronizarAhora = useCallback(async () => {
    if (guardandoRef.current) return;
    
    setGuardando(true);
    guardandoRef.current = true;
    
    try {
      await guardarEnNube();
      
      if (claveLocalStorage) {
        localStorage.removeItem(claveLocalStorage);
      }
      datosPreviosRef.current = datosActuales;
      setCambiosPendientes(false);
      setUltimaSincronizacion(new Date());
      
      return true;
    } catch (error) {
      console.error('Error al sincronizar con la nube:', error);
      throw error;
    } finally {
      setGuardando(false);
      guardandoRef.current = false;
    }
  }, [claveLocalStorage, datosActuales, guardarEnNube]);

  const descartarCambios = useCallback(() => {
    if (claveLocalStorage) {
      localStorage.removeItem(claveLocalStorage);
    }
    datosPreviosRef.current = datosActuales;
    setCambiosPendientes(false);
  }, [claveLocalStorage, datosActuales]);

  return {
    cambiosPendientes,
    guardando,
    ultimaSincronizacion,
    sincronizarAhora,
    descartarCambios
  };
}