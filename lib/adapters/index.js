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
 @module adapters
**/
var fs          = require('fs')
  , path        = require('path')
  , utils       = require('utilities')
  , libDir      = 'lib/'
  , adaptersDir = 'adapters/'
  , excluded    = ['index']
  , supExts     = ['.js']
  , _adapters
  , i
  , ext
  , adapter

var adapters = {};

adapters._names   = [];
adapters._adapters  = {};
adapters._shims   = {
  'note' : 'notes'
};

adapters.getInheritance = function() {
  var proto = {}, adapter

  for (adapter in this._adapters) {
    proto = utils.mixin(proto, this._adapters[adapter].prototype);
  }

  return proto;
};

_adapters = fs.readdirSync(__dirname);

for (i = _adapters.length - 1; i >= 0; i--) {
  if (!!~ supExts.indexOf((ext = path.extname(_adapters[i]))) && !~ excluded.indexOf((adapter = _adapters[i].replace(ext, '')))) {
    if (adapter.indexOf('_') == 0) {
      continue;
    }

    adapters._names.push(adapter);
    adapters._adapters[adapter] = require('./' + path.join(adapter));
    !function(adapters, adapter){
      adapters.__defineGetter__(adapter, function(){
        return adapters._adapters[adapter]
      });
    }(adapters, adapter);
  }
}

module.exports = adapters;