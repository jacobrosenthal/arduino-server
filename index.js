'use strict';

var Hapi = require('hapi');
var Joi = require('joi');
var spawn = require('child_process').spawn;

var compile = require('./lib/compile');

var server = new Hapi.Server();

server.connection({
  port: 8000
});

// Add the route
server.route([
{
  method: 'POST',
  path: '/compile',
  handler: compile,
  config: {
    validate: {
      payload: {
        source: Joi.string().required(),
        board: Joi.string().required()
      }
    }
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

// arduino requires an X server even with command line
// https://github.com/arduino/Arduino/issues/1981
spawn('Xvfb', [':1', '-screen', '0', '1024x768x16'], {detached: true});

// Start the server
server.start();
