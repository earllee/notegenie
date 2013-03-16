// Load dependencies
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var Dropbox = require('dropbox');
var keys = require('./keys');
var cookie = require('cookies');

// Create Express object
var app = express();

// Configure Dropbox 
var DROPBOX_APP_KEY = keys.dropboxAppKey;
var DROPBOX_APP_SECRET = keys.dropboxAppSecret;

var client = new Dropbox.Client({
  key: "Nlo4FSFkSkA=|QpwDRe2cRVnNap3sKxLywfO8pM245+xXmQuWH2g5lQ==", 
  sandbox: true});

client.authDriver(new Dropbox.Drivers.NodeServer(8191));

/*var client = new Dropbox.Client({
  key: "Nlo4FSFkSkA=|QpwDRe2cRVnNap3sKxLywfO8pM245+xXmQuWH2g5lQ==", 
  sandbox: true});
*/
//client.authDriver(new Dropbox.Drivers.NodeServer(8191));
//client.authDriver(new Dropbox.Drivers.Redirect(true, false));

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
	console.log(req.cookies);
  res.render('index');
});


app.post('/', function(req, res) {
	console.log(req.cookies.token);
	console.log(req.cookies.tokenSecret);
	if (! req.cookies.token || ! req.cookies.tokenSecret)
		return;
var client = new Dropbox.Client({
  key: "Nlo4FSFkSkA=|QpwDRe2cRVnNap3sKxLywfO8pM245+xXmQuWH2g5lQ==", 
  sandbox: true, token: req.cookies.token, tokenSecret: req.cookies.tokenSecret});	
	
  client.writeFile('testSave.txt', req.param('body'), function(error, stat) {
    if (error)
      return showError(error);
    console.log('Succesful save.');
  });
	res.render('index');	// how to avoid this line?
});

// Account page displays client info
app.get('/account', function(req, res){
  client.getUserInfo(function(error, userInfo) {
    res.render('account', { user: userInfo});
  });
});

app.get('/auth/dropbox', function(req, res) {
  client.reset();		//concurrency issues? how to lock client?
  client.authenticate(function(error, client) {
console.log("token?");
	console.log(client.credentials());
	console.log(client.credentials().token);
	console.log(client.credentials().tokenSecret);
	console.log(client.credentials().uid);
	res.cookie("token", client.credentials().token);
	res.cookie("tokenSecret", client.credentials().tokenSecret);
	res.cookie("uid", client.credentials().uid);
    client.writeFile("hello_world.txt", "Hello, world!\n", 
    function(error, stat) {
      if (error)
        return showError(error); 
      console.log("File saved as revision " + stat.revisionTag);
    });
    client.getUserInfo(function(error, userInfo) {
      console.log("Hello, " + userInfo.name + "!");
    });
    res.redirect('/');
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

