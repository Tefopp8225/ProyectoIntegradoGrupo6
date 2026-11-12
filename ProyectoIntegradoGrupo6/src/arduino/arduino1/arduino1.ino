#include <Servo.h>

const int pinBomba = 3;  
const int pinSensorHumedad1 = A0;
const int pinSensorHumedad2 = A1;

// Servo 1 del techo en el PIN 2 (Rotación continua de 360°)
Servo techoServo1;
const int pinServo1 = 2;

void setup() {
    Serial.begin(9600);
    pinMode(pinBomba, OUTPUT);
    pinMode(pinSensorHumedad1, INPUT);
    pinMode(pinSensorHumedad2, INPUT);
    
    digitalWrite(pinBomba, LOW);

    // Inicializar el Servo 1 detenido (90)
    techoServo1.attach(pinServo1);
    techoServo1.write(90); 
}

void loop() {
    int valorHumedad1 = analogRead(pinSensorHumedad1);
    int valorHumedad2 = analogRead(pinSensorHumedad2);

    // Procesar comandos del servidor
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();

        if (command == "VENTANA_ABRIR") {
            techoServo1.write(0);   // Gira en un sentido para abrir
            delay(1500);            // Tiempo de apertura (ajústalo si es necesario)
            techoServo1.write(90);  // Se detiene
            Serial.println("TECHO1_ABIERTO");
            
        } 
        else if (command == "VENTANA_CERRAR") {
            techoServo1.write(180); // Gira en sentido contrario para cerrar
            delay(1500);            // Mismo tiempo de movimiento
            techoServo1.write(90);  // Se detiene
            Serial.println("TECHO1_CERRADO");
        }

        if (command == "BOMBA_ON") {
            digitalWrite(pinBomba, HIGH);
            Serial.println("BOMBA_ENCENDIDA");
        } else if (command == "BOMBA_OFF") {
            digitalWrite(pinBomba, LOW);
            Serial.println("BOMBA_APAGADA");
        }
    }

    // Enviar datos de humedad al servidor cada 2 segundos
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