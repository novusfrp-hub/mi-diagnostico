import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Las "llaves" de tu proyecto Marshall Diagnostics
const firebaseConfig = {
    apiKey: "AIzaSyAcfACaG0ZkRhNdXmCNLqE-PqqL2KrG9q0",
    authDomain: "marshall-diagnostics.firebaseapp.com",
    projectId: "marshall-diagnostics",
    storageBucket: "marshall-diagnostics.firebasestorage.app",
    messagingSenderId: "909545236768",
    appId: "1:909545236768:web:4d9c08d7c7312be079cf45"
};

// Inicializamos Firebase y la Base de Datos
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };