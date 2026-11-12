Surface csgObject(vec3 p){
    float t = iTime;
    mat4 m = rotX (30. * t) * rotY (40. * t) * rotZ (50. * t) * trans(vec3(-1.2, -0.6, -2.0));
    
    p = opTransf(p, m);

    Surface R;
    R.d = boxRoundDist((p), vec3(0.5), 0.1);
    R.color = vec3(0.1, 0.2, 0.7); 
    R.Ka=0.2; 
    R.Kd=0.4;
    R.Ks=0.4;
    
    Surface S;
    S.d = sphereDist(p,vec3(0.0), 0.6);
    S.color = vec3(0.1, 0.2, 0.7); 
    S.Ka=0.2; 
    S.Kd=0.4;
    S.Ks=0.4;
    
    R = subtractionS(R, S);
    
    return R;
}

// Duração de uma volta completa, em segundos.
const float LAP_DURATION = 30.0;

// Quantidade de pontos de controle da pista.
const int TRACK_POINTS = 17;


// Retorna os pontos de controle do circuito.
vec2 trackPoint(int i)
{
    i = (i % TRACK_POINTS + TRACK_POINTS) % TRACK_POINTS;

    if (i == 0)  return vec2(-14.0, -20.0);
    if (i == 1)  return vec2(  0.0, -20.0);
    if (i == 2)  return vec2( 10.0, -20.0);
    if (i == 3)  return vec2( 18.0, -12.0);
    if (i == 4)  return vec2( 22.0, -14.0);
    if (i == 5)  return vec2( 28.0, -10.0);
    if (i == 6)  return vec2( 30.0,   0.0);
    if (i == 7)  return vec2( 24.0,   6.0);
    if (i == 8)  return vec2( 16.0,   6.0);
    if (i == 9)  return vec2(  0.0,  20.0);
    if (i == 10) return vec2(-16.0,  16.0);
    if (i == 11) return vec2(-22.0,  12.0);
    if (i == 12) return vec2(-26.0,   6.0);
    if (i == 13) return vec2(-28.0,   0.0);
    if (i == 14) return vec2(-12.0,  -6.0);
    if (i == 15) return vec2(-16.0, -12.0);

    return vec2(-16.0, -16.0);
}


// Interpolação Catmull-Rom.
vec2 catmullRom(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t)
{
    float t2 = t * t;
    float t3 = t2 * t;

    return 0.5 * (
        2.0 * p1 +
        (-p0 + p2) * t +
        (2.0*p0 - 5.0*p1 + 4.0*p2 - p3) * t2 +
        (-p0 + 3.0*p1 - 3.0*p2 + p3) * t3
    );
}


// Retorna a posição do carro na pista.
vec2 carPosition(float progress)
{
    float path = progress * float(TRACK_POINTS);

    int index = int(floor(path));
    float t = fract(path);

    vec2 p0 = trackPoint(index - 1);
    vec2 p1 = trackPoint(index);
    vec2 p2 = trackPoint(index + 1);
    vec2 p3 = trackPoint(index + 2);

    return catmullRom(p0, p1, p2, p3, t);
}


// Calcula a orientação do carro a partir da trajetória.
vec2 carDirection(float progress)
{
    float epsilon = 0.001;

    vec2 before = carPosition(progress - epsilon);
    vec2 after  = carPosition(progress + epsilon);

    return normalize(after - before);
}

vec3 carMovement(float distZ, int distX, int veloc, vec3 p){
    float progress = fract(iTime / (LAP_DURATION - veloc));

    vec2 position = carPosition(progress);
    vec2 direction = carDirection(progress);

    // Ângulo de rotação no plano XZ.
    float angle = atan(direction.y, direction.x);

    // Coordenadas relativas ao carro.
    vec3 delta = p - vec3(position.x, 0.0, position.y);

    // Transformação inversa para o sistema local do veículo.
    vec3 carLocal;

    carLocal.x = (cos(angle) * delta.x + sin(angle) * delta.z) - distX;
    carLocal.y = delta.y;
    carLocal.z = (-sin(angle) * delta.x + cos(angle) * delta.z) - distZ;

    return carLocal;
}

Surface getDist(vec3 p){
    vec3 carLocal;

    carLocal = carMovement(0, 0, 0, p);
    Surface Car = carModel(carLocal);
    
    carLocal = carMovement(0.5, 1, 2, p);
    Surface Car2 = carModel(carLocal);


    Surface Track = trackModel(p);
    Surface Markings = roadMarkingsModel(p);
    Surface Environment = environmentModel(p);

    Surface d = unionS(Car, Track);
    d = unionS(d, Car2);
    d = unionS(d, Markings);
    d = unionS(d, Environment);
    d = unionS(d, streetLampsModel(p));

    return d;
}


Surface rayMarching(vec3 Cam, vec3 rd){
    float d0 = 0.0;
    vec3 pi = Cam + d0 * rd;
    int i=0;

    Surface s = getDist(pi);

    while ((i < MAX_STEPS) && (s.d > SURF_DIST) && (d0 < MAX_DIST)){
        d0 += s.d;
        pi = Cam + d0 * rd;
        s = getDist(pi);
        i++;
    }

    if(i == MAX_STEPS){
        d0 = MAX_DIST + 1.0;
    }

    s.d = d0;
    
    return s;
}


vec3 estimateNormal(vec3 p){
    Surface sd = getDist(p);

    float dx = getDist(vec3(p.x + EPSILON, p.y, p.z)).d - sd.d;
    float dy = getDist(vec3(p.x, p.y + EPSILON, p.z)).d - sd.d;
    float dz = getDist(vec3(p.x, p.y, p.z + EPSILON)).d - sd.d;
    
    return normalize(vec3(dx, dy, dz));
}



vec3 getLight(vec3 p, vec3 CamPos, Surface s)
{
    vec3 n = estimateNormal(p);
    vec3 viewDir = normalize(CamPos - p);

    // Iluminação ambiente reduzida
    vec3 ambient = s.color * 0.20;

    // Luz global reduzida
    vec3 lightDir = normalize(vec3(-0.4, 1.0, -0.3));
    float diffuse = max(dot(n, lightDir), 0.0);

    vec3 globalLight = s.color * diffuse * 0.30;

    // Iluminação dos seis postes
    vec3 lamps = streetLights(p, viewDir, n, s);

    return ambient + globalLight + lamps;
}


mat3 SetCamera(vec3 Look_at, vec3 CamPos)
{
    vec3 cd = normalize(Look_at - CamPos);
    vec3 cv = normalize(cross(vec3(0.0, 1.0, 0.0), cd));
    vec3 cu = cross(cd, cv);

    return mat3(cv, cu, cd);
}



void main()
{
    vec2 p = (gl_FragCoord.xy - 0.5 * iResolution) / iResolution.y;

    vec3 rd = normalize(vec3(p, 1.2));

    // Progresso atual do carro na pista.
    float progress = fract(iTime / LAP_DURATION);

    // Posição e direção do veículo.
    vec2 position = carPosition(progress);
    vec2 direction = carDirection(progress);

    // Converte a trajetória 2D para coordenadas 3D.
    vec3 carPos = vec3(position.x, 0.0, position.y);
    vec3 forward = normalize(vec3(direction.x, 0.0, direction.y));

    // Distância e altura da câmera em relação ao carro.
    float cameraDistance = 8.0;
    float cameraHeight = 3.5;

    // Posição da câmera: atrás e acima do veículo.
    vec3 Cam = carPos
             - forward * cameraDistance
             + vec3(0.0, cameraHeight, 0.0);

    // Ponto para onde a câmera olha.
    // Olhar um pouco à frente ajuda a antecipar as curvas.
    vec3 Target = carPos
                + forward * 4.0
                + vec3(0.0, 0.9, 0.0);

    // Orientação da câmera.
    mat3 Mc = SetCamera(Target, Cam);
    rd = Mc * rd;

    // Cor do céu.
    vec3 col = skyColor(rd);

    // Ray marching.
    Surface s = rayMarching(Cam, rd);

    if (s.d < MAX_DIST)
    {
        vec3 po = Cam + s.d * rd;

        col = getLight(po, Cam, s);

        // Iluminação volumétrica dos postes.
        col += volumetricStreetLights(Cam, rd, s.d);
    }

    C = vec4(col, 1.0);
}


