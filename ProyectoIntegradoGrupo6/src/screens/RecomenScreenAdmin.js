import React, { useState } from 'react';
import {View,Text, TextInput, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity} from 'react-native';

const SERVER_URL = 'https://invernadero-chatbot.blancaprz413.workers.dev';

const preguntas = [
    '¿Cómo cuidar las plantas de tomate?',
    '¿Cada cuánto se debe regar?',
    '¿Qué hacer si las hojas se ponen amarillas?',
    '¿Qué condiciones necesita una planta para crecer?'
];

export default function RecomenScreenAdmin() {

    const [consulta, setConsulta] = useState('');
    const [respuestaIA, setRespuestaIA] = useState(
        '¡Bienvenido! Soy tu asistente del invernadero. Puedo ayudarte con recomendaciones sobre riego, cuidados, crecimiento y condiciones para tus cultivos. ¿Qué te gustaría consultar hoy?'
    );
    const [cargando, setCargando] = useState(false);

    const obtenerRecomendacionIA = async (pregunta = consulta) => {

        const texto = pregunta.trim();

        if (!texto) {
            setRespuestaIA('Escribe una pregunta o selecciona una de las sugerencias.');
            return;
        }

        setConsulta(texto);
        setCargando(true);
        setRespuestaIA('');

        try {

            const response = await fetch(`${SERVER_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pregunta: texto
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setRespuestaIA(
                    data.respuesta || 'No fue posible obtener una respuesta.'
                );
                return;
            }

            setRespuestaIA(
                data.respuesta || 'No se recibió una respuesta válida.'
            );

        } catch (error) {

            console.log('Error:', error);

            setRespuestaIA(
                'No fue posible conectar con el asistente. Comprueba tu conexión a Internet.'
            );

        } finally {

            setCargando(false);

        }
    };

    return (
        <View style={styles.container}>

            <Text style={styles.title}>
                Recomendaciones IA
            </Text>

            <View style={styles.subtituloBox}>
                <Text style={styles.subtitulo}>
                    Consejos y orientación para tus cultivos
                </Text>
            </View>

            <View style={styles.cuadroGrande}>
                <ScrollView>
                    {cargando ? (
                        <ActivityIndicator
                            size="large"
                            color="#6B422F"
                            style={{ marginTop: 20 }}
                        />
                    ) : (
                        <Text style={styles.texto}>
                            {respuestaIA}
                        </Text>
                    )}
                </ScrollView>
            </View>

            <Text style={styles.textoSugerencias}>
                ¿Qué te gustaría saber?
            </Text>

            <View style={styles.contenedorPreguntas}>
                {preguntas.map((pregunta, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.botonPregunta}
                        onPress={() => obtenerRecomendacionIA(pregunta)}
                        disabled={cargando}
                    >
                        <Text style={styles.textoPregunta}>
                            {pregunta}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.cuadroPequeno}>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe tu propia pregunta..."
                    placeholderTextColor="#927966"
                    value={consulta}
                    onChangeText={setConsulta}
                    multiline={true}
                    textAlignVertical="top"
                />
            </View>

            <TouchableOpacity
                style={styles.botonEnviar}
                onPress={() => obtenerRecomendacionIA()}
                disabled={cargando}
            >
                <Text style={styles.textoBoton}>
                    {cargando ? 'Consultando...' : 'Consultar a la IA'}
                </Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#E1D4C6',
        alignItems: 'center',
        paddingTop: 40
    },

    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: '#6B422F',
        width: '88%',
        textAlign: 'center',
        paddingVertical: 10,
        borderRadius: 15,
        marginBottom: 8
    },

    subtituloBox: {
        width: '88%',
        marginBottom: 12,
        alignItems: 'center'
    },

    subtitulo: {
        color: '#6B422F',
        fontSize: 13,
        fontWeight: '600'
    },

    cuadroGrande: {
        width: '88%',
        height: '30%',
        backgroundColor: '#FFFFFFCC',
        borderRadius: 22,
        padding: 20,
        marginBottom: 15,
        elevation: 4
    },

    texto: {
        fontSize: 15,
        color: '#4A3328',
        lineHeight: 23
    },

    textoSugerencias: {
        width: '88%',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6B422F',
        marginBottom: 9
    },

    contenedorPreguntas: {
        width: '88%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12
    },

    botonPregunta: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 13,
        marginBottom: 8,
        justifyContent: 'center',
        elevation: 2
    },

    textoPregunta: {
        color: '#6B422F',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center'
    },

    cuadroPequeno: {
        width: '88%',
        height: '13%',
        backgroundColor: '#FFFFFFCC',
        borderRadius: 20,
        padding: 12,
        marginBottom: 12,
        elevation: 3
    },

    input: {
        flex: 1,
        fontSize: 14,
        color: '#4A3328'
    },

    botonEnviar: {
        backgroundColor: '#6B422F',
        width: '88%',
        paddingVertical: 12,
        borderRadius: 15,
        alignItems: 'center'
    },

    textoBoton: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold'
    }

});
