import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabNavigatorAdmin from './BottomTabNavigatorAdmin';
import BottomTabNavigatorUsu from './BottomTabNavigatorUsu';

const Stack = createNativeStackNavigator();

export default function EventStackNavigator() {

    return (
        <Stack.Navigator>
            <Stack.Screen
                name='Login'
                component={LoginScreen}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name='Register'
                component={RegisterScreen}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name='Admin-Home'
                component={BottomTabNavigatorAdmin}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name='Usuario-Home'
                component={BottomTabNavigatorUsu}
                options={{
                    headerShown: false
                }}
            />
        </Stack.Navigator>
    )
}