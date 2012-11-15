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
 @module mysql
**/
var MySQL   = require('mysql')
  , events  = require('events')
  , utils   = require('utilities')

var mysql = {};

mysql.PROTOCOL_CONNECTION_LOST = 'PROTOCOL_CONNECTION_LOST';
mysql.ETIMEDOUT = 'ETIMEDOUT';




function Adapter(opts) {
  var prop

  opts = (typeof opts === 'object'? opts : {});

  for (prop in opts) {
    this[prop] = opts[prop] || false;
  }
}

Adapter.prototype = {
  _connection : null,
  connected : false,
  connect : function() {
    var self = this

    this._connection = MySQL.createConnection(this);

    if (typeof this._connection === 'object') {
      this._connection.connect(function(err){
        if (err) {
          self.emit('connection.error', err);
        }
        else {
          self.connected = true;
          self.emit('connected', this);
        }
      });

      this._connection.on('error', function(err){
        if (! err.fatal) {
          return;
        }

        if (err.code !== mysql.PROTOCOL_CONNECTION_LOST) {
          throw err;
        }
        else {
          console.log("mysql : connection lost!");
        }
      })
    }

    return this;
  },

  disconnect : function() {
    var self = this

    if (typeof this._connection === 'object') {
      this._connection.end(function(err){
        if (err) {
          self.emit('error', err);
        }
        else {
          self.connected = false;
          self.emit('disconnect', this);
        }
      });
    }

    return this;
  },

  query : function(query, callback) {
    var self = this

    this._connection.query(query, function(err, results){
      if (err) {
        self.emit('query.error', err);
      }

      if (typeof callback === 'function') {
        callback.apply(this, [results]);
      }
    });

    return this;
  }
};

Adapter.prototype = utils.mixin(Adapter.prototype, events.EventEmitter.prototype);
Adapter.prototype.constructor = Adapter;

mysql.Adapter = {
  new : function(opts) {
    return new Adapter(opts);
  }
};

mysql.connect = function(opts){
  return MySQL.createConnection(opts || {});
};

/*
 INSERT INTO user (userid,birthday,first_name,last_name) 
   VALUES (1234,'1980-03-07','Joe','Smith') 
ON DUPLICATE KEY UPDATE 
   birthday = '1980-03-07',
   first_name = 'Joe', 
   last_name = 'Smith';
*/
mysql.prototype = {
  toMySQLDDL : function(prefix) {
    var self = this, fields = [], name = (prefix ? prefix + "_" : (this.prefix? this.prefix + "_" : "")) + this.name
      , ddl, field, supported, type

    supported = {
      'int'     : 'int',
      'float'   : 'float',
      'string'  : 'text',
      'bool'    : 'tinyint',
      'array'   : 'blob',
      'object'  : 'blob',
      'time'    : 'datetime',
      'mixed'   : 'text',
      'uid'     : 'init'
    };

    for (field in this.fields) {
      type = this.fields[field].type.toString();

      fields.push({
        name    : field, 
        type    : supported[type],
        length  : this.fields[field].type.length
      })
    }

    ddl = [
      "CREATE TABLE IF NOT EXISTS", name , "(",

        // fields
        (function(f){
          var fields = [], i, key = self.name[0] + 'id'

          fields.push([key, 'int(11)' ,'NOT NULL', 'AUTO_INCREMENT'].join(' '));

          for (i = 0; i < f.length; i++) {
            fields.push([f[i].name, f[i].type, '(' + f[i].length + ')', 'NOT NULL'].join(' '))
          }

          // primary key
          fields.push(["PRIMARY KEY(", key, ")"].join(''));

          return fields.join(',\n');

        })(fields),
      ");"
    ].join(' ');

    return ddl;
  },

  toMySQLInsert : function(fields, values, prefix) {
    var sql, name = (prefix ? prefix + "_" : (this.prefix? this.prefix + "_" : "")) + this.name

    sql = [
            "INSERT INTO", name, "(" + fields.join(', ') + ")",
                 "VALUES", "(" + values.map(function(value){ 
                                    return (typeof value === 'string'? ["'", value, "'"].join('') : value);
                                  }).join(', ') + ")",
//"ON DUPLICATE KEY UPDATE", 
//                      ""
    ";"].join(' ');

    return sql;
  }
};


module.exports = mysql;