
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';

export default function RecomenScreenAdmin() {

    const [recomendacion, setRecomendacion] = useState('');

    return (
        <View style={styles.container}>

            <Text style={styles.title}>
                Recomendaciones
            </Text>

            {/* Cuadro grande para mostrar texto */}
            <View style={styles.cuadroGrande}>

                <Text style={styles.texto}>
                    
                </Text>

            </View>

            {/* Cuadro pequeño para escribir */}
            <View style={styles.cuadroPequeno}>

                <TextInput
                    style={styles.input}
                    placeholder="Escribe una recomendación..."
                    placeholderTextColor="#927966"
                    value={recomendacion}
                    onChangeText={setRecomendacion}
                    multiline={true}
                    textAlignVertical="top"
                />

            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#E1D4C6',
        alignItems: 'center',
        paddingTop: 60,
    },

    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: '#6B422F',
        width: '88%',
        textAlign: 'center',
        paddingVertical: 15,
        borderRadius: 15,
        marginBottom: 30,
    },

    cuadroGrande: {
        width: '88%',
        height: '48%',
        backgroundColor: '#FFFFFFCC',
        borderRadius: 25,
        padding: 20,
        marginBottom: 25,

        elevation: 4,
        shadowColor: '#4A3328',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
    },

    texto: {
        fontSize: 17,
        color: '#4A3328',
    },

    cuadroPequeno: {
        width: '88%',
        height: '22%',
        backgroundColor: '#FFFFFFCC',
        borderRadius: 25,
        padding: 15,

        elevation: 4,
        shadowColor: '#4A3328',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
    },

    input: {
        flex: 1,
        fontSize: 16,
        color: '#4A3328',
    },

});
