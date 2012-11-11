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
 @module fql-workbench
 @requires events
 @requires utilities
 @requires yaml
**/
var Daemon  = require('./lib/daemon').Daemon
  , Server  = require('./lib/server').Server
  , Session = require('./lib/fql').Session
  , tables  = require('./lib/tables')
  , events  = require('events')
  , utils   = require('utilities')
  , yaml    = require('yamljs')

var fqlwb = {};

fqlwb.Bench = function(id, secret, port, uid) {
  this.port = port
  this.server = null;
  this.daemon = null;
  this.session = new Session(id, secret, uid);
  this.completions = [
    'select', 'from', 'where', 'and', 'in', 'like'
  ].concat(tables._names);
};

fqlwb.Bench.prototype = utils.mixin({
  scope : {},
  createDaemon : function(port) {
    this.daemon = new Daemon('fql', port || this.port);

    this.emit('daemon.create');
    return this;
  },

  initDaemon : function() {
    var self = this

    this.daemon.init();
    this.emit('daemon.init');

    this.daemon.console.context = utils.mixin(utils.mixin(this.daemon.console.context, this.scope), this);
    this.session.connect();
    this.emit('session.connect');

    return this;
  },

  connect : function(host) {
    var self = this

    this.server = new Server('fql', this.port);

    if (! this.debug) {
      this.server.console.filters.processBuffer = function(chunk) {
        self.session.connect().ready(function(){
          self.session.query(chunk).complete(function(data, time){
            self.writeToSocket(yaml.stringify(data), "Query took ".cyan + time.green + " seconds to execute.".cyan);
          });
        });

        return chunk;
      };
    }

    this.scope = utils.mixin(this.scope, {
      $$ : function(query) {
        self.session.query(query).complete(function(data, time){
          self.writeToSocket(yaml.stringify(data), "Query took ".cyan + time.green + " seconds to execute.".cyan);
        })

        return this;
      }
    });

    this.server.console.context = utils.mixin(this.server.console.context, this.scope);

    this.server.connect(host);
    this.emit('bench.connect');

    return this;
  },

  writeToSocket : function(data, yield) {
    var server = (this.server && typeof this.server === 'object' ?
                    this.server :
                    (this.daemon && typeof this.daemon === 'object' ?
                      this.daemon :
                      false));

    if (server && server.console && server.console.socket) {
      server.console.socket.write('\n' + data +'\n');
      server.console.socket.write(server.console.sig);
    }
    else {
      process.stdout.write('\n' + data +'\n');
      process.stdout.write((yield || "") + '\n');
      process.stdout.write(server.console.sig);
    }

    return this;
  }
}, events.EventEmitter.prototype);

module.exports = fqlwb;