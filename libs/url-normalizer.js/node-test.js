var URLNormalizer = require('./url-normalizer.js');

var url = 'http://www.appledaily.com.tw/realtimenews/article/finance/20131225/314703/【台股開盤】開高上漲11點';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://www.appledaily.com.tw/realtimenews/article/finance/20131225/314703/【台股開盤】 開高上漲11點',
  normalized_url: 'http://www.appledaily.com.tw/realtimenews/article/local/20131225/314703',
  normalized_id: 'www.appledaily.com.tw/realtimenews/20131225/314703' }
*/

url = 'http://www.chinatimes.com/newspapers/蠻牛再起-3登年終球王-20131108000743-260111?from=fb';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://www.chinatimes.com/newspapers/蠻牛再起-3登年終球王-20131108000743-260111?from=fb',
  normalized_url: 'http://www.chinatimes.com/newspapers/20131108000743-260111',
  normalized_id: 'www.chinatimes.com/newspapers/20131108000743/260111' }
*/

url = 'http://www.cna.com.tw/News/aFE/201309070021-1.aspx';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://www.cna.com.tw/News/aFE/201309070021-1.aspx',
  normalized_url: 'http://www.cna.com.tw/News/aAll/201309070021-1.aspx',
  normalized_id: 'www.cna.com.tw/aAll/201309070021-1.aspx' }
*/
url = 'http://www.cna.com.tw/News/firstnews/201309070021-1.aspx';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://www.cna.com.tw/News/firstnews/201309070021-1.aspx',
  normalized_url: 'http://www.cna.com.tw/News/firstnews/201309070021-1.aspx',
  normalized_id: 'www.cna.com.tw/firstnews/201309070021-1.aspx' }
*/
url = 'http://www.cna.com.tw/Topic/Popular/3959-1/201309070021-1.aspx';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://www.cna.com.tw/Topic/Popular/3959-1/201309070021-1.aspx',
  normalized_url: 'http://www.cna.com.tw/News/firstnews/201309070021-1.aspx',
  normalized_id: 'www.cna.com.tw/firstnews/201309070021-1.aspx' }
*/

url = 'http://www.nownews.com/n/2013/10/28/1003767';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://www.nownews.com/n/2013/10/28/1003767',
  normalized_url: 'http://www.nownews.com/n/2013/10/28/1003767',
  normalized_id: 'www.noewnews.com/1003767' }
*/

url = 'http://newtalk.tw/news/2013/12/30/43243.html';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://newtalk.tw/news/2013/12/30/43243.html',
  normalized_url: 'http://newtalk.tw/news/2013/12/30/43243.html',
  normalized_id: 'newtalk.tw/43243' }
*/

url = 'http://iservice.libertytimes.com.tw/liveNews/news.php?no=927070&type=%E5%9C%8B%E9%9A%9B';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://iservice.libertytimes.com.tw/liveNews/news.php?no=927070&type=%E5%9C%8B%E9%9A%9B',
  normalized_url: 'http://iservice.libertytimes.com.tw/liveNews/news.php?no=927070',
  normalized_id: 'iservice.libertytimes.com.tw/liveNews/927070' }
*/
url = 'http://www.libertytimes.com.tw/2013/new/dec/30/today-taipei1.htm';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://www.libertytimes.com.tw/2013/new/dec/30/today-taipei1.htm',
  normalized_url: 'http://www.libertytimes.com.tw/2013/new/dec/30/today-taipei1.htm',
  normalized_id: 'www.libertytimes.com.tw/new/2013/dec/30/taipei1' }
*/

url = 'http://www.ettoday.net/news/20131106/291629.htm';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://www.ettoday.net/news/20131106/291629.htm',
  normalized_url: 'http://www.ettoday.net/news/20131106/291629.htm',
  normalized_id: 'www.ettoday.net/news/291629' }
*/

url = 'http://tw.news.yahoo.com/敘利亞沙林原料-英廠商提供的-044631577.html';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://tw.news.yahoo.com/敘利亞沙林原料-英廠商提供的-044631577.html',
  normalized_url: 'http://tw.news.yahoo.com/敘利亞沙林原料-英廠商提供的-044631577.html',
  normalized_id: 'tw.news.yahoo.com/044631577' }
*/

url = 'https://www.facebook.com/photo.php?fbid=187340678125996&set=a.169476096579121.1073741830.100005501943040&type=1&theater';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'https://www.facebook.com/photo.php?fbid=187340678125996&set=a.169476096579121.1073741830.100005501943040&type=1&theater',
  normalized_url: 'https://www.facebook.com/photo.php?fbid=187340678125996',
  normalized_id: 'www.facebook.com/photo/187340678125996' }
*/
url = 'https://www.facebook.com/394896373929368/posts/552832544802416';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'https://www.facebook.com/394896373929368/posts/552832544802416',
  normalized_url: 'https://www.facebook.com/394896373929368/posts/552832544802416',
  normalized_id: 'www.facebook.com/posts/552832544802416' }
*/
url = 'https://www.facebook.com/permalink.php?story_fbid=691671064186291&id=100000302107473';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'https://www.facebook.com/permalink.php?story_fbid=691671064186291&id=100000302107473',
  normalized_url: 'https://www.facebook.com/permalink.php?story_fbid=691671064186291&id=100000302107473',
  normalized_id: 'www.facebook.com/permalink/691671064186291/100000302107473' }
*/

url = 'http://udn.com/NEWS/BREAKINGNEWS/BREAKINGNEWS1/民進黨立委杯葛-院會無議程-8395297.shtml';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://udn.com/NEWS/BREAKINGNEWS/BREAKINGNEWS1/民進黨立委杯葛-院會無議程-8395297.shtml',
  normalized_url: 'http://udn.com/NEWS/BREAKINGNEWS/BREAKINGNEWS1/8395297.shtml',
  normalized_id: 'udn.com/news/8395297' }
*/
url = 'http://forum.udn.com/forum/NewsLetter/NewsPreview?Encode=Big5&NewsID=8108263&ch=fb_share&R=346';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://forum.udn.com/forum/NewsLetter/NewsPreview?Encode=Big5&NewsID=8108263&ch=fb_share&R=346',
  normalized_url: 'http://forum.udn.com/forum/NewsLetter/NewsPreview?Encode=Big5&NewsID=8108263',
  normalized_id: 'udn.com/news/8108263' }
*/
url = 'http://www.udn.com/2013/10/31/NEWS/NATIONAL/NATS1/8263682.shtml?ch=fb_share';
console.log(URLNormalizer.query(url));
/*
{ query_url: 'http://www.udn.com/2013/10/31/NEWS/NATIONAL/NATS1/8263682.shtml?ch=fb_share',
  normalized_url: 'http://www.udn.com/2013/10/31/NEWS/NATIONAL/NATS1/8263682.shtml',
  normalized_id: 'udn.com/news/8263682' }
*/
