var seen_link = {};
var last_sync_at = -1;

function onRequest(request, sender, sendResponse) {
  if (request.method == 'page') {
    // 顯示設定新聞小幫手的 page action
    chrome.pageAction.show(sender.tab.id);
  }

  if (request.method == 'add_notification') {
    add_notification(request.title, request.body, request.link);
  }

  if (request.method == 'start_sync_db') {
    if (last_sync_at < 0) {
      last_sync_at = 0;
      setInterval(function(){
        if ((new Date()).getTime() - last_sync_at < 300 * 1000) {
          return;
        }
        last_sync_at = (new Date()).getTime();

        sync_db(false);
      }, 10000);
    }
  }

  if (request.method == 'log_browsed_link') {
    log_browsed_link(request.link, request.title);
  }

  if (request.method == 'check_report') {
    check_report(request.title, request.url, sendResponse);
    return true;
  }

  // Return nothing to let the connection be cleaned up.
  sendResponse({});
};

// Listen for the content script to send a message to the background page.
chrome.runtime.onMessage.addListener(onRequest);

var next_fetch_at = 0;
// sync db from api server
var sync_db = function(force_notification){
  get_newshelper_db(function(opened_db){
    get_recent_report(function(latest_report){
      var version_time = Math.max(next_fetch_at, (latest_report ? parseInt(latest_report.updated_at) : 0));
      $.get('http://d3n4xylkjv5pnb.cloudfront.net/index/data?time=' + version_time, function(ret){
        var transaction = opened_db.transaction("report", 'readwrite');
        var objectStore = transaction.objectStore("report");
        next_fetch_at = ret.time;
        if (ret.data) {
          for (var i = 0; i < ret.data.length; i ++) {
            objectStore.put(ret.data[i]);

            // 檢查最近天看過的內容是否有被加進去的(有 latest_report 才檢查，避免 indexeddb 清空後會被洗板, 如果 force_notification 為 true 就不檢查)
            if (force_notification || latest_report) {
              // 只讓 notification 通知一次，如果之後再更新就不通知了
              if (parseInt(ret.data[i].created_at, 10) > parseInt(latest_report.updated_at, 10)) {
                check_recent_seen(ret.data[i]);
              }
            }
          }
        }
      }, 'json');
    });
  });
};

var opened_db = null;
// open db
var get_newshelper_db = function(cb){
  if (null !== opened_db) {
    cb(opened_db);
    return;
  }

  var request = indexedDB.open('newshelper', '8');
  request.onsuccess = function(event){
    opened_db = request.result;
    cb(opened_db);
    return;
  };

  request.onerror = function(event){
    console.log("IndexedDB error: " + event.target.errorCode);
  };

  request.onupgradeneeded = function(event){
    try {
      event.currentTarget.result.deleteObjectStore('report');
    }
    catch (e) {}
    var objectStore = event.currentTarget.result.createObjectStore("report", { keyPath: "id" });
    objectStore.createIndex("news_title", "news_title", { unique: false });
    objectStore.createIndex("news_link", "news_link", { unique: false });
    objectStore.createIndex("news_link_unique", "news_link_unique", { unique: false });
    objectStore.createIndex("updated_at", "updated_at", { unique: false });

    try {
      var objectStore = event.currentTarget.result.createObjectStore("read_news", { keyPath: "id", autoIncrement: true });
      objectStore.createIndex("title", "title", { unique: false });
      objectStore.createIndex("link", "link", { unique: true });
      objectStore.createIndex("last_seen_at", "last_seen_at", { unique: false });
    }
    catch (e) {}
  };
};

// get newest report in db
var get_recent_report = function(cb){
  get_newshelper_db(function(opened_db){
    var transaction = opened_db.transaction('report', 'readonly');
    var objectStore = transaction.objectStore('report');
    var index = objectStore.index("updated_at");
    var request = index.openCursor(null, 'prev');
    request.onsuccess = function(){
      if (request.result) {
        cb(request.result.value);
        return;
      }
      cb(null);
    };
  });
};

// log link in read_news table
var log_browsed_link = function(link, title) {
  if (!link) {
    return;
  }
  if (seen_link[link]) {
    return;
  }
  seen_link[link] = true;

  get_newshelper_db(function(opened_db){
    var transaction = opened_db.transaction("read_news", 'readwrite');
    var objectStore = transaction.objectStore("read_news");
    var request = objectStore.add({
      title: title,
      link: link,
      last_seen_at: Math.floor((new Date()).getTime() /1000)
    });

    // link 重覆
    request.onerror = function(){
      var transaction = opened_db.transaction("read_news", 'readwrite');
      var objectStore = transaction.objectStore("read_news");
      var index = objectStore.index('link');
      var get_request = index.get(link);
      get_request.onsuccess = function(){
        if (!get_request.result) {
          console.log('link=' + link + ' is not found in IndexedDB');
          return;
        }
        // update last_seen_at
        var put_request = objectStore.put({
          id: get_request.result.id,
          title: title,
          last_seen_at: Math.floor((new Date()).getTime() /1000)
        });
      };
    };
  });
};

// check recent seen news with report
var check_recent_seen = function(report){
  if (parseInt(report.deleted_at, 10)) {
    return;
  }
  get_newshelper_db(function(opened_db){
    var transaction = opened_db.transaction("read_news", 'readonly');
    var objectStore = transaction.objectStore("read_news");
    var index = objectStore.index('link');
    var get_request = index.get(report.news_link);
    get_request.onsuccess = function() {
      if (!get_request.result) {
        return;
      };

      // 如果已經被刪除了就跳過
      add_notification(
        '新聞小幫手提醒您',
        '您於' + get_time_diff(get_request.result.last_seen_at) + ' 看的新聞「' + (get_request.result.title?get_request.result.title:report.news_title) + '」 被人回報有錯誤：' + report.report_title,
        report.report_link
      );
    };
  });
};

URLNormalizer.setCSVMapPath('libs/url-normalizer.js/map.csv');

var check_url = function(url, cb){
  var transaction = opened_db.transaction("report", 'readonly');
  var objectStore = transaction.objectStore("report");
  var index = objectStore.index('news_link');
  var get_request = index.get(url);
  get_request.onsuccess = function(){
    // 如果有找到結果，並且沒有被刪除
    if (get_request.result && !parseInt(get_request.result.deleted_at, 10)) {
      return cb(get_request.result);
    }
    cb(false);
  };
};

// check report by title & url
var check_report = function(title, url, cb){
  get_newshelper_db(function(opened_db){

    URLNormalizer.query(url, function(normalized_data) {
      if (normalized_data) {
        // 如果有 normalized_data, 就先檢查 normalized_id 是否有符合的，沒有再去找完整網址
        var transaction = opened_db.transaction("report", 'readonly');
        var objectStore = transaction.objectStore("report");
        var index = objectStore.index('news_link_unique');
        var get_request = index.get(normalized_data.normalized_id);
        get_request.onsuccess = function(){
          // 如果有找到結果，並且沒有被刪除
          if (get_request.result && !parseInt(get_request.result.deleted_at, 10)) {
            return cb(get_request.result);
          }
          check_url(url, cb);
        };
      }
      else {
        check_url(url, cb);
      }
    });
  });
};

// get time diff message
var get_time_diff = function(time){
  var delta = Math.floor((new Date()).getTime() / 1000) - time;
  if (delta < 60) {
    return delta + " 秒前";
  }
  else if (delta < 60 * 60) {
    return Math.floor(delta / 60) + " 分鐘前";
  }
  else if (delta < 60 * 60 * 24) {
    return Math.floor(delta / 60 / 60) + " 小時前";
  }
  else {
    return Math.floor(delta / 60 / 60 / 24) + " 天前";
  }
};

// show notification
var add_notification = function(title, body, link){
  var notification = new Notification('' + title, { icon: "newshelper48x48.png", body: '' + body });
  notification.onclick = function(){
    window.open(link);
  };
  notification.show();
}
