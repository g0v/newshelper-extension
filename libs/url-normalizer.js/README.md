url-normalizer.js
=================

現在許多網站為了 SEO ，會將日期、標題等資訊放入網址中，或是為了追蹤收視來源，在網址上加上了來自臉書或是 App 等資訊，造成會有一個網頁同時很多網址的問題，有些服務就會造成同一網址可能被重覆記錄在資料庫中好幾次。url-normalizer.js 的目標是整理出常用的服務，並將網址轉換成唯一的網址，這樣可以避免服務中重覆記錄網址。

函式
====

```js
    URLNormalizer.query(url); // return ResultObject or null
    ResultObject: {
      query_url: '查詢的網址',
      normalized_url: '可以連的唯一的網址(不一定會有..)',
      normalized_id: '唯一的 ID',
    }
```

用法
====
1. 網頁上 http://g0v.github.io/url-normalizer.js/web-test.html

```html
    <script src="url-normalizer.js"></script>
    <script>console.log(URLNormalizer.query(url)); </script>
```

2. NodeJS

```js
    var URLNormalizer = require('./url-normalizer.js');
    console.log(URLNormalizer.query(url));
```

如果沒有我要的網址怎麼辦
========================
1. 先到 issues 看看有沒有回報，如果沒有的話就 New Issue 吧
2. 如果還沒有實作的話，就 fork 出來自己加上程式吧

支援網址
========
* www.appledaily.com.tw
* www.chinatimes.com
* www.cna.com.tw
* www.nownews.com
* newtalk.tw
* libertytimes.com.tw
* www.ettoday.net
* tw.news.yahoo.com
* www.facebook.com
* udn.com

LICENSE
=======
MIT http://g0v.mit-license.org/
