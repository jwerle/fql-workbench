/*
 * FQL-Workbench
 * Copyright 2012 Joseph Werle (joseph.werle@gmail.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
  @name server
  @module server
  @requires repl-console
*/
var REPLConsole = require('repl-console')

/**
  @name server
  @namespace server
*/
var server = {};

/*
  @name Server
  @constructor
  @description Constructs a new instance of a Server
  @param {String} name The name of the server
  @param {Number} port The port of the server
  @param {String} type The type of server, session|daemon. Defaults to session.
*/
server.Server = function(name, port, type) {
  type = (type === 'daemon' ? 'remote' : 'local');

  this.name = name || 'anon';
  this.port = port || 5001;

  this.console = new REPLConsole(this.name, type, this.port);
  this.console.sig = [name, '> '].join('');
  this.showAllTabCompletion = true;

};

server.Server.prototype = {
  init : function() {
    console.log('Starting server')
    this.console.start();

    return this;
  },

  connect : function(host, port) {
    this.console.connect(port || this.port, host);

    return this;
  }
};

module.exports = server;