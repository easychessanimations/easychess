rem https://emscripten.org/docs/getting_started/downloads.html

echo off

cd emsdk

rem Fetch the latest version of the emsdk (not needed the first time you clone)
git pull

rem Download and install the latest SDK tools.
emsdk install latest

rem Make the "latest" SDK "active" for the current user. (writes ~/.emscripten file)
emsdk activate latest

rem Activate PATH and other environment variables in the current terminal
emsdk_env
