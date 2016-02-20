var gl;
"use strict";

var Options = require('./options.js');

var ambient = 0;
var noise = 0.08;
var noiseEnabled = true;
var level;
var camera = new Vec3(0,0,0);
var num_triangles = 0;

window.onkeydown = function(e){
	Keyboard[e.keyCode] = true;
	e.preventDefault();
}

window.onkeyup = function(e){
	Keyboard[e.keyCode] = false;
	e.preventDefault();
}

window.onload = function(){
	
	setTimeout(function(){
		level = new Level(100,100);
		main();
  }, 10);
}

var spriteimage;

function main() {
    
    document.querySelector("#noise").addEventListener("mousemove", function(){
        Options.noiseLevel = document.querySelector("#noise").value;
    });
    
    document.querySelector("#ambient").addEventListener("mousemove", function(){
        Options.ambientLevel = document.querySelector("#ambient").value;
    });
    document.querySelector("#noise_enabled").addEventListener("change", function(){
        Options.noiseEnabled = document.querySelector("#noise_enabled").checked;
    });
    
    document.querySelector("#renderDistance").addEventListener("change", function(){
        Options.renderDistance =   document.querySelector("#renderDistance").value;
        rerender();
    })
  // Get A WebGL context
  var canvas = document.getElementById("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
   gl = getWebGLContext(canvas,null, {
	  noTitle: true,
  });

  if (!gl) {
  	throw new Error("Could not create a webgl context");
    return;
  }

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  
  var fs = require('fs');
  
  document.getElementById('3d-vertex-shader').textContent = fs.readFileSync('./shaders/main.vsh', {
      encoding: 'utf8'
  });
  
  document.getElementById('3d-fragment-shader').textContent = fs.readFileSync('./shaders/main.fsh', {
      encoding: 'utf8'
  });

  // setup GLSL program
  var program = createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
  gl.useProgram(program);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  var lights = gl.getUniformLocation(program, "u_lights");
  var lightsEnabled = gl.getUniformLocation(program, "u_lights_enabled");
  var lightsRadius = gl.getUniformLocation(program, "u_lights_radius");
  var lightColors = gl.getUniformLocation(program, "u_light_colors");
  var timeUniform = gl.getUniformLocation(program, "time");
  var ambientUniform = gl.getUniformLocation(program, "ambient");
  var noiseUniform = gl.getUniformLocation(program, "u_noise_enabled");
  var noiseFactor = gl.getUniformLocation(program, "u_noise_factor");

  var buffer;
  var tex_buffer;
  
  function rerender(){
      // Create a buffer.
      if(buffer !== undefined){
          gl.deleteBuffer(buffer);
      }
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    
      // Set Geometry.
      setGeometry(gl);
    
      // Create a buffer for texcoords.
      if(tex_buffer !== undefined){
          gl.deleteBuffer(tex_buffer);
      }
      tex_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, tex_buffer);
      gl.enableVertexAttribArray(texcoordLocation);
    
      // We'll supply texcoords as floats.
      gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    
      // Set Texcoords.
      setTexcoords(gl);
  }
  
  
  rerender();
  
  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Fill the texture with a 1x1 white pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 0]));
                
  // Asynchronously load an image
  var image = new Image();
  image.src = "resources/sprites.png";
  image.addEventListener('load', function() {
    spriteimage = image;
    // Now that the image has loaded make copy it to the texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

    // Check if the image is a power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    //make images not blur
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  });

  function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
  }

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);    
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  // Get the starting time.
  var then = 0;

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    //TODO: Determine wether or not to rerender the scene here.
      
      
    // convert to seconds
    time *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = time - then;
    // Remember the current time for the next frame.
    then = time;

	if(Keyboard[game.KEY_A]){
		camera.x+= deltaTime; //1 tile per second
	}else if(Keyboard[game.KEY_D]){
		camera.x-=deltaTime; //1 tile per second
	}
	
	if(Keyboard[game.KEY_S]){
		camera.y+=deltaTime; //1 tile per second
	}else if(Keyboard[game.KEY_W]){
		camera.y-=deltaTime; //1 tile per second
	}
	
	if (camera.x > 0){
    	camera.x = 0;
	}
	
	if(camera.y > 0){
    	camera.y = 0;
	}
    // Animate the rotation
    modelYRotationRadians += -0.7 * deltaTime;
    modelXRotationRadians += -0.4 * deltaTime;

    // Clear the canvas AND the depth buffer.
   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0,0,0,1);
    // Compute the projection matrix
    var aspect = canvas.clientWidth / canvas.clientHeight;
    var zNear  = 1;
    var zFar   = 2000;
    var projectionMatrix = makePerspective(fieldOfViewRadians, aspect, zNear, zFar);

    var cameraPosition = [0,0, camera.z + 6];
    var up = [0, 1, 0];
    var target = [0, 0, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = makeLookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = makeInverse(cameraMatrix);

    var translationMatrix = makeTranslation(camera.x, camera.y, 0);
    //var xRotationMatrix = makeXRotation(modelXRotationRadians);
    //var yRotationMatrix = makeYRotation(modelYRotationRadians);
	//var zRotationMatrix = makeZRotation(modelXRotationRadians);
    // Multiply the matrices.
    var matrix = translationMatrix;
	//matrix = matrixMultiply(matrix, zRotationMatrix);
    matrix = matrixMultiply(matrix, translationMatrix);
    matrix = matrixMultiply(matrix, viewMatrix);
    matrix = matrixMultiply(matrix, projectionMatrix);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

	//Set light Locations
	gl.uniform3fv(lights, [
		-(camera.x * 2) ,-(camera.y * 2), 1,
		6,6,1,
		4,1,1,
		0,0,1
	]);

    gl.uniform3fv(lightColors, [
		1,1,1,
		0,1,0,
		1,0,0,
		0,0,1
	]);

    gl.uniform1fv(lightsRadius, [
        3, 5, 5, 5
    ])
	//Enable Lights	
	gl.uniform1iv(lightsEnabled, [
		true,true,true,true,
	]);
	
	gl.uniform1f(timeUniform, Date.now() % 1000);
    gl.uniform1f(ambientUniform, Options.ambientLevel);
    gl.uniform1i(noiseUniform, Options.noiseEnabled);
    gl.uniform1f(noiseFactor, Options.noiseLevel);
    
//	gl.polygonOffset(0.01, 0.01)
 //   gl.Enable(gl.POLYGON_OFFSET_LINE);
	//Enable Face Culling
	gl.enable(gl.CULL_FACE);
     
    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, num_triangles);

    requestAnimationFrame(drawScene);
    
    document.querySelector("#xyz").textContent = "Player: x=" + 2 *camera.x.toFixed(3) + ", y=" + 2 *camera.y.toFixed(3) + " z=" + 2 *camera.z.toFixed(3);
    document.querySelector("#triangles").textContent = "Triangles: " + num_triangles;
    document.querySelector("#light").textContent = "Ambient: " + Options.ambientLevel;
    document.querySelector("#render").textContent = "RenderDistance: " + Options.renderDistance;
     
  }
}

// Fill the buffer with the values that define a cube.
function setGeometry(gl) {
  var positions = new Float32Array([]);
    
    ///Dynamic loading in 
    var x = Math.floor(2 * Math.abs(camera.x));
    var y = Math.floor(2 * Math.abs(camera.y));
    var r = Options.renderDistance;
    
    level.forSection(x - r, y - r, 2 * r, 2 * r, function(x,y,tile){
		positions = joinFloat32Arrays(positions, tile.getModel(x,y));
	});
	
    num_triangles = positions.length / 3;
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}


// Fill the buffer with texture coordinates the cube.
function setTexcoords(gl) {
	var array  = new Float32Array([]);
	var x = Math.floor(2 * Math.abs(camera.x));
    var y = Math.floor(2 * Math.abs(camera.y));
    var r = Options.renderDistance;
    
    level.forSection(x - r, y - r, 2 * r, 2 * r, function(x,y,tile){
		array = joinFloat32Arrays(array, tile.getTextureModel());
		//positions = joinFloat32Arrays(positions, tile.getModel(x,y));
	});
	/*
	level.forEach(function(x,y,tile){
		array = joinFloat32Arrays(array, tile.getTextureModel());
	});
	*/
  gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
}