window.iobrokerHost = window.location.hostname;
window.iobrokerPort = window.location.port;
window.iobrokerWebuiRootUrl = window.location.protocol + '//' + window.iobrokerHost + ':' + window.iobrokerPort + '/webui/';
window.iobrokerSocketScriptUrl = '../lib/js/socket.io.js';
window.socketUrl = window.location.protocol + '//' + window.iobrokerHost + ':' + window.iobrokerPort + '/';