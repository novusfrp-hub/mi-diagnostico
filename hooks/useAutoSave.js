import { useState, useEffect, useCallback, useRef } from 'react';

export default function useAutoSave(claveLocalStorage, datosActuales, guardarEnNube) {
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(null);
  
  const datosPreviosRef = useRef(null);
  const guardandoRef = useRef(false);
  const inicializadoRef = useRef(false);

  useEffect(() => {
    if (claveLocalStorage && !inicializadoRef.current) {
      const guardado = localStorage.getItem(claveLocalStorage);
      if (guardado) {
        try {
          const datos = JSON.parse(guardado);
          datosPreviosRef.current = datos;
          setCambiosPendientes(true);
          setUltimaSincronizacion(new Date(datos._timestamp || Date.now()));
        } catch (e) {
          console.warn('Error al leer localStorage:', e);
        }
      }
      inicializadoRef.current = true;
    }
  }, [claveLocalStorage]);

  useEffect(() => {
    if (!claveLocalStorage || !inicializadoRef.current || guardandoRef.current) return;

    const datosActualesStr = JSON.stringify({ ...datosActuales, _timestamp: Date.now() });
    const datosPreviosStr = JSON.stringify(datosPreviosRef.current);
    
    if (datosPreviosStr !== datosActualesStr) {
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
    datosPreviosRef.current = null;
    setCambiosPendientes(false);
  }, [claveLocalStorage]);

  return {
    cambiosPendientes,
    guardando,
    ultimaSincronizacion,
    sincronizarAhora,
    descartarCambios
  };
}