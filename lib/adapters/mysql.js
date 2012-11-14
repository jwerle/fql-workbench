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

    console.log(this._connection)
    if (typeof this._connection === 'object') {
      this._connection.connect(function(err){
        if (err) {
          console.log(err)
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
      })
    }

    return this;
  },

  destroy : function() {
    var self = this

    if (typeof this._connection === 'object') {
      this._connection.end(function(err){
        if (err) {
          self.emit('error', err);
        }
        else {
          self.connected = false;
          self.emit('destroyed', this);
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


module.exports = mysql;