import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreenAdmin from '../screens/HomeScreenAdmin';
import HistorialScreenAdmin from '../screens/HistorialScreenAdmin';
import MonitoreScreenAdmin from '../screens/MonitoreoScreenAdmin';
import RecomenScreenAdmin from '../screens/RecomenScreenAdmin';
import ProfileScreenAdmin from '../screens/ProfileScreenAdmin';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigatorAdmin() {
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
            {/* Pestaña de Inicio del Administrador */}
            <Tab.Screen
                name="InicioAdmin"
                component={HomeScreenAdmin}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <AntDesign name="home" size={28} color={color} />
                    )    
                }}
            />

            {/* Pestaña de Historial o Monitoreo del Administrador */}
            <Tab.Screen
                name="HistorialAdmin"
                component={HistorialScreenAdmin}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="history" size={30} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="MonitoreoAdmin"
                component={MonitoreScreenAdmin}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="analytics"size={30} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Recomendaciones"
                component={RecomenScreenAdmin}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="recommend" size={30} color={color} />
                    )
                }}
            />

            {/* Pestaña de Perfil del Administrador */}
            <Tab.Screen
                name="PerfilAdmin"
                component={ProfileScreenAdmin}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Feather name="user" size={30} color={color} />
                    )
                }}
            />
        </Tab.Navigator>
    );
}