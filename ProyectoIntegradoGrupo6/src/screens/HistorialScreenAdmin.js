
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import io from 'socket.io-client';

const SERVER_URL = 'http://192.168.1.29:3000';

export default function HistorialScreenAdmin({ navigation }) {

    const [conectado, setConectado] = useState(false);
    const [historial, setHistorial] = useState([]);
    const [filtro, setFiltro] = useState('Todos');
    const zonaAnterior = useRef('NINGUNA');

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
        // Se excluyen las lecturas numéricas del ultrasónico.
        nuevaConexion.on('historial_data', (data) => {

            const registros = Array.isArray(data) ? data : [];

            setHistorial(registros.filter((registro) =>
                !String(registro.nombre || '').toLowerCase().includes('ultras')
            ));
        });

        // RECIBIR NUEVOS REGISTROS DE SENSORES Y ACTUADORES
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

        // NOTIFICACIONES DE CRECIMIENTO: LADO A (10 cm) O LADO B (30 cm)
        nuevaConexion.on('plant_distance', (data) => {

            const distancia = parseFloat(data.value);

            if (!Number.isFinite(distancia)) return;

            let zonaActual = 'NINGUNA';

            if (distancia >= 7 && distancia <= 13) {
                zonaActual = 'A';
            } else if (distancia >= 27 && distancia <= 33) {
                zonaActual = 'B';
            }

            // Solo se modifica el historial cuando cambia la zona detectada.
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

                    return [nuevaNotificacion, ...sinNotificacionAnterior].slice(0, 100);
                });

            }

        });

        return () => {
            nuevaConexion.disconnect();
        };

    }, []);

    // ELIMINAR UNA NOTIFICACIÓN DEL HISTORIAL
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

    // OBTENER EL ULTIMO REGISTRO DE UN ELEMENTO

    const obtenerUltimo = (nombre) => {

        return historial.find((registro) =>
            registro.nombre === nombre
        );

    };

    // OBTENER TODOS LOS SENSORES REGISTRADOS
    const sensores = historial.filter((registro) =>
        registro.tipo === 'Sensor'
    );

    const actuadores = historial.filter((registro) =>
        registro.tipo === 'Actuador'
    );

    // OBTENER LOS ULTIMOS REGISTROS DE CADA SENSOR

    const ultimosSensores = sensores.filter((registro, index, lista) =>
        lista.findIndex((elemento) =>
            elemento.nombre === registro.nombre
        ) === index
    );

    // OBTENER LOS ULTIMOS REGISTROS DE CADA ACTUADOR

    const ultimosActuadores = actuadores.filter((registro, index, lista) =>
        lista.findIndex((elemento) =>
            elemento.nombre === registro.nombre
        ) === index
    );

    // MOSTRAR VALOR
    const mostrarValor = (registro) => {

        if (!registro) {
            return 'Sin registros';
        }

        return registro.valor;

    };

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

            if (registro.nombre.includes('ultrasónico')) {
                return '📏';
            }

            if (registro.nombre.includes('humedad')) {
                return '💧';
            }

            if (registro.nombre.includes('Temperatura')) {
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

    // MOSTRAR ELEMENTO DEL HISTORIAL

    const mostrarElemento = (registro) => {

        return (

            <View
                style={styles.elemento}
                key={registro.id}
            >
            


                <View style={styles.elementoEncabezado}>

                    <Text style={styles.iconoElemento}>
                        {obtenerIcono(registro)}
                    </Text>

                    <Text style={styles.nombreElemento}>
                        {registro.nombre}
                    </Text>

                    <TouchableOpacity
                        style={styles.botonEliminar}
                        onPress={() => eliminarRegistro(registro.id)}
                    >
                        <Text style={styles.textoEliminar}>×</Text>
                    </TouchableOpacity>

                </View>

                <Text style={styles.valorElemento}>
                    {registro.valor}
                </Text>

                <Text style={styles.fechaElemento}>
                    {mostrarFecha(registro.fecha)}
                </Text>

            </View>

        );

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

                            <Text style={styles.iconoResumen}>
                                📊
                            </Text>

                            <Text style={styles.valorResumen}>
                                {historial.length}
                            </Text>

                            <Text style={styles.textoResumen}>
                                Registros
                            </Text>

                        </View>

                        <View style={styles.resumenItem}>

                            <Text style={styles.iconoResumen}>
                                📡
                            </Text>

                            <Text style={styles.valorResumen}>
                                {sensores.length}
                            </Text>

                            <Text style={styles.textoResumen}>
                                Sensores
                            </Text>

                        </View>

                        <View style={styles.resumenItem}>

                            <Text style={styles.iconoResumen}>
                                ⚙️
                            </Text>

                            <Text style={styles.valorResumen}>
                                {actuadores.length}
                            </Text>

                            <Text style={styles.textoResumen}>
                                Actuadores
                            </Text>

                        </View>

                    </View>

                </View>

                {/* HISTORIAL COMPLETO */}

                <View style={styles.card}>

                    <Text style={styles.titulo}>
                        Registros del invernadero
                    </Text>

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
                                filtro === 'Actuador' && styles.filtroActivo
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
                                        <Text style={styles.textoEliminar}>×</Text>
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

    registro: {

        backgroundColor: '#F3E9DC',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
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
        padding: 8,
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