
var request = require('request')
  , jsdom = require("jsdom")
  , permissions = require('./_permissions')
  , tableEndpoint = 'http://developers.facebook.com/docs/reference/fql/'
  , tableToJson
  , noop

noop = function(){};

var _import = {};

// Borrowed - http://johndyer.name/html-table-to-json
tableToJson = function(table) {
  var data = [], headers = [], tableRow, rowData, i, j 

  if (! (table && table.rows)) {
    return false;
  }

  for (i = 0; i < table.rows[0].cells.length; i++) {
    headers[i] = table.rows[0].cells[i].textContent.trim().toLowerCase().replace(/ /gi,'');
  }

  for (i = 1; i < table.rows.length; i++) {

    tableRow = table.rows[i];
    rowData = {};

    for (j = 0; j < tableRow.cells.length; j++) {
      rowData[ headers[j] ] = tableRow.cells[j].textContent.trim();
    }

    data.push(rowData);
  }       

  return data;
}

_import.getTableDefinition = function(table) {
  var cb = noop, url = tableEndpoint + table

  //console.log(["Fetching table definition for".green, table.green, url.cyan].join(' '));

  request({
    url : url + '/', 
    followAllRedirects : true,
    headers : {
    'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.2 Safari/537.17'
    }}, function(error, response, data){
      jsdom.env(data, ["http://code.jquery.com/jquery.js"], function(errors, window) {
        if (! (window.jQuery || window.$)) {
          return cb(false);
        }

        var $ = window.jQuery
          , perms = []
          , fields = tableToJson($('#bodyText table').get(0))

        if (! fields) {
          if (_import.debug === true) {
            console.log("Couldn't read fields for ".red + table.green + "!".red)
          }
          
         return cb(false);
        }
        
        // ETL
        $('#bodyText p')
          .filter(function(){ return this.textContent && this.textContent.match(/to\sread\sthe\s[a-z]+\stable/i) ? true : false })
          .next('ul')
          .children().filter(function(i, el){
            var perm, type

            if ((perm = $(el).find('code').html()).length) {
              for (type in permissions) {
                if (!!~ permissions[type].indexOf(perm.trim())) {
                  if (!~ perms.indexOf(perms) && perms.push(perm)) {
                    return true;
                  }
                }
              }
            }

            return false;
          });

        cb(fields, perms, table);
        cb = noop;
      });
  });

  return {
    done : function(callback) {
      if (typeof callback === 'function') {
        cb = callback;
      }
    }
  }
};

_import.getTables = function() {
  var cb = function(){}, url = 'http://developers.facebook.com/docs/reference/fql/'

  //console.log(["Fetching tables from".green, url.cyan].join(' '));

  request({
    url : url + '/', 
    followAllRedirects : true,
    headers : {
    'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.2 Safari/537.17'
    }}, 
    function(error, response, data) {
      jsdom.env(data, ["http://code.jquery.com/jquery.js"], function(errors, window) {
        var $ = window.jQuery
          , tables = []
          
          $('#navsubsectionpages li:first-child').children('ul').children().each(function(){
            if (this.textContent) {
              tables.push(this.textContent);
            }
          });

          cb({tables : tables});
      });
  });

  return {
    done : function(callback) {
      if (typeof callback === 'function') {
        cb = callback;
      }
    }
  }
};

module.exports = _import;