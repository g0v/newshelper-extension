/* global add_notification */

var newshelper_bg = {
  opened_db: null,
  last_sync_at: -1,
  next_fetch_at: 0,

  check_recent_seen: report => {
    // check recent seen news with report
    if (parseInt(report.deleted_at, 10)) return;
    var me = newshelper_bg;

    me.get_newshelper_db( opened_db => {
      var transaction = opened_db.transaction("read_news", 'readonly');
      var objectStore = transaction.objectStore("read_news");
      var index = objectStore.index('link');
      var get_request = index.get(report.news_link);
      get_request.onsuccess = () => {
        if (!get_request.result) return;

        // skip if deleted
        add_notification(
          '新聞小幫手提醒您',
          '您於' + me.get_time_diff(get_request.result.last_seen_at) + ' 看的新聞「' + (get_request.result.title?get_request.result.title:report.news_title) + '」 被人回報有錯誤：' + report.report_title,
          report.report_link
        );
      };
    });
  },

  get_time_diff: time => {
    // get time diff message
    var delta = Math.floor((new Date()).getTime() / 1000) - time;
    if (delta < 60) {
      return delta + chrome.i18n.getMessage("secondAgo");
    }
    else if (delta < 60 * 60) {
      return Math.floor(delta / 60) + chrome.i18n.getMessage("minuteAgo");
    }
    else if (delta < 60 * 60 * 24) {
      return Math.floor(delta / 60 / 60) + chrome.i18n.getMessage("hourAgo");
    }
    else {
      return Math.floor(delta / 60 / 60 / 24) + chrome.i18n.getMessage("dayAgo");
    }
  },

  get_newshelper_db: cb => {
    // open db
    var me = newshelper_bg;
    if (null !== me.opened_db) {
      cb(me.opened_db);
      return;
    }

    var request = indexedDB.open('newshelper', '8');
    request.onsuccess = () => {
      me.opened_db = request.result;
      cb(me.opened_db);
      return;
    };

    request.onerror = event => {
      console.error("IndexedDB error: " + event.target.errorCode);
    };

    request.onupgradeneeded = event => {
      try {
        event.currentTarget.result.deleteObjectStore('report');
      }
      catch (e) {
        console.error(e);
      }

      var objectStore = event.currentTarget.result.createObjectStore("report", { keyPath: "id" });
      objectStore.createIndex("news_title", "news_title", { unique: false });
      objectStore.createIndex("news_link", "news_link", { unique: false });
      objectStore.createIndex("news_link_unique", "news_link_unique", { unique: false });
      objectStore.createIndex("updated_at", "updated_at", { unique: false });

      try {
        objectStore = event.currentTarget.result.createObjectStore("read_news", { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("title", "title", { unique: false });
        objectStore.createIndex("link", "link", { unique: true });
        objectStore.createIndex("last_seen_at", "last_seen_at", { unique: false });
      }
      catch (e) {
        console.error(e);
      }
    };
  },

  sync_db: force_notification => {
    // sync db from api server
    var me = newshelper_bg;

    me.get_newshelper_db( opened_db => {
      me.get_recent_report( latest_report => {
        var version_time = Math.max(me.next_fetch_at, (latest_report ? parseInt(latest_report.updated_at) : 0));
        $.get('http://d3n4xylkjv5pnb.cloudfront.net/index/data?time=' + version_time, ret => {
          var transaction = opened_db.transaction("report", 'readwrite');
          var objectStore = transaction.objectStore("report");
          me.next_fetch_at = ret.time;
          if (ret.data) {
            for (var i = 0; i < ret.data.length; i ++) {
              objectStore.put(ret.data[i]);

              // 檢查最近幾天看過的內容是否有被加進去的
              // (有 latest_report 才檢查，避免 indexeddb 清空後會被洗板, 如果 force_notification 為 true 就不檢查)
              if (force_notification || latest_report) {
                // 只讓 notification 通知一次，如果之後再更新就不通知了
                if (parseInt(ret.data[i].created_at, 10) > parseInt(latest_report.updated_at, 10)) {
                  me.check_recent_seen(ret.data[i]);
                }
              }
            }
          }
        }, 'json');
      });
    });
  },

  add_notification: (title, body, link) => {
    // show notification

    if(!window.Notification) return;

    var notification = new Notification('' + title, { icon: "newshelper48x48.png", body: '' + body });
    notification.onclick = () => {
      window.open(link);
    };

    setTimeout(() => {
      notification.close();
    }, 5000);

  },

  check_url: (url, cb) => {
    var me = newshelper_bg;
    var transaction = me.opened_db.transaction("report", 'readonly');
    var objectStore = transaction.objectStore("report");
    var index = objectStore.index('news_link');
    var get_request = index.get(url);
    get_request.onsuccess = () => {
      // find result && not deleted
      if (get_request.result && !parseInt(get_request.result.deleted_at, 10)) {
        return cb(get_request.result);
      }
      cb(false);
    };
  },

  check_report: (title, url, cb) => {
    // check report by title & url
    var me = newshelper_bg;
    me.get_newshelper_db( opened_db => {

      URLNormalizer.setCSVMapPath(chrome.extension.getURL('libs/url-normalizer.js/map.csv'));
      URLNormalizer.query(url, normalized_data => {
        if (normalized_data) {
          // 如果有 normalized_data, 就先檢查 normalized_id 是否有符合的，沒有再去找完整網址
          var transaction = opened_db.transaction("report", 'readonly');
          var objectStore = transaction.objectStore("report");
          var index = objectStore.index('news_link_unique');
          var get_request = index.get(normalized_data.normalized_id);
          get_request.onsuccess = () => {
            // find result && not deleted
            if (get_request.result && !parseInt(get_request.result.deleted_at, 10)) {
              return cb(get_request.result);
            }
            me.check_url(url, cb);
          };
        }
        else {
          me.check_url(url, cb);
        }
      });
    });
  },

  get_recent_report: cb => {
    // get newest report in db
    var me = newshelper_bg;
    me.get_newshelper_db( opened_db => {
      var transaction = opened_db.transaction('report', 'readonly');
      var objectStore = transaction.objectStore('report');
      var index = objectStore.index("updated_at");
      var request = index.openCursor(null, 'prev');
      request.onsuccess = () => {
        if (request.result) {
          cb(request.result.value);
          return;
        }
        cb(null);
      };
    });
  },

  log_browsed_link: (link, title) => {
    // log link in read_news table
    var me = newshelper_bg;
    var seen_link = {};
    if (!link || seen_link[link]) return;

    seen_link[link] = true;

    me.get_newshelper_db( opened_db => {
      var transaction = opened_db.transaction("read_news", 'readwrite');
      var objectStore = transaction.objectStore("read_news");
      var request = objectStore.put({
        title: title,
        link: link,
        last_seen_at: Math.floor((new Date()).getTime() /1000)
      });

      // link 重覆
      request.onerror = () => {
        var transaction = opened_db.transaction("read_news", 'readwrite');
        var objectStore = transaction.objectStore("read_news");
        var index = objectStore.index('link');
        var get_request = index.get(link);
        get_request.onsuccess = () => {
          if (!get_request.result) {
            console.error('link=' + link + ' is not found in IndexedDB');
            return;
          }
          // update last_seen_at
          // var put_request = objectStore.put({
          //   id: get_request.result.id,
          //   title: title,
          //   last_seen_at: Math.floor((new Date()).getTime() /1000)
          // });
        };
      };
    });
  },

  onRequest: (request, sender, sendResponse) => {
    var me = newshelper_bg;

    switch (request.method) {
    case 'page':
      // show newshelper page action
      chrome.pageAction.show(sender.tab.id);
      break;
    case 'add_notification':
      me.add_notification(request.title, request.body, request.link);
      break;
    case 'start_sync_db':
      if (me.last_sync_at < 0) {
        me.last_sync_at = 0;
        setInterval(() => {
          if ((new Date()).getTime() - me.last_sync_at < 300 * 1000) return;

          me.last_sync_at = (new Date()).getTime();
          me.sync_db(false);
        }, 10000);
      }
      break;
    case 'log_browsed_link':
      me.log_browsed_link(request.link, request.title);
      break;
    case 'check_report':
      me.check_report(request.title, request.url, sendResponse);
      return true;
    }

    // Return nothing to let the connection be cleaned up.
    sendResponse({});
    return true;
  },

  init: () => {
    var me = newshelper_bg;
    // Listen for the content script to send a message to the background page.
    chrome.runtime.onMessage.addListener(me.onRequest);
  }
};

newshelper_bg.init();
