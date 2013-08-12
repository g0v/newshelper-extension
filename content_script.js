var censorNewsSite = function(baseNode) {
  if (window.location.href.toLowerCase().indexOf("news") !== -1) {
    console.log("censorPage()");
    var censorPage = function() {
      if ($(".newshelper-warning").length >= 1) {
        return;
      }

      var buildWarningMessage = function(description, tags) {
        return '<p class="newshelper-warning" style="background: hsl(0, 50%, 50%); color: white; font-size: large; text-align: center; width: 100%; padding: 5px 0;">' + 
          '[警告] 您可能是問題新聞的受害者！' + 
            '<span class="newshelper-description" style="font-size: small; display: block;">' +
              description +
            '</span>' +
            '<span class="newshelper-tags" style="font-size: small; display: block;>{' + 
              tags + 
            '</span>}' + 
          '</p>';
      };
    
      var titleText = $("title").text(),
          linkHref = window.location.href;

      /* validate the page title and link */
      var API_BASE = "http://taichung-chang-946908.middle2.me",
          API_ENDPOINT = "/api/check_news"
      var queryParams = {
        title: titleText,
        url: linkHref
      };
      $.getJSON(API_BASE + API_ENDPOINT, queryParams)
        .done(function(result) {
          if ($(".newshelper-warning").length < 1) {
            console.log("titleText: " + titleText + ", linkHref: " + linkHref);
            $("body").prepend(buildWarningMessage(result.description, result.tags));
          }
        });
    };
    censorPage();
  }
};

var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
var opened_db = null;

var log_browsed_link = function(link, title) {
    if (!link) {
	return;
    }

    if (null === opened_db) {
	var request = indexedDB.open('newshelper', '4');
	request.onsuccess = function(event){
	    opened_db = request.result;
	    log_browsed_link(link, title);
	};

	request.onerror = function (event) {
	    console.log("IndexedDB error: " + event.target.errorCode);
	};

	request.onupgradeneeded = function (event) {
	    event.currentTarget.result.deleteObjectStore('read_news');
	    var objectStore = event.currentTarget.result.createObjectStore("read_news", { keyPath: "id", autoIncrement: true });
	    objectStore.createIndex("title", "title", { unique: false });
	    objectStore.createIndex("link", "link", { unique: true });
	    objectStore.createIndex("last_seen_at", "last_seen_at", { unique: false });
	};
	return;
    }

    var transaction = opened_db.transaction("read_news", 'readwrite');
    var objectStore = transaction.objectStore("read_news");
    var request = objectStore.add({
	title: title,
	link: link,
	last_seen_at: Math.floor((new Date()).getTime() /1000)
    });
};

var censorFacebook = function(baseNode) {
  if (window.location.host.indexOf("www.facebook.com") !== -1) {
    /* log browsing history into local database for further warning */
    var logBrowsedLink = function(linkHref) {
      list = localStorage['links'] ? JSON.parse(localStorage['links']) : [];
      list.push({
        time: (new Date()).getTime(),
        link: linkHref
      });
      localStorage['links'] = JSON.stringify(list);
    };

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
      logBrowsedLink(linkHref);

      var buildWarningMessage = function(description, tags) {
        return '<p class="newshelper-warning" style="background: hsl(0, 50%, 50%); color: white; font-size: large; text-align: center">' + 
          '[警告] 您可能是問題新聞的受害者！' + 
            '<span class="newshelper-description" style="font-size: small; display: block;">' +
              description +
            '</span>' +
            '<span class="newshelper-tags" style="font-size: small; display: block;>{' + 
              tags + 
            '</span>}' + 
          '</p>';
      };

      /* validate with backend APIs */
      var API_BASE = "http://taichung-chang-946908.middle2.me",
          API_ENDPOINT = "/api/check_news"
      var queryParams = {
        title: titleText,
        url: linkHref
      };
      $.getJSON(API_BASE + API_ENDPOINT, queryParams)
        .done(function(result) {
          console.log("titleText: " + titleText + ", linkHref: " + linkHref);
          containerNode.addClass(className);
          containerNode.append(buildWarningMessage(result.description, result.tags))
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
      censorNewsSite(mutation.target);
    });
  });
  mutationObserver.observe(mutationObserverConfig.target, mutationObserverConfig.config);
}

var main = function() {
  $(function(){
    /* fire up right after the page loaded*/
    censorFacebook(document.body);
    censorNewsSite(document.body);
  
    /* deal with changed DOMs (i.e. AJAX-loaded content) */
    registerObserver();
  });
};

main();
