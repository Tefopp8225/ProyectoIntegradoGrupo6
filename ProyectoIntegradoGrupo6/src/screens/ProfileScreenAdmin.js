import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { View, Text, StyleSheet,Button } from 'react-native';



export default function ProfileScreen({navigation}) {



    return (

        <View style={styles.container}>

            <View style={styles.caja}> 

                <Text style={styles.title}>Perfil</Text>

               <FontAwesome name="user-circle" size={90} color="black" />

                <Text style={styles.text}>Admin </Text>



                <Button 

                    title="Cerrar sesión"
                     color="#4A3328"

                    onPress={() => navigation.navigate('Login')}

                />
            </View>
        </View>

    );

}



const styles = StyleSheet.create({



    container: {
        backgroundColor : '#E1D4C6',
        flex: 1,
        
        justifyContent: 'center',

        alignItems: 'center',

    },

    caja: {
        
        backgroundColor : '#fefefcd3',
        flex: 0.90,
        borderRadius : 40,
        justifyContent: 'center',
        padding: 120,
        alignItems: 'center',
    },
    
    title: {

        fontSize: 50,
        
        fontWeight: 'bold',

        marginBottom: 20,

    },



    text: {

        fontSize: 22,
        marginBottom: 20,
    }
    


}); 
