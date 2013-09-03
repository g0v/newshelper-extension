function onRequest(request, sender, sendResponse) {
    if (request.method == 'page') {
        // 顯示設定新聞小幫手的 page action
        chrome.pageAction.show(sender.tab.id);
    }

    if (request.method == 'add_notification') {
	add_notification(request.title, request.body, request.link);
    }

    // Return nothing to let the connection be cleaned up.
    sendResponse({});
};

// Listen for the content script to send a message to the background page.
chrome.extension.onRequest.addListener(onRequest);


// show notification
var add_notification = function(title, body, link){
  var notification = window.webkitNotifications.createNotification(
    'newshelper48x48.png',
    '' + title,
    '' + body
  );
  notification.onclick = function(){
    window.open(link);
  };
  notification.show();
}
