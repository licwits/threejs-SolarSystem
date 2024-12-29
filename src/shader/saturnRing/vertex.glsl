varying vec3 vPos;

void main(){
  vPos=position;
  vec3 viewPosition=(modelViewMatrix*vec4(position,1.)).xyz;
  gl_Position=projectionMatrix*vec4(viewPosition,1.);
}