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
    Surface Car = carModel(
        p - vec3(0.0, 0.0, -1.3)
    );

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

    // Iluminação ambiente
    vec3 col = s.color * s.Ka;

    // Iluminação dos postes
    vec3 lampColor = vec3(1.0, 0.72, 0.38);

    // Iluminação dos postes
    col += pointLight(p, viewDir, n, s,
        vec3(-12.0, 4.85, -4.0), lampColor, 15.0);

    col += pointLight(p, viewDir, n, s,
        vec3(0.0, 4.85, 4.0), lampColor, 15.0);

    col += pointLight(p, viewDir, n, s,
        vec3(12.0, 4.85, -4.0), lampColor, 15.0);

    // Iluminação dos faróis
    vec3 headlightColor = vec3(1.0, 0.88, 0.68);
    vec3 headlightDir = vec3(1.0, 0.0, 0.0);

    col += spotLight(p, viewDir, n, s,
        vec3(1.43, 0.43, -1.73),
        headlightDir, headlightColor, 15.0);

    col += spotLight(p, viewDir, n, s,
        vec3(1.43, 0.43, -0.87),
        headlightDir, headlightColor, 15.0);

    return col;
}


mat3 SetCamera(vec3 Look_at, vec3 CamPos){
    vec3 cd = normalize(Look_at - CamPos);
    vec3 cv = cross(vec3(0.0, 1.0, 0.0), cd);
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
   
    vec3 Cam = vec3 (-8.0, 4.0, -6.0);
    Cam = opTransf(Cam, M);

    vec3 Target = vec3 (-4.0, 1, -2.0);
    mat3 Mc = SetCamera(Target, Cam);
    rd = Mc * rd;

    vec3 col = skyColor(rd);

    Surface s = rayMarching(Cam, rd);
    
    if(s.d<MAX_DIST){
        vec3 po = Cam + s.d * rd;
         col = getLight(po, Cam, s);
    }

    
    //col = mix(COLOR_BACKGROUND,col,f);
    C = vec4( col, 1.0 );
}

