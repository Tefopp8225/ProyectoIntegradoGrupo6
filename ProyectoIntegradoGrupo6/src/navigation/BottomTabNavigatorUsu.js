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
                tabBarActiveTintColor: '#f3efec',
                tabBarInactiveTintColor: '#96674c',
                tabBarStyle: {
                    backgroundColor: '#ccb6a6'
                },
                tabBarShowLabel: false
            }}
        >
            <Tab.Screen
                name="Inicio"
                component={HomeScreenUsu}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <AntDesign name="home" size={28} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Crecimiento"
                component={CrecimientoScreenUsu}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="trending-up" size={32} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Ambiente"
                component={AmbienteScreen}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="eco" size={32} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Riego"
                component={RiegoScreen}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="water-drop" size={32} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Perfil"
                component={ProfileScreenUsu}
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