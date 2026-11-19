
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import io from 'socket.io-client';

const SERVER_URL = 'http://192.168.1.29:3000';

export default function HistorialScreenAdmin({ navigation }) {


    const [historial, setHistorial] = useState([]);
    const [filtro, setFiltro] = useState('Todos');
    const zonaAnterior = useRef('NINGUNA');

    useEffect(() => {

        const nuevaConexion = io(SERVER_URL);

    
        // RECIBIR HISTORIAL COMPLETO

        nuevaConexion.on('historial_data', (data) => {

            const registros = Array.isArray(data) ? data : [];

            setHistorial(
                registros.filter((registro) =>
                    !String(registro.nombre || '').toLowerCase().includes('ultras')
                )
            );

        });

        // RECIBIR NUEVOS REGISTROS
        nuevaConexion.on('historial_update', (data) => {

            if (String(data.nombre || '').toLowerCase().includes('ultras')) {
                return;
            }

            setHistorial((historialAnterior) => {

                if (historialAnterior.some((registro) =>
                    registro.id === data.id
                )) {
                    return historialAnterior;
                }

                return [data, ...historialAnterior].slice(0, 100);

            });

        });

        // NOTIFICACIONES DE PLANTAS A Y B
        nuevaConexion.on('plant_distance', (data) => {

            const distancia = parseFloat(data.value);

            if (!Number.isFinite(distancia)) return;

            let zonaActual = 'NINGUNA';

            if (distancia >= 7 && distancia <= 13) {
                zonaActual = 'A';
            } else if (distancia >= 27 && distancia <= 33) {
                zonaActual = 'B';
            }


            if (zonaActual !== zonaAnterior.current) {

                zonaAnterior.current = zonaActual;

                setHistorial((historialAnterior) => {

                    const sinNotificacionAnterior = historialAnterior.filter(
                        (registro) =>
                            registro.id !== 'notificacion-planta-A' &&
                            registro.id !== 'notificacion-planta-B'
                    );

                    if (zonaActual === 'NINGUNA') {
                        return sinNotificacionAnterior;
                    }

                    const lado = zonaActual;

                    const nuevaNotificacion = {
                        id: `notificacion-planta-${lado}`,
                        nombre: `Planta del lado ${lado}`,
                        tipo: 'Sensor',
                        valor: `¡La planta del lado ${lado} alcanzó la zona de corte y está lista para cortar!`,
                        fecha: new Date().toISOString()
                    };

                    return [
                        nuevaNotificacion,
                        ...sinNotificacionAnterior
                    ].slice(0, 100);

                });

            }

        });

        return () => {
            nuevaConexion.disconnect();
        };

    }, []);

    // ELIMINAR REGISTRO
    const eliminarRegistro = (id) => {

        setHistorial((historialAnterior) =>
            historialAnterior.filter((registro) => registro.id !== id)
        );

    };

    // FILTRAR REGISTROS
    const historialFiltrado = historial.filter((registro) => {

        if (filtro === 'Todos') {
            return true;
        }

        return registro.tipo === filtro;

    });



    // MOSTRAR FECHA
    const mostrarFecha = (fecha) => {

        if (!fecha) {
            return 'Fecha no disponible';
        }

        return new Date(fecha).toLocaleString('es-GT');

    };

    // IDENTIFICAR ICONO
    
    const obtenerIcono = (registro) => {

        if (registro.tipo === 'Sensor') {

            if (registro.nombre.toLowerCase().includes('ultrasónico')) {
                return '📏';
            }

            if (registro.nombre.toLowerCase().includes('humedad')) {
                return '💧';
            }

            if (registro.nombre.toLowerCase().includes('temperatura')) {
                return '🌡️';
            }

            return '📡';

        }

        if (registro.nombre.includes('Bomba')) {
            return '💧';
        }

        if (registro.nombre.includes('Ventilador')) {
            return '🌀';
        }

        if (registro.nombre.includes('Ventana')) {
            return '🏠';
        }

        if (registro.nombre.includes('LED')) {
            return '💡';
        }

        return '⚙️';



    };

    return (

        <SafeAreaView style={styles.areaSegura}>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contenidoScroll}
            >

                {/* REGISTROS DEL INVERNADERO */}

                <View style={styles.card}>

                    <View style={styles.encabezado}>

                        <Text style={styles.iconoTitulo}>
                            📋
                        </Text>

                        <View style={styles.encabezadoTexto}>

                            <Text style={styles.titulo}>
                                Registros del invernadero
                            </Text>

                            <Text style={styles.descripcion}>
                                Consulta los registros y notificaciones del sistema.
                            </Text>

                        </View>

                    </View>



                    {/* FILTROS */}

                    <View style={styles.filtros}>

                        <TouchableOpacity
                            style={[
                                styles.filtro,
                                filtro === 'Todos' && styles.filtroActivo
                            ]}
                            onPress={() => setFiltro('Todos')}
                        >

                            <Text style={[
                                styles.textoFiltro,
                                filtro === 'Todos' && styles.textoFiltroActivo
                            ]}>
                                Todos
                            </Text>

                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filtro,
                                filtro === 'Sensor' && styles.filtroActivo
                            ]}
                            onPress={() => setFiltro('Sensor')}
                        >

                            <Text style={[
                                styles.textoFiltro,
                                filtro === 'Sensor' && styles.textoFiltroActivo
                            ]}>
                                Sensores
                            </Text>

                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filtro,
                                filtro === 'Actuador' && styles.filtroActivo
                            ]}
                            onPress={() => setFiltro('Actuador')}
                        >

                            <Text style={[
                                styles.textoFiltro,
                                filtro === 'Actuador' && styles.textoFiltroActivo
                            ]}>
                                Actuadores
                            </Text>

                        </TouchableOpacity>

                    </View>



                    {/* LISTA DE REGISTROS */}

                    {historialFiltrado.length === 0 ? (

                        <View style={styles.sinRegistros}>

                            <Text style={styles.iconoVacio}>
                                📂
                            </Text>

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
                                        {obtenerIcono(registro)}
                                    </Text>

                                    <View style={styles.textoRegistro}>

                                        <Text style={styles.nombreRegistro}>
                                            {registro.nombre}
                                        </Text>

                                        <Text style={styles.tipoRegistro}>
                                            {registro.tipo}
                                        </Text>

                                    </View>

                                    <TouchableOpacity
                                        style={styles.botonEliminar}
                                        onPress={() => eliminarRegistro(registro.id)}
                                    >

                                        <Text style={styles.textoEliminar}>
                                            ×
                                        </Text>

                                    </TouchableOpacity>

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



    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#4A3328',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,

        borderWidth: 1,
        borderColor: '#E1D4C6',
    },

    encabezado: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },

    iconoTitulo: {
        fontSize: 35,
        marginRight: 12,
    },

    encabezadoTexto: {
        flex: 1,
    },

    titulo: {
        fontSize: 21,
        fontWeight: 'bold',
        color: '#4A3328',
    },

    descripcion: {
        fontSize: 12,
        color: '#6B5142',
        marginTop: 5,
        lineHeight: 18,
    },

    filtros: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },

    filtro: {

        backgroundColor: '#F3E9DC',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,

    },

    filtroActivo: {
        backgroundColor: '#5C4033',
    },

    textoFiltro: {
        fontSize: 13,
        color: '#6B5142',
    },

    textoFiltroActivo: {
        color: 'white',
        fontWeight: 'bold',
    },



    registro: {

        backgroundColor: '#F3E9DC',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E1D4C6',
    },

    registroEncabezado: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconoRegistro: {
        fontSize: 23,
        marginRight: 12,
    },

    textoRegistro: {
        flex: 1,

    },

    nombreRegistro: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4A3328',

    },

    tipoRegistro: {
        fontSize: 11,
        color: '#8B6F47',
        marginTop: 5,
    },

    botonEliminar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#EBDDD5',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },

    textoEliminar: {
        color: '#8A5140',
        fontSize: 22,
        fontWeight: 'bold',
        lineHeight: 25,
    },

    valorRegistroContainer: {
        marginTop: 10,
        backgroundColor: 'white',
        padding: 10,
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
        marginTop: 8,
    },

    sinRegistros: {
        alignItems: 'center',
        padding: 25,
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