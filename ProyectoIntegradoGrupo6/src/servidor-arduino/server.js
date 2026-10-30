// 1. IMPORTAR LIBRERIAS
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');

// 2. CREAR SERVIDOR
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.use(cors());

// 3. CONFIGURAR PUERTO SERIAL
// CAMBIAR! Usa COM3, COM4, etc.
const PUERTO_ARDUINO = 'COM15';

// Intentar conectar con Arduino
let serialPort;
try {
    serialPort = new SerialPort({
        path: PUERTO_ARDUINO,
        baudRate: 9600
    });
    console.log('[OK] Conectando al Arduino...');
} catch (error) {
    console.log('[ERROR] Error al conectar:', error.message);
    console.log('[INFO] Verifica que el Arduino este conectado');
}

// 4. ESTADO DEL LED Y SENSOR
let ledStatus = false;
let sensorValue = 0;

// 5. LEER DATOS DEL ARDUINO
if (serialPort) {
    const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    parser.on('data', (line) => {
        console.log('[ARDUINO]', line);

        // Leer sensor
        if (line.startsWith('SENSOR:')) {
            sensorValue = parseInt(line.split(':')[1]) || 0;
            io.emit('sensor_data', { value: sensorValue });
        }
        // LED encendido
        else if (line === 'LED_ENCENDIDO') {
            ledStatus = true;
            io.emit('led_status', { status: true });
        }
        // LED apagado
        else if (line === 'LED_APAGADO') {
            ledStatus = false;
            io.emit('led_status', { status: false });
        }
    });

    // Error en el puerto serial
    serialPort.on('error', (error) => {
        console.log('[ERROR] Error en el puerto:', error.message);
        console.log('[INFO] Revisa la conexion del Arduino');
    });

    // Puerto abierto correctamente
    serialPort.on('open', () => {
        console.log('[OK] Arduino conectado en:', PUERTO_ARDUINO);
    });
}

// 6. MANEJAR CONEXIONES DE LA APP
io.on('connection', (socket) => {
    console.log('[APP] App conectada');

    // Enviar estado actual del LED y sensor
    socket.emit('led_status', { status: ledStatus });
    socket.emit('sensor_data', { value: sensorValue });

    // Recibir comandos de la app
    socket.on('command_led', (data) => {
        console.log('[APP] Comando:', data);

        // Validar que el comando sea valido
        if (!data || !data.action) {
            console.log('[WARN] Comando invalido:', data);
            return;
        }

        // Validar que action sea ON o OFF
        if (data.action !== 'ON' && data.action !== 'OFF') {
            console.log('[WARN] Accion invalida:', data.action);
            return;
        }

        // Enviar comando al Arduino
        if (serialPort) {
            const comando = 'LED_' + data.action + '\n';
            serialPort.write(comando);
            console.log('[SEND] Enviando:', comando.trim());
        } else {
            console.log('[WARN] Arduino no conectado');
            socket.emit('error', { message: 'Arduino no conectado' });
        }
    });

    socket.on('disconnect', () => {
        console.log('[APP] App desconectada');
    });
});

// 7. INICIAR SERVIDOR
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('SERVER ARDUINO INICIADO');
    console.log('========================================');
    console.log('Puerto:', PORT);
    console.log('Arduino:', PUERTO_ARDUINO);
    console.log('========================================');
});

// 8. MANEJAR ERRORES GENERALES
process.on('uncaughtException', (error) => {
    console.log('[ERROR] Error inesperado:', error.message);
});

process.on('SIGINT', () => {
    console.log('\n[STOP] Servidor detenido');
    if (serialPort) serialPort.close();
    process.exit();
});