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
 @module type
**/

var type = {};

type.supported = [
  'string', 'int', 'float', 'bool', 
  'array', 'object', 'time', 'mixed', 
  'uid'
];

/**
  Constructs a new instance of a Type

  @name Type
  @constructor
  @param {String} type The data type
  @param {Number} length The data type length
**/
type.Type = function(type, length){
  if (! type) {
    throw "An instance of Type must have a type";
  }

  type = type.toLowerCase();

  if (!~ this.supported.indexOf(type)) {
    throw ["'"+ type +"'", "is not a support type!"].join(' ');
  }

  /**
    The data type

    @property type
    @public
    @type {String}
  **/
  this.type = type;

   /**
    The data type length

    @property length
    @public
    @type {Number}
  **/
  this.length = length;
};

type.Type.prototype = {
  supported : type.supported,

  valueOf   : function() {
    return this.type;
  },

  toString  : function() {
    return this.type;
  }
};


module.exports = type;