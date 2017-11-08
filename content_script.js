/* eslint-disable no-console */

var DEBUG_ = false;

var newshelper_cs = {

  registerObserver: () => {
    /* deal with changed DOMs (i.e. AJAX-loaded content) */
    var me = newshelper_cs;
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    var throttle = ( () => {
      var timer_;
      return (fn, wait) => {
        if (timer_) clearTimeout(timer_);
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

    var mutationObserver = new MutationObserver( mutations => {
      chrome.runtime.sendMessage({method: 'page'});

      var hasNewNode = false;
      mutations.forEach( mutation => {
        if (mutation.type == 'childList' && mutation.addedNodes.length > 0) hasNewNode = true;
      });
      if (hasNewNode) {
        throttle( () => {
          me.censorFacebook(target);
        }, 1000);
      }
    });

    mutationObserver.observe(target, config);
  },

  buildWarningMessage: options => `<div class="newshelper-warning-facebook">
    <div class="newshelper-arrow-up"></div>
    ${chrome.i18n.getMessage('warning')}
    <span class="newshelper-description"><span>
      <a href="${options.link}" target="_blank">${options.title}</a>
    </span></span>
  </div>`,

  buildActionBar: options => {
    var url = 'http://newshelper.g0v.tw';

    if ('undefined' !== typeof(options.title) && 'undefined' !== typeof(options.link)) {
      url += '?news_link=' + encodeURIComponent(options.link) + '&news_title= ' + encodeURIComponent(options.title);
    }
    if (DEBUG_) {
      if ('undefined' !== typeof(options.rule))   url += '&rule=' + encodeURIComponent(options.rule);
      if ('undefined' !== typeof(options.action)) url += '&action=' + encodeURIComponent(options.action);
    }
    return `<a href="${url}" target="_blank">${chrome.i18n.getMessage('reportCTA')}</a>`;
  },

  censorFacebook: baseNode => {
    var me = newshelper_cs;
    /*
      See FB DOM Tree hierarchy
      https://github.com/g0v/newshelper-extension/wiki/Facebook-DOM
    */

    var t1_ = Date.now();
    if (window.location.host.indexOf("www.facebook.com") !== -1) {
      /* log browsing history into local database for further warning */
      /* add warning message to a Facebook post if necessary */
      var censorFacebookNode = (containerNode, titleText, linkHref, rule) => {
        if (DEBUG_) console.log('censorFacebookNode', containerNode[0], titleText);
        while (true) {
          var matches = ('' + linkHref).match('^https?://(l|www).facebook.com/l.php\\?u=([^&]*)');
          if (matches) {
            linkHref = decodeURIComponent(matches[2]);
            continue;
          }
          break;
        }
        // 處理被加上 ?fb_action_ids=xxxxx 的情況
        matches = ('' + linkHref).match('(.*)[?&]fb_action_ids=.*');
        if (matches) linkHref = matches[1];

        containerNode = $(containerNode);
        var className = "newshelper-checked";
        if (containerNode.hasClass(className)) return;
        else containerNode.addClass(className);

        // 先看看是不是 uiStreamActionFooter, 表示是同一個新聞有多人分享, 那只要最上面加上就好了
        var addedAction = false;
        containerNode.parents('div[role=article]').find('.uiStreamActionFooter').each( (idx, uiStreamSource) => {
          $(uiStreamSource).find('li:first').append(' · ' + me.buildActionBar({
            title: titleText,
            link: linkHref,
            rule: rule,
            action: 1
          }));
          addedAction = true;
        });

        // 再看看單一動態，要加在 .uiStreamSource
        if (!addedAction) {
          containerNode.parents('div[role=article]').find('.uiStreamSource').each( (idx, uiStreamSource) => {
            $($('<span></span>').html(me.buildActionBar({
              title: titleText,
              link: linkHref,
              rule: rule,
              action: 2
            }) + ' · ')).insertBefore(uiStreamSource);

            addedAction = true;
            // should only have one uiStreamSource
            if (idx != 0) console.error(idx + titleText);
          });
        }

        // 再來有可能是有人說某個連結讚
        if (!addedAction) {
          containerNode.parents('div.storyInnerContent').find('.uiStreamSource').each( (idx, uiStreamSource) => {
            $(
              $('<span></span>').html(me.buildActionBar({
                title: titleText,
                link: linkHref,
                rule: rule,
                action: 3
              }) + ' · ')
            ).insertBefore(uiStreamSource);
            addedAction = true;
          });
        }

        // 再來是個人頁面
        if (!addedAction) {
          containerNode.parents('div[role="article"]').siblings('.uiCommentContainer').find('.UIActionLinks').each( (idx, uiStreamSource) => {
            $(uiStreamSource).append(' · ').append(me.buildActionBar({
              title: titleText,
              link: linkHref,
              rule: rule,
              action: 4
            }));
            addedAction = true;
          });
        }

        // 新版Timeline
        if (!addedAction) {
          containerNode.parents('._4q_').find('._6p-').find('._5ciy').find('._6j_').each( (idx, shareAction) => {
            $(
              $('<a class="_5cix"></a>').html(me.buildActionBar({
                title: titleText,
                link: linkHref,
                rule: rule,
                action: 5
              }))
            ).insertAfter(shareAction);
            addedAction = true;
          });
        }

        if (!addedAction) {
          containerNode.parents('.UFICommentContentBlock').find('.UFICommentActions').each( (idx, foo) => {
            $(foo).append(' · ', me.buildActionBar({
              title: titleText,
              link: linkHref,
              rule: rule,
              action: 6
            }));
            addedAction = true;
          });
        }
        if (!addedAction) {
          // this check should be after UFICommentContent
          containerNode.parents('._5pax').find('._5pcp').each( (idx, foo) => {
            $(foo).append(' · ', me.buildActionBar({
              title: titleText,
              link: linkHref,
              rule: rule,
              action: 7
            }));
            addedAction = true;
          });
        }

        // 再來是single post
        if (!addedAction) {
          containerNode.parents('div[role="article"]').find('._5pcp._5lel').each( (idx, uiStreamSource) => {
            $(uiStreamSource).append(' · ').append(me.buildActionBar({
              title: titleText,
              link: linkHref,
              rule: rule,
              action: 8
            }));
            addedAction = true;
          });
        }

        if (!addedAction) {
          containerNode.siblings().find('.uiCommentContainer').find('.UIActionLinks').each( (idx, foo) => {
            $(foo).append(' · ', me.buildActionBar({
              title: titleText,
              link: linkHref,
              rule: rule,
              action: 9
            }));
            addedAction = true;
          });
        }

        if (!addedAction) {
          containerNode.parents('.userContentWrapper').find('._5vsi > div').each( (idx, foo) => {
            $(foo).append(' · ', me.buildActionBar({
              title: titleText,
              link: linkHref,
              rule: rule,
              action: 10
            }));
            addedAction = true;
          });
        }

        if (DEBUG_ && !addedAction) console.error('fail to insert actionbar ' + rule);

        /* log the link first */
        chrome.runtime.sendMessage({
          method: 'log_browsed_link',
          title: titleText,
          link: linkHref
        });

        me.check_report(titleText, linkHref, report => {
          containerNode.addClass(className);
          containerNode.append(me.buildWarningMessage({
            title: report.report_title,
            link: report.report_link
          }));
        });
      };


      /* my timeline */
      $(baseNode)
        .find(".uiStreamAttachments")
        .not(".newshelper-checked")
        .each( (idx, uiStreamAttachment) => {
          uiStreamAttachment = $(uiStreamAttachment);
          var titleText = uiStreamAttachment.find(".uiAttachmentTitle").text();
          var linkHref = uiStreamAttachment.find("a").attr("href");
          censorFacebookNode(uiStreamAttachment, titleText, linkHref, 'rule1');
        });

      $(baseNode)
        .find("._5rwo")
        .not(".newshelper-checked")
        .each( (idx, userContent) => {
          userContent = $(userContent);
          var titleText = userContent.find(".fwb").text();
          var linkHref = userContent.find("a").attr("href");
          censorFacebookNode(userContent, titleText, linkHref, 'rule2');
        });

      /* 這個規則會讓按讚也被誤判是連結
      $(baseNode)
      .find("._42ef")
      .not(".newshelper-checked")
      .each( (idx, userContent) => {
        userContent = $(userContent);
        var titleText = userContent.find(".fwb").text();
        var linkHref = userContent.find("a").attr("href");
        censorFacebookNode(userContent, titleText, linkHref, 'rule3');
      });*/

      /* others' timeline, fan page */
      $(baseNode)
        .find(".shareUnit")
        .not(".newshelper-checked")
        .each( (idx, shareUnit) => {
          shareUnit = $(shareUnit);
          var titleText = shareUnit.find(".fwb").text();
          var linkHref = shareUnit.find("a").attr("href");
          censorFacebookNode(shareUnit, titleText, linkHref, 'rule4');
        });

      $(baseNode)
        .find("._5rny")
        .not(".newshelper-checked")
        .each( (idx, userContent) => {
          userContent = $(userContent);
          var titleText = userContent.find(".fwb").text();
          var linkHref = userContent.find("a").attr("href");
          censorFacebookNode(userContent, titleText, linkHref, 'rule5');
        });

      /* post page (single post) */
      $(baseNode)
        .find("._6kv")
        .not(".newshelper-checked")
        .each( (idx, userContent) => {
          userContent = $(userContent);
          var titleText = userContent.find(".mbs").text();
          var linkHref = userContent.find("a").attr("href");
          censorFacebookNode(userContent, titleText, linkHref, 'rule6');
        });

      /* post page (single post) */
      $(baseNode)
        .find("._6m3")
        .not(".newshelper-checked")
        .each( (idx, userContent) => {
          userContent = $(userContent);
          var titleText = userContent.find("a").text();
          var linkHref = userContent.find("a").attr("href");
          censorFacebookNode(userContent.parents('._2r3x').find('._6m3').parents('._6m2').parent(), titleText, linkHref, 'rule7');
        });
    }

    if (DEBUG_) console.log('censorFacebook time', Date.now() - t1_);
  },

  check_report: (title, url, cb) => {
    // 從 db 中判斷 title, url 是否是錯誤新聞，是的話執行 cb 並傳入資訊
    if (!url) return;

    chrome.runtime.sendMessage({
      method: 'check_report',
      title: title,
      url: url
    }).then( ret => {
      if (ret !== false && ret)
        cb(ret);
    }, error => {
      console.error(`Error: ${error}`);
    });
  },

  sync_report_data: () => {
    // 叫 background 開始跟 api server 同步資料
    chrome.runtime.sendMessage({method: 'start_sync_db'});
  },

  init: () => {
    var me = newshelper_cs;

    if (document.location.hostname == 'www.facebook.com') {
      var target = document.getElementById("contentArea") || document.getElementById("content");
      if (target) {
        me.censorFacebook(target);
        me.registerObserver();
      }
      else {
        console.error('#contentArea or #content is not ready');
      }
    }
    else {
      me.check_report('', document.location.href, report => {
        chrome.runtime.sendMessage({ method: 'page' });
        document.body.style.border = "5px solid red";
        chrome.runtime.sendMessage({
          method: 'add_notification',
          title: chrome.i18n.getMessage("warning").replace(/<\/?b>/g, ''),
          body: report.report_title,
          link: report.report_link
        });
      });
    }

    me.sync_report_data();
  }
};
newshelper_cs.init();

