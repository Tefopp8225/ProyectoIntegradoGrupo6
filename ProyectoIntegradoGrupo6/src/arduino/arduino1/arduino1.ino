#include <Servo.h>

// --- RIEGO Y HUMEDAD ---
const int pinBomba = 3;
const int pinSensorHumedad1 = A0;
const int pinSensorHumedad2 = A1;

// --- TECHO / VENTANA ---
Servo servo360; // Pin 2: Servo de rotación continua (360°)
Servo servo180; // Pin 6: Servo posicional (180°)

const int pinServo360 = 2; 
const int pinServo180 = 6; 

// Calibración del Servo 360° (Invertidos para que al abrir cierre y viceversa)
const int SERVO_360_PARADO = 90;
const int SERVO_360_GIRAR_ABRIR = 40; // Antes era 40, ahora invierte el sentido al abrir
const int SERVO_360_GIRAR_CERRAR = 140;   // Antes era 140, ahora invierte el sentido al cerrar

// Tiempo de giro (puedes ajustarlo si necesitas más o menos recorrido)
const unsigned long TIEMPO_GIRAR = 250; 

// Posiciones para el Servo de 180°
const int ANGULO_180_ABRIR = 90; 
const int ANGULO_180_CERRAR = 0;

void setup() {
    Serial.begin(9600);

    pinMode(pinBomba, OUTPUT);
    pinMode(pinSensorHumedad1, INPUT);
    pinMode(pinSensorHumedad2, INPUT);

    digitalWrite(pinBomba, LOW);

    // Inicializar servos
    servo360.attach(pinServo360);
    servo360.write(SERVO_360_PARADO);

    servo180.attach(pinServo180);
    servo180.write(ANGULO_180_CERRAR);
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

        // VENTANA: ABRIR
        else if (command == "VENTANA_ABRIR") {
            // 1. Mover el servo de 180° a su posición abierta
            servo180.write(ANGULO_180_ABRIR);
            delay(50);
            
            // 2. Girar el de 360° con el nuevo sentido de apertura y detenerlo en 90
            servo360.write(SERVO_360_GIRAR_ABRIR);
            delay(TIEMPO_GIRAR);
            servo360.write(SERVO_360_PARADO);
            
            Serial.println("VENTANA_ABIERTA");
        } 
        // VENTANA: CERRAR
        else if (command == "VENTANA_CERRAR") {
            // 1. Regresar el servo de 180° a 0°
            servo180.write(ANGULO_180_CERRAR);
            delay(50);
            
            // 2. Girar el de 360° con el nuevo sentido de cierre y detenerlo en 90
            servo360.write(SERVO_360_GIRAR_CERRAR);
            delay(TIEMPO_GIRAR);
            servo360.write(SERVO_360_PARADO);
            
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