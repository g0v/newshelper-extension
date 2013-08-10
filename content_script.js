var censorDOM = function(baseNode) {
  /* censor the text included in the DOM node */
  var censorNode = function(node) {
    var node = $(node);
    var keywords = ["馬英九", "蔡英文"];
    keywords.forEach(function(keyword) {
      if (node.text().indexOf(keyword) != -1) {
        node.html(node.text().replace(keyword, '<span style="background: hsl(0, 50%, 70%)">' + keyword + '</span>'));
      }
    });
  };

  /* DOM traversal by DFS*/
  var traverseDOM = function(parentNode) {
    $(parentNode).children().each(function(idx, node) {
      if ($(node).children().length < 1) {
        censorNode(node);
      }
      else {
        traverseDOM(node);
      }
    });
  };

  traverseDOM(baseNode);
};

var censorFacebook = function(baseNode) {
  if (window.location.host.indexOf("www.facebook.com") !== -1) {
    /* add warning message to a Facebook post if necessary */
    var censorFacebookNode = function(containerNode, titleText, linkHref) {
      var containerNode = $(containerNode);
      var className = "newshelper-checked";
      if (containerNode.hasClass(className)) {
        return;
      }
      containerNode.addClass(className);

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
        link: linkHref
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
      // censorDOM(mutation.target);
      censorFacebook(mutation.target);
    });
  });
  mutationObserver.observe(mutationObserverConfig.target, mutationObserverConfig.config);
}

var main = function() {
  $(function(){
    /* fire up right after the page loaded*/
    // censorDOM(document.body);
    censorFacebook(document.body);
  
    /* deal with changed DOMs (i.e. AJAX-loaded content) */
    registerObserver();
  });
};

main();
