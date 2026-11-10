
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
    ScrollView,
    StatusBar
} from 'react-native';

const db = getFirestore();

export default function ProfileScreen({ navigation }) {

    const [email, setEmail] = useState('');

    const [compras, setCompras] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [reportesEliminados, setReportesEliminados] = useState([]);

    const [reportesEliminadosTiempoReal, setReportesEliminadosTiempoReal] = useState([]);
    const [comprasEliminadasTiempoReal, setComprasEliminadasTiempoReal] = useState([]);

    useEffect(() => {

        const auth = getAuth();

        // 1. Obtener usuario autenticado
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setEmail(user.email ? user.email.split('@')[0] : '');
            } else {
                setEmail('');
            }
        });

        // Función para ordenar fechas
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

        // 2. Escuchar compras realizadas
        let comprasInicializadas = false;
        const ordenesCompras = new Map();

        const unsubscribeCompras = onSnapshot(
            collection(db, 'compras'),
            (snap) => {

                // Detectar compras nuevas y asignarles hora de registro
                snap.docChanges().forEach((cambio) => {

                    if (cambio.type === 'added') {

                        const compra = cambio.doc.data();

                        ordenesCompras.set(
                            cambio.doc.id,
                            comprasInicializadas
                                ? Date.now()
                                : convertirFecha(compra.fecha)
                        );
                    }

                    if (cambio.type === 'removed') {
                        ordenesCompras.delete(cambio.doc.id);
                    }
                });

                const lista = snap.docs.map((d) => {

                    const compra = d.data();

                    return {
                        id: d.id,
                        tipo: 'compra',
                        mensaje: `Compra realizada: ${compra.producto || 'un producto'}`,
                        detalle: compra.cantidad
                            ? `Cantidad: ${compra.cantidad}`
                            : undefined,
                        fecha: compra.fecha || 'Fecha no disponible',
                        orden: ordenesCompras.get(d.id) || convertirFecha(compra.fecha)
                    };
                });

                comprasInicializadas = true;

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

        // 4. Escuchar reportes eliminados
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

        // 6. Detectar pedidos de compra eliminados en tiempo real
        let comprasEliminadasInicializadas = false;
        const comprasConocidas = new Map();

        const unsubscribeComprasTiempoReal = onSnapshot(
            collection(db, 'compras'),
            (snap) => {

                if (!comprasEliminadasInicializadas) {

                    snap.forEach((d) => {
                        comprasConocidas.set(d.id, d.data());
                    });

                    comprasEliminadasInicializadas = true;
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

    // 8. Combinar y ordenar actividades
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

    // 10. Iconos de actividades
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

    // 11. Colores según actividad
    const obtenerColor = (tipo) => {

        if (tipo === 'compra') return '#5C3A21';

        if (tipo === 'compraEliminada') return '#C16C52';

        if (tipo === 'asistencia') return '#2E7D32';

        if (tipo === 'reporte') return '#8E44AD';

        return '#5C3A21';
    };

    const obtenerFondo = (tipo) => {

        if (tipo === 'compra') return '#F5EBDD';

        if (tipo === 'compraEliminada') return '#F8E9E3';

        if (tipo === 'asistencia') return '#E8F5E9';

        if (tipo === 'reporte') return '#F4ECF7';

        return '#F2EAE1';
    };

    return (

        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#382218" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.caja}>

                    {/* ENCABEZADO DEL PERFIL */}

                    <View style={styles.encabezado}>

                        <View style={styles.iconoPerfil}>
                            <FontAwesome
                                name="user"
                                size={48}
                                color="#FFF9F2"
                            />
                        </View>

                        <Text style={styles.title}>
                            Mi Perfil
                        </Text>

                        <Text style={styles.subtitulo}>
                            Administración de cuenta
                        </Text>
                    </View>

                    {/* INFORMACIÓN DEL USUARIO */}

                    <View style={styles.seccionUsuario}>

                        <View style={styles.encabezadoSeccion}>

                            <View style={styles.iconoSeccion}>
                                <FontAwesome
                                    name="user-circle"
                                    size={17}
                                    color="#5C3A21"
                                />
                            </View>

                            <Text style={styles.tituloSeccion}>
                                Información de cuenta
                            </Text>

                        </View>

                        <View style={styles.tarjetaUsuario}>

                            <View style={styles.iconoUsuario}>
                                <FontAwesome
                                    name="user"
                                    size={21}
                                    color="#5C3A21"
                                />
                            </View>

                            <View style={styles.datosUsuario}>

                                <Text style={styles.etiqueta}>
                                    USUARIO
                                </Text>

                                <Text style={styles.textUsuario}>
                                    {email || 'No disponible'}
                                </Text>

                            </View>

                            <FontAwesome
                                name="check-circle"
                                size={22}
                                color="#2E7D32"
                            />

                        </View>

                    </View>

                    {/* REGISTRO DE ACTIVIDADES */}

                    <View style={styles.actividades}>

                        <View style={styles.encabezadoActividades}>

                            <View style={styles.encabezadoSeccion}>

                                <View style={styles.iconoSeccion}>
                                    <FontAwesome
                                        name="history"
                                        size={17}
                                        color="#5C3A21"
                                    />
                                </View>

                                <Text style={styles.tituloSeccion}>
                                    Actividad reciente
                                </Text>

                            </View>

                            <View style={styles.etiquetaReciente}>
                                <Text style={styles.textoReciente}>
                                    ÚLTIMAS 3
                                </Text>
                            </View>

                        </View>

                        <Text style={styles.descripcionActividades}>
                            Registro de movimientos administrativos
                        </Text>

                        {actividades.length === 0 ? (

                            <View style={styles.sinActividades}>

                                <View style={styles.iconoSinActividad}>
                                    <FontAwesome
                                        name="folder-open-o"
                                        size={28}
                                        color="#8C6239"
                                    />
                                </View>

                                <Text style={styles.textoSinActividad}>
                                    Sin actividad reciente
                                </Text>

                                <Text style={styles.detalleSinActividad}>
                                    Aquí aparecerán los últimos movimientos administrativos.
                                </Text>

                            </View>

                        ) : (

                            actividades.map((actividad) => (

                                <View
                                    key={`${actividad.tipo}-${actividad.id}`}
                                    style={styles.tarjetaActividad}
                                >

                                    <View
                                        style={[
                                            styles.iconoActividad,
                                            {
                                                backgroundColor: obtenerFondo(actividad.tipo)
                                            }
                                        ]}
                                    >

                                        <FontAwesome
                                            name={obtenerIcono(actividad.tipo)}
                                            size={19}
                                            color={obtenerColor(actividad.tipo)}
                                        />

                                    </View>

                                    <View style={styles.contenidoActividad}>

                                        <Text style={styles.nombreProducto}>
                                            {actividad.mensaje}
                                        </Text>

                                        {actividad.detalle ? (

                                            <Text style={styles.detalleCompra}>
                                                {actividad.detalle}
                                            </Text>

                                        ) : null}

                                        <View style={styles.filaFecha}>

                                            <FontAwesome
                                                name="calendar"
                                                size={11}
                                                color="#8C6239"
                                            />

                                            <Text style={styles.fechaCompra}>
                                                {actividad.fecha}
                                            </Text>

                                        </View>

                                    </View>

                                </View>

                            ))

                        )}

                    </View>

                    {/* CIERRE DE SESIÓN */}

                    <View style={styles.pie}>

                        <View style={styles.linea} />

                        <Text style={styles.textoPie}>
                            ¿Deseas salir de tu cuenta?
                        </Text>

                        <TouchableOpacity
                            style={styles.boton}
                            onPress={cerrarSesion}
                            activeOpacity={0.8}
                        >

                            <FontAwesome
                                name="sign-out"
                                size={19}
                                color="#FFFFFF"
                            />

                            <Text style={styles.textoBoton}>
                                Cerrar sesión
                            </Text>

                            <FontAwesome
                                name="arrow-right"
                                size={14}
                                color="#E8D8C9"
                            />

                        </TouchableOpacity>

                        <Text style={styles.version}>
                            PANEL ADMINISTRATIVO
                        </Text>

                    </View>

                </View>

            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({

    // FONDO GENERAL

    container: {
        flex: 1,
        backgroundColor: '#D7C3B0',
    },

    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 15,
    },

    caja: {
        backgroundColor: '#FFFCF8',
        width: '100%',
        maxWidth: 520,
        borderRadius: 28,
        overflow: 'hidden',

        elevation: 8,
        shadowColor: '#58391b',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },

    // ENCABEZADO

    encabezado: {
        backgroundColor: '#58391b',
        width: '100%',
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 32,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    iconoPerfil: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#945c35',
        borderWidth: 3,
        borderColor: '#e0b188',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 17,
    },

    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFF9F2',
        letterSpacing: 0.5,
    },

    subtitulo: {
        fontSize: 13,
        color: '#E8D8C9',
        marginTop: 5,
        letterSpacing: 1,
    },

    seccionUsuario: {
        width: '100%',
        paddingHorizontal: 22,
        marginTop: 27,
    },

    encabezadoSeccion: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconoSeccion: {
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: '#F5EBDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    tituloSeccion: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#382218',
        flexShrink: 1,
    },

    // USUARIO

    tarjetaUsuario: {
        backgroundColor: '#F9F4EE',
        borderRadius: 17,
        padding: 16,
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8DCCF',
    },

    iconoUsuario: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: '#EFE3D5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
    },

    datosUsuario: {
        flex: 1,
    },

    etiqueta: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#8C6239',
        letterSpacing: 1.8,
        marginBottom: 5,
    },

    textUsuario: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#382218',
    },

    // ACTIVIDADES

    actividades: {
        width: '100%',
        paddingHorizontal: 22,
        marginTop: 30,
    },

    encabezadoActividades: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    etiquetaReciente: {
        backgroundColor: '#F5EBDD',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },

    textoReciente: {
        color: '#5C3A21',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.7,
    },

    descripcionActividades: {
        fontSize: 12,
        color: '#8C6239',
        marginTop: 7,
        marginBottom: 16,
    },

    tarjetaActividad: {
        backgroundColor: '#FFFCF8',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#EFE3D5',

        elevation: 2,
        shadowColor: '#382218',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },

    iconoActividad: {
        width: 43,
        height: 43,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    contenidoActividad: {
        flex: 1,
        paddingTop: 2,
    },

    nombreProducto: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#382218',
        lineHeight: 21,
    },

    detalleCompra: {
        fontSize: 12,
        color: '#5C3A21',
        marginTop: 5,
    },

    filaFecha: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 9,
    },

    fechaCompra: {
        fontSize: 11,
        color: '#8C6239',
        marginLeft: 6,
    },

    // SIN ACTIVIDADES

    sinActividades: {
        backgroundColor: '#F5EBDD',
        borderRadius: 17,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8DCCF',
        borderStyle: 'dashed',
    },

    iconoSinActividad: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: '#EFE3D5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    textoSinActividad: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#382218',
    },

    detalleSinActividad: {
        fontSize: 12,
        color: '#8C6239',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },

    // PIE DE PERFIL

    pie: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingBottom: 27,
        marginTop: 10,
    },

    linea: {
        width: '100%',
        height: 1,
        backgroundColor: '#E8DCCF',
        marginBottom: 20,
    },

    textoPie: {
        fontSize: 12,
        color: '#8C6239',
        marginBottom: 13,
    },

    // BOTÓN PRINCIPAL

    boton: {
        backgroundColor: '#58391b',
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,

        elevation: 3,
        shadowColor: '#382218',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
    },

    textoBoton: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },

    version: {
        fontSize: 9,
        color: '#A4774F',
        fontWeight: 'bold',
        letterSpacing: 2,
        marginTop: 19,
    },

});
