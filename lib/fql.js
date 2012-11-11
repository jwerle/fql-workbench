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
  SELECT metric, value FROM insights WHERE object_id=:id AND metric='application_active_users' AND end_time=end_time_date('2011-06-26') AND period=period('month')

  #user select uid, username, first_name, middle_name, last_name, name, pic, birthday, sex from user where uid = :uid; #profile select username, name, pic from #user
*/

/*
 @module fql
*/
require('colors');

var graph       = require('fbgraph')
  , request     = require('request')
  , utils       = require('utilities')
  , events      = require('events')
  , tables      = require('./tables')
  , functions   = require('./functions')
  , accessUrl   = 'https://graph.facebook.com/oauth/access_token'
  , processMultiQuery
  , processBindings
  , processKeywords
  , executeQuery
  , noop

noop = function noop(){};

processMultiQuery = function(query) {
  var queryObj = {}, queries, i, match

  if (!!~ query.indexOf('#')) {
    queries = query.split(';');

    for (i = 0; i < queries.length; i++) {
      if ((match = queries[i].match(/#([a-zA-Z0-9]+)\s+(.*)/))) {
        if (match[1] && !~ match[1].indexOf(' ')) {
          queryObj[match[1]] = match[2];
        }
      }
    }

    query = queryObj;
  }

  return query;
};

processBindings = function(scope, query) {
  var prop, regex

  for (prop in scope) {
    if (scope.hasOwnProperty(prop)) {
      regex = new RegExp(':'+ prop, 'g')
      query = query.replace(regex, scope[prop]);
    }
  }

  return query;
};

processKeywords = function(scope, query) {
  var cmds          = functions.getNames()
    , nonSupported  = functions.getNonSupported()
    , keywords      = functions.getKeywords(cmds, nonSupported)
    , isQuery       = query.toLowerCase().match(/select\s+[a-z,]+/gi)
    , cmd
    , args
    , func

  if (scope.isUser) {
    query = query.replace('me()', scope.uid);
  }

  if (query.match(keywords)) {
    if (! isQuery) {
      query = {
        value         : query,
        _preventQuery :true
      };

      func = functions.parseInput(query.value);
      cmd  = func.cmd;
      args =  [cmd, scope].concat(func.args);

      return {
        data :functions.call.apply(functions, args), 
        _preventQuery : true
      };
    }
  }

  return query;
};

executeQuery = function(scope, query) {
  var cb

  if (query && query._preventQuery !== true) {
    setTimeout(function(){ 
      graph.fql(query, scope.renderResponse());

      scope._inTransit = false;
    }, 0);
  }
  else {
    scope.once('query.ready', function(query){
      cb = scope.renderResponse();
      cb(null, query, scope);

      scope._inTransit = false;
    });
  }
};


/**
  @namespace fql
**/
var fql = {};

fql.Session = function(id, secret, uid, completions) {
  this.id = id;
  this.secret = secret;
  this.uid = uid;
  this.accessToken = null;
  this.connected = false;
  this.lastQueryStartTime = null;
  this.lastQueryEndTime = null;
  this._complete = noop;
  this.completions = {};
}

fql.Session.prototype = utils.mixin({}, events.EventEmitter.prototype);

fql.Session.prototype.connect = function() {
  var self = this;

  request.post(accessUrl, {
    form : {
      type          : 'client_cred',
      client_id     : self.id,
      client_secret : self.secret
    }
  }, function(err, resp, data){
      var token

      if (err) {
        console.error(error);
        throw err;
      }

      if (data) {
        if (token = data.split('=')[1]) {
          self.accessToken = token;
          self.connected = true;
          graph.setAccessToken(token);
          self.emit('connected', token);
        }
      }
  })

  return this;
};

fql.Session.prototype.ready = function(callback) {
  this.once('connected', function(){
    callback.apply(this, arguments);
  });

  return this;
};

fql.Session.prototype._inTransit = false;

fql.Session.prototype.query  = function(query) {
  var self = this, regex, prop

  if (this._inTransit) {
    return this;
  }

  this._inTransit = true;
  this.lastQueryStartTime = Date.now();

  query = processBindings(this, query);
  query = processMultiQuery(query);
  query = processKeywords(this, query);

  executeQuery(this, query);

  return this;
};

fql.Session.prototype.complete = function(callback) {
  this._complete = typeof callback === 'function'? callback : noop;

  return this;
};

fql.Session.prototype.renderResponse = function() {
  var self = this

  return function(err, data) {
    self.lastQueryEndTime = Date.now();

    if (err) {
      console.error(err.message.red);
      self.connect();
      return false;
    }
    
    data = data.data ? data.data : data;
    self._complete.apply(self, [data, (new String(((self.lastQueryEndTime - self.lastQueryStartTime)/1000))).valueOf()]);
  }
}

/*
// Test
var sess = new fql.Session('459902834061249', '6869526eeba8fe539fe8cc4f7c5bdc64');

sess.connect().ready(function(token){
  sess.query("SELECT metric, value FROM insights WHERE object_id="+ sess.id+ " AND metric='application_active_users' AND end_time=end_time_date('2011-06-26') AND period=period('month')").complete(function(data){
      if (data) {
        console.error(data)
      }
  });
});
*/

/*
  @exports fql
*/
module.exports = fql