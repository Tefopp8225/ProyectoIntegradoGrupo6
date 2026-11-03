int TRIG = 9;
int ECHO = 10;

float distanciaInicial = 30.0;

bool objetoDetectado = false;

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

    if (duracion > 0) {
        distancia = (duracion * 0.0343) / 2;

        if (distancia > 0 && distancia < distanciaInicial) {

            if (objetoDetectado == false) {
                altura = distanciaInicial - distancia;

                if (altura > 0) {
                    Serial.print("ALTURA:");
                    Serial.println(altura, 1);

                    objetoDetectado = true;
                }
            }

        } else {
            objetoDetectado = false;
        }
    } else {
        objetoDetectado = false;
    }

    delay(200);
}