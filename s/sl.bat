echo off

set SKIP_FIREBASE=1

start s\s

timeout /t 5

start gulp

rem start browser-sync start --proxy "localhost:3000/?nolog=true" --files "resources/client/js/*.js"
