import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <-- NUEVO: Importamos Autenticación

const firebaseConfig = {
    apiKey: "AIzaSyAcfACaG0ZkRhNdXmCNLqE-PqqL2KrG9q0",
    authDomain: "marshall-diagnostics.firebaseapp.com",
    projectId: "marshall-diagnostics",
    storageBucket: "marshall-diagnostics.firebasestorage.app",
    messagingSenderId: "909545236768",
    appId: "1:909545236768:web:4d9c08d7c7312be079cf45"
};

// Inicializamos Firebase, la Base de Datos y la Autenticación
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // <-- NUEVO: Inicializamos Autenticación

export { db, auth }; // <-- NUEVO: Exportamos auth para usarlo en el panel