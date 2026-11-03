import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView, Image } from 'react-native';
import io from 'socket.io-client';

//CAMBIAR IP
const SERVER_URL = 'http://192.168.0.32:3000';

export default function RiegoScreen({ navigation }) {
    const [socket, setSocket] = useState(null);
    const [sensorValue, setSensorValue] = useState(0);   // humedad 1
    const [sensor2Value, setSensor2Value] = useState(0);  // humedad 2
    const [conectado, setConectado] = useState(false);
    const [techoAbierto, setTechoAbierto] = useState(false);
    const [bombaEncendida, setBombaEncendida] = useState(false);
//asdasdasd
    useEffect(() => {
        const nuevaConexion = io(SERVER_URL);
        setSocket(nuevaConexion);

        nuevaConexion.on('connect', () => {
            setConectado(true);
            console.log('Conectado al servidor');
        });

        nuevaConexion.on('disconnect', () => {
            setConectado(false);
            console.log('Desconectado del servidor');
        });

        nuevaConexion.on('sensor_data', (data) => {
            setSensorValue(data.value);
            console.log(`Sensor 1: ${data.value}`);
        });

        nuevaConexion.on('sensor2_data', (data) => {
            setSensor2Value(data.value);
            console.log(`Sensor 2: ${data.value}`);
        });

        nuevaConexion.on('techo_state', (data) => {
            console.log('[APP] techo_state recibido:', data);
            if (data && data.abierto !== undefined) {
                setTechoAbierto(data.abierto);
            }
        });

        // Estado real de la bomba enviado por el Arduino
        nuevaConexion.on('bomba_state', (data) => {
            console.log('[APP] bomba_state recibido:', data);
            if (data && data.encendida !== undefined) {
                setBombaEncendida(data.encendida);
            }
        });

        return () => {
            nuevaConexion.disconnect();
        };
    }, []);

    const abrirTecho = () => {
        if (!socket || !conectado) {
            Alert.alert('Error', 'No estas conectado al servidor');
            return;
        }
        socket.emit('command_techo', { action: 'ABRIR' });
        console.log('[APP] Enviando: TECHO ABRIR');
    };

    const cerrarTecho = () => {
        if (!socket || !conectado) {
            Alert.alert('Error', 'No estas conectado al servidor');
            return;
        }
        socket.emit('command_techo', { action: 'CERRAR' });
        console.log('[APP] Enviando: TECHO CERRAR');
    };

    const encenderBomba = () => {
        if (!socket || !conectado) {
            Alert.alert('Error', 'No estas conectado al servidor');
            return;
        }
        socket.emit('command_bomba', { action: 'ON' });
        console.log('[APP] Enviando: BOMBA ON');
    };

    const apagarBomba = () => {
        if (!socket || !conectado) {
            Alert.alert('Error', 'No estas conectado al servidor');
            return;
        }
        socket.emit('command_bomba', { action: 'OFF' });
        console.log('[APP] Enviando: BOMBA OFF');
    };

    // Recomendación basada en el sensor 1 (ajusta si quieres usar el 2 o ambos)
    const recomendacionTexto = sensorValue >= 1000
        ? 'El techo puede estar abierto'
        : 'Se recomienda que el techo esté cerrado';

    const recomendacionColor = sensorValue >= 1000 ? '#6A994E' : '#E5383B';

    return (
        <SafeAreaView style={styles.areaSegura}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contenidoScroll}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.card}>
                    <Text style={styles.titulo}>Jardin</Text>
                    <Text style={styles.subtitle}>Controle el techo del invernadero y el riego</Text>

                    <Text style={styles.infoBoxTitle}>Maneras de cerrar el techo:</Text>
                    <Text style={styles.infoBoxText}>
                        ▹ Si el sensor de humedad detecta un valor alto (lluvia) cerrará automáticamente el techo.{'\n'}
                        ▹ Puede hacerlo manualmente utilizando los botones.
                    </Text>

                    {/* LECTORES DE HUMEDAD */}
                    <View style={styles.ledSection}>
                        <Text style={styles.ledTitulo}>Nivel de humedad</Text>

                        <View style={styles.sensoresRow}>
                            <View style={styles.sensorBox}>
                                <Text style={styles.sensorLabel}>Sensor 1</Text>
                                <Text style={styles.sensorValor}>{sensorValue}</Text>
                            </View>
                            <View style={styles.sensorBox}>
                                <Text style={styles.sensorLabel}>Sensor 2</Text>
                                <Text style={styles.sensorValor}>{sensor2Value}</Text>
                            </View>
                        </View>

                        <Text style={[styles.unidad, { color: recomendacionColor, fontWeight: 'bold' }]}>
                            Recomendación:{'\n'}{recomendacionTexto}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* TECHO */}
                    <View style={styles.ledSection}>
                        <Text style={styles.ledTitulo}>Techo</Text>

                        <View style={styles.estadoLuz}>
                            <Text style={styles.textoEstado}>Estado:</Text>
                            <Text style={[styles.estado, techoAbierto ? styles.conectado : styles.desconectado]}>
                                {techoAbierto ? 'ABIERTO' : 'CERRADO'}
                            </Text>
                        </View>

                        <View style={styles.botones}>
                            <TouchableOpacity
                                style={[styles.boton, styles.botonEncender]}
                                onPress={abrirTecho}
                                disabled={!conectado}
                            >
                                <Text style={styles.textoBoton}>ABRIR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.boton, styles.botonApagar]}
                                onPress={cerrarTecho}
                                disabled={!conectado}
                            >
                                <Text style={styles.textoBoton}>CERRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* BOMBA DE RIEGO */}
                    <View style={styles.ledSection}>
                        <Text style={styles.ledTitulo}>Bomba de riego</Text>

                        <View style={styles.estadoLuz}>
                            <Text style={styles.textoEstado}>Estado:</Text>
                            <Text style={[styles.estado, bombaEncendida ? styles.conectado : styles.desconectado]}>
                                {bombaEncendida ? 'ENCENDIDA' : 'APAGADA'}
                            </Text>
                        </View>

                        <View style={styles.botones}>
                            <TouchableOpacity
                                style={[styles.boton, styles.botonEncender]}
                                onPress={encenderBomba}
                                disabled={!conectado}
                            >
                                <Text style={styles.textoBoton}>ENCENDER</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.boton, styles.botonApagar]}
                                onPress={apagarBomba}
                                disabled={!conectado}
                            >
                                <Text style={styles.textoBoton}>APAGAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    areaSegura: { 
        flex: 1, 
        backgroundColor: '#c7c6d4' 
    },
    scrollView: { 
        flex: 1 
    },
    contenidoScroll: { 
        flexGrow: 1, 
        padding: 20, 
        paddingBottom: 30 
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    titulo: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 15, 
        color: '#60463B' 
    },
    subtitle: { 
        fontSize: 18, 
        textAlign: 'center', 
        color: '#666', 
        marginBottom: 20 
    },
    estado: {
        textAlign: 'center',
        fontSize: 15,
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        marginTop: 10,
        fontWeight: '500',
        marginLeft: 15,
        width: '70%'
    },
    conectado: { 
        backgroundColor: '#e8f5e9', 
        color: '#6A994E' 
    },
    desconectado: { 
        backgroundColor: '#ffebee', 
        color: '#E5383B' 
    },
    ledSection: { 
        marginVertical: 10 
    },
    ledTitulo: { 
        fontSize: 20, 
        fontWeight: '600', 
        marginBottom: 7, 
        textAlign: 'center', 
        color: '#60463B' },
    botones: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        marginTop: 5 },
    boton: { 
        paddingVertical: 12, 
        paddingHorizontal: 25, 
        borderRadius: 10, 
        minWidth: 120, 
        alignItems: 'center' },
    botonEncender: { 
        backgroundColor: '#A7C957' },
    botonApagar: { 
        backgroundColor: '#e9494bee' },
    textoBoton: { 
        color: 'white', 
        fontSize: 14, 
        fontWeight: 'bold' },
    divider: { 
        height: 3, 
        backgroundColor: '#8B8C89', 
        marginVertical: 15 },
    imagen: { 
        paddingLeft: 3, 
        paddingBottom: 15 },
    estadoLuz: { 
        flexDirection: 'row', 
        marginBottom: 10 },
    textoEstado: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginTop: 16, 
        color: '#6C6F7D' },
    infoBoxTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginBottom: 10, 
        color: '#333' },
    infoBoxText: { 
        fontSize: 14, 
        color: '#666', 
        lineHeight: 24 },
    valorContainer: { 
        alignItems: 'center', 
        backgroundColor: '#f8f9fa', 
        borderRadius: 15, 
        padding: 30 },
    valor: { 
        fontSize: 80, 
        fontWeight: 'bold', 
        color: '#2196F3' },
    unidad: { 
        fontSize: 18, 
        color: '#999', 
        marginTop: 5, 
        textAlign: 'center' },
    // nuevos estilos para los dos sensores
    sensoresRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        marginBottom: 10 },
    sensorBox: {
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        paddingVertical: 20,
        paddingHorizontal: 30,
        alignItems: 'center',
        minWidth: 130,
    },
    sensorLabel: { 
        fontSize: 14, 
        color: '#666', 
        marginBottom: 5 },
    sensorValor: { 
        fontSize: 48, 
        fontWeight: 'bold', 
        color: '#2196F3' },
});

/*
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    }
});*/