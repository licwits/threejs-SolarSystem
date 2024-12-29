uniform vec3 glowColor;
uniform float intensity;
uniform float power;
uniform float time;
uniform sampler2D coverTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main(){
  // 计算视线方向
  vec3 viewDir=normalize(vViewPosition);
  
  // 菲涅尔效果
  float fresnel=pow(1.-dot(vNormal,viewDir),power);
  
  // 添加时间变化的波动效果
  float wave=sin(time*.5)*.1+.9;
  
  // 从中心向外渐变
  float gradient=1.-length(vUv-vec2(.5));
  gradient=pow(gradient,2.);
  
  // 获取覆盖纹理
  vec4 coverColor=texture2D(coverTexture,vUv);
  
  // 混合所有效果
  vec3 finalColor=glowColor*fresnel*intensity*wave*gradient;
  // 与覆盖纹理混合
  finalColor=mix(finalColor,coverColor.rgb,coverColor.a*.5);
  
  gl_FragColor=vec4(finalColor,fresnel*gradient);
}