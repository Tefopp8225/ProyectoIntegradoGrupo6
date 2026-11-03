
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProfileScreen({ navigation }) {

    const [email, setEmail] = useState('');

    useEffect(() => {
        const auth = getAuth();

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setEmail(user.email.split('@')[0]);
            }
        });

        return unsubscribe;
    }, []);

    const cerrarSesion = async () => {
        const auth = getAuth();
        await signOut(auth);
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>

            <View style={styles.caja}>

                <Text style={styles.title}>Mi Perfil</Text>

                <View style={styles.circulo}>
                    <FontAwesome name="user-circle-o" size={90} color="black" />
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
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        backgroundColor: '#E1D4C6',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
