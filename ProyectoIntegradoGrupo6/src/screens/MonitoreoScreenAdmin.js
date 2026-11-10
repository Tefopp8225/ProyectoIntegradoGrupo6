import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/FirebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

//5 productos
const PRODUCTOS_BASE = [
    { id: '1', nombre: 'Tierra', cantidad: 10 },
    { id: '2', nombre: 'Abono', cantidad: 4 },
    { id: '3', nombre: 'Semillas', cantidad: 15 },
    { id: '4', nombre: 'Herbicida', cantidad: 2 },
    { id: '5', nombre: 'Fertilizante', cantidad: 3 }
];

export default function MonitoreoScreenAdmin() {
    const [seccion, setSeccion] = useState('Reportes');
    
    const [reportes, setReportes] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [compras, setCompras] = useState([]);

    const [productosParaComprar, setProductosParaComprar] = useState([]);
    const [cantidadesCompra, setCantidadesCompra] = useState({});

    useEffect(() => {
        // 1. Cargar reportes
        const unsub1 = onSnapshot(collection(db, "reportes"), (snap) => {
            const lista = [];
            snap.forEach(d => {
                const data = { id: d.id, ...d.data() };
                lista.push(data);
                if (data.estado === "Pendiente") {
                    updateDoc(doc(db, "reportes", d.id), { estado: "Visto" });
                }
            });
            setReportes(lista);
        });

        // 2. Cargar inventario asegurando que SÓLO existan los 5 productos oficiales
        const unsub2 = onSnapshot(collection(db, "inventario"), async (snap) => {
            const listaEnFirestore = [];
            snap.forEach(d => listaEnFirestore.push({ id: d.id, ...d.data() }));

            // Verificamos que los 5 productos base estén creados exactamente
            for (let prodBase of PRODUCTOS_BASE) {
                const existe = listaEnFirestore.some(item => item.id === prodBase.id);
                if (!existe) {
                    await setDoc(doc(db, "inventario", prodBase.id), {
                        nombre: prodBase.nombre,
                        cantidad: prodBase.cantidad
                    });
                }
            }
            // Filtramos la vista local para mostrar únicamente los 5 productos oficiales
            const inventarioLimpio = PRODUCTOS_BASE.map(base => {
                const encontrado = listaEnFirestore.find(item => item.id === base.id);
                return encontrado ? { id: base.id, nombre: base.nombre, cantidad: encontrado.cantidad } : base;
            });

            setInventario(inventarioLimpio);
        });

        // 3. Cargar compras
        const unsub3 = onSnapshot(collection(db, "compras"), (snap) => {
            const lista = [];
            snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
            setCompras(lista);
        });

        return () => {
            unsub1();
            unsub2();
            unsub3();
        };
    }, []);

    const borrarReporte = async (id) => {
        try {
            await deleteDoc(doc(db, "reportes", id));
            Alert.alert("Eliminado", "Reporte borrado.");
        } catch (error) {
            Alert.alert("Error", "No se pudo borrar el reporte.");
        }
    };

    const borrarCompra = async (id) => {
        try {
            await deleteDoc(doc(db, "compras", id));
            Alert.alert("Eliminado", "Pedido borrado del historial.");
        } catch (error) {
            Alert.alert("Error", "No se pudo borrar el pedido.");
        }
    };

    const alternarCompra = (producto) => {
        const existe = productosParaComprar.some(p => p.id === producto.id);
        if (existe) {
            setProductosParaComprar(productosParaComprar.filter(p => p.id !== producto.id));
        } else {
            setProductosParaComprar([...productosParaComprar, producto]);
        }
    };

    const quitarDeCompras = (id) => {
        setProductosParaComprar(productosParaComprar.filter(p => p.id !== id));
    };

    const cambiarCantidadCompra = (id, valor) => {
        setCantidadesCompra({
            ...cantidadesCompra,
            [id]: valor
        });
    };

    const realizarPedido = async () => {
        const productosAEnviar = productosParaComprar.filter(p => cantidadesCompra[p.id] && cantidadesCompra[p.id].trim() !== '');

        if (productosAEnviar.length === 0) {
            Alert.alert("Atención", "Escribe la cantidad para al menos uno de los productos seleccionados.");
            return;
        }

        try {
            for (let p of productosAEnviar) {
                const cant = cantidadesCompra[p.id];
                await addDoc(collection(db, "compras"), {
                    producto: p.nombre,
                    cantidad: parseInt(cant, 10),
                    estado: "En camino",
                    fecha: new Date().toLocaleDateString()
                });
            }

            const idsEnviados = productosAEnviar.map(p => p.id);
            const restantes = productosParaComprar.filter(p => !idsEnviados.includes(p.id));
            
            setProductosParaComprar(restantes);
            
            const nuevasCantidades = { ...cantidadesCompra };
            idsEnviados.forEach(id => delete nuevasCantidades[id]);
            setCantidadesCompra(nuevasCantidades);

            Alert.alert("¡Éxito!", "Pedido registrado correctamente.");
        } catch (error) {
            Alert.alert("Error", "No se pudo realizar el pedido.");
        }
    };

    return (
        <View style={styles.container}>
            {/* Menú Superior bien abajo para presionar con comodidad */}
            <View style={styles.menu}>
                <TouchableOpacity onPress={() => setSeccion('Reportes')}>
                    <Text style={[styles.menuTexto, seccion === 'Reportes' && styles.activo]}>Reportes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSeccion('Inventario')}>
                    <Text style={[styles.menuTexto, seccion === 'Inventario' && styles.activo]}>Inventario</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSeccion('Compras')}>
                    <Text style={[styles.menuTexto, seccion === 'Compras' && styles.activo]}>Compras</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.cuerpo}>
                {/* 1. SECCIÓN REPORTES */}
                {seccion === 'Reportes' && (
                    <View>
                        <Text style={styles.titulo}>Reportes de Trabajadores</Text>
                        {reportes.length === 0 ? (
                            <Text style={styles.gris}>No hay reportes nuevos.</Text>
                        ) : (
                            reportes.map(r => (
                                <View key={r.id} style={styles.caja}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <Text style={styles.negrita}>{r.tipo}</Text>
                                        <TouchableOpacity onPress={() => borrarReporte(r.id)}>
                                            <Text style={{color: '#c62828', fontWeight: 'bold', fontSize: 13}}>Borrar ✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.textoGeneral}>Trabajador: {r.nombreTrabajador || r.emailTrabajador}</Text>
                                    <Text style={styles.gris}>{r.descripcion || "Sin descripción"}</Text>
                                    <Text style={styles.fecha}>{r.fecha ? new Date(r.fecha).toLocaleDateString() : ''}</Text>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* 2. SECCIÓN INVENTARIO (Solo los 5 productos oficiales) */}
                {seccion === 'Inventario' && (
                    <View>
                        <Text style={styles.titulo}>Inventario Actual</Text>
                        {inventario.map(i => {
                            const esEscaso = i.cantidad < 5;
                            const seleccionado = productosParaComprar.some(p => p.id === i.id);
                            return (
                                <View key={i.id} style={[styles.caja, esEscaso && styles.cajaAlerta]}>
                                    <Text style={styles.negrita}>{i.nombre}</Text>
                                    <Text style={styles.textoGeneral}>Cantidad disponible: {i.cantidad}</Text>

                                    {esEscaso && (
                                        <Text style={styles.alertaNaranja}>⚠️ Quedan pocos. Se recomienda comprar.</Text>
                                    )}

                                    <TouchableOpacity 
                                        style={[styles.botonComprar, seleccionado && {backgroundColor: '#D7CCC8'}]} 
                                        onPress={() => alternarCompra(i)}
                                    >
                                        <Text style={[styles.textoBoton, seleccionado && {color: '#4A3328'}]}>
                                            {seleccionado ? '✓ Seleccionado (Quitar)' : '+ Agregar a Compras'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* 3. SECCIÓN COMPRAS */}
                {seccion === 'Compras' && (
                    <View>
                        <Text style={styles.titulo}>Preparar Pedido</Text>
                        
                        {productosParaComprar.length === 0 ? (
                            <Text style={styles.gris}>Selecciona productos desde la pestaña Inventario para agregarlos aquí.</Text>
                        ) : (
                            <View>
                                {productosParaComprar.map(p => (
                                    <View key={p.id} style={styles.caja}>
                                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <Text style={styles.negrita}>{p.nombre}</Text>
                                            <TouchableOpacity onPress={() => quitarDeCompras(p.id)}>
                                                <Text style={{color: '#c62828', fontWeight: 'bold', fontSize: 13}}>Quitar ✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.gris}>Stock actual: {p.cantidad}</Text>

                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="Escribe la cantidad a pedir" 
                                            value={cantidadesCompra[p.id] || ''} 
                                            onChangeText={(val) => cambiarCantidadCompra(p.id, val)} 
                                            keyboardType="numeric" 
                                        />
                                    </View>
                                ))}

                                <TouchableOpacity style={styles.botonPrincipal} onPress={realizarPedido}>
                                    <Text style={styles.textoBoton}>Realizar Pedido</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={[styles.titulo, {marginTop: 30}]}>Historial de Pedidos</Text>
                        {compras.length === 0 ? (
                            <Text style={styles.gris}>No hay pedidos realizados.</Text>
                        ) : (
                            compras.map(c => (
                                <View key={c.id} style={styles.caja}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <Text style={styles.negrita}>{c.producto} - Cant: {c.cantidad}</Text>
                                        <TouchableOpacity onPress={() => borrarCompra(c.id)}>
                                            <Text style={{color: '#c62828', fontWeight: 'bold', fontSize: 13}}>Borrar ✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.gris}>
                                        Estado: <Text style={{fontWeight: 'bold', color: c.estado === 'Recibido' ? '#2e7d32' : '#d97706'}}>{c.estado}</Text>
                                    </Text>
                                    <Text style={styles.fecha}>{c.fecha}</Text>
                                </View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5EBE0' },
    menu: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        backgroundColor: '#64412c', 
        paddingVertical: 28, 
        padding: 20, 
        borderBottomWidth: 1, 
        borderColor: '#D7CCC8',
        elevation: 2,
        margin: 15,
        marginTop: 50,
        borderRadius: 15,
    },
    menuTexto: { fontSize: 20, color: '#d3c1b5', fontWeight: 'bold' },
    activo: { color: '#ffffff', textDecorationLine: 'underline' },
    cuerpo: { padding: 20 },
    titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#4A3328' },
    caja: { 
        backgroundColor: '#ffffff', 
        padding: 16, 
        borderRadius: 10, 
        marginBottom: 15, 
        borderWidth: 1, 
        borderColor: '#EFEBE9',
        elevation: 2
    },
    cajaAlerta: { borderColor: '#FFB74D', backgroundColor: '#FFF8E1' },
    negrita: { fontWeight: 'bold', fontSize: 16, color: '#4A3328', marginBottom: 4 },
    textoGeneral: { fontSize: 14, color: '#5D4037' },
    gris: { color: '#8D6E63', fontSize: 13, marginTop: 4 },
    fecha: { fontSize: 11, color: '#A1887F', marginTop: 6, textAlign: 'right' },
    alertaNaranja: { color: '#E65100', fontWeight: 'bold', fontSize: 13, marginTop: 6 },
    input: { borderWidth: 1, borderColor: '#D7CCC8', borderRadius: 6, padding: 10, marginTop: 10, backgroundColor: '#FAFAFA' },
    botonComprar: { backgroundColor: '#8D6E63', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 12 },
    botonPrincipal: { backgroundColor: '#4A3328', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 15, marginBottom: 20 },
    textoBoton: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }
});