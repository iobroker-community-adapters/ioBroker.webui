window.iobrokerHost = '192.168.1.2';
window.iobrokerPort = '8082';

window.iobrokerWebRootUrl = window.location.protocol + '//' + window.iobrokerHost + ':' + window.iobrokerPort + '/';
window.iobrokerWebuiRootUrl = window.iobrokerWebRootUrl  + 'webui/';
window.iobrokerSocketScriptUrl = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/lib/js/socket.io.js';
window.socketUrl = window.location.protocol + '//' + window.iobrokerHost + ':' + window.iobrokerPort + '/';
