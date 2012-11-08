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
/**
 @module daemon
**/
var Server  = require('./server').Server
  , utils   = require('utilities')

var daemon = {};

/**
  Constructs a new instance of a Daemon

  @class Daemon
  @constructor
  @extends Server
  @param {Number} port The port of the server
**/
daemon.Daemon = function(name, port) {
  this.constructor.apply(this, [name, port, 'daemon']);
}

daemon.Daemon.prototype = utils.mixin(daemon.Daemon.prototype, Server.prototype);
daemon.Daemon.prototype.constructor = Server;

module.exports = daemon;