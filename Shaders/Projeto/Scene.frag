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


Surface getDist(vec3 p){
    Surface Car = carModel(p - vec3(-2.0, 0.0, -20.0));

    Surface Track = trackModel(p);
    Surface Markings = roadMarkingsModel(p);
    Surface Environment = environmentModel(p);

    Surface d = unionS(Car, Track);
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

    // Faróis do carro
    vec3 headlights = carHeadlights(p, viewDir, n, s);

    return ambient + globalLight + lamps + headlights;
}


mat3 SetCamera(vec3 Look_at, vec3 CamPos)
{
    vec3 cd = normalize(Look_at - CamPos);
    vec3 cv = normalize(cross(vec3(0.0, 1.0, 0.0), cd));
    vec3 cu = cross(cd, cv);

    return mat3(cv, cu, cd);
}


void main(){
    vec2 p = (gl_FragCoord.xy - 0.5 * iResolution) / iResolution.y;


    vec3 rd = normalize(vec3(p, 1.2));
    vec2 mo = iMouse.xy / iResolution.xy;

    float am = mix(0.0, 90.0, mo.x * iMouse.z);
    float bm = mix(0.0, 90.0, mo.y * iMouse.z);
    
    mat4 Mry = rotY(am);
    mat4 Mrx = rotX(bm);
    mat4 M = Mrx * Mry;
   
    vec3 Cam = vec3(-8.0, 4.5, -25.0);
    Cam = opTransf(Cam, M);

    vec3 Target = vec3(-2.0, 1.0, -20.0);
    
    mat3 Mc = SetCamera(Target, Cam);
    rd = Mc * rd;

    vec3 col = skyColor(rd);

    Surface s = rayMarching(Cam, rd);
    
    if(s.d < MAX_DIST)
    {
        vec3 po = Cam + s.d * rd;
        col = getLight(po, Cam, s);

        // Iluminação volumétrica dos postes
        col += volumetricStreetLights(Cam, rd, s.d);
    }

    
    //col = mix(COLOR_BACKGROUND,col,f);
    C = vec4( col, 1.0 );
}

