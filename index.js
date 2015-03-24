'use strict';

var Hapi = require('hapi');
var fs = require('fs');
var uuid = require('node-uuid');
var spawn = require('child_process').spawn;
var Boom = require('boom');

//if you put have arduino >1.5.2 (only tested on 1.6.1) you can run this on osx with osx=true npm start
var arduinoCmd = process.env.osx ? '/Applications/Arduino.app/Contents/MacOS/JavaApplicationStub' : '/usr/local/share/arduino/arduino';
var tmp = '/tmp/';
var name = 'blah';

// Create a server with a host and port
var server = new Hapi.Server();

server.connection({
  port: 8000
});

// Add the route
server.route(
[{
  method: 'POST',
  path: '/compile',
  handler: function (request, reply) {

    var returnObject = {};

    var path = tmp + uuid.v4();
    var buildPath = path + '/build/';
    var sketchPath = path + '/' + name + '/';
    var writePath = sketchPath + name + '.ino';
    var readPath = buildPath + name + '.cpp.hex';

    fs.mkdirSync(path);
    fs.mkdirSync(buildPath);
    fs.mkdirSync(sketchPath);

    fs.writeFile(writePath, request.payload.source, function(err) {
      console.log('write ', err);
      if(err) {
        return reply(Boom.wrap(err, 500));
      }

      // arduino requires an X server even with command line
      // https://github.com/arduino/Arduino/issues/1981
      var xvfbProcess = spawn('Xvfb', [':1', '-screen', '0', '1024x768x16'], {detached: true});

      var options = {
        env: {
          DISPLAY: ':1.0'
        }
      };

      var arduinoProcess = spawn(arduinoCmd, ['--board', request.payload.board, '--pref', 'build.path=' + buildPath, '--verify', writePath], options);

      var log = new Buffer(0);
      arduinoProcess.stdout.on('data', function (data) {
        console.log('arduinoProcess stdout: ' + data);
        log = Buffer.concat([log, data]);
      });

      arduinoProcess.stderr.on('data', function (data) {
        console.log('arduinoProcess stderr: ' + data);
        log = Buffer.concat([log, data]);
      });

      arduinoProcess.on('close', function (code) {
        if( code === 1){
          var error = Boom.create(400, 'Build failed', log.toString());
          return reply(error);
        }

        if( code > 0){
          return reply(Boom.wrap(err, 500));
        }

        fs.readFile(readPath, 'utf8', function (err, data) {
          console.log('read ', err);
          if (err) {
            return reply(Boom.wrap(err, 500));
          }

          returnObject.hex = data;
          returnObject.log = log.toString();
          console.log(returnObject);
          return reply(returnObject);
        });

      });


    });
  }
},
{
  method: 'GET',
  path: '/compile',
  handler: function (request, reply) {

    var help = '<a href="https://github.com/arduino/Arduino/blob/ide-1.5.x/build/shared/manpage.adoc">';
    help = help + ' curl -H "Content-Type: application/json" -X POST -d \'{"board":"arduino:avr:uno", "source":"void loop(){}\nvoid setup(){}"}\' http://45.55.129.239/compile';
    return reply(help);
  }
}]);

// Start the server
server.start();

