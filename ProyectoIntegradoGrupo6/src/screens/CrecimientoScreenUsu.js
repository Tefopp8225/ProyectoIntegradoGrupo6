
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';

import io from 'socket.io-client';
import { initializeApp, getApps } from 'firebase/app';
import {
    getFirestore,
    collection,
    onSnapshot,
    doc,
    runTransaction
} from 'firebase/firestore';

import { firebaseConfig } from '../firebase/FirebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);


const PRODUCTOS_BASE = [
    { id: '1', nombre: 'Tierra' },
    { id: '2', nombre: 'Abono' },
    { id: '3', nombre: 'Semillas' },
    { id: '4', nombre: 'Herbicida' },
    { id: '5', nombre: 'Fertilizante' }
];

const obtenerNombreProducto = (id, nombreGuardado = '') => {
    const producto = PRODUCTOS_BASE.find(p => p.id === String(id));
    return producto ? producto.nombre : (nombreGuardado || 'Producto desconocido');
};

const SERVER_URL = 'http://192.168.1.26:3000';

export default function CrecimientoScreenUsu({ navigation }) {

    const [conectado, setConectado] = useState(false);

    // Distancia detectada por el sensor ultrasónico
    const [sensorDistance, setSensorDistance] = useState(null);

    // Estado de los dos lados
    const [ladoA, setLadoA] = useState(false);
    const [ladoB, setLadoB] = useState(false);

    const [inventario, setInventario] = useState([]);
    const [cantidadesUso, setCantidadesUso] = useState({});
    const [materialesUtilizados, setMaterialesUtilizados] = useState([]);
    const [comprasPendientes, setComprasPendientes] = useState([]);

    // CONEXIÓN CON EL SENSOR
    useEffect(() => {

        const nuevaConexion = io(SERVER_URL, {
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        nuevaConexion.on('connect', () => {
            setConectado(true);
            console.log('Conectado al servidor:', nuevaConexion.id);
        });

        nuevaConexion.on('disconnect', (motivo) => {
            setConectado(false);
            setSensorDistance(null);
            setLadoA(false);
            setLadoB(false);

            console.log('Desconectado del servidor:', motivo);
        });

        nuevaConexion.on('connect_error', (error) => {
            setConectado(false);
            console.log('ERROR DE CONEXION:', error.message);
        });

        // Recibir distancia del sensor
        nuevaConexion.on('plant_distance', (data) => {

            const distancia = parseFloat(data.value);

            if (!Number.isFinite(distancia)) {
                return;
            }

            setSensorDistance(distancia);

            // Si no detecta nada o supera los 40 cm
            if (distancia <= 0 || distancia > 40) {
                setLadoA(false);
                setLadoB(false);
                return;
            }

            // LADO A: aproximadamente 10 cm
            if (distancia >= 7 && distancia <= 13) {
                setLadoA(true);
                setLadoB(false);
            }

            // LADO B: aproximadamente 30 cm
            else if (distancia >= 27 && distancia <= 33) {
                setLadoA(false);
                setLadoB(true);
            }

            // Si está dentro de 40 cm pero fuera de las zonas
            else {
                setLadoA(false);
                setLadoB(false);
            }

            console.log('Distancia detectada:', distancia, 'cm');
        });

        return () => {
            nuevaConexion.disconnect();
        };

    }, []);

    // CARGAR INVENTARIO EN TIEMPO REAL
    useEffect(() => {

        const cancelarInventario = onSnapshot(
            collection(db, "inventario"),
            (snap) => {

                const lista = [];

                snap.forEach((documento) => {
                    lista.push({
                        id: documento.id,
                        ...documento.data()
                    });
                });

                lista.sort((a, b) => Number(a.id) - Number(b.id));
                setInventario(lista);

            },
            (error) => {
                console.log("Error al cargar inventario:", error);
                Alert.alert("Error", "No se pudo cargar el inventario.");
            }
        );

        return () => cancelarInventario();

    }, []);

    // CARGAR REGISTRO DE MATERIALES UTILIZADOS
    useEffect(() => {

        const cancelarRegistro = onSnapshot(
            collection(db, "materiales_utilizados"),
            (snap) => {

                const lista = [];

                snap.forEach((documento) => {
                    lista.push({
                        id: documento.id,
                        ...documento.data()
                    });
                });

                lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                setMaterialesUtilizados(lista);

            },
            (error) => {
                console.log("Error al cargar materiales utilizados:", error);
            }
        );

        return () => cancelarRegistro();

    }, []);

    // CARGAR PEDIDOS PENDIENTES
    useEffect(() => {

        const cancelarCompras = onSnapshot(
            collection(db, "compras"),
            (snap) => {

                const lista = [];

                snap.forEach((documento) => {

                    const compra = {
                        id: documento.id,
                        ...documento.data()
                    };

                    if (compra.estado === "En camino") {
                        lista.push(compra);
                    }

                });

                lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                setComprasPendientes(lista);

            },
            (error) => {
                console.log("Error al cargar pedidos:", error);
                Alert.alert("Error", "No se pudieron cargar los pedidos.");
            }
        );

        return () => cancelarCompras();

    }, []);

    const cambiarCantidadUso = (id, valor) => {

        setCantidadesUso({
            ...cantidadesUso,
            [id]: valor
        });

    };

    // CONFIRMAR RECEPCIÓN DE COMPRA
    const confirmarCompra = async (compra) => {

        if (!compra.productoId) {
            Alert.alert(
                "Error",
                "Este pedido no tiene asociado un producto del inventario. Realiza un nuevo pedido desde el administrador."
            );
            return;
        }

        try {

            await runTransaction(db, async (transaction) => {

                const referenciaCompra = doc(db, "compras", compra.id);
                const referenciaInventario = doc(db, "inventario", compra.productoId);


                const documentoCompra = await transaction.get(referenciaCompra);
                const documentoInventario = await transaction.get(referenciaInventario);

                if (!documentoCompra.exists()) {
                    throw new Error("El pedido ya no existe.");
                }

                if (documentoCompra.data().estado !== "En camino") {
                    throw new Error("Este pedido ya fue recibido anteriormente.");
                }

                if (!documentoInventario.exists()) {
                    throw new Error("El producto no existe en el inventario.");
                }

                const cantidadCompra = Number(documentoCompra.data().cantidad);
                const cantidadActual = Number(documentoInventario.data().cantidad);

                if (!Number.isInteger(cantidadCompra) || cantidadCompra <= 0) {
                    throw new Error("La cantidad del pedido no es válida.");
                }

                if (!Number.isFinite(cantidadActual) || cantidadActual < 0) {
                    throw new Error("La cantidad actual del inventario no es válida.");
                }


                transaction.update(referenciaInventario, {
                    cantidad: cantidadActual + cantidadCompra
                });



                transaction.update(referenciaCompra, {
                    estado: "Recibido",
                    fechaRecepcion: new Date().toISOString()
                });

            });

            Alert.alert(
                "¡Compra recibida!",
                `${obtenerNombreProducto(compra.productoId, compra.producto)}: ${compra.cantidad} unidades agregadas al inventario.`
            );

        } catch (error) {

            console.log("Error al confirmar compra:", error);

            Alert.alert(
                "Error",
                error.message || "No se pudo confirmar la compra."
            );

        }

    };

    // UTILIZAR MATERIAL DEL INVENTARIO
    const usarMaterial = async (producto) => {

        const cantidad = Number(cantidadesUso[producto.id]);

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            Alert.alert("Atención", "Escribe una cantidad válida.");
            return;
        }

        try {

            await runTransaction(db, async (transaction) => {

                const referencia = doc(db, "inventario", producto.id);
                const documento = await transaction.get(referencia);

                if (!documento.exists()) {
                    throw new Error("Este producto no existe en el inventario.");
                }

                const stockActual = Number(documento.data().cantidad);

                if (!Number.isFinite(stockActual) || stockActual < 0) {
                    throw new Error("La cantidad del inventario no es válida.");
                }

                if (cantidad > stockActual) {
                    throw new Error("No hay suficiente cantidad disponible.");
                }

                transaction.update(referencia, {
                    cantidad: stockActual - cantidad
                });

                const nuevoRegistro = doc(collection(db, "materiales_utilizados"));

                transaction.set(nuevoRegistro, {
                    producto: obtenerNombreProducto(producto.id, producto.nombre),
                    productoId: producto.id,
                    cantidad: cantidad,
                    fecha: new Date().toISOString()
                });

            });

            setCantidadesUso({
                ...cantidadesUso,
                [producto.id]: ''
            });

            Alert.alert(
                "Material utilizado",
                "Se descontó la cantidad del inventario correctamente."
            );

        } catch (error) {

            console.log("Error al utilizar material:", error);

            Alert.alert(
                "Error",
                error.message || "No se pudo utilizar el material."
            );

        }

    };

    // DETERMINAR SI ALGUNO DE LOS LADOS ESTÁ LISTO
    const plantaLista = ladoA || ladoB;

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
                            Monitorea el desarrollo de las plantas
                            en ambos lados del invernadero.
                        </Text>

                    </View>

                </View>

                <View style={styles.card}>

                    <Text style={styles.titulo}>
                        Estado de las plantas
                    </Text>

                    <Text style={[
                        styles.estado,
                        conectado ? styles.conectado : styles.desconectado
                    ]}>
                        {conectado ? '🟢 Sensor conectado' : '🔴 Sensor desconectado'}
                    </Text>

                    <View style={[
                        styles.mensajeCrecimiento,
                        plantaLista && styles.mensajeLista
                    ]}>

                        <Text style={styles.iconoCrecimiento}>
                            {plantaLista ? '🌾' : '🌱'}
                        </Text>

                        <Text style={styles.tituloCrecimiento}>
                            {plantaLista
                                ? '¡Planta alta lista para cortar!'
                                : 'Las plantas siguen en crecimiento'}
                        </Text>

                        <Text style={styles.descripcionCrecimiento}>
                            {plantaLista
                                ? 'El sensor ha detectado que una de las plantas alcanzó la zona de corte.'
                                : 'Las plantas todavía no han llegado a la zona de corte. Seguiremos monitoreando su crecimiento.'}
                        </Text>

                    </View>

                    {/* LADO A Y LADO B */}
                    <View style={styles.contenedorLados}>

                        {/* LADO A */}
                        <View style={[
                            styles.tarjetaLado,
                            ladoA && styles.tarjetaDetectada
                        ]}>

                            <Text style={styles.iconoLado}>
                                🌿
                            </Text>

                            <Text style={styles.nombreLado}>
                                LADO A
                            </Text>


                            <View style={[
                                styles.indicadorLado,
                                ladoA ? styles.indicadorActivo : styles.indicadorInactivo
                            ]} />

                            <Text style={[
                                styles.estadoLado,
                                ladoA && styles.estadoLadoActivo
                            ]}>
                                {ladoA ? '¡Lista para cortar!' : 'En crecimiento'}
                            </Text>

                            {ladoA && (
                                <Text style={styles.distanciaDetectada}>
                                    Detectada a {sensorDistance?.toFixed(1)} cm
                                </Text>
                            )}

                        </View>

                        {/* LADO B */}
                        <View style={[
                            styles.tarjetaLado,
                            ladoB && styles.tarjetaDetectada
                        ]}>

                            <Text style={styles.iconoLado}>
                                🌿
                            </Text>

                            <Text style={styles.nombreLado}>
                                LADO B
                            </Text>


                            <View style={[
                                styles.indicadorLado,
                                ladoB ? styles.indicadorActivo : styles.indicadorInactivo
                            ]} />

                            <Text style={[
                                styles.estadoLado,
                                ladoB && styles.estadoLadoActivo
                            ]}>
                                {ladoB ? '¡Lista para cortar!' : 'En crecimiento'}
                            </Text>

                            {ladoB && (
                                <Text style={styles.distanciaDetectada}>
                                    Detectada a {sensorDistance?.toFixed(1)} cm
                                </Text>
                            )}

                        </View>

                    </View>
                    

                </View>

                {/* PEDIDOS PENDIENTES */}
                <View style={styles.card}>

                    <Text style={styles.titulo}>
                        Pedidos por recibir
                    </Text>

                    {comprasPendientes.length === 0 ? (

                        <View style={styles.registroPendiente}>

                            <Text style={styles.iconoRegistro}>📦</Text>

                            <Text style={styles.textoRegistro}>
                                No hay pedidos pendientes de recibir.
                            </Text>

                        </View>

                    ) : (

                        comprasPendientes.map((compra) => (

                            <View key={compra.id} style={styles.pedidoItem}>

                                <View style={styles.pedidoEncabezado}>

                                    <View style={styles.textoInfo}>

                                        <Text style={styles.nombreMaterial}>
                                            {obtenerNombreProducto(compra.productoId, compra.producto)}
                                        </Text>

                                        <Text style={styles.cantidadMaterial}>
                                            Cantidad: {compra.cantidad}
                                        </Text>

                                        <Text style={styles.estadoPedido}>
                                            Estado: En camino
                                        </Text>

                                        <Text style={styles.cantidadMaterial}>
                                            Pedido: {compra.fecha}
                                        </Text>

                                    </View>

                                    <Text style={styles.iconoPedido}>🚚</Text>

                                </View>

                                <TouchableOpacity
                                    style={styles.botonRecibir}
                                    onPress={() => confirmarCompra(compra)}
                                >

                                    <Text style={styles.textoBotonRecibir}>
                                        Compra recibida
                                    </Text>

                                </TouchableOpacity>

                            </View>

                        ))

                    )}

                </View>

                {/* INVENTARIO */}
                <View style={styles.card}>

                    <Text style={styles.titulo}>
                        Materiales e inventario
                    </Text>

                    <View style={styles.informacion}>

                        <Text style={styles.iconoInfo}>📦</Text>

                        <View style={styles.textoInfo}>

                            <Text style={styles.subtitulo}>
                                Materiales disponibles
                            </Text>

                            <Text style={styles.valorInfo}>
                                Inventario actual
                            </Text>

                        </View>

                    </View>

                    {inventario.length === 0 ? (

                        <Text style={styles.registroVacio}>
                            No hay materiales registrados en el inventario.
                        </Text>

                    ) : (

                        inventario.map((producto) => (

                            <View key={producto.id} style={styles.materialCompacto}>

                                <View style={styles.materialEncabezado}>

                                    <Text style={styles.nombreMaterial}>
                                        {obtenerNombreProducto(producto.id, producto.nombre)}
                                    </Text>

                                    <Text style={styles.stockMaterial}>
                                        Stock: {producto.cantidad}
                                    </Text>

                                </View>

                                <View style={styles.filaUso}>

                                    <TextInput
                                        style={styles.inputUso}
                                        placeholder="Cantidad"
                                        value={cantidadesUso[producto.id] || ''}
                                        onChangeText={(valor) => cambiarCantidadUso(producto.id, valor)}
                                        keyboardType="numeric"
                                    />

                                    <TouchableOpacity
                                        style={[
                                            styles.botonUsar,
                                            Number(producto.cantidad) <= 0 && styles.botonDesactivado
                                        ]}
                                        disabled={Number(producto.cantidad) <= 0}
                                        onPress={() => usarMaterial(producto)}
                                    >

                                        <Text style={styles.textoBotonUsar}>
                                            Usar
                                        </Text>

                                    </TouchableOpacity>

                                </View>

                                {Number(producto.cantidad) <= 0 && (

                                    <Text style={styles.sinStock}>
                                        Sin existencias disponibles
                                    </Text>

                                )}

                            </View>

                        ))

                    )}

                    <View style={styles.separadorMaterial} />

                    <Text style={styles.subtituloRegistro}>
                        Registro de materiales utilizados
                    </Text>

                    {materialesUtilizados.length === 0 ? (

                        <View style={styles.registroPendiente}>

                            <Text style={styles.iconoRegistro}>📝</Text>

                            <Text style={styles.textoRegistro}>
                                Aquí aparecerán los materiales utilizados
                                y las cantidades registradas.
                            </Text>

                        </View>

                    ) : (

                        materialesUtilizados.map((registro) => (

                            <View key={registro.id} style={styles.registroMaterial}>

                                <View style={styles.textoInfo}>

                                    <Text style={styles.nombreMaterial}>
                                        {obtenerNombreProducto(registro.productoId, registro.producto)}
                                    </Text>

                                    <Text style={styles.cantidadMaterial}>
                                        {new Date(registro.fecha).toLocaleString('es-GT')}
                                    </Text>

                                </View>

                                <Text style={styles.cantidadValor}>
                                    -{registro.cantidad}
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
        marginBottom: 15,
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

    mensajeCrecimiento: {
        backgroundColor: '#EAF0E5',
        borderRadius: 12,
        padding: 17,
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#C9D6BE',
    },

    mensajeLista: {
        backgroundColor: '#F5EBD8',
        borderColor: '#D9B978',
    },

    iconoCrecimiento: {
        fontSize: 38,
        marginBottom: 8,
    },

    tituloCrecimiento: {
        color: '#53634A',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    descripcionCrecimiento: {
        color: '#6B5142',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        marginTop: 8,
    },

    contenedorLados: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },

    tarjetaLado: {
        flex: 1,
        backgroundColor: '#F8F4EF',
        borderRadius: 12,
        paddingVertical: 17,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E1D4C6',
    },

    tarjetaDetectada: {
        backgroundColor: '#EDF2E8',
        borderColor: '#8B9D78',
        borderWidth: 2,
    },

    iconoLado: {
        fontSize: 32,
        marginBottom: 7,
    },

    nombreLado: {
        color: '#4A3328',
        fontSize: 17,
        fontWeight: 'bold',
    },

    distanciaLado: {
        fontSize: 11,
        color: '#8B6F47',
        textAlign: 'center',
        marginTop: 5,
    },

    indicadorLado: {
        width: 15,
        height: 15,
        borderRadius: 20,
        marginTop: 13,
        marginBottom: 9,
    },

    indicadorActivo: {
        backgroundColor: '#53634A',
    },

    indicadorInactivo: {
        backgroundColor: '#C7BEB5',
    },

    estadoLado: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#8B6F47',
        textAlign: 'center',
    },

    estadoLadoActivo: {
        color: '#53634A',
    },

    distanciaDetectada: {
        fontSize: 10,
        color: '#53634A',
        marginTop: 7,
        textAlign: 'center',
    },

    notaSensor: {
        fontSize: 12,
        color: '#8B6F47',
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 17,
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
    

    pedidoItem: {
        backgroundColor: '#F8F4EF',
        padding: 13,
        borderRadius: 10,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E1D4C6',
    },

    pedidoEncabezado: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconoPedido: {
        fontSize: 30,
        marginLeft: 10,
    },

    estadoPedido: {
        color: '#D97706',
        fontWeight: 'bold',
        fontSize: 13,
        marginTop: 5,
    },

    botonRecibir: {
        backgroundColor: '#53634A',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },

    textoBotonRecibir: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },

    materialCompacto: {
        backgroundColor: '#F8F4EF',
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#E1D4C6',
    },

    materialEncabezado: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    nombreMaterial: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#4A3328',
    },

    cantidadMaterial: {
        fontSize: 12,
        color: '#8B6F47',
        marginTop: 4,
    },

    stockMaterial: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#53634A',
    },

    filaUso: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },

    inputUso: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D7CCC8',
        borderRadius: 7,
        padding: 8,
        backgroundColor: 'white',
        marginRight: 8,
        fontSize: 14,
    },

    botonUsar: {
        backgroundColor: '#53634A',
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 7,
        alignItems: 'center',
    },

    botonDesactivado: {
        backgroundColor: '#A9A9A9',
    },

    textoBotonUsar: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
    },

    sinStock: {
        fontSize: 12,
        color: '#A94438',
        marginTop: 6,
    },

    registroVacio: {
        fontSize: 13,
        color: '#8B6F47',
        marginTop: 15,
        textAlign: 'center',
    },

    separadorMaterial: {
        height: 1,
        backgroundColor: '#E1D4C6',
        marginVertical: 20,
    },

    subtituloRegistro: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#4A3328',
        marginBottom: 12,
    },

    registroPendiente: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E9DC',
        padding: 15,
        borderRadius: 12,
    },

    iconoRegistro: {
        fontSize: 28,
        marginRight: 12,
    },

    textoRegistro: {
        flex: 1,
        fontSize: 13,
        color: '#6B5142',
        lineHeight: 20,
        textAlign: 'justify',
    },

    registroMaterial: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F4EF',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
    },

    cantidadValor: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#53634A',
    },

});
