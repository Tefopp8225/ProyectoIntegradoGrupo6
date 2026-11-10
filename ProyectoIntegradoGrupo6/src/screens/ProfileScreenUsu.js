import React, { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { View, Text, StyleSheet, Button } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '../firebase/FirebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
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

        // Escucha en tiempo real los cambios en su documento
        const q = query(collection(db, "users"), where("email", "==", user.email));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
        }, (error) => {
            console.error("Error al escuchar perfil:", error);
        });

        return () => unsubscribe();
    }, []);

    const estaPresente = datosUsuario.estado === 'Presente';

    return (
        <View style={styles.container}>
            <View style={styles.caja}> 
                <Text style={styles.title}>Mi Perfil</Text>
                <FontAwesome name="user-circle-o" size={85} color="#4A3328" style={{ marginBottom: 15 }} />
                
                {/* CONDICIÓN: Solo muestra los datos si el admin lo marcó como Presente */}
                {estaPresente ? (
                    <View style={styles.infoContainer}>
                        <Text style={styles.labelInfo}>Nombre:</Text>
                        <Text style={styles.valorInfo}>{datosUsuario.nombre}</Text>

                        <Text style={styles.labelInfo}>Apellido:</Text>
                        <Text style={styles.valorInfo}>{datosUsuario.apellido}</Text>

                        <Text style={styles.labelInfo}>Edad:</Text>
                        <Text style={styles.valorInfo}>{datosUsuario.edad}</Text>

                        <Text style={styles.labelInfo}>Correo:</Text>
                        <Text style={styles.valorInfo}>{datosUsuario.email}</Text>
                    </View>
                ) : (
                    <View style={styles.alertaContainer}>
                        <FontAwesome name="lock" size={30} color="#c62828" style={{ marginBottom: 10 }} />
                        <Text style={styles.alertaTexto}>
                            Tus datos y perfil completo estarán disponibles una vez que el administrador registre tu asistencia como <Text style={{fontWeight: 'bold', color: '#2e7d32'}}>Presente</Text>.
                        </Text>
                    </View>
                )}

                {/* Insignia de estado sincronizada */}
                <View style={[styles.badgeEstado, { backgroundColor: estaPresente ? '#2e7d32' : '#c62828' }]}>
                    <Text style={styles.textoEstado}>Estado de Asistencia: {datosUsuario.estado}</Text>
                </View>

                <View style={{ width: '100%', marginTop: 10 }}>
                    <Button 
                        title="Cerrar sesión"
                        color="#4A3328"
                        onPress={() => navigation.navigate('Login')}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E1D4C6',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    caja: {
        backgroundColor: '#ffffff',
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    infoContainer: {
        width: '100%',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    alertaContainer: {
        width: '100%',
        backgroundColor: '#fdf2f2',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f5c6cb',
        alignItems: 'center',
    },
    alertaTexto: {
        fontSize: 14,
        color: '#721c24',
        textAlign: 'center',
        lineHeight: 20,
    },
    labelInfo: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#777',
        marginTop: 5,
    },
    valorInfo: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    badgeEstado: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 20,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    textoEstado: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    }
});