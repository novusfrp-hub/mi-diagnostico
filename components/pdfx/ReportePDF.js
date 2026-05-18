import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
    header: { textAlign: 'center', borderBottom: '2pt solid #0058bc', paddingBottom: 15, marginBottom: 25 },
    title: { color: '#0058bc', fontSize: 24, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    subtitle: { color: '#4b5563', fontSize: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    box: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 5, border: '1pt solid #e5e7eb', width: '48%' },
    boxThird: { backgroundColor: '#f9fafb', padding: 10, borderRadius: 5, border: '1pt solid #e5e7eb', width: '31%' },
    label: { color: '#111827', fontSize: 9, textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
    value: { fontSize: 12, color: '#374151' },
    section: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 5, border: '1pt solid #e5e7eb', marginBottom: 15 },
    sectionTitle: { color: '#0058bc', fontSize: 10, fontWeight: 'bold', marginBottom: 8, borderBottom: '1pt solid #e5e7eb', paddingBottom: 6 },
    sectionText: { fontSize: 11, color: '#374151', lineHeight: 1.4 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
    chip: { backgroundColor: '#eef2ff', padding: '4 8', borderRadius: 4, fontSize: 8, color: '#4338ca', marginRight: 4, marginBottom: 4 },
    chipDanger: { backgroundColor: '#fef2f2', padding: '4 8', borderRadius: 4, fontSize: 8, color: '#dc2626', marginRight: 4, marginBottom: 4 },
    chipWarning: { backgroundColor: '#fff7ed', padding: '4 8', borderRadius: 4, fontSize: 8, color: '#ea580c', marginRight: 4, marginBottom: 4 },
    chipSuccess: { backgroundColor: '#ecfdf5', padding: '4 8', borderRadius: 4, fontSize: 8, color: '#059669', marginRight: 4, marginBottom: 4 },
    badgeReparado: { backgroundColor: '#ecfdf5', color: '#059669', padding: '4 10', borderRadius: 10, fontSize: 9, fontWeight: 'bold' },
    badgePendiente: { backgroundColor: '#fff7ed', color: '#c2410c', padding: '4 10', borderRadius: 10, fontSize: 9, fontWeight: 'bold' },
    badgeFalla: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '4 10', borderRadius: 10, fontSize: 9, fontWeight: 'bold' },
    badgeEntregado: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4 10', borderRadius: 10, fontSize: 9, fontWeight: 'bold' },
    hwSection: { flexDirection: 'row', gap: 10, marginBottom: 15, backgroundColor: '#f5f3ff', padding: 10, borderRadius: 5, border: '1pt solid #ddd6fe' },
    lineaBox: { backgroundColor: '#ffffff', padding: 10, borderRadius: 4, border: '1pt solid #e5e7eb', marginBottom: 8 },
    lineaName: { fontSize: 10, fontWeight: 'bold', color: '#1e40af', marginBottom: 6 },
    imageContainer: { marginTop: 15, alignItems: 'center', padding: 10, border: '1pt solid #e5e7eb', borderRadius: 5 },
    image: { maxWidth: '100%', maxHeight: 600, objectFit: 'contain' },
    imageSmall: { width: '100%', height: 300, objectFit: 'contain', borderRadius: 5, backgroundColor: '#000' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#9ca3af', borderTop: '1pt solid #e5e7eb', paddingTop: 10 },
    pageBreak: { marginBottom: 20 }
});

const ESTADOS_COLOR = { 'Corto': '#dc2626', 'Fuga': '#ea580c', 'Abierto': '#2563eb', 'Daño Físico': '#db2777' };

const ReportePDF = ({ caso }) => {
    const consumoUsb = caso.consumoUsb || {};
    const consumoFuente = caso.consumoFuente || {};
    const lineas = caso.lineasAfectadas || [];
    const tieneConsumos = consumoUsb.voltaje || consumoUsb.corriente || consumoUsb.comportamiento ||
        consumoUsb.conBateria || consumoUsb.sinBateria ||
        consumoFuente.inicial || consumoFuente.postPower || consumoFuente.comportamiento;

    return (
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

            <View style={styles.row}>
                <View style={{ ...styles.box, width: '68%' }}>
                    <Text style={styles.label}>Técnico Responsable</Text>
                    <Text style={styles.value}>{caso.tecnico || 'Marshall Cell'}</Text>
                </View>
                <View style={{ ...styles.box, width: '30%', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={styles.label}>Estado Final</Text>
                    {caso.estadoReparacion === 'Reparado' && <Text style={styles.badgeReparado}>REPARADO</Text>}
                    {caso.estadoReparacion === 'Sin Solucion' && <Text style={styles.badgeFalla}>SIN SOLUCIÓN</Text>}
                    {caso.estadoReparacion === 'Entregado' && <Text style={styles.badgeEntregado}>ENTREGADO</Text>}
                    {(!caso.estadoReparacion || caso.estadoReparacion === 'Pendiente') && <Text style={styles.badgePendiente}>PENDIENTE</Text>}
                </View>
            </View>

            {/* --- FICHA TÉCNICA HARDWARE --- */}
            {(caso.hardware?.cpu || caso.hardware?.pmic || caso.hardware?.memoria) && (
                <View style={styles.hwSection}>
                    {caso.hardware.cpu ? <View style={{ flex: 1 }}><Text style={styles.label}>Procesador</Text><Text style={{ fontSize: 10 }}>{caso.hardware.cpu}</Text></View> : null}
                    {caso.hardware.pmic ? <View style={{ flex: 1 }}><Text style={styles.label}>PMIC</Text><Text style={{ fontSize: 10 }}>{caso.hardware.pmic}</Text></View> : null}
                    {caso.hardware.memoria ? <View style={{ flex: 1 }}><Text style={styles.label}>Memoria</Text><Text style={{ fontSize: 10 }}>{caso.hardware.memoria}</Text></View> : null}
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.label}>Síntomas Reportados</Text>
                <Text style={styles.sectionText}>{caso.sintomas}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Protocolo de Reparación / Diagnóstico</Text>
                <Text style={styles.sectionText}>{caso.protocolo || 'Pendiente de evaluación técnica profunda.'}</Text>
            </View>

            {caso.solucionEmpleada && (
                <View style={{ ...styles.section, borderLeft: '4pt solid #10b981' }}>
                    <Text style={{ ...styles.label, color: '#10b981' }}>Solución Empleada (Éxito)</Text>
                    <Text style={{ ...styles.sectionText, fontWeight: 'bold' }}>{caso.solucionEmpleada}</Text>
                </View>
            )}

            {caso.imgUrl && (
                <View style={styles.imageContainer}>
                    <Text style={styles.label}>Evidencia Técnica Adjunta</Text>
                    <Image src={caso.imgUrl} style={styles.image} />
                </View>
            )}

            {/* --- CONSUMOS --- */}
            {tieneConsumos && (
                <View style={{ ...styles.section, marginTop: 15 }}>
                    <Text style={styles.sectionTitle}>MEDICIONES DE CONSUMO</Text>
                    {/* USB */}
                    {(consumoUsb.voltaje || consumoUsb.corriente || consumoUsb.comportamiento) && (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#3b82f6', marginBottom: 6 }}>Consumo USB</Text>
                            <View style={styles.row}>
                                {consumoUsb.voltaje ? <View style={styles.boxThird}><Text style={styles.label}>Voltaje</Text><Text style={styles.value}>{consumoUsb.voltaje}V</Text></View> : null}
                                {consumoUsb.corriente ? <View style={styles.boxThird}><Text style={styles.label}>Corriente</Text><Text style={styles.value}>{consumoUsb.corriente}A</Text></View> : null}
                                {consumoUsb.comportamiento ? <View style={styles.boxThird}><Text style={styles.label}>Comportamiento</Text><Text style={styles.value}>{consumoUsb.comportamiento}</Text></View> : null}
                            </View>
                            <View style={styles.row}>
                                {consumoUsb.conBateria ? <View style={styles.boxThird}><Text style={styles.label}>Con Batería</Text><Text style={styles.value}>{consumoUsb.conBateria}A</Text></View> : null}
                                {consumoUsb.sinBateria ? <View style={styles.boxThird}><Text style={styles.label}>Sin Batería</Text><Text style={styles.value}>{consumoUsb.sinBateria}A</Text></View> : null}
                            </View>
                        </View>
                    )}
                    {/* Fuente */}
                    {(consumoFuente.inicial || consumoFuente.postPower || consumoFuente.comportamiento) && (
                        <View>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#f97316', marginBottom: 6 }}>Consumo Fuente</Text>
                            <View style={styles.row}>
                                {consumoFuente.inicial ? <View style={styles.boxThird}><Text style={styles.label}>Inicial</Text><Text style={styles.value}>{consumoFuente.inicial}A</Text></View> : null}
                                {consumoFuente.postPower ? <View style={styles.boxThird}><Text style={styles.label}>Post-Power</Text><Text style={styles.value}>{consumoFuente.postPower}A</Text></View> : null}
                                {consumoFuente.comportamiento ? <View style={styles.boxThird}><Text style={styles.label}>Comportamiento</Text><Text style={styles.value}>{consumoFuente.comportamiento}</Text></View> : null}
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* --- TOPOLOGÍA --- */}
            {lineas.length > 0 && (
                <View style={{ ...styles.section, marginTop: 15 }}>
                    <Text style={styles.sectionTitle}>TOPOLOGÍA AFECTADA</Text>
                    {lineas.map((linea, i) => (
                        <View key={i} style={styles.lineaBox}>
                            <Text style={styles.lineaName}>LINEA: {linea.nombre || `Línea #${i + 1}`}</Text>
                            {(linea.componentes || []).length > 0 && (
                                <View style={{ marginBottom: 6 }}>
                                    <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 4 }}>Componentes afectados:</Text>
                                    <View style={styles.chipContainer}>
                                        {(linea.componentes || []).map((comp, j) => (
                                            <Text key={j} style={[styles.chip, { borderLeft: `3pt solid ${ESTADOS_COLOR[comp.estado] || '#9ca3af'}` }]}>
                                                {comp.tipo} {comp.nomenclatura} — {comp.estado}
                                            </Text>
                                        ))}
                                    </View>
                                </View>
                            )}
                            {(linea.imagenes || []).length > 0 && (
                                <View style={{ gap: 10, marginTop: 10 }}>
                                    {(linea.imagenes || []).map((img, j) => (
                                        img.url ? (
                                            <View key={j} style={{ alignItems: 'center', backgroundColor: '#000', borderRadius: 5, padding: 5 }}>
                                                <Image src={img.url} style={styles.imageSmall} />
                                            </View>
                                        ) : null
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}

            <Text style={styles.footer}>Generado por Marshall Cell CRM | Laboratorio de Microelectrónica - Oropesa, Cusco, Perú</Text>
        </Page>
    </Document>
    );
};

export default ReportePDF;