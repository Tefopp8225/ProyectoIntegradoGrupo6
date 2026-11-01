import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import io from 'socket.io-client';

// CONFIGURACIÓN - CAMBIA ESTA IP POR LA DE TU COMPUTADORA
const SERVER_URL = 'http://192.168.1.29:3000';

return (
    <SafeAreaView style={styles.areaSegura}>
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contenidoScroll}
        >

            <View>
                <Text style={styles.tituloSala2}>Bienvenidos a casa Naes, un lugar lleno de paz y tranquilidad</Text>
                <Text style={styles.descripcion2}>En esta aplicación será capaz de controlar funciones de diferentes ambientes de la casa</Text>
                <Text style={styles.tituloSala}>Bienvenido!</Text>
            </View>


            {/* PRESENTACIÓN DE LA SALA */}
            <View style={styles.presentacionSala}>
                <Text style={styles.icono}>🛋️</Text>
                <View style={styles.textoSala}>
                    <Text style={styles.tituloSala}>Sala de estar</Text>
                    <Text style={styles.descripcion}>
                        Controla las luces de la sala de estar en esta sección.
                    </Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.titulo}>Foco principal</Text>

                <Text style={[styles.estado, conectado ? styles.conectado : styles.desconectado]}>
                    {conectado ? '🟢 Conectado' : '🔴 Desconectado'}
                </Text>

                <View style={styles.ledSection}>
                    <Text style={styles.ledTitulo}>LED 3</Text>

                    <View style={styles.ledContainer}>
                        <View style={[styles.led, { backgroundColor: led3Status ? '#C58B55' : '#666' }]} />
                        <Text style={[styles.ledTexto, { color: led3Status ? '#A66A35' : '#666' }]}>
                            {led3Status ? 'ENCENDIDO' : 'APAGADO'}
                        </Text>
                    </View>

                    <View style={styles.botones}>
                        <TouchableOpacity
                            style={[styles.boton, styles.botonEncender]}
                            onPress={() => toggleLed3(true)}
                        >
                            <Text style={styles.textoBoton}>ENCENDER</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.boton, styles.botonApagar]}
                            onPress={() => toggleLed3(false)}
                        >
                            <Text style={styles.textoBoton}>APAGAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.titulo}>Foco secundario</Text>

                <Text style={[styles.estado, conectado ? styles.conectado : styles.desconectado]}>
                    {conectado ? '🟢 Conectado' : '🔴 Desconectado'}
                </Text>

                <View style={styles.ledSection}>
                    <Text style={styles.ledTitulo}>LED 4</Text>

                    <View style={styles.ledContainer}>
                        <View style={[styles.led, { backgroundColor: led4Status ? '#C58B55' : '#666' }]} />
                        <Text style={[styles.ledTexto, { color: led4Status ? '#A66A35' : '#666' }]}>
                            {led4Status ? 'ENCENDIDO' : 'APAGADO'}
                        </Text>
                    </View>

                    <View style={styles.botones}>
                        <TouchableOpacity
                            style={[styles.boton, styles.botonEncender]}
                            onPress={() => toggleLed4(true)}
                        >
                            <Text style={styles.textoBoton}>ENCENDER</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.boton, styles.botonApagar]}
                            onPress={() => toggleLed4(false)}
                        >
                            <Text style={styles.textoBoton}>APAGAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

        </ScrollView>
    </SafeAreaView>
);

// ESTILOS 
const styles = StyleSheet.create({
    areaSegura: {
        flex: 1,
        backgroundColor: '#F3E9DC',
    },
    scrollView: {
        flex: 1,
    },
    contenidoScroll: {
        padding: 20,
        paddingBottom: 30,
    },

    presentacionSala: {
        backgroundColor: '#5C4033',
        borderRadius: 15,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#CBB196',
    },
    icono: {
        fontSize: 40,
        marginRight: 15,
    },
    textoSala: {
        flex: 1,
    },
    tituloSala: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#E8D5C0',
        marginBottom: 5,
    },
    tituloSala2: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#c78841',
        marginBottom: 5,
    },
    descripcion: {
        fontSize: 14,
        color: 'white',
        lineHeight: 20,
    },
    descripcion2: {
        fontSize: 16,
        color: '#4A3328',
        lineHeight: 20,
    },

    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#4A3328',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E1D4C6',
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#4A3328',
    },
    estado: {
        textAlign: 'center',
        fontSize: 16,
        padding: 10,
        borderRadius: 10,
        marginBottom: 20,
        fontWeight: '500',
    },
    conectado: {
        backgroundColor: '#E3E8DE',
        color: '#53634A',
    },
    desconectado: {
        backgroundColor: '#EBDDD5',
        color: '#8A5140',
    },
    ledSection: {
        marginVertical: 10,
    },
    ledTitulo: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
        color: '#6B5142',
    },
    ledContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    led: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#D8C4AE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
    },
    ledTexto: {
        marginTop: 5,
        fontSize: 14,
        fontWeight: 'bold',
    },
    botones: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 5,
    },
    boton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        minWidth: 120,
        alignItems: 'center',
    },
    botonEncender: {
        backgroundColor: '#8B6F47',
    },
    botonApagar: {
        backgroundColor: '#765548',
    },
    textoBoton: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    }
});
