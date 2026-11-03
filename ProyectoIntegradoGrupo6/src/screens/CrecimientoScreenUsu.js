
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import io from 'socket.io-client';

const SERVER_URL = 'http://192.168.1.29:3000';

export default function CrecimientoScreenUsu({ navigation }) {

    const [conectado, setConectado] = useState(false);
    const [sensorValue, setSensorValue] = useState(0);

    useEffect(() => {
        const nuevaConexion = io(SERVER_URL);

        nuevaConexion.on('connect', () => {
            setConectado(true);
            console.log('Conectado al servidor');
        });

        nuevaConexion.on('disconnect', () => {
            setConectado(false);
            console.log('Desconectado del servidor');
        });

        nuevaConexion.on('sensor_data', (data) => {
            const altura = parseFloat(data.value);

            if (Number.isFinite(altura)) {
                setSensorValue(altura);
                console.log(`Altura de la planta: ${altura} cm`);
            }
        });

        return () => {
            nuevaConexion.disconnect();
        };
    }, []);

    return (
        <SafeAreaView style={styles.areaSegura}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contenidoScroll}
            >

                <View style={styles.presentacion}>
                    <Text style={styles.icono}>🌱</Text>

                    <View style={styles.textoPresentacion}>
                        <Text style={styles.tituloPresentacion}>
                            Crecimiento
                        </Text>

                        <Text style={styles.descripcion}>
                            Monitorea la altura y el desarrollo de tus plantas
                            en el invernadero.
                        </Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.titulo}>
                        Medición de altura
                    </Text>

                    <Text style={[
                        styles.estado,
                        conectado ? styles.conectado : styles.desconectado
                    ]}>
                        {conectado ? '🟢 Conectado' : '🔴 Desconectado'}
                    </Text>

                    <View style={styles.sensorContainer}>

                        <Text style={styles.iconoSensor}>🌿</Text>

                        <Text style={styles.valorSensor}>
                            {sensorValue.toFixed(1)}
                        </Text>

                        <Text style={styles.unidad}>
                            cm
                        </Text>

                        <Text style={styles.unidadSensor}>
                            Altura actual de la planta
                        </Text>

                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.titulo}>
                        Seguimiento del crecimiento
                    </Text>

                    <View style={styles.informacion}>
                        <Text style={styles.iconoInfo}>📏</Text>

                        <View style={styles.textoInfo}>
                            <Text style={styles.subtitulo}>
                                Altura registrada
                            </Text>

                            <Text style={styles.valorInfo}>
                                {sensorValue.toFixed(1)} cm
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.descripcionInfo}>
                        Esta sección permite visualizar la altura actual
                        de la planta y monitorear su desarrollo mediante
                        las mediciones del sensor ultrasónico.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.titulo}>
                        ¿Cómo funciona?
                    </Text>

                    <Text style={styles.descripcionInfo}>
                        El sensor ultrasónico se encarga de medir la
                        distancia entre su posición y la parte superior
                        de la planta. A partir de esta distancia se
                        calcula la altura de la planta, permitiendo
                        monitorear su crecimiento dentro del invernadero.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    areaSegura: {
        flex: 1,
        backgroundColor: '#F3E9DC',
    },

    scrollView: {
        flex: 1,
    },

    contenidoScroll: {
        padding: 20,
        paddingBottom: 30,
    },

    presentacion: {
        backgroundColor: '#5C4033',
        borderRadius: 15,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#CBB196',
    },

    icono: {
        fontSize: 40,
        marginRight: 15,
    },

    textoPresentacion: {
        flex: 1,
    },

    tituloPresentacion: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#E8D5C0',
        marginBottom: 5,
    },

    descripcion: {
        fontSize: 14,
        color: 'white',
        lineHeight: 20,
    },

    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#4A3328',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E1D4C6',
    },

    titulo: {
        fontSize: 23,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#4A3328',
    },

    estado: {
        textAlign: 'center',
        fontSize: 14,
        padding: 10,
        borderRadius: 10,
        marginBottom: 20,
        fontWeight: '500',
    },

    conectado: {
        backgroundColor: '#E3E8DE',
        color: '#53634A',
    },

    desconectado: {
        backgroundColor: '#EBDDD5',
        color: '#8A5140',
    },

    sensorContainer: {
        alignItems: 'center',
        backgroundColor: '#F3E9DC',
        borderRadius: 15,
        padding: 20,
    },

    iconoSensor: {
        fontSize: 45,
        marginBottom: 5,
    },

    valorSensor: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#8B6F47',
    },

    unidad: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8B6F47',
    },

    unidadSensor: {
        fontSize: 14,
        color: '#6B5142',
        marginTop: 8,
    },

    informacion: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E9DC',
        padding: 15,
        borderRadius: 12,
        marginTop: 5,
    },

    iconoInfo: {
        fontSize: 35,
        marginRight: 15,
    },

    textoInfo: {
        flex: 1,
    },

    subtitulo: {
        fontSize: 14,
        color: '#6B5142',
    },

    valorInfo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#8B6F47',
        marginTop: 4,
    },

    descripcionInfo: {
        fontSize: 14,
        color: '#6B5142',
        lineHeight: 22,
        textAlign: 'justify',
        marginTop: 15,
    },

});
