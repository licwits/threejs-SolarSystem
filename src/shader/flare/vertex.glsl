uniform float time;
uniform float progress;
uniform float arcHeight;
uniform float startAngle;
uniform float arcWidth;

varying vec2 vUv;
varying float vProgress;

void main(){
  vUv=uv;
  vProgress=progress;
  
  // 计算弧形路径
  float baseRadius=5.;
  float currentAngle=startAngle+arcWidth*progress;
  float heightProgress=sin(progress*3.14159);
  float currentHeight=arcHeight*heightProgress;
  
  // 变换位置
  vec3 pos=position;
  pos.x+=cos(currentAngle)*(baseRadius+currentHeight);
  pos.y+=sin(currentAngle)*(baseRadius+currentHeight);
  
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
}