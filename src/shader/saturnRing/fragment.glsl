uniform sampler2D ringTexture;
uniform float innerRadius;
uniform float outerRadius;

varying vec3 vPos;

vec4 color(){
  vec2 uv=vec2(0.);
  uv.x=(length(vPos)-innerRadius)/(outerRadius-innerRadius);
  if(uv.x<0.||uv.x>1.){
    discard;
  }
  
  vec4 pixel=texture2D(ringTexture,uv);
  return pixel;
}

void main(){
  gl_FragColor=color();
}