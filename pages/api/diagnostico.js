// Importamos nuestro archivo secreto con todas las fallas
import arbolDeDiagnostico from '../../data/arbol.json';

export default function handler(req, res) {
  // Leemos qué paso nos está pidiendo React. Si no pide nada, le damos el 'inicio'
  const pasoSolicitado = req.query.paso || 'inicio'; 
  
  // Buscamos ese paso específico en nuestro JSON
  const datosDelPaso = arbolDeDiagnostico[pasoSolicitado];

  if (datosDelPaso) {
    // Si lo encontramos, se lo enviamos al usuario con un código 200 (Éxito)
    res.status(200).json({ id: pasoSolicitado, ...datosDelPaso });
  } else {
    // Si hay un error o no existe la falla, enviamos un error 404
    res.status(404).json({ error: "Paso no encontrado en el diagnóstico" });
  }
}