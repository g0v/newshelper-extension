var get_newshelper_db = function(cb){
  if (null !== opened_db) {
    cb(opened_db);
    return;
  }

  var request = indexedDB.open('newshelper', '6');
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
      event.currentTarget.result.deleteObjectStore('read_news');
    } catch (e) {}
    var objectStore = event.currentTarget.result.createObjectStore("read_news", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("title", "title", { unique: false });
    objectStore.createIndex("link", "link", { unique: true });
    objectStore.createIndex("last_seen_at", "last_seen_at", { unique: false });

    try {
      event.currentTarget.result.deleteObjectStore('report');
    } catch (e) {}
    var objectStore = event.currentTarget.result.createObjectStore("report", { keyPath: "id" });
    objectStore.createIndex("news_title", "news_title", { unique: false });
    objectStore.createIndex("news_link", "news_link", { unique: false });
    objectStore.createIndex("updated_at", "updated_at", { unique: false });
  };
};

var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
var opened_db = null;

var get_time_diff = function(time){
  var delta = Math.floor((new Date()).getTime() / 1000) - time;
  if (delta < 60) {
    return delta + " 秒前";
  } else if (delta < 60 * 60) {
    return Math.floor(delta / 60) + " 分鐘前";
  } else if (delta < 60 * 60 * 24) {
    return Math.floor(delta / 60 / 60) + " 小時前";
  } else {
    return Math.floor(delta / 60 / 60 / 24) + " 天前";
  }
};


var check_recent_seen = function(report){
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
      if (parseInt(get_request.result.deleted_at, 10)) {
        return;
      }
      chrome.extension.sendRequest({
        method: 'add_notification',
        title: '新聞小幫手提醒您',
        body: '您於' + get_time_diff(get_request.result.last_seen_at) + ' 看的新聞「' + get_request.result.title + '」 被人回報有錯誤：' + report.report_title,
        link: report.report_link
      }, function(response){});
    };
  });
};


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


// 跟遠端 API server 同步回報資料
var sync_report_data = function(){
  get_newshelper_db(function(opened_db){
    get_recent_report(function(report){
      $.get('http://newshelper.g0v.tw/index/data?time=' + (report ? parseInt(report.updated_at) : 0), function(ret){
        var transaction = opened_db.transaction("report", 'readwrite');
        var objectStore = transaction.objectStore("report");
        if (ret.data) {
          for (var i = 0; i < ret.data.length; i ++) {
            objectStore.put(ret.data[i]);

            // 檢查最近天看過的內容是否有被加進去的
            check_recent_seen(ret.data[i]);
          }
        }

        // 每 5 分鐘去檢查一次是否有更新
        setTimeout(sync_report_data, 300000);
      }, 'json');
    });
  });
};


var log_browsed_link = function(link, title) {
  if (!link) {
    return;
  }

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


// 從 db 中判斷 title, url 是否是錯誤新聞，是的話執行 cb 並傳入資訊
var check_report = function(title, url, cb){
  if (!url) {
    return;
  }
  get_newshelper_db(function(opened_db){
    var transaction = opened_db.transaction("report", 'readonly');
    var objectStore = transaction.objectStore("report");
    var index = objectStore.index('news_link');

    var get_request = index.get(url);
    get_request.onsuccess = function(){
      // 如果有找到結果，並且沒有被刪除
      if (get_request.result && !parseInt(get_request.result.deleted_at, 10)) {
        cb(get_request.result);
      }
    };
  });
};


var buildWarningMessage = function(options){
  return '<div class="newshelper-warning-facebook">' +
    '<div class="arrow-up"></div>' +
    '注意！您可能是<b>問題新聞</b>的受害者' +
    '<span class="newshelper-description">' +
    $('<span></span>').append($('<a></a>').attr({href: options.link, target: '_blank'}).text(options.title)).html() +
    '</span>' +
    '</div>';
};


var censorFacebook = function(baseNode) {
  if (window.location.host.indexOf("www.facebook.com") !== -1) {
    /* log browsing history into local database for further warning */
    /* add warning message to a Facebook post if necessary */
    var censorFacebookNode = function(containerNode, titleText, linkHref) {
      var matches = ('' + linkHref).match('^http://www\.facebook\.com/l\.php\\?u=([^&]*)');
      if (matches) {
        linkHref = decodeURIComponent(matches[1]);
      }
      var containerNode = $(containerNode);
      var className = "newshelper-checked";
      if (containerNode.hasClass(className)) {
        return;
      }
      else {
        containerNode.addClass(className);
      }

      /* log the link first */
      log_browsed_link(linkHref, titleText);

      check_report(titleText, linkHref, function(report){
        containerNode.addClass(className);
        containerNode.append(buildWarningMessage({
          title: report.report_title,
          link: report.report_link
        }));
      });
    };


    /* my timeline */
    $(baseNode).find(".uiStreamAttachments").each(function(idx, uiStreamAttachment) {
      var uiStreamAttachment = $(uiStreamAttachment)
      if (!uiStreamAttachment.hasClass("newshelper-checked")) {
        var titleText = uiStreamAttachment.find(".uiAttachmentTitle").text();
        var linkHref = uiStreamAttachment.find("a").attr("href");
        censorFacebookNode(uiStreamAttachment, titleText, linkHref);
      }
    });

    /* others' timeline, fan page */
    $(baseNode).find(".shareUnit").each(function(idx, shareUnit) {
      var shareUnit = $(shareUnit);
      if (!shareUnit.hasClass("newshelper-checked")) {
        var titleText = shareUnit.find(".fwb").text();
        var linkHref = shareUnit.find("a").attr("href");
        censorFacebookNode(shareUnit, titleText, linkHref)
      };
    });

    /* post page (single post) */
    $(baseNode).find("._6kv").each(function(idx, userContent) {
      var userContent = $(userContent);
      if (!userContent.hasClass("newshelper-checked")) {
        var titleText = userContent.find(".mbs").text();
        var linkHref = userContent.find("a").attr("href");
        censorFacebookNode(userContent, titleText, linkHref);
      };
    });
  }
};


var registerObserver = function() {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var mutationObserverConfig = {
    target: document.getElementsByTagName("body")[0],
    config: {
      attributes: true,
      childList: true,
      characterData: true
    }
  };
  var mutationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      censorFacebook(mutation.target);
    });
    hookActionBar();
  });
  mutationObserver.observe(mutationObserverConfig.target, mutationObserverConfig.config);
};

var buildActionBar = function(options) {
  return '<span class="newshelper-action">' +
         '<a href="http://newshelper.g0v.tw/">回報給新聞小幫手</a></span>';
};

var hookActionBar = function() {
  $(document).find("div[role=article][data-newshelper!='attached']")
             .each(function(idx, article) {
    $(article).find('.uiStreamSource').each(function(idx, uiStreamSource) {
      $(buildActionBar()).insertBefore(uiStreamSource);

      // should only have one uiStreamSource
      if (idx != 0) console.error(idx);
    });

    article.dataset.newshelper = 'attached';
  });
};

var main = function() {
  $(function(){
    /* fire up right after the page loaded*/
    censorFacebook(document.body);

    chrome.extension.sendRequest({method: 'page'}, function(response){});
    sync_report_data();

    /* deal with changed DOMs (i.e. AJAX-loaded content) */
    registerObserver();
  });
};
main();
