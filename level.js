var DEFAULT = undefined;
var TILE_SIZE_CONSTANT = 0.52;
var game = {
	DEFAULT_TEXTURE_WIDTH: 512,
	DEFAULT_TEXTURE_RESOLUTION: 16,
	KEY_W: 87,
	KEY_A: 65,
	KEY_S: 83,
	KEY_D: 68
};

//Store Key Press Data Here
var Keyboard = {};

var Textures = {
	cobblestone: new Texture(0),
	mossCobblestone: new Texture(1),
	stoneSlabs: new Texture(2),
	stripedStone: new Texture(3),
	stoneSlabsEnd: new Texture(4),
	stoneBricks: new Texture(5),
	stoneBricksEnd: new Texture(6)
}


/*
	Vec2
	Standard 2-Component Vector	
*/
function Vec2(x,y){
	this.x = x || 0;
	this.y = y || 0;
}

/*
	Vec3
	Standard 3-Component Vector	
*/
function Vec3(x,y,z){
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
	
	this.toArray = function(){
		return [this.x,this.y,this.z];
	}
}

/*
	Collider3
	Standard Hit box collision detection	
*/
function Collider3(x,y,z,w,h){
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
	this.w = w || 1;
	this.h = h || 1;
	this.d = d || 1;
	
	this.isColliding = function(collider){
		if(collider.x + collider.w < this.x || collider.x > this.x + this.w){
			return false;
		}
		if(collider.y + collider.h < this.y || collider.y > this.y + this.h){
			return false;
		}
		if(collider.z + collider.d < this.z || collider.z > this.z + this.d){
			return false;
		}
		return true;
	}
	
	this.containsPoint = function(vec3){
		if(vec3.x  < this.x || vec3.x > this.x + this.w){
			return false;
		}
		if(vec3.y < this.y || vec3.y > this.y + this.h){
			return false;
		}
		if(vec3.z < this.z || vec3.z > this.z + this.d){
			return false;
		}
		
		return true;
	}	
}


/*
	Texture
	Provides Sprite-sheet support
	Any Class that implements this interface can be used to define textures.
	Standard and Alternate Float32 array functions return an array of texture coordinates that match a pair of triangles.	
*/
function Texture(id, textureWidth, spriteResolution){
	textureWidth = textureWidth || game.DEFAULT_TEXTURE_WIDTH;
	spriteResolution = spriteResolution || game.DEFAULT_TEXTURE_RESOLUTION;
	var spritesPerWidth = textureWidth / spriteResolution;
	var spriteUnitWidth = textureWidth / spriteResolution / textureWidth;
	var sx, sy;
	
	//Compute the texture coords
	sx = id % spritesPerWidth;
	sy = parseInt(id / spritesPerWidth);
	
	this.topLeftCorner = function(){
		return new Vec2(sx * spriteUnitWidth, sy * spriteUnitWidth);
	}
	
	this.topRightCorner = function(){
		return new Vec2((sx+1) * spriteUnitWidth, sy * spriteUnitWidth);
	}	
	
	this.bottomRightCorner = function(){
		return new Vec2((sx+1) * spriteUnitWidth, (sy+1) * spriteUnitWidth);
	}
	
	this.bottomLeftCorner = function(){
		return new Vec2(sx * spriteUnitWidth, (sy+1) * spriteUnitWidth);
	}

	this.AlternateFloat32Array = function(){
	return new Float32Array(
    [
		this.topRightCorner().x, this.topRightCorner().y,	    
	    this.bottomLeftCorner().x, this.bottomLeftCorner().y,
		this.topLeftCorner().x, this.topLeftCorner().y,
		
		this.bottomRightCorner().x, this.bottomRightCorner().y,
		this.bottomLeftCorner().x, this.bottomLeftCorner().y,
		this.topRightCorner().x, this.topRightCorner().y,
	]);
	}
	
	this.StandardFloat32Array = function(){
	return new Float32Array(
    [
		this.topLeftCorner().x, this.topLeftCorner().y,
		this.bottomLeftCorner().x, this.bottomLeftCorner().y,
		this.topRightCorner().x, this.topRightCorner().y,
		this.topRightCorner().x, this.topRightCorner().y,
		this.bottomLeftCorner().x, this.bottomLeftCorner().y,
		this.bottomRightCorner().x, this.bottomRightCorner().y
	]);
	}
}

/*
	Array2
	Provides a method to create a two-dimensional array;	
*/
function Array2(width, height){
	var array = [];
	for(var i=0; i<width; i++){
		array[i] = [];
	}
	return array;
}

/*
	Level
	Stores Tile states
*/
function Level(width, height){
	function generateRandomTile(x,y){
		if(x == 5 || y == 5 || x == 0 || y == 0 || x == 9 || y == 9){
			if(y == 4 || y == 6 || x == 4 || x == 6){
				return new TileArchway(DEFAULT, Textures.stoneBricks, Textures.stoneBricksEnd, Textures.mossCobblestone);
			}
			return new TileWall(DEFAULT, Textures.stoneBricks, Textures.stoneBricksEnd);
		}
		
		return new Tile(Textures.mossCobblestone);
	}
	
	var levelData = Array2(width, height);
	for(var x = 0; x<width; x++){
		for(var y = 0; y<width; y++){
			levelData[x][y] = generateRandomTile(x,y);
		}
	}
	
	this.getTile = function(x,y){
		return levelData[x][y];
	}
	
	this.setTile = function(x,y,tile){
		this.levelData[x][y] = tile;
	}
	
	this.forSection = function(x1,y1,w,h,callback){
		for(var x = x1; x<x1 + w; x++){
			for(var y = y1; y<y1 + h; y++){
    			if(x >= width || x < 0 || y >= height || y < 0){
        			continue;
    			}
    			
				callback(x,y,this.getTile(x,y));
			}
		}
	}
	
	this.forEach = function(callback){
		for(var x = 0; x<levelData.length; x++){
			for(var y = 0; y<levelData[0].length; y++){
				callback(x,y,levelData[x][y]);
			}
		}
	}
}


function Tile(texture) {
    this.type = "Tile";
	this.neighbors = {};
	this.texture = texture || Textures.mossCobblestone;
	
	this.getTextureModel = function(){
		return this.texture.StandardFloat32Array();
	}
	
	this.getModel = function(x,y,z){
	x = x || 0;
	y = y || 0;
	z = z || 0;
	
	return new Float32Array(
    [
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z,
    -TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z,
    -TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z,
     TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z,
    ]);
	}
}


function TileWall(wallHeight, texture, topTexture) {
    this.type = "Wall";
	this.neighbors = {};
	this.texture = texture || Textures.cobblestone;
	this.topTexture = topTexture || texture;
	this.height = wallHeight || 2;
	
	this.getTextureModel = function(){
		var model = new Float32Array([]);
		model = joinFloat32Arrays(model, this.topTexture.StandardFloat32Array());
		model = joinFloat32Arrays(model, this.texture.AlternateFloat32Array());
		model = joinFloat32Arrays(model, this.texture.StandardFloat32Array());
		model = joinFloat32Arrays(model, this.texture.AlternateFloat32Array());
		model = joinFloat32Arrays(model, this.texture.StandardFloat32Array());
		return model;
	};
	
	this.getModel = function(x,y,z){
	x = x || 0;
	y = y || 0;
	z = z || 0;
	
	return new Float32Array(
    [
	    
	 //Top Face
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
    -TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z+ this.height,
    
    -TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z+ this.height,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
     TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z+ this.height,
     
     
     //South Face
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
    
     TILE_SIZE_CONSTANT + x,  -TILE_SIZE_CONSTANT + y,   z,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,     
    -TILE_SIZE_CONSTANT + x,  -TILE_SIZE_CONSTANT + y,   z,     
    
    
    //North Face 
    -TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,
     TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,
    -TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z,
    
	-TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z,    
	TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,
	TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z,
	
	
	//West Face
    -TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z,
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
	-TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,   
    
	-TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z,
	-TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
	-TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z,    	
	
	//East Face
	TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,   
    TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
    TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z,    

	TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z,    	
	TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,	
	TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z,
    ]);
	}
	
	
	
}


function TileArchway(wallHeight, texture, topTexture, floorTexture) {
    this.type = "Archway";
	this.neighbors = {};
	this.texture = texture || Textures.cobblestone;
	this.topTexture = topTexture || texture;
	this.floorTexture = floorTexture || texture;
	
	this.height = wallHeight || 2;
	
	this.getTextureModel = function(){
		var model = new Float32Array([]);
		model = joinFloat32Arrays(model, this.topTexture.StandardFloat32Array());
		model = joinFloat32Arrays(model, this.floorTexture.StandardFloat32Array());
		model = joinFloat32Arrays(model, this.texture.AlternateFloat32Array());
		model = joinFloat32Arrays(model, this.texture.StandardFloat32Array());
		model = joinFloat32Arrays(model, this.texture.AlternateFloat32Array());
		model = joinFloat32Arrays(model, this.texture.StandardFloat32Array());
		return model;
	};
	
	this.getHeight = function(x,y) {
    	
	}
	
	this.getModel = function(x,y,z){
	x = x || 0;
	y = y || 0;
	z = z || 0;
	
	return new Float32Array(
    [
	    
	 //Top Face
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
    -TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z+ this.height,
    
    -TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z+ this.height,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
     TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z+ this.height,
     
      //Floor
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z,
    -TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z,
    
    -TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z,
     TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z,
     
     
     //South Face
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
    
     TILE_SIZE_CONSTANT + x,  -TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,
     TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,     
    -TILE_SIZE_CONSTANT + x,  -TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,  
    
    
    //North Face 
    -TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,
     TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,
    -TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,
    
	-TILE_SIZE_CONSTANT + x,  TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,  
	TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,
	TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,
	
	
	//West Face
    -TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,
    -TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
	-TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,   
    
	-TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,
	-TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
	-TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,    	
	
	//East Face
	TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+ this.height,   
    TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,
    TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,

	TILE_SIZE_CONSTANT + x, TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,
	TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+ this.height,	
	TILE_SIZE_CONSTANT + x, -TILE_SIZE_CONSTANT + y,   z+this.height - this.height / 16,
    ]);
	}
	
	
	
}

