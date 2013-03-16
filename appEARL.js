// Load dependencies
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var Dropbox = require('dropbox');
var keys = require('./keys');

// Create Express object
var app = express();

// Configure Dropbox 
var DROPBOX_APP_KEY = keys.dropboxAppKey;
var DROPBOX_APP_SECRET = keys.dropboxAppSecret;

var client = new Dropbox.Client({
  key: "Nlo4FSFkSkA=|QpwDRe2cRVnNap3sKxLywfO8pM245+xXmQuWH2g5lQ==", 
  sandbox: true});

client.authDriver(new Dropbox.Drivers.NodeServer(8191));

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


app.get('/', function(req, res){
  res.render('index', {loggedIn: false});
});

app.post('/', function(req, res) {
  console.log(req.cookies.oauth);
  console.log('client authenticated? ' + client.isAuthenticated());
  client = client.setCredentials(req.cookies.oauth);
  console.log('client authenticated? ' + client.isAuthenticated());
  client.getUserInfo(function(error, userInfo, object) {
    console.log('userInfo: ' + userInfo.name);
    console.log('object: ' + object);
  });
  client.writeFile('testSave.txt', req.param('body'), function(error, stat) {
    if (error)
      return showError(error);
    console.log('Succesful save.');
  });
  res.render('index');
  res.end();
});

// Account page displays client info
app.get('/account', function(req, res){
  client.getUserInfo(function(error, userInfo) {
    res.render('account', { user: userInfo});
  });
});

app.get('/auth/dropbox', function(req, res) {
  client.reset();
  client.authenticate(function(error, client) {
    console.log(client.credentials());
    res.cookie('oauth', client.credentials());
    client.getUserInfo(function(error, userInfo) {
      console.log("Hello, " + userInfo.name + "!");
    });
    client.reset();
    res.redirect('/');
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

