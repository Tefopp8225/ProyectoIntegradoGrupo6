
int TRIG = 9;
int ECHO = 10;

float distanciaInicial = 30.0;

void setup() {
    Serial.begin(9600);

    pinMode(TRIG, OUTPUT);
    pinMode(ECHO, INPUT);
}

void loop() {

    long duracion;
    float distancia;
    float altura;

    digitalWrite(TRIG, LOW);
    delayMicroseconds(2);

    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);

    digitalWrite(TRIG, LOW);

    duracion = pulseIn(ECHO, HIGH, 30000);

    // Comprobar si el sensor recibió una respuesta
    if (duracion > 0) {

        distancia = (duracion * 0.0343) / 2;

        // Ignorar lecturas fuera del rango válido
        if (distancia > 0 && distancia < distanciaInicial) {

            altura = distanciaInicial - distancia;

            if (altura > 0) {

                Serial.print("ALTURA:");
                Serial.println(altura, 1);

            }

        }

    }

    delay(500);
}
