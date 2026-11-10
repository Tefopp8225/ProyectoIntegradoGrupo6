import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    StatusBar
} from 'react-native';

import FontAwesome from '@expo/vector-icons/FontAwesome';

const SERVER_URL = 'https://invernadero-chatbot.blancaprz413.workers.dev';

const preguntas = [
    { texto: '¿Cómo cuidar las plantas de tomate?', icono: 'leaf' },
    { texto: '¿Cada cuánto se debe regar?', icono: 'tint' },
    { texto: '¿Qué hacer si las hojas se ponen amarillas?', icono: 'exclamation-circle' },
    { texto: '¿Qué condiciones necesita una planta para crecer?', icono: 'sun-o' }
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
            {/* Barra de estado con estilo claro y fondo café oscuro */}
            <StatusBar barStyle="light-content" backgroundColor="#382218" />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.contenido}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* ENCABEZADO */}

                <View style={styles.encabezado}>

                    <View style={styles.filaEncabezado}>

                        <View style={styles.iconoIA}>
                            <FontAwesome
                                name="magic"
                                size={26}
                                color="#FFFFFF"
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.titulo}>
                                Recomendaciones IA
                            </Text>

                            <Text style={styles.subtitulo}>
                                Asistente inteligente del invernadero
                            </Text>
                        </View>

                    </View>

                    <View style={styles.estadoIA}>
                        <View style={styles.puntoVerde} />

                        <Text style={styles.textoEstado}>
                            Asistente disponible
                        </Text>
                    </View>

                </View>

                {/* CONTENEDOR PRINCIPAL AGRUPADO */}
                <View style={styles.cuerpoPrincipal}>

                    {/* TARJETA DE RESPUESTA */}

                    <View style={styles.seccionRespuesta}>

                        <View style={styles.encabezadoRespuesta}>

                            <View style={styles.iconoRespuesta}>
                                <FontAwesome
                                    name="commenting"
                                    size={18}
                                    color="#FFFFFF"
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.tituloRespuesta}>
                                    Asistente del invernadero
                                </Text>

                                <Text style={styles.subtituloRespuesta}>
                                    Recomendaciones y orientación
                                </Text>
                            </View>

                            <FontAwesome
                                name="leaf"
                                size={18}
                                color="#2E7D32"
                            />

                        </View>

                        <View style={styles.divisor} />

                        <ScrollView
                            style={styles.contenedorTexto}
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                        >

                            {cargando ? (

                                <View style={styles.cargando}>
                                    <ActivityIndicator
                                        size="large"
                                        color="#2E7D32"
                                    />

                                    <Text style={styles.textoCargando}>
                                        Analizando tu consulta...
                                    </Text>
                                </View>

                            ) : (

                                <Text style={styles.textoRespuesta}>
                                    {respuestaIA}
                                </Text>

                            )}

                        </ScrollView>

                        <View style={styles.pieRespuesta}>
                            <FontAwesome
                                name="info-circle"
                                size={12}
                                color="#2E7D32"
                            />

                            <Text style={styles.textoPieRespuesta}>
                                Las recomendaciones son generadas por IA.
                            </Text>
                        </View>

                    </View>

                    {/* PREGUNTAS SUGERIDAS */}

                    <View style={styles.seccionPreguntas}>

                        <View style={styles.filaTitulo}>

                            <Text style={styles.tituloSeccion}>
                                ¿Qué te gustaría saber?
                            </Text>

                            <FontAwesome
                                name="lightbulb-o"
                                size={18}
                                color="#2E7D32"
                            />

                        </View>

                        <Text style={styles.descripcionSeccion}>
                            Selecciona una pregunta para comenzar.
                        </Text>

                        <View style={styles.contenedorPreguntas}>

                            {preguntas.map((pregunta, index) => (

                                <TouchableOpacity
                                    key={index}
                                    style={styles.botonPregunta}
                                    onPress={() => obtenerRecomendacionIA(pregunta.texto)}
                                    disabled={cargando}
                                    activeOpacity={0.75}
                                >

                                    <View style={styles.iconoPregunta}>
                                        <FontAwesome
                                            name={pregunta.icono}
                                            size={15}
                                            color="#2E7D32"
                                        />
                                    </View>

                                    <Text style={styles.textoPregunta}>
                                        {pregunta.texto}
                                    </Text>

                                    <FontAwesome
                                        name="angle-right"
                                        size={17}
                                        color="#2E7D32"
                                    />

                                </TouchableOpacity>

                            ))}

                        </View>

                    </View>

                    {/* ÁREA DE CONSULTA */}

                    <View style={styles.seccionConsulta}>

                        <Text style={styles.tituloSeccion}>
                            Escribe tu consulta
                        </Text>

                        <Text style={styles.descripcionSeccion}>
                            También puedes realizar tus propias preguntas.
                        </Text>

                        <View style={styles.cuadroConsulta}>

                            <FontAwesome
                                name="pencil"
                                size={15}
                                color="#2E7D32"
                                style={styles.iconoEscritura}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="¿En qué puedo ayudarte hoy?"
                                placeholderTextColor="#8C6239"
                                value={consulta}
                                onChangeText={setConsulta}
                                multiline={true}
                                textAlignVertical="top"
                                editable={!cargando}
                            />

                        </View>

                        <TouchableOpacity
                            style={[
                                styles.botonEnviar,
                                cargando && styles.botonDeshabilitado
                            ]}
                            onPress={() => obtenerRecomendacionIA()}
                            disabled={cargando}
                            activeOpacity={0.8}
                        >

                            <FontAwesome
                                name="send"
                                size={15}
                                color="#FFFFFF"
                            />

                            <Text style={styles.textoBoton}>
                                {cargando ? 'Consultando...' : 'Consultar a la IA'}
                            </Text>

                            {!cargando && (
                                <FontAwesome
                                    name="arrow-right"
                                    size={14}
                                    color="#E8D8C9"
                                />
                            )}

                        </TouchableOpacity>

                    </View>

                </View>

                {/* PIE DE PÁGINA */}

                <View style={styles.piePagina}>

                    <View style={styles.lineaPie} />

                    <FontAwesome
                        name="leaf"
                        size={14}
                        color="#2E7D32"
                    />

                    <Text style={styles.textoPie}>
                        ASISTENTE INTELIGENTE DEL INVERNADERO
                    </Text>

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

    scroll: {
        flex: 1,
    },

    contenido: {
        paddingBottom: 20,
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
    },

    // ENCABEZADO 

    encabezado: {
        backgroundColor: '#382218',
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: '#382218',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },

    filaEncabezado: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    iconoIA: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#2E7D32',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },

    titulo: {
        fontSize: 21,
        fontWeight: 'bold',
        color: '#FFF9F2',
    },

    subtitulo: {
        fontSize: 11,
        color: '#E8D8C9',
        marginTop: 3,
    },

    estadoIA: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#233827',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 15,
        marginTop: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: '#2E7D32',
    },

    puntoVerde: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
    },

    textoEstado: {
        color: '#E2F0D9',
        fontSize: 10,
        fontWeight: '600',
    },

    // CUERPO PRINCIPAL (Reduce espacios excesivos)

    cuerpoPrincipal: {
        paddingHorizontal: 16,
        marginTop: 14,
        gap: 16,
    },

    // RESPUESTA IA

    seccionRespuesta: {
        backgroundColor: '#FFFCF8',
        padding: 15,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#D4E2D4',
        elevation: 2,
        shadowColor: '#382218',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },

    encabezadoRespuesta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    iconoRespuesta: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: '#2E7D32',
        justifyContent: 'center',
        alignItems: 'center',
    },

    tituloRespuesta: {
        color: '#382218',
        fontSize: 13,
        fontWeight: 'bold',
    },

    subtituloRespuesta: {
        color: '#2E7D32',
        fontSize: 10,
        marginTop: 2,
        fontWeight: '600',
    },

    divisor: {
        height: 1,
        backgroundColor: '#E2EFE2',
        marginVertical: 12,
    },

    contenedorTexto: {
        maxHeight: 200,
        minHeight: 100,
    },

    textoRespuesta: {
        fontSize: 13.5,
        color: '#382218',
        lineHeight: 21,
    },

    cargando: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 10,
    },

    textoCargando: {
        fontSize: 12,
        color: '#2E7D32',
        fontWeight: '600',
    },

    pieRespuesta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 6,
    },

    textoPieRespuesta: {
        fontSize: 9.5,
        color: '#5C765D',
    },

    // PREGUNTAS SUGERIDAS

    seccionPreguntas: {
        gap: 6,
    },

    filaTitulo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    tituloSeccion: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#382218',
    },

    descripcionSeccion: {
        fontSize: 11.5,
        color: '#5C765D',
        marginBottom: 8,
    },

    contenedorPreguntas: {
        gap: 8,
    },

    botonPregunta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFCF8',
        padding: 11,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D4E2D4',
        gap: 10,
        elevation: 1,
    },

    iconoPregunta: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },

    textoPregunta: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#382218',
        lineHeight: 17,
    },

    // ÁREA DE CONSULTA

    seccionConsulta: {
        gap: 6,
    },

    cuadroConsulta: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFCF8',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2E7D32',
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 90,
        elevation: 1.5,
    },

    iconoEscritura: {
        marginTop: 3,
        marginRight: 8,
    },

    input: {
        flex: 1,
        fontSize: 13.5,
        color: '#382218',
        minHeight: 65,
        padding: 0,
        lineHeight: 20,
    },

    botonEnviar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#382218',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 8,
        gap: 10,
        elevation: 2,
        shadowColor: '#382218',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },

    botonDeshabilitado: {
        opacity: 0.65,
    },

    textoBoton: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: 'bold',
    },

    // PIE DE PÁGINA

    piePagina: {
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        gap: 6,
    },

    lineaPie: {
        height: 1,
        backgroundColor: '#D4E2D4',
        width: '100%',
        marginBottom: 4,
    },

    textoPie: {
        fontSize: 8.5,
        fontWeight: 'bold',
        color: '#2E7D32',
        letterSpacing: 1.2,
        textAlign: 'center',
    },

});