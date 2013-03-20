// Load dependencies
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');

try {
  var keys = require('./keys');
  var MONGO_PASS = keys.MONGO_PASS;
} catch(err){}

mongoose.connect('mongodb://nodejitsu_earllee:' + MONGO_PASS + '@ds051977.mongolab.com:51977/nodejitsu_earllee_nodejitsudb9586039269');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {});
var userSchema = mongoose.Schema({ uid: String, email: String, name: String });
var User = mongoose.model('User', userSchema);

// Create Express object
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.compress());
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use("/images", express.static(__dirname + '/images'));
});


app.get('/', function(req, res){
  res.render('index');
});

app.post('/', function(req, res){
  var user = new User(req.body);
  User.findOne({uid: user.uid}, function(err, isThereUser){
    if (!isThereUser) {
      user.save(function(err, user) {
        if (err)
          console.log(err);
      });
    }
  });
  res.end();
});

app.get('/show', function(req, res){
  User.find(function(err, users) {
    if (err)
      console.log(err);
    console.log(users);
  });
  res.end();
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

