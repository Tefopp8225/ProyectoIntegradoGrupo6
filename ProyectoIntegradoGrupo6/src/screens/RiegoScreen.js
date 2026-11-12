import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView, Image } from 'react-native';
import io from 'socket.io-client';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons2 from '@expo/vector-icons/MaterialCommunityIcons';

const SERVER_URL = 'http://192.168.0.32:3000';

export default function RiegoScreen({ navigation }) {
    const [socket, setSocket] = useState(null);
    const [sensorHumedadValue, setSensorHumedadValue] = useState(0);
    const [sensor2HumedadValue, setSensor2HumedadValue] = useState(0);
    const [conectado, setConectado] = useState(false);
    const [bombaEncendida, setBombaEncendida] = useState(false);
    const [riegoProgramado, setRiegoProgramado] = useState(null); // { minutos, hora (???) PENDIENTE}

    useEffect(() => {
        const nuevaConexion = io(SERVER_URL);
        setSocket(nuevaConexion);

        nuevaConexion.on('connect', () => setConectado(true));
        nuevaConexion.on('disconnect', () => setConectado(false));

        nuevaConexion.on('sensor1_humedad_data', (data) => setSensorHumedadValue(data.value));
        nuevaConexion.on('sensor2_humedad_data', (data) => setSensor2HumedadValue(data.value));

        nuevaConexion.on('bomba_state', (data) => {
            if (data && data.encendida !== undefined) setBombaEncendida(data.encendida);
        });

        // Aviso de riego programado por el admin
        nuevaConexion.on('riego_programado_data', (data) => {
            if (data && data.minutos !== undefined) setRiegoProgramado(data);
        });

        return () => nuevaConexion.disconnect();
    }, []);

    const encenderBomba = () => {
        if (!socket || !conectado) {
            Alert.alert('Error', 'No estas conectado al servidor');
            return;
        }
        socket.emit('command_bomba', { action: 'ON' });
    };

    const apagarBomba = () => {
        if (!socket || !conectado) {
            Alert.alert('Error', 'No estas conectado al servidor');
            return;
        }
        socket.emit('command_bomba', { action: 'OFF' });
    };

    const textoProgramado = riegoProgramado
        ? `${riegoProgramado.minutos} minutos${riegoProgramado.hora ? ` a las ${riegoProgramado.hora}` : ''}`
        : 'No programado';



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
                                <MaterialCommunityIcons style={styles.iconoSensor} name="seed" size={60} color="#274c77" />
                                <Text style={styles.sensorValor}>{sensorHumedadValue}</Text>
                                <Text style={styles.sensorLabel}>Fila 1</Text>
                            </View>
                            <View style={styles.sensorBox}>
                                <MaterialCommunityIcons style={styles.iconoSensor} name="seed" size={60} color="#274c77" />
                                <Text style={styles.sensorValor}>{sensor2HumedadValue}</Text>
                                <Text style={styles.sensorLabel}>Fila 2</Text>
                            </View>
                        </View>
                    </View>
                </View>



                <View style={styles.card}>
                    <Text style={styles.SensoresTitulo}>Sistema de Riego Automático</Text>
                        <Text style={styles.descripcionInfo}>El sistema será activado en este horario:</Text>
                        <View style={styles.apartadoProgramado}>
                            <Text style={styles.iconoProgramado}>🕒</Text>
                            <View style={styles.textoProgramado}>
                                <Text style={styles.subtituloProgramado}>Tiempo</Text>
                                <Text style={styles.valorTiempoProgramado}>{textoProgramado}</Text>
                            </View>
                        </View>
                        <Text style={styles.descripcionInfo}>En caso de que el administrador no haya establecido un horario, usted puede activar el sistema de manera manual en el apartado de abajo.</Text>
                </View>



                <View style={styles.card}>
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
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    areaSegura: {
        flex: 1,
        backgroundColor: '#F3E9DC'
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
        borderColor: '#c6cbe1',
        marginTop:15,
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
        borderColor: '#c6cbe1',
    },
    sensorValor: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#274c77'
    },
    sensorBox: {
        backgroundColor: '#F3E9DC',
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
        marginBottom: 5,
        marginLeft:10,
    },
    sensorLabel: {
        fontSize: 30,
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
        backgroundColor: '#2e7d32'
    },
    botonApagar: {
        backgroundColor: '#c62828'
    },
    descripcionInfo: {
        fontSize: 14,
        color: '#6B5142',
        lineHeight: 22,
        textAlign: 'justify',
        marginTop: 10,
        marginBottom: 5,
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
    apartadoProgramado: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E9DC',
        padding: 15,
        borderRadius: 12,
        marginTop: 5,
    },
    iconoProgramado: {
        fontSize: 35,
        marginRight: 15,
    },
    textoProgramado: {
        flex: 1,
    },
    subtituloProgramado: {
        fontSize: 14,
        color: '#274c77',
    },
    valorTiempoProgramado: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#274c77',
        marginTop: 4,
    },
});
