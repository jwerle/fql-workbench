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

var fs          = require('fs')
  , graph       = require('fbgraph')
  , request     = require('request')
  , utils       = require('utilities')
  , events      = require('events')
  , yaml        = require('yamljs')
  , tables      = require('./tables')
  , functions   = require('./functions')
  , _import     = require('./tables/_import')
  , accessUrl   = 'https://graph.facebook.com/oauth/access_token'
  , processMultiQuery
  , processBindings
  , processKeywords
  , executeQuery
  , noop
  , QueryError

noop = function noop(){};

QueryError = function(msg, query) {
  this._error         = true;
  this._preventQuery  = true;
  this.data           = {
    message : (msg || "") + " [" + query + "]"
  }
  this.query = query
}

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
      
      //if (! query.match(new RegExp('\:' + prop))) {
        query = query.replace(regex, scope[prop]);
      //}
    }
  }

  return query;
};

processKeywords = function(scope, query) {
  var cmds          = functions.getNames()
    , nonSupported  = functions.getNonSupported()
    , keywords      = functions.getKeywords(cmds, nonSupported)
    , isQuery       = typeof query === 'string' && query.toLowerCase().match(/select\s+[a-z,]+/gi)
    , cmd
    , args
    , table
    , match
    , func
    , alias
    , selects
    , preventQueryHealthCheck = false

  if (typeof query === 'string' && query.match(keywords)) {
    preventQueryHealthCheck = true;

    
    
    //if (! isQuery) {
      query = {
        value         : query,
        _preventQuery :true
      };

      func = functions.parseInput(query.value);
      cmd  = func.cmd;
      args =  [cmd, scope].concat(func.args);

      if (! functions.exists(cmd)) {
        args[0] = 'invalid';
      }

      return {
        data : functions.call.apply(functions, args), 
        _preventQuery : true
      };
    //}
  } else if (typeof query === 'object') {
    for (alias in query) {
      query[alias] = processKeywords(scope, query[alias])
    }
  }

  if (scope.isUser) {
    if (typeof query === 'string') {
      query = query.replace(/\:?me\(\)/gi, scope.uid);
    }
    else if (typeof query === 'object') {
      for (var q in query) {
        query[q] = query[q].replace(/\:?me\(\)/gi, scope.uid);
      }
    }
  }


  if (! preventQueryHealthCheck) {
    if (! query.match(/select/i)) {
      return new QueryError("Missing SELECT statement.", query);
    }

    if ((selects = query.match(/select\s+([a-z]+,?)?/i)) && (selects[1] && selects[1].match(/\s?from|where|in|and|select/i)) || !selects) {
      return new QueryError("Nothing to select", query);
    }

    if (! query.match(/\s?from/i)) {
      return new QueryError("Missing FROM clause.", query);
    }

    if (! query.match(/\s?where/i)) {
      return new QueryError("Missing WHERE clause.", query);
    }
  }


  if (typeof query === 'string') {
    if (query.match(/select\s+\*/i)) {
      if ((match = query.match(/from\s+(.*)\s+where+/i)) && (table = match[1])) {
        query = {
          value         : query,
          _preventQuery : true
        }

        _import.getTableDefinition(table).done(function(fields, permissions){
          var names = [], i

          for (i = 0; i < fields.length; i++) {
            names.push(fields[i].name);
          }

          query = query.value.replace(/\*/, names.join(', '));
          scope.connect().ready(function(){
            scope.query(query, true).complete(function(data){
              scope.bench.writeToSocket(yaml.stringify(data));
            });
          })
        })
      }
    }
  }

  return query;
};

executeQuery = function(scope, query, callback, preventCompleteReset, preventPromptReset) {
  var cb, ready

  ready = function(q){
    cb = scope.renderResponse(false, preventCompleteReset);
    scope._inTransit = false;

    if (typeof q === 'object' && q._error) {
      cb(q.data, q, scope, preventPromptReset);
    }
    else {
      cb(null, q, scope, preventPromptReset);
    }


    //scope.removeAllListeners('query.ready');

      scope.emit('query.executed'); 
  };

  if (query && query._preventQuery !== true && !query._error) {
    setTimeout(function(){
      callback = (typeof callback === 'function'? callback : scope.renderResponse(true, preventCompleteReset));

      graph.fql(query, function(err, data){
        callback(err, data, scope, preventPromptReset)
        scope.emit('query.executed');
      });

      scope._inTransit = false;
    }, 0);
  }
  else {
    scope.once('query.ready', ready);
  }


};


/**
  @namespace fql
**/
var fql = {};

fql.Session = function(id, secret, uid, completions) {
  var prop

  this.id = id;
  this.secret = secret;
  this.uid = uid;
  this.accessToken = null;
  this.connected = false;
  this.lastQueryStartTime = null;
  this.lastQueryEndTime = null;
  this._complete = noop;
  this.completions = [].concat(completions);
  this.bench = null;

  for (prop in this) {
    if (prop != 'completions' && this.hasOwnProperty(prop) && this[prop] && typeof this[prop] != 'function' && this[prop] != null) {
      this.completions.push(':' + prop);
    }
  }
}

fql.Session.prototype = utils.mixin({}, events.EventEmitter.prototype);

fql.Session.prototype.setBench = function(bench) {
  this.bench = bench;

  return this;
};

fql.Session.prototype.connect = function() {
  var self = this;

  request.post(accessUrl, {
    form : {
      type          : 'client_cred',
      client_id     : self.id,
      client_secret : self.secret
    }
  }, function(err, resp, data){
      var token, error = false

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
        else {
          error = "Couldn't parse access token!";
        }
      }
      else {
        error = "Facebook didn't return authentication data!";
      }

      if (error) {
        console.error(error.red);
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
fql.Session.prototype.queue = [];

fql.Session.prototype.parseFile = function(file) {
  var self = this, code

  if (fs.statSync(file)) {
    file = fs.readFileSync(file);

    code = file.toString().replace(/\n/g,'; ').replace(/;+/g,';');

    this.query(code, true).complete(function(data){
      self.bench.writeToSocket(data.cyan);
    });
  }
};

fql.Session.prototype.query  = function(query, force, callback, preventCompleteReset, multi) {
  var self = this, regex, prop, i, last, first, cleanup, findComments, parseVars, applyVars
    , vars = {}

  cleanup = function(query) {
    var clean = []

    for (i = 0; i < query.length; i++) {
      query[i] = query[i].replace(/^\s/,'');
      query[i] = query[i].trim().split('').reverse().join('').trim().split('').reverse().join('');
      
      if (query[i].length && ! query[i].match(/^\s+$/)) {
        clean.push(query[i]);
      }
    }

    return clean;
  };

  findComments = function(query) {
    var clean = []

    for (i = 0; i < query.length; i++) {

      if (!~ query[i].indexOf('#')) {
        clean.push(query[i])
      }
    }

    return clean;
  };

  parseVars = function(query) {
    var match, clean = [], v

    for (i = 0; i < query.length; i++) {
      if ((match = query[i].match(/@([a-z]+)\s+=\s+(.*);?/))) {
        if (match[1]) {
          vars[match[1]] = match[2] || undefined;
        }
      }
      else {
        clean.push(query[i])
      }
    }

    for (i = 0; i < clean.length; i++) {
      for (v in vars) {
        clean[i] = clean[i].replace(new RegExp("@" + v, 'g'), vars[v]);
      }
    }

    return clean;
  };

  applyVars = function(query) {

    return query;
  };

  query = query.split(/;+/)

  if (query.length > 1 && query[1].trim().length) {

    // Clean up
    query = cleanup(query)
    
    // Find comments
    query = findComments(query);

    // Parse vars
    query = parseVars(query);

    // Apply vars
    query = applyVars(query);

    //console.log(query)
    
    // Split queries
    for (i = 0; i < query.length; i++) {
      last  = (i === query.length -1);
      first = (i === 0);

      // preserve scope
      ;(function(query, last, first){
        if (first) {
          self.query(query, false, callback, true, true);
        }
        else {
          self.queue.push(function(){
            self.query(query, false, callback, true, !last);
          });
        }
      })(query[i].split('').reverse().join('').trim('').split('').reverse().join(''), (last? true : false), first);

    }

    self.on('query.callback', function(){
      var cb = self.queue.shift()

      if (typeof cb === 'function') {
        cb();
      }
      else {
        self.removeAllListeners('query.callback')
      }
    });

    return this;
  }
  else {
    query = query[0]
  }

  if (force !== true && this._inTransit) {
    return this;
  }

  this._inTransit = true;
  this.lastQueryStartTime = Date.now();

  query = processBindings(this, query);
  query = processMultiQuery(query);
  query = processKeywords(this, query);

  executeQuery(this, query, callback, preventCompleteReset, multi);

  if (typeof query === 'object') {
    if (query._error) {
      this.emit('query.ready', query);
    }
  }

  return this;
};

fql.Session.prototype.complete = function(callback) {
  this._complete = typeof callback === 'function'? callback : noop;

  return this;
};

fql.Session.prototype.renderResponse = function(isQuery, preventCompleteReset) {
  var self = this

  return function(err, data, scope, preventPromptReset) {
    self.lastQueryEndTime = Date.now();

    var time = (new String(((self.lastQueryEndTime - self.lastQueryStartTime)/1000))).valueOf()

    if (err) {

      self.bench.writeToSocket(err.message.red);
      self.emit('query.error')
    }
    else {
      data = data.data ? data.data : data;
      self._complete.apply(self, [data, time, isQuery, preventPromptReset]);
      self._complete = preventCompleteReset === true? self._complete : noop;
      self.emit('query.callback')
    }

    return self;
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