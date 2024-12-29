uniform float time;
uniform vec3 cometColor;
uniform float tailLength;

varying vec2 vUv;
varying vec3 vPosition;

// 噪声函数
float random(vec2 st){
  return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

// 分层噪声
float noise(vec2 st){
  vec2 i=floor(st);
  vec2 f=fract(st);
  
  float a=random(i);
  float b=random(i+vec2(1.,0.));
  float c=random(i+vec2(0.,1.));
  float d=random(i+vec2(1.,1.));
  
  vec2 u=f*f*(3.-2.*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}

void main(){
  // 计算彗星头部
  float head=1.-length(vPosition.xy);
  head=smoothstep(0.,.5,head);
  
  // 计算彗星尾部
  float tail=vPosition.x+tailLength;
  tail=smoothstep(0.,tailLength,tail);
  tail*=(1.-abs(vPosition.y*2.));// 使尾部变窄
  
  // 添加动态纹理
  vec2 noiseCoord=vec2(vPosition.x*2.+time*.5,vPosition.y*4.);
  float pattern=noise(noiseCoord);
  
  // 混合头部和尾部
  float alpha=max(head,tail*.6)*pattern;
  
  // 颜色渐变
  vec3 color=mix(cometColor*.5,cometColor,tail);
  color=mix(vec3(1.),color,tail);// 头部偏白
  
  gl_FragColor=vec4(color,alpha*smoothstep(1.,0.,-vPosition.x/tailLength));
}