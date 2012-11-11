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
 @module table
 @requires events
 @requires utilities
**/
var events  = require('events')
  , utils   = require('utilities')
  , Field   = require('./field').Field

var table = {};

/**
  Constructs a new instance of a Table

  @name Table
  @constructor
  @param {String} name The name of the table
  @param {Object} fields A map of the fields
  @param {Array} permissions An array of permissions
**/
table.Table = function(name, fields, permissions){
  if (! name) {
    throw "An instance of Table cannot be defined";
  }

  var field

  /**
    The name of the table

    @property name
    @public
    @type {String}
  **/
  this.name = name;

  /**
    The fields map

    @property fields
    @public
    @type {Object}
  **/
  this.fields = {};

  /**
    The permsissions array

    @property permissions
    @public
    @type {Array}
  **/
  this.permissions = (permissions && permissions.length && permissions.push? 
                        permissions : 
                        []);

  if (typeof fields === 'object') {
    for (field in fields) {
      this.setField(field, fields[field]);
    }
  }
};

table.Table.prototype = {
  setField : function(name, field) {
    if (typeof field === 'object') {
      this.fields[name] = new Field(name, field.type, field.indexable, field.description);
    }
  }
}

// Inheritance
table.Table.prototype = utils.mixin(table.Table.prototype, events.EventEmitter.prototype);

module.exports = table;