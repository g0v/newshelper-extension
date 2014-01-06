(function(exports){
  exports.replace_var = function(data, matches, query){
    return data.replace(/{\$[^}]*}/g, function(str){
        var id = str.substr(2, str.length - 3);
        if (id.match('^[0-9]*$')) {
          return matches[parseInt(id)];
        }
        var params = exports.parse_str(query);
        return params[id];
    });
  };

  exports.query = function(url, cb){
    this.getCSVMap(function(csvmap){
      var url_parts = exports.parse_url(url);
      var ret = {};
      ret.query_url = url;

      for (var i = 1; i < csvmap.length; i ++) {
        if (csvmap[i][0] != url_parts['hostname']) {
          continue;
        }
        var matches = csvmap[i][1].match(/'(.*)'([a-z]*)/);
        var pattern = new RegExp(matches[1].replace('/', '\\/'), matches[2]);
        matches = pattern.exec(url_parts['pathname']);
        if (null === matches) {
          continue;
        }

        ret.normalized_url = exports.replace_var(csvmap[i][2], matches, url_parts['query']);
        ret.normalized_id = exports.replace_var(csvmap[i][3], matches, url_parts['query']);
        cb(ret);
      }
      cb(false);
    });
  };

  exports.parse_str = function(query_str){
    if ('undefined' === typeof(query_str)) {
      return {};
    }
    if (query_str == '') {
      return {};
    }
    var terms = query_str.split('&');
    var ret = {};
    for (var i = 0; i < terms.length; i ++) {
      var key_value = terms[i].split('=');
      if (key_value.length < 2) {
        continue;
      }
      var key = decodeURIComponent(key_value.shift());
      var value = decodeURIComponent(key_value.join('='));
      ret[key] = value;
    }
    return ret;
  }

  var csvmap = null;
  var map_csv_path = 'map.csv';

  exports.setCSVMapPath = function(path){
    map_csv_path = path;
  };

  exports.getCSVMap = function(cb){
    if (null !== csvmap) {
      return cb(csvmap);
    }
    if ('undefined' !== typeof(XMLHttpRequest)) {
      var csvFile = new XMLHttpRequest;
      csvFile.open("GET", map_csv_path, true);
      csvFile.onreadystatechange = function(){
        if (csvFile.readyState == 4) {
          if (csvFile.status == 200) {
            csvmap = csvFile.responseText.split("\n").map(function(line){ return line.split(','); });
	    cb(csvmap);
          }
        }
      };
      csvFile.send('');
    } else {
      var fs = require('fs');
      fs.readFile('map.csv', 'ascii', function(err, data){
        csvmap = data.split("\n").map(function(line){ return line.split(','); });
        cb(csvmap);
      });
    }
  },

  exports.parse_url = function(url){
    if ('undefined' !== typeof(document) && 'undefined' !== typeof(document.createElement)) {
      var a_dom = document.createElement('a');
      a_dom.href = url;
      return {
        pathname: decodeURIComponent(a_dom.pathname),
        hostname: a_dom.hostname,
        query: a_dom.search.length ? a_dom.search.substr(1) : ''
      };
    } else {
      var u = require('url');
      var parts = u.parse(url);
      return {
        pathname: decodeURIComponent(parts.pathname),
        hostname: parts.hostname,
        query: parts.query
      };
    }
  };
})(typeof exports === 'undefined'? this['URLNormalizer']={}: exports);
