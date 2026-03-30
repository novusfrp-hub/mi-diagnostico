import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Conecta con tus llaves

export default async function handler(req, res) {
  // Leemos qué paso está pidiendo la app (por defecto 'inicio')
  const idPaso = req.query.paso || 'inicio';

  try {
    // Vamos a la colección "pasos" en Firebase y buscamos el documento exacto
    const docRef = doc(db, "pasos", idPaso);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Si lo encuentra, se lo enviamos a la app
      res.status(200).json({ id: idPaso, ...docSnap.data() });
    } else {
      // Si no existe (ej. un link roto)
      res.status(404).json({ error: "Paso no encontrado", pregunta: "Error: Paso no existe", esFinal: true });
    }
  } catch (error) {
    console.error("Error conectando a Firebase:", error);
    res.status(500).json({ error: "Error conectando a la base de datos" });
  }
}