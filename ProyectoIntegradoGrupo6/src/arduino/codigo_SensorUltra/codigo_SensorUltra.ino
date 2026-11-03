
// Definición de pines
int TRIG = 9;   // Pin TRIG del HC-SR04
int ECHO = 10;  // Pin ECHO del HC-SR04

// Distancia inicial desde el sensor hasta el suelo
float distanciaInicial = 30.0;

void setup() {
  Serial.begin(9600);     // Inicializa comunicación serial
  pinMode(TRIG, OUTPUT);  // TRIG como salida
  pinMode(ECHO, INPUT);   // ECHO como entrada
}

void loop() {
  long duracion;
  float distancia;
  float altura;

  // Aseguramos que TRIG esté en bajo
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);

  // Enviamos un pulso de 10 microsegundos
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  // Medimos el tiempo que tarda en llegar el eco
  duracion = pulseIn(ECHO, HIGH, 30000);

  // Calculamos la distancia en centímetros
  distancia = (duracion * 0.0343) / 2;

  // Calculamos la altura de la planta
  altura = distanciaInicial - distancia;

  // Evitamos valores negativos
  if (altura < 0) {
    altura = 0;
  }

  // Enviamos la altura al servidor
  if (duracion > 0) {

    Serial.print("ALTURA:");
    Serial.println(altura, 1);

  }

  delay(500); // Espera medio segundo antes de medir nuevamente
}
