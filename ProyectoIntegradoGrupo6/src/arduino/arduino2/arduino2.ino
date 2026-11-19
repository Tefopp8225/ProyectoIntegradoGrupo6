// Pines para Crecimiento (Sensor Ultrasónico)
const int TRIG = 9;
const int ECHO = 10;
float distanciaMaxima = 40.0; 

// Pines para Ambiente y Actuadores
const int pinSensorTemperatura = A2;
const int pinVentilador = 4;

// Luces
const int pinLed1Calle = 7;
const int pinLed2Calle = 8;
const int pinLedSol = 11; 
const int pinLDR = A3;

const int UMBRAL_LUZ = 15; 

// Variables para la simulación gradual de temperatura
float temperaturaSimulada = 25.0; // Inicia en 25.0°C
const float TEMP_MAXIMA = 26.0;     // Temperatura ambiente normal (ventilador apagado)
const float TEMP_MINIMA = 21.0;     // Temperatura mínima al enfriar (ventilador encendido)

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
    digitalWrite(pinLedSol, LOW);
}

void loop() {
    // 1. Ultrasónico de Crecimiento
    digitalWrite(TRIG, LOW);
    delayMicroseconds(5);
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);

    long duracion = pulseIn(ECHO, HIGH, 40000); 
    if (duracion > 0) {
        float distancia = (duracion * 0.0343) / 2;
        if (distancia > 2 && distancia <= distanciaMaxima) {
            Serial.print("ALTURA:");
            Serial.println(distancia, 1);
        }
    }

    // 2. Descenso o ascenso gradual de la temperatura según el ventilador
    if (digitalRead(pinVentilador) == HIGH) {
        // Si está encendido, baja de a 0.5 grados hasta llegar a 22.0°C
        if (temperaturaSimulada > TEMP_MINIMA) {
            temperaturaSimulada -= 0.5;
        }
    } else {
        // Si está apagado, sube de a 0.5 grados de regreso hasta los 25.0°C
        if (temperaturaSimulada < TEMP_MAXIMA) {
            temperaturaSimulada += 0.5;
        }
    }

    // LDR y Luz Automática
    int valorLDR = analogRead(pinLDR);
    bool esDeNoche = (valorLDR < UMBRAL_LUZ); 
    if (esDeNoche) {
        digitalWrite(pinLedSol, HIGH);
    } else {
        digitalWrite(pinLedSol, LOW);
    }

    // Enviar datos al servidor cada 2 segundos
    static unsigned long lastSend = 0;
    if (millis() - lastSend > 2000) {
        lastSend = millis();
        Serial.print("SENSOR_TEMPERATURA:");
        Serial.println(temperaturaSimulada, 1); // Envía con 1 decimal (ej. 24.5)
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
        else if (command == "LED1Calle_ON") {
            digitalWrite(pinLed1Calle, HIGH);
            Serial.println("LED1Calle_ENCENDIDO");
        } else if (command == "LED1Calle_OFF") {
            digitalWrite(pinLed1Calle, LOW);
            Serial.println("LED1Calle_APAGADA");
        }
        else if (command == "LED2Calle_ON") {
            digitalWrite(pinLed2Calle, HIGH);
            Serial.println("LED2Calle_ENCENDIDO");
        } else if (command == "LED2Calle_OFF") {
            digitalWrite(pinLed2Calle, LOW);
            Serial.println("LED2Calle_APAGADA");
        }
    }

    delay(300);
}