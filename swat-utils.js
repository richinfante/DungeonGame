function joinFloat32Arrays(array1, array2){
	var array = new Float32Array(array1.length  + array2.length);
	
	for(var i=0; i<array1.length; i++){
		array[i] = array1[i];
	}
	for(var i=0; i<array2.length; i++){
		array[array1.length + i] = array2[i];
	}
	
	return array;
}