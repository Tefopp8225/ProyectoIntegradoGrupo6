import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '../firebase/FirebaseConfig';

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
        <ScrollView contentContainerStyle={styles.container}>
            {/* Parte de Arriba - Datos Personales (Intacta) */}
            <View style={styles.card}>
                <Text style={styles.title}>Bienvenido</Text>

                <Text style={styles.label}>Nombre:</Text>
                <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />

                <Text style={styles.label}>Apellido:</Text>
                <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholder="Tu apellido" />

                <Text style={styles.label}>Edad:</Text>
                <TextInput style={styles.input} value={edad} onChangeText={setEdad} keyboardType="numeric" placeholder="Tu edad" />

                <TouchableOpacity style={styles.boton} onPress={guardarDatos} disabled={cargando}>
                    <Text style={styles.textoBoton}>{cargando ? "Guardando..." : "Guardar Datos"}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Perfil')} style={{marginTop: 10}}>
                    <Text style={{color: '#8D6E63', fontWeight: 'bold'}}>Ver mi Perfil y Asistencia</Text>
                </TouchableOpacity>
            </View>

            {/* Apartado de Reportes con nuevo diseño y más opciones */}
            <View style={styles.card}>
                <Text style={styles.title}>Reportes al Administrador</Text>
                <Text style={styles.subtitle}>Selecciona el problema detectado en el invernadero:</Text>

                {/* Nuevas opciones de problemas */}
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
                            <Text style={[styles.textoOp, tipo === op && {color: '#fff', fontWeight: 'bold'}]}>{op}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput 
                    style={[styles.input, {height: 70, textAlignVertical: 'top'}]} 
                    value={descripcion} 
                    onChangeText={setDescripcion} 
                    placeholder="Descripción breve de lo sucedido..." 
                    multiline={true}
                />

                <TouchableOpacity style={styles.boton} onPress={enviarReporte}>
                    <Text style={styles.textoBoton}>Enviar Reporte</Text>
                </TouchableOpacity>

                <Text style={[styles.label, {marginTop: 25}]}>Historial de Mis Reportes:</Text>
                
                {misReportes.length === 0 ? (
                    <Text style={styles.gris}>Aún no has enviado reportes.</Text>
                ) : (
                    misReportes.map(r => (
                        <View key={r.id} style={styles.itemReporte}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                                <Text style={styles.textoNegrita}>{r.tipo}</Text>
                                <Text style={{color: r.estado === 'Visto' ? '#2e7d32' : '#d97706', fontWeight: 'bold'}}>
                                    {r.estado}
                                </Text>
                            </View>
                            <Text style={styles.textoGeneral}>{r.descripcion || "Sin descripción"}</Text>
                            <Text style={styles.fecha}>{r.fecha}</Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#F5EBE0', padding: 20, paddingTop: 50, alignItems: 'center' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, width: '100%', maxWidth: 400, marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: '#EFEBE9' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6, textAlign: 'center', color: '#4A3328' },
    subtitle: { fontSize: 13, color: '#8D6E63', marginBottom: 12, textAlign: 'center' },
    label: { fontSize: 13, fontWeight: 'bold', marginBottom: 4, color: '#4A3328' },
    input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#D7CCC8', borderRadius: 6, padding: 10, marginBottom: 10, fontSize: 14 },
    boton: { backgroundColor: '#4A3328', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 5 },
    textoBoton: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    filaBotones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
    opcionBtn: { width: '48%', padding: 10, borderWidth: 1, borderColor: '#D7CCC8', borderRadius: 6, marginBottom: 8, alignItems: 'center', backgroundColor: '#FAFAFA' },
    opcionSeleccionada: { backgroundColor: '#4A3328', borderColor: '#4A3328' },
    textoOp: { fontSize: 12, color: '#5D4037', textAlign: 'center' },
    itemReporte: { backgroundColor: '#FAFAFA', padding: 12, borderRadius: 6, marginTop: 8, borderWidth: 1, borderColor: '#EFEBE9' },
    textoNegrita: { fontWeight: 'bold', fontSize: 14, color: '#4A3328' },
    textoGeneral: { fontSize: 13, color: '#5D4037' },
    gris: { color: '#8D6E63', fontSize: 13, fontStyle: 'italic', marginTop: 4 },
    fecha: { fontSize: 11, color: '#A1887F', marginTop: 4, textAlign: 'right' }
});