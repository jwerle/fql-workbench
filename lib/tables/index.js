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
 @module tables
**/
var fs        = require('fs')
  , path      = require('path')
  , libDir    = 'lib/'
  , tablesDir = 'tables/'
  , excluded  = ['index']
  , supExts   = ['.js']
  , _tables
  , i
  , ext
  , table

var tables = {};

tables._names   = [];
tables._tables  = {};

_tables = fs.readdirSync(path.join('.', libDir, tablesDir));

for (i = _tables.length - 1; i >= 0; i--) {
  if (!!~ supExts.indexOf((ext = path.extname(_tables[i]))) && !~ excluded.indexOf((table = _tables[i].replace(ext, '')))) {
    if (table.indexOf('_') == 0) {
      continue;
    }

    tables._names.push(table);
    tables._tables[table] = require('./' + path.join(table));
    !function(tables, table){
      tables.__defineGetter__(table, function(){
        return tables._tables[table]
      });
    }(tables, table);
  }
}

tables.hasTable = function(table) {
  return (!!~ tables._names.indexOf(table) ? true : false);
}

tables.getTable = function(table) {
  return (tables.hasTable(table) ? tables[table] : null);
};

module.exports = tables;