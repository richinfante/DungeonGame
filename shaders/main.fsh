#define MAX_LIGHT 0.8

precision mediump float;

// Passed in from the vertex shader.
varying vec2 v_texcoord;
varying vec4 v_position;

// The texture.
uniform sampler2D u_texture;

//Lighting Extensions
uniform vec3 u_lights[16];
uniform bool u_lights_enabled[16];
uniform float u_lights_radius[16];
uniform vec3 u_light_colors[16];

//Time (0-999) expressing fractional seconds.
uniform float time;

//Noise enabled
uniform bool u_noise_enabled;

//Affect of noise on surrounding area
uniform float u_noise_factor; //default: 0.08

//
uniform float ambient;

float rand(vec2 n)
{
  return 0.5 + 0.5 * fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}

float rand2(float time){
    return 0.95 + 0.05 * sin((time / 1000.0) * (2.0 * 3.14159));
}
 
void main() {
	float x = v_position.x;
	float y = v_position.y;
	float z = v_position.z;
	
	vec4 light = vec4(ambient, ambient, ambient, 1.0); //Ambient Light Level
	
	for(int i = 0; i < 16; i++){
		if(u_lights_enabled[i] == false){
			continue;	
		}
		
		float lx = u_lights[i].x;
		float ly = u_lights[i].y;
		float lz = u_lights[i].z;
		
		vec2 offset = v_position.xy + vec2(time, time);
		float pp1rand = rand(offset);
		float pprand = rand2(time);
		
		if(u_noise_enabled == false) {
    		pp1rand = 0.75;
		}
		
		float radius = u_lights_radius[i];
		if (radius <= 0.0 ){
    		radius = 1.0;
		}
		
		float dist = sqrt((lx-x)*(lx-x) + (ly-y)*(ly-y) + (lz-z)*(lz-z));
        float intensity = 0.5 * (radius/(dist*dist*3.0)) - u_noise_factor * pp1rand;
        
        if(intensity > MAX_LIGHT){
            intensity = MAX_LIGHT;
        }
        
		light += vec4(intensity * u_light_colors[i].x,intensity * u_light_colors[i].y, intensity * u_light_colors[i].z, 1);
	}
    
    
    
	if(light.x > MAX_LIGHT){
		light.x = MAX_LIGHT;
	}

	if(light.y > MAX_LIGHT){
		light.y = MAX_LIGHT;
	}
	
	if(light.z > MAX_LIGHT){
		light.z = MAX_LIGHT;
	}	
	
	
	gl_FragColor = texture2D(u_texture, v_texcoord) * light;
}