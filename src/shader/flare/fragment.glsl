uniform sampler2D flareTexture;
uniform float opacity;
uniform float time;

varying vec2 vUv;
varying float vProgress;

void main(){
  vec4 texColor=texture2D(flareTexture,vUv);
  
  // 添加扭曲效果
  float distortion=sin(vUv.y*10.+time*2.)*.1;
  vec2 distortedUV=vUv+vec2(distortion,0.);
  
  // 添加流光效果
  float glow=sin(vUv.x*3.14159+time*3.)*.5+.5;
  
  // 计算渐变透明度
  float fadeOpacity=opacity*(1.-vProgress*vProgress);
  
  // 混合颜色
  vec3 color=texColor.rgb;
  color+=vec3(1.,.6,.2)*glow*.3;
  
  gl_FragColor=vec4(color,texColor.a*fadeOpacity);
}