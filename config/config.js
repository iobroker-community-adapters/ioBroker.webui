window.iobrokerHost = window.location.hostname;
window.iobrokerPort = window.location.port;
window.iobrokerWebuiRootUrl = window.location.protocol + '//' + window.iobrokerHost + ':' + window.iobrokerPort + '/webui/';
window.iobrokerSocketScriptUrl = '../lib/js/socket.io.js';
//hack, webui socket does not work atm...
//window.iobrokerPort = 8081;
//window.iobrokerSocketScriptUrl = window.location.protocol + '//' + window.iobrokerHost + ':' + window.iobrokerPort + '/lib/js/socket.io.js';
//end of hack
window.socketUrl = window.location.protocol + '//' + window.iobrokerHost + ':' + window.iobrokerPort + '/';