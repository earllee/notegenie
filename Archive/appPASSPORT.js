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

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new DropboxStrategy({
    consumerKey: DROPBOX_APP_KEY,
    consumerSecret: DROPBOX_APP_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/dropbox/callback"
  },
  function(token, tokenSecret, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Dropbox profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Dropbox account with a user record in your database,
      // and return that user instead.
      console.log('token: ' + token);
      console.log('token secret: ' + tokenSecret);
      console.log('using dropbox strat: ' + profile.emails[0].value);
      return done(null, profile, token, tokenSecret);
    });
  }
));

//var client = new Dropbox.client({
//  key: "Nlo4FSFkSkA=|QpwDRe2cRVnNap3sKxLywfO8pM245+xXmQuWH2g5lQ==", sandbox: true
//});

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
  app.use(express.session({ secret: 'keyboard cat' }));  //?
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
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
app.get('/auth/dropbox',
  passport.authenticate('dropbox'),
  function(req, res){
    // The request will be redirected to Dropbox for authentication, so this
    // function will not be called.
  });

// GET /auth/dropbox/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/dropbox/callback', 
  passport.authenticate('dropbox', { failureRedirect: '/login' }),
  function(req, res) {
    console.log(req);
    console.log('callback on /auth/dropbox/: ' +req.user.displayName);
    res.redirect('/');
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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
  }
