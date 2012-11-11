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

/**
  @namespace functions
**/
var functions = function Functions(){};

functions.prototype.bind = function(cmd, func) {
  if (typeof cmd === 'object' && cmd.length) {
    for (var i = 0; i < cmd.length; i++) {
      this.bind(cmd[i], func);
    }
  }
  else {
    this[cmd] = func;
  }

  return this;
};

functions.prototype.call = function() {
  var args = Array.prototype.map.apply(arguments, [function(){ return arguments[0]}])
    , func = args.shift().replace(':','')

  if (!!~ this.getNames().indexOf(func)) {
    return this[func].apply(this, args);
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

functions.bind('print', function() {

});

functions.bind(['desc', 'describe'], function(scope, table) {
  if (tables.hasTable(table)) {
    if ((table = tables.getTable(table)) && table !== null) {
      setTimeout(function(){ scope.emit('query.ready', table); }, 0);
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
});

module.exports = functions;