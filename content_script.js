var DEBUG_ = false;

// 叫 background 開始跟 api server 同步資料
var sync_report_data = function(){
  chrome.runtime.sendMessage({method: 'start_sync_db'})
    .then(function(response){});
};

// 從 db 中判斷 title, url 是否是錯誤新聞，是的話執行 cb 並傳入資訊
var check_report = function(title, url, cb){
  if (!url) {
    return;
  }

  function handleResponse(ret) {
    if (ret !== false && ret) {
      cb(ret);
    }
  }

  function handleError(error) {
    console.error(`Error: ${error}`);
  }

  chrome.runtime.sendMessage({
    method: 'check_report',
    title: title,
    url: url
  }).then(handleResponse, handleError);
}

var buildWarningMessage = function(options){
  return '<div class="newshelper-warning-facebook">' +
    '<div class="newshelper-arrow-up"></div>' +
    '注意！您可能是<b>問題新聞</b>的受害者' +
    '<span class="newshelper-description">' +
    $('<span></span>').append($('<a></a>').attr({href: options.link, target: '_blank'}).text(options.title)).html() +
    '</span>' +
  '</div>';
};

/*
See FB DOM Tree hierarchy
https://github.com/g0v/newshelper-extension/wiki/Facebook-DOM
*/
var censorFacebook = function(baseNode) {
  var t1_ = Date.now();
  if (window.location.host.indexOf("www.facebook.com") !== -1) {
    /* log browsing history into local database for further warning */
    /* add warning message to a Facebook post if necessary */
    var censorFacebookNode = function(containerNode, titleText, linkHref, rule) {
      if (DEBUG_) console.log('censorFacebookNode', containerNode[0], titleText);
      while (true) {
        var matches = ('' + linkHref).match('^https?://(l|www)\.facebook\.com/l\.php\\?u=([^&]*)');
        if (matches) {
          linkHref = decodeURIComponent(matches[2]);
          continue;
        }
        break;
      }
      // 處理 被加上 ?fb_action_ids=xxxxx 的情況
      matches = ('' + linkHref).match('(.*)[?&]fb_action_ids=.*');
      if (matches) {
        linkHref = matches[1];
      }

      var containerNode = $(containerNode);
      var className = "newshelper-checked";
      if (containerNode.hasClass(className)) {
        return;
      }
      else {
        containerNode.addClass(className);
      }

      // 先看看是不是 uiStreamActionFooter, 表示是同一個新聞有多人分享, 那只要最上面加上就好了
      var addedAction = false;
      containerNode.parents('div[role=article]').find('.uiStreamActionFooter').each(function(idx, uiStreamSource) {
        $(uiStreamSource).find('li:first').append(' · ' + buildActionBar({title: titleText, link: linkHref, rule: rule, action: 1}));
        addedAction = true;
      });

      // 再看看單一動態，要加在 .uiStreamSource
      if (!addedAction) {
        containerNode.parents('div[role=article]').find('.uiStreamSource').each(function(idx, uiStreamSource) {
          $($('<span></span>').html(buildActionBar({title: titleText, link: linkHref, rule: rule, action: 2}) + ' · ')).insertBefore(uiStreamSource);

          addedAction = true;
          // should only have one uiStreamSource
          if (idx != 0) console.error(idx + titleText);
        });
      }

      // 再來有可能是有人說某個連結讚
      if (!addedAction) {
        containerNode.parents('div.storyInnerContent').find('.uiStreamSource').each(function(idx, uiStreamSource){
          $($('<span></span>').html(buildActionBar({title: titleText, link: linkHref, rule: rule, action: 3}) + ' · ')).insertBefore(uiStreamSource);
          addedAction = true;
        });
      }

      // 再來是個人頁面
      if (!addedAction) {
        containerNode.parents('div[role="article"]').siblings('.uiCommentContainer').find('.UIActionLinks').each(function(idx, uiStreamSource){
          $(uiStreamSource).append(' · ').append(buildActionBar({title: titleText, link: linkHref, rule: rule, action: 4}));
          addedAction = true;
        });
      }

      // 新版Timeline
      if (!addedAction) {
        containerNode.parents('._4q_').find('._6p-').find('._5ciy').find('._6j_').each(function(idx, shareAction){
          $($('<a class="_5cix"></a>').html(buildActionBar({title: titleText, link: linkHref, rule: rule, action: 5}))).insertAfter(shareAction);
          addedAction = true;
        });
      }

      if (!addedAction) {
        containerNode.parents('.UFICommentContentBlock').find('.UFICommentActions').each(function(idx, foo){
          $(foo).append(' · ', buildActionBar({title: titleText, link: linkHref, rule: rule, action: 6}));
          addedAction = true;
        });
      }
      if (!addedAction) {
        // this check sould be after UFICommentContent
        containerNode.parents('._5pax').find('._5pcp').each(function(idx, foo){
          $(foo).append(' · ', buildActionBar({title: titleText, link: linkHref, rule: rule, action: 7}));
          addedAction = true;
        });
      }

      // 再來是single post
      if (!addedAction) {
        containerNode.parents('div[role="article"]').find('._5pcp._5lel').each(function(idx, uiStreamSource){
          $(uiStreamSource).append(' · ').append(buildActionBar({title: titleText, link: linkHref, rule: rule, action: 8}));
          addedAction = true;
        });
      }

      if (!addedAction) {
        containerNode.siblings().find('.uiCommentContainer').find('.UIActionLinks').each(function(idx, foo){
          $(foo).append(' · ', buildActionBar({title: titleText, link: linkHref, rule: rule, action: 9}));
          addedAction = true;
        });
      }

      if (!addedAction) {
        containerNode.parents('.userContentWrapper').find('._5vsi > div').each(function(idx, foo){
          $(foo).append(' · ', buildActionBar({title: titleText, link: linkHref, rule: rule, action: 10}));
          addedAction = true;
        });
      }

      if (DEBUG_ && !addedAction) console.log('fail to insert actionbar ' + rule);

      /* log the link first */
      chrome.runtime.sendMessage({
        method: 'log_browsed_link',
        title: titleText,
        link: linkHref
      }).then(function(response){});

      check_report(titleText, linkHref, function(report){
        containerNode.addClass(className);
        containerNode.append(buildWarningMessage({
          title: report.report_title,
          link: report.report_link
        }));
      });
    };


    /* my timeline */
    $(baseNode)
      .find(".uiStreamAttachments")
      .not(".newshelper-checked")
      .each(function(idx, uiStreamAttachment) {
        uiStreamAttachment = $(uiStreamAttachment);
        var titleText = uiStreamAttachment.find(".uiAttachmentTitle").text();
        var linkHref = uiStreamAttachment.find("a").attr("href");
        censorFacebookNode(uiStreamAttachment, titleText, linkHref, 'rule1');
      });

    $(baseNode)
      .find("._5rwo")
      .not(".newshelper-checked")
      .each(function(idx, userContent) {
        userContent = $(userContent);
        var titleText = userContent.find(".fwb").text();
        var linkHref = userContent.find("a").attr("href");
        censorFacebookNode(userContent, titleText, linkHref, 'rule2');
      });

    /* 這個規則會讓按讚也被誤判是連結
    $(baseNode)
    .find("._42ef")
    .not(".newshelper-checked")
    .each(function(idx, userContent) {
    userContent = $(userContent);
    var titleText = userContent.find(".fwb").text();
    var linkHref = userContent.find("a").attr("href");
    censorFacebookNode(userContent, titleText, linkHref, 'rule3');
    });*/

    /* others' timeline, fan page */
    $(baseNode)
      .find(".shareUnit")
      .not(".newshelper-checked")
      .each(function(idx, shareUnit) {
        shareUnit = $(shareUnit);
        var titleText = shareUnit.find(".fwb").text();
        var linkHref = shareUnit.find("a").attr("href");
        censorFacebookNode(shareUnit, titleText, linkHref, 'rule4');
      });

    $(baseNode)
      .find("._5rny")
      .not(".newshelper-checked")
      .each(function(idx, userContent) {
        userContent = $(userContent);
        var titleText = userContent.find(".fwb").text();
        var linkHref = userContent.find("a").attr("href");
        censorFacebookNode(userContent, titleText, linkHref, 'rule5');
      });

    /* post page (single post) */
    $(baseNode)
      .find("._6kv")
      .not(".newshelper-checked")
      .each(function(idx, userContent) {
        userContent = $(userContent);
        var titleText = userContent.find(".mbs").text();
        var linkHref = userContent.find("a").attr("href");
        censorFacebookNode(userContent, titleText, linkHref, 'rule6');
      });

    /* post page (single post) */
    $(baseNode)
      .find("._6m3")
      .not(".newshelper-checked")
      .each(function(idx, userContent) {
        userContent = $(userContent);
        var titleText = userContent.find("a").text();
        var linkHref = userContent.find("a").attr("href");
        censorFacebookNode(userContent.parents('._2r3x').find('._6m3').parents('._6m2').parent(), titleText, linkHref, 'rule7');
      });
  }

  if (DEBUG_) console.log('censorFacebook time', Date.now() - t1_);
};

/* deal with changed DOMs (i.e. AJAX-loaded content) */
var registerObserver = function() {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  var throttle = (function() {
    var timer_
    return function(fn, wait) {
      if (timer_) {
        clearTimeout(timer_);
      }
      timer_ = setTimeout(fn, wait);
    };
  })();

  // 直接 censor 整個 document
  // 這樣才能偵測到滑鼠點選換頁的事件
  var target = document;
  var config = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
  };

  var mutationObserver = new MutationObserver(function(mutations) {
    chrome.runtime.sendMessage({method: 'page'})
    .then(function(response){});

    var hasNewNode = false;
    mutations.forEach(function(mutation, idx) {
      if(mutation.type == 'childList' && mutation.addedNodes.length > 0)
      hasNewNode = true;
    });
    if (hasNewNode) {
      throttle(function() {
        censorFacebook(target);
      }, 1000);
    }
  });

  mutationObserver.observe(target, config);
};

var buildActionBar = function(options) {
  var url = 'http://newshelper.g0v.tw';
  if ('undefined' !== typeof(options.title) && 'undefined' !== typeof(options.link)) {
    url += '?news_link=' + encodeURIComponent(options.link) + '&news_title= ' + encodeURIComponent(options.title);
  }
  if (DEBUG_) {
    if ('undefined' !== typeof(options.rule)) {
      url += '&rule=' + encodeURIComponent(options.rule);
    }
    if ('undefined' !== typeof(options.action)) {
      url += '&action=' + encodeURIComponent(options.action);
    }
  }
  return '<a href="' + url + '" target="_blank">回報給新聞小幫手</a>';
};

var main = function() {
  if (document.location.hostname == 'www.facebook.com') {
    var target = document.getElementById("contentArea") || document.getElementById("content");
    if (target) {
      censorFacebook(target);
      registerObserver();
    }
    else {
      console.error('#contentArea or #content is not ready');
    }
  }
  else {
    check_report('', document.location.href, function(report){
      chrome.runtime.sendMessage({method: 'page'})
      .then(function(response){});
      document.body.style.border = "5px solid red";
      chrome.runtime.sendMessage({
        method: 'add_notification',
        title: '注意，您可能是問題新聞的受害者',
        body: report.report_title,
        link: report.report_link
      }).then(function(response){});
    });
  }

  sync_report_data();
};
main();
