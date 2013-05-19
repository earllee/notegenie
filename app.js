// Load dependencies
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var nodemailer = require("nodemailer");

try {
  var keys = require('./keys');
} catch(err){}

var MONGO_PASS = process.env.MONGO_PASS || keys.MONGO_PASS;
var GMAIL_PASS = process.env.GMAIL_PASS || keys.GMAIL_PASS;

mongoose.connect('mongodb://nodejitsu_earllee:' + MONGO_PASS + '@ds051977.mongolab.com:51977/nodejitsu_earllee_nodejitsudb9586039269');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {});
var userSchema = mongoose.Schema({ uid: String, email: String, name: String });
var User = mongoose.model('User', userSchema);



// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "notegenie.email@gmail.com",
        pass: GMAIL_PASS
    }
});

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
  app.use(express.static(path.join(__dirname, 'public')));
  app.use("/images", express.static(__dirname + '/images'));
  app.use(app.router);
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

app.post('/email', function(req, res){
  console.log("email rec'd");
  console.log(req.body);
  var theemail = unescape(req.body.email);
  var thetext = unescape(req.body.content);
  var thehtml = unescape(req.body.formatted);
  var thename = unescape(req.body.name);
  var thefilename = unescape(req.body.filename);

  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: thename + " " + theemail, // sender address
      to: theemail, // list of receivers
      subject: "[NoteGenie] " + thefilename, // Subject line
      text: thetext, // plaintext body
      html: thehtml // html body
  };

  // send mail with defined transport object
  smtpTransport.sendMail(mailOptions, function(error, response){
      if(error){
          console.log(error);
      } else {
          console.log("Message sent: " + response.message);
      }
      //smtpTransport.close(); // shut down the connection pool, no more messages
  });
  res.end();
});


app.get('*', function(req, res){
  res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

