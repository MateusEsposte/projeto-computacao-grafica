Surface csgObject(vec3 p)
{
    float t =iTime;
    mat4 m = rotX (30. * t) * rotY (40. * t) * rotZ (50. * t)*trans(vec3( -1.2,-0.6, -2.0)) ;
    p = opTransf(p,m);
    Surface R;
    R.d = boxRoundDist((p), vec3(0.5),0.1);
    R.color = vec3(0.1,0.2,0.7); R.Ka=0.2; R.Kd=0.4;R.Ks=0.4;
    Surface S;
    S.d = sphereDist(p,vec3(0.0),0.6);
    S.color = vec3(0.1,0.2,0.7); S.Ka=0.2; S.Kd=0.4;S.Ks=0.4;
    R = subtractionS(R,S);
    return R;
}

Surface getDist(vec3 p)
{
    float ds = heartDist(p,vec3(0.0,1.0,6.0),1.0);
    Surface Sphere;
    Sphere.d = ds;
    Sphere.color = vec3 (0.9,0.1,0.05); Sphere.Ka=0.2; Sphere.Kd=0.3;Sphere.Ks=0.5;
    float dp = planeDist(p,vec3 (0.0,1.0,0.0),0.0);
    Surface Plane;
    Plane.d=dp;
    Plane.color=vec3(0.75); Plane.Ka=0.2; Plane.Kd=0.4;Plane.Ks=0.4;
    Surface d= unionS(Sphere,Plane);
    Surface CSG;
    CSG = csgObject(p);
    d=unionS(CSG,d);

    Surface rCone;
    rCone.d = roundConeDist2(p-vec3( -3.0,0.5, 4.0), vec3(0.1,0.0,0.0), vec3(0.1,2.35,0.1), 0.45, 0.15);
    rCone.color = vec3(0.1,0.6,0.7); rCone.Ka=0.2; rCone.Kd=0.4;rCone.Ks=0.4;
    d=unionS(rCone,d);
    Surface OctPrism;
    OctPrism.d = octogonPrismDist(p-vec3( 3.0,0.8,5.0), 0.7, 0.25);
    OctPrism.color = vec3(0.4,0.2,0.7); OctPrism.Ka=0.2; OctPrism.Kd=0.7;OctPrism.Ks=0.1;
    d=unionS(OctPrism,d);

    return d;
}




Surface rayMarching(vec3 Cam, vec3 rd)
{
    float d0 = 0.0;
    vec3 pi = Cam +d0*rd;
    Surface s = getDist(pi);
    int i=0;
    while ((i<MAX_STEPS)&&(s.d>SURF_DIST)&&(d0<MAX_DIST))
    {
        d0+=s.d;
        pi = Cam+d0*rd;
        s=getDist(pi);
        i++;
    }
    if(i==MAX_STEPS) d0=MAX_DIST+1.0;
    s.d=d0;
    return s;
}

vec3 estimateNormal(vec3 p)
{
    Surface sd= getDist(p);

    float dx =  getDist(vec3(p.x+EPSILON,p.y,p.z)).d-sd.d;
    float dy = getDist(vec3(p.x,p.y+EPSILON,p.z)).d-sd.d;
    float dz = getDist(vec3(p.x,p.y,p.z+EPSILON)).d-sd.d;
    return normalize(vec3(dx,dy,dz));
}




vec3  getLight(vec3 p,vec3 CamPos, Surface s) {
    vec3 lightPos =vec3(10.0,10.0,-10.0);
    float dl = length(lightPos);
    vec3 lightColor = vec3 (1.0);
    float w=2.0*PI*iTime*0.15;
    lightPos.xz=dl*vec2(cos(w),sin(w))*0.5;

    vec3 ld = lightPos-p;
    float fat = 1/length(ld);
    vec3 l = fat*ld;
    vec3 n = estimateNormal(p);
    float dif = dot(n, l);

    vec3 col= s.color*s.Ka;

    col+= s.color*s.Kd*dif*fat*20.0;
    vec3 eye = normalize(p-CamPos);
    vec3 R = normalize(reflect(n,l));
    float phi=dot(eye,R);
    if(phi>0.0)
        col+= s.Ks*lightColor*pow(phi,5.0);
    Surface sd = rayMarching(p+200.0*n*SURF_DIST, l);
    if(sd.d<length(lightPos-p)) col *= .25;

    return col;
}

mat3 SetCamera(vec3 Look_at, vec3 CamPos)
{
    vec3 cd =normalize(Look_at-CamPos);
    vec3 cv = cross(vec3(0.0,1.0,0.0),cd);
    vec3 cu = cross(cd,cv);
    return mat3(cv,cu,cd);
}


void main()
{
    vec2 p = (gl_FragCoord.xy-0.5*iResolution)/iResolution.y;


    vec3 rd = normalize(vec3(p,1.2));
    vec3 col = mix(vec3 (.01,0.1,0.1),COLOR_BACKGROUND,-p.y*0.2);
    vec2 mo = iMouse.xy/iResolution.xy;

    float am = mix(0.0,90.0,mo.x*iMouse.z);
    float bm = mix(0.0,90.0,mo.y*iMouse.z);
    mat4 Mry = rotY(am);
    mat4 Mrx = rotX(bm);
    mat4 M = Mrx*Mry;
    vec3 Cam= vec3 (0.0,3.0,-4.0);
    Cam=opTransf(Cam,M);

    vec3 Target = vec3 (0.0,1,10);
    mat3 Mc = SetCamera(Target,Cam);
    rd = Mc*rd;

    Surface s = rayMarching(Cam,rd);
    if(s.d<MAX_DIST)
    {
        vec3 po= Cam+s.d*rd;
         col= getLight(po,Cam,s);
    }

    
    //col = mix(COLOR_BACKGROUND,col,f);
    C = vec4( col, 1.0 );
}

