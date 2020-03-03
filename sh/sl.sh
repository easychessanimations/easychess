export SKIP_FIREBASE=1
export SKIP_BOT=1
export SKIP_OAUTH=1
export ALLOW_SERVER_ENGINE=1
export EASYCHESS_DEV=1

chmod a+x resources/server/bin/*

node resources/server/server.js
