uniform sampler2D ringTexture;
uniform float innerRadius;
uniform float outerRadius;

varying vec3 vPos;

/**
 * @description 计算土星环的颜色
 * @returns {vec4} 最终的颜色值
 */
vec4 color(){
  // 初始化UV坐标
  vec2 uv=vec2(0.);
  
  // 将顶点到中心的距离映射到[0,1]区间作为UV的x坐标
  // 通过内外半径差值进行归一化
  uv.x=(length(vPos)-innerRadius)/(outerRadius-innerRadius);
  
  // 如果UV坐标超出有效范围则丢弃该片元
  if(uv.x<0.||uv.x>1.){
    discard;
  }
  
  // 从纹理中采样颜色
  vec4 pixel=texture2D(ringTexture,uv);
  return pixel;
}

/**
 * @description 片元着色器主函数
 */
void main(){
  // 设置片元颜色
  gl_FragColor=color();
}