function getCookie(c_name)
{
var i,x,y,ARRcookies=document.cookie.split(";");
for (i=0;i<ARRcookies.length;i++)
{
  x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
  y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
  x=x.replace(/^\s+|\s+$/g,"");
  if (x==c_name)
    {
    return unescape(y);
    }
  }
}

// credit: http://stackoverflow.com/questions/4197591/parsing-url-hash-fragment-identifier-with-javascript
function getHashParams() {

    var hashParams = {};
    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.hash.substring(1);

    while (e = r.exec(q))
       hashParams[d(e[1])] = d(e[2]);

    return hashParams;
}

var client = new Dropbox.Client({
  key: "Nlo4FSFkSkA=|QpwDRe2cRVnNap3sKxLywfO8pM245+xXmQuWH2g5lQ==", 
  sandbox: true});
client.authDriver (new Dropbox.Drivers.Redirect({rememberUser: false, useQuery: false}));

client.authenticate({interactive: true}, function(error, client2) {
    });

var params = getHashParams();
//alert("is auth? " + client.isAuthenticated());

// looking at the query url
/*
if (params["uid"] != null && params["oauth_token"] != null)
{

	client.authenticate({interactive: true},function (e,c) {alert("c2 " + c.isAuthenticated());});
	alert("is auth2? " + client.isAuthenticated());
}
*/

/*
var uid = getCookie("oauth");
if (uid != null && uid != "")
	alert(uid);
else
	alert("no cookies");
*/


function login()
{

//client.authDriver(new Dropbox.Drivers.Popup({
  //  receiverUrl: "oauth_receiver.html"}));
//client.authorize();
  
  //window.app = new Checkbox client, '#app-ui'

client.authenticate({interactive: true}, function(error, client2) {
	alert(client.isAuthenticated());
   alert("hi");
    });

}
