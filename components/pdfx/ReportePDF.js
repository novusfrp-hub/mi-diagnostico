import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Aquí definimos el diseño (tipografías, colores, márgenes) del PDF nativo
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
    header: { textAlign: 'center', borderBottom: '2pt solid #0058bc', paddingBottom: 15, marginBottom: 25 },
    title: { color: '#0058bc', fontSize: 24, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    subtitle: { color: '#4b5563', fontSize: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    box: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 5, border: '1pt solid #e5e7eb', width: '48%' },
    label: { color: '#111827', fontSize: 9, textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
    value: { fontSize: 12, color: '#374151' },
    section: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 5, border: '1pt solid #e5e7eb', marginBottom: 15 },
    sectionText: { fontSize: 11, color: '#374151', lineHeight: 1.4 },
    imageContainer: { marginTop: 15, alignItems: 'center', padding: 10, border: '1pt solid #e5e7eb', borderRadius: 5 },
    image: { maxWidth: '100%', maxHeight: 250, objectFit: 'contain' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#9ca3af', borderTop: '1pt solid #e5e7eb', paddingTop: 10 }
});

// Este es el "Molde" que recibe los datos de un teléfono y arma el PDF
const ReportePDF = ({ caso }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>MARSHALL CELL</Text>
                <Text style={styles.subtitle}>Reporte Técnico Oficial de Diagnóstico</Text>
            </View>

            <View style={styles.row}>
                <View style={styles.box}><Text style={styles.label}>Fecha de Ingreso</Text><Text style={styles.value}>{new Date(caso.fecha).toLocaleDateString()}</Text></View>
                <View style={styles.box}><Text style={styles.label}>ID de Caso</Text><Text style={styles.value}>#{caso.id.substring(0, 8).toUpperCase()}</Text></View>
            </View>
            <View style={styles.row}>
                <View style={styles.box}><Text style={styles.label}>Marca</Text><Text style={styles.value}>{caso.marca}</Text></View>
                <View style={styles.box}><Text style={styles.label}>Modelo</Text><Text style={styles.value}>{caso.modelo}</Text></View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Síntomas Reportados</Text>
                <Text style={styles.sectionText}>{caso.sintomas}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Protocolo de Reparación / Diagnóstico</Text>
                <Text style={styles.sectionText}>{caso.protocolo || 'Pendiente de evaluación técnica profunda.'}</Text>
            </View>

            {caso.imgUrl && (
                <View style={styles.imageContainer}>
                    <Text style={styles.label}>Evidencia Técnica Adjunta</Text>
                    <Image src={caso.imgUrl} style={styles.image} />
                </View>
            )}

            <Text style={styles.footer}>Generado por Marshall Cell CRM | Laboratorio de Microelectrónica - Oropesa, Cusco, Perú</Text>
        </Page>
    </Document>
);

export default ReportePDF;