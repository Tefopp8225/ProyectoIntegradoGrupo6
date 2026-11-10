import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreenUsu from '../screens/HomeScreenUsu';
import CrecimientoScreenUsu from '../screens/CrecimientoScreenUsu';
import AmbienteScreen from '../screens/AmbienteScreen';
import RiegoScreen from '../screens/RiegoScreen';
import ProfileScreenUsu from '../screens/ProfileScreenUsu';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigatorUsu() {

    return (

        <Tab.Navigator
             screenOptions={{
                tabBarActiveTintColor: '#0fbbe6',
                tabBarInactiveTintColor: '#111f7a',
                tabBarStyle: {
                    backgroundColor: '#c8c8cb'
                },
                tabBarShowLabel: false
            }}
        >
            {/* Primera opción del menú inferior. */}
            <Tab.Screen
                name="Inicio"
                component={HomeScreenUsu}
                options={{
                    headerShown: false,
                    tabBarIcon: () => (
                        <AntDesign name="home" size={28} color="black" />
                    )    
                }}
            />

            {/* Segunda opción.*/}

            <Tab.Screen
                name="Crecimiento"
                component={CrecimientoScreenUsu}
                options={{
                    headerShown: false,
                    tabBarIcon: () => (
                        <MaterialIcons name="trending-up" size={32} color="black" />
                    ) 
                }}
            />

            <Tab.Screen
                name="Ambiente"
                component={AmbienteScreen}
                options={{
                    headerShown: false,
                    tabBarIcon: () => (
                        <MaterialIcons name="eco" size={32} color="black" />
                    ) 
                }}
            />

            <Tab.Screen
                name="Riego"
                component={RiegoScreen}
                options={{
                    headerShown: false,
                    tabBarIcon: () => (
                        <MaterialIcons name="water-drop" size={32} color="black" />
                    ) 
                }}
            />

            {/* Tercera opción del menú inferior. */}

            <Tab.Screen
                name="Perfil"
                component={ProfileScreenUsu}
                options={{
                    headerShown: false,
                    tabBarIcon: () => (
                        <Feather name="user" size={30} color="black" />
                    )
                }}
            />


        </Tab.Navigator>

    );
}