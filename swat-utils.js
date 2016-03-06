
//Write into an array "buffer", at an index. Add parameters to write.
function writeBuffer(buffer, index) {
    
    //Loop while we're less than the amount of extra args, and we're in bounds.
    for(var offset = 0; offset < arguments.length - 2 && index + offset <  buffer.length ; offset++){
        var value = arguments[offset + 2];
        buffer[index + offset] = value;
        
    }
}