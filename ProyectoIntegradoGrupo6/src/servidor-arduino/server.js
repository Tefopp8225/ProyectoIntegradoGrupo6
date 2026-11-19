// Servidor Principal - Proyecto Integrado Grupo 6
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());

// CONFIGURACIÓN DE PUERTOS COM
const PUERTO_ARDUINO_RIEGO = 'COM6';      // Arduino 1: Riego, Humedad y Techo (Servos en pines 2 y 5)
const PUERTO_ARDUINO_SISTEMA = 'COM4';    // Arduino 2: Crecimiento, Temperatura, Ventilador, Luces y LDR

let serialPortRiego, serialPortSistema;

// ESTADO DE LOS SENSORES E HISTORIAL
let alturaValue = 0;
let sensor1HumedadValue = 0;
let sensor2HumedadValue = 0;
let temperaturaValue = 0;
let ldrValue = 100; // Valor por defecto

let historial = [];

function registrarRegistro(tipo, nombre, valor) {
    const registro = {
        id: Date.now(),
        tipo: tipo,
        nombre: nombre,
        valor: valor,
        fecha: new Date().toISOString()
    };

    historial.unshift(registro);
    if (historial.length > 100) historial.pop();
    io.emit('historial_update', registro);

    console.log('[HISTORIAL]', registro);
}

// CONEXIÓN ARDUINO 1 (COM6) - Riego, Sensores de Humedad y Servos del Techo
try {
    serialPortRiego = new SerialPort({ path: PUERTO_ARDUINO_RIEGO, baudRate: 9600 });
    const parserRiego = serialPortRiego.pipe(new ReadlineParser({ delimiter: '\n' }));
    
    parserRiego.on('data', (line) => {
        line = line.trim();
        console.log('[ARDUINO 1 - Riego]', line);

        if (line.startsWith('SENSOR1_HUMEDAD:')) {
            sensor1HumedadValue = parseFloat(line.split(':')[1]);
            io.emit('sensor1_humedad_data', { value: sensor1HumedadValue });
        } else if (line.startsWith('SENSOR2_HUMEDAD:')) {
            sensor2HumedadValue = parseFloat(line.split(':')[1]);
            io.emit('sensor2_humedad_data', { value: sensor2HumedadValue });
        }
    });
    console.log('[OK] Conectado a Arduino de Riego en:', PUERTO_ARDUINO_RIEGO);
} catch (error) {
    console.log('[ERROR] Arduino Riego:', error.message);
}

// CONEXIÓN ARDUINO 2 (COM4) - Crecimiento, Ambiente, Luces y LDR
try {
    serialPortSistema = new SerialPort({ path: PUERTO_ARDUINO_SISTEMA, baudRate: 9600 });
    const parserSistema = serialPortSistema.pipe(new ReadlineParser({ delimiter: '\n' }));

    parserSistema.on('data', (line) => {
        line = line.trim();
        console.log('[ARDUINO 2 - Sistema]', line);

        if (line.startsWith('ALTURA:')) {
            alturaValue = parseFloat(line.split(':')[1]);
            if (Number.isFinite(alturaValue)) {
                io.emit('sensor_data', { value: alturaValue });
                io.emit('plant_distance', { value: alturaValue });
                
                registrarRegistro('Sensor', 'Sensor ultrasónico', alturaValue.toFixed(1) + ' cm');
            }
        } else if (line.startsWith('SENSOR_TEMPERATURA:')) {
            temperaturaValue = parseFloat(line.split(':')[1]);
            io.emit('temperatura_data', { value: temperaturaValue });
        } else if (line.startsWith('LDR_VALOR:')) {
            ldrValue = parseFloat(line.split(':')[1]);
            io.emit('ldr_data', { value: ldrValue });
        }
    });
    console.log('[OK] Conectado a Arduino del Sistema en:', PUERTO_ARDUINO_SISTEMA);
} catch (error) {
    console.log('[ERROR] Arduino Sistema:', error.message);
}

// MANEJO DE SOCKETS CON LA APLICACIÓN REACT NATIVE
io.on('connection', (socket) => {
    console.log('[APP] App conectada:', socket.id);

    // Enviar estados iniciales al conectar la app
    socket.emit('historial_data', historial);
    socket.emit('sensor_data', { value: alturaValue });
    socket.emit('sensor1_humedad_data', { value: sensor1HumedadValue });
    socket.emit('sensor2_humedad_data', { value: sensor2HumedadValue });
    socket.emit('temperatura_data', { value: temperaturaValue });
    socket.emit('ldr_data', { value: ldrValue });

    // CONTROL DE BOMBA DE AGUA (Arduino 1 - COM6)
    socket.on('command_bomba', (data) => {
        console.log('[APP] Comando Bomba:', data);
        if (serialPortRiego && serialPortRiego.isOpen) {
            let cmd = (data.action === 'ON') ? 'BOMBA_ON\n' : 'BOMBA_OFF\n';
            serialPortRiego.write(cmd, (err) => {
                if (!err) {
                    io.emit('bomba_state', { encendida: data.action === 'ON' });
                    registrarRegistro('Actuador', 'Bomba de Agua', data.action === 'ON' ? 'Encendido' : 'Apagado');
                }
            });
        }
    });

    // CONTROL DE VENTILADOR (Arduino 2 - COM4)
    socket.on('command_ventilador', (data) => {
        console.log('[APP] Comando Ventilador:', data);
        if (serialPortSistema && serialPortSistema.isOpen) {
            let cmd = (data.action === 'ON') ? 'VENTILADOR_ON\n' : 'VENTILADOR_OFF\n';
            serialPortSistema.write(cmd, (err) => {
                if (!err) {
                    io.emit('ventilador_state', { encendido: data.action === 'ON' });
                    registrarRegistro('Actuador', 'Ventilador', data.action === 'ON' ? 'Encendido' : 'Apagado');
                }
            });
        }
    });

    // CONTROL DE TECHO / VENTANA (Ahora dirigido al Arduino 1 - COM6 donde están físicamente los servos)
    socket.on('command_ventana', (data) => {
        console.log('[APP] Comando Ventana:', data);
        let cmd = (data.action === 'ABRIR') ? 'VENTANA_ABRIR\n' : 'VENTANA_CERRAR\n';

        if (serialPortRiego && serialPortRiego.isOpen) {
            serialPortRiego.write(cmd, (err) => {
                if (!err) {
                    io.emit('ventana_state', { abierta: data.action === 'ABRIR' });
                    registrarRegistro('Actuador', 'Techo / Ventana', data.action === 'ABRIR' ? 'Abierto' : 'Cerrado');
                }
            });
        }
    });

    // CONTROL DE LUZ INVERNADERO (Opcional por compatibilidad)
    socket.on('command_ledinvernadero', (data) => {
        console.log('[APP] Comando LED Invernadero:', data);
        if (serialPortSistema && serialPortSistema.isOpen) {
            let cmd = (data.action === 'ON') ? 'LEDSOL_ON\n' : 'LEDSOL_OFF\n';
            serialPortSistema.write(cmd, (err) => {
                if (!err) {
                    io.emit('ledinvernadero_state', { encendido: data.action === 'ON' });
                    registrarRegistro('Actuador', 'Luz del Invernadero', data.action === 'ON' ? 'Encendido' : 'Apagado');
                }
            });
        }
    });

    // CONTROL DE LUZ CALLE 1 (Arduino 2 - COM4)
    socket.on('command_led1calle', (data) => {
        console.log('[APP] Comando LED 1 Calle:', data);
        if (serialPortSistema && serialPortSistema.isOpen) {
            let cmd = (data.action === 'ON') ? 'LED1Calle_ON\n' : 'LED1Calle_OFF\n';
            serialPortSistema.write(cmd, (err) => {
                if (!err) {
                    io.emit('led1calle_state', { encendido: data.action === 'ON' });
                    registrarRegistro('Actuador', 'LED Calle 1', data.action === 'ON' ? 'Encendido' : 'Apagado');
                }
            });
        }
    });

    // CONTROL DE LUZ CALLE 2 (Arduino 2 - COM4)
    socket.on('command_led2calle', (data) => {
        console.log('[APP] Comando LED 2 Calle:', data);
        if (serialPortSistema && serialPortSistema.isOpen) {
            let cmd = (data.action === 'ON') ? 'LED2Calle_ON\n' : 'LED2Calle_OFF\n';
            serialPortSistema.write(cmd, (err) => {
                if (!err) {
                    io.emit('led2calle_state', { encendido: data.action === 'ON' });
                    registrarRegistro('Actuador', 'LED Calle 2', data.action === 'ON' ? 'Encendido' : 'Apagado');
                }
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('[APP] App desconectada:', socket.id);
    });
});

const PORT = 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('SERVER MULTI-ARDUINO INICIADO');
    console.log('========================================');
    console.log('Puerto Servidor:', PORT);
    console.log('Arduino 1 (Riego y Techo):', PUERTO_ARDUINO_RIEGO);
    console.log('Arduino 2 (Sistema y Luces):', PUERTO_ARDUINO_SISTEMA);
    console.log('========================================');
});

process.on('SIGINT', () => {
    console.log('\n[STOP] Servidor detenido');
    if (serialPortRiego && serialPortRiego.isOpen) serialPortRiego.close();
    if (serialPortSistema && serialPortSistema.isOpen) serialPortSistema.close();
    process.exit();
});