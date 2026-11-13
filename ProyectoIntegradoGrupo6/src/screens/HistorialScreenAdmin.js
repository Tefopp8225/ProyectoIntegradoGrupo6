
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import io from 'socket.io-client';

const SERVER_URL = 'http://192.168.1.26:3000';

export default function HistorialScreenAdmin({ navigation }) {

    const [conectado, setConectado] = useState(false);
    const [historial, setHistorial] = useState([]);
    const [filtro, setFiltro] = useState('Todos');

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

        // RECIBIR HISTORIAL COMPLETO

        nuevaConexion.on('historial_data', (data) => {
            setHistorial(data);
        });

        // RECIBIR NUEVOS REGISTROS

        nuevaConexion.on('historial_update', (data) => {

            setHistorial((historialAnterior) => {

                // Evitar registros duplicados
                if (historialAnterior.some((registro) => registro.id === data.id)) {
                    return historialAnterior;
                }

                return [
                    data,
                    ...historialAnterior
                ];

            });

        });

        return () => {
            nuevaConexion.disconnect();
        };

    }, []);

    // FILTRAR REGISTROS

    const historialFiltrado = historial.filter((registro) => {

        if (filtro === 'Todos') {
            return true;
        }

        return registro.tipo === filtro;

    });

    // OBTENER EL ULTIMO REGISTRO DE CADA ELEMENTO

    const obtenerUltimo = (nombre) => {

        return historial.find((registro) => registro.nombre === nombre);

    };

    const humedad = obtenerUltimo('Sensor de humedad');

    const ladoA = obtenerUltimo('Sensor ultrasónico - Lado A');

    const ladoB = obtenerUltimo('Sensor ultrasónico - Lado B');

    const led1 = obtenerUltimo('LED 1');

    const led2 = obtenerUltimo('LED 2');

    const mostrarValor = (registro) => {

        if (!registro) {
            return 'Sin registros';
        }

        return registro.valor;

    };

    const mostrarFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-GT');
    };

    return (

        <SafeAreaView style={styles.areaSegura}>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contenidoScroll}
            >

                {/* PRESENTACION */}

                <View style={styles.presentacion}>

                    <Text style={styles.icono}>📋</Text>

                    <View style={styles.textoPresentacion}>

                        <Text style={styles.tituloPresentacion}>
                            Historial
                        </Text>

                        <Text style={styles.descripcion}>
                            Consulta los registros de sensores y actuadores
                            del invernadero.
                        </Text>

                    </View>

                </View>

                {/* ESTADO DEL SISTEMA */}

                <View style={styles.card}>

                    <Text style={styles.titulo}>
                        Estado del sistema
                    </Text>

                    <Text style={[
                        styles.estado,
                        conectado ? styles.conectado : styles.desconectado
                    ]}>
                        {conectado ? '🟢 Conectado' : '🔴 Desconectado'}
                    </Text>

                    <View style={styles.resumen}>

                        <View style={styles.resumenItem}>

                            <Text style={styles.iconoResumen}>📊</Text>

                            <Text style={styles.valorResumen}>
                                {historial.length}
                            </Text>

                            <Text style={styles.textoResumen}>
                                Registros
                            </Text>

                        </View>

                        <View style={styles.resumenItem}>

                            <Text style={styles.iconoResumen}>📡</Text>

                            <Text style={styles.valorResumen}>
                                {historial.filter((registro) => registro.tipo === 'Sensor').length}
                            </Text>

                            <Text style={styles.textoResumen}>
                                Sensores
                            </Text>

                        </View>

                        <View style={styles.resumenItem}>

                            <Text style={styles.iconoResumen}>⚙️</Text>

                            <Text style={styles.valorResumen}>
                                {historial.filter((registro) => registro.tipo === 'Actuador').length}
                            </Text>

                            <Text style={styles.textoResumen}>
                                Actuadores
                            </Text>

                        </View>

                    </View>

                </View>

                {/* ESTADO DE SENSORES */}

                <View style={styles.card}>

                    <Text style={styles.titulo}>
                        Sensores del invernadero
                    </Text>

                    <View style={styles.elemento}>

                        <View style={styles.elementoEncabezado}>
                            <Text style={styles.iconoElemento}>💧</Text>

                            <Text style={styles.nombreElemento}>
                                Sensor de humedad
                            </Text>
                        </View>

                        <Text style={styles.valorElemento}>
                            {mostrarValor(humedad)}
                        </Text>

                        <Text style={styles.fechaElemento}>
                            {humedad ? mostrarFecha(humedad.fecha) : 'Esperando información'}
                        </Text>

                    </View>

                    <View style={styles.elemento}>

                        <View style={styles.elementoEncabezado}>
                            <Text style={styles.iconoElemento}>📏</Text>

                            <Text style={styles.nombreElemento}>
                                Sensor ultrasónico - Lado A
                            </Text>
                        </View>

                        <Text style={styles.valorElemento}>
                            {mostrarValor(ladoA)}
                        </Text>

                        <Text style={styles.fechaElemento}>
                            {ladoA ? mostrarFecha(ladoA.fecha) : 'Sin detecciones'}
                        </Text>

                    </View>

                    <View style={styles.elemento}>

                        <View style={styles.elementoEncabezado}>
                            <Text style={styles.iconoElemento}>📏</Text>

                            <Text style={styles.nombreElemento}>
                                Sensor ultrasónico - Lado B
                            </Text>
                        </View>

                        <Text style={styles.valorElemento}>
                            {mostrarValor(ladoB)}
                        </Text>

                        <Text style={styles.fechaElemento}>
                            {ladoB ? mostrarFecha(ladoB.fecha) : 'Sin detecciones'}
                        </Text>

                    </View>

                </View>

                {/* ESTADO DE ACTUADORES */}

                <View style={styles.card}>

                    <Text style={styles.titulo}>
                        Actuadores del invernadero
                    </Text>

                    <View style={styles.elemento}>

                        <View style={styles.elementoEncabezado}>
                            <Text style={styles.iconoElemento}>💡</Text>

                            <Text style={styles.nombreElemento}>
                                LED 1
                            </Text>
                        </View>

                        <Text style={styles.valorElemento}>
                            {mostrarValor(led1)}
                        </Text>

                        <Text style={styles.fechaElemento}>
                            {led1 ? mostrarFecha(led1.fecha) : 'Sin registros'}
                        </Text>

                    </View>

                    <View style={styles.elemento}>

                        <View style={styles.elementoEncabezado}>
                            <Text style={styles.iconoElemento}>💡</Text>

                            <Text style={styles.nombreElemento}>
                                LED 2
                            </Text>
                        </View>

                        <Text style={styles.valorElemento}>
                            {mostrarValor(led2)}
                        </Text>

                        <Text style={styles.fechaElemento}>
                            {led2 ? mostrarFecha(led2.fecha) : 'Sin registros'}
                        </Text>

                    </View>

                </View>

                {/* HISTORIAL COMPLETO */}

                <View style={styles.card}>

                    <Text style={styles.titulo}>
                        Registros del invernadero
                    </Text>

                    <View style={styles.filtros}>

                        <Text
                            style={[
                                styles.filtro,
                                filtro === 'Todos' && styles.filtroActivo
                            ]}
                            onPress={() => setFiltro('Todos')}
                        >
                            Todos
                        </Text>

                        <Text
                            style={[
                                styles.filtro,
                                filtro === 'Sensor' && styles.filtroActivo
                            ]}
                            onPress={() => setFiltro('Sensor')}
                        >
                            Sensores
                        </Text>

                        <Text
                            style={[
                                styles.filtro,
                                filtro === 'Actuador' && styles.filtroActivo
                            ]}
                            onPress={() => setFiltro('Actuador')}
                        >
                            Actuadores
                        </Text>

                    </View>

                    {historialFiltrado.length === 0 ? (

                        <View style={styles.sinRegistros}>

                            <Text style={styles.iconoVacio}>📂</Text>

                            <Text style={styles.textoVacio}>
                                No hay registros disponibles
                            </Text>

                            <Text style={styles.descripcionVacio}>
                                Los registros aparecerán aquí cuando
                                el sistema reciba información.
                            </Text>

                        </View>

                    ) : (

                        historialFiltrado.map((registro, index) => (

                            <View
                                style={styles.registro}
                                key={registro.id || index}
                            >

                                <View style={styles.registroEncabezado}>

                                    <Text style={styles.iconoRegistro}>
                                        {registro.tipo === 'Sensor' ? '📡' : '⚙️'}
                                    </Text>

                                    <View style={styles.textoRegistro}>

                                        <Text style={styles.nombreRegistro}>
                                            {registro.nombre}
                                        </Text>

                                        <Text style={styles.tipoRegistro}>
                                            {registro.tipo}
                                        </Text>

                                    </View>

                                </View>

                                <View style={styles.valorRegistroContainer}>

                                    <Text style={styles.etiquetaRegistro}>
                                        Valor registrado
                                    </Text>

                                    <Text style={styles.valorRegistro}>
                                        {registro.valor}
                                    </Text>

                                </View>

                                <Text style={styles.fechaRegistro}>
                                    📅 {mostrarFecha(registro.fecha)}
                                </Text>

                            </View>

                        ))

                    )}

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

    resumen: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#F3E9DC',
        borderRadius: 12,
        padding: 15,
    },

    resumenItem: {
        alignItems: 'center',
        flex: 1,
    },

    iconoResumen: {
        fontSize: 25,
        marginBottom: 5,
    },

    valorResumen: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#8B6F47',
    },

    textoResumen: {
        fontSize: 12,
        color: '#6B5142',
        marginTop: 4,
    },

    elemento: {
        backgroundColor: '#F3E9DC',
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#E1D4C6',
    },

    elementoEncabezado: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconoElemento: {
        fontSize: 23,
        marginRight: 10,
    },

    nombreElemento: {
        flex: 1,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4A3328',
    },

    valorElemento: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#8B6F47',
        marginTop: 10,
    },

    fechaElemento: {
        fontSize: 10,
        color: '#6B5142',
        marginTop: 5,
    },

    filtros: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },

    filtro: {
        fontSize: 13,
        color: '#6B5142',
        backgroundColor: '#F3E9DC',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        overflow: 'hidden',
    },

    filtroActivo: {
        backgroundColor: '#5C4033',
        color: 'white',
        fontWeight: 'bold',
    },

    registro: {
        backgroundColor: '#F3E9DC',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E1D4C6',
    },

    registroEncabezado: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconoRegistro: {
        fontSize: 15,
        marginRight: 12,
    },

    textoRegistro: {
        flex: 1,
    },

    nombreRegistro: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4A3328',
        marginTop: 5,
    },

    tipoRegistro: {
        fontSize: 11,
        color: '#8B6F47',
        marginTop: 5,
    },

    valorRegistroContainer: {
        marginTop: 10,
        backgroundColor: 'white',
        padding: 4,
        borderRadius: 10,
    },

    etiquetaRegistro: {
        fontSize: 10,
        color: '#6B5142',
    },

    valorRegistro: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#8B6F47',
        marginTop: 4,
    },

    fechaRegistro: {
        fontSize: 10,
        color: '#6B5142',
        marginTop: 6,
        marginBottom: 6,
    },

    sinRegistros: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F3E9DC',
        borderRadius: 12,
    },

    iconoVacio: {
        fontSize: 40,
        marginBottom: 10,
    },

    textoVacio: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4A3328',
        textAlign: 'center',
    },

    descripcionVacio: {
        fontSize: 13,
        color: '#6B5142',
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 8,
    },

});
