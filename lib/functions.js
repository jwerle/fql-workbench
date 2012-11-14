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
require('colors');

var tables        = require('./tables')
  , adapters      = require('./adapters')
  , schema        = require('./schema')
  , nonSupported  = ['.*']
  , _import       = require('./tables/_import')
  , yaml          = require('yamljs')
  , utils         = require('utilities')
  , parseopts     = require('../deps/parseopts')
  , emit
  , filterTable

filterTable = function(table, args) {
  var selected = {}
    , ret = {}
    , params
    , params
    , prop
    , arg
    , fields
    , field
    , i
    , val

  if (args.length) {
    ret.name = table.name;

    for (i = 0; i < args.length; i++) {
      arg = args[i].match(/([a-z]+)\s?:?\[?['|"]?([a-z|,\s?|_?|.?]+)?['|"]?\]?/);
      
      if (arg == null) {
        continue;
      }

      switch (arg[1]) {
        case 'find':

        break;

        case 'fields':
          fields = table.fields;

          if (arg[2] && !!~ args[i].indexOf(':') && (params = arg[2].split(/,/))) {
            for (field in fields) {
              selected[field] = {};
              
              for (i = 0; i < params.length; i++) {
                if (fields[field][params[i]]) {
                  if (params.length > 1) {
                    selected[field][params[i]] = yaml.stringify(fields[field][params[i]].toString());
                  }
                  else {
                   selected[field] = yaml.stringify(fields[field][params[i]].toString()); 
                  }
                }
              }
            }

            fields = selected;
          }

          ret.fields = fields;
        break;

        case 'field':
          fields = table.fields;

          ret.fields = {};

          if (arg[2] && !!~ args[i].indexOf(':') && (params = arg[2].split(/,/))) {
            for (i = 0; i < params.length; i++) {
              param = params[i].split('.')[0]
              prop  = params[i].split('.')[1]
              val   = (typeof prop === 'string' && fields[param][prop]? 
                                        fields[param][prop] : 
                                        fields[param]);

              ret.fields[param] = (typeof ret.fields[param] === 'object' ?
                                    ret.fields[param] :
                                    []);

              if (prop) {
                ret.fields[param][prop] = val;
              }
              else {
                ret.fields[param].push(val)
              }
            }
          }
        break;

        case 'perms': 
        case 'permissions':
          ret.permissions = table.permissions
        break;
      }
    }
  }
  else {
    ret = table;
  }

  return ret;
};

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

functions.prototype._args = [];
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

functions.prototype.registerArguments = function(args) {
  this._args = this._args.concat(args);

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

    this[cmd].registerArguments = function(args) {
      self.registerArguments(args);

      return self[cmd]
    }
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

functions.prototype.getArguments = function() {
  return this._args;
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
  var args = input.split(/\s/)

  return {
    cmd   : args.shift().replace(':',''),
    args  : args
  }
};


/**
  @namespace functions
**/
functions = new functions();


/**
  @function print
**/
functions.bind('print', function(scope) {
  var args = Array.prototype.map.apply(arguments, [function(val){ return val; }])
    , help = ""

  args.shift();

  if (args.length) {
    emit(function(){ scope.emit('query.ready', args.join(' ')) });

    return args.join(' ');
  } 
  else {
    help = functions.call('help', scope, 'print');
    emit(function(){ scope.emit('query.ready', help) });

    return help
  }

}).defineUsage(function(){
  return ":print <string> - Prints a string to the buffer";
});


/**
  @function describe
**/
functions.bind(['describe', 'desc'], function() {
  var scope = Array.prototype.shift.call(arguments)
    , table = Array.prototype.shift.call(arguments)
    , args  = Array.prototype.map.apply(arguments, [function(val){ return val }])
    , shim = tables.getShim(table)

  if (tables.hasTable(shim || table)) {
    if ((table = tables.getTable(shim || table)) && (shim ||table) !== null) {
      emit(function(){ scope.emit('query.ready', filterTable(table, args)); });
    }
  }
  else {
    _import.getTableDefinition(shim || table).done(function(fields, permissions){
      if (! fields) {
        scope.emit('query.ready', {
          data : ["Unsupported table."]
        })
      }

      var ddl = {}
        , fieldObject = {}
        , i
        , field
        , prop
        , ret = {}
        , arg
        , params
        , selected = {}

      for (i = 0; i < fields.length; i++) {
        fieldObject[fields[i].name] = {
          indexable   : fields[i].indexable === '*' ? true : false,
          type        : fields[i].type,
          description : (fields[i].description.match(/<[a-z]+?\s?>/i) ? 
                          require('jquery')(fields[i].description).text() : 
                          fields[i].description)
        };
      }

      table = shim? shim : table;

      table = schema.create('table', {
        name        : table,
        permissions : permissions,
        fields      : fieldObject
       });

      if (args.length) {
        table = filterTable(table, args);
      }

      scope.emit('query.ready', table);
    });
  }
}).defineUsage(['desc', 'describe'], function(alias){
  return [
    ":" + alias + " <table> <filter>:,<filterargs> - Shows a table definition"
  , "   example:"
  , ":describe insights fields"
  , ":describe user permissions",
  , ":describe application fields:type",
  , ":describe "].join('\n')
}).registerArguments(['fields', 'field', 'find']);


/**
  @function invalid
**/
functions.bind('invalid', function(scope, arg){
  emit(function() {
    scope.emit('query.ready', "Not a supported command");
  });
});


/**
  @function exit
**/
functions.bind('exit', function(){
  process.exit();
}).defineUsage(function(){
  return "Exits the session";
});


/**
  @function help
**/
functions.bind('help' , function(scope, command){
  command = command? command : 'help';

  var usage = functions.getUsage(command)

  emit(function(){
    scope.emit('query.ready', usage);
  });

  return usage;
  
}).defineUsage(function(){
  return ":help <command> - Displays usage on a given command"
}).registerArguments(functions.getNames());



/**
  @function eval
**/
functions.bind('eval' , function(){
  var scope = Array.prototype.shift.call(arguments)
    , args  = Array.prototype.map.apply(arguments, [function(val){ return val }])
    , ret
  
  emit(function(){
    try {
      console.log('\n')
      ret = (new Function(['with (this) { return (', args.join(' '), ') }'].join(''))).call(functions)
      console.log(ret);
      scope.emit('query.ready', ['eval']);
    }
    catch (e) {
      scope.emit('query.ready', {_error: true, data: e});
    }
  });
  
  return ret;

}).defineUsage(function(){
  return ":eval <command> - evals given javascript"
}).registerArguments([]);




/**
  @function show
**/
functions.bind('show', function(){
  var scope   = Array.prototype.shift.call(arguments)
    , args    = Array.prototype.map.apply(arguments, [function(val){ return val }])
    , flags   = args.filter(function(val){ return val.indexOf('-') == 0; }).map(function(val){ return val.replace(/^-/,''); })
    , args    = args.filter(function(val){ return val.indexOf('-') != 0; })
    , action  = args.shift()
    , i
    , x
    , index
    , completions = []

  switch (action) {
    case 'tables':
      if (scope.tables && typeof scope.tables === 'object') {
        emit(function(){
          scope.emit('query.ready', scope.tables);
        });

        return scope.tables;
      }
      else {
        _import.getTables().done(function(tables){
          scope.emit('query.ready', tables.tables || {});
        });
      }
    break;

    case 'completions':
      if (flags && flags.length) {
        for (i = 0; i < flags.length; i++) {
          switch (flags[i]) {
            case 'find':
              if (args.length) {
                for (x = 0; i < args.length; i++) {
                  if ((index = scope.completions.indexOf(args[x]))) {
                    completions.push(args[x]);
                  }
                }
              }
              else {
                completions = scope.completions;
              }
            break;

            default:
          }
        }
      }
      else {
        completions = scope.completions;
      }

      emit(function(){
        scope.emit('query.ready', completions)
      });

      return completions;
    break;
  }
}).defineUsage(function(){
  return ":show table - Shows all possible tables to query"
}).registerArguments(['tables', 'completions']);

/**
  @function export
  
  Right -
    :export user select name, uid, username, pic from user where uid = :uid

  Wrong - 
    :export select name, uid, username, pic from user where uid = :uid
**/
functions.bind('export', function(){
  var match
    , scope   = Array.prototype.shift.call(arguments)
    , dest    = Array.prototype.shift.call(arguments)
    , query   = Array.prototype.map.apply(arguments, [function(val){ return val }]).join(' ')
    , fields  = ((match = query.replace(/select/i,'').replace(/from(.*)/i,'').match(/\s[a-z]+,?/g).join(' ').split(',')) ?
                  match.map(function(val){ return val.split('').reverse().join('').trim('').split('').reverse().join(''); }) :
                  [])
    , table   = ((match = query.match(/from\s+([a-z]+)\s+/i)) ? 
                  match[1] || false : 
                  false)

    if (dest.toLowerCase() === 'select') {
      emit(function(){ scope.emit('query.ready', {_error: true, data: {message : "Missing destination table"}}); })

      return help = functions.call('help', scope, 'export');;
    }

    _import.getTableDefinition(table).done(function(f){
      var fieldsInUse = {}, i, field

      for (i = 0; i < f.length; i++) {
        field = f[i];

        if (!!~ fields.indexOf(field.name)) {
          fieldsInUse[field.name] = field;
        }
      }

      console.log(fieldsInUse)

    });
  
}).defineUsage(function(){
  return ":export <destination_table> <query>";
});

functions.bind('pipe', function(){
  console.log(arguments)
});



/**
  @function mysql-connect

  :mysql-connect -h dev-db.n-ws.org -u pentaho -p eOvnly0m -db warehouse
**/
functions.bind('mysql-connect', function(){
  var scope   = Array.prototype.shift.call(arguments)
    , args    = Array.prototype.map.apply(arguments, [function(val){ return val }])
    , error   = function(e){ emit(function(){ scope.emit('query.ready', {_error: true, data: e}); }); }
    , opts
    , parser
    , adapter

  if (scope.adapter && scope.adapter.connected) {
    error({message : "You are already connected, please execute :mysql-disconnect to disconnect."});

    return false;
  }

  opts = [
      {full: 'host', abbr: 'h', args: true}
    , {full: 'port', args: true}
    , {full: 'user', abbr: 'u', args: true}
    , {full: 'password', abbr: 'p', args: true}
    , {full: 'database', abbr: 'db', args: true}
  ];

  parser = new parseopts.Parser(opts);
  try {
    parser.parse(args);
    opts = parser.opts;
  }
  catch (e) {
    error(e)

    return false;
  }
  
  if (typeof opts === 'object') {
    adapter = adapters.mysql.Adapter.new(opts);

    if (! adapter.host) {
      error({message : "You need to provide a host to execute :mysql-connect"});
    }

    if (! adapter.user) {
      error({message : "You need to provide a user to execute :mysql-connect"});
    } 

    if (! adapter.password) {
      error({message : "You need to provide a password to execute :mysql-connect"});
    }

    console.log(adapter.constructor)

    adapter.on('connected', function(){
      scope.adapter = adapter;

      emit(function(){ scope.emit('query.ready', ":mysql-connect : Connected!".green)});
    });

    adapter.on('connection.error', function(err){
      switch (err) {
        case adapters.mysql.ETIMEDOUT :
          error({message : "mysql : ETIMEDOUT - The connection timed out!"})
        break;
        default:
      }
    });

    adapter.connect();
  }
});

functions.bind('mysql-disconnect', function(scope){
  var error   = function(e){ emit(function(){ scope.emit('query.ready', {_error: true, data: e}); }); }

  if (scope) {
    if (scope.adapter && scope.adapter.connected) {

    }
    else {
      error({message : "You are not currently connected, please connect using :mysql-connect"});
    }
  }
});

module.exports = functions;