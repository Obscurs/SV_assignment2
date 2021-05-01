#version 330

smooth in vec3 tex_coords;
smooth in vec3 position;
uniform mat4 view;
uniform vec3 camera_pos;
uniform sampler3D volume;
uniform bool phong;
uniform bool skip;

out vec4 frag_color;
float stepsize = 0.004f;

vec3 lightPos = vec3(1.0f,1.0f,1.0f);
vec3 lightColor = vec3(1.0f,1.0f,1.0f);
vec3 world_to_tex(vec3 world_coords)
{
    return world_coords + vec3(0.5f,0.5f,0.5f);
}
vec3 tex_to_world(vec3 tex_coor)
{
    return tex_coor - vec3(0.5f,0.5f,0.5f);
}





vec3 get_normal_from_volume(sampler3D volume, vec3 coords, float delta)
{
    vec3 d1, d2;
    d1.x = texture(volume, coords-vec3(delta,0.0f,0.0f)).x;
    d2.x = texture(volume, coords+vec3(delta,0.0f,0.0f)).x;

    d1.y = texture(volume, coords-vec3(0.0f, delta,0.0f)).y;
    d2.y = texture(volume, coords+vec3(0.0f,delta,0.0f)).y;

    d1.z = texture(volume, coords-vec3(0.0f,0.0f, delta)).z;
    d2.z = texture(volume, coords+vec3(0.0f, 0.0f,delta)).z;

    return normalize((d1-d2)/2.0f);
}


void main (void) {
  vec4 value;
  float scalar;
  vec4 dst = vec4(0.0f,0.0f,0.0f,0.0f);
  vec3 position_ = tex_to_world(tex_coords);
  vec3 direction = position_ - camera_pos;
  direction = normalize(direction);
  float last_scalar = 0.0f;
  for(int i = 0; i < 400; ++i)
  {
  //access to value in volume
    value = texture(volume,world_to_tex(position_));
    scalar = value.r;
    // apply transfer function
    //vec4 src = texture(SamplerTransferFunction, scalar);
    vec4 src = vec4(value.r,value.r,value.r,scalar);
    if(phong)
    {
        vec3 color = vec3(value.r,value.r,value.r);
        // ambient
        vec3 ambient = 0.5 * color;
        // diffuse
        vec3 lightDir = normalize(lightPos - position_);
        vec3 normal = get_normal_from_volume(volume,world_to_tex(position_),stepsize*1.0f);
        //vec3 normal = get_normal_from_volume(view,color,sign(scalar-last_scalar));
        float diff = max(dot(lightDir, normal), 0.0);
        vec3 diffuse = diff * color;
        // specular
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = 0.0f;

        vec3 halfwayDir = normalize(lightDir + direction);
        spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
        vec3 specular = vec3(0.1) * spec; // assuming bright white light color
        src.rgb = (ambient + diffuse + specular);
    }
    src.rgb *= src.a;
    dst = (1.0f-dst.a)*src + dst;
    //advance ray
    position_ = position_ + direction * stepsize;
    //ray termination (test outside volume)
    vec3 temp1 = sign(world_to_tex(position_) - vec3(0.0f,0.0f,0.0f));
    vec3 temp2 = sign(vec3(1.0f,1.0f,1.0f) - world_to_tex(position_));
    float inside = dot(temp1, temp2);
    if(inside < 3.0f)
        break;
    last_scalar = scalar;
  }
  vec4 color = texture(volume,tex_coords);
  frag_color = dst;

  //frag_color = vec4(position_, 1);

  //frag_color = vec4(color.r, color.r, color.r, 1.0f);
  //frag_color = texture(volume,tex_coords);
  //frag_color = vec4(0.0f,0.0f,1.0f,1.0f);
}
