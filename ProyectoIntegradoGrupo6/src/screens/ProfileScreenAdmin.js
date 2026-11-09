
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import {
    getFirestore,
    collection,
    onSnapshot
} from 'firebase/firestore';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView
} from 'react-native';

const db = getFirestore();

export default function ProfileScreen({ navigation }) {

    const [email, setEmail] = useState('');

    const [compras, setCompras] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [reportesEliminados, setReportesEliminados] = useState([]);

    // Eliminaciones temporales detectadas en tiempo real
    const [reportesEliminadosTiempoReal, setReportesEliminadosTiempoReal] = useState([]);
    const [comprasEliminadasTiempoReal, setComprasEliminadasTiempoReal] = useState([]);

    useEffect(() => {

        const auth = getAuth();

        // 1. Obtener el usuario autenticado
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setEmail(user.email ? user.email.split('@')[0] : '');
            } else {
                setEmail('');
            }
        });

        // Función para ordenar las fechas
        const convertirFecha = (fecha, timestamp) => {

            if (timestamp && typeof timestamp.toMillis === 'function') {
                return timestamp.toMillis();
            }

            if (!fecha) return 0;

            const partes = fecha.split('/');

            if (partes.length === 3) {
                return new Date(
                    Number(partes[2]),
                    Number(partes[1]) - 1,
                    Number(partes[0])
                ).getTime();
            }

            const fechaConvertida = new Date(fecha).getTime();

            return isNaN(fechaConvertida) ? 0 : fechaConvertida;
        };

        // 2. Escuchar compras
        const unsubscribeCompras = onSnapshot(
            collection(db, 'compras'),
            (snap) => {

                const lista = [];

                snap.forEach((d) => {
                    const compra = d.data();

                    lista.push({
                        id: d.id,
                        tipo: 'compra',
                        mensaje: `Se compró ${compra.producto || 'un producto'}`,
                        fecha: compra.fecha || 'Fecha no disponible',
                        orden: convertirFecha(compra.fecha)
                    });
                });

                setCompras(lista);
            },
            (error) => {
                console.error('Error al cargar compras:', error);
            }
        );

        // 3. Escuchar asistencias
        const unsubscribeAsistencia = onSnapshot(
            collection(db, 'asistencia'),
            (snap) => {

                const lista = [];

                snap.forEach((d) => {
                    const asistencia = d.data();

                    lista.push({
                        id: d.id,
                        tipo: 'asistencia',
                        mensaje: `Asistencia de ${asistencia.nombreUsuario || 'un trabajador'}`,
                        detalle: `Estado: ${asistencia.estado || 'Sin estado'}`,
                        fecha: asistencia.fecha || 'Fecha no disponible',
                        orden: convertirFecha(
                            asistencia.fecha,
                            asistencia.timestamp
                        )
                    });
                });

                setAsistencias(lista);
            },
            (error) => {
                console.error('Error al cargar asistencias:', error);
            }
        );

        // 4. Escuchar reportes eliminados de actividadAdmin
        const unsubscribeReportes = onSnapshot(
            collection(db, 'actividadAdmin'),
            (snap) => {

                const lista = [];

                snap.forEach((d) => {
                    const actividad = d.data();

                    if (actividad.tipo === 'Reporte eliminado') {
                        lista.push({
                            id: d.id,
                            tipo: 'reporte',
                            mensaje: actividad.descripcion || 'Se eliminó un reporte',
                            fecha: actividad.fecha || 'Fecha no disponible',
                            orden: convertirFecha(
                                actividad.fecha,
                                actividad.timestamp
                            )
                        });
                    }
                });

                setReportesEliminados(lista);
            },
            (error) => {
                console.error('Error al cargar actividades administrativas:', error);
            }
        );

        // 5. Detectar reportes eliminados en tiempo real
        let reportesInicializados = false;
        const reportesConocidos = new Map();

        const unsubscribeReportesTiempoReal = onSnapshot(
            collection(db, 'reportes'),
            (snap) => {

                if (!reportesInicializados) {

                    snap.forEach((d) => {
                        reportesConocidos.set(d.id, d.data());
                    });

                    reportesInicializados = true;
                    return;
                }

                const eliminaciones = [];

                snap.docChanges().forEach((cambio) => {

                    const idReporte = cambio.doc.id;

                    if (cambio.type === 'removed') {

                        eliminaciones.push({
                            id: `${idReporte}-${Date.now()}`,
                            tipo: 'reporte',
                            mensaje: 'Se eliminó un reporte',
                            fecha: new Date().toLocaleDateString(),
                            orden: Date.now()
                        });

                        reportesConocidos.delete(idReporte);

                    } else if (
                        cambio.type === 'added' ||
                        cambio.type === 'modified'
                    ) {

                        reportesConocidos.set(
                            idReporte,
                            cambio.doc.data()
                        );
                    }
                });

                if (eliminaciones.length > 0) {

                    setReportesEliminadosTiempoReal((anteriores) => [
                        ...anteriores,
                        ...eliminaciones
                    ]);
                }
            },
            (error) => {
                console.error('Error al detectar reportes eliminados:', error);
            }
        );

        // 6. NUEVO: Detectar pedidos de compra eliminados en tiempo real
        let comprasInicializadas = false;
        const comprasConocidas = new Map();

        const unsubscribeComprasTiempoReal = onSnapshot(
            collection(db, 'compras'),
            (snap) => {

                // Primera lectura: guardar las compras existentes
                if (!comprasInicializadas) {

                    snap.forEach((d) => {
                        comprasConocidas.set(d.id, d.data());
                    });

                    comprasInicializadas = true;
                    return;
                }

                const eliminaciones = [];

                snap.docChanges().forEach((cambio) => {

                    const idCompra = cambio.doc.id;

                    if (cambio.type === 'removed') {

                        const compraAnterior = comprasConocidas.get(idCompra);

                        eliminaciones.push({
                            id: `${idCompra}-${Date.now()}`,
                            tipo: 'compraEliminada',
                            mensaje: `Se eliminó el pedido de ${compraAnterior?.producto || 'un producto'}`,
                            fecha: new Date().toLocaleDateString(),
                            orden: Date.now()
                        });

                        comprasConocidas.delete(idCompra);

                    } else if (
                        cambio.type === 'added' ||
                        cambio.type === 'modified'
                    ) {

                        comprasConocidas.set(
                            idCompra,
                            cambio.doc.data()
                        );
                    }
                });

                if (eliminaciones.length > 0) {

                    setComprasEliminadasTiempoReal((anteriores) => [
                        ...anteriores,
                        ...eliminaciones
                    ]);
                }
            },
            (error) => {
                console.error('Error al detectar pedidos eliminados:', error);
            }
        );

        // 7. Limpiar escuchas
        return () => {
            unsubscribeAuth();
            unsubscribeCompras();
            unsubscribeAsistencia();
            unsubscribeReportes();
            unsubscribeReportesTiempoReal();
            unsubscribeComprasTiempoReal();
        };

    }, []);

    // 8. Combinar y ordenar todas las actividades
    const actividades = [
        ...compras,
        ...asistencias,
        ...reportesEliminados,
        ...reportesEliminadosTiempoReal,
        ...comprasEliminadasTiempoReal
    ]
        .sort((a, b) => b.orden - a.orden)
        .slice(0, 3);

    // 9. Cerrar sesión
    const cerrarSesion = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // 10. Icono según el tipo de actividad
    const obtenerIcono = (tipo) => {

        if (tipo === 'compra' || tipo === 'compraEliminada') {
            return 'shopping-cart';
        }

        if (tipo === 'asistencia') {
            return 'users';
        }

        if (tipo === 'reporte') {
            return 'file-text';
        }

        return 'history';
    };

    return (
        <View style={styles.container}>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.caja}>

                    <Text style={styles.title}>Mi Perfil</Text>

                    <View style={styles.circulo}>
                        <FontAwesome
                            name="user-circle"
                            size={90}
                            color="black"
                        />
                    </View>

                    <Text style={styles.bienvenida}>
                        ¡Bienvenido!
                    </Text>

                    <View style={styles.tarjeta}>
                        <Text style={styles.etiqueta}>USUARIO</Text>

                        <Text style={styles.text}>
                            {email}
                        </Text>
                    </View>

                    {/* REGISTRO DE ACTIVIDADES ADMINISTRATIVAS */}

                    <View style={styles.actividades}>

                        <Text style={styles.tituloActividades}>
                            Registro de últimas actividades administrativas
                        </Text>

                        {actividades.length === 0 ? (

                            <Text style={styles.sinActividades}>
                                No hay actividades administrativas recientes.
                            </Text>

                        ) : (

                            actividades.map((actividad) => (

                                <View
                                    key={`${actividad.tipo}-${actividad.id}`}
                                    style={styles.compra}
                                >

                                    <View style={styles.filaCompra}>

                                        <FontAwesome
                                            name={obtenerIcono(actividad.tipo)}
                                            size={20}
                                            color="#8D6E63"
                                            style={{ marginRight: 10 }}
                                        />

                                        <Text style={styles.nombreProducto}>
                                            {actividad.mensaje}
                                        </Text>

                                    </View>

                                    {actividad.detalle ? (
                                        <Text style={styles.detalleCompra}>
                                            {actividad.detalle}
                                        </Text>
                                    ) : null}

                                    <Text style={styles.fechaCompra}>
                                        Fecha: {actividad.fecha}
                                    </Text>

                                </View>

                            ))

                        )}

                    </View>

                    <View style={styles.linea} />

                    <TouchableOpacity
                        style={styles.boton}
                        onPress={cerrarSesion}
                    >
                        <FontAwesome
                            name="sign-out"
                            size={20}
                            color="white"
                        />

                        <Text style={styles.textoBoton}>
                            Cerrar sesión
                        </Text>
                    </TouchableOpacity>

                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        backgroundColor: '#E1D4C6',
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 25,
    },

    caja: {
        backgroundColor: '#fefefcf3',
        width: '88%',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 45,
        paddingHorizontal: 25,

        elevation: 6,
        shadowColor: '#4A3328',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },

    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#4A3328',
        marginBottom: 30,
    },

    circulo: {
        backgroundColor: '#E1D4C6',
        width: 125,
        height: 125,
        borderRadius: 65,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    bienvenida: {
        fontSize: 23,
        fontWeight: 'bold',
        color: '#4A3328',
        marginBottom: 25,
    },

    tarjeta: {
        backgroundColor: '#F2EAE1',
        width: '100%',
        borderRadius: 15,
        padding: 18,
        alignItems: 'center',
    },

    etiqueta: {
        fontSize: 12,
        color: '#927966',
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 8,
    },

    text: {
        fontSize: 22,
        color: '#4A3328',
        fontWeight: '600',
    },

    actividades: {
        width: '100%',
        marginTop: 25,
    },

    tituloActividades: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4A3328',
        marginBottom: 15,
        textAlign: 'center',
    },

    compra: {
        backgroundColor: '#F2EAE1',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#D8C6B5',
    },

    filaCompra: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },

    nombreProducto: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#4A3328',
        flex: 1,
    },

    detalleCompra: {
        fontSize: 14,
        color: '#5D4037',
        marginTop: 8,
    },

    fechaCompra: {
        fontSize: 12,
        color: '#927966',
        marginTop: 5,
        textAlign: 'right',
    },

    sinActividades: {
        fontSize: 14,
        color: '#927966',
        textAlign: 'center',
        padding: 15,
        backgroundColor: '#F2EAE1',
        borderRadius: 12,
    },

    linea: {
        width: '70%',
        height: 1,
        backgroundColor: '#D8C6B5',
        marginVertical: 30,
    },

    boton: {
        backgroundColor: '#4A3328',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: 16,
        borderRadius: 15,
        gap: 12,
    },

    textoBoton: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },

});
