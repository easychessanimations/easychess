echo off
call firebase\makeenv

node resources/utils/uploadengine.js
