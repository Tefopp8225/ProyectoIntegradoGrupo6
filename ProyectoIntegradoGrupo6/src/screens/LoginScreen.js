import {View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ImageBackground} from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/FirebaseConfig';
import { initializeApp } from 'firebase/app';
import { useState } from 'react';
import Feather1 from '@expo/vector-icons/Feather';
import Feather2 from '@expo/vector-icons/Feather';

// 1. Importa tu imagen desde la carpeta src/img
const backgroundImage = require('../img/imgLogin.png');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function LoginScreen ({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async(userCredential) => {
        const user = userCredential.user;
        const db = getFirestore(app);

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if(userDocSnap.exists()){
            const userData = userDocSnap.data();
            const role = userData.role;

            if(role === 'admin'){
                navigation.navigate('Admin-Home');
            }
            else if(role === 'user'){
                navigation.navigate('Usuario-Home');
            }
        }
        else{
            alert("No se encontro en la base de datos");
        }
      })
      .catch(error => {
        alert(error);
      });
  };

  return (
    // 2. Usamos ImageBackground cubriendo toda el área y con el ScrollView dentro
    <ImageBackground source={backgroundImage} style={styles.background}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>Bienvenido de nuevo</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
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
              <Text style={{paddingLeft: 15, paddingVertical: 12}}>
                {showPassword 
                  ? <Feather2 name="eye" size={21} color="black" />    
                  : <Feather1 name="eye-off" size={21} color="black" /> 
                }
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLinkText}>
              ¿No tienes cuenta? Regístrate
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  // 3. Estilo necesario para que la imagen abarque toda la pantalla
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    // Opcional: si quieres que el fondo se oscurezca un poco para que resalte el formulario, puedes agregar un backgroundColor con opacidad aquí si lo deseas.
  },
  formContainer: {
    padding: 20,
    backgroundColor: 'white', // Fondo blanco semi-opaco o sólido para el formulario
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
    color: '#666',
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
  loginButton: {
    backgroundColor: '#693c12',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#497922',
    fontSize: 14,
  },
});