cd wasm
call emcc board.c -s "EXPORTED_FUNCTIONS=['_main', '_setFromFen']" -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap']" -o board.js
cd ..
