import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Conecta con tus llaves
import arbolData from '../data/arbol.json'; // Lee tu archivo actual

export default function MigrarDatos() {
    const [estado, setEstado] = useState('Listo para iniciar la transferencia...');
    const [progreso, setProgreso] = useState(0);

    const iniciarMigracion = async () => {
        setEstado('Subiendo datos a la nube... ¡No cierres la pestaña!');
        try {
            // Obtenemos todos los IDs (inicio, iphone_categorias, etc.)
            const llaves = Object.keys(arbolData);
            let subidos = 0;

            for (const llave of llaves) {
                const datosPaso = arbolData[llave];
                // Crea una colección llamada "pasos" y guarda cada documento con su ID original
                await setDoc(doc(db, "pasos", llave), datosPaso);
                subidos++;
                setProgreso(Math.round((subidos / llaves.length) * 100));
            }

            setEstado('✅ ¡Éxito total! Todos los diagnósticos están en Firebase.');
        } catch (error) {
            console.error(error);
            setEstado('❌ Hubo un error: ' + error.message);
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui, sans-serif', backgroundColor: '#faf9fe', minHeight: '100vh' }}>
            <h1 style={{ color: '#0058bc', fontWeight: '800' }}>☁️ Migración a la Nube</h1>
            <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '30px' }}>{estado}</p>

            {progreso > 0 && progreso < 100 && (
                <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto 30px', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${progreso}%`, height: '100%', backgroundColor: '#0058bc', transition: 'width 0.2s' }}></div>
                </div>
            )}

            <button
                onClick={iniciarMigracion}
                style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', background: 'linear-gradient(135deg, #0058bc 0%, #0070eb 100%)', color: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0, 88, 188, 0.2)' }}
            >
                🚀 Iniciar Migración a Firebase
            </button>
        </div>
    );
}