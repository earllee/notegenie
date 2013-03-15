// Earl: This works with passport-dropbox. Authenticates properly. Have token,
// token secret, and a user, but don't know where to move next.

// Load dependencies
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var Dropbox = require('dropbox');
var passport = require('passport');
var DropboxStrategy = require('passport-dropbox').Strategy;
var keys = require('./keys');

// Create Express object
var app = express();

// Configure Dropbox 
var DROPBOX_APP_KEY = keys.dropboxAppKey;
var DROPBOX_APP_SECRET = keys.dropboxAppSecret;

var client = new Dropbox.Client({
  key: "Nlo4FSFkSkA=|QpwDRe2cRVnNap3sKxLywfO8pM245+xXmQuWH2g5lQ==", sandbox: true
});
client.authDriver(new Dropbox.Drivers.NodeServer(8191));
//client.authDriver(new Dropbox.Drivers.Popup({
//  receiverURL: 'http://127.0.0.1:3000/'}));
//client.authDriver(new Dropbox.Drivers.Redirect());
//client.authDriver(new Dropbox.Drivers.NodeServer(8191));

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
  res.render('index', { user: req.user });
});

app.get('/account', function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/dropbox
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Dropbox authentication will involve redirecting
//   the user to dropbox.com.  After authorization, Dropbox will redirect the user
//   back to this application at /auth/dropbox/callback
app.get('/auth/dropbox', function(req, res) {

client.authenticate(function(error, client) {
  client.writeFile("hello_world.txt", "Hello, world!\n", function(error, stat) {
    if (error) {
        return showError(error);  // Something went wrong.
        }
      
        alert("File saved as revision " + stat.revisionTag);
      });
  client.getUserInfo(function(error, userInfo) {
        console.log("Hello, " + userInfo.name + "!");
      });
    });
  });

// GET /auth/dropbox/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.


//app.get('/', routes.index);
//app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

