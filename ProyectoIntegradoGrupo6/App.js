import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator'; // O la ruta correcta a tu RootNavigator

export default function App() {
    return (
        <NavigationContainer>
            <RootNavigator />
        </NavigationContainer>
    );
}