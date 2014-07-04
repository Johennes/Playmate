var express = require('express');
var spotifyController = require('./spotify-controller');

var sys = require('sys')
var exec = require('child_process').exec;

const PORT = 8880;

var proxy = null;

exec('npm get https-proxy', function(error, stdout, stderr) {
  if (stdout) {
    proxy = stdout.replace(/^\s+|\s+$/g, '');
    console.log('Using proxy ' + proxy);
  }
  
  var app = express();
  
  app.use(express.static(__dirname + '/public'));
  
  spotifyController.register(app, proxy);
  
  console.log('Listening on ' + PORT);
  app.listen(PORT);
});
