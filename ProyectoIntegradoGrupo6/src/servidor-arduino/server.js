
//Servidor de prueba

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

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());

// 3. CONFIGURAR PUERTO SERIAL
const PUERTO_ARDUINO = 'COM5';
let serialPort;

try {

    serialPort = new SerialPort({
        path: PUERTO_ARDUINO,
        baudRate: 9600
    });

    console.log('[OK] Intentando conectar con Arduino...');

} catch (error) {

    console.log('[ERROR] Error al conectar:', error.message);

}

// 4. ESTADO DE LOS SENSORES

let sensorValue = 0;

let alturaValue = 0;

// 5. LEER DATOS DEL ARDUINO

if (serialPort) {

    const parser = serialPort.pipe(
        new ReadlineParser({ delimiter: '\n' })
    );

    parser.on('data', (line) => {

        line = line.trim();

        console.log('[ARDUINO]', line);

        // SENSOR DE HUMEDAD

        if (line.startsWith('SENSOR:')) {

            sensorValue = parseInt(line.split(':')[1]);

            if (Number.isFinite(sensorValue)) {

                io.emit('sensor_data', {
                    value: sensorValue
                });

            }

        }

        // SENSOR DE CRECIMIENTO

        if (line.startsWith('ALTURA:')) {

            alturaValue = parseFloat(line.split(':')[1]);

            if (Number.isFinite(alturaValue)) {

                console.log('[CRECIMIENTO] Altura:', alturaValue, 'cm');

                io.emit('sensor_data', {
                    value: alturaValue
                });

            } else {

                console.log('[ERROR] Valor de altura no válido');

            }

        }

    });

    serialPort.on('error', (error) => {

        console.log('[ERROR] Error en el puerto:', error.message);

    });

    serialPort.on('open', () => {

        console.log('[OK] Arduino conectado en:', PUERTO_ARDUINO);

    });

    serialPort.on('close', () => {

        console.log('[WARN] Puerto Arduino cerrado');

    });

}

// 6. MANEJAR CONEXIONES DE LA APP

io.on('connection', (socket) => {

    console.log('[APP] App conectada:', socket.id);

    socket.emit('sensor_data', {
        value: alturaValue
    });

    socket.on('command_led', (data) => {

        console.log('[APP] Comando:', data);

        if (!data || !data.led || !data.action) {

            console.log('[WARN] Comando invalido:', data);

            return;
        }

        if (data.action !== 'ON' && data.action !== 'OFF') {

            console.log('[WARN] Accion invalida:', data.action);

            return;
        }

        if (serialPort && serialPort.isOpen) {

            let comando;

            if (data.led === 1) {

                comando = 'LED1_' + data.action + '\n';

            } else if (data.led === 2) {

                comando = 'LED2_' + data.action + '\n';

            } else {

                console.log('[WARN] LED no valido:', data.led);

                return;
            }

            serialPort.write(comando);

            console.log('[SEND] Enviando:', comando.trim());

        } else {

            console.log('[WARN] Arduino no conectado');

            socket.emit('error', {
                message: 'Arduino no conectado'
            });

        }

    });

    socket.on('disconnect', () => {

        console.log('[APP] App desconectada:', socket.id);

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

    if (serialPort && serialPort.isOpen) {

        serialPort.close();

    }

    process.exit();

});
