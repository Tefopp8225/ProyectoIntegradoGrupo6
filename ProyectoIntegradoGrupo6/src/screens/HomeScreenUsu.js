import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, StatusBar } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '../firebase/FirebaseConfig';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default function UsuarioHome({ navigation }) {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [edad, setEdad] = useState('');
    const [cargando, setCargando] = useState(false);

    // Estados para los reportes
    const [tipo, setTipo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [misReportes, setMisReportes] = useState([]);

    useEffect(() => {
        const auth = getAuth(app);
        const user = auth.currentUser;
        if (!user) return;

        // Cargar datos personales (NO SE TOCA)
        getDoc(doc(db, "users", user.uid)).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setNombre(data.nombre || '');
                setApellido(data.apellido || '');
                setEdad(data.edad ? String(data.edad) : '');
            }
        });

        // Escuchar reportes del usuario
        const q = query(collection(db, "reportes"), where("emailTrabajador", "==", user.email));
        return onSnapshot(q, (snapshot) => {
            const lista = [];
            snapshot.forEach(d => lista.push({ id: d.id, ...d.data() }));
            setMisReportes(lista);
        });
    }, []);

    const guardarDatos = async () => {
        const user = getAuth(app).currentUser;
        if (!user || !nombre.trim() || !apellido.trim() || !edad.trim()) {
            Alert.alert("Atención", "Completa todos los campos.");
            return;
        }
        if (parseInt(edad, 10) < 18) {
            Alert.alert("Atención", "Debes ser mayor de edad.");
            return;
        }

        setCargando(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                nombre: nombre.trim(), apellido: apellido.trim(), edad: parseInt(edad, 10),
                email: user.email, datosEnviados: true, role: 'user'
            }, { merge: true });
            Alert.alert("¡Éxito!", "Datos guardados.");
        } catch (e) {
            Alert.alert("Error", "No se pudo guardar.");
        } finally {
            setCargando(false);
        }
    };

    const enviarReporte = async () => {
        const user = getAuth(app).currentUser;
        if (!user || !tipo) {
            Alert.alert("Atención", "Selecciona el tipo de reporte.");
            return;
        }

        try {
            await addDoc(collection(db, "reportes"), {
                nombreTrabajador: `${nombre} ${apellido}`.trim() || user.email,
                emailTrabajador: user.email,
                tipo: tipo,
                descripcion: descripcion.trim(),
                estado: "Pendiente",
                fecha: new Date().toLocaleDateString()
            });
            Alert.alert("Enviado", "Reporte enviado al administrador.");
            setTipo('');
            setDescripcion('');
        } catch (e) {
            Alert.alert("Error", "No se pudo enviar el reporte.");
        }
    };

    return (
        <View style={styles.container}>
            {/* Barra de estado con el tono café */}
            <StatusBar barStyle="light-content" backgroundColor="#58391b" />

            <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
                
                {/* ENCABEZADO SIN ICONO DE HOJA */}
                <View style={styles.encabezado}>
                    <Text style={styles.tituloHeader}>Marcar reporte y asistencia</Text>
                    <Text style={styles.subtituloHeader}>Gestión y control del invernadero</Text>
                </View>

                {/* TARJETA 1: DATOS PERSONALES */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderTitle}>
                        <FontAwesome name="user" size={16} color="#58391b" />
                        <Text style={styles.title}>Información Personal</Text>
                    </View>
                    <View style={styles.lineaDecorativa} />

                    <Text style={styles.label}>Nombre:</Text>
                    <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor="#8C7355" />

                    <Text style={styles.label}>Apellido:</Text>
                    <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholder="Tu apellido" placeholderTextColor="#8C7355" />

                    <Text style={styles.label}>Edad:</Text>
                    <TextInput style={styles.input} value={edad} onChangeText={setEdad} keyboardType="numeric" placeholder="Tu edad" placeholderTextColor="#8C7355" />

                    <TouchableOpacity style={styles.boton} onPress={guardarDatos} disabled={cargando}>
                        <FontAwesome name="save" size={14} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.textoBoton}>{cargando ? "Guardando..." : "Guardar Datos"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Perfil')} style={styles.enlacePerfilContainer}>
                        <FontAwesome name="calendar-check-o" size={14} color="#58391b" />
                        <Text style={styles.textoEnlacePerfil}>Ver mi Perfil y Asistencia</Text>
                    </TouchableOpacity>
                </View>

                {/* TARJETA 2: REPORTES AL ADMINISTRADOR */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderTitle}>
                        <FontAwesome name="exclamation-circle" size={16} color="#58391b" />
                        <Text style={styles.title}>Reportes al Administrador</Text>
                    </View>
                    <View style={styles.lineaDecorativa} />
                    
                    <Text style={styles.subtitle}>Selecciona el tipo de incidencia detectada:</Text>

                    {/* Opciones de problemas en cuadrícula */}
                    <View style={styles.filaBotones}>
                        {[
                            "Falta de material", 
                            "Problema en plantas", 
                            "Posible plaga", 
                            "Exceso de humedad", 
                            "Temperatura alta", 
                            "Falta de riego"
                        ].map((op) => (
                            <TouchableOpacity 
                                key={op} 
                                style={[styles.opcionBtn, tipo === op && styles.opcionSeleccionada]} 
                                onPress={() => setTipo(op)}
                            >
                                <Text style={[styles.textoOp, tipo === op && styles.textoOpSeleccionado]}>{op}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput 
                        style={[styles.input, {height: 75, textAlignVertical: 'top'}]} 
                        value={descripcion} 
                        onChangeText={setDescripcion} 
                        placeholder="Escribe una descripción breve de lo sucedido..." 
                        placeholderTextColor="#8C7355"
                        multiline={true}
                    />

                    <TouchableOpacity style={styles.boton} onPress={enviarReporte}>
                        <FontAwesome name="send" size={14} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.textoBoton}>Enviar Reporte</Text>
                    </TouchableOpacity>

                    <Text style={[styles.label, {marginTop: 22, color: '#58391b'}]}>Historial de Mis Reportes:</Text>
                    <View style={[styles.lineaDecorativa, {backgroundColor: '#D7CCC8'}]} />
                    
                    {misReportes.length === 0 ? (
                        <Text style={styles.gris}>Aún no has enviado reportes al sistema.</Text>
                    ) : (
                        misReportes.map(r => (
                            <View key={r.id} style={styles.itemReporte}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                                    <Text style={styles.textoNegrita}>{r.tipo}</Text>
                                    <View style={[styles.badgeEstado, { backgroundColor: r.estado === 'Visto' ? '#E8F5E9' : '#FFF8E1', borderColor: r.estado === 'Visto' ? '#4CAF50' : '#FFB300' }]}>
                                        <Text style={{color: r.estado === 'Visto' ? '#2E7D32' : '#F57F17', fontWeight: 'bold', fontSize: 10}}>
                                            {r.estado}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.textoGeneral}>{r.descripcion || "Sin descripción"}</Text>
                                <Text style={styles.fecha}>{r.fecha}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flexGrow: 1, 
        backgroundColor: '#E8E1D9', 
    },
    contenido: {
        paddingBottom: 30,
        width: '100%',
        maxWidth: '91%',
        alignSelf: 'center',
    },
    encabezado: {
        backgroundColor: '#58391b',
        paddingHorizontal: 22,
        paddingVertical: 18,
        borderRadius: 16,
        elevation: 5,
        shadowColor: '#58391b',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        marginHorizontal: 16,
        marginTop: 35,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#7a4f27',
    },
    tituloHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF9F2',
    },
    subtituloHeader: {
        fontSize: 11.5,
        color: '#E8D8C9',
        marginTop: 2,
    },
    card: { 
        backgroundColor: '#FFFCF8', 
        borderRadius: 16, 
        padding: 20, 
        width: '93%', 
        alignSelf: 'center',
        maxWidth: '92%', 
        marginBottom: 16, 
        elevation: 3, 
        borderWidth: 1, 
        borderColor: '#D7CCC8', 
        shadowColor: '#58391b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    cardHeaderTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    lineaDecorativa: {
        height: 2,
        backgroundColor: '#EFEBE9',
        width: '100%',
        marginBottom: 14,
        borderRadius: 2,
    },
    title: { 
        fontSize: 17, 
        fontWeight: 'bold', 
        color: '#58391b' 
    },
    subtitle: { 
        fontSize: 12.5, 
        color: '#8D6E63', 
        marginBottom: 12, 
    },
    label: { 
        fontSize: 13, 
        fontWeight: 'bold', 
        marginBottom: 4, 
        color: '#58391b' 
    },
    input: { 
        backgroundColor: '#FFFFFF', 
        borderWidth: 1, 
        borderColor: '#D7CCC8', 
        borderRadius: 10, 
        paddingHorizontal: 12,
        paddingVertical: 11, 
        marginBottom: 12, 
        fontSize: 14,
        color: '#58391b'
    },
    boton: { 
        flexDirection: 'row',
        backgroundColor: '#58391b', // Todos los botones unificados en café
        padding: 13, 
        borderRadius: 10, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: 6,
        elevation: 2,
    },
    textoBoton: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 14 
    },
    enlacePerfilContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        gap: 8,
        paddingVertical: 4,
    },
    textoEnlacePerfil: {
        color: '#58391b', 
        fontWeight: 'bold',
        fontSize: 13,
    },
    filaBotones: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        marginBottom: 10 
    },
    opcionBtn: { 
        width: '48%', 
        paddingVertical: 11,
        paddingHorizontal: 8, 
        borderWidth: 1, 
        borderColor: '#D7CCC8', 
        borderRadius: 10, 
        marginBottom: 8, 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF' 
    },
    opcionSeleccionada: { 
        backgroundColor: '#58391b', // Opción seleccionada en café
        borderColor: '#58391b' 
    },
    textoOp: { 
        fontSize: 12, 
        color: '#5D4037', 
        textAlign: 'center',
        fontWeight: '600'
    },
    textoOpSeleccionado: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    itemReporte: { 
        backgroundColor: '#FFFFFF', 
        padding: 14, 
        borderRadius: 10, 
        marginTop: 10, 
        borderWidth: 1, 
        borderColor: '#D7CCC8' 
    },
    badgeEstado: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textoNegrita: { 
        fontWeight: 'bold', 
        fontSize: 13.5, 
        color: '#58391b' 
    },
    textoGeneral: { 
        fontSize: 13, 
        color: '#5D4037',
        marginTop: 2
    },
    gris: { 
        color: '#8D6E63', 
        fontSize: 12.5, 
        fontStyle: 'italic', 
        marginTop: 6 
    },
    fecha: { 
        fontSize: 10.5, 
        color: '#A1887F', 
        marginTop: 6, 
        textAlign: 'right' 
    }
});