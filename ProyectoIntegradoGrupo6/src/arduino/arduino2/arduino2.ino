// Pines para Crecimiento (Sensor Ultrasónico)
const int TRIG = 9;
const int ECHO = 10;
float distanciaInicial = 30.0;

// Pines para Ambiente y Actuadores
const int pinSensorTemperatura = A2;
const int pinVentilador = 4;

// Luces
const int pinLed1Calle = 7;
const int pinLed2Calle = 8;
const int pinLedSol = 11;
const int pinLDR = A3;

void setup() {
    Serial.begin(9600);

    pinMode(TRIG, OUTPUT);
    pinMode(ECHO, INPUT);
    pinMode(pinSensorTemperatura, INPUT);
    pinMode(pinVentilador, OUTPUT);
    pinMode(pinLed1Calle, OUTPUT);
    pinMode(pinLed2Calle, OUTPUT);
    pinMode(pinLedSol, OUTPUT);
    pinMode(pinLDR, INPUT);

    digitalWrite(pinVentilador, LOW);
    digitalWrite(pinLed1Calle, LOW);
    digitalWrite(pinLed2Calle, LOW);
    digitalWrite(pinLedSol, HIGH);
}

void loop() {
    // 1. Ultrasónico
    long duracion;
    float distancia, altura;

    digitalWrite(TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);

    duracion = pulseIn(ECHO, HIGH, 30000);
    if (duracion > 0) {
        distancia = (duracion * 0.0343) / 2;
        if (distancia > 0 && distancia < distanciaInicial) {
            altura = distanciaInicial - distancia;
            if (altura > 0) {
                Serial.print("ALTURA:");
                Serial.println(altura, 1);
            }
        }
    }

    // 2. Temperatura y LDR
    int lecturaTemp = analogRead(pinSensorTemperatura);
    float voltaje = lecturaTemp * (5.0 / 1023.0);
    float temperaturaC = (voltaje - 0.5) * 100.0;
    int valorLDR = analogRead(pinLDR);

    static unsigned long lastSend = 0;
    if (millis() - lastSend > 2000) {
        lastSend = millis();
        Serial.print("SENSOR_TEMPERATURA:");
        Serial.println(temperaturaC, 1);
        Serial.print("LDR_VALOR:");
        Serial.println(valorLDR);
    }

    // 3. Procesar comandos del servidor
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();

        if (command == "VENTILADOR_ON") {
            digitalWrite(pinVentilador, HIGH);
            Serial.println("VENTILADOR_ENCENDIDO");
        } else if (command == "VENTILADOR_OFF") {
            digitalWrite(pinVentilador, LOW);
            Serial.println("VENTILADOR_APAGADO");
        }
        else if (command == "LEDSOL_ON") {
            digitalWrite(pinLedSol, HIGH);
            Serial.println("LEDSOL_ENCENDIDO");
        } else if (command == "LEDSOL_OFF") {
            digitalWrite(pinLedSol, LOW);
            Serial.println("LEDSOL_APAGADO");
        }
        else if (command == "LED1Calle_ON") {
            digitalWrite(pinLed1Calle, HIGH);
            Serial.println("LED1Calle_ENCENDIDO");
        } else if (command == "LED1Calle_OFF") {
            digitalWrite(pinLed1Calle, LOW);
            Serial.println("LED1Calle_APAGADO");
        }
        else if (command == "LED2Calle_ON") {
            digitalWrite(pinLed2Calle, HIGH);
            Serial.println("LED2Calle_ENCENDIDO");
        } else if (command == "LED2Calle_OFF") {
            digitalWrite(pinLed2Calle, LOW);
            Serial.println("LED2Calle_APAGADO");
        }
    }

    delay(100);
}