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
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());


// 3. CONFIGURAR PUERTO SERIAL

const PUERTO_ARDUINO = 'COM5';

let serialPort;

try {

    serialPort = new SerialPort({
        path: PUERTO_ARDUINO,
        baudRate: 9600
    });

    console.log('[OK] Conectando al Arduino...');

} catch (error) {

    console.log('[ERROR] Error al conectar:', error.message);

}

// 4. ESTADO DE LOS SENSORES Y HISTORIAL

let sensorValue = 0;

let distanciaValue = 0;

let zonaAnterior = 'NINGUNA';

let historial = [];

// FUNCION PARA GUARDAR REGISTROS

function registrarRegistro(tipo, nombre, valor) {

    const registro = {
        id: Date.now(),
        tipo: tipo,
        nombre: nombre,
        valor: valor,
        fecha: new Date().toISOString()
    };

    historial.unshift(registro);

    // Mantener solamente los últimos 100 registros
    if (historial.length > 100) {
        historial.pop();
    }

    // Enviar el nuevo registro a la aplicación
    io.emit('historial_update', registro);

    console.log('[HISTORIAL]', registro);

}

// IDENTIFICAR ZONA DEL SENSOR ULTRASONICO

function identificarZona(distancia) {

    if (distancia >= 7 && distancia <= 13) {

        return 'A';

    }

    if (distancia >= 27 && distancia <= 33) {
        return 'B';

    }
    return 'NINGUNA';

}

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

            sensorValue = parseFloat(line.split(':')[1]);

            if (Number.isFinite(sensorValue)) {

                io.emit('sensor_data', {
                    value: sensorValue
                });

                registrarRegistro(
                    'Sensor',
                    'Sensor de humedad',
                    sensorValue
                );

            }

        }

        // SENSOR ULTRASONICO - CRECIMIENTO

        if (line.startsWith('DISTANCIA:')) {

            distanciaValue = parseFloat(line.split(':')[1]);

            if (Number.isFinite(distanciaValue)) {

                let zonaActual = identificarZona(distanciaValue);

                console.log(
                    '[CRECIMIENTO] Distancia:',
                    distanciaValue,
                    'cm - Zona:',
                    zonaActual
                );

                // Enviar distancia a la aplicación
                io.emit('plant_distance', {
                    value: distanciaValue,
                    zona: zonaActual
                });

                // Registrar solamente cuando entra a una zona nueva
                if (zonaActual !== zonaAnterior) {

                    if (zonaActual === 'A') {

                        registrarRegistro(
                            'Sensor',
                            'Sensor ultrasónico - Lado A',
                            distanciaValue.toFixed(1) + ' cm'
                        );

                    } else if (zonaActual === 'B') {

                        registrarRegistro(
                            'Sensor',
                            'Sensor ultrasónico - Lado B',
                            distanciaValue.toFixed(1) + ' cm'
                        );

                    }

                    zonaAnterior = zonaActual;

                }

            }

        }

    });


    // ERROR DEL PUERTO SERIAL

    serialPort.on('error', (error) => {

        console.log('[ERROR] Error en el puerto:', error.message);

    });


    // PUERTO ABIERTO

    serialPort.on('open', () => {

        console.log('[OK] Arduino conectado en:', PUERTO_ARDUINO);

    });

}

// 6. MANEJAR CONEXIONES DE LA APP

io.on('connection', (socket) => {

    console.log('[APP] App conectada:', socket.id);


    // ENVIAR HISTORIAL AL CONECTARSE

    socket.emit('historial_data', historial);

    // ENVIAR HUMEDAD ACTUAL

    socket.emit('sensor_data', {
        value: sensorValue
    });

    // ENVIAR DISTANCIA ACTUAL DEL ULTRASONICO

    socket.emit('plant_distance', {
        value: distanciaValue,
        zona: identificarZona(distanciaValue)
    });


    // CONTROL DE LED

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
            let nombreActuador;

            if (data.led === 1) {

                comando = 'LED1_' + data.action + '\n';
                nombreActuador = 'LED 1';

            } else if (data.led === 2) {

                comando = 'LED2_' + data.action + '\n';
                nombreActuador = 'LED 2';

            } else {

                console.log('[WARN] LED no valido:', data.led);

                return;
            }

            serialPort.write(comando, (error) => {

                if (error) {

                    console.log('[ERROR] No se pudo enviar el comando:', error.message);

                } else {

                    console.log('[SEND] Enviando:', comando.trim());

                    registrarRegistro(
                        'Actuador',
                        nombreActuador,
                        data.action === 'ON' ? 'Encendido' : 'Apagado'
                    );

                }

            });

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
    console.log('Historial activado');

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
