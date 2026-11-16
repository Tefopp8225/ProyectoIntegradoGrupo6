#include <Servo.h>

// --- RIEGO ---
const int pinBomba = 3;
const int pinSensorHumedad1 = A0;
const int pinSensorHumedad2 = A1;

// --- VENTANA (DOS SERVOS) ---
Servo techoServo1;
Servo techoServo2;
const int pinServo1 = 2;
const int pinServo2 = 5;

const int SERVO_PARADO = 90;
const int SERVO_ABRIR  = 0;
const int SERVO_CERRAR = 180;
const unsigned long TIEMPO_VENTANA = 130;

void setup() {
    Serial.begin(9600);

    pinMode(pinBomba, OUTPUT);
    pinMode(pinSensorHumedad1, INPUT);
    pinMode(pinSensorHumedad2, INPUT);

    digitalWrite(pinBomba, LOW);

    // Inicializar ambos servos detenidos
    techoServo1.attach(pinServo1);
    techoServo1.write(SERVO_PARADO);
    techoServo2.attach(pinServo2);
    techoServo2.write(SERVO_PARADO);
}

void loop() {
    int valorHumedad1 = analogRead(pinSensorHumedad1);
    int valorHumedad2 = analogRead(pinSensorHumedad2);

    // --- COMANDOS DEL SERVIDOR ---
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();

        // BOMBA
        if (command == "BOMBA_ON") {
            digitalWrite(pinBomba, HIGH);
            Serial.println("BOMBA_ENCENDIDA");
        } else if (command == "BOMBA_OFF") {
            digitalWrite(pinBomba, LOW);
            Serial.println("BOMBA_APAGADA");
        }

        // VENTANA: ambos servos giran juntos
        else if (command == "VENTANA_ABRIR") {
            techoServo1.write(SERVO_ABRIR);
            techoServo2.write(SERVO_CERRAR);
            delay(TIEMPO_VENTANA);
            techoServo1.write(SERVO_PARADO);
            techoServo2.write(SERVO_PARADO);
            Serial.println("VENTANA_ABIERTA");
        } else if (command == "VENTANA_CERRAR") {
            techoServo1.write(SERVO_CERRAR);
            techoServo2.write(SERVO_ABRIR);
            delay(TIEMPO_VENTANA);
            techoServo1.write(SERVO_PARADO);
            techoServo2.write(SERVO_PARADO);
            Serial.println("VENTANA_CERRADA");
        }
    }

    // --- ENVIAR HUMEDAD CADA 2 SEGUNDOS ---
    static unsigned long lastSend = 0;
    if (millis() - lastSend > 2000) {
        lastSend = millis();
        Serial.print("SENSOR1_HUMEDAD:");
        Serial.println(valorHumedad1);
        Serial.print("SENSOR2_HUMEDAD:");
        Serial.println(valorHumedad2);
    }

    delay(50);
}