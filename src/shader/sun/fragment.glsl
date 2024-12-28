uniform sampler2D sunTexture;
uniform sampler2D coverTexture;
uniform float time;
uniform float flowSpeed;
uniform float disturbanceScale;
uniform float glowIntensity;
uniform float brightnessVariation;
uniform float emissiveIntensity;

varying vec2 vUv;
varying vec3 vNormal;

// 噪声函数
float noise(vec2 p){
  return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);
}

void main(){
  // 基础UV坐标
  vec2 baseUV=vUv;
  
  // 添加流动效果
  vec2 flowUV=baseUV+vec2(
    sin(baseUV.y*10.+time*flowSpeed)*.01,
    cos(baseUV.x*10.+time*flowSpeed)*.01
  );
  
  // 获取基础纹理颜色
  vec4 baseColor=texture2D(sunTexture,flowUV);
  vec4 coverColor=texture2D(coverTexture,flowUV);
  
  // 边缘发光效果
  float fresnel=pow(1.-dot(vNormal,vec3(0.,0.,1.)),3.);
  vec3 glowColor=vec3(1.,.4,.1);
  
  // 添加表面扰动
  float disturbance=noise(flowUV*10.+time*.1)*disturbanceScale;
  
  // 混合纹理和发光
  vec3 finalColor=mix(baseColor.rgb,coverColor.rgb,coverColor.a);
  finalColor+=glowColor*fresnel*glowIntensity;
  finalColor+=disturbance*glowColor;
  
  // 添加亮度变化
  float brightness=1.+sin(time*.5)*brightnessVariation;
  finalColor*=brightness*emissiveIntensity;
  
  gl_FragColor=vec4(finalColor,1.);
}
