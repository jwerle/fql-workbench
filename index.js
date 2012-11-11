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
var Daemon    = require('./lib/daemon').Daemon
  , Server    = require('./lib/server').Server
  , Session   = require('./lib/fql').Session
  , tables    = require('./lib/tables')
  , _import   = require('./lib/tables/_import')
  , functions = require('./lib/functions')
  , events    = require('events')
  , utils     = require('utilities')
  , yaml      = require('yamljs')

var fqlwb = {};

fqlwb.Bench = function(id, secret, port, uid) {
  var self = this

  this.port = port
  this.server = null;
  this.daemon = null;
  this.completions = [
    'select', 'from', 'where', 'and', 'in', 'like'
  ].concat(tables._names)
   .concat(functions.getArguments())
   .concat(functions.getNames().map(function(name){ return ':' + name; }));
  
  this.session = new Session(id, secret, uid, this.completions);
  this.session.setBench(this);

  console.log("Reading tables..".green);
  _import.getTables().done(function(tables){
    console.log("Got tables!".cyan)
    var i = 0, table, gotFields = false

    self.tables = tables.tables;

    tables = [].concat(self.tables); // Kill ref

    self.completions = self.completions.concat(tables);

    console.log("Reading fields..".green)

    function getFields(fields, permissions, table){
      var i, names = []

      tables.shift();

      if (gotFields) {
        return;
      }

      if (fields) {
        for (i = 0; i < fields.length; i++) {
          names.push([table, '.', fields[i].name].join(''))
          names.push(fields[i].name)
        }

        self.completions = self.completions.concat(names);
      }
      else {
        importFields();
        return;
      }

      if (! tables.length) {
        gotFields = true;
        console.log("Got fields!".cyan);
        
        setTimeout(function(){ 
          self.sanitizeCompletions().propagateCompletions().resetPrompt();
        }, 50);
      }

      importFields();
    }

    function importFields(){
      if (tables.length) {
        _import.getTableDefinition(tables[0]).done(getFields);
      }
    }

    importFields();
    
  });

  this.scope.id = id;
  this.scope.secret = secret;
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
          self.session.query(chunk).complete(function(data, time, isQuery){
            var msg = "Query took ".cyan + time.green + " seconds to execute.".cyan;

            self.writeToSocket(yaml.stringify(data), isQuery? msg : null);
          });
        });

        return chunk;
      };
    }

    this.server.console.completions = this.completions;

    this.scope = utils.mixin(this.scope, {
      $$ : function(query) {
        self.session.query(query).complete(function(data, time){
          self.writeToSocket(yaml.stringify(data));
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
    var server = this.getServer();

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
  },

  getServer : function() {
    return server = (this.server && typeof this.server === 'object' ?
                      this.server :
                      (this.daemon && typeof this.daemon === 'object' ?
                        this.daemon :
                        false));
  },

  resetPrompt : function() {
    var server = this.getServer();

    process.stdout.write('\n' + server.console.sig);

    return this;
  },

  sanitizeCompletions : function() {
    var index, i

    for (i = 0; i < this.completions.length; i++) {
      if (!!~ (index = this.completions.indexOf(this.completions[i])) && index != i) {
        console.log("found dupe ", this.completions[i])
        this.completions.splice(i, i+1);
      }
    }

    return this;
  },

  propagateCompletions : function() {
    this.session.completions      = this.completions;
    
    if (typeof this.server === 'object' && this.server !== null) {
      this.server.console.completions = this.completions;
    }

    if (typeof this.daemon === 'object' && this.daemon !== null) {
      this.daemon.console.completions = this.completions;
    }

    return this;
  }
}, events.EventEmitter.prototype);

module.exports = fqlwb;