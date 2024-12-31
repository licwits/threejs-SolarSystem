uniform vec3 color;
uniform float opacity;
uniform float time;

varying vec2 vUv;

void main(){
  // 计算到中心的距离
  vec2 center=vec2(.5);
  float dist=length(gl_PointCoord-center);
  
  // 创建柔和的圆形渐变
  float alpha=1.-smoothstep(.3,.7,dist);
  
  // 添加脉冲效果
  float pulse=sin(time*1.5)*.15+1.;
  alpha*=pulse;
  
  // 添加中心亮点
  float centerGlow=1.-smoothstep(0.,.25,dist);
  centerGlow=pow(centerGlow,4.);
  
  // 应用整体透明度
  alpha*=opacity;
  
  // 最终颜色
  vec3 finalColor=color*(2.+pulse+centerGlow*4.);
  
  gl_FragColor=vec4(finalColor,alpha);
}