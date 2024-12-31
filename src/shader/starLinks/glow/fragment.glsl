uniform vec3 color;
uniform float opacity;
uniform float glowIntensity;
uniform float time;

varying vec2 vUv;
varying vec3 vPosition;

void main(){
  // 基础发光强度
  float glow=1.-length(vPosition.xy);
  glow=pow(glow,3.);
  
  // 添加时间变化的脉冲效果
  float pulse=sin(time*2.)*.2+.8;
  
  // 最终颜色
  vec3 finalColor=color*glowIntensity*(glow*pulse);
  float alpha=opacity*glow;
  
  gl_FragColor=vec4(finalColor,alpha);
}