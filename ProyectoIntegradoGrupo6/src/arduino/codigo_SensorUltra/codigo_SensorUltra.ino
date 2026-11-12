int TRIG = 9;
int ECHO = 10;

void setup() {
    Serial.begin(9600);

    pinMode(TRIG, OUTPUT);
    pinMode(ECHO, INPUT);
}

void loop() {

    long duracion;
    float distancia;

    digitalWrite(TRIG, LOW);
    delayMicroseconds(2);

    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);

    digitalWrite(TRIG, LOW);

    duracion = pulseIn(ECHO, HIGH, 30000);

    if (duracion > 0) {

        distancia = (duracion * 0.0343) / 2;

        if (distancia > 0 && distancia <= 40) {

            Serial.print("DISTANCIA:");
            Serial.println(distancia, 1);

        } else {

            Serial.println("DISTANCIA:0");

        }

    } else {

        Serial.println("DISTANCIA:0");

    }

    delay(200);
}