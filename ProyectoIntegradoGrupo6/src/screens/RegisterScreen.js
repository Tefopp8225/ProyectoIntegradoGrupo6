import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ImageBackground } from 'react-native'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase/FirebaseConfig';
import { useState } from 'react'
import Feather1 from '@expo/vector-icons/Feather';
import Feather2 from '@expo/vector-icons/Feather';

// 1. Importa tu imagen desde la carpeta src/img
const backgroundImage = require('../img/imgLogin.png');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const Registro = () => {
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                const db = getFirestore(app);

                const rolAsignado = email.includes("admin")? "admin": "user";

                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    role: rolAsignado
                });

                alert('Usuario creado con rol: '+ rolAsignado);
                navigation.navigate('Login');
            })
            .catch(error => {
                alert(error)
            })
    }

    return (
        // 2. Envolvemos todo en ImageBackground para que ocupe la pantalla completa
        <ImageBackground source={backgroundImage} style={styles.background}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Crear una cuenta</Text>
                    <Text style={styles.subtitle}>Únete a nosotros</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder='Correo electrónico'
                            placeholderTextColor="#999"
                            keyboardType='email-address'
                            autoCapitalize='none'
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Text style={{ paddingLeft: 15, paddingVertical: 12 }}>
                                {showPassword
                                    ? <Feather2 name="eye" size={21} color="black" />    
                                    : <Feather1 name="eye-off" size={21} color="black" /> 
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.registerButton} onPress={Registro}>
                        <Text style={styles.registerButtonText}>Registrarse</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLinkText}>¿Ya tienes cuenta? Inicia Sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    // 3. Estilo para estirar la imagen de fondo en toda la pantalla
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        padding: 20,
        backgroundColor: 'white', // Fondo blanco para que el formulario resalte sobre el invernadero
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666666',
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ddb37cce',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#f8f8f8',
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    registerButton: {
        backgroundColor: '#693c12',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginLink: {
        alignItems: 'center',
    },
    loginLinkText: {
        color: '#497922',
        fontSize: 14,
    },
});