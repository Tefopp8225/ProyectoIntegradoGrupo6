import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/FirebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default function HomeScreenAdmin() {
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [estado, setEstado] = useState('Presente');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const obtenerUsuarios = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                let lista = [];
                
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.role !== 'admin') {
                        lista.push({ id: docSnap.id, ...data });
                    }
                });

                setUsuarios(lista);
            } catch (error) {
                console.error("Error al obtener usuarios: ", error);
            }
        };

        obtenerUsuarios();
    }, []);

    const registrarAsistencia = async () => {
        if (!usuarioSeleccionado) {
            Alert.alert("Atención", "Por favor selecciona un usuario de la lista.");
            return;
        }

        const yaEnvioDatos = usuarioSeleccionado.nombre && usuarioSeleccionado.apellido;
        if (estado === 'Presente' && !yaEnvioDatos) {
            Alert.alert(
                "No se puede marcar presente", 
                "Este usuario aún no ha llenado sus datos personales en su perfil."
            );
            return;
        }

        setCargando(true);
        try {
            await addDoc(collection(db, 'asistencia'), {
                userId: usuarioSeleccionado.id,
                nombreUsuario: `${usuarioSeleccionado.nombre || ''} ${usuarioSeleccionado.apellido || ''}`.trim() || usuarioSeleccionado.email,
                estado: estado,
                fecha: new Date().toLocaleDateString(),
                timestamp: serverTimestamp()
            });

            const usuarioRef = doc(db, 'users', usuarioSeleccionado.id);
            await updateDoc(usuarioRef, {
                estado: estado 
            });

            Alert.alert("Éxito", `Se registró como ${estado} a ${usuarioSeleccionado.nombre || usuarioSeleccionado.email}`);
            
            setUsuarios(prevUsuarios => 
                prevUsuarios.map(u => u.id === usuarioSeleccionado.id ? { ...u, estado: estado } : u)
            );
            setUsuarioSeleccionado(null);
        } catch (error) {
            console.error("Error al registrar asistencia:", error);
            Alert.alert("Error", "No se pudo registrar la asistencia.");
        } finally {
            setCargando(false);
        }
    };

    // RESTABLECER ASISTENCIA Y LIMPIAR FORMULARIOS
    const restablecerAsistencias = () => {
        Alert.alert(
            "Restablecer Sesión",
            "¿Estás seguro de reiniciar la asistencia y limpiar los formularios enviados de todos los usuarios?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Sí, reiniciar", 
                    style: "destructive",
                    onPress: async () => {
                        setCargando(true);
                        try {
                            for (const user of usuarios) {
                                const usuarioRef = doc(db, 'users', user.id);
                                // Actualizamos estado a Ausente y limpiamos los campos de texto
                                await updateDoc(usuarioRef, { 
                                    estado: 'Ausente',
                                    nombre: '',
                                    apellido: '',
                                    edad: ''
                                });
                            }
                            // Limpiamos los datos también en el estado local de la pantalla
                            setUsuarios(prevUsuarios => prevUsuarios.map(u => ({ 
                                ...u, 
                                estado: 'Ausente', 
                                nombre: '', 
                                apellido: '', 
                                edad: '' 
                            })));
                            setUsuarioSeleccionado(null);
                            Alert.alert("Restablecido", "Se ha limpiado la asistencia y los formularios para una nueva sesión.");
                        } catch (error) {
                            console.error("Error al restablecer:", error);
                            Alert.alert("Error", "No se pudo restablecer la información.");
                        } finally {
                            setCargando(false);
                        }
                    }
                }
            ]
        );
    };

    const totalUsuarios = usuarios.length;
    const totalPresentes = usuarios.filter(u => u.estado === 'Presente').length;
    const totalConDatos = usuarios.filter(u => u.nombre && u.apellido).length;
    const totalPendientesDatos = totalUsuarios - totalConDatos;

    return (
        <View style={styles.container}>
            <View style={styles.headerBox}>
                <Text style={styles.title}>Panel de Asistencia</Text>
            </View>

            <View style={styles.contadorContainer}>
                <View style={styles.contadorBox}>
                    <Text style={styles.contadorNumero}>{totalPresentes}/{totalUsuarios}</Text>
                    <Text style={styles.contadorLabel}>Presentes</Text>
                </View>
                <View style={styles.contadorBox}>
                    <Text style={[styles.contadorNumero, { color: '#2e7d32' }]}>{totalConDatos}</Text>
                    <Text style={styles.contadorLabel}>Con Datos</Text>
                </View>
                <View style={styles.contadorBox}>
                    <Text style={[styles.contadorNumero, { color: '#e65100' }]}>{totalPendientesDatos}</Text>
                    <Text style={styles.contadorLabel}>Pendientes</Text>
                </View>
            </View>

            <Text style={styles.subTitle}>Selecciona un usuario para cambiar asistencia:</Text>
            
            <ScrollView style={styles.listaContainer} showsVerticalScrollIndicator={false}>
                {usuarios.length === 0 ? (
                    <Text style={styles.infoText}>Cargando usuarios...</Text>
                ) : (
                    usuarios.map((item) => {
                        const estaSeleccionado = usuarioSeleccionado?.id === item.id;
                        const yaEnvioDatos = item.nombre && item.apellido;
                        const estaPresente = item.estado === 'Presente';

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.usuarioCard,
                                    { backgroundColor: yaEnvioDatos ? '#e8f5e9' : '#fff3e0' },
                                    estaSeleccionado && styles.usuarioCardSeleccionado
                                ]}
                                onPress={() => setUsuarioSeleccionado(item)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.nombreTexto, estaSeleccionado && styles.textoSeleccionado]}>
                                        {yaEnvioDatos ? `${item.nombre} ${item.apellido}` : 'Sin datos guardados'}
                                    </Text>
                                    <Text style={[styles.detalleTexto, estaSeleccionado && styles.textoSeleccionadoSecondary]}>
                                        {item.email} {item.edad ? `| Edad: ${item.edad}` : ''}
                                    </Text>
                                    <Text style={[styles.tagEstado, { color: yaEnvioDatos ? '#2e7d32' : '#e65100' }]}>
                                        {yaEnvioDatos ? "✓ Formulario enviado" : "⚠ Pendiente de llenar"}
                                    </Text>
                                </View>

                                <View style={styles.estadoBox}>
                                    <Text style={[styles.estadoPillText, { color: estaPresente ? '#2e7d32' : '#c62828' }]}>
                                        {item.estado || 'Ausente'}
                                    </Text>
                                    <View style={[styles.puntoEstado, { backgroundColor: estaPresente ? '#2e7d32' : '#c62828' }]} />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <Text style={styles.subTitle}>Selecciona el Estado a asignar:</Text>
            <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.estadoBtn, estado === 'Presente' && styles.presenteBtn]}
                    onPress={() => setEstado('Presente')}
                >
                    <Text style={styles.estadoTexto}>Marcar Presente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.estadoBtn, estado === 'Ausente' && styles.ausenteBtn]}
                    onPress={() => setEstado('Ausente')}
                >
                    <Text style={styles.estadoTexto}>Marcar Ausente</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.btnContainer}>
                <Button
                    title={cargando ? "Guardando..." : "Confirmar Asistencia"}
                    color="#63331c"
                    borderRadius= '25'
                    onPress={registrarAsistencia}
                    disabled={cargando}
                />
            </View>

            {/* BOTÓN DE RESTABLECER PEQUEÑO Y DISCRETO */}
            <TouchableOpacity 
                style={styles.btnRestablecerPequeno} 
                onPress={restablecerAsistencias}
                disabled={cargando}
            >
                <Text style={styles.textoRestablecer}>🔄 Restablecer Sesión (Limpiar todo)</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e7ded4',
        padding: 20,
        justifyContent: 'center',
    },
    headerBox: {
        marginTop: 25,
        backgroundColor: '#643f2e',
        borderRadius: 12,
        padding: 25,
        alignItems: 'center',
        marginBottom: 10,
        elevation: 2,
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#fae3c9',
        textAlign: 'center',
    },
    contadorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 1,
    },
    contadorBox: {
        alignItems: 'center',
        flex: 1,
    },
    contadorNumero: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    contadorLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    subTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
        marginBottom: 5,
        color: '#444',
    },
    listaContainer: {
        maxHeight: '60%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 8,
    },
    usuarioCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    usuarioCardSeleccionado: {
        backgroundColor: '#4A3328',
        borderColor: '#4A3328',
    },
    nombreTexto: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    detalleTexto: {
        fontSize: 11,
        color: '#555',
        marginTop: 2,
    },
    tagEstado: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 3,
    },
    textoSeleccionado: {
        color: '#fff',
    },
    textoSeleccionadoSecondary: {
        color: '#eee',
    },
    estadoBox: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    estadoPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    puntoEstado: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    estadoBtn: {
        flex: 0.48,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#ccc',
        alignItems: 'center',
    },
    presenteBtn: {
        backgroundColor: '#2e7d32',
    },
    ausenteBtn: {
        backgroundColor: '#c62828',
    },
    estadoTexto: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnContainer: {
        marginTop: 2,
        width: '100%',
    },
    btnRestablecerPequeno: {
        marginTop: 10,
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    textoRestablecer: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#444',
    },
    infoText: {
        fontSize: 14,
        color: '#e4c79d',
        textAlign: 'center',
        padding: 20,
    }
});