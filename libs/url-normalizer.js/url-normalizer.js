(function(exports){
  exports.query = function(url){
    var url_parts = this.parse_url(url);

    var ret = {};
    ret.query_url = url;

    switch (url_parts['hostname']) {
    case 'udn.com':
    case 'www.udn.com':
      // https://github.com/g0v/url-normalizer.js/issues/8
      var matches = url_parts['pathname'].match('^/NEWS/([^/]*)/([^/]*)/([^/]*-)?([0-9]*)\.shtml$');
      if (null !== matches) {
        ret.normalized_url = 'http://udn.com/NEWS/' + matches[1] + '/' + matches[2] + '/' + matches[4] + '.shtml';
        ret.normalized_id = 'udn.com/news/' + matches[4];
        return ret;
      }

      matches = url_parts['pathname'].match('^/[0-9]*/[0-9]*/[0-9]*/NEWS/[^/]*/[^/]*/([0-9]*).shtml$');
      if (null !== matches) {
        ret.normalized_url = 'http://www.udn.com' + url_parts['pathname'];
        ret.normalized_id = 'udn.com/news/' + matches[1];
        return ret;
      }
      break;

    case 'forum.udn.com':
      if ('/forum/NewsLetter/NewsPreview' === url_parts['pathname']) {
          var params = this.parse_str(url_parts['query']);
          ret.normalized_url = 'http://forum.udn.com/forum/NewsLetter/NewsPreview?Encode=Big5&NewsID=' + params['NewsID'];
          ret.normalized_id = 'udn.com/news/' + params['NewsID'];
          return ret;
      }
      
    case 'www.facebook.com':
      // Rule: https://github.com/g0v/url-normalizer.js/issues/1
      // https://www.facebook.com/photo.php?fbid=187340678125996&set=a.169476096579121.1073741830.100005501943040&type=1&theater
      if ('/photo.php' === url_parts['pathname']) {
        var params = this.parse_str(url_parts['query']);
        ret.normalized_url = 'https://www.facebook.com/photo.php?fbid=' + params['fbid'];
        ret.normalized_id = 'www.facebook.com/photo/' + params['fbid'];
        return ret;
      }

      if ('/permalink.php' === url_parts['pathname']) {
        var params = this.parse_str(url_parts['query']);
        ret.normalized_url = 'https://www.facebook.com/permalink.php?story_fbid=' + params['story_fbid'] + '&id=' + params['id'];
        ret.normalized_id = 'www.facebook.com/permalink/' + params['story_fbid'] + '/' + params['id'];
        return ret;
      }

      var matches = url_parts['pathname'].match('^/([^/]*)/posts/([0-9]*)');
      if (null !== matches) {
        ret.normalized_url = 'https://www.facebook.com' + url_parts['pathname'];
        ret.normalized_id = 'www.facebook.com/posts/' + matches[2];
        return ret;
      }
      break;
    
    case 'tw.news.yahoo.com':
      // Rule: https://github.com/g0v/url-normalizer.js/issues/3
      // http://tw.news.yahoo.com/敘利亞沙林原料-英廠商提供的-044631577.html
      var matches = url_parts['pathname'].match('^/.*-([0-9]*)\.html');
      if (null !== matches) {
        ret.normalized_url = 'http://tw.news.yahoo.com' + url_parts['pathname'];
        ret.normalized_id = 'tw.news.yahoo.com/' + matches[1];
        return ret;
      }

      break;

    case 'www.ettoday.net':
      // Rule: https://github.com/g0v/url-normalizer.js/issues/4
      // http://www.ettoday.net/news/20131106/291629.htm
      var matches = url_parts['pathname'].match('^/news/([0-9]*)/([0-9]*)\.htm$');
      if (null !== matches) {
        ret.normalized_url = 'http://www.ettoday.net' + url_parts['pathname'];
        ret.normalized_id = 'www.ettoday.net/news/' + matches[2];
        return ret;
      }
      break;

    case 'iservice.libertytimes.com.tw':
      // Rule: https://github.com/g0v/url-normalizer.js/issues/5
      // http://iservice.libertytimes.com.tw/liveNews/news.php?no=927070&type=國際
      if ('/liveNews/news.php' == url_parts['pathname']) {
        var params = this.parse_str(url_parts['query']);
        ret.normalized_url = 'http://iservice.libertytimes.com.tw/liveNews/news.php?no=' + params['no'];
        ret.normalized_id = 'iservice.libertytimes.com.tw/liveNews/' + params['no'];
        return ret;
      }
      break;

    case 'www.libertytimes.com.tw':
      // Rule: https://github.com/g0v/url-normalizer.js/issues/5
      // http://www.libertytimes.com.tw/2013/new/dec/30/today-taipei1.htm
      var matches = url_parts['pathname'].match('^/([0-9]*)/new/([a-z]*)/([0-9]*)/today-([^.]*)\.htm$');
      if (null !== matches) {
        ret.normalized_url = 'http://www.libertytimes.com.tw' + url_parts['pathname'];
        ret.normalized_id = 'www.libertytimes.com.tw/new/' + matches[1] + '/' + matches[2] + '/' + matches[3] + '/' + matches[4];
        return ret;
      }
      break;

    case 'newtalk.tw':
      // Rule: https://github.com/g0v/url-normalizer.js/issues/6
      // http://newtalk.tw/news/2013/12/30/43243.html
      var pathname_parts = url_parts['pathname'].split('/');
      if ('news' == pathname_parts[1]) {
        ret.normalized_url = 'http://newtalk.tw/news/' + pathname_parts[2] + '/' + pathname_parts[3] + '/' + pathname_parts[4] + '/' + pathname_parts[5];
        ret.normalized_id = 'newtalk.tw/' + pathname_parts[5].split('.')[0];
        return ret;
      }
      break;

    case 'www.nownews.com':
      // Rule: https://github.com/g0v/url-normalizer.js/issues/7
      // before 2013/10/29 http://www.nownews.com/2013/10/28/341-3000805.htm
      // http://www.nownews.com/n/2013/10/28/1003767
      var pathname_parts = url_parts['pathname'].split('/');
      if ('n' == pathname_parts[1]) {
        ret.normalized_url = 'http://www.nownews.com/n/' + pathname_parts[2] + '/' + pathname_parts[3] + '/' + pathname_parts[4] + '/' + pathname_parts[5];
        ret.normalized_id = 'www.noewnews.com/' + pathname_parts[5];
        return ret;
      }

      if (pathname_parts[1].match('^[0-9]+$')) {
        // 捨棄掉舊網址，因為舊網址必需要去戳才知道新的 ID 是什麼
        break;
      }
      break;

    case 'www.cna.com.tw':
      // Rule: https://github.com/g0v/url-normalizer.js/issues/2
      // http://www.cna.com.tw/News/aFE/201309070021-1.aspx
      // http://www.cna.com.tw/News/firstnews/201309070021-1.aspx
      // http://www.cna.com.tw/Topic/Popular/3959-1/201309070021-1.aspx
      var pathname_parts = url_parts['pathname'].split('/');
      if ('News' == pathname_parts[1] && 'a' == pathname_parts[2].charAt(0)) {
        ret.normalized_url = 'http://www.cna.com.tw/News/aAll/' + pathname_parts[3];
        ret.normalized_id = 'www.cna.com.tw/aAll/' + pathname_parts[3];
        return ret;
      }

      if ('News' == pathname_parts[1] && 'firstnews' == pathname_parts[2].toLowerCase()) {
        ret.normalized_url = 'http://www.cna.com.tw/News/firstnews/' + pathname_parts[3];
        ret.normalized_id = 'www.cna.com.tw/firstnews/' + pathname_parts[3];
        return ret;
      }

      if ('Topic' == pathname_parts[1] && 'Popular' == pathname_parts[2]) {
        ret.normalized_url = 'http://www.cna.com.tw/News/firstnews/' + pathname_parts[4];
        ret.normalized_id = 'www.cna.com.tw/firstnews/' + pathname_parts[4];
        return ret;
      }
      break;

    case 'www.chinatimes.com':
      // Ex: http://www.chinatimes.com/newspapers/蠻牛再起-3登年終球王-20131108000743-260111
      // {newspapers|realtimenews}
      // {$title-}{$time-id}
      // $title 可能包含 - ，$time/$id 一定要吻合才能看到
      var pathname_parts = url_parts['pathname'].split('/');

      // 一定是 newspapers or realtimenews
      if (pathname_parts[1] != 'newspapers' && pathname_parts[1] != 'realtimenews') {
        break;
      }
      var title_parts = pathname_parts[2].split('-');
      // 如果網址後面的以 - 分開不到兩樣東西表示非合法網址
      if (title_parts.length < 2) {
        break;
      }
      var url_id = title_parts.pop();
      var url_time = title_parts.pop();
      
      ret.normalized_url = 'http://www.chinatimes.com/' + pathname_parts[1] + '/' + url_time + '-' + url_id;
      ret.normalized_id = 'www.chinatimes.com/' + pathname_parts[1] + '/' + url_time + '/' + url_id;
      return ret;
      console.log(title_parts.pop());
      break;


    case 'www.appledaily.com.tw':
      // Ex: http://www.appledaily.com.tw/realtimenews/article/finance/20131225/314703/【台股開盤】開高上漲11點
      // /{appledaily|realtimenews} 不能換掉
      // /article
      // /{$category} 3c, beauty, entertainment ... 可以任意更換
      // /YYYYMMDD 日期，不能任意更換
      // /{$ID}
      // /{$TITLE} 可以拿掉
      var pathname_parts = url_parts['pathname'].split('/');
      if ('article' != pathname_parts[2]) {
        // 不是新聞網址
        break;
      }

      ret.normalized_url = 'http://www.appledaily.com.tw/' + pathname_parts[1] + '/article/local/' + pathname_parts[4] + '/' + pathname_parts[5];
      ret.normalized_id = 'www.appledaily.com.tw/' + pathname_parts[1] + '/' + pathname_parts[4] + '/' + pathname_parts[5];
      return ret;
    }

    return null;
  };

  exports.parse_str = function(query_str){
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

  exports.parse_url = function(url){
    if ('undefined' !== typeof(document) && 'undefined' !== typeof(document.createElement)) {
      var a_dom = document.createElement('a');
      a_dom.href = url;
      return a_dom;
    } else {
      var u = require('url');
      return u.parse(url);
    }
  };
})(typeof exports === 'undefined'? this['URLNormalizer']={}: exports);
