// Load dependencies
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var keys = require('./keys');

var dbox = require('dbox');

// Create Express object
var app = express();

// Configure Dropbox 
var DROPBOX_APP_KEY = keys.dropboxAppKey;
var DROPBOX_APP_SECRET = keys.dropboxAppSecret;
var dboxClient = dbox.app({ 'app_key' : DROPBOX_APP_KEY, 'app_secret' : DROPBOX_APP_SECRET});


app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

function requestToken(res) {
  dboxClient.requesttoken(function(status, reqToken) {
    console.log('reqToken: ' + reqToken);
    console.log('reqToken.oauth_token: ' + reqToken.oauth_token);
    console.log('reqToken.oauth_token_secret: ' + reqToken.oauth_token_secret);
    res.send(200, {
      'Set-Cookie' : ['oat=' + reqToken.oauth_token,
                      'oats=' + reqToken.oauth_token_secret]
      });
      res.send('<script>window.location="https://www.dropbox.com/1/oauth/authorize' +
                  '?oauth_token=' + reqToken.oauth_token +
                  '&oauth_callback="http://localhost:3000/authorized' + '";</script>');
        res.end();
  });
}

function accessToken(req, res) {
  console.log(req.cookies);
    var reqToken = {oauth_token : req.cookies.oat, oauth_token_secret : req.cookies.oats};
    dboxClient.accesstoken(reqToken, function(status, accessToken) {
        if (status == 401) {
            res.write("Sorry, Dropbox reported an error: " + JSON.stringify(accessToken));
        }
        else {
            var expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
            res.writeHead(302, {
                "Set-Cookie" : "uid=" + accessToken.uid + "; Expires=" + expiry.toUTCString(),
                "Location" : "/"
            });
        }
        res.end();
        console.log(accessToken);
        return accessToken;
    });
}

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  res.render('index', { user: req.user });
  console.log(req.cookies);
});

app.post('/', function(req, res) {
  var dboxUser = dboxClient.client(accessToken(req,res));
  dboxUser.put('testSave.txt', req.param('body'), function(error, stat) {
    if (error)
      return showError(error);
    console.log('Succesful save.');
  });
});

app.get('/account', function(req, res){
  res.render('account', { user: req.user });
});

app.get('/authorized', function(req, res) {
  accessToken(req, res);
  res.redirect('/');
});


app.get('/login', function(req, res){
  requestToken(res);
  res.render('login', { user: req.user });
});



app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

//app.get('/', routes.index);
//app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

