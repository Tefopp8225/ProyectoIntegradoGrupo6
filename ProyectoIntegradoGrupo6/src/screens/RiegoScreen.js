import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import io from 'socket.io-client';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const SERVER_URL = 'http://192.168.1.29:3000';

export default function RiegoScreen({ navigation }) {
    const [socket, setSocket] = useState(null);
    const [sensorHumedadValue, setSensorHumedadValue] = useState(0);
    const [sensor2HumedadValue, setSensor2HumedadValue] = useState(0);
    const [conectado, setConectado] = useState(false);
    const [bombaEncendida, setBombaEncendida] = useState(false);
    const [riegoProgramado, setRiegoProgramado] = useState(null);

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

    // Fórmula invertida: A menor valor crudo (más mojado), mayor porcentaje.
    const calcularPorcentajeInvertido = (valorCrudo) => {
        // Ajusta estos valores si es necesario según lo que marque tu sensor en seco (ej. 1023) y en agua pura (ej. 200 o 300)
        const valorAireSeco = 1023;
        const valorAguaTotal = 200; // Puedes cambiar este límite inferior si tu sensor no baja tanto

        let porcentaje = ((valorAireSeco - valorCrudo) / (valorAireSeco - valorAguaTotal)) * 100;
        
        if (porcentaje > 100) porcentaje = 100;
        if (porcentaje < 0) porcentaje = 0;
        return Math.round(porcentaje);
    };

    const porc1 = calcularPorcentajeInvertido(sensorHumedadValue);
    const porc2 = calcularPorcentajeInvertido(sensor2HumedadValue);

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
                            {/* Sensor Fila 1 */}
                            <View style={styles.sensorBox}>
                                <MaterialCommunityIcons style={styles.iconoSensor} name="seed" size={50} color="#274c77" />
                                <View style={styles.valorContainer}>
                                    <Text style={[styles.sensorValor, porc1 <= 15 ? styles.textoRojo : styles.textoVerde]}>
                                        {porc1}%
                                    </Text>
                                </View>
                                <Text style={styles.sensorLabel}>Fila 1</Text>
                            </View>

                            {/* Sensor Fila 2 */}
                            <View style={styles.sensorBox}>
                                <MaterialCommunityIcons style={styles.iconoSensor} name="seed" size={50} color="#274c77" />
                                <View style={styles.valorContainer}>
                                    <Text style={[styles.sensorValor, porc2 <= 15 ? styles.textoRojo : styles.textoVerde]}>
                                        {porc2}%
                                    </Text>
                                </View>
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
        marginTop: 15,
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
    sensorBox: {
        backgroundColor: '#F3E9DC',
        borderRadius: 15,
        paddingVertical: 15,
        paddingHorizontal: 10,
        alignItems: 'center',
        width: '45%',
    },
    valorContainer: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sensorValor: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    textoRojo: {
        color: '#d90429', // Rojo si está seco (0 - 15%)
    },
    textoVerde: {
        color: '#2b9348', // Verde si es mayor a 15%
    },
    SensoresTitulo: {
        fontSize: 23,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#274c77',
    },
    iconoSensor: {
        marginBottom: 2,
    },
    sensorLabel: {
        fontSize: 22,
        color: '#274c77',
        marginTop: 4,
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
        width: '70%',
        marginLeft: '15%'
    },
    botonEncender: {
        backgroundColor: '#2e7d32'
    },
    botonApagar: {
        backgroundColor: '#58391b'
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
        backgroundColor: '#F3E9DC',
        color: '#58391b'
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
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 5,
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