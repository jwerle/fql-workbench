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
 @module functions
**/
var tables        = require('./tables')
  , schema        = require('./schema')
  , nonSupported  = ['.*']
  , _import       = require('./tables/_import')
  , yaml          = require('yamljs')
  , emit

emit = function(callback) {
  return setTimeout(function(){
    if (typeof callback === 'function') {
      callback();
    }
  }, 0);
}

/**
  @namespace functions
**/
var functions = function Functions(){};

functions.prototype.defineUsage = function(def, func) {
  var i

  if (typeof this[def] === 'function') {
    this[def].usage = (typeof func === 'function'? 
                        func(def) : 
                        func);
  }
  else if (typeof def === 'object' && def.length) {
    for (i = 0; i < def.length; i++) {
      this.defineUsage(def[i], func);
    }
  }

  return this;
};

functions.prototype.bind = function(cmd, func) {
  var self = this;

  if (typeof cmd === 'object' && cmd.length) {
    for (var i = 0; i < cmd.length; i++) {
      this.bind(cmd[i], func);
    }
  }
  else {
    this[cmd] = func;
    this[cmd].defineUsage = function(def) {
      self.defineUsage(cmd, def);

      return self[cmd];
    };
  }

  return (typeof this[cmd] === 'function'? this[cmd] : this)
};

functions.prototype.getUsage = function(command) {
  var usage

  if (typeof this[command] === 'function' && typeof this[command].usage === 'string') {
    return this[command].usage;
  }
  else {
    return "No usage found for :" + command;
  }
};

functions.prototype.call = function() {
  var self = this
    , args = Array.prototype.map.apply(arguments, [function(){ return arguments[0]}])
    , func = args.shift().replace(':','')

  if (!!~ this.getNames().indexOf(func)) {
    

    return this[func].apply(this[func], args);
  }

  return false
};

functions.prototype.getNames = function() {
  var func, funcs = []

  for (func in this) {
    if (this.hasOwnProperty(func)) {
      funcs.push(func);
    }
  }

  return funcs;
};

functions.prototype.exists = function(name) {
  return !!~ this.getNames().indexOf(name) ? true : false
};

functions.prototype.getNonSupported = function() {
  return nonSupported;
};

functions.prototype.getKeywords = function(supported, not) {
  return new RegExp('('+ (supported || this.getNames())
                          .concat(not || this.getNonSupported())
                          .map(function(val){ return ':' + val; }).join('|') + ')', 
        'gi');
};

functions.prototype.parseInput = function(input) {
  var args = input.split(' ')

  return {
    cmd   : args.shift().replace(':',''),
    args  : args
  }
};



functions = new functions();

functions.bind('print', function(scope) {
  var args = Array.prototype.map.apply(arguments, [function(val){ return val; }]);

  args.shift();

  emit(function(){ scope.emit('query.ready', args.join(' ')) });
}).defineUsage(function(){
  return ":print <string> - Prints a string to the buffer";
});

functions.bind(['describe', 'desc'], function(scope, table) {
  if (tables.hasTable(table)) {
    if ((table = tables.getTable(table)) && table !== null) {
      emit(function(){ scope.emit('query.ready', table); });
    }
  }
  else {
    _import.getTableDefinition(table).done(function(fields, permissions){
      var ddl = {}, fieldObject = {}, i

      for (i = 0; i < fields.length; i++) {
        fieldObject[fields[i].name] = {
          indexable   : fields[i].indexable === '*' ? true : false,
          type        : fields[i].type,
          description : require('jquery')(fields[i].description).text()
        };
      }

      table = schema.create('table', {
        name        : table,
        permissions : permissions,
        fields      : fieldObject
       });

      scope.emit('query.ready', table);
    });
  }
}).defineUsage(['desc', 'describe'], function(alias){
  return ":"+ alias +" <table> - Shows a table definition";
});

functions.bind('invalid', function(scope, arg){
  emit(function() {
    scope.emit('query.ready', "Not a supported command");
  });
});

functions.bind('exit', function(){
  process.exit();
}).defineUsage(function(){
  return "Exits the session";
});

functions.bind('help' , function(scope, command){
  command = command? command : 'help';

  emit(function(){
    scope.emit('query.ready', functions.getUsage(command));
  });
  
}).defineUsage(function(){
  return ":help <command> - Displays usage on a given command"
});

module.exports = functions;