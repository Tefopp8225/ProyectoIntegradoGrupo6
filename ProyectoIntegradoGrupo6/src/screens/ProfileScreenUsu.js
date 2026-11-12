import React, { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar
} from 'react-native';

import {
    initializeApp,
    getApps
} from 'firebase/app';

import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';

import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '../firebase/FirebaseConfig';

const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

const db = getFirestore(app);

export default function ProfileScreen({ navigation }) {

    const [datosUsuario, setDatosUsuario] = useState({
        nombre: '',
        apellido: '',
        edad: '',
        email: '',
        estado: 'Ausente'
    });

    useEffect(() => {

        const auth = getAuth(app);
        const user = auth.currentUser;

        if (!user) return;

        // Escuchar cambios del perfil en tiempo real
        const q = query(
            collection(db, "users"),
            where("email", "==", user.email)
        );

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {

                if (!querySnapshot.empty) {

                    const userDoc = querySnapshot.docs[0];
                    const data = userDoc.data();

                    setDatosUsuario({
                        nombre: data.nombre || 'No asignado',
                        apellido: data.apellido || 'No asignado',
                        edad: data.edad || 'No especificada',
                        email: data.email || user.email,
                        estado: data.estado || 'Ausente'
                    });
                }
            },
            (error) => {
                console.error("Error al escuchar perfil:", error);
            }
        );

        return () => unsubscribe();

    }, []);

    const estaPresente = datosUsuario.estado === 'Presente';

    // Colores según asistencia (Verde más vivo y brillante)
    const colorEstado = estaPresente ? '#2E7D32' : '#C16C52';
    const fondoEstado = estaPresente ? '#E8F5E9' : '#F8E9E3';

    // Cerrar sesión
    const cerrarSesion = async () => {
        try {
            const auth = getAuth(app);
            await auth.signOut();
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // Tarjeta de información compacta
    const InfoItem = ({ icono, etiqueta, valor }) => (

        <View style={styles.infoItem}>

            <View style={styles.iconoInfo}>
                <FontAwesome
                    name={icono}
                    size={16}
                    color="#2E7D32"
                />
            </View>

            <View style={styles.contenidoInfo}>

                <Text style={styles.labelInfo}>
                    {etiqueta}
                </Text>

                <Text style={styles.valorInfo}>
                    {valor}
                </Text>

            </View>

        </View>
    );

    return (

        <View style={styles.container}>
            {/* Barra de estado con estilo limpio y combinando con el encabezado */}
            <StatusBar barStyle="light-content" backgroundColor="#382218" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.caja}>

                    {/* ENCABEZADO */}

                    <View style={styles.encabezado}>

                        <View style={styles.iconoPerfil}>

                            <FontAwesome
                                name="user"
                                size={44}
                                color="#FFF9F2"
                            />

                        </View>

                        <Text style={styles.title}>
                            Mi Perfil
                        </Text>

                        <Text style={styles.subtitulo}>
                            Información personal
                        </Text>

                        <View style={styles.separadorDecorativo} />

                    </View>

                    {/* CONTENEDOR PRINCIPAL UNIFICADO */}
                    <View style={styles.cuerpoPrincipal}>

                        {/* ESTADO DE ASISTENCIA */}

                        <View style={styles.seccion}>

                            <View style={styles.encabezadoSeccion}>

                                <View style={styles.iconoSeccion}>
                                    <FontAwesome
                                        name="calendar-check-o"
                                        size={15}
                                        color="#382218"
                                    />
                                </View>

                                <Text style={styles.tituloSeccion}>
                                    Estado de asistencia
                                </Text>

                            </View>

                            <View
                                style={[
                                    styles.tarjetaEstado,
                                    { backgroundColor: fondoEstado }
                                ]}
                            >

                                <View
                                    style={[
                                        styles.iconoEstado,
                                        { backgroundColor: colorEstado }
                                    ]}
                                >

                                    <FontAwesome
                                        name={estaPresente ? 'check' : 'clock-o'}
                                        size={20}
                                        color="#FFFFFF"
                                    />

                                </View>

                                <View style={styles.contenidoEstado}>

                                    <Text style={styles.etiquetaEstado}>
                                        ESTADO ACTUAL
                                    </Text>

                                    <Text
                                        style={[
                                            styles.valorEstado,
                                            { color: colorEstado }
                                        ]}
                                    >
                                        {datosUsuario.estado}
                                    </Text>

                                </View>

                                <View
                                    style={[
                                        styles.indicadorEstado,
                                        { backgroundColor: colorEstado }
                                    ]}
                                />

                            </View>

                        </View>

                        {/* INFORMACIÓN PERSONAL */}

                        <View style={styles.seccion}>

                            <View style={styles.encabezadoSeccion}>

                                <View style={styles.iconoSeccion}>
                                    <FontAwesome
                                        name="user-circle"
                                        size={15}
                                        color="#382218"
                                    />
                                </View>

                                <Text style={styles.tituloSeccion}>
                                    Información personal
                                </Text>

                            </View>

                            {estaPresente ? (

                                <View style={styles.infoContainer}>

                                    <InfoItem
                                        icono="user"
                                        etiqueta="NOMBRE"
                                        valor={datosUsuario.nombre}
                                    />

                                    <View style={styles.divisorInfo} />

                                    <InfoItem
                                        icono="id-card-o"
                                        etiqueta="APELLIDO"
                                        valor={datosUsuario.apellido}
                                    />

                                    <View style={styles.divisorInfo} />

                                    <InfoItem
                                        icono="calendar"
                                        etiqueta="EDAD"
                                        valor={String(datosUsuario.edad)}
                                    />

                                    <View style={styles.divisorInfo} />

                                    <InfoItem
                                        icono="envelope-o"
                                        etiqueta="CORREO ELECTRÓNICO"
                                        valor={datosUsuario.email}
                                    />

                                </View>

                            ) : (

                                <View style={styles.alertaContainer}>

                                    <View style={styles.iconoAlerta}>

                                        <FontAwesome
                                            name="lock"
                                            size={26}
                                            color="#C16C52"
                                        />

                                    </View>

                                    <Text style={styles.tituloAlerta}>
                                        Información restringida
                                    </Text>

                                    <Text style={styles.alertaTexto}>
                                        Tus datos y perfil completo estarán disponibles una vez que el administrador registre tu asistencia como:
                                    </Text>

                                    <View style={styles.estadoRequerido}>

                                        <FontAwesome
                                            name="check-circle"
                                            size={15}
                                            color="#2E7D32"
                                        />

                                        <Text style={styles.textoRequerido}>
                                            Presente
                                        </Text>

                                    </View>

                                    <Text style={styles.notaAlerta}>
                                        Cuando tu asistencia sea actualizada, podrás consultar tu información personal.
                                    </Text>

                                </View>

                            )}

                        </View>

                    </View>

                    {/* PIE Y CIERRE DE SESIÓN */}

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
                                size={17}
                                color="#FFFFFF"
                            />

                            <Text style={styles.textoBoton}>
                                Cerrar sesión
                            </Text>

                            <FontAwesome
                                name="arrow-right"
                                size={13}
                                color="#E8D8C9"
                            />

                        </TouchableOpacity>

                        <Text style={styles.version}>
                            PERFIL DE USUARIO
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
        backgroundColor: '#E8E1D9',
    },

    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
    },

    caja: {
        backgroundColor: '#FFFCF8',
        width: '100%',
        maxWidth: '92%',
        borderRadius: 24,
        overflow: 'hidden',
        marginTop:'15%',
        elevation: 6,
        shadowColor: '#382218',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
    },

    // ENCABEZADO

    encabezado: {
        backgroundColor: '#58391b',
        width: '100%',
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 26,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
    },

    iconoPerfil: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#926545',
        borderWidth: 3,
        borderColor: '#dbae86',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },

    title: {
        fontSize: 27,
        fontWeight: 'bold',
        color: '#FFF9F2',
        letterSpacing: 0.5,
    },

    subtitulo: {
        fontSize: 12,
        color: '#E8D8C9',
        marginTop: 4,
        letterSpacing: 1,
    },


    cuerpoPrincipal: {
        paddingHorizontal: 18,
        gap: 16,
        marginTop: 18,
    },

    seccion: {
        width: '100%',
    },

    encabezadoSeccion: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    iconoSeccion: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: '#F5EBDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 9,
    },

    tituloSeccion: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#382218',
        flexShrink: 1,
    },

    // ESTADO DE ASISTENCIA

    tarjetaEstado: {
        borderRadius: 15,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D4E2D4',
    },

    iconoEstado: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    contenidoEstado: {
        flex: 1,
    },

    etiquetaEstado: {
        fontSize: 9.5,
        fontWeight: 'bold',
        color: '#5C765D',
        letterSpacing: 1.2,
        marginBottom: 3,
    },

    valorEstado: {
        fontSize: 17,
        fontWeight: 'bold',
    },

    indicadorEstado: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    // INFORMACIÓN PERSONAL

    infoContainer: {
        width: '100%',
        backgroundColor: '#FFFCF8',
        borderRadius: 15,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#D4E2D4',
        elevation: 1,
    },

    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
    },

    iconoInfo: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    contenidoInfo: {
        flex: 1,
    },

    labelInfo: {
        fontSize: 9.5,
        fontWeight: 'bold',
        color: '#8C6239',
        letterSpacing: 1,
        marginBottom: 3,
    },

    valorInfo: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#382218',
    },

    divisorInfo: {
        height: 1,
        backgroundColor: '#E2EFE2',
        marginLeft: 48,
    },

    // AVISO DE ACCESO RESTRINGIDO

    alertaContainer: {
        width: '100%',
        backgroundColor: '#FAF0EC',
        borderRadius: 15,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EBD2C9',
    },

    iconoAlerta: {
        width: 55,
        height: 55,
        borderRadius: 16,
        backgroundColor: '#F5DED5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },

    tituloAlerta: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#804B3E',
        marginBottom: 6,
    },

    alertaTexto: {
        fontSize: 12,
        color: '#875C50',
        textAlign: 'center',
        lineHeight: 18,
    },

    estadoRequerido: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 12,
        gap: 7,
    },

    textoRequerido: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2E7D32',
    },

    notaAlerta: {
        fontSize: 10.5,
        color: '#A17C70',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 16,
    },

    // PIE

    pie: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingBottom: 22,
        marginTop: 22,
    },

    linea: {
        width: '100%',
        height: 1,
        backgroundColor: '#E8DCCF',
        marginBottom: 16,
    },

    textoPie: {
        fontSize: 11,
        color: '#8C6239',
        marginBottom: 10,
    },

    boton: {
        backgroundColor: '#382218',
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,

        elevation: 2,
        shadowColor: '#382218',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },

    textoBoton: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },

    version: {
        fontSize: 8.5,
        color: '#A4774F',
        fontWeight: 'bold',
        letterSpacing: 2,
        marginTop: 16,
    },

});