import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import io from 'socket.io-client';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const SERVER_URL = 'http://192.168.0.4:3000';

export default function AmbienteScreen({ navigation }) {
    const [socket, setSocket] = useState(null);
    const [sensorTemValue, setSensorTemValue] = useState(25); // Inicia en 25°
    const [ldrValue, setLdrValue] = useState(20);
    const [conectado, setConectado] = useState(false);
 
    const [ventiladorEncendido, setVentiladorEncendido] = useState(false);
    const [ventanaAbierta, setVentanaAbierta] = useState(false);
    const [ledInvernaderoEncendido, setLedInvernaderoEncendido] = useState(false);
    const [led1CalleEncendido, setLed1CalleEncendido] = useState(false);
    const [led2CalleEncendido, setLed2CalleEncendido] = useState(false);

    useEffect(() => {
        const nuevaConexion = io(SERVER_URL);
        setSocket(nuevaConexion);

        nuevaConexion.on('connect', () => setConectado(true));
        nuevaConexion.on('disconnect', () => setConectado(false));

        nuevaConexion.on('temperatura_data', (data) => setSensorTemValue(data.value));
        nuevaConexion.on('ldr_data', (data) => setLdrValue(data.value));

        nuevaConexion.on('ventilador_state', (data) => setVentiladorEncendido(!!data.encendido));
        nuevaConexion.on('ventana_state', (data) => setVentanaAbierta(!!data.abierta));
        nuevaConexion.on('ledinvernadero_state', (data) => setLedInvernaderoEncendido(!!data.encendido));
        nuevaConexion.on('led1calle_state', (data) => setLed1CalleEncendido(!!data.encendido));
        nuevaConexion.on('led2calle_state', (data) => setLed2CalleEncendido(!!data.encendido));

        return () => nuevaConexion.disconnect();
    }, []);

    const enviar = (evento, action) => {
        if (!socket || !conectado) {
            Alert.alert('Error', 'No estas conectado al servidor');
            return;
        }
        socket.emit(evento, { action });
    };

    const encenderVentilador = () => enviar('command_ventilador', 'ON');
    const apagarVentilador = () => enviar('command_ventilador', 'OFF');
    const abrirVentana = () => enviar('command_ventana', 'ABRIR');
    const cerrarVentana = () => enviar('command_ventana', 'CERRAR');
    
    const encenderLucesJardin = () => {
        enviar('command_led1calle', 'ON');
        enviar('command_led2calle', 'ON');
    };
    const apagarLucesJardin = () => {
        enviar('command_led1calle', 'OFF');
        enviar('command_led2calle', 'OFF');
    };

    const lucesJardinEncendidas = led1CalleEncendido && led2CalleEncendido;
    const esDeNoche = ldrValue < 25;

    // --- CONDICIONALES DE TEMPERATURA ---
    const TEMPERATURA_ALTA = sensorTemValue > 27;  
    const TEMPERATURA_BAJA = sensorTemValue < 20;  

    return (
        <SafeAreaView style={styles.areaSegura}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contenidoScroll}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.apartadosTitulo}>
                    <MaterialCommunityIcons style={styles.icono} name="greenhouse" size={50} color="white" />
                    <View style={styles.apartado2Titulo}>
                        <Text style={styles.tituloAmbiente}>Ambiente</Text>
                        <Text style={styles.subtitle}>Regule la temperatura, controle el techo y supervise el entorno.</Text>
                    </View>
                </View>

                {/* SENSOR DE TEMPERATURA DINÁMICO */}
                <View style={[
                    styles.cardTempDinamica, 
                    TEMPERATURA_ALTA ? styles.tempAltaFondo : (TEMPERATURA_BAJA ? styles.tempBajaFondo : styles.tempNormalFondo)
                ]}>
                    <View style={styles.sensoresSection}>
                        <Text style={[styles.titulo, TEMPERATURA_ALTA ? styles.textoAlertaRoja : (TEMPERATURA_BAJA ? styles.textoAlertaAzul : styles.textoNormal)]}>
                            {TEMPERATURA_ALTA ? "⚠️ Temperatura Alta" : (TEMPERATURA_BAJA ? "❄️ Temperatura Baja" : "🌡️ Temperatura Estable")}
                        </Text>
                        <View style={styles.sensoresRow}>
                            <View style={styles.sensorBox}>
                                <FontAwesome5 
                                    style={styles.iconoSensor} 
                                    name={TEMPERATURA_ALTA ? "temperature-high" : "temperature-low"} 
                                    size={50} 
                                    color={TEMPERATURA_ALTA ? "#D32F2F" : (TEMPERATURA_BAJA ? "#1976D2" : "#3c5a14")} 
                                />
                                <Text style={styles.sensorValor}>{sensorTemValue.toFixed(1)}°</Text>
                                <Text style={styles.sensorLabel}>
                                    {TEMPERATURA_ALTA ? "Ha subido bastante" : (TEMPERATURA_BAJA ? "Ha bajado bastante" : "Nivel óptimo actual")}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* INDICADOR VISUAL DE DÍA / NOCHE */}
                <View style={[styles.cardClima, esDeNoche ? styles.fondoNoche : styles.fondoDia]}>
                    <View style={styles.climaContenido}>
                        <MaterialCommunityIcons 
                            name={esDeNoche ? "weather-night" : "white-balance-sunny"} 
                            size={65} 
                            color={esDeNoche ? "#90caf9" : "#f57c00"} 
                        />
                        <View style={styles.climaTextoContainer}>
                            <Text style={[styles.climaTituloEstado, esDeNoche ? styles.textoNoche : styles.textoDia]}>
                                {esDeNoche ? "🌙 ES DE NOCHE" : "☀️ ES DE DÍA"}
                            </Text>
                            <Text style={styles.climaSubtext}>
                                {esDeNoche ? "Luz interna encendida automáticamente." : "Luz interna apagada."}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* VENTILACIÓN Y TECHO */}
                <View style={styles.card}>
                    <Text style={styles.titulo}>Sistema de Ventilación</Text>
                    
                    <View style={styles.apartadoProgramado}>
                        <Text style={styles.titulo}>Ventilador</Text>
                        <Text style={[styles.estado, ventiladorEncendido ? styles.conectado : styles.desconectado]}>
                            {ventiladorEncendido ? 'ENCENDIDO' : 'APAGADO'}
                        </Text>
                        <View style={styles.botones}>
                            <TouchableOpacity style={[styles.boton, styles.botonEncender]} onPress={encenderVentilador} disabled={!conectado}>
                                <Text style={styles.textoBoton}>ENCENDER</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.boton, styles.botonApagar]} onPress={apagarVentilador} disabled={!conectado}>
                                <Text style={styles.textoBoton}>APAGAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.apartadoProgramado}>
                        <Text style={styles.titulo}>Techo</Text>
                        <Text style={[styles.estado, ventanaAbierta ? styles.conectado : styles.desconectado]}>
                            {ventanaAbierta ? 'ABIERTO' : 'CERRADO'}
                        </Text>
                        <View style={styles.botones}>
                            <TouchableOpacity style={[styles.boton, styles.botonEncender]} onPress={abrirVentana} disabled={!conectado}>
                                <Text style={styles.textoBoton}>ABRIR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.boton, styles.botonApagar]} onPress={cerrarVentana} disabled={!conectado}>
                                <Text style={styles.textoBoton}>CERRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* ILUMINACIÓN (INCLUYE LUCES DE JARDÍN) */}
                <View style={styles.card}>
                    <Text style={styles.titulo}>Iluminación</Text>
                    <Text style={styles.descripcionInfo}>La luz del invernadero opera de forma automática según la luz ambiental. Las luces de jardín se controlan manualmente.</Text>
                    
                    {/* Luz del Invernadero (AUTOMÁTICA) */}
                    <View style={styles.apartadoLuces}>
                        <View style={styles.apartadoLuz}>
                            <Text style={styles.iconoProgramado}>💡</Text>
                            <Text style={[styles.estadoLuces, esDeNoche ? styles.conectado : styles.desconectado]}>
                                {esDeNoche ? 'AUTOMÁTICA (ON)' : 'AUTOMÁTICA (OFF)'}
                            </Text>
                        </View>
                        <View style={styles.textoProgramado}>
                            <Text style={styles.subtituloProgramado}>Luz del Invernadero</Text>
                            <Text style={styles.detalleAuto}>Se enciende sola de noche</Text>
                        </View>
                    </View>

                    {/* Luces del Jardín (MANUALES) */}
                    <View style={styles.apartadoLuces}>
                        <View style={styles.apartadoLuz}>
                            <Text style={styles.iconoProgramado}>💡</Text>
                            <Text style={[styles.estadoLuces, lucesJardinEncendidas ? styles.conectado : styles.desconectado]}>
                                {lucesJardinEncendidas ? 'ENCENDIDA' : 'APAGADA'}
                            </Text>
                        </View>
                        <View style={styles.textoProgramado}>
                            <Text style={styles.subtituloProgramado}>Luces del Jardín</Text>
                            <View style={styles.apartadoBotonesLuces}>
                                <View style={styles.botones2}>
                                    <TouchableOpacity style={[styles.boton2, styles.botonEncender]} onPress={encenderLucesJardin} disabled={!conectado}>
                                        <Text style={styles.textoBoton2}>ENCENDER</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.boton2, styles.botonApagar]} onPress={apagarLucesJardin} disabled={!conectado}>
                                        <Text style={styles.textoBoton2}>APAGAR</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    areaSegura: { flex: 1, backgroundColor: '#F3E9DC' },
    scrollView: { flex: 1 },
    contenidoScroll: { flexGrow: 1, padding: 20, paddingBottom: 30 },
    apartadosTitulo: {
        flexDirection: 'row', backgroundColor: '#3c5a14', borderRadius: 15, padding: 18,
        marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#c8e1c6', marginTop: 15,
    },
    icono: { marginRight: 15 },
    apartado2Titulo: { flex: 1 },
    tituloAmbiente: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#AAD576' },
    subtitle: { fontSize: 14, color: 'white', lineHeight: 20 },
    card: {
        backgroundColor: 'white', borderRadius: 15, padding: 20, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
        marginTop: 20, borderWidth: 1, borderColor: '#c6cbe1',
    },
    cardTempDinamica: {
        borderRadius: 15, padding: 20, marginTop: 20, borderWidth: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
    },
    tempNormalFondo: { backgroundColor: '#FFFFFF', borderColor: '#c6cbe1' },
    tempAltaFondo: { backgroundColor: '#FFEBEE', borderColor: '#D32F2F' },
    tempBajaFondo: { backgroundColor: '#E3F2FD', borderColor: '#1976D2' },
    textoAlertaRoja: { color: '#C62828' },
    textoAlertaAzul: { color: '#1565C0' },
    textoNormal: { color: '#3c5a14' },

    cardClima: {
        borderRadius: 15, padding: 20, marginTop: 20, borderWidth: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
    },
    fondoDia: { backgroundColor: '#FFF9C4', borderColor: '#FBC02D' },
    fondoNoche: { backgroundColor: '#3e4699', borderColor: '#5c6ac7' },
    climaContenido: { flexDirection: 'row', alignItems: 'center' },
    climaTextoContainer: { flex: 1, marginLeft: 15 },
    climaTituloEstado: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
    textoDia: { color: '#E65100' },
    textoNoche: { color: '#E3F2FD' },
    climaSubtext: { fontSize: 13, color: '#424242', lineHeight: 18 },
    sensorValor: { fontSize: 60, fontWeight: 'bold', color: '#3c5a14' },
    sensorBox: {
        backgroundColor: '#F3E9DC', borderRadius: 15, paddingVertical: 20,
        paddingHorizontal: 30, alignItems: 'center', minWidth: 300,
    },
    titulo: { fontSize: 23, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#3c5a14' },
    iconoSensor: { fontSize: 45, marginLeft: 10 },
    sensorLabel: { fontSize: 14, color: '#3c5a14' },
    sensoresSection: { marginVertical: 10 },
    estado: { textAlign: 'center', fontSize: 14, padding: 10, borderRadius: 10, marginBottom: 10, marginTop: 10, width: '50%' },
    estadoLuces: { textAlign: 'center', fontSize: 12, padding: 6, borderRadius: 8, marginBottom: 1, marginTop: 1, width: '100%' },
    conectado: { backgroundColor: '#e8f5e9', color: '#6A994E', fontWeight: 'bold' },
    desconectado: { backgroundColor: '#F3E9DC', color: '#58391b', fontWeight: 'bold' },
    botones: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 },
    boton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, minWidth: 120, alignItems: 'center', margin: 5 },
    botonEncender: { backgroundColor: '#2e7d32' },
    botonApagar: { backgroundColor: '#58391b' },
    textoBoton: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    sensoresRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
    apartadoProgramado: { alignItems: 'center', backgroundColor: '#F3E9DC', padding: 15, borderRadius: 12, marginTop: 15, marginBottom: 10 },
    apartadoLuces: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E9DC',
        padding: 7, paddingTop: 15, paddingBottom: 15, borderRadius: 12, marginTop: 5, marginBottom: 10
    },
    apartadoLuz: { flexDirection: 'column', marginRight: 12, width: '32%' },
    subtituloProgramado: { fontSize: 18, color: '#3c5a14', fontWeight: 'bold' },
    detalleAuto: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 4 },
    textoProgramado: { flex: 1 },
    botones2: { flexDirection: 'row', marginTop: 5, width: '50%' },
    boton2: { paddingVertical: 8, paddingHorizontal: 8, borderRadius: 10, minWidth: 95, alignItems: 'center', margin: 2 },
    textoBoton2: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    descripcionInfo: { fontSize: 14, color: '#6B5142', lineHeight: 22, textAlign: 'justify', marginTop: 10, marginBottom: 5 },
    iconoProgramado: { fontSize: 35, marginLeft: 20, marginBottom: 10 },
});