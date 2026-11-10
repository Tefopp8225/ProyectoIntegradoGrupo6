import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView, Image } from 'react-native';
import io from 'socket.io-client';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

//CAMBIAR IP
const SERVER_URL = 'http://192.168.0.32:3000';

export default function AmbienteScreen({ navigation }) {
    const [socket, setSocket] = useState(null);
    const [sensorTemValue, setSensorTemValue] = useState(0);
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
            setSensorTemValue(data.value);
            console.log(`Sensor 1: ${data.value}`);
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
                        <Text style={styles.subtitle}>Regule la temperatura usando el sistema de ventilación. Adicional, controle la iluminación.</Text>
                    </View>
                </View>
                <View style={styles.card}>
                    <View style={styles.sensoresSection}>
                        <Text style={styles.titulo}>Temperatura</Text>
                        <View style={styles.sensoresRow}>
                            <View style={styles.sensorBox}>
                                <FontAwesome5 style={styles.iconoSensor} name="temperature-low" size={50} color="#3c5a14" />
                                <Text style={styles.sensorValor}>{sensorTemValue}</Text>
                                <Text style={styles.sensorLabel}>Temperatura actual</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.titulo}>Sistema de Ventilación</Text>
                    <Text style={styles.descripcionInfo}>Encienda y apague el ventilador de manera manual usando los botones o abra el techo para regular la temperatura.</Text>
                    <View style={styles.apartadoProgramado}>
                        <Text style={styles.titulo}>Ventilador</Text>
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

                    <View style={styles.apartadoProgramado}>
                        <Text style={styles.titulo}>Techo</Text>
                        <Text style={[styles.estado, bombaEncendida ? styles.conectado : styles.desconectado]}>
                            {bombaEncendida ? 'ABIERTO' : 'CERRADO'}
                        </Text>
                        <View style={styles.botones}>
                            <TouchableOpacity
                                style={[styles.boton, styles.botonEncender]}
                                onPress={encenderBomba}
                                disabled={!conectado}
                            >
                                <Text style={styles.textoBoton}>ABRIR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.boton, styles.botonApagar]}
                                onPress={apagarBomba}
                                disabled={!conectado}
                            >
                                <Text style={styles.textoBoton}>CERRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>



                <View style={styles.card}>
                    <Text style={styles.titulo}>Iluminación</Text>
                    <Text style={styles.descripcionInfo}>Utilice los botones para encender y apagar las luces que se encuentran dentro y afuera del invernadero.</Text>
                    <View style={styles.apartadoLuces}>
                        <View style={styles.apartadoLuz}>
                            <Text style={styles.iconoProgramado}>💡</Text>
                            <Text style={[styles.estadoLuces, bombaEncendida ? styles.conectado : styles.desconectado]}>
                                {bombaEncendida ? 'ENCENDIDO' : 'APAGADO'}
                            </Text>
                        </View>
                        <View style={styles.textoProgramado}>
                            <Text style={styles.subtituloProgramado}>Luz del Invernadero</Text>
                            <View style={styles.apartadoBotonesLuces}>
                                <View style={styles.botones2}>
                                    <TouchableOpacity
                                        style={[styles.boton2, styles.botonEncender]}
                                        onPress={encenderBomba}
                                        disabled={!conectado}
                                    >
                                        <Text style={styles.textoBoton2}>ENCENDER</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.boton2, styles.botonApagar]}
                                        onPress={apagarBomba}
                                        disabled={!conectado}
                                    >
                                        <Text style={styles.textoBoton2}>APAGAR</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.apartadoLuces}>
                        <View style={styles.apartadoLuz}>
                            <Text style={styles.iconoProgramado}>💡</Text>
                            <Text style={[styles.estadoLuces, bombaEncendida ? styles.conectado : styles.desconectado]}>
                                {bombaEncendida ? 'ENCENDIDO' : 'APAGADO'}
                            </Text>
                        </View>
                        <View style={styles.textoProgramado}>
                            <Text style={styles.subtituloProgramado}>Luz 1 Jardín</Text>
                            <View style={styles.apartadoBotonesLuces}>
                                <View style={styles.botones2}>
                                    <TouchableOpacity
                                        style={[styles.boton2, styles.botonEncender]}
                                        onPress={encenderBomba}
                                        disabled={!conectado}
                                    >
                                        <Text style={styles.textoBoton2}>ENCENDER</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.boton2, styles.botonApagar]}
                                        onPress={apagarBomba}
                                        disabled={!conectado}
                                    >
                                        <Text style={styles.textoBoton2}>APAGAR</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.apartadoLuces}>
                        <View style={styles.apartadoLuz}>
                            <Text style={styles.iconoProgramado}>💡</Text>
                            <Text style={[styles.estadoLuces, bombaEncendida ? styles.conectado : styles.desconectado]}>
                                {bombaEncendida ? 'ENCENDIDO' : 'APAGADO'}
                            </Text>
                        </View>
                        <View style={styles.textoProgramado}>
                            <Text style={styles.subtituloProgramado}>Luz 2 Jardín</Text>
                            <View style={styles.apartadoBotonesLuces}>
                                <View style={styles.botones2}>
                                    <TouchableOpacity
                                        style={[styles.boton2, styles.botonEncender]}
                                        onPress={encenderBomba}
                                        disabled={!conectado}
                                    >
                                        <Text style={styles.textoBoton2}>ENCENDER</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.boton2, styles.botonApagar]}
                                        onPress={apagarBomba}
                                        disabled={!conectado}
                                    >
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
    areaSegura: {
        flex: 1,
        backgroundColor: '#AAD576'
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
        backgroundColor: '#3c5a14',
        borderRadius: 15,
        padding: 18,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#c8e1c6',
    },
    icono: {
        marginRight: 15,
    },
    apartado2Titulo: {
        flex: 1,
    },
    tituloAmbiente: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#AAD576'
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
        fontSize: 60,
        fontWeight: 'bold',
        color: '#3c5a14'
    },
    sensorBox: {
        backgroundColor: '#AAD576',
        borderRadius: 15,
        paddingVertical: 20,
        paddingHorizontal: 30,
        alignItems: 'center',
        minWidth: 300,
    },
    titulo: {
        fontSize: 23,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#3c5a14',
    },
    iconoSensor: {
        fontSize: 45,
        marginLeft: 10,
    },
    sensorLabel: {
        fontSize: 14,
        color: '#3c5a14',
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
    estadoLuces: {
        textAlign: 'center',
        fontSize: 15,
        padding: 2,
        borderRadius: 10,
        marginBottom: 1,
        marginTop: 1,
        fontWeight: '500',
        width: '100%'
    },
    apartadoLuz:{
        flexDirection:'column',
        marginRight:10
    },
    botonEncender: {
        backgroundColor: '#38b000'
    },
    botonApagar: {
        backgroundColor: '#e9494bee'
    },
    descripcionInfo: {
        fontSize: 14,
        color: '#274c77',
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
        alignItems: 'center',
        margin: 5
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
        alignItems: 'center',
        backgroundColor: '#AAD576',
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        marginBottom: 10,
    },
    iconoProgramado: {
        fontSize: 35,
        marginLeft:15,
        marginBottom:10
    },
    textoProgramado: {
        flex: 1,
    },
    subtituloProgramado: {
        fontSize: 20,
        color: '#274c77',
    },
    valorTiempoProgramado: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#274c77',
        marginTop: 4,
    },
    apartadoLuces: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#AAD576',
        padding: 10,
        paddingTop:15,
        paddingBottom:15,
        borderRadius: 12,
        marginTop: 5,
        marginBottom:10
    },
    botones2: {
        flexDirection: 'row',
        marginTop: 5,
        width:'50%'
    },
    boton2: {
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 10,
        minWidth: 80,
        alignItems: 'center',
        margin: 2
    },
    
    textoBoton2: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold'
    },
});
