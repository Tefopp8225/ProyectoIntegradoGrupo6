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
    const [bombaEncendida, setBombaEncendida] = useState(false);

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
                <View style={styles.apartadosTitulo}>
                    <Text style={styles.icono}>💧</Text>

                    <View style={styles.apartado2Titulo}>
                        <Text style={styles.titulo}>Riego</Text>
                        <Text style={styles.subtitle}>Controle el sistema de riego y la humedad de las plantas.</Text>
                    </View>
                </View>



                <View style={styles.card}>
                    <View style={styles.sensoresSection}>
                        <Text style={styles.SensoresTitulo}>Nivel de humedad</Text>

                        <View style={styles.sensoresRow}>
                            <View style={styles.sensorBox}>
                                <Text style={styles.iconoSensor}>🪴</Text>
                                <Text style={styles.sensorValor}>{sensorValue}</Text>
                                <Text style={styles.sensorLabel}>Fila 1</Text>
                            </View>
                            <View style={styles.sensorBox}>
                                <Text style={styles.iconoSensor}>🪴</Text>
                                <Text style={styles.sensorValor}>{sensor2Value}</Text>
                                <Text style={styles.sensorLabel}>Fila 2</Text>
                            </View>
                        </View>
                    </View>
                </View>



                <View style={styles.card}>
                    <View style={styles.sensoresSection}>
                        <Text style={styles.SensoresTitulo}>Sistema de Riego Automático</Text>

                        <Text style={styles.descripcionInfo}>El sistema será activado en este horario:</Text>

                        <View style={styles.apartadoProgramado}>
                            <Text style={styles.iconoProgramado}>📅</Text>
                        </View>

                        
                    </View>
                </View>



                <View style={styles.card}>
                    <View style={styles.sensoresSection}>
                        <Text style={styles.SensoresTitulo}>Sistema de Riego Manual</Text>

                        <Text style={styles.descripcionInfo}>Verifique el estado del sistema (encendido / apagado) y utilice los botones para controlarlo.</Text>

                        <Text style={[styles.estado, bombaEncendida ? styles.conectado : styles.desconectado]}>
                            {bombaEncendida ? 'ENCENDIDO' : 'APAGADO'}
                        </Text>
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
        backgroundColor: '#A3CEF1'
    },
    scrollView: {
        flex: 1
    },
    contenidoScroll: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 30
    },
    apartadosTitulo: {
        flexDirection: 'row',
        backgroundColor: '#274c77',
        borderRadius: 15,
        padding: 18,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
    },
    icono: {
        fontSize: 40,
        marginRight: 15,
    },
    apartado2Titulo: {
        flex: 1,
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#A3CEF1'
    },
    subtitle: {
        fontSize: 14,
        color: 'white',
        lineHeight: 20,
        paddingRight: 70
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
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E1D4C6',
    },
    sensorValor: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#274c77'
    },
    sensorBox: {
        backgroundColor: '#A3CEF1',
        borderRadius: 15,
        paddingVertical: 20,
        paddingHorizontal: 30,
        alignItems: 'center',
        minWidth: 130,
    },
    SensoresTitulo: {
        fontSize: 23,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#274c77',
    },
    iconoSensor: {
        fontSize: 35,
        marginBottom: 5,
    },
    sensorLabel: {
        fontSize: 20,
        color: '#274c77',
        marginTop: 8,
    },
    sensoresSection: {
        marginVertical: 10
    },
    estado: {
        textAlign: 'center',
        fontSize: 15,
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        marginTop: 10,
        fontWeight: '500',
        width: '100%'
    },
    botonEncender: {
        backgroundColor: '#A7C957'
    },
    botonApagar: {
        backgroundColor: '#e9494bee'
    },
    descripcionInfo: {
        fontSize: 14,
        color: '#274c77',
        lineHeight: 22,
        textAlign: 'justify',
        marginBottom: 15,
    },
    conectado: {
        backgroundColor: '#e8f5e9',
        color: '#6A994E'
    },
    desconectado: {
        backgroundColor: '#ffebee',
        color: '#E5383B'
    },
    botones: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 5
    },
    boton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        minWidth: 120,
        alignItems: 'center'
    },
    textoBoton: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold'
    },
    sensoresRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10
    },

    iconoProgramado: {
        fontSize: 35,
        marginRight: 15,
    },
});
