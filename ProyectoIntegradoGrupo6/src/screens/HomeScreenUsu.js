import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '../firebase/FirebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default function UsuarioHome({ navigation }) {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [edad, setEdad] = useState('');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const auth = getAuth(app);
        const user = auth.currentUser;
        
        if (user) {
            const cargarDatos = async () => {
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setNombre(data.nombre || '');
                        setApellido(data.apellido || '');
                        setEdad(data.edad ? String(data.edad) : '');
                    }
                } catch (error) {
                    console.error("Error al cargar datos:", error);
                }
            };
            cargarDatos();
        }
    }, []);

    const guardarDatos = async () => {
        const auth = getAuth(app);
        const user = auth.currentUser;

        if (!user) return;

        // Validamos campos vacíos
        if (!nombre.trim() || !apellido.trim() || !edad.trim()) {
            Alert.alert("Atención", "Por favor completa todos los campos.");
            return;
        }

        // VALIDACIÓN DE EDAD MAYOR A 18
        const edadNum = parseInt(edad, 10);
        if (isNaN(edadNum) || edadNum < 18) {
            Alert.alert("Restricción de Edad", "Debes ser mayor para enviar tu información.");
            return;
        }

        setCargando(true);
        try {
            const usuarioRef = doc(db, "users", user.uid);
            await setDoc(usuarioRef, {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                edad: edadNum,
                email: user.email,
                datosEnviados: true,
                role: 'user',
            }, { merge: true });

            Alert.alert("¡Éxito!", "Tus datos han sido guardados correctamente.");
        } catch (error) {
            console.error("Error al guardar:", error);
            Alert.alert("Error", "No se pudieron guardar los datos.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
                <Text style={styles.title}>Bienvenido</Text>
                <Text style={styles.subtitle}>Completa tus datos personales (Mayores de 18 años)</Text>

                <Text style={styles.label}>Nombre:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe tu nombre"
                    value={nombre}
                    onChangeText={setNombre}
                />

                <Text style={styles.label}>Apellido:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe tu apellido"
                    value={apellido}
                    onChangeText={setApellido}
                />

                <Text style={styles.label}>Edad (Mayor a 18):</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe tu edad"
                    value={edad}
                    onChangeText={setEdad}
                    keyboardType="numeric"
                />

                <TouchableOpacity 
                    style={styles.botonGuardar} 
                    onPress={guardarDatos}
                    disabled={cargando}
                >
                    <Text style={styles.textoBoton}>{cargando ? "Guardando..." : "Guardar Datos"}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.botonPerfil} 
                    onPress={() => navigation.navigate('Perfil')} // Ajustado al nombre usual de la pantalla
                >
                    <Text style={styles.textoBotonPerfil}>Ver mi Perfil y Estado de Asistencia</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: '#E1D4C6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        elevation: 3,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        alignSelf: 'flex-start',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 5,
    },
    input: {
        width: '100%',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        marginBottom: 12,
    },
    botonGuardar: {
        backgroundColor: '#4A3328',
        width: '100%',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    textoBoton: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    botonPerfil: {
        marginTop: 15,
        padding: 10,
    },
    textoBotonPerfil: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: 'bold',
    }
});